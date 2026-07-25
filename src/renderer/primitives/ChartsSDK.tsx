import React from 'react';

// Compatibility stubs for other charts (wiped and waiting for redesigns)
export const SparklineTicker: React.FC<any> = () => null;

// Export our new premium BarChartCard and alias it as BarChart for backwards compatibility
export * from './charts/BarChartCard';
export { BarChartCard as BarChart } from './charts/BarChartCard';
export type { BarChartCardProps } from './charts/BarChartCard';

// Export our new premium AreaChartCard and alias it as AreaChart for backwards compatibility
export * from './charts/AreaChartCard';
export { AreaChartCard as AreaChart } from './charts/AreaChartCard';
export type { AreaChartCardProps } from './charts/AreaChartCard';


// Export our new premium ScatterPlotCard and alias it as ScatterPlot for backwards compatibility
export * from './charts/ScatterPlotCard';
export { ScatterPlotCard as ScatterPlot } from './charts/ScatterPlotCard';
export type { ScatterPlotCardProps } from './charts/ScatterPlotCard';

// Export our new premium LineChartCard and alias it as LineChart for backwards compatibility
export * from './charts/LineChartCard';
export { LineChartCard as LineChart } from './charts/LineChartCard';
export type { LineChartCardProps } from './charts/LineChartCard';

// Export our new premium PieChartCard and alias it as PieChart for backwards compatibility
export * from './charts/PieChartCard';
export { PieChartCard as PieChart } from './charts/PieChartCard';
export type { PieChartCardProps } from './charts/PieChartCard';

// Export our new premium DonutChartCard and alias it as DonutChart for backwards compatibility
export * from './charts/DonutChartCard';
export { DonutChartCard as DonutChart } from './charts/DonutChartCard';
export type { DonutChartCardProps } from './charts/DonutChartCard';

// Export our new premium MetricFunnelCard and alias it as MetricFunnel for backwards compatibility
export * from './charts/MetricFunnelCard';
export { MetricFunnelCard as MetricFunnel } from './charts/MetricFunnelCard';
export type { MetricFunnelCardProps } from './charts/MetricFunnelCard';

// Export our new premium StockCard
export * from './charts/StockCard';
export type { StockCardProps } from './charts/StockCard';

