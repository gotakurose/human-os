import "server-only";
import path from "path";
import fs from "fs";
import {
  BusinessSkillsV2RoutingSchema,
  BusinessSkillsV2ResultCopySchema,
  BusinessSkillsV2NumericRulesSchema,
  BusinessSkillsV2RepresentativeTestsSchema,
  type BusinessSkillsV2Routing,
  type BusinessSkillsV2ResultCopy,
  type BusinessSkillsV2NumericRules,
  type BusinessSkillsV2RepresentativeTests,
} from "@/schemas/business-skills-v2";

const V2_DATA_ROOT = path.join(
  process.cwd(),
  "data",
  "diagnoses",
  "business-skills",
  "v2",
);

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    const name = path.basename(filePath);
    throw new Error(`Failed to read ${name}: ${String(err)}`);
  }
}

export function loadBusinessSkillsV2Routing(): BusinessSkillsV2Routing {
  const file = path.join(V2_DATA_ROOT, "routing.json");
  return BusinessSkillsV2RoutingSchema.parse(readJson(file));
}

export function loadBusinessSkillsV2ResultCopy(): BusinessSkillsV2ResultCopy {
  const file = path.join(V2_DATA_ROOT, "result-copy.json");
  return BusinessSkillsV2ResultCopySchema.parse(readJson(file));
}

export function loadBusinessSkillsV2NumericRules(): BusinessSkillsV2NumericRules {
  const file = path.join(V2_DATA_ROOT, "numeric-rules.json");
  return BusinessSkillsV2NumericRulesSchema.parse(readJson(file));
}

export function loadBusinessSkillsV2RepresentativeTests(): BusinessSkillsV2RepresentativeTests {
  const file = path.join(V2_DATA_ROOT, "representative-tests.json");
  return BusinessSkillsV2RepresentativeTestsSchema.parse(readJson(file));
}
