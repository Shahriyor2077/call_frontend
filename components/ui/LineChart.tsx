interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export default function LineChart({ data, height = 160, color = '#6366f1' }: LineChartProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const W = 100;
  const H = 80;
  const pad = 4;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (d.value - min) / range) * (H - pad * 2);
    return { x, y };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${points[0].x},${H} ` + polyline + ` ${points[points.length - 1].x},${H}`;

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="85%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#lg)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.2" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-gray-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
