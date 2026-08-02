import { loadTypes, loadMeta, loadAllMeta, loadFixedCopy, loadDynamicCopy } from "@/lib/data-loader";
import type { DiagnosisType, FixedCopy } from "@/schemas/diagnosis";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ResultClient } from "./ResultClient";
import { ResultShareSection } from "./ResultShareSection";
import { ResultBadgeGroup } from "./ResultBadgeGroup";
import { ResultAbilitySection } from "./ResultAbilitySection";
import { ProseBody } from "./ProseBody";
import { DynamicCopySlot } from "./DynamicCopySlot";
import { TYPE_DISPLAY_ASSETS } from "./result-assets";
import { RotateCcw, Home } from "lucide-react";
import type { DynamicCopyPart, TypeDefinition } from "./resolve-axis-dynamic-copy";
import { parseAvParam, buildAvParam } from "@/engine/ability-scorer";
import type { StyleAxisScores } from "@/engine/style-axis-scorer";
import { isBusinessSkillsV2Enabled } from "@/lib/business-skills-v2-feature";
import {
  loadBusinessSkillsV2Routing,
  loadBusinessSkillsV2ResultCopy,
  loadBusinessSkillsV2NumericRules,
} from "@/lib/business-skills-v2-data";
import { renderBusinessSkillsV2NumericCopy } from "@/engine/business-skills-v2-numeric-renderer";
import type { BusinessSkillsV2Confidence } from "@/engine/business-skills-v2-selector";
import { BusinessSkillsV2Result } from "./BusinessSkillsV2Result";

const ORN = "/images/diagnoses/business-skills/ornaments";

function DividerOrnament() {
  return (
    <div className="divider-ornament-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ORN}/divider-ornament.png`}
        alt=""
        aria-hidden="true"
        className="divider-ornament-img pointer-events-none select-none"
      />
    </div>
  );
}

function computeBaseCode(axes: {
  thinkingAction: number;
  offensiveStable: number;
  soloTeam: number;
  divergentConvergent: number;
}): string {
  return (
    (axes.thinkingAction <= 2 ? "T" : "A") +
    (axes.offensiveStable <= 2 ? "O" : "S") +
    (axes.soloTeam <= 2 ? "I" : "G") +
    (axes.divergentConvergent <= 2 ? "E" : "F")
  );
}

function validateFixedCopyIntegrity(fixedCopy: FixedCopy, types: DiagnosisType[]): void {
  if (fixedCopy.schemaVersion !== 1)
    throw new Error(`fixed-copy.json schemaVersion must be 1, got ${fixedCopy.schemaVersion}`);

  if (fixedCopy.types.length !== 16)
    throw new Error(`fixed-copy.json must have exactly 16 types, got ${fixedCopy.types.length}`);

  const fcTypeIds = fixedCopy.types.map((t) => t.typeId);
  const fcTypeIdSet = new Set(fcTypeIds);
  if (fcTypeIdSet.size !== 16)
    throw new Error(`fixed-copy.json has duplicate typeIds`);

  const fcBaseCodes = fixedCopy.types.map((t) => t.baseCode);
  if (new Set(fcBaseCodes).size !== 16)
    throw new Error(`fixed-copy.json has duplicate baseCodes`);

  const typesJsonIdSet = new Set(types.map((t) => t.id));
  for (const id of fcTypeIds) {
    if (!typesJsonIdSet.has(id))
      throw new Error(`fixed-copy.json typeId "${id}" not found in types.json`);
  }
  for (const id of typesJsonIdSet) {
    if (!fcTypeIdSet.has(id))
      throw new Error(`types.json typeId "${id}" not found in fixed-copy.json`);
  }

  const allIds: string[] = [];
  for (const ft of fixedCopy.types) {
    const prefix = `type.${ft.typeId}.`;
    const collectId = (id: string) => {
      if (!id.startsWith(prefix))
        throw new Error(`Field ID "${id}" does not have expected prefix "${prefix}"`);
      allIds.push(id);
    };
    collectId(ft.catch.id);
    collectId(ft.overview.id);
    collectId(ft.harsh.title.id);
    collectId(ft.harsh.body.id);
    collectId(ft.thinking.id);
    for (const s of ft.strengths) { collectId(s.title.id); collectId(s.body.id); }
    for (const w of ft.weaknesses) { collectId(w.title.id); collectId(w.body.id); }
    collectId(ft.fatal.title.id);
    collectId(ft.fatal.body.id);
    for (const g of ft.growthTips) { collectId(g.title.id); collectId(g.body.id); }
    collectId(ft.career.id);
    for (const l of ft.fitJobs.labels) collectId(l.id);
    collectId(ft.fitJobs.body.id);
    for (const l of ft.avoidJobs.labels) collectId(l.id);
    collectId(ft.avoidJobs.body.id);
    collectId(ft.relationships.id);
    collectId(ft.teamRole.id);
    collectId(ft.conclusion.id);
  }
  if (new Set(allIds).size !== allIds.length)
    throw new Error(`fixed-copy.json has duplicate field IDs`);

  for (const ft of fixedCopy.types) {
    const matchingAxes = types.find((t) => t.id === ft.typeId)?.axes;
    if (!matchingAxes) continue;
    const computed = computeBaseCode(matchingAxes);
    if (ft.baseCode !== computed)
      throw new Error(
        `baseCode mismatch for "${ft.typeId}": fixed-copy has "${ft.baseCode}", axes compute "${computed}"`,
      );
  }
}

