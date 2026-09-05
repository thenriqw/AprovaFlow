import React, { useState, useEffect } from 'react';
import { getAccessToken, googleSignIn } from '../lib/firebase';
import { GraduationCap, ExternalLink, FileText, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Classroom() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseWork, setCourseWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    setLoading(true);
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }
    
    setNeedsAuth(false);
    fetchCourses(token);
  };

  const fetchCourses = async (token: string) => {
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (course: any) => {
    setSelectedCourse(course);
    setLoading(true);
    const token = await getAccessToken();
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCourseWork(data.courseWork || []);
    } catch (error) {
      console.error('Error fetching coursework:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result?.accessToken) {
        setNeedsAuth(false);
        fetchCourses(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <GraduationCap size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Conecte o Google Classroom</h2>
        <p className="text-neutral-600 max-w-md mb-8">
          Acesse suas turmas, materiais e atividades diretamente do seu plano de estudos.
        </p>
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="gsi-material-button bg-white text-neutral-600 border border-neutral-300 font-medium py-2 px-4 rounded shadow-sm flex items-center gap-3 hover:bg-neutral-50 transition-colors"
        >
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          {isLoggingIn ? 'Conectando...' : 'Conectar com Google'}
        </button>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="text-neutral-500 hover:text-neutral-900 font-medium text-sm transition-colors"
          >
            ← Voltar às Turmas
          </button>
        </div>

        <div className="bg-neutral-900 text-white p-8 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-serif font-bold mb-2">{selectedCourse.name}</h1>
            <p className="text-neutral-300">{selectedCourse.section || selectedCourse.descriptionHeading || 'Google Classroom'}</p>
          </div>
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
             <GraduationCap size={200} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-500" />
            Atividades ({courseWork.length})
          </h2>

          {courseWork.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-500">
              Nenhuma atividade encontrada para esta turma.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseWork.map(work => {
                let dueDateObj = null;
                if (work.dueDate) {
                  dueDateObj = new Date(work.dueDate.year, work.dueDate.month - 1, work.dueDate.day);
                }
                
                return (
                  <a 
                    key={work.id}
                    href={work.alternateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <h3 className="font-semibold text-neutral-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {work.title}
                        </h3>
                      </div>
                      <ExternalLink size={14} className="text-neutral-400 group-hover:text-blue-500" />
                    </div>
                    
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-4 h-10">
                      {work.description || 'Nenhuma descrição fornecida.'}
                    </p>

                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        {dueDateObj ? (
                          <>
                            <Clock size={14} />
                            Vence: {format(dueDateObj, 'dd/MM/yyyy')}
                          </>
                        ) : (
                          <span className="text-neutral-400">Sem data limite</span>
                        )}
                      </div>
                      <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full">
                        {work.maxPoints ? `${work.maxPoints} pts` : 'Sem nota'}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            Classroom
          </h1>
          <p className="text-neutral-500 mt-2">
            Acompanhe suas turmas e atividades do Google Classroom.
          </p>
        </div>
      </header>

      {courses.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-500">
          Nenhuma turma encontrada na sua conta.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div 
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col"
            >
              <div className="h-24 bg-neutral-800 p-5 relative overflow-hidden flex-shrink-0">
                <h3 className="text-white font-semibold text-lg line-clamp-1 relative z-10">{course.name}</h3>
                <p className="text-white/70 text-sm mt-1 relative z-10">{course.section}</p>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                  <GraduationCap size={100} />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                  {course.descriptionHeading || course.description || 'Turma do Google Classroom'}
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Ver Atividades &rarr;
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
