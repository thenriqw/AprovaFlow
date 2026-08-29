const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const replacement = `
      deleteV2Topic: (id) => set(state => {
        const v2Topics = state.v2Topics.filter(t => t.id !== id);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ deletePlanDocument }) => 
            deletePlanDocument(state.firebaseUser.uid, state.activePlanId, 'topics', id)
          ).catch(console.error);
        }
        return { v2Topics };
      }),
      addV2Activity: (activity) => set(state => {
        const v2Activities = [...state.v2Activities, activity];
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', activity)
          ).catch(console.error);
        }
        return { v2Activities };
      }),
      updateV2Activity: (activity) => set(state => {
        const v2Activities = state.v2Activities.map(a => a.id === activity.id ? activity : a);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', activity)
          ).catch(console.error);
        }
        return { v2Activities };
      }),
      deleteV2Activity: (id) => set(state => {
        const v2Activities = state.v2Activities.filter(a => a.id !== id);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ deletePlanDocument }) => 
            deletePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', id)
          ).catch(console.error);
        }
        return { v2Activities };
      }),
`;

code = code.replace(/      deleteV2Topic: \(id\) => set\(state => \{[\s\S]*?return \{ v2Topics \};\n      \}\),/, replacement);

const typesReplacement = `  deleteV2Topic: (id: string) => void;
  addV2Activity: (activity: StudyActivity) => void;
  updateV2Activity: (activity: StudyActivity) => void;
  deleteV2Activity: (id: string) => void;`;
  
code = code.replace(/  deleteV2Topic: \(id: string\) => void;/, typesReplacement);

fs.writeFileSync('src/store.ts', code);
