import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { Coupon } from "./types";

const COUPONS_FILE = path.join(process.cwd(), "data", "coupons.json");

export async function getAllCoupons(): Promise<Coupon[]> {
  const raw = await fs.readFile(COUPONS_FILE, "utf-8");
  return JSON.parse(raw) as Coupon[];
}

async function saveAllCoupons(coupons: Coupon[]): Promise<void> {
  await fs.writeFile(COUPONS_FILE, JSON.stringify(coupons, null, 2), "utf-8");
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const coupons = await getAllCoupons();
  return coupons.find((c) => c.code.toLowerCase() === code.toLowerCase());
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discountAmount?: number;
  coupon?: Coupon;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);

  if (!coupon) return { valid: false, error: "That code isn't recognised." };
  if (!coupon.is_active) return { valid: false, error: "That code is no longer active." };

  const now = new Date();
  if (now < new Date(coupon.valid_from)) return { valid: false, error: "That code isn't active yet." };
  if (now > new Date(coupon.valid_until)) return { valid: false, error: "That code has expired." };
  if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: "That code has reached its usage limit." };
  }
  if (subtotal < coupon.min_order_value) {
    return {
      valid: false,
      error: `Spend at least £${coupon.min_order_value.toFixed(2)} to use this code.`,
    };
  }

  const discountAmount =
    coupon.type === "percentage"
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);

  return { valid: true, discountAmount, coupon };
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const coupons = await getAllCoupons();
  const coupon = coupons.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (coupon) {
    coupon.usage_count += 1;
    await saveAllCoupons(coupons);
  }
}

export async function createCoupon(input: Omit<Coupon, "id" | "usage_count" | "created_at">): Promise<Coupon> {
  const coupons = await getAllCoupons();
  const coupon: Coupon = {
    ...input,
    id: nanoid(10),
    usage_count: 0,
    created_at: new Date().toISOString(),
  };
  coupons.push(coupon);
  await saveAllCoupons(coupons);
  return coupon;
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
  const coupons = await getAllCoupons();
  const index = coupons.findIndex((c) => c.id === id);
  if (index === -1) return null;
  coupons[index] = { ...coupons[index], ...updates };
  await saveAllCoupons(coupons);
  return coupons[index];
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupons = await getAllCoupons();
  await saveAllCoupons(coupons.filter((c) => c.id !== id));
}
