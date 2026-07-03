import React, { useState, useEffect } from 'react';
import { X, Check, Briefcase, BookOpen, Heart, Rocket, Code, Star, Target, Zap, Coffee, Music } from 'lucide-react';

const COLOR_PALETTE = [
  '#ff5252', '#ffb142', '#34ace0', '#6c5ce7',
  '#2ecc71', '#e84393', '#00cec9', '#fdcb6e',
  '#a55eea', '#26de81', '#fc5c65', '#45aaf2'
];

const ICONS_LIST = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Heart', icon: Heart },
  { name: 'Rocket', icon: Rocket },
  { name: 'Code', icon: Code },
  { name: 'Star', icon: Star },
  { name: 'Target', icon: Target },
  { name: 'Zap', icon: Zap },
  { name: 'Coffee', icon: Coffee },
  { name: 'Music', icon: Music },
];

export default function ProjectModal({ isOpen, onClose, onSave, projectToEdit = null }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [icon, setIcon] = useState('Briefcase');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setColor(projectToEdit.color);
      setIcon(projectToEdit.icon || 'Briefcase');
    } else {
      setName('');
      setColor(COLOR_PALETTE[0]);
      setIcon('Briefcase');
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}`,
      name: name.trim(),
      color,
      icon,
      pomodoros: projectToEdit ? projectToEdit.pomodoros : 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl shadow-2xl p-6 text-white relative">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2e2e3a]">
          <h3 className="text-lg font-bold">
            {projectToEdit ? 'Edit Proyek' : 'Buat Proyek Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Nama Proyek
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kuliah & Tugas Akhir"
              className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff5252] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Warna Proyek
            </label>
            <div className="grid grid-cols-6 gap-2.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110 relative shadow-md"
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <Check className="w-5 h-5 text-black stroke-[3px] drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Ikon Proyek
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS_LIST.map((item) => {
                const IconComp = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-3 rounded-xl flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-white/10 border-[#ff5252] text-[#ff5252] scale-105 shadow-sm'
                        : 'bg-[#131318] border-[#2e2e3a] text-slate-400 hover:text-white'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2e2e3a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#ff5252] hover:bg-[#ff3b3b] text-white shadow-lg shadow-[#ff5252]/20 transition"
            >
              Simpan Proyek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
