const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  /match \/plans\/\{planId\} \{/,
  `match /imports/{importId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /plans/{planId} {`
);

fs.writeFileSync('firestore.rules', code);
