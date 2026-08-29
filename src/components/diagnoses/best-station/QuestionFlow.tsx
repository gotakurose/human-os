"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { QuestionStep, QuestionField, QuestionOption, DualBucketItem } from "@/lib/diagnoses/best-station/types";
import { computeProfile } from "@/lib/diagnoses/best-station/scoring";
import { matchStations } from "@/lib/diagnoses/best-station/matching";
import { saveResult } from "@/lib/diagnoses/best-station/storage";
import type { Station } from "@/lib/diagnoses/best-station/types";
import styles from "@/app/diagnoses/best-station/best-station.module.css";

interface PrefectureEntry { code: string; name: string }
interface RegionEntry { regionId: string; label: string; prefectures: PrefectureEntry[] }

interface Props {
  steps: QuestionStep[];
  stations: Station[];
  regions: RegionEntry[];
  diagnosisVersion: string;
}

const C = {
  bg: "#FFF8F1",
  ink: "#211920",
  sub: "#71656D",
  muted: "#9A8E97",
  accent: "#FF4F9A",
  selectedBg: "rgba(255,79,154,0.08)",
  selectedBorder: "#FF4F9A",
  border: "rgba(36,28,34,0.15)",
  surface: "#FFFFFF",
  must: "#FF4F9A",
  mustBg: "rgba(255,79,154,0.08)",
  mustBorder: "#FFB3D9",
  comp: "#52D8D2",
  compBg: "rgba(82,216,210,0.10)",
  compBorder: "#A3ECE9",
  poolBg: "#FFF4EC",
};

// ── Field labels (小見出し) — display only ───────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  current_area_type: "エリアの性格",
  current_noise_band: "周りの音",
  current_density_band: "人の多さ",
  current_convenience_band: "生活の便利さ",
  current_green_space_band: "緑・余白",
  housing_type: "住まいの種別",
  household_type: "一緒に住んでいる人",
  room_comfort: "部屋の余裕",
  home_function_conflict: "部屋の使い方がぶつかってる？",
  total_housing_cost_band: "物件全体（月額）",
  personal_housing_cost_band: "自分の負担（月額）",
  housing_burden_feeling: "払っていてどう感じる？",
  future_housing_spend_willingness: "今後の住居費、どう動かしたい？",
  personal_income_band: "年収（税込）",
  cost_sharing: "住居費の負担の形",
  support_sources: "支えになってるもの（任意）",
  support_stability: "その支え、どれくらい続く？（任意）",
  current_status: "今の仕事スタイル",
  commute_days_per_week: "週に何日出る？",
  one_way_travel_time: "片道の時間",
  transfer_count: "乗り換え",
  post_commute_exhaustion: "帰宅後のダメージ感",
  primary_tokyo_destination_zone: "メインの目的地（1つ）",
  secondary_tokyo_destination_zones: "他によく行く方面（任意・最大2つ）",
  b01_home_centered: "家にいる割合",
  b02_home_functions: "家が担っていること",
  b02_conflict_impact: "それが重なってどうなってる？",
  b03_external_activity: "仕事以外での外出頻度",
  b05_destination_city_use: "わざわざ都市中心部に出る頻度",
  b07_daily_range: "どこまで動く？",
  b08_current_travel_damage: "移動が生活に与えてるダメージ",
  d01_address_display: "住所ブランドへの関心",
  d02_urban_exit_anxiety: "都心から離れることへの不安",
  d03_option_ownership: "選択肢は近くにあった方がいい？",
  d04_cost_minimization: "住居費を抑えることへの意識",
  d05_status_quo: "合わなくても変えずにいる？",
  d06_ideal_projection: "この診断、どんな自分で答えた？",
};

// ── Option grid layout per fieldId ────────────────────────────────────────────

type FieldLayout = "grid2" | "grid3" | "full";

const FIELD_LAYOUT: Record<string, FieldLayout> = {
  current_area_type: "grid2",
  housing_type: "grid2",
  household_type: "grid2",
  total_housing_cost_band: "grid2",
  personal_housing_cost_band: "grid2",
  housing_burden_feeling: "grid2",
  future_housing_spend_willingness: "full",
  personal_income_band: "grid2",
  cost_sharing: "grid2",
  support_sources: "grid2",
  support_stability: "grid2",
  current_status: "grid2",
  commute_days_per_week: "grid3",
  one_way_travel_time: "grid2",
  transfer_count: "grid2",
  post_commute_exhaustion: "grid2",
  primary_tokyo_destination_zone: "grid2",
  secondary_tokyo_destination_zones: "grid2",
  b01_home_centered: "full",
  b02_home_functions: "grid3",
  b02_conflict_impact: "full",
  b03_external_activity: "grid2",
  b05_destination_city_use: "grid2",
  b04_local_use: "grid2",
  b06_night_activity: "grid2",
  b07_daily_range: "grid2",
  b08_current_travel_damage: "grid2",
};

