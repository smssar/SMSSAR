"use client";

import { useEffect } from "react";

export function SafePerformance() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "development") return;

    type PerfWithMeasure = Performance & {
      measure: (
        measureName: string,
        startOrMeasureOptions?: string | PerformanceMeasureOptions,
        endMark?: string,
      ) => PerformanceMeasure;
    };

    const perf = window.performance as PerfWithMeasure;
    if (!perf || typeof perf.measure !== "function") return;

    const original = perf.measure.bind(perf) as PerfWithMeasure["measure"];
    perf.measure = ((...args: Parameters<PerfWithMeasure["measure"]>) => {
      try {
        return original(...args);
      } catch (err) {
        console.warn(
          "SafePerformance: suppressed performance.measure error",
          err,
        );
        // return a harmless PerformanceMeasure-like object to satisfy callers
        return {
          name: String(args[0] ?? ""),
          entryType: "measure",
          startTime: 0,
          duration: 0,
        } as unknown as PerformanceMeasure;
      }
    }) as PerfWithMeasure["measure"];

    return () => {
      try {
        perf.measure = original;
      } catch {
        // ignore
      }
    };
  }, []);

  return null;
}
