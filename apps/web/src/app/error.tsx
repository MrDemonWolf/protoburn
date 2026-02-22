"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="glass-card w-full max-w-sm rounded-xl border border-[var(--glass-border)] bg-card/60 p-8 text-center backdrop-blur-xl backdrop-saturate-[180%]">
        <div className="mb-3 text-4xl">🔥</div>
        <h2 className="font-heading mb-2 text-lg font-bold">Something went wrong</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          A runtime error occurred while rendering the dashboard.
          {error.digest && (
            <span className="mt-1 block font-mono text-xs">Digest: {error.digest}</span>
          )}
        </p>
        <button
          onClick={reset}
          className="font-heading cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
