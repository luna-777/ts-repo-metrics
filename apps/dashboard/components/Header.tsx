/**
 * Site header aligned with Figma (UCSC Developer Analytics Tool nav strip).
 */

import { HeaderNavClient } from "@/components/HeaderNavClient";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#262626] bg-[#0a0a0a]">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <HeaderNavClient />
      </div>
    </header>
  );
}
