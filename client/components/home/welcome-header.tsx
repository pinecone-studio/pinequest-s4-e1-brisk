"use client";

import SplitText from "@/components/SplitText";
import { TEXT_MUTED, TEXT_PRIMARY } from "@/lib/ui/design-tokens";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

type WelcomeHeaderProps = {
  todayLabel: string;
};

export function WelcomeHeader({ todayLabel }: WelcomeHeaderProps) {
  const { user } = useUser();
  const name = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const greetingText = `Welcome back, ${name}`;

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <h1 className={cn("font-heading text-3xl font-semibold tracking-tight sm:text-4xl", TEXT_PRIMARY)}>
        <SplitText
          text={greetingText}
          className="inline-block"
          delay={50}
          duration={1.25}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
        />
      </h1>
      <p className={cn("text-sm", TEXT_MUTED)}>{todayLabel}</p>
    </div>
  );
}
