import "server-only";

export function isBusinessSkillsV2Enabled(): boolean {
  return process.env["BUSINESS_SKILLS_RESULTS_V2"] === "1";
}
