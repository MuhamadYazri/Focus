import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Briefcase, BookOpen, Heart, Rocket, Code, Star, Target, Zap, Coffee, Music } from 'lucide-react';

const COLOR_PALETTE = [
  '#1B1F1A', '#41493F', '#667463', '#8B9E87',
  '#B1C9AC', '#D6F3D0', '#344E41', '#588157',
  '#A3B18A', '#6D6875', '#B5838D', '#8A7968'
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

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 animate-fadeIn select-none"
      style={{
        background: 'rgba(26, 31, 24, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface border border-[#263124] rounded-3xl p-6 shadow-2xl ring-1 ring-white/10 dark:ring-white/5 relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-sub tracking-widest font-mono uppercase">
              FOCUS // CATEGORY
            </span>
            <h3 className="text-lg font-bold text-text-main mt-0.5 font-display tracking-tight">
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
            <label className="block mb-2 text-[10px] font-bold text-text-sub uppercase tracking-widest font-mono">
              Category Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deep Work, Learning"
              className="w-full bg-canvas border border-[#263124] rounded-xl px-4 py-3 text-sm font-sans text-text-main outline-none focus:border-secondary transition-all placeholder:text-text-sub/50 shadow-inner"
            />
          </div>

          <div>
            <label className="block mb-2 text-[10px] font-bold text-text-sub uppercase tracking-widest font-mono">
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
                    <Check
                      className={`w-4 h-4 stroke-[3px] ${
                        c === '#D6F3D0' || c === '#B1C9AC' || c === '#8B9E87' || c === '#A3B18A'
                          ? 'text-ink-dark'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[10px] font-bold text-text-sub uppercase tracking-widest font-mono">
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
                        ? 'bg-primary border-primary text-[#121512] dark:text-[#121512] scale-105 shadow-sm' 
                        : 'bg-surface-hover border-[#263124] text-text-sub hover:bg-border shadow-2xs'
                    }`}
                  >
                    <IconComp size={20} strokeWidth={isSelected ? 2.5 : 2} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[#263124]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-text-main bg-surface-hover hover:bg-border transition-colors font-sans border border-[#263124] shadow-2xs active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-primary text-[#121512] dark:text-[#121512] hover:bg-primary-hover active:scale-95 transition-all shadow-md font-sans"
            >
              {projectToEdit ? 'Save Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
