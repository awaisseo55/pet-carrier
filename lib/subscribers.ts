import "server-only";
import { nanoid } from "nanoid";
import type { Subscriber, SubscriberSource } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const subscribers = await readJsonFile<Subscriber[]>("subscribers.json");
  return [...subscribers].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Adds a subscriber if the email isn't already stored (case-insensitive), otherwise a no-op. */
export async function addSubscriber(email: string, source: SubscriberSource): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const subscribers = await readJsonFile<Subscriber[]>("subscribers.json");

  if (subscribers.some((s) => s.email === normalized)) return;

  subscribers.push({
    id: nanoid(),
    email: normalized,
    source,
    created_at: new Date().toISOString(),
  });
  await writeJsonFile("subscribers.json", subscribers);
}
