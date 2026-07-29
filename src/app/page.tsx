import { Suspense } from "react";
import { DanceMyNameApp } from "@/components/DanceMyNameApp";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <DanceMyNameApp />
    </Suspense>
  );
}
