import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { verifySignedValue } from "./auth";
import { readJsonFile, writeJsonFile } from "./data-store";

export interface Customer {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = scryptSync(password, salt, 64);
  if (hashBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, suppliedBuffer);
}

async function getAllCustomers(): Promise<Customer[]> {
  return readJsonFile<Customer[]>("customers.json");
}

async function saveAllCustomers(customers: Customer[]): Promise<void> {
  await writeJsonFile("customers.json", customers);
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const customers = await getAllCustomers();
  return customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
}

export type CustomerSummary = Omit<Customer, "password_hash">;

/** Admin-facing list, newest first, with the password hash stripped. */
export async function getAllCustomersForAdmin(): Promise<CustomerSummary[]> {
  const customers = await getAllCustomers();
  return customers
    .map(({ password_hash: _password_hash, ...rest }) => rest)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function createCustomer(name: string, email: string, password: string): Promise<Customer> {
  const customers = await getAllCustomers();
  const customer: Customer = {
    id: nanoid(10),
    name,
    email,
    password_hash: hashPassword(password),
    created_at: new Date().toISOString(),
  };
  customers.push(customer);
  await saveAllCustomers(customers);
  return customer;
}

export async function verifyCustomerLogin(email: string, password: string): Promise<Customer | null> {
  const customer = await getCustomerByEmail(email);
  if (!customer) return null;
  return verifyPassword(password, customer.password_hash) ? customer : null;
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const cookieStore = await cookies();
  const email = verifySignedValue(cookieStore.get("pc_session")?.value);
  if (!email) return null;
  const customer = await getCustomerByEmail(email);
  return customer || null;
}
