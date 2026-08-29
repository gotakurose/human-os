import type { Metadata } from "next";
import { loadQuestions, loadPrefectures, loadStations, loadDestinationZones } from "@/lib/diagnoses/best-station/data";
import { QuestionFlow } from "@/components/diagnoses/best-station/QuestionFlow";
import type { QuestionStep, QuestionField } from "@/lib/diagnoses/best-station/types";

export const metadata: Metadata = {
  title: "診断中 — 無理するな、お前が住むべき最寄り駅",
  robots: { index: false, follow: false },
};

function injectZoneOptions(
  steps: QuestionStep[],
  zones: Array<{ id: string; label: string }>,
): QuestionStep[] {
  return steps.map((step) => {
    if (step.stepId !== "R07") return step;
    return {
      ...step,
      fields: step.fields.map((field): QuestionField => {
        if (field.fieldId === "primary_tokyo_destination_zone") {
          return { ...field, options: zones.map((z) => ({ value: z.id, label: z.label })) };
        }
        if (field.fieldId === "secondary_tokyo_destination_zones") {
          const excludeValues = (field.excludeValues as string[] | undefined) ?? [];
          return {
            ...field,
            options: zones
              .filter((z) => !excludeValues.includes(z.id))
              .map((z) => ({ value: z.id, label: z.label })),
          };
        }
        return field;
      }),
    };
  });
}

export default function BestStationQuestionsPage() {
  const rawSteps = loadQuestions();
  const zonesData = loadDestinationZones();
  const steps = injectZoneOptions(rawSteps, zonesData.zones);
  const prefecturesData = loadPrefectures();
  const stations = loadStations();

  return (
    <QuestionFlow
      steps={steps}
      stations={stations}
      regions={prefecturesData.regions as never}
      diagnosisVersion="0.3.1-review"
    />
  );
}
