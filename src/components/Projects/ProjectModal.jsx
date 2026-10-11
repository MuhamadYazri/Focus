import React, { useState, useEffect } from 'react';
import { X, Check, Briefcase, BookOpen, Heart, Rocket, Code, Star, Target, Zap, Coffee, Music } from 'lucide-react';

const COLOR_PALETTE = [
  '#40513B', '#628141', '#E67E22', '#8A7968',
  '#D3A29D', '#A3B18A', '#344E41', '#CB997E',
  '#6B705C', '#B5838D', '#E5989B', '#6D6875'
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
      setColor(projectToEdit.color || COLOR_PALETTE[0]);
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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl ring-1 ring-white/80 relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-sub tracking-widest font-sans uppercase">
              FOCUS // CATEGORY
            </span>
            <h3 className="text-lg font-bold text-text-main mt-0.5 font-sans tracking-tight">
              {projectToEdit ? 'Edit Category' : 'New Category'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-sub hover:text-text-main transition-colors border border-border shadow-2xs"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-[11px] font-bold text-text-sub uppercase tracking-widest font-sans">
              Category Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. WORK_PROJECTS"
              className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-sm font-sans text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-sub/50 shadow-inner"
            />
          </div>

          <div>
            <label className="block mb-2 text-[11px] font-bold text-text-sub uppercase tracking-widest font-sans">
              Accent Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-full aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xs ring-1 ring-black/10"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 3px var(--theme-surface), 0 0 0 5px ${c}` : undefined,
                  }}
                >
                  {color === c && (
                    <Check className="w-4 h-4 text-white stroke-[3px]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[11px] font-bold text-text-sub uppercase tracking-widest font-sans">
              Category Icon
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
                    className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                      isSelected 
                        ? 'bg-primary border-primary text-white scale-105 shadow-sm shadow-primary/25 ring-1 ring-white/20' 
                        : 'bg-surface-hover border-border text-text-sub hover:bg-border shadow-2xs'
                    }`}
                  >
                    <IconComp size={20} strokeWidth={isSelected ? 2.5 : 2} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-sub hover:bg-surface-hover hover:text-text-main transition-colors font-sans shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-primary/25 ring-1 ring-white/20 font-sans"
            >
              {projectToEdit ? 'Save Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
