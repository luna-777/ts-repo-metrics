import { DocsLayoutClient } from "@/components/docs/DocsLayoutClient";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-none px-0">
      <DocsLayoutClient>{children}</DocsLayoutClient>
    </div>
  );
}
