import "server-only";
import { getActiveProducts } from "./products";
import { getSettings } from "./settings";
import { isCodEnabled } from "./feature-flags";
import { HOMEPAGE_FAQS } from "./homepage-faqs";
import { formatPrice } from "./utils";
import type { Product } from "./types";

/**
 * Free, no-API-call chatbot used while ANTHROPIC_API_KEY is unset (see
 * app/api/chat/route.ts). Answers a fixed set of important topics (order
 * tracking, shipping, returns, discounts, product search, contact) by
 * keyword-matching the customer's message against the same live product
 * catalogue and policy data the Claude-powered version uses, so switching
 * the API key on later doesn't change what data either version knows
 * about, only how flexibly it can talk about it. See the "Customer chat
 * widget" section of CLAUDE.md.
 */

export interface QuickTopic {
  id: string;
  label: string;
}

export const QUICK_TOPICS: QuickTopic[] = [
  { id: "track", label: "Track my order" },
  { id: "shipping", label: "Shipping & delivery" },
  { id: "returns", label: "Returns policy" },
  { id: "find-product", label: "Find a product" },
  { id: "discount", label: "Discount codes" },
  { id: "contact", label: "Talk to a human" },
];

const ANIMAL_KEYWORDS: Record<string, RegExp> = {
  dog: /\bdogs?\b|\bpupp(y|ies)\b/,
  cat: /\bcats?\b|\bkitten/,
  rabbit: /\brabbits?\b|\bbunn(y|ies)\b/,
  "guinea pig": /guinea\s?pigs?/,
  hamster: /\bhamsters?\b/,
  bird: /\bbirds?\b|\bparrots?\b|budgie/,
};

const TYPE_KEYWORDS: Record<string, RegExp> = {
  carrier: /\bcarriers?\b/,
  sling: /\bslings?\b/,
  backpack: /\bbackpacks?\b/,
  crate: /\bcrates?\b/,
  "car seat": /car\s?seat|booster/,
  stroller: /\bstrollers?\b/,
  bed: /\bbeds?\b/,
  trolley: /\btrolley\b/,
};

function parseMaxPrice(text: string): number | undefined {
  const match = text.match(/(?:under|below|less than|up to|max(?:imum)?)\D{0,4}£?\s?(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : undefined;
}

function findMatchingProducts(text: string, products: Product[]): Product[] {
  const lower = text.toLowerCase();
  const maxPrice = parseMaxPrice(lower);

  const matchedAnimal = Object.entries(ANIMAL_KEYWORDS).find(([, re]) => re.test(lower))?.[0];
  const matchedType = Object.entries(TYPE_KEYWORDS).find(([, re]) => re.test(lower))?.[0];

  if (!matchedAnimal && !matchedType && maxPrice === undefined) return [];

  return products
    .filter((p) => {
      const haystack = `${p.title} ${p.short_description || ""}`.toLowerCase();
      if (matchedAnimal && !haystack.includes(matchedAnimal)) return false;
      if (matchedType && !haystack.includes(matchedType)) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      return true;
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);
}

function scoreFaqMatch(text: string, question: string): number {
  const words = text.toLowerCase().match(/[a-z]{4,}/g) || [];
  const questionLower = question.toLowerCase();
  return words.filter((w) => questionLower.includes(w)).length;
}

export async function getRuleBasedReply(message: string): Promise<string> {
  const text = message.toLowerCase().trim();
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);

  if (/\btrack|where.{0,15}(my\s)?order|order\s?status|has.{0,10}order.{0,10}(shipped|dispatched)/.test(text)) {
    return `You can track your order at [Track your order](/track-order), just enter your order number and the email address you checked out with. If that page can't help, reach us at ${settings.contact_email}.`;
  }

  if (/\bship|deliver|postage|how long.{0,15}(arrive|take)|dispatch/.test(text)) {
    const codLine = isCodEnabled()
      ? " Cash on delivery is available at checkout too."
      : " We only take card payment at checkout, there's no cash on delivery option.";
    return `We deliver across the UK only. Standard delivery is 2 to 3 working days, ${formatPrice(settings.standard_shipping_cost)} (free over ${formatPrice(settings.free_shipping_threshold)}).${codLine}`;
  }

  if (/\breturn|refund|exchange|send.{0,10}back|isn'?t right|doesn'?t fit/.test(text)) {
    const faq = HOMEPAGE_FAQS.find((f) => /right for my pet/i.test(f.question));
    return `${faq?.answer || "You can return most unused items within 14 days of delivery for a refund."} Full details at [Returns](/returns).`;
  }

  if (/\bdiscount|coupon|promo|code\b|\boff\b.{0,10}(first|order)/.test(text)) {
    return "New customers can use code WELCOME5 at checkout for 5% off their first order.";
  }

  if (/\bhuman|real person|agent|speak to|talk to|contact|phone|email address/.test(text)) {
    return `Of course, you can reach us at ${settings.contact_email} or via the [Contact page](/contact) and a real person will get back to you.`;
  }

  const productMatches = findMatchingProducts(text, products);
  if (productMatches.length > 0) {
    const lines = productMatches.map((p) => `- [${p.title}](/product/${p.slug}), ${formatPrice(p.price)}`);
    return `Here's what I found:\n\n${lines.join("\n")}`;
  }

  const faqScores = HOMEPAGE_FAQS.map((f) => ({ f, score: scoreFaqMatch(text, f.question) })).sort(
    (a, b) => b.score - a.score
  );
  if (faqScores[0] && faqScores[0].score >= 2) {
    return faqScores[0].f.answer;
  }

  return `I'm not able to answer that specific question yet, but I can help with order tracking, shipping, returns, discount codes or finding a product. You're welcome to browse [Carriers](/carriers), [Strollers](/strollers) or [Beds](/beds), or reach us directly at ${settings.contact_email} / the [Contact page](/contact).`;
}
