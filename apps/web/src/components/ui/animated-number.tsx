"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const DIGITS = "0123456789";

interface AnimatedNumberProps {
  value: string;
  animateKey: number;
  className?: string;
  /** Trigger roll-up animation on first render (default true) */
  animateOnMount?: boolean;
}

export function AnimatedNumber({ value, animateKey, className, animateOnMount = true }: AnimatedNumberProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const prevKeyRef = useRef(animateKey);
  const prevValueRef = useRef<string | null>(null);
  const hasMountedRef = useRef(false);
  // Phase: "idle" = show final positions, "start" = random positions (one frame), "rolling" = animate to target
  const [phase, setPhase] = useState<"idle" | "start" | "rolling">("idle");
  const [startOffsets, setStartOffsets] = useState<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const triggerAnimation = useCallback(() => {
    // Set random start offsets and enter "start" phase
    setStartOffsets(
      Array.from({ length: value.length }, () => Math.floor(Math.random() * 10)),
    );
    setPhase("start");
  }, [value.length]);

  // Animate on mount if enabled
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (animateOnMount) {
        prevValueRef.current = value;
        triggerAnimation();
      }
    }
  }, [animateOnMount, triggerAnimation, value]);

  useEffect(() => {
    if (animateKey > 0 && animateKey !== prevKeyRef.current) {
      prevKeyRef.current = animateKey;
      // Skip animation if the value hasn't changed
      if (prevValueRef.current === value) {
        return;
      }
      prevValueRef.current = value;
      triggerAnimation();
    }
  }, [animateKey, triggerAnimation, value]);

  // After "start" renders one frame, move to "rolling" to animate to targets
  useEffect(() => {
    if (phase === "start") {
      const raf = requestAnimationFrame(() => {
        setPhase("rolling");
      });
      return () => cancelAnimationFrame(raf);
    }
    if (phase === "rolling") {
      const timeout = setTimeout(() => setPhase("idle"), 1200);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  if (prefersReducedMotion) {
    return <div className={className}>{value}</div>;
  }

  // Render plain text when idle for natural font rendering
  if (phase === "idle") {
    return <div className={className}>{value}</div>;
  }

  const chars = value.split("");

  return (
    <div className={className} style={{ display: "flex", overflow: "hidden" }}>
      {chars.map((char, i) => {
        const isDigit = DIGITS.includes(char);

        if (!isDigit) {
          const shouldFade = phase === "start" || phase === "rolling";
          return (
            <span
              key={`${i}-sep`}
              style={{
                transition: shouldFade ? `opacity 0.4s ease ${0.3 + i * 0.04}s` : "none",
                opacity: phase === "start" ? 0 : 1,
              }}
            >
              {char}
            </span>
          );
        }

        const targetDigit = parseInt(char, 10);
        let displayOffset: number;
        if (phase === "start") {
          displayOffset = startOffsets[i] ?? 0;
        } else {
          displayOffset = targetDigit;
        }

        const isAnimating = phase === "rolling";

        return (
          <span
            key={`${i}-digit`}
            style={{
              display: "inline-block",
              height: "1.2em",
              overflow: "hidden",
              position: "relative",
              width: "0.65em",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                position: "absolute",
                left: 0,
                right: 0,
                transform: `translateY(-${displayOffset * 1.2}em)`,
                transition: isAnimating
                  ? `transform 1s cubic-bezier(0.25, 1, 0.5, 1) ${i * 0.08}s`
                  : "none",
              }}
            >
              {DIGITS.split("").map((d) => (
                <span
                  key={d}
                  style={{
                    height: "1.2em",
                    lineHeight: "1.2em",
                    display: "block",
                  }}
                >
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
}
