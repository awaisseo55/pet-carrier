import "server-only";
import type { SiteSettings } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";

export async function getSettings(): Promise<SiteSettings> {
  return readJsonFile<SiteSettings>("settings.json");
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await writeJsonFile("settings.json", settings);
}
