import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DocsSectionBody } from "@/components/docs/DocsSections";
import {
  ALL_DOC_SLUGS,
  DEFAULT_DOC_SLUG,
  titleForSlug,
} from "@/components/docs/docsNav";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return ALL_DOC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = titleForSlug(slug) ?? "Documentation";
  return {
    title: `${label} | Docs | Repo Metrics`,
    description:
      "Contributor documentation: setup, system map, metrics calculation, and technical reference for Repo Metrics.",
  };
}

export default async function DocsSectionPage({ params }: Props) {
  const { slug } = await params;
  if (!ALL_DOC_SLUGS.includes(slug)) {
    redirect(`/docs/${DEFAULT_DOC_SLUG}`);
  }

  return <DocsSectionBody slug={slug} />;
}
