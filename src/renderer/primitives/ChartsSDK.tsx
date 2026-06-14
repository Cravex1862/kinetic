import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { GlowConfig } from './types';

function glowCSS(g?: GlowConfig): React.CSSProperties {
  if (!g?.enabled) return {};
  return { filter: `drop-shadow(0 0 ${g.spread}px ${g.color}) drop-shadow(0 0 ${g.intensity * 6}px ${g.color})`, willChange: 'filter' };
}

// ─── BarChart ────────────────────────────────────────────────
interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  width: number;
  height: number;
  barSpacing?: number;
  maxValue?: number;
  barRadius?: number;
  showValues?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type BarChartAllProps = BarChartProps & { frame?: number };

function BarChartStatic({ data, width, height, barSpacing = 8, maxValue, barRadius = 4, showValues = false, glowConfig, animDuration = 30, delay = 0, frame }: Required<BarChartAllProps>) {
  return <BarChartSvg data={data} width={width} height={height} barSpacing={barSpacing} maxValue={maxValue} barRadius={barRadius} showValues={showValues} glowConfig={glowConfig} frame={frame} animDuration={animDuration} delay={delay} />;
}

function BarChartRemotion(props: BarChartProps) {
  const frame = useCurrentFrame();
  return <BarChartSvg {...props} frame={frame} />;
}

function BarChartSvg({ data, width, height, barSpacing, maxValue, barRadius = 4, showValues = false, glowConfig, frame, animDuration, delay }: BarChartAllProps & { animDuration: number; delay: number; barRadius: number; showValues: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const globalProgress = Math.min(adjusted / animDuration, 1);
  const chartBottom = height;
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barCount = data.length;
  const totalBarSpace = width - barSpacing * (barCount + 1);
  const barWidth = totalBarSpace / barCount;

  return (
    <svg width={width} height={height} style={glowCSS(glowConfig)}>
      {data.map((d, i) => {
        const localDelay = i * 2;
        const p = Math.min(Math.max(0, adjusted - localDelay) / animDuration, 1);
        const individual = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(globalProgress > 0 ? Math.min(adjusted / animDuration, 1) : 0);
        const eased = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(p);
        const prog = globalProgress > 0 ? eased : individual;
        const barHeight = (d.value / max) * chartBottom * prog;
        const x = barSpacing + i * (barWidth + barSpacing);
        const y = chartBottom - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={barRadius} fill={d.color ?? '#6366f1'} />
            {showValues && <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fill="#9ca3af" fontSize={9}>{d.value}</text>}
            <text x={x + barWidth / 2} y={chartBottom + 14} textAnchor="middle" fill="#9ca3af" fontSize={10}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const BarChart: React.FC<BarChartAllProps> = (props) => {
  if (props.frame !== undefined) return <BarChartStatic {...props} frame={props.frame} />;
  return <BarChartRemotion {...props} />;
};

// ─── LineChart ───────────────────────────────────────────────
interface LineChartDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  width: number;
  height: number;
  lineColor?: string;
  lineWidth?: number;
  showPoints?: boolean;
  showGrid?: boolean;
  showArea?: boolean;
  showLabels?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type LineChartAllProps = LineChartProps & { frame?: number };

function LineChartStatic({ data, width, height, lineColor = '#6366f1', lineWidth = 3, showPoints = true, showGrid = true, showArea = false, showLabels = true, glowConfig, animDuration = 30, delay = 0, frame }: Required<LineChartAllProps>) {
  return <LineChartSvg data={data} width={width} height={height} lineColor={lineColor} lineWidth={lineWidth} showPoints={showPoints} showGrid={showGrid} showArea={showArea} showLabels={showLabels} glowConfig={glowConfig} frame={frame} animDuration={animDuration} delay={delay} />;
}

function LineChartRemotion(props: LineChartProps) {
  const frame = useCurrentFrame();
  return <LineChartSvg {...props} frame={frame} />;
}

function LineChartSvg({ data, width, height, lineColor, lineWidth, showPoints, showGrid, showArea, showLabels, glowConfig, frame, animDuration, delay }: LineChartAllProps & { animDuration: number; delay: number; lineColor: string; lineWidth: number; showPoints: boolean; showGrid: boolean; showArea: boolean; showLabels: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);
  const eased = Easing.inOut(Easing.ease)(progress);

  const pad = 20;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;
  const max = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad + chartH - (d.value / max) * chartH,
  }));

  const allPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const totalLength = 1000;

  const drawnLength = totalLength * eased;
  const visiblePointCount = Math.min(points.length, Math.ceil(eased * points.length));
  const bottom = height - pad;
  const areaPoints = points.length > 1 ? [...points.map((p) => `${p.x},${p.y}`), `${points[points.length - 1].x},${bottom}`, `${points[0].x},${bottom}`].join(' ') : '';

  return (
    <svg width={width} height={height} style={glowCSS(glowConfig)}>
      {showGrid && (
        <g stroke="#374151" strokeWidth={1}>
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = pad + chartH - frac * chartH;
            return <line key={frac} x1={pad} y1={y} x2={pad + chartW} y2={y} />;
          })}
        </g>
      )}
      {showArea && points.length > 1 && (
        <polygon points={areaPoints} fill={lineColor} fillOpacity={0.15} opacity={eased} />
      )}
      {points.length > 1 && (
        <polyline
          points={allPointsStr}
          fill="none"
          stroke={lineColor}
          strokeWidth={lineWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength - drawnLength}
          pathLength={totalLength}
        />
      )}
      {showPoints && points.slice(0, visiblePointCount).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={lineColor} stroke="#030712" strokeWidth={2} />
      ))}
      {showLabels && data.map((d, i) => (
        <text key={i} x={points[i].x} y={height - 4} textAnchor="middle" fill="#9ca3af" fontSize={10}>{d.label}</text>
      ))}
    </svg>
  );
}

