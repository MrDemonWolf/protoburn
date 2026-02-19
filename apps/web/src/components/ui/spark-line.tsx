interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function SparkLine({
  data,
  width = 80,
  height = 24,
  className,
}: SparkLineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((value, i) => {
      const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Area fill path: line points + bottom-right + bottom-left
  const firstX = data.length === 1 ? width / 2 : padding;
  const lastX = data.length === 1 ? width / 2 : width - padding;
  const areaPath = `M ${points.split(" ")[0]} L ${points} L ${lastX},${height - padding} L ${firstX},${height - padding} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
