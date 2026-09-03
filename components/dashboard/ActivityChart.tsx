'use client';

import React, { useState } from 'react';
import { Activity, Clock, ShieldCheck, Zap } from 'lucide-react';

interface DataPoint {
  time: string;
  agentExec: number;
  humanInterv: number;
  completedActs: number;
  rate: string;
}

const DATA: DataPoint[] = [
  { time: '00:00', agentExec: 14, humanInterv: 3, completedActs: 8, rate: '+12.4%' },
  { time: '04:00', agentExec: 22, humanInterv: 4, completedActs: 18, rate: '+16.8%' },
  { time: '08:00', agentExec: 58, humanInterv: 12, completedActs: 44, rate: '+21.5%' },
  { time: '12:00', agentExec: 86, humanInterv: 19, completedActs: 72, rate: '+24.11%' },
  { time: '16:00', agentExec: 94, humanInterv: 16, completedActs: 81, rate: '+28.3%' },
  { time: '20:00', agentExec: 68, humanInterv: 9, completedActs: 60, rate: '+22.0%' },
  { time: '24:00', agentExec: 45, humanInterv: 5, completedActs: 38, rate: '+18.7%' },
];

export const ActivityChart: React.FC = () => {
  const [hoverIndex, setHoverIndex] = useState<number>(3); // default hover on 12:00

  // Dimensions for responsive SVG
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = 110;

  const getX = (index: number) => paddingX + (index * (width - 2 * paddingX)) / (DATA.length - 1);
  const getY = (val: number) => height - paddingY - (val * (height - 2 * paddingY)) / maxVal;

  // Build SVG paths
  const makePath = (key: 'agentExec' | 'humanInterv' | 'completedActs') => {
    return DATA.reduce((path, point, i) => {
      const x = getX(i);
      const y = getY(point[key]);
      if (i === 0) return `M ${x},${y}`;
      // Smooth cubic bezier control points
      const prevX = getX(i - 1);
      const prevY = getY(DATA[i - 1][key]);
      const cp1X = prevX + (x - prevX) / 2;
      const cp1Y = prevY;
      const cp2X = prevX + (x - prevX) / 2;
      const cp2Y = y;
      return `${path} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
    }, '');
  };

  const agentPath = makePath('agentExec');
  const humanPath = makePath('humanInterv');
  const completedPath = makePath('completedActs');

  // Gradient area under agent curve
  const areaPath = `${agentPath} L ${getX(DATA.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`;

  const activePoint = DATA[hoverIndex];

  return (
    <div className="bg-white/95 rounded-2xl p-6 border border-zinc-200/80 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Agent Activity</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              Live WebMCP Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time execution velocity, human interventions, and completed actions over a 24-hour cycle.
          </p>
        </div>

        {/* Hover Highlight Metric Card */}
        <div className="flex items-center gap-6 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200/60">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Current Velocity</span>
            <span className="text-base font-extrabold text-emerald-600 font-mono">
              {activePoint.rate}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-200" />
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Inspected Interval</span>
            <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-zinc-400" /> {activePoint.time}
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Summary Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="text-zinc-700 font-medium">Agent executions</span>
            <span className="font-mono text-zinc-400">({activePoint.agentExec})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 ring-2 ring-zinc-200" />
            <span className="text-zinc-700 font-medium">Human interventions</span>
            <span className="font-mono text-zinc-400">({activePoint.humanInterv})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 ring-2 ring-zinc-100" />
            <span className="text-zinc-700 font-medium">Completed actions</span>
            <span className="font-mono text-zinc-400">({activePoint.completedActs})</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 font-mono">
          Hover over data points to inspect
        </div>
      </div>

      {/* Chart SVG */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
            <defs>
              <linearGradient id="agentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
              const y = getY(maxVal * ratio);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#E4E4E7"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {Math.round(maxVal * ratio)}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area Under Agent Line */}
            <path d={areaPath} fill="url(#agentGradient)" />

            {/* Completed Actions Line */}
            <path
              d={completedPath}
              fill="none"
              stroke="#A1A1AA"
              strokeWidth="2"
              strokeDasharray="3 3"
            />

            {/* Human Interventions Line */}
            <path
              d={humanPath}
              fill="none"
              stroke="#18181B"
              strokeWidth="2.5"
            />

            {/* Agent Executions Line */}
            <path
              d={agentPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
            />

            {/* Interactive Vertical Guide & Points */}
            {DATA.map((d, i) => {
              const x = getX(i);
              const isSelected = i === hoverIndex;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                >
                  {/* Invisible broad hitbox for hovering */}
                  <rect
                    x={x - 25}
                    y={0}
                    width={50}
                    height={height}
                    fill="transparent"
                  />

                  {/* Vertical hover line */}
                  {isSelected && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={height - paddingY}
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Points on Agent line */}
                  <circle
                    cx={x}
                    cy={getY(d.agentExec)}
                    r={isSelected ? 6 : 4}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />

                  {/* Points on Human line */}
                  <circle
                    cx={x}
                    cy={getY(d.humanInterv)}
                    r={isSelected ? 5 : 3}
                    fill="#18181B"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-all duration-200"
                  />

                  {/* Time Label on X Axis */}
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className={`text-[11px] font-mono transition-colors ${
                      isSelected ? 'fill-zinc-900 font-bold' : 'fill-zinc-400'
                    }`}
                  >
                    {d.time}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
