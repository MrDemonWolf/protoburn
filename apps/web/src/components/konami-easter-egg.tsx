"use client";

import { useEffect, useState, useCallback } from "react";
import { Flame } from "lucide-react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function FireParticle({ index }: { index: number }) {
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const size = 16 + Math.random() * 32;
  const duration = 1 + Math.random() * 2;

  return (
    <div
      className="fixed animate-bounce pointer-events-none"
      style={{
        left: `${left}%`,
        bottom: `-${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        animation: `fireRise ${duration}s ease-out ${delay}s forwards`,
      }}
    >
      <Flame
        className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export function KonamiEasterEgg() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [activated, setActivated] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activated) return;

      const newSequence = [...sequence, e.key].slice(-KONAMI_CODE.length);
      setSequence(newSequence);

      if (
        newSequence.length === KONAMI_CODE.length &&
        newSequence.every((key, i) => key === KONAMI_CODE[i])
      ) {
        setActivated(true);
        setTimeout(() => setActivated(false), 4000);
        setSequence([]);
      }
    },
    [sequence, activated],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!activated) return null;

  return (
    <>
      <style>{`
        @keyframes fireRise {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.3) rotate(${Math.random() > 0.5 ? "" : "-"}30deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <FireParticle key={i} index={i} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-4xl font-bold text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]">
            PROTOBURN
          </div>
        </div>
      </div>
    </>
  );
}
