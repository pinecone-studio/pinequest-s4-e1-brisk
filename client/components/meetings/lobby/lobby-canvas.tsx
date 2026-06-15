import { CircleBackLink } from "@/components/ui/circle-back-link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type LobbyCanvasProps = {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  className?: string;
};

export function LobbyCanvas({
  backHref = "/meetings",
  backLabel = "Back to meetings",
  children,
  className,
}: LobbyCanvasProps) {
  return (
    <div
      className={cn(
        "lobby-canvas relative flex h-screen items-center justify-center overflow-hidden p-6 md:p-12",
        className,
      )}
    >
      {backHref ? (
        <div className="absolute left-6 top-6 z-20 md:left-12 md:top-12">
          <CircleBackLink href={backHref} label={backLabel} />
        </div>
      ) : null}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
