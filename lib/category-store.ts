import "server-only";
import { CATEGORIES, type CategoryNode } from "./categories";
import type { CategoryOverride } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";
import {
  getFaqs,
  getIntro,
  getMetaDescription,
  getMetaTitle,
  getSizingGuide,
  getWhyChoose,
} from "./category-content";

interface Store {
  overrides: Record<string, CategoryOverride>;
  custom: CategoryNode[];
  deleted: string[];
}

async function readStore(): Promise<Store> {
  return readJsonFile<Store>("category-content.json");
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile("category-content.json", store);
}

/** All categories: the built-in taxonomy plus any admin-added custom ones, minus any admin-deleted ones. */
export async function getAllCategoryNodes(): Promise<CategoryNode[]> {
  const store = await readStore();
  const deleted = new Set(store.deleted);
  return [...CATEGORIES, ...store.custom].filter((c) => !deleted.has(c.path));
}

export async function getCategoryNode(categoryPath: string): Promise<CategoryNode | undefined> {
  const all = await getAllCategoryNodes();
  return all.find((c) => c.path === categoryPath);
}

export async function getChildNodes(categoryPath: string): Promise<CategoryNode[]> {
  const all = await getAllCategoryNodes();
  return all.filter((c) => c.parentPath === categoryPath);
}

export async function getBreadcrumbNodes(categoryPath: string): Promise<CategoryNode[]> {
  const all = await getAllCategoryNodes();
  const byPath = new Map(all.map((c) => [c.path, c]));
  const trail: CategoryNode[] = [];
  let current = byPath.get(categoryPath);
  while (current) {
    trail.unshift(current);
    current = current.parentPath ? byPath.get(current.parentPath) : undefined;
  }
  return trail;
}

export async function getRelatedNodes(categoryPath: string, limit = 4): Promise<CategoryNode[]> {
  const all = await getAllCategoryNodes();
  const node = all.find((c) => c.path === categoryPath);
  if (!node) return [];

  if (node.parentPath) {
    const siblings = all.filter((c) => c.parentPath === node.parentPath && c.path !== categoryPath);
    if (siblings.length >= limit) return siblings.slice(0, limit);
    const parent = all.find((c) => c.path === node.parentPath);
    return parent ? [parent, ...siblings].slice(0, limit) : siblings.slice(0, limit);
  }

  return all.filter((c) => c.parentPath === categoryPath).slice(0, limit);
}

export interface ResolvedCategory {
  node: CategoryNode;
  name: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  whyChoose: string;
  sizingGuide: string;
  faqs: { question: string; answer: string }[];
  image?: string;
  featuredProductIds: string[];
}

export async function getResolvedCategory(categoryPath: string): Promise<ResolvedCategory | undefined> {
  const node = await getCategoryNode(categoryPath);
  if (!node) return undefined;

  const store = await readStore();
  const override = store.overrides[categoryPath];
  const effectiveNode: CategoryNode = override?.name ? { ...node, name: override.name } : node;

  return {
    node: effectiveNode,
    name: effectiveNode.name,
    metaTitle: override?.meta_title || getMetaTitle(effectiveNode),
    metaDescription: override?.meta_description || getMetaDescription(effectiveNode),
    intro: override?.intro || getIntro(effectiveNode),
    whyChoose: override?.why_choose || getWhyChoose(effectiveNode),
    sizingGuide: override?.sizing_guide || getSizingGuide(effectiveNode),
    faqs: override?.faqs && override.faqs.length > 0 ? override.faqs : getFaqs(effectiveNode),
    image: override?.image,
    featuredProductIds: override?.featured_product_ids || [],
  };
}

export async function saveCategoryOverride(
  categoryPath: string,
  updates: Partial<Omit<CategoryOverride, "path">>
): Promise<void> {
  const store = await readStore();
  store.overrides[categoryPath] = { ...store.overrides[categoryPath], path: categoryPath, ...updates };
  await writeStore(store);
}

export async function addCustomCategory(node: CategoryNode): Promise<void> {
  const store = await readStore();
  store.custom.push(node);
  await writeStore(store);
}

export async function deleteCategoryNode(categoryPath: string): Promise<void> {
  const store = await readStore();
  if (!store.deleted.includes(categoryPath)) {
    store.deleted.push(categoryPath);
  }
  await writeStore(store);
}
