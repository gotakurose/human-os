/**
 * Business Skills V2 — routing engine QA
 * Run: npx tsx scripts/test-business-skills-v2-routing.ts
 */

import fs from "fs";
import path from "path";
import assert from "node:assert/strict";

import { selectBusinessSkillsV2Route } from "@/engine/business-skills-v2-selector";
import { calculateStyleAxisScores, resolveStyleAxisType } from "@/engine/style-axis-scorer";
import { calculateAbilityUScores } from "@/engine/ability-scorer";
import {
  BusinessSkillsV2RoutingSchema,
  BusinessSkillsV2RepresentativeTestsSchema,
} from "@/schemas/business-skills-v2";
import type { BusinessSkillsV2Routing } from "@/schemas/business-skills-v2";
import type { BusinessSkillsV2Answers, BusinessSkillsV2Choice } from "@/engine/business-skills-v2-selector";
import {
  StyleAxisQuestionsSchema,
  TypesSchema,
  ScoringSchema,
  AbilityScoringSchema,
} from "@/schemas/diagnosis";

const V2 = path.join(process.cwd(), "data/diagnoses/business-skills/v2");
const BS = path.join(process.cwd(), "data/diagnoses/business-skills");

function readJson(dir: string, name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf-8"));
}

// ── Load data ────────────────────────────────────────────────────────────────

const routing = BusinessSkillsV2RoutingSchema.parse(readJson(V2, "routing.json"));
const repTests = BusinessSkillsV2RepresentativeTestsSchema.parse(readJson(V2, "representative-tests.json"));

const questions = StyleAxisQuestionsSchema.parse(readJson(BS, "questions.json"));
const types = TypesSchema.parse(readJson(BS, "types.json"));
const scoring = ScoringSchema.parse(readJson(BS, "scoring.json"));
const abilityScoring = AbilityScoringSchema.parse(readJson(BS, "ability-scoring.json"));

const maxScorePerAxis = scoring.maxScorePerAxis ?? 20;
const fallback = scoring.fallback;
const contributions = abilityScoring.contributions;

const ALL_CHOICES = ["strongly_a", "lean_a", "lean_b", "strongly_b"] as const;
const EPSILON = 1e-9;

// ── Mutate routing without touching original ──────────────────────────────────

function withExcludedEvidence(
  r: BusinessSkillsV2Routing,
  typeId: string,
  subRouteId: string,
  evidenceIndex: number,
): BusinessSkillsV2Routing {
  return {
    ...r,
    types: r.types.map((t) => {
      if (t.typeId !== typeId) return t;
      return {
        ...t,
        routes: t.routes.map((rt) => {
          if (rt.subRouteId !== subRouteId) return rt;
          return {
            ...rt,
            evidence: rt.evidence.filter((_, i) => i !== evidenceIndex),
          };
        }),
      };
    }),
  };
}

// ── Tracking ─────────────────────────────────────────────────────────────────

let failed = false;

function fail(msg: string): void {
  failed = true;
  process.exitCode = 1;
  console.error(msg);
}

// ── 1. Representative tests ───────────────────────────────────────────────────

let repTypeIdPass = 0;
let repMainPass = 0;
let repSubPass = 0;
let repDetPass = 0;
let repMinGap = Infinity;

