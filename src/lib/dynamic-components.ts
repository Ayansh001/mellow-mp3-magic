
"use client";

import dynamic from "next/dynamic";

// Example: Dynamically import AudioVisualization with no SSR
export const DynamicAudioVisualization = dynamic(
  () => import("@/components/AudioVisualization"),
  { ssr: false }
);

// Example: Dynamically import EnhancedAudioPlayer with no SSR
export const DynamicEnhancedAudioPlayer = dynamic(
  () => import("@/components/EnhancedAudioPlayer"),
  { ssr: false }
);
