import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repo Analytics | Course Submission",
};

export default function CourseAnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