for (const tc of repTests.cases) {
  const axisScores = calculateStyleAxisScores(tc.answers, questions, maxScorePerAxis);
  const typeId = resolveStyleAxisType(axisScores, types, fallback);
  const abilityU = calculateAbilityUScores(tc.answers, contributions);

  if (typeId !== tc.typeId) {
    fail(`FAIL typeId ${tc.caseId}: expected ${tc.typeId} got ${typeId}`);
    continue;
  }
  repTypeIdPass++;

  const results: ReturnType<typeof selectBusinessSkillsV2Route>[] = [];
  for (let run = 0; run < 3; run++) {
    results.push(
      selectBusinessSkillsV2Route({
        answers: tc.answers,
        typeId,
        styleAxisScores: axisScores,
        abilityUScores: abilityU,
        routing,
      }),
    );
  }

  const r0 = results[0];
  const r1 = results[1];
  const r2 = results[2];

  const deterministic =
    r0.subRouteId === r1.subRouteId &&
    r0.subRouteId === r2.subRouteId &&
    Math.abs(r0.gap - r1.gap) < EPSILON &&
    Math.abs(r0.gap - r2.gap) < EPSILON;
  if (deterministic) repDetPass++;
  else fail(`FAIL deterministic ${tc.caseId}`);

  if (r0.mainRouteId === tc.mainRouteId) repMainPass++;
  else fail(`FAIL mainRouteId ${tc.caseId}: expected ${tc.mainRouteId} got ${r0.mainRouteId}`);

  if (r0.subRouteId === tc.subRouteId) repSubPass++;
  else fail(`FAIL subRouteId ${tc.caseId}: expected ${tc.subRouteId} got ${r0.subRouteId}`);

  assert(!Number.isNaN(r0.gap) && Number.isFinite(r0.gap), `${tc.caseId} gap is NaN or Infinity`);
  assert(!Number.isNaN(r0.winner.total) && Number.isFinite(r0.winner.total), `${tc.caseId} total NaN`);
  assert(r0.winner.total >= 0 && r0.winner.total <= 1, `${tc.caseId} total out of [0,1]: ${r0.winner.total}`);
  assert(r0.winner.evidence >= 0 && r0.winner.evidence <= 1, `${tc.caseId} evidence out of [0,1]`);
  assert(r0.winner.abilities >= 0 && r0.winner.abilities <= 1, `${tc.caseId} abilities out of [0,1]`);
  assert(r0.winner.axes >= 0 && r0.winner.axes <= 1, `${tc.caseId} axes out of [0,1]`);

  if (r0.gap < repMinGap) repMinGap = r0.gap;
}

assert.equal(repTypeIdPass, 163, `Representative typeId: ${repTypeIdPass}/163`);
assert.equal(repMainPass, 163, `Representative mainRouteId: ${repMainPass}/163`);
assert.equal(repSubPass, 163, `Representative subRouteId: ${repSubPass}/163`);
assert.equal(repDetPass, 163, `Deterministic: ${repDetPass}/163`);
assert(repMinGap >= 0.0624 - EPSILON, `Min representative gap ${repMinGap} < 0.0624`);

// ── 2. One-answer-change test ─────────────────────────────────────────────────

interface CaseStats {
  typeRetained: number;
  subRouteRetained: number;
}
const perCaseStats = new Map<string, CaseStats>();
let totalMutations = 0;
let globalMinRetention = 1;
let globalMinCase = "";

for (const tc of repTests.cases) {
  const questionIds = Object.keys(tc.answers);
  let typeRetained = 0;
  let subRouteRetained = 0;

  for (const qId of questionIds) {
    const orig = tc.answers[qId];
    for (const alt of ALL_CHOICES) {
      if (alt === orig) continue;
      totalMutations++;

      const mutated = { ...tc.answers } as BusinessSkillsV2Answers;
      mutated[qId] = alt as BusinessSkillsV2Choice;
      const mutAxisScores = calculateStyleAxisScores(mutated, questions, maxScorePerAxis);
      const mutTypeId = resolveStyleAxisType(mutAxisScores, types, fallback);

      if (mutTypeId !== tc.typeId) continue;
      typeRetained++;

      const mutAbilityU = calculateAbilityUScores(mutated, contributions);
      const result = selectBusinessSkillsV2Route({
        answers: mutated,
        typeId: mutTypeId,
        styleAxisScores: mutAxisScores,
        abilityUScores: mutAbilityU,
        routing,
      });

      if (result.subRouteId === tc.subRouteId) subRouteRetained++;
    }
  }

  const stats: CaseStats = { typeRetained, subRouteRetained };
  perCaseStats.set(tc.caseId, stats);

  if (typeRetained > 0) {
    const rate = subRouteRetained / typeRetained;
    if (rate < globalMinRetention) {
      globalMinRetention = rate;
      globalMinCase = tc.caseId;
    }
  }
}

assert.equal(totalMutations, 19560, `Total mutations ${totalMutations} != 19560`);
assert(globalMinRetention >= 0.85 - EPSILON, `Min retention ${globalMinRetention} < 0.85 (case: ${globalMinCase})`);

const s032 = perCaseStats.get("representative-032");
assert(s032 !== undefined, "representative-032 not found");
assert.equal(s032.typeRetained, 120, `representative-032 typeRetained ${s032.typeRetained} != 120`);
assert.equal(s032.subRouteRetained, 102, `representative-032 subRouteRetained ${s032.subRouteRetained} != 102`);
assert(Math.abs(s032.subRouteRetained / s032.typeRetained - 0.85) < EPSILON, "representative-032 rate != 0.85");

