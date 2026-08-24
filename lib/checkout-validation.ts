import "server-only";
import { CheckoutValidationError } from "./checkout-calculation";

/**
 * Shared customer/address validation for both the Stripe and cash-on-delivery
 * checkout routes, so field length limits and format checks can't drift
 * between the two flows. Throws CheckoutValidationError with a message
 * that's safe to show the customer directly.
 */

// A deliberately permissive UK postcode pattern (covers standard formats
// without being so strict it rejects genuine edge-case postcodes).
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new CheckoutValidationError(`Please provide your ${field}.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new CheckoutValidationError(`Your ${field} is too long.`);
  }
  return trimmed;
}

function optionalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new CheckoutValidationError("One of the fields you entered is too long.");
  }
  return trimmed;
}

export interface RawCustomerInput {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
}

export interface ValidatedCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export function validateCustomer(input: RawCustomerInput, opts: { requirePhone: boolean }): ValidatedCustomer {
  const firstName = requireString(input.firstName, "first name", 100);
  const lastName = requireString(input.lastName, "last name", 100);
  const email = requireString(input.email, "email address", 200);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutValidationError("Please provide a valid email address.");
  }

  const phone = opts.requirePhone
    ? requireString(input.phone, "phone number", 30)
    : optionalString(input.phone, 30);

  if (phone && !/^[0-9+()\s-]{5,30}$/.test(phone)) {
    throw new CheckoutValidationError("Please provide a valid phone number.");
  }

  return { firstName, lastName, email: email.toLowerCase(), phone };
}

export interface RawAddressInput {
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  county?: unknown;
  postcode?: unknown;
  country?: unknown;
  instructions?: unknown;
}

export interface ValidatedAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  instructions?: string;
}

export function validateAddress(input: RawAddressInput, opts: { ukOnly: boolean }): ValidatedAddress {
  const line1 = requireString(input.line1, "address line 1", 200);
  const line2 = optionalString(input.line2, 200);
  const city = requireString(input.city, "town or city", 100);
  const county = optionalString(input.county, 100);
  const postcodeRaw = requireString(input.postcode, "postcode", 12);
  const country = requireString(input.country, "country", 2).toUpperCase();
  const instructions = optionalString(input.instructions, 500);

  if (opts.ukOnly) {
    if (country !== "GB") {
      throw new CheckoutValidationError("Cash on delivery is only available for UK delivery addresses.");
    }
    if (!UK_POSTCODE_RE.test(postcodeRaw)) {
      throw new CheckoutValidationError("Please provide a valid UK postcode.");
    }
  }

  return {
    line1,
    line2,
    city,
    county,
    postcode: postcodeRaw.toUpperCase(),
    country,
    instructions,
  };
}
