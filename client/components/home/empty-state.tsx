"use client";

import SplitText from "@/components/SplitText";
import { QuickActions } from "@/components/home/quick-actions";
import { motion } from "framer-motion";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-xl"
      >
        <div className="pointer-events-none absolute -top-20 right-0 size-64 rounded-full bg-primary/10 blur-3xl" />

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          <SplitText
            text="Where should we start?"
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

        <p className="mt-3 text-base text-muted-foreground">
          Start a meeting, capture a recording, or hand Brisk a file to
          summarize.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full max-w-3xl"
      >
        <QuickActions variant="hero" />
      </motion.div>
    </div>
  );
}