export const LineChart: React.FC<LineChartAllProps> = (props) => {
  if (props.frame !== undefined) return <LineChartStatic {...props} frame={props.frame} />;
  return <LineChartRemotion {...props} />;
};

// ─── PieChart ────────────────────────────────────────────────
interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieSlice[];
  size: number;
  innerRadius?: number;
  showLabels?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type PieChartAllProps = PieChartProps & { frame?: number };

function PieChartStatic({ data, size, innerRadius = 0, showLabels = true, glowConfig, animDuration = 30, delay = 0, frame }: Required<PieChartAllProps>) {
  return <PieChartSvg data={data} size={size} innerRadius={innerRadius} showLabels={showLabels} glowConfig={glowConfig} frame={frame} animDuration={animDuration} delay={delay} />;
}

function PieChartRemotion(props: PieChartProps) {
  const frame = useCurrentFrame();
  return <PieChartSvg {...props} frame={frame} />;
}

function PieChartSvg({ data, size, innerRadius, showLabels, glowConfig, frame, animDuration, delay }: PieChartAllProps & { animDuration: number; delay: number; innerRadius: number; showLabels: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);
  const eased = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(progress);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = innerRadius;

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16'];
  let currentAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2 * eased;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle = endAngle;
    const largeArc = sweep > Math.PI ? 1 : 0;

    if (sweep < 0.001) return null;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);

    const midAngle = startAngle + sweep / 2;
    const labelR = outerR * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    if (innerR > 0) {
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);
      const path = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');
      return <g key={i}>
        <path d={path} fill={d.color ?? colors[i % colors.length]} />
        {showLabels && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={10} fontWeight="bold">{d.label}</text>}
      </g>;
    }

    const path = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');
    return <g key={i}>
      <path d={path} fill={d.color ?? colors[i % colors.length]} />
      {showLabels && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={10} fontWeight="bold">{d.label}</text>}
    </g>;
  });

  return (
    <svg width={size} height={size} style={glowCSS(glowConfig)}>
      {slices}
    </svg>
  );
}

export const PieChart: React.FC<PieChartAllProps> = (props) => {
  if (props.frame !== undefined) return <PieChartStatic {...props} frame={props.frame} />;
  return <PieChartRemotion {...props} />;
};

// ─── AreaChart ────────────────────────────────────────────────
interface AreaPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaPoint[];
  width: number;
  height: number;
  lineColor?: string;
  fillColor?: string;
  lineWidth?: number;
  showPoints?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type AreaChartAllProps = AreaChartProps & { frame?: number };

