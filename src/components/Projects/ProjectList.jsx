import React, { useState } from 'react';
import { Plus, FolderKanban, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function ProjectList({
  projects,
  tasks,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onSelectProject,
}) {
  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#ff5252]" />
            Daftar Proyek
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola kategori tugas dan pelacak waktu Anda
          </p>
        </div>
        <button
          onClick={onAddProject}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff5252] hover:bg-[#ff3b3b] text-white font-bold text-xs shadow-lg shadow-[#ff5252]/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Proyek Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {projects.map((project) => {
          const IconComp = Icons[project.icon] || Icons.Folder;
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const completedTasks = projectTasks.filter((t) => t.completed).length;
          const totalPomos = projectTasks.reduce((acc, t) => acc + (t.completedPomos || 0), 0);

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group bg-[#1c1c24] hover:bg-[#252530] border border-[#2e2e3a] rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between"
            >
              {/* Color strip on left */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: project.color }}
              />

              <div className="flex items-center gap-3 pl-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${project.color}15`,
                    color: project.color,
                    border: `1px solid ${project.color}30`,
                  }}
                >
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-[#ff5252] transition">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2ecc71]" />
                      {completedTasks}/{projectTasks.length} Tugas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#ffb142]" />
                      {totalPomos} Sesi
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEditProject(project)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                  title="Edit Proyek"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {projects.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus proyek "${project.name}"?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-[#ff5252] hover:bg-[#ff5252]/10 transition"
                    title="Hapus Proyek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
