/**
 * Results page: displays analysis result for a given resultId.
 * Fetches from Supabase, dev memory, or client sessionStorage fallback.
 */

import { Metadata } from "next";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { ResultsPageClientLoader } from "@/components/results/ResultsPageClientLoader";
import { getReportById } from "@/lib/getReportById";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Results: ${id} | Repo Metrics` };
}

export default async function ResultsPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const { data, error } = await getReportById(id);

  if (data) {
    return (
      <div className="w-full max-w-6xl">
        <ResultsDashboard report={data} resultId={id} />
      </div>
    );
  }

  return (
    <ResultsPageClientLoader
      resultId={id}
      serverMessage={error ?? "Failed to load result"}
    />
  );
}