function AreaChartStatic({ data, width, height, lineColor = '#6366f1', fillColor, lineWidth = 3, showPoints = false, glowConfig, animDuration = 30, delay = 0, frame }: Required<AreaChartAllProps>) {
  return <AreaChartSvg data={data} width={width} height={height} lineColor={lineColor} fillColor={fillColor} lineWidth={lineWidth} showPoints={showPoints} glowConfig={glowConfig} animDuration={animDuration} delay={delay} frame={frame} />;
}

function AreaChartRemotion(props: AreaChartProps) {
  const frame = useCurrentFrame();
  return <AreaChartSvg {...props} frame={frame} animDuration={props.animDuration ?? 30} delay={props.delay ?? 0} />;
}

function AreaChartSvg({ data, width, height, lineColor = '#6366f1', fillColor, lineWidth = 3, showPoints = false, glowConfig, frame, animDuration, delay }: AreaChartAllProps & { animDuration: number; delay: number; showPoints: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);
  const eased = Easing.inOut(Easing.ease)(progress);

  const pad = 20;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bottom = height - pad;

  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad + chartH - (d.value / max) * chartH,
  }));

  const allPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const totalLength = 1000;
  const drawnLength = totalLength * eased;
  const visiblePointCount = Math.min(points.length, Math.ceil(eased * points.length));

  const areaPoints = [...points.map((p) => `${p.x},${p.y}`), `${points[points.length - 1].x},${bottom}`, `${points[0].x},${bottom}`].join(' ');

  const gradId = `area-grad-${lineColor.replace('#', '')}`;

  return (
    <svg width={width} height={height} style={glowCSS(glowConfig)}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor ?? lineColor} stopOpacity={0.5} />
          <stop offset="100%" stopColor={fillColor ?? lineColor} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      {points.length > 1 && (
        <>
          <polygon points={areaPoints} fill={`url(#${gradId})`} opacity={eased} />
          <polyline
            points={allPointsStr}
            fill="none"
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={totalLength}
            strokeDashoffset={totalLength - drawnLength}
            pathLength={totalLength}
          />
        </>
      )}
      {showPoints && points.slice(0, visiblePointCount).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={lineColor} stroke="#030712" strokeWidth={1.5} />
      ))}
      {data.map((d, i) => (
        <text key={i} x={points[i].x} y={height - 4} textAnchor="middle" fill="#9ca3af" fontSize={10}>{d.label}</text>
      ))}
    </svg>
  );
}

export const AreaChart: React.FC<AreaChartAllProps> = (props) => {
  if (props.frame !== undefined) return <AreaChartStatic {...props} frame={props.frame} />;
  return <AreaChartRemotion {...props} />;
};

// ─── DonutChart ───────────────────────────────────────────────
interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size: number;
  innerRadius?: number;
  centerTextSlot?: string;
  showLabels?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type DonutChartAllProps = DonutChartProps & { frame?: number };

function DonutChartStatic({ data, size, innerRadius = 28, centerTextSlot, showLabels = true, glowConfig, animDuration = 30, delay = 0, frame }: Required<DonutChartAllProps>) {
  return <DonutChartSvg data={data} size={size} innerRadius={innerRadius} centerTextSlot={centerTextSlot} showLabels={showLabels} glowConfig={glowConfig} animDuration={animDuration} delay={delay} frame={frame} />;
}

function DonutChartRemotion(props: DonutChartProps) {
  const frame = useCurrentFrame();
  return <DonutChartSvg {...props} frame={frame} animDuration={props.animDuration ?? 30} delay={props.delay ?? 0} />;
}

function DonutChartSvg({ data, size, innerRadius = 28, centerTextSlot, showLabels, glowConfig, frame, animDuration, delay }: DonutChartAllProps & { animDuration: number; delay: number; innerRadius: number; showLabels: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);
  const eased = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(progress);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = innerRadius;
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16'];

  let currentAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2 * eased;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle = endAngle;
    const largeArc = sweep > Math.PI ? 1 : 0;
    if (sweep < 0.001) return null;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const midAngle = startAngle + sweep / 2;
    const labelR = outerR * 0.75;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');
    return <g key={i}>
      <path d={path} fill={d.color ?? colors[i % colors.length]} />
      {showLabels && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={9} fontWeight="bold">{d.label}</text>}
    </g>;
  });

  return (
    <svg width={size} height={size} style={glowCSS(glowConfig)}>
      {slices}
      {centerTextSlot && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.12} fontWeight="bold">
          {centerTextSlot}
        </text>
      )}
    </svg>
  );
}

