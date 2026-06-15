import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type LobbyCanvasProps = {
  children: ReactNode;
  className?: string;
};

export function LobbyCanvas({ children, className }: LobbyCanvasProps) {
  return (
    <div
      className={cn(
        "lobby-canvas relative flex h-screen items-center justify-center overflow-hidden p-6 md:p-12",
        className,
      )}
    >
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
