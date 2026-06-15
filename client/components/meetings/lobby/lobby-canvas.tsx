import { AMBIENT_ORB } from "@/lib/ui/design-tokens";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type LobbyCanvasProps = {
  children: ReactNode;
  className?: string;
  showBackLink?: boolean;
};

export function LobbyCanvas({ children, className, showBackLink = true }: LobbyCanvasProps) {
  return (
    <div
      className={cn(
        "lobby-canvas relative flex h-screen items-center justify-center overflow-hidden bg-zinc-50 p-6 transition-colors duration-300 md:p-12 dark:bg-zinc-950",
        className,
      )}
    >
      <div className={AMBIENT_ORB} aria-hidden />
      {showBackLink ? (
        <Link
          className="absolute left-6 top-6 z-20 inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 text-sm font-medium text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-zinc-100 md:left-12 md:top-12 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-50 dark:hover:bg-zinc-800"
          href="/home"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      ) : null}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
