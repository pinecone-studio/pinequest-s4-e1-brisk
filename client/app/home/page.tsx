import { Suspense } from "react";
import {
  HomePageContent,
  HomePageFallback,
} from "@/components/home/home-page-content";

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
