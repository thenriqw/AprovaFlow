const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const regex = /<section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm">[\s\S]*?<\/section>/;
const match = code.match(regex);
if (match) {
  const replacement = `
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Conta Google</h3>
                <p className="text-sm text-neutral-500">Autenticação e sincronização.</p>
              </div>
            </div>
          </div>
          
          {!firebaseUser ? (
            <div className="flex flex-col items-center p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <p className="text-sm text-neutral-500 mb-4 text-center">Para usar a sincronização em nuvem, conecte sua conta Google.</p>
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button w-full sm:w-auto"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color .218s'
                }}
              >
                <div style={{marginRight: '12px'}}>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block', width: '20px', height: '20px'}}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span style={{color: '#3c4043', fontFamily: '"Google Sans",Roboto,Arial,sans-serif'}}>
                  {isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-center gap-4 flex-1">
                  <img src={firebaseUser.photoURL || ''} alt="User" className="w-12 h-12 rounded-full border border-neutral-200" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-neutral-900 truncate">{firebaseUser.displayName}</h4>
                    <p className="text-sm text-neutral-500 truncate">{firebaseUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-900 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Desconectar
                </button>
              </div>
              
              <div className="border-t border-neutral-100 pt-6 mt-6">
                <h4 className="text-sm font-bold text-neutral-900 mb-4">Integrações Workspace</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                     <span className="text-sm font-medium text-neutral-700">Google Drive</span>
                     <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">Não conectado</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                     <span className="text-sm font-medium text-neutral-700">Google Calendar</span>
                     <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">Não conectado</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                     <span className="text-sm font-medium text-neutral-700">Google Tasks</span>
                     <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">Não conectado</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
`;
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/Settings.tsx', code);
}
