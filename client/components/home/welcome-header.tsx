"use client";

import SplitText from "@/components/SplitText";
import { useUser } from "@clerk/nextjs";

type WelcomeHeaderProps = {
  todayLabel: string;
};

export function WelcomeHeader({ todayLabel }: WelcomeHeaderProps) {
  const { user } = useUser();

  const greetingText = `Hello${user?.firstName ? `, ${user.firstName}` : ""}!`;

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
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
      <p className="text-sm text-muted-foreground">
        Welcome to Brisk, your personal meeting assistant · {todayLabel}
      </p>
    </div>
  );
}