const s025 = perCaseStats.get("representative-025");
assert(s025 !== undefined, "representative-025 not found");
assert.equal(s025.subRouteRetained, 105, `representative-025 subRouteRetained ${s025.subRouteRetained} != 105`);
assert(Math.abs(s025.subRouteRetained / s025.typeRetained - 0.875) < EPSILON, "representative-025 rate != 0.875");

const s050 = perCaseStats.get("representative-050");
assert(s050 !== undefined, "representative-050 not found");
assert.equal(s050.subRouteRetained, 116, `representative-050 subRouteRetained ${s050.subRouteRetained} != 116`);
assert(Math.abs(s050.subRouteRetained / s050.typeRetained - (116 / 120)) < EPSILON, "representative-050 rate mismatch");

// ── 3. Leave-one-evidence test ────────────────────────────────────────────────

// Verify original routing is not mutated before the test
const routingEvidenceCountBefore = routing.types.reduce(
  (sum, t) => sum + t.routes.reduce((s, r) => s + r.evidence.length, 0),
  0,
);

let loePass = 0;
let loeTotal = 0;
let loeMinGap = Infinity;
let loeMinCase = "";
let loeMinQ = "";

for (const tc of repTests.cases) {
  const typeEntry = routing.types.find((t) => t.typeId === tc.typeId);
  if (!typeEntry) { fail(`LOE: unknown typeId ${tc.typeId} in ${tc.caseId}`); continue; }
  const route = typeEntry.routes.find((r) => r.subRouteId === tc.subRouteId);
  if (!route) { fail(`LOE: unknown subRouteId ${tc.subRouteId} in ${tc.caseId}`); continue; }

  const axisScores = calculateStyleAxisScores(tc.answers, questions, maxScorePerAxis);
  const abilityU = calculateAbilityUScores(tc.answers, contributions);

  for (let i = 0; i < route.evidence.length; i++) {
    loeTotal++;
    const qId = route.evidence[i].questionId;
    const modRouting = withExcludedEvidence(routing, tc.typeId, tc.subRouteId, i);

    let result: ReturnType<typeof selectBusinessSkillsV2Route>;
    try {
      result = selectBusinessSkillsV2Route({
        answers: tc.answers,
        typeId: tc.typeId,
        styleAxisScores: axisScores,
        abilityUScores: abilityU,
        routing: modRouting,
      });
    } catch (e) {
      fail(`LOE ERROR ${tc.caseId} excl=${qId}: ${e}`);
      continue;
    }

    if (result.subRouteId !== tc.subRouteId) {
      fail(`LOE FAIL ${tc.caseId} excl=${qId}: expected ${tc.subRouteId} got ${result.subRouteId}`);
      continue;
    }

    loePass++;
    if (result.gap < loeMinGap) {
      loeMinGap = result.gap;
      loeMinCase = tc.caseId;
      loeMinQ = qId;
    }
  }
}

// Verify original routing was not mutated
const routingEvidenceCountAfter = routing.types.reduce(
  (sum, t) => sum + t.routes.reduce((s, r) => s + r.evidence.length, 0),
  0,
);
assert.equal(routingEvidenceCountAfter, routingEvidenceCountBefore, "Original routing was mutated during LOE test");

assert.equal(loeTotal, 1514, `LOE total ${loeTotal} != 1514`);
assert.equal(loePass, 1514, `LOE pass ${loePass}/1514`);
assert(loeMinGap >= 0.0295 - EPSILON, `LOE min gap ${loeMinGap} < 0.0295 (${loeMinCase}/${loeMinQ})`);

// ── Output ────────────────────────────────────────────────────────────────────

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Business Skills V2 routing tests: PASS");
  console.log(`Representative typeId: 163 / 163`);
  console.log(`Representative mainRouteId: 163 / 163`);
  console.log(`Representative subRouteId: 163 / 163`);
  console.log(`Deterministic cases: 163 / 163`);
  console.log(`Minimum representative gap: ${repMinGap}`);
  console.log(`One-answer mutations: ${totalMutations}`);
  console.log(`Minimum route retention: ${globalMinRetention}`);
  console.log(`Minimum retention case: ${globalMinCase}`);
  console.log(`Leave-one-evidence: ${loePass} / ${loeTotal}`);
  console.log(`Minimum leave-one-evidence gap: ${loeMinGap}`);
  console.log(`Minimum leave-one-evidence case: ${loeMinCase} / ${loeMinQ}`);
}
