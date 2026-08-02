/**
 * Business Skills V2 — static data validation
 * Run: npx tsx scripts/validate-business-skills-v2.ts
 */

import fs from "fs";
import path from "path";
import assert from "node:assert/strict";

import {
  BusinessSkillsV2RoutingSchema,
  BusinessSkillsV2ResultCopySchema,
  BusinessSkillsV2NumericRulesSchema,
  BusinessSkillsV2RepresentativeTestsSchema,
} from "@/schemas/business-skills-v2";
import type { BusinessSkillsV2ResultRoute } from "@/schemas/business-skills-v2";

const V2 = path.join(process.cwd(), "data/diagnoses/business-skills/v2");

function readJson(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(V2, name), "utf-8"));
}

function collectContentStrings(route: BusinessSkillsV2ResultRoute): string[] {
  const out: string[] = [];
  out.push(...route.currentYou.baseSentences);
  out.push(route.harshOneLiner);
  out.push(...route.workThinking.see);
  out.push(...route.workThinking.decide);
  out.push(...route.workThinking.move);
  out.push(...route.workThinking.land);
  for (const scene of route.strengthScenes) {
    out.push(scene.title);
    out.push(...scene.body);
  }
  out.push(...route.failureFlow);
  out.push(...route.perception.intent);
  out.push(...route.perception.external);
  out.push(...route.environment.fit);
  out.push(...route.environment.avoid);
  out.push(...route.roles);
  out.push(route.partner.typeName);
  out.push(...route.partner.body);
  out.push(...route.oneChange);
  out.push(route.share.typeLine);
  out.push(...route.share.bodyLines);
  return out;
}

