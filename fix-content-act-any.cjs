const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

code = code.replace(/onChange=\{\(e\) => act\._editTitle = e\.target\.value\}/g, "onChange={(e) => (act as any)._editTitle = e.target.value}");
code = code.replace(/onChange=\{\(e\) => act\._editType = e\.target\.value\}/g, "onChange={(e) => (act as any)._editType = e.target.value}");
code = code.replace(/onChange=\{\(e\) => act\._editDuration = e\.target\.value\}/g, "onChange={(e) => (act as any)._editDuration = e.target.value}");
code = code.replace(/onChange=\{\(e\) => act\._editSource = e\.target\.value\}/g, "onChange={(e) => (act as any)._editSource = e.target.value}");
code = code.replace(/act\._editTitle !== undefined \? act\._editTitle/g, "(act as any)._editTitle !== undefined ? (act as any)._editTitle");
code = code.replace(/act\._editType \|\| act\.type/g, "(act as any)._editType || act.type");
code = code.replace(/act\._editSource !== undefined \? act\._editSource/g, "(act as any)._editSource !== undefined ? (act as any)._editSource");
code = code.replace(/act\._editDuration !== undefined \? act\._editDuration/g, "(act as any)._editDuration !== undefined ? (act as any)._editDuration");

fs.writeFileSync('src/components/Content.tsx', code);
