const fs = require('fs');

let content = fs.readFileSync('src/components/Content.tsx', 'utf8');
content = content.replace(/status: 'pending',/, "status: 'pending' as const,");
fs.writeFileSync('src/components/Content.tsx', content);

let settings = fs.readFileSync('src/components/Settings.tsx', 'utf8');
if (!settings.includes('Database')) {
    settings = settings.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Database } from 'lucide-react';");
    fs.writeFileSync('src/components/Settings.tsx', settings);
} else {
    // maybe it is imported but wait, error said Cannot find name 'Database'.
    settings = settings.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Database } from 'lucide-react';");
    fs.writeFileSync('src/components/Settings.tsx', settings);
}