export const DonutChart: React.FC<DonutChartAllProps> = (props) => {
  if (props.frame !== undefined) return <DonutChartStatic {...props} frame={props.frame} />;
  return <DonutChartRemotion {...props} />;
};

// ─── MetricFunnel ─────────────────────────────────────────────
interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

interface MetricFunnelProps {
  data: FunnelStep[];
  width: number;
  height: number;
  orientation?: 'vertical' | 'horizontal';
  showPercent?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type MetricFunnelAllProps = MetricFunnelProps & { frame?: number };

function MetricFunnelStatic({ data, width, height, orientation = 'vertical', showPercent = false, glowConfig, animDuration = 30, delay = 0, frame }: Required<MetricFunnelAllProps>) {
  return <MetricFunnelSvg data={data} width={width} height={height} orientation={orientation} showPercent={showPercent} glowConfig={glowConfig} animDuration={animDuration} delay={delay} frame={frame} />;
}

function MetricFunnelRemotion(props: MetricFunnelProps) {
  const frame = useCurrentFrame();
  return <MetricFunnelSvg {...props} frame={frame} animDuration={props.animDuration ?? 30} delay={props.delay ?? 0} />;
}

function MetricFunnelSvg({ data, width, height, orientation = 'vertical', showPercent = false, glowConfig, frame, animDuration, delay }: MetricFunnelAllProps & { animDuration: number; delay: number; showPercent: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);

  const maxVal = data[0]?.value ?? 1;
  const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];
  const padding = 10;

