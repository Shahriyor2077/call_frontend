interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export default function BarChart({ data, height = 160, color = '#6366f1', formatValue }: BarChartProps) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;
  const gap = 0.4;

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 100 100`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = (d.value / max) * 85;
          const x = i * barWidth + gap;
          const w = barWidth - gap * 2;
          return (
            <g key={i}>
              <rect
                x={x}
                y={100 - barH}
                width={w}
                height={barH}
                fill={color}
                rx="0.8"
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-gray-400 text-center" style={{ width: `${barWidth}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
