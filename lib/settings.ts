import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { SiteSettings } from "./types";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

export async function getSettings(): Promise<SiteSettings> {
  const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
  return JSON.parse(raw) as SiteSettings;
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}