try {
  // ── Parse all 4 files ────────────────────────────────────────────────────────
  const routing = BusinessSkillsV2RoutingSchema.parse(readJson("routing.json"));
  const resultCopy = BusinessSkillsV2ResultCopySchema.parse(readJson("result-copy.json"));
  const numericRules = BusinessSkillsV2NumericRulesSchema.parse(readJson("numeric-rules.json"));
  const repTests = BusinessSkillsV2RepresentativeTestsSchema.parse(readJson("representative-tests.json"));

  // ── Derived collections ──────────────────────────────────────────────────────
  const allTypeIds = routing.types.map((t) => t.typeId);
  const typeIdSet = new Set(allTypeIds);

  let subRouteCount = 0;
  let evidenceCount = 0;
  const mainRouteTypeMap = new Map<string, string>();
  const subRouteIdSeen = new Set<string>();
  const subRouteInfoMap = new Map<string, { typeId: string; mainRouteId: string }>();

  for (const t of routing.types) {
    for (const r of t.routes) {
      subRouteCount++;
      evidenceCount += r.evidence.length;

      const prevMain = mainRouteTypeMap.get(r.mainRouteId);
      if (prevMain !== undefined) {
        assert.equal(prevMain, t.typeId, `mainRouteId "${r.mainRouteId}" spans types "${prevMain}" and "${t.typeId}"`);
      } else {
        mainRouteTypeMap.set(r.mainRouteId, t.typeId);
      }

      assert(!subRouteIdSeen.has(r.subRouteId), `subRouteId duplicate: ${r.subRouteId}`);
      subRouteIdSeen.add(r.subRouteId);

      subRouteInfoMap.set(r.subRouteId, { typeId: t.typeId, mainRouteId: r.mainRouteId });
    }
  }

  const rcRoutes = resultCopy.types.flatMap((t) => t.routes);
  const allStrengthScenes = rcRoutes.flatMap((r) => r.strengthScenes);

  // ── Basic counts ─────────────────────────────────────────────────────────────
  assert.equal(routing.types.length, 16, "Types must be 16");
  assert.equal(mainRouteTypeMap.size, 65, "Main routes must be 65");
  assert.equal(subRouteCount, 163, "Sub routes must be 163");
  assert.equal(evidenceCount, 1514, "Evidence items must be 1514");
  assert.equal(rcRoutes.length, 163, "result-copy sub routes must be 163");
  assert.equal(numericRules.types.length, 16, "numeric-rules types must be 16");
  assert.equal(repTests.cases.length, 163, "representative cases must be 163");
  assert.equal(allStrengthScenes.length, 489, "Strength scenes must be 489");

  // ── Duplicates ────────────────────────────────────────────────────────────────
  // typeId
  const typeIdCount = new Map<string, number>();
  for (const id of allTypeIds) typeIdCount.set(id, (typeIdCount.get(id) ?? 0) + 1);
  for (const [id, n] of typeIdCount) assert.equal(n, 1, `typeId duplicate: ${id}`);

  // route × questionId within each route's evidence
  for (const t of routing.types) {
    for (const r of t.routes) {
      const qIds = r.evidence.map((e) => e.questionId);
      const qSet = new Set(qIds);
      assert.equal(qIds.length, qSet.size, `Duplicate questionId in evidence of ${r.subRouteId}`);
    }
  }

  // caseId
  const caseIdCount = new Map<string, number>();
  for (const c of repTests.cases) caseIdCount.set(c.caseId, (caseIdCount.get(c.caseId) ?? 0) + 1);
  for (const [id, n] of caseIdCount) assert.equal(n, 1, `caseId duplicate: ${id}`);

  // representative-tests subRouteId
  const repSubSeen = new Set<string>();
  for (const c of repTests.cases) {
    assert(!repSubSeen.has(c.subRouteId), `representative-tests subRouteId duplicate: ${c.subRouteId}`);
    repSubSeen.add(c.subRouteId);
  }

  // ── Reference integrity ───────────────────────────────────────────────────────
  const Q_RE = /^q(?:0[1-9]|[1-3][0-9]|40)$/;

  for (const t of routing.types) {
    for (const r of t.routes) {
      assert(
        r.mainRouteId.startsWith(t.typeId + "."),
        `mainRouteId "${r.mainRouteId}" not under typeId "${t.typeId}"`,
      );
      assert(
        r.subRouteId.startsWith(r.mainRouteId + "."),
        `subRouteId "${r.subRouteId}" not under mainRouteId "${r.mainRouteId}"`,
      );
      assert(r.evidence.length >= 3, `Route ${r.subRouteId} has < 3 evidence items`);
      assert(typeIdSet.has(r.bestPartnerTypeId), `bestPartnerTypeId "${r.bestPartnerTypeId}" not in 16 types (${r.subRouteId})`);

      for (const e of r.evidence) {
        assert(Q_RE.test(e.questionId), `Invalid questionId "${e.questionId}" in ${r.subRouteId}`);
      }
    }
  }

  // routing ↔ result-copy subRouteId complete match
  const rcSubSet = new Set(rcRoutes.map((r) => r.subRouteId));
  for (const id of subRouteIdSeen) assert(rcSubSet.has(id), `result-copy missing subRouteId: ${id}`);
  for (const id of rcSubSet) assert(subRouteIdSeen.has(id), `result-copy extra subRouteId: ${id}`);

  // routing ↔ representative-tests subRouteId complete match
  for (const id of subRouteIdSeen) assert(repSubSeen.has(id), `representative-tests missing subRouteId: ${id}`);
  for (const id of repSubSeen) assert(subRouteIdSeen.has(id), `representative-tests extra subRouteId: ${id}`);

  // representative-tests typeId / mainRouteId reference check
  for (const tc of repTests.cases) {
    const info = subRouteInfoMap.get(tc.subRouteId);
    assert(info !== undefined, `representative ${tc.caseId} unknown subRouteId: ${tc.subRouteId}`);
    assert.equal(info.typeId, tc.typeId, `representative ${tc.caseId} typeId mismatch`);
    assert.equal(info.mainRouteId, tc.mainRouteId, `representative ${tc.caseId} mainRouteId mismatch`);
  }

  // ── Numeric checks ────────────────────────────────────────────────────────────
  for (const t of routing.types) {
    for (const r of t.routes) {
      for (const e of r.evidence) {
        assert(e.weight > 0, `Evidence weight <= 0 in ${r.subRouteId} / ${e.questionId}`);
      }

      const ab = r.representativeScores.abilities;
      for (const [k, v] of Object.entries(ab)) {
        assert(v >= 50 && v <= 100, `representativeScores.abilities.${k} out of range [50,100] in ${r.subRouteId}: ${v}`);
      }

      const ax = r.representativeScores.axes;
      const PAIRS = [["thinking", "action"], ["offensive", "stable"], ["individual", "group"], ["divergent", "convergent"]] as const;
      for (const [a, b] of PAIRS) {
        const sum = ax[a] + ax[b];
        assert.equal(sum, 100, `Axis pair ${a}+${b}=${sum} != 100 in ${r.subRouteId}`);
      }
    }
  }

  const cw = routing.scoring.componentWeights;
  assert(cw.evidence >= 0 && cw.evidence <= 1, "componentWeights.evidence out of [0,1]");
  assert(cw.abilities >= 0 && cw.abilities <= 1, "componentWeights.abilities out of [0,1]");
  assert(cw.axes >= 0 && cw.axes <= 1, "componentWeights.axes out of [0,1]");
  assert(
    Math.abs(cw.evidence + cw.abilities + cw.axes - 1) < 1e-9,
    `componentWeights sum ${cw.evidence + cw.abilities + cw.axes} != 1`,
  );

  for (const [k, v] of Object.entries(routing.scoring.abilityRankMatch)) {
    assert(v >= 0 && v <= 1, `abilityRankMatch.${k} out of [0,1]: ${v}`);
  }

  for (const role of ["top1", "top2", "central"] as const) {
    for (const [k, v] of Object.entries(routing.scoring.axisRoleRankMatch[role])) {
      assert(v >= 0 && v <= 1, `axisRoleRankMatch.${role}.${k} out of [0,1]: ${v}`);
    }
  }

  const ct = routing.scoring.confidenceThresholds;
  assert(ct.highMinGap > ct.mediumMinGap, "highMinGap must be > mediumMinGap");
  assert(ct.mediumMinGap >= 0, "mediumMinGap must be >= 0");

  // ── Text checks ───────────────────────────────────────────────────────────────
  const rcTypeNameMap = new Map<string, string>();
  for (const t of resultCopy.types) rcTypeNameMap.set(t.typeId, t.typeName);

  const TEMPLATE_RE = /\{\{[^}]+\}\}/;
  const DIGIT_RE = /\d/;
  const FORBIDDEN = [
    "mainRouteId", "subRouteId", "mainRouteName", "subRouteName",
    "発火条件", "暴走行動", "増幅型", "統合型", "可変型", "フォールバック",
    "confidence", "evidenceMatch", "abilityMatch", "axisMatch",
  ];

  for (const t of resultCopy.types) {
    const typeName = t.typeName;
    for (const r of t.routes) {
      assert.equal(r.strengthScenes.length, 3, `${r.subRouteId} strengthScenes count != 3`);
      assert.equal(r.share.typeLine, typeName, `${r.subRouteId} share.typeLine "${r.share.typeLine}" != typeName "${typeName}"`);
      assert(!r.share.typeLine.includes("でした。"), `${r.subRouteId} share.typeLine contains "でした。"`);
      assert(r.currentYou.baseSentences.length > 0, `${r.subRouteId} baseSentences empty`);

      const strs = collectContentStrings(r);
      for (const s of strs) {
        assert(!TEMPLATE_RE.test(s), `Unresolved template in ${r.subRouteId}: "${s.slice(0, 60)}"`);
        assert(!DIGIT_RE.test(s), `Numeric literal in fixed text of ${r.subRouteId}: "${s.slice(0, 60)}"`);
        for (const word of FORBIDDEN) {
          assert(!s.includes(word), `Forbidden word "${word}" in ${r.subRouteId}: "${s.slice(0, 60)}"`);
        }
      }
    }
  }

  // ── Success output ────────────────────────────────────────────────────────────
  console.log("Business Skills V2 validation: PASS");
  console.log(`Types: ${routing.types.length}`);
  console.log(`Main routes: ${mainRouteTypeMap.size}`);
  console.log(`Sub routes: ${subRouteCount}`);
  console.log(`Evidence: ${evidenceCount}`);
  console.log(`Result copy routes: ${rcRoutes.length}`);
  console.log(`Representative cases: ${repTests.cases.length}`);
  console.log(`Strength scenes: ${allStrengthScenes.length}`);
} catch (e) {
  process.exitCode = 1;
  if (e instanceof Error) {
    console.error(e.message);
  } else {
    console.error(String(e));
  }
}
