const fs = require('fs');
let code = fs.readFileSync('src/components/Progress.tsx', 'utf8');

code = code.replace(/          <\/div>\n          <\/div>\n        <\/div>/, '          </div>\n        </div>');

fs.writeFileSync('src/components/Progress.tsx', code);
