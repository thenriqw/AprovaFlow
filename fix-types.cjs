const fs = require('fs');

// Fix Topic type
let typesCode = fs.readFileSync('src/domain/types.ts', 'utf8');
typesCode = typesCode.replace(/export interface Topic \{/, 'export interface Topic {\n  planId?: string;');
fs.writeFileSync('src/domain/types.ts', typesCode);

// Fix CycleItem type
typesCode = fs.readFileSync('src/store.ts', 'utf8');
typesCode = typesCode.replace(/export interface CycleItem \{/, 'export interface CycleItem {\n  reasons?: string[];');
fs.writeFileSync('src/store.ts', typesCode);

