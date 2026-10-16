#!/bin/bash
find src -type f \( -name "*.jsx" -o -name "*.js" \) -print0 | while IFS= read -r -d '' file; do
  sed -i 's/shadow-\[0_4px_20px_-2px_rgba(64,81,59,0.06)\]/shadow-md/g' "$file"
  sed -i 's/shadow-\[0_10px_22px_rgba(64,81,59,0.22)\]/shadow-lg/g' "$file"
  sed -i 's/shadow-\[0_4px_16px_-2px_rgba(64,81,59,0.05)\]/shadow-sm/g' "$file"
  sed -i 's/shadow-\[0_10px_22px_rgba(64,81,59,0.35)\]/shadow-lg/g' "$file"
  sed -i 's/shadow-\[0_2px_8px_rgba(64,81,59,0.2)\]/shadow-sm/g' "$file"
  sed -i 's/shadow-\[0_0_8px_rgba(98,129,65,0.4)\]/shadow-sm/g' "$file"
  sed -i 's/shadow-\[var(--shadow-focus)\]/shadow-lg/g' "$file"
  sed -i 's/shadow-\[var(--shadow-soft)\]/shadow-sm/g' "$file"
done
echo "Hardcoded shadows replaced!"