const AXIS_INT_RE = /^-?(0|[1-9]\d*)$/;
function parseAxisParam(s: string): number | null {
  if (!AXIS_INT_RE.test(s)) return null;
  const n = Number(s);
  if (!Number.isInteger(n) || !Number.isFinite(n) || n < -100 || n > 100) return null;
  return n;
}
function isValidConfidence(s: string): s is BusinessSkillsV2Confidence {
  return s === "high" || s === "medium" || s === "low";
}

interface Props {
  params: Promise<{ diagnosisId: string; typeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const allMeta = loadAllMeta();
  const params: { diagnosisId: string; typeId: string }[] = [];

  for (const meta of allMeta) {
    try {
      const types = loadTypes(meta.id);
      for (const type of types) {
        params.push({ diagnosisId: meta.id, typeId: type.id });
      }
    } catch {
      // skip diagnoses with missing types.json
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props) {
  const { diagnosisId, typeId } = await params;
  try {
    const types = loadTypes(diagnosisId);
    const type = types.find((t) => t.id === typeId);
    if (!type) return {};
    const fixedCopy = loadFixedCopy(diagnosisId);
    const fixedType = fixedCopy.types.find((t) => t.typeId === typeId);
    return {
      title: `私は「${type.name}」｜ビジマル診断`,
      description: fixedType?.catch.text ?? fixedType?.overview.text,
      robots: { index: false, follow: false },
    };
  } catch {
    return {};
  }
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { diagnosisId, typeId } = await params;

  let types, meta;
  try {
    types = loadTypes(diagnosisId);
    meta = loadMeta(diagnosisId);
  } catch {
    notFound();
  }

  const type = types.find((t) => t.id === typeId);
  if (!type) notFound();

  let fixedCopy;
  try {
    fixedCopy = loadFixedCopy(diagnosisId);
  } catch {
    notFound();
  }

  validateFixedCopyIntegrity(fixedCopy, types);

  let dynamicCopyParts: DynamicCopyPart[];
  try {
    dynamicCopyParts = loadDynamicCopy(diagnosisId) as DynamicCopyPart[];
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ResultPage] loadDynamicCopy failed:", err);
    }
    dynamicCopyParts = [];
  }

  const allTypeDefinitions: TypeDefinition[] = types.flatMap((t) =>
    t.axes ? [{ id: t.id, axes: t.axes }] : [],
  );

  const fixedTypeArr = fixedCopy.types.filter((t) => t.typeId === typeId);
  if (fixedTypeArr.length !== 1)
    throw new Error(`Expected exactly 1 fixed type for "${typeId}", found ${fixedTypeArr.length}`);
  const fixedType = fixedTypeArr[0];

  if (type.axes) {
    const computed = computeBaseCode(type.axes);
    if (fixedType.baseCode !== computed)
      throw new Error(
        `baseCode mismatch for "${typeId}": fixed-copy has "${fixedType.baseCode}", axes compute "${computed}"`,
      );
  }

  const typeAssets        = TYPE_DISPLAY_ASSETS[typeId] ?? null;
  const resolvedCharImage = typeAssets?.characterImage ?? (type.characterImage || null);
  const resolvedEnName    = typeAssets?.displayEnglishName ?? type.englishName;

  // ── V2 gate ──────────────────────────────────────────────────────────────────
  v2: {
    if (diagnosisId !== "business-skills" || !isBusinessSkillsV2Enabled()) break v2;

    const sp = await searchParams;
    const taRaw = sp.ta;
    const osRaw = sp.os;
    const stRaw = sp.st;
    const dcRaw = sp.dc;
    const avRaw = sp.av;
    const srRaw = sp.sr;
    const cfRaw = sp.cf;

    if (
      typeof taRaw !== "string" || typeof osRaw !== "string" ||
      typeof stRaw !== "string" || typeof dcRaw !== "string" ||
      typeof avRaw !== "string" || typeof srRaw !== "string" ||
      typeof cfRaw !== "string"
    ) break v2;

    const ta = parseAxisParam(taRaw);
    const os = parseAxisParam(osRaw);
    const st = parseAxisParam(stRaw);
    const dc = parseAxisParam(dcRaw);
    if (ta === null || os === null || st === null || dc === null) break v2;

    const parsedAv = parseAvParam(avRaw);
    if (parsedAv === null) break v2;
    if (buildAvParam(parsedAv) !== avRaw) break v2;

    if (!isValidConfidence(cfRaw)) break v2;
    const confidence = cfRaw;

    let v2ReadyData: {
      typeCopy:      { typeName: string; englishName: string; catchCopy: string };
      routeCopy:     import("@/schemas/business-skills-v2").BusinessSkillsV2ResultRoute;
      numericResult: import("@/engine/business-skills-v2-numeric-renderer").BusinessSkillsV2NumericRenderResult;
    } | null = null;

    try {
      const v2Routing      = loadBusinessSkillsV2Routing();
      const v2ResultCopy   = loadBusinessSkillsV2ResultCopy();
      const v2NumericRules = loadBusinessSkillsV2NumericRules();

      const v2RoutingType = v2Routing.types.find((t) => t.typeId === typeId);
      if (!v2RoutingType) break v2;

      const v2Route = v2RoutingType.routes.find((r) => r.subRouteId === srRaw);
      if (!v2Route) break v2;

      const v2ResultCopyType = v2ResultCopy.types.find((t) => t.typeId === typeId);
      if (!v2ResultCopyType) break v2;

      const v2NumericType = v2NumericRules.types.find((t) => t.typeId === typeId);
      if (!v2NumericType) break v2;

      if (v2ResultCopyType.baseCode !== v2RoutingType.baseCode) break v2;
      if (v2NumericType.baseCode     !== v2RoutingType.baseCode) break v2;
      if (v2RoutingType.typeName     !== type.name)              break v2;
      if (v2RoutingType.englishName  !== resolvedEnName)         break v2;

      const v2RouteCopy = v2ResultCopyType.routes.find((r) => r.subRouteId === srRaw);
      if (!v2RouteCopy) break v2;

      const styleAxisScores: StyleAxisScores = {
        thinking_action:      ta / 100,
        offensive_stable:     os / 100,
        solo_team:            st / 100,
        divergent_convergent: dc / 100,
      };

      v2ReadyData = {
        typeCopy: {
          typeName:    v2ResultCopyType.typeName,
          englishName: v2ResultCopyType.englishName,
          catchCopy:   v2ResultCopyType.catchCopy,
        },
        routeCopy:     v2RouteCopy,
        numericResult: renderBusinessSkillsV2NumericCopy({
          route:            v2Route,
          typeNumericRules: v2NumericType,
          templates:        v2NumericRules.global.templates,
          styleAxisScores,
          abilityUScores:   parsedAv,
          confidence,
        }),
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Business Skills V2 result rendering failed", error);
      }
    }

    if (!v2ReadyData) break v2;

    return (
      <BusinessSkillsV2Result
        diagnosisId={diagnosisId}
        type={type}
        displayAssets={typeAssets}
        typeCopy={v2ReadyData.typeCopy}
        routeCopy={v2ReadyData.routeCopy}
        numericResult={v2ReadyData.numericResult}
      />
    );
  }

  return (
    <main
      className="dossier-page flex-1"
      style={{ color: "#21160D" }}
    >

      {/* ── コーナー装飾（左上・右上） ─────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ORN}/corner-ornament.png`}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute corner-ornament corner-ornament-left"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ORN}/corner-ornament.png`}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute corner-ornament corner-ornament-right"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* ══════════════════════════════════════════════════════════
          ファーストビュー
      ══════════════════════════════════════════════════════════ */}
      <section
        className="flex flex-col items-center min-h-[calc(100vh-64px)] pt-6 md:pt-8 pb-10 md:pb-14 max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8"
        style={{ textAlign: "center" }}
      >

        {/* パンくず */}
        <div className="w-full mb-6 md:mb-8 text-left">
          <Link
            href={`/diagnoses/${diagnosisId}`}
            className="text-xs md:text-sm font-jp transition-opacity hover:opacity-70"
            style={{ color: "rgba(33,22,13,0.52)" }}
          >
            ← {meta.title}
          </Link>
        </div>

        {/* ① キャラクター画像 */}
        <div
          data-slot="character-portrait"
          className="relative mx-auto result-portrait-stage w-[280px] md:w-[400px] lg:w-[520px]"
        >
          <div className="relative overflow-hidden">
            {resolvedCharImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedCharImage}
                alt={`${type.name} キャラクター`}
                data-slot="character-image"
                className="w-full h-auto object-contain block"
              />
            ) : (
              <div className="w-full aspect-[3/4] flex items-end justify-start p-4">
                <span
                  className="text-[9px] font-mono-doc tracking-[0.2em]"
                  style={{ color: "rgba(111,85,44,0.40)" }}
                >
                  PORTRAIT
                </span>
              </div>
            )}
            <div
              className="absolute inset-0 pointer-events-none result-shine-overlay"
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.62) 48%, rgba(255,255,255,0.18) 52%, transparent 66%)",
              }}
            />
          </div>
        </div>

        {/* ②③ 動物タイプ + 日本語タイプ名 */}
        <div className="mt-4 md:mt-6">
          {typeAssets?.animalType && (
            <p
              className="font-mono-doc mb-2 md:mb-3"
              style={{ color: "rgba(111,85,44,0.82)", fontSize: "clamp(16px, 2.2vw, 22px)", letterSpacing: "0.12em" }}
            >
              {typeAssets.animalType}
            </p>
          )}
          <h1
            className="font-heading tracking-[0.04em] result-type-name result-type-name-heading"
            style={{ fontWeight: 700, color: "#17100A" }}
          >
            {type.name}
          </h1>
        </div>

        {/* ④ 族バッジ・特化個体バッジ（日本語タイプ名の下、英語名の上） */}
        {type.axes && (
          <Suspense fallback={<div className="tribe-badge-fallback" />}>
            <ResultBadgeGroup typeAxesFallback={type.axes} />
          </Suspense>
        )}

        {/* ⑤ 英語タイプ名 */}
        {resolvedEnName && (
          <p
            className="font-serif-en italic result-en-name"
            style={{
              fontSize: "clamp(1.1rem, 2.6vw, 1.65rem)",
              lineHeight: "1.3",
              color: "rgba(33,22,13,0.72)",
              marginTop: "10px",
            }}
          >
            {resolvedEnName}
          </p>
        )}

        {/* ⑥ キャッチコピー */}
        <p
          className="font-heading leading-[1.4] tracking-[0.04em] max-w-2xl mx-auto result-catch"
          style={{
            fontSize: "clamp(1.3rem, 3.2vw, 2rem)",
            color: "#17100A",
            marginTop: "18px",
          }}
        >
          {fixedType.catch.text}
        </p>

        {/* ⑦ タイプ概要 */}
        <div
          className="mx-auto w-full result-panel-reveal parchment-panel text-left"
          style={{ maxWidth: "760px", marginTop: "24px" }}
        >
          <h2
            className="font-heading leading-[1.2] tracking-[0.04em] mb-5"
            style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)", color: "#17100A" }}
          >
            このタイプについて
          </h2>
          <ProseBody
            text={fixedType.overview.text}
            className="space-y-4"
            paragraphClassName="font-jp prose-text"
            style={{ color: "#21160D" }}
          />
          {type.axes && (
            <>
              <Suspense fallback={null}>
                <DynamicCopySlot
                  targetSlot="overview.axisSoftNote"
                  typeId={typeId}
                  typeAxesFallback={type.axes}
                  parts={dynamicCopyParts}
                  allTypeDefinitions={allTypeDefinitions}
                />
              </Suspense>
              <Suspense fallback={null}>
                <DynamicCopySlot
                  targetSlot="overview.axisBalanceNote"
                  typeId={typeId}
                  typeAxesFallback={type.axes}
                  parts={dynamicCopyParts}
                  allTypeDefinitions={allTypeDefinitions}
                />
              </Suspense>
            </>
          )}
        </div>

      </section>

      {/* ── 8/辛辣コメント ──────────────────────────────────────── */}
      <div
        className="mx-auto px-5 md:px-7 w-full"
        style={{ maxWidth: "760px", paddingTop: "32px", paddingBottom: "8px" }}
      >
        <div style={{ borderLeft: "3px solid #9A7350", paddingLeft: "16px" }}>
          <p
            className="font-heading leading-[1.4] tracking-[0.03em]"
            style={{
              fontSize: "clamp(28px, 7.5vw, 48px)",
              color: "#21160D",
            }}
          >
            {fixedType.harsh.title.text}
          </p>
        </div>
      </div>

      {/* ── DIVIDER #1: 辛辣コメント後 ──────────────────────────── */}
      <DividerOrnament />

      {/* ── Section 9: 5能力値・五角形レーダー ──────────────────── */}
      <Suspense fallback={null}>
        <ResultAbilitySection />
      </Suspense>

      {/* ── スタイル傾向（ResultClient: Section 10） ─────────────── */}
      <div className="max-w-[960px] mx-auto px-5 md:px-7 lg:px-8 w-full pb-4">
        <Suspense
          fallback={
            <div className="py-16 text-center">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: "rgba(111,85,44,0.28)", borderTopColor: "#8A713C" }}
              />
            </div>
          }
        >
          <ResultClient
            styleAxesFallback={type.axes}
          />
        </Suspense>
      </div>

      {/* ── DIVIDER #2: スタイル傾向後 ──────────────────────────── */}
      <DividerOrnament />

      {/* ══════════════════════════════════════════════════════════
          詳細セクション（11〜15）
      ══════════════════════════════════════════════════════════ */}
      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 w-full">

        {/* ─ 11/仕事の思考回路 ────────────────────────────────────── */}
        <section>
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            仕事の思考回路
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <ProseBody
              text={fixedType.thinking.text}
              className="space-y-4"
              paragraphClassName="font-jp prose-text"
              style={{ color: "#21160D" }}
            />
            {type.axes && (
              <Suspense fallback={null}>
                <DynamicCopySlot
                  targetSlot="thinking.axisNote"
                  typeId={typeId}
                  typeAxesFallback={type.axes}
                  parts={dynamicCopyParts}
                  allTypeDefinitions={allTypeDefinitions}
                />
              </Suspense>
            )}
          </div>
        </section>

        {/* ─ 12/強み ─────────────────────────────────────────────── */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            強み
          </h2>
          <div style={{ borderLeft: "2px solid #9A7C46", paddingLeft: "20px", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <ul style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {fixedType.strengths.map((s) => (
                <li key={s.title.id}>
                  <p
                    className="font-heading leading-[1.3] tracking-[0.03em] mb-2"
                    style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "#17100A" }}
                  >
                    {s.title.text}
                  </p>
                  <ProseBody
                    text={s.body.text}
                    className="space-y-2"
                    paragraphClassName="font-jp prose-text"
                    style={{ color: "#21160D" }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─ 13/弱み ─────────────────────────────────────────────── */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            弱み
          </h2>
          <div style={{ borderLeft: "2px solid #A77A70", paddingLeft: "20px", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <ul style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {fixedType.weaknesses.map((w) => (
                <li key={w.title.id}>
                  <p
                    className="font-heading leading-[1.3] tracking-[0.03em] mb-2"
                    style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "#17100A" }}
                  >
                    {w.title.text}
                  </p>
                  <ProseBody
                    text={w.body.text}
                    className="space-y-2"
                    paragraphClassName="font-jp prose-text"
                    style={{ color: "#21160D" }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─ 14/致命的弱点 ────────────────────────────────────────── */}
        <section className="section-block-gap">
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            致命的な弱点
          </h2>
          <div
            className="parchment-panel mx-auto"
            style={{ maxWidth: "760px" }}
          >
            <p
              className="font-mono-doc sub-label"
              style={{ letterSpacing: "0.32em", marginBottom: "18px", color: "rgba(116,49,40,0.72)" }}
            >
              CRITICAL WEAKNESS
            </p>
            <p
              className="font-heading leading-[1.3]"
              style={{
                fontSize: "clamp(23px, 3.8vw, 46px)",
                color: "#743128",
                marginBottom: "24px",
              }}
            >
              {fixedType.fatal.title.text}
            </p>
            <ProseBody
              text={fixedType.fatal.body.text}
              className="space-y-3"
              paragraphClassName="font-jp prose-text"
              style={{ color: "#4A2A10" }}
            />
          </div>
        </section>

        {/* ─ 15/成長ヒント ────────────────────────────────────────── */}
        <section className="section-block-gap">
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            成長ヒント
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <ol style={{ display: "flex", flexDirection: "column", gap: "34px" }}>
              {fixedType.growthTips.map((tip, i) => (
                <li key={tip.title.id} className="flex gap-5">
                  <span
                    className="shrink-0 font-mono-doc font-medium"
                    style={{
                      fontSize: "clamp(24px, 2.8vw, 30px)",
                      color: "#6F552C",
                      lineHeight: "1.9",
                    }}
                  >
                    {i + 1}.
                  </span>
                  <div>
                    <p
                      className="font-heading leading-[1.4] tracking-[0.03em] mb-2"
                      style={{ fontSize: "clamp(17px, 1.8vw, 20px)", color: "#17100A" }}
                    >
                      {tip.title.text}
                    </p>
                    <ProseBody
                      text={tip.body.text}
                      className="space-y-2"
                      paragraphClassName="font-jp prose-text"
                      style={{ color: "#21160D" }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

      </div>

      {/* ── DIVIDER #3: 成長ヒント後 ────────────────────────────── */}
      <DividerOrnament />

      {/* ══ 16-18/キャリア適性・向いている仕事・避けたい仕事 ══════ */}
      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 w-full">
        <section>
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            キャリア適性
          </h2>

          {/* 16/キャリア適性 本文 */}
          <div style={{ maxWidth: "760px", marginBottom: "40px", marginLeft: "auto", marginRight: "auto" }}>
            <ProseBody
              text={fixedType.career.text}
              className="space-y-4"
              paragraphClassName="font-jp prose-text"
              style={{ color: "#21160D" }}
            />
            {type.axes && (
              <Suspense fallback={null}>
                <DynamicCopySlot
                  targetSlot="career.axisNote"
                  typeId={typeId}
                  typeAxesFallback={type.axes}
                  parts={dynamicCopyParts}
                  allTypeDefinitions={allTypeDefinitions}
                />
              </Suspense>
            )}
          </div>

          {/* 17/向いている仕事 */}
          <div className="mb-8" style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <p
              className="font-mono-doc mb-4"
              style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
            >
              向いている仕事
            </p>
            <div className="flex flex-wrap mb-5" style={{ gap: "10px" }}>
              {fixedType.fitJobs.labels.map((l) => (
                <span
                  key={l.id}
                  className="font-jp"
                  style={{
                    fontSize: "clamp(17px, 1.8vw, 21px)",
                    padding: "10px 20px",
                    minHeight: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid rgba(210,200,185,0.80)",
                    background: "rgba(252,250,248,0.90)",
                    borderRadius: "3px",
                    color: "#21160D",
                  }}
                >
                  {l.text}
                </span>
              ))}
            </div>
            <ProseBody
              text={fixedType.fitJobs.body.text}
              className="space-y-3"
              paragraphClassName="font-jp prose-text"
              style={{ color: "rgba(33,22,13,0.74)", maxWidth: "760px" }}
            />
          </div>

          {/* 18/避けたい仕事 */}
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <p
              className="font-mono-doc mb-4"
              style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
            >
              避けたい仕事
            </p>
            <div className="flex flex-wrap mb-5" style={{ gap: "10px" }}>
              {fixedType.avoidJobs.labels.map((l) => (
                <span
                  key={l.id}
                  className="font-jp"
                  style={{
                    fontSize: "clamp(17px, 1.8vw, 21px)",
                    padding: "10px 20px",
                    minHeight: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid rgba(210,200,185,0.80)",
                    background: "rgba(252,250,248,0.90)",
                    borderRadius: "3px",
                    color: "#21160D",
                  }}
                >
                  {l.text}
                </span>
              ))}
            </div>
            <ProseBody
              text={fixedType.avoidJobs.body.text}
              className="space-y-3"
              paragraphClassName="font-jp prose-text"
              style={{ color: "rgba(33,22,13,0.74)", maxWidth: "760px" }}
            />
          </div>
        </section>
      </div>

      {/* ── DIVIDER #4: キャリア後 ───────────────────────────────── */}
      <DividerOrnament />

      {/* ══ 19-21/人間関係・チームでの役割・結論 ════════════════════ */}
      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 w-full">

        {/* ─ 19/人間関係 ─────────────────────────────────────────── */}
        <section>
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            人間関係
          </h2>
          <div style={{ maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}>
            <ProseBody
              text={fixedType.relationships.text}
              className="space-y-4"
              paragraphClassName="font-jp prose-text"
              style={{ color: "#21160D" }}
            />
            {type.axes && (
              <Suspense fallback={null}>
                <DynamicCopySlot
                  targetSlot="relationships.axisNote"
                  typeId={typeId}
                  typeAxesFallback={type.axes}
                  parts={dynamicCopyParts}
                  allTypeDefinitions={allTypeDefinitions}
                />
              </Suspense>
            )}
          </div>
        </section>

        {/* ─ 20/チームでの役割 ──────────────────────────────────── */}
        <section
          className="section-block-gap mx-auto"
          style={{ maxWidth: "760px" }}
        >
          <p
            className="font-mono-doc mb-6"
            style={{ fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 600, letterSpacing: "0.20em", color: "rgba(111,85,44,0.85)" }}
          >
            チームでの役割
          </p>
          <ProseBody
            text={fixedType.teamRole.text}
            className="space-y-3"
            paragraphClassName="font-jp prose-text"
            style={{ color: "#17100A" }}
          />
        </section>

        {/* ─ 21/結論 ─────────────────────────────────────────────── */}
        <section
          className="section-block-gap"
          style={{ borderTop: "1px solid rgba(111,85,44,0.24)", paddingTop: "clamp(36px, 4vw, 48px)" }}
        >
          <h2
            className="font-heading tracking-[0.04em] section-heading"
            style={{ color: "#17100A", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" }}
          >
            結論
          </h2>
          <div
            style={{
              maxWidth: "760px",
              marginLeft: "auto",
              marginRight: "auto",
              backgroundImage: "url('/images/diagnoses/business-skills/ornaments/result-frame-hero.png')",
              backgroundSize: "100% 100%",
              padding: "72px 15% 66px 13%",
            }}
          >
            <ProseBody
              text={fixedType.conclusion.text}
              className="space-y-4"
              paragraphClassName="font-jp prose-text"
              style={{ color: "#21160D" }}
            />
          </div>
        </section>

      </div>

      {/* ── DIVIDER #5: 結論後 → シェア前 ──────────────────────── */}
      <DividerOrnament />

      {/* ── シェアセクション ────────────────────────────────────── */}
      <ResultShareSection typeName={type.name} />

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div
        className="mx-auto px-5 md:px-0 pt-6 pb-16 flex flex-col md:flex-row gap-3"
        style={{ maxWidth: "760px" }}
      >
        <Link
          href={`/diagnoses/${diagnosisId}/questions`}
          className="flex items-center justify-center gap-2 flex-1 py-4 text-sm font-jp font-medium transition-opacity hover:opacity-80"
          style={{ background: "#11100D", color: "#F4EFE4" }}
        >
          <RotateCcw size={14} />
          もう一度診断する
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 flex-1 py-4 text-sm font-jp transition-opacity hover:opacity-70 border"
          style={{ color: "#6F552C", borderColor: "rgba(111,85,44,0.35)" }}
        >
          <Home size={14} />
          トップへ戻る
        </Link>
      </div>

      {/* ── フッター ─────────────────────────────────────────────── */}
      <footer
        className="mt-20 md:mt-28 px-6 md:px-10 py-12 md:py-16"
        style={{
          borderTop: "1px solid rgba(111,85,44,0.24)",
          background: "rgba(120,98,56,0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_2fr] gap-10">

          {/* ブランド */}
          <div>
            <p
              className="font-heading text-[2rem] md:text-[3rem] leading-[1.1] tracking-[0.04em] mb-4"
              style={{ color: "#17100A" }}
            >
              Human-OS
            </p>
            <p
              className="font-jp text-sm md:text-base leading-[1.8] max-w-sm"
              style={{ color: "rgba(33,22,13,0.74)" }}
            >
              さまざまな診断を重ね、あなたという人間の「設計図」をつくる診断プラットフォーム。
            </p>
          </div>

          {/* リンク */}
          <div>
            <p className="font-mono-doc text-xs tracking-[0.22em] mb-4" style={{ color: "rgba(111,85,44,0.78)" }}>
              コンテンツ
            </p>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="font-jp text-sm md:text-base hover:underline" style={{ color: "rgba(33,22,13,0.78)" }}>
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="font-jp text-sm md:text-base hover:underline" style={{ color: "rgba(33,22,13,0.78)" }}>
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/diagnoses/business-skills/types" className="font-jp text-sm md:text-base hover:underline" style={{ color: "rgba(33,22,13,0.78)" }}>
                  ビジマル16タイプ図鑑
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="max-w-6xl mx-auto mt-12 pt-6"
          style={{ borderTop: "1px solid rgba(111,85,44,0.16)" }}
        >
          <p className="font-mono-doc text-xs" style={{ color: "rgba(33,22,13,0.38)" }}>
            © 2026 Human-OS
          </p>
        </div>
      </footer>

    </main>
  );
}
