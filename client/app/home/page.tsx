import {
  HomePageContent,
  HomePageFallback,
} from "@/components/home/home-page-content";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
