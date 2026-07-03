import React from 'react';
import { BarChart2, Sparkles } from 'lucide-react';
import GanttChart from './GanttChart';
import TrendGraph from './TrendGraph';
import HeatmapGrid from './HeatmapGrid';
import ProjectDonut from './ProjectDonut';

export default function AnalyticsDashboard({ tasks, projects, sessions }) {
  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#ffb142]" />
            Laporan Ilmiah
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analitik mendalam produktivitas & tren waktu Anda
          </p>
        </div>
        <span className="inline-flex items-center gap-1 bg-[#ffb142]/15 border border-[#ffb142]/30 px-2.5 py-1 rounded-full text-[#ffb142] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          Pro Analytics
        </span>
      </div>

      {/* Charts Grid */}
      <div className="space-y-4">
        {/* Trend Graph */}
        <TrendGraph sessions={sessions} tasks={tasks} />

        {/* Heatmap Grid */}
        <HeatmapGrid sessions={sessions} />

        {/* Gantt Chart Timeline */}
        <GanttChart tasks={tasks} projects={projects} />

        {/* Project Donut Breakdown */}
        <ProjectDonut sessions={sessions} projects={projects} />
      </div>
    </div>
  );
}
