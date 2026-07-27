import "server-only";
import type { HomepageSettings } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";

export async function getHomepageSettings(): Promise<HomepageSettings> {
  return readJsonFile<HomepageSettings>("homepage.json");
}

export async function saveHomepageSettings(settings: HomepageSettings): Promise<void> {
  await writeJsonFile("homepage.json", settings);
}
