import React from 'react';
import * as Icons from 'lucide-react';

export default function ProjectBadge({ project, size = 'sm', showName = true }) {
  if (!project) return null;
  
  const IconComponent = Icons[project.icon] || Icons.Folder;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium tracking-wide transition-all ${
        isSmall ? 'text-xs' : 'text-sm py-1 px-3'
      }`}
      style={{
        backgroundColor: `${project.color}15`,
        color: project.color,
        border: `1px solid ${project.color}30`,
      }}
    >
      <IconComponent className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      {showName && <span>{project.name}</span>}
    </span>
  );
}