  return (
    <svg width={width} height={height} style={glowCSS(glowConfig)}>
      {data.map((d, i) => {
        const localP = Math.min(Math.max(0, adjusted - i * 3) / animDuration, 1);
        const widthRatio = d.value / maxVal;
        const barW = widthRatio * (width - padding * 2) * localP;
        const barH = (height - padding * (data.length + 1)) / data.length;

        const x = orientation === 'vertical' ? (width - barW) / 2 : padding;
        const y = orientation === 'vertical' ? padding + i * (barH + padding) : padding + i * (barH + padding);
        const w = orientation === 'vertical' ? barW : barH * 0.4;
        const h = orientation === 'vertical' ? barH : barH;

        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx={4} fill={d.color ?? colors[i % colors.length]} opacity={localP} />
            <text x={orientation === 'vertical' ? x + w / 2 : x + w + 6} y={y + h / 2} textAnchor={orientation === 'vertical' ? 'middle' : 'start'} dominantBaseline="central" fill="#9ca3af" fontSize={11} opacity={localP}>
              {d.label} — {d.value}{showPercent && ` (${Math.round((d.value / maxVal) * 100)}%)`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const MetricFunnel: React.FC<MetricFunnelAllProps> = (props) => {
  if (props.frame !== undefined) return <MetricFunnelStatic {...props} frame={props.frame} />;
  return <MetricFunnelRemotion {...props} />;
};

// ─── ScatterPlot ──────────────────────────────────────────────
interface CoordPair {
  x: number;
  y: number;
  color?: string;
  size?: number;
}

interface ScatterPlotProps {
  points: CoordPair[];
  width: number;
  height: number;
  gridSize?: number;
  pointSize?: number;
  showGrid?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type ScatterPlotAllProps = ScatterPlotProps & { frame?: number };

function ScatterPlotStatic({ points, width, height, gridSize = 20, pointSize = 6, showGrid = true, glowConfig, animDuration = 30, delay = 0, frame }: Required<ScatterPlotAllProps>) {
  return <ScatterPlotSvg points={points} width={width} height={height} gridSize={gridSize} pointSize={pointSize} showGrid={showGrid} glowConfig={glowConfig} animDuration={animDuration} delay={delay} frame={frame} />;
}

function ScatterPlotRemotion(props: ScatterPlotProps) {
  const frame = useCurrentFrame();
  return <ScatterPlotSvg {...props} frame={frame} animDuration={props.animDuration ?? 30} delay={props.delay ?? 0} />;
}

function ScatterPlotSvg({ points, width, height, gridSize = 20, pointSize = 6, showGrid = true, glowConfig, frame, animDuration, delay }: ScatterPlotAllProps & { animDuration: number; delay: number; gridSize: number; pointSize: number; showGrid: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

  return (
    <svg width={width} height={height} style={glowCSS(glowConfig)}>
      {showGrid && (
        <g stroke="#374151" strokeWidth={1}>
          {Array.from({ length: Math.floor(width / gridSize) }).map((_, i) => (
            <line key={`v${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={height} />
          ))}
          {Array.from({ length: Math.floor(height / gridSize) }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * gridSize} x2={width} y2={i * gridSize} />
          ))}
        </g>
      )}
      {points.map((p, i) => {
        const localP = Math.min(Math.max(0, adjusted - i * 2) / animDuration, 1);
        const springScale = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(localP);
        const r = (p.size ?? pointSize) * springScale;
        return (
          <circle key={i} cx={p.x} cy={p.y} r={r} fill={p.color ?? colors[i % colors.length]} opacity={localP} />
        );
      })}
    </svg>
  );
}

export const ScatterPlot: React.FC<ScatterPlotAllProps> = (props) => {
  if (props.frame !== undefined) return <ScatterPlotStatic {...props} frame={props.frame} />;
  return <ScatterPlotRemotion {...props} />;
};

// ─── SparklineTicker ──────────────────────────────────────────
interface SparklineTickerProps {
  data: number[];
  width: number;
  height: number;
  lineColor?: string;
  lineWidth?: number;
  showDot?: boolean;
  glowConfig?: GlowConfig;
  animDuration?: number;
  delay?: number;
}

type SparklineTickerAllProps = SparklineTickerProps & { frame?: number };

function SparklineTickerStatic({ data, width, height, lineColor = '#6366f1', lineWidth = 2, showDot = true, glowConfig, animDuration = 30, delay = 0, frame }: Required<SparklineTickerAllProps>) {
  return <SparklineSvg data={data} width={width} height={height} lineColor={lineColor} lineWidth={lineWidth} showDot={showDot} glowConfig={glowConfig} animDuration={animDuration} delay={delay} frame={frame} />;
}

function SparklineTickerRemotion(props: SparklineTickerProps) {
  const frame = useCurrentFrame();
  return <SparklineSvg {...props} frame={frame} animDuration={props.animDuration ?? 30} delay={props.delay ?? 0} />;
}

function SparklineSvg({ data, width, height, lineColor = '#6366f1', lineWidth = 2, showDot = true, glowConfig, frame, animDuration, delay }: SparklineTickerAllProps & { animDuration: number; delay: number; showDot: boolean }) {
  const adjusted = Math.max(0, frame - delay);
  const progress = Math.min(adjusted / animDuration, 1);

  const max = Math.max(...data, 1);
  const stepX = width / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => `${i * stepX},${height - (v / max) * height}`);
  const lastPoint = points[points.length - 1]?.split(',');

  const totalLength = 1000;
  const drawnLength = totalLength * progress;
  const visibleCount = Math.min(data.length, Math.ceil(progress * data.length));
  const currentPoint = points[Math.min(visibleCount - 1, points.length - 1)]?.split(',');

  return (
    <svg width={width} height={height} style={glowCSS(glowConfig)}>
      {points.length > 1 && (
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth={lineWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength - drawnLength}
          pathLength={totalLength}
        />
      )}
      {showDot && currentPoint && (
        <circle cx={currentPoint[0]} cy={currentPoint[1]} r={3} fill={lineColor} />
      )}
    </svg>
  );
}

export const SparklineTicker: React.FC<SparklineTickerAllProps> = (props) => {
  if (props.frame !== undefined) return <SparklineTickerStatic {...props} frame={props.frame} />;
  return <SparklineTickerRemotion {...props} />;
};