// Values that clear all others when selected in a multi_select
const EXCLUSIVE_VALS = new Set(["none", "prefer_not"]);

// ── Shared option button grid ─────────────────────────────────────────────────

function OptionGrid({
  options,
  selectedVals,
  onToggle,
  layout,
}: {
  options: QuestionOption[];
  selectedVals: Set<string>;
  onToggle: (v: string) => void;
  layout: FieldLayout;
}) {
  const gridClass =
    layout === "grid3"
      ? "grid grid-cols-3 gap-2"
      : layout === "grid2"
      ? "grid grid-cols-2 gap-2"
      : "flex flex-col gap-2";

  const textSize = layout === "grid3" ? "12px" : "14px";
  const pad = layout === "grid3" ? "px-2 py-2.5" : layout === "grid2" ? "px-3 py-3" : "px-4 py-3.5";

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const key = String(opt.value);
        const isSel = selectedVals.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`${styles.answer} ${isSel ? styles.answerSelected : ""} ${pad} leading-snug`}
            style={{ fontSize: textSize }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── SingleSelect ──────────────────────────────────────────────────────────────

function SingleSelect({
  field,
  value,
  onChange,
  layout,
}: {
  field: QuestionField;
  value: unknown;
  onChange: (v: unknown) => void;
  layout: FieldLayout;
}) {
  const opts = field.options ?? [];
  const currentKey = value !== undefined && value !== null ? String(value) : "";
  const selectedVals = new Set(currentKey ? [currentKey] : []);

  function onToggle(key: string) {
    const opt = opts.find((o) => String(o.value) === key);
    if (opt) onChange(opt.value);
  }

  return <OptionGrid options={opts} selectedVals={selectedVals} onToggle={onToggle} layout={layout} />;
}

// ── Segmented ─────────────────────────────────────────────────────────────────

function Segmented({
  field,
  value,
  onChange,
}: {
  field: QuestionField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const opts = field.options ?? [];
  return (
    <div className="flex gap-2">
      {opts.map((opt: QuestionOption) => {
        const isSel = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`${styles.answer} ${isSel ? styles.answerSelected : ""} flex-1 py-3 text-[14px]`}
            style={{ textAlign: "center" }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── MultiSelect ───────────────────────────────────────────────────────────────

function MultiSelect({
  field,
  value,
  onChange,
  layout,
}: {
  field: QuestionField;
  value: unknown;
  onChange: (v: unknown) => void;
  layout: FieldLayout;
}) {
  const opts = field.options ?? [];
  const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
  const max = field.maxSelections ?? opts.length;

  function toggle(v: string) {
    if (selected.includes(v)) {
      onChange(selected.filter((s) => s !== v));
      return;
    }
    if (EXCLUSIVE_VALS.has(v)) {
      onChange([v]);
      return;
    }
    const cleaned = selected.filter((s) => !EXCLUSIVE_VALS.has(s));
    if (cleaned.length < max) {
      onChange([...cleaned, v]);
    }
  }

  const hint = field.required
    ? `最大${max}つまで選択`
    : `最大${max}つまで選択（任意）`;

  return (
    <div>
      <p className="text-xs font-jp mb-2" style={{ color: C.muted }}>
        {hint}
      </p>
      <OptionGrid
        options={opts}
        selectedVals={new Set(selected)}
        onToggle={toggle}
        layout={layout}
      />
    </div>
  );
}

// ── PrefectureSelect ──────────────────────────────────────────────────────────

function PrefectureSelect({
  value,
  regions,
  onChange,
}: {
  value: unknown;
  regions: RegionEntry[];
  onChange: (v: unknown) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const prefectures = selectedRegion
    ? (regions.find((r) => r.regionId === selectedRegion)?.prefectures ?? [])
    : [];

  if (!selectedRegion) {
    return (
      <div>
        <p className="text-xs font-jp mb-3" style={{ color: C.muted }}>
          まず地方を選んでください
        </p>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r.regionId}
              onClick={() => setSelectedRegion(r.regionId)}
              className={`${styles.answer} px-4 py-2 text-[14px]`}
              style={{ borderRadius: "999px", width: "auto", textAlign: "center" }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setSelectedRegion(null)}
        className="mb-3 text-xs font-jp"
        style={{ color: C.muted }}
      >
        ← 地方を選び直す
      </button>
      <div className="grid grid-cols-2 gap-2">
        {prefectures.map((p) => {
          const isSel = value === p.code;
          return (
            <button
              key={p.code}
              onClick={() => onChange(p.code)}
              className={`${styles.answer} ${isSel ? styles.answerSelected : ""} py-3 px-3 text-[14px]`}
              style={{ textAlign: "center" }}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── BucketZone (top-level to avoid react-hooks/static-components error) ───────

function BucketZone({
  label,
  count,
  total,
  zoneBg,
  zoneBorder,
  zoneColor,
  bucketItems,
  itemBorder,
  itemColor,
  onCycle,
}: {
  label: string;
  count: number;
  total: number;
  zoneBg: string;
  zoneBorder: string;
  zoneColor: string;
  bucketItems: DualBucketItem[];
  itemBorder: string;
  itemColor: string;
  onCycle: (metric: string) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[11px] font-jp font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: zoneBg, color: zoneColor }}
        >
          {label}
        </span>
        <span className="text-[11px] font-jp" style={{ color: C.muted }}>
          {count} / {total}
        </span>
      </div>
      <div
        className="rounded-xl p-2.5 flex flex-col gap-1.5 min-h-[48px]"
        style={{
          border: `1.5px solid ${count > 0 ? zoneBorder : C.border}`,
          background: count > 0 ? zoneBg : C.poolBg,
        }}
      >
        {count === 0 && (
          <p className="text-[11px] font-jp text-center py-0.5" style={{ color: C.muted }}>
            ここに{total}つ選ぶ
          </p>
        )}
        {bucketItems.map((item) => (
          <button
            key={item.metric}
            onClick={() => onCycle(item.metric)}
            className="w-full text-left px-3 py-2 rounded-lg font-jp text-[13px] flex items-center justify-between transition-all"
            style={{
              background: C.surface,
              border: `1px solid ${itemBorder}`,
              color: itemColor,
              fontWeight: 600,
            }}
          >
            <span>{item.label}</span>
            <span className="text-[11px] ml-2 shrink-0" style={{ color: C.muted }}>
              ✕
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── DualBucketRank ────────────────────────────────────────────────────────────

function DualBucketRank({
  field,
  value,
  onChange,
}: {
  field: QuestionField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const items: DualBucketItem[] = field.items ?? [];
  const mustHaveCount = field.mustHaveCount ?? 2;
  const compromiseCount = field.compromiseCount ?? 2;
  const ranking = (value as Record<string, string> | null) ?? {};

  const mustItems = items.filter((it) => ranking[it.metric] === "must_have");
  const compItems = items.filter((it) => ranking[it.metric] === "can_compromise");
  const unobsItems = items.filter((it) => !ranking[it.metric]);

  function cycle(metric: string) {
    const current = ranking[metric];
    const newRanking = { ...ranking };
    if (!current) {
      if (mustItems.length < mustHaveCount) {
        newRanking[metric] = "must_have";
      } else if (compItems.length < compromiseCount) {
        newRanking[metric] = "can_compromise";
      }
    } else if (current === "must_have") {
      delete newRanking[metric];
      if (compItems.length < compromiseCount) {
        newRanking[metric] = "can_compromise";
      }
    } else {
      delete newRanking[metric];
    }
    onChange(Object.keys(newRanking).length > 0 ? newRanking : null);
  }

  const isComplete = mustItems.length === mustHaveCount && compItems.length === compromiseCount;

  return (
    <div>
      <BucketZone
        label="絶対ほしい"
        count={mustItems.length}
        total={mustHaveCount}
        zoneBg={C.mustBg}
        zoneBorder={C.mustBorder}
        zoneColor={C.must}
        bucketItems={mustItems}
        itemBorder={C.mustBorder}
        itemColor={C.must}
        onCycle={cycle}
      />
      <BucketZone
        label="なくても耐える"
        count={compItems.length}
        total={compromiseCount}
        zoneBg={C.compBg}
        zoneBorder={C.compBorder}
        zoneColor={C.comp}
        bucketItems={compItems}
        itemBorder={C.compBorder}
        itemColor={C.comp}
        onCycle={cycle}
      />

      {unobsItems.length > 0 && (
        <div>
          <p className="text-[11px] font-jp mb-1.5" style={{ color: C.muted }}>
            タップして仕分ける（残り3つは選ばなくてOK）
          </p>
          <div className="flex flex-col gap-1.5">
            {unobsItems.map((item) => (
              <button
                key={item.metric}
                onClick={() => cycle(item.metric)}
                className="w-full text-left px-3 py-2.5 rounded-xl font-jp text-[13px] flex items-center justify-between transition-all"
                style={{
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                  color: C.sub,
                }}
              >
                <span>{item.label}</span>
                <span className="text-[11px] ml-2 shrink-0" style={{ color: C.muted }}>
                  + 追加
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isComplete && (
        <p className="mt-3 text-xs font-jp text-center" style={{ color: C.accent }}>
          選択完了！
        </p>
      )}
    </div>
  );
}

// ── Step completion check ─────────────────────────────────────────────────────

function isStepComplete(step: QuestionStep, answers: Record<string, unknown>): boolean {
  for (const field of step.fields) {
    if (!field.required) continue;
    const val = answers[field.fieldId];
    if (val === undefined || val === null) return false;
    if (typeof val === "string" && val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;

    if (field.type === "dual_bucket_rank") {
      const ranking = val as Record<string, string> | null;
      if (!ranking) return false;
      const mustCount = field.mustHaveCount ?? 2;
      const compCount = field.compromiseCount ?? 2;
      const musts = Object.values(ranking).filter((v) => v === "must_have").length;
      const comps = Object.values(ranking).filter((v) => v === "can_compromise").length;
      if (musts < mustCount || comps < compCount) return false;
    }
  }
  return true;
}

// ── Main component ────────────────────────────────────────────────────────────

export function QuestionFlow({ steps, stations, regions, diagnosisVersion }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const progress = Math.round((currentStep / totalSteps) * 100);
  const canAdvance = isStepComplete(step, answers);
  const isLastStep = currentStep === totalSteps - 1;
  const isMultiField = step.fields.length > 1;

  const setFieldValue = useCallback((fieldId: string, v: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: v }));
  }, []);

  async function handleNext() {
    if (!canAdvance) return;
    if (isLastStep) {
      setIsSubmitting(true);
      setError(null);
      try {
        const profile = computeProfile(answers, diagnosisVersion);
        const result = matchStations(stations, profile);
        saveResult(result);
        router.push("/diagnoses/best-station/results");
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
        setIsSubmitting(false);
      }
      return;
    }
    setCurrentStep((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function renderField(field: QuestionField) {
    const val = answers[field.fieldId];
    const onChange = (v: unknown) => setFieldValue(field.fieldId, v);
    const layout: FieldLayout = FIELD_LAYOUT[field.fieldId] ?? "full";
    const label = FIELD_LABELS[field.fieldId];

    return (
      <div key={field.fieldId}>
        {isMultiField && label && (
          <p
            className="text-[12px] font-jp font-semibold mb-2"
            style={{ color: C.sub }}
          >
            {label}
          </p>
        )}
        {(() => {
          switch (field.type) {
            case "single_select":
              return (
                <SingleSelect field={field} value={val} onChange={onChange} layout={layout} />
              );
            case "segmented":
              return <Segmented field={field} value={val} onChange={onChange} />;
            case "multi_select":
              return (
                <MultiSelect field={field} value={val} onChange={onChange} layout={layout} />
              );
            case "prefecture_select":
              return (
                <PrefectureSelect value={val} regions={regions} onChange={onChange} />
              );
            case "dual_bucket_rank":
              return <DualBucketRank field={field} value={val} onChange={onChange} />;
            default:
              return null;
          }
        })()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.ink }}>
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: "3px", background: "rgba(36,28,34,0.10)" }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg,#FF4F9A,#FF765B)",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between"
        style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}
      >
        <button
          onClick={handleBack}
          className="font-jp text-sm"
          style={{
            color: currentStep > 0 ? C.sub : "transparent",
            cursor: currentStep > 0 ? "pointer" : "default",
          }}
        >
          ← 戻る
        </button>
        <span className={`${styles.sticker} ${styles.stickerYellow}`}>
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Content + Button */}
      <div className="flex-1 flex flex-col px-5 pt-8 max-w-lg mx-auto w-full">
        <h2
          className={`${styles.display} ${styles.inkShadow} mb-2`}
          style={{
            fontSize: "clamp(19px, 5.2vw, 23px)",
            color: C.ink,
          }}
        >
          {step.title}
        </h2>
        {step.subtitle && (
          <p className="font-jp text-sm leading-relaxed mb-6" style={{ color: C.sub }}>
            {step.subtitle}
          </p>
        )}

        <div className="flex flex-col gap-6">
          {step.fields.map((field) => renderField(field))}
        </div>

        {error && (
          <p className="mt-4 text-sm font-jp" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}

        {/* Spacer: pushes button to bottom on short pages */}
        <div className="flex-1" />

        <div className="py-8">
          <button
            onClick={handleNext}
            disabled={!canAdvance || isSubmitting}
            className={`${styles.cta} ${!canAdvance || isSubmitting ? styles.ctaDisabled : ""} py-4 text-[15px]`}
          >
            {isSubmitting ? "診断中..." : isLastStep ? "結果を見る →" : "次へ →"}
          </button>
        </div>
      </div>
    </div>
  );
}
