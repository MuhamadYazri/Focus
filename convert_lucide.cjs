const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all JSX/JS files
const files = execSync('find src -type f \\( -name "*.jsx" -o -name "*.js" \\)').toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Regex to find `import { A, B, C } from 'lucide-react';`
  const regex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
  
  content = content.replace(regex, (match, p1) => {
    modified = true;
    const icons = p1.split(',').map(s => s.trim()).filter(Boolean);
    const aliased = icons.map(icon => {
      // If it's already aliased like `Calendar as CalendarIcon`
      if (icon.includes(' as ')) {
        const [orig, alias] = icon.split(' as ').map(s => s.trim());
        return `${orig}Icon as ${alias}`;
      }
      return `${icon}Icon as ${icon}`;
    });
    return `import { ${aliased.join(', ')} } from 'lucide-animated'`;
  });

  // Handle `import * as Icons from 'lucide-react'`
  if (content.includes("import * as Icons from 'lucide-react'")) {
    content = content.replace(/import \* as Icons from ['"]lucide-react['"]/g, "import * as Icons from 'lucide-animated'");
    modified = true;
    
    // Also we need to fix any `<Icons.Something ` to `<Icons.SomethingIcon `
    content = content.replace(/<Icons\.([A-Za-z0-9_]+)/g, (match, p1) => {
      if (!p1.endsWith('Icon')) {
        return `<Icons.${p1}Icon`;
      }
      return match;
    });
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
