import { Suspense } from "react";
import { RecordingsPageContent } from "@/components/recordings/recordings-page-content";

function RecordingsPageFallback() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-40 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function RecordingsPage() {
  return (
    <Suspense fallback={<RecordingsPageFallback />}>
      <RecordingsPageContent />
    </Suspense>
  );
}
