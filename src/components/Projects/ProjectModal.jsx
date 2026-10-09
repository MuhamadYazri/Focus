import React, { useState, useEffect } from 'react';
import { X, Check, Briefcase, BookOpen, Heart, Rocket, Code, Star, Target, Zap, Coffee, Music } from 'lucide-react';

const G = "'Poppins', sans-serif";
const M = "'Poppins', sans-serif";

const COLOR_PALETTE = [
  'var(--accent)', 'var(--text-secondary)', '#4A7090', 'var(--text-secondary)',
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none animate-fadeIn`}
      style={{ background: 'rgba(10, 38, 53, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border rounded-2xl shadow-[var(--shadow-focus)] p-5 relative animate-slideUp"
        style={{ fontFamily: G, background: 'var(--surface-card)', borderColor: 'var(--surface-border)', color: 'var(--text-on-accent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b" style={{ borderColor: 'var(--surface-border)' }}>
          <div>
            <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
              FOCUS // CATEGORY
            </span>
            <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-on-accent)' }}>
              {projectToEdit ? 'Edit Category' : 'New Category'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-low)',
              color: 'var(--text-muted)'
            }}
            className="flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-50"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
              className="block mb-2 uppercase"
            >
              Category Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 04 // WORK_PROJECTS"
              style={{
                width: '100%',
                background: 'var(--surface-low)',
                border: '1px solid var(--surface-border)',
                borderRadius: 8,
                padding: '11px 14px',
                fontFamily: G,
                fontSize: 14,
                color: 'var(--text-on-accent)',
                outline: 'none',
                caretColor: 'var(--accent)',
              }}
            />
          </div>

          <div>
            <label
              style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
              className="block mb-2 uppercase"
            >
              Accent Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'var(--text-primary)' : 'transparent',
                  }}
                >
                  {color === c && (
                    <Check className="w-4 h-4 text-[var(--text-primary)] stroke-[3px]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
              className="block mb-2 uppercase"
            >
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
                    className="p-2.5 rounded-lg flex items-center justify-center border transition"
                    style={{
                      background: isSelected ? 'var(--accent)' : 'var(--surface-low)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--surface-border)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--surface-border)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: M,
                fontSize: 11,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--surface-border)',
                color: 'var(--text-secondary)',
                background: 'transparent',
              }}
              className="hover:opacity-70 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                fontFamily: G,
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
              }}
              className="hover:opacity-90 transition active:opacity-80"
            >
              {projectToEdit ? 'Save Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
