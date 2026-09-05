const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

if (!content.includes('GraduationCap')) {
  content = content.replace('SettingsIcon,', 'SettingsIcon,\n  GraduationCap,');
  content = content.replace(
    "{ id: 'progress', label: 'Progresso', icon: TrendingUp },",
    "{ id: 'progress', label: 'Progresso', icon: TrendingUp },\n    { id: 'classroom', label: 'Classroom', icon: GraduationCap },"
  );
  fs.writeFileSync('src/components/Layout.tsx', content);
}
