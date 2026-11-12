import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { StockStatus } from '../types';

export interface SparklineProps {
  movementDates: string[]; // List of movement dates for each SKU
  asOfDate?: string;       // Measurement reference date (YYYY-MM-DD)
  status?: StockStatus;    // 'Dead' | 'Slow' | 'Moving'
  width?: number;
  height?: number;
  className?: string;
}

/**
 * SVG-based Sparkline component powered by D3.js.
 * Accepts a list of movement dates for each SKU and renders a tiny, responsive
 * trend line visualizing movement frequency over the last 12 months.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  movementDates = [],
  asOfDate = '2026-10-01',
  status = 'Moving',
  width = 84,
  height = 24,
  className = '',
}) => {
  // Aggregate movement frequency into 12 monthly bins leading up to asOfDate
  const monthlyData = useMemo(() => {
    const asOf = new Date(asOfDate + 'T00:00:00Z');
    const bins: { monthLabel: string; count: number; active: boolean }[] = [];

    // Parse all dates to timestamps
    const timestamps = movementDates
      .map((d) => new Date(d + 'T00:00:00Z').getTime())
      .filter((t) => !isNaN(t));

    // Create 12 monthly bins: m = 11 down to 0
    for (let m = 11; m >= 0; m--) {
      const start = new Date(asOf);
      start.setMonth(start.getMonth() - m);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);

      const monthName = start.toLocaleString('en-US', { month: 'short' });
      const yearShort = String(start.getFullYear()).slice(-2);

      // Count occurrences in this month
      const count = timestamps.filter((t) => t >= start.getTime() && t <= end.getTime()).length;

      bins.push({
        monthLabel: `${monthName} '${yearShort}`,
        count,
        active: count > 0,
      });
    }

    return bins;
  }, [movementDates, asOfDate]);

  // Total movements over last 12 months
  const totalMovementsInYear = useMemo(() => {
    return monthlyData.reduce((acc, b) => acc + b.count, 0);
  }, [monthlyData]);

  // Compute D3 paths and scales
  const { pathData, areaData, points, strokeColor } = useMemo(() => {
    const margin = { top: 3, right: 3, bottom: 3, left: 3 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleLinear()
      .domain([0, monthlyData.length - 1])
      .range([margin.left, margin.left + innerW]);

    const maxCount = Math.max(3, d3.max(monthlyData, (d: { count: number }) => d.count) ?? 0);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxCount])
      .range([margin.top + innerH, margin.top]);

    const lineGenerator = d3
      .line<{ count: number }>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<{ count: number }>()
      .x((_, i) => xScale(i))
      .y0(margin.top + innerH)
      .y1((d) => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const pathData = lineGenerator(monthlyData) || '';
    const areaData = areaGenerator(monthlyData) || '';

    const points = monthlyData.map((d, i) => ({
      ...d,
      x: xScale(i),
      y: yScale(d.count),
    }));

    // Color by status
    let strokeColor = '#10b981'; // Emerald (Moving)
    if (status === 'Dead') {
      strokeColor = '#f43f5e'; // Rose (Dead)
    } else if (status === 'Slow') {
      strokeColor = '#f59e0b'; // Amber (Slow)
    }

    return { pathData, areaData, points, strokeColor };
  }, [monthlyData, status, width, height]);

  // Find latest active month index
  const lastActivePoint = points.filter((p) => p.count > 0).pop();
  const isDead = status === 'Dead';
  const gradId = `spark-grad-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div
      className={`inline-flex items-center group relative cursor-help ${className}`}
      title={`12-Month Movement Frequency: ${totalMovementsInYear} issues across ${movementDates.length} recorded dates\nStatus: ${status}${
        isDead ? ' (Stalled/Dead pile)' : ''
      }`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="overflow-visible w-full max-w-[84px] h-[24px]"
        aria-label="Movement frequency trend line over last 12 months"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Shaded Area under Curve */}
        <path d={areaData} fill={`url(#${gradId})`} />

        {/* D3 SVG Line */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Marker dot on the last month with recorded movement */}
        {lastActivePoint && (
          <circle
            cx={lastActivePoint.x}
            cy={lastActivePoint.y}
            r={2}
            fill={strokeColor}
            className="transition-transform"
          />
        )}

        {/* Flatline warning dot at the final month if currently dead */}
        {isDead && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={1.5}
            fill="#e11d48"
          />
        )}
      </svg>
    </div>
  );
};

export default Sparkline;
