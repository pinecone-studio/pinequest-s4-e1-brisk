"use client";

import { MOCK_STANDUP_DAYS } from "@/lib/meetings/mock-standup-story";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function StandupStorySection() {
  return (
    <section className="flex flex-col gap-4">
      <ul className="flex list-none flex-col gap-4">
        {MOCK_STANDUP_DAYS.map((day) => (
          <li key={day.id}>
            <Link
              href={`/meetings/${day.id}`}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Card className="cursor-pointer ring-1 ring-foreground/10 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-semibold uppercase">
                          {day.dateLabel} · {day.day}-р өдөр
                        </Badge>
                        <Badge className="bg-primary/15 text-primary">Standup</Badge>
                      </div>

                      <h3 className="font-heading text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                        {day.title.replace(/^Standup — /, "")}
                      </h3>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {day.meetingContent}
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border px-3 py-1.5 text-xs font-medium text-primary transition-colors group-hover:bg-primary/10 sm:mt-1">
                      Summary харах
                      <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <div className="rounded-xl bg-sage/15 px-4 py-3 ring-1 ring-sage/20 dark:bg-sage/10">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-foreground">
                      Brisk-ийн үүрэг
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                      {day.briskRole}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
