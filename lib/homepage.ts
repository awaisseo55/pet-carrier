import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { HomepageSettings } from "./types";

const HOMEPAGE_FILE = path.join(process.cwd(), "data", "homepage.json");

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const raw = await fs.readFile(HOMEPAGE_FILE, "utf-8");
  return JSON.parse(raw) as HomepageSettings;
}

export async function saveHomepageSettings(settings: HomepageSettings): Promise<void> {
  await fs.writeFile(HOMEPAGE_FILE, JSON.stringify(settings, null, 2), "utf-8");
}
