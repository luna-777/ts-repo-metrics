"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

/** Cycles: system → light → dark → system */
const CYCLE: Array<"system" | "light" | "dark"> = ["system", "light", "dark"];

/** Returns true only after the component has mounted in the browser. */
function useIsMounted() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  // Avoid computing icons before mount (SSR returns false from useIsMounted)
  const Icon = useMemo(() => {
    if (!mounted) return Monitor;
    if (theme === "system") return Monitor;
    return resolvedTheme === "dark" ? Sun : Moon;
  }, [mounted, theme, resolvedTheme]);

  if (!mounted) {
    return <span className="size-[1.625rem]" aria-hidden />;
  }

  function handleClick() {
    const currentIndex = CYCLE.indexOf((theme ?? "system") as "system" | "light" | "dark");
    const nextTheme = CYCLE[(currentIndex + 1) % CYCLE.length]!;
    setTheme(nextTheme);
  }

  const label =
    theme === "light"
      ? "Switch to dark mode"
      : theme === "dark"
        ? "Switch to system theme"
        : "Switch to light mode";

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-md border border-border bg-muted/40 p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
    </button>
  );
}
