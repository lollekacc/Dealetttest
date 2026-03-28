import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const plansFilePath = path.resolve(__dirname, "../data/plans.json");

let cachedPlans = null;

export async function getPlans() {
  if (cachedPlans) return cachedPlans;

  const fileContent = await fs.readFile(plansFilePath, "utf8");
  cachedPlans = JSON.parse(fileContent);
  return cachedPlans;
}
