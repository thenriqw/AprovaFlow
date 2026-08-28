import React, { useState, useEffect, useRef } from 'react';
import { useStore, ErrorReason, ActivityType } from '../store';
import { formatTime } from '../lib/formatters';
import { Play, Pause, Square, Save, Timer as TimerIcon, Hourglass } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Timer() {
    const { addSession, activeTask, setActiveTask, completeCycleItem, recalculateRoute, setActiveTab, userProfile } = useStore();
  
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('Videoaula');
  const [source, setSource] = useState('');
  const [questions, setQuestions] = useState({ total: '', correct: '', errorReason: '' as ErrorReason });
  const [difficulty, setDifficulty] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [observation, setObservation] = useState('');

  // Sync with activeTask if present
  useEffect(() => {
    if (activeTask) {
      setSubject(activeTask.subject);
      setTopic(activeTask.topic);
      if (activeTask.activityType) setActivityType(activeTask.activityType);
      if (activeTask.source) setSource(activeTask.source);
    } else if (userProfile?.subjects && userProfile.subjects.length > 0) {
      setSubject(userProfile.subjects[0].name);
    }
  }, [activeTask, userProfile]);

  // Anti-sleep timer logic using Date.now()
  useEffect(() => {
    let intervalId: number;
    if (isRunning) {
      intervalId = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
          
          if (mode === 'pomodoro' && elapsed >= pomodoroMinutes * 60) {
            setIsRunning(false);
            // Optional: Play a sound here
          }
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, mode, pomodoroMinutes]);

  const toggleTimer = () => {
    if (!isRunning) {
      // Resume or Start
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
    }
    setIsRunning(!isRunning);
  };

  const finishSession = () => {
    setIsRunning(false);
    setIsFinished(true);
  };

  const saveSession = () => {
    let currentSubjectId = activeTask?.subjectId;
    let currentTopicId = activeTask?.topicId;

    if (!currentSubjectId && userProfile) {
      const foundSubj = userProfile.subjects.find(s => s.name === subject);
      if (foundSubj) {
        currentSubjectId = foundSubj.id;
        const foundTopic = foundSubj.topics.find(t => t.name === topic);
        if (foundTopic) {
          currentTopicId = foundTopic.id;
        }
      }
    }

    addSession({
      subjectId: currentSubjectId,
      topicId: currentTopicId,
      subject: subject || 'Livre',
      topic,
      activityType,
      source,
      durationSeconds: elapsedTime,
      questionsTotal: parseInt(questions.total) || 0,
      questionsCorrect: parseInt(questions.correct) || 0,
      errorReason: questions.errorReason,
      difficulty,
      observation,
    });
    
    // Complete in cycle if it matches
    if (activeTask && activeTask.subject === subject && activeTask.topic === topic) {
      if (activeTask.id) {
        completeCycleItem(activeTask.id);
      }
      setActiveTask(null);
    }
    
    // Automatically recalculate priorities based on the new session
    recalculateRoute();
    
    // Reset
    setIsFinished(false);
    setElapsedTime(0);
    setQuestions({ total: '', correct: '', errorReason: '' });
    setObservation('');
    setDifficulty(undefined);
    
    // Navigate to dashboard
    setActiveTab('dashboard');
  };

  const displayTime = mode === 'pomodoro' 
    ? Math.max(0, (pomodoroMinutes * 60) - elapsedTime)
    : elapsedTime;

  const currentSubjectObj = userProfile?.subjects.find(s => s.name === subject);
  const availableTopics = currentSubjectObj?.topics || [];

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{activeTask ? 'Execução do Ciclo' : 'Modo Livre'}</h1>
        <p className="text-neutral-500 mt-2">{activeTask ? 'Execute a tarefa recomendada.' : 'Inicie o cronômetro instantaneamente sem depender de um cronograma.'}</p>
      </header>

      <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center">
        {!isFinished ? (
          <div className="w-full flex flex-col items-center">
            
            {/* Mode Switcher */}
            <div className="flex bg-neutral-100 p-1 rounded-xl mb-8">
              <button 
                onClick={() => { setMode('stopwatch'); setElapsedTime(0); setIsRunning(false); }}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === 'stopwatch' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500")}
              >
                <TimerIcon size={16} /> Cronômetro
              </button>
              <button 
                onClick={() => { setMode('pomodoro'); setElapsedTime(0); setIsRunning(false); }}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === 'pomodoro' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500")}
              >
                <Hourglass size={16} /> Pomodoro
              </button>
            </div>

            {/* Inputs */}
            <div className="w-full grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Matéria</label>
                {userProfile?.subjects && userProfile.subjects.length > 0 ? (
                  <select 
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setTopic(''); }}
                    className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                    disabled={isRunning && elapsedTime > 0 || !!activeTask}
                  >
                    <option value="">Selecione...</option>
                    {userProfile.subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Física"
                    className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                    disabled={isRunning && elapsedTime > 0 || !!activeTask}
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Assunto</label>
                {availableTopics.length > 0 && !activeTask ? (
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                    disabled={isRunning && elapsedTime > 0}
                  >
                    <option value="">Livre...</option>
                    {availableTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Cinemática"
                    className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                    disabled={isRunning && elapsedTime > 0 || !!activeTask}
                  />
                )}
              </div>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Atividade</label>
                <select 
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                  className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  disabled={isRunning && elapsedTime > 0}
                >
                  {['Videoaula', 'Aula presencial', 'Teoria', 'Apostila/Leitura', 'Questões', 'Revisão', 'Simulado', 'Redação', 'Flashcards', 'Estudo livre', 'Outro'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Fonte (Opcional)</label>
                <input 
                  type="text" 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ex: Aprova Total, YouTube..."
                  className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  disabled={isRunning && elapsedTime > 0}
                />
              </div>
            </div>

            {mode === 'pomodoro' && elapsedTime === 0 && !isRunning && (
              <div className="mb-6 flex gap-2">
                {[15, 25, 30, 50].map(min => (
                  <button 
                    key={min}
                    onClick={() => setPomodoroMinutes(min)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-bold border transition-colors",
                      pomodoroMinutes === min 
                        ? "bg-neutral-900 border-neutral-900 text-white" 
                        : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                    )}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            )}

            {/* Timer Display */}
            <div className="text-7xl md:text-8xl font-black font-mono tracking-tighter text-neutral-900 mb-10 tabular-nums">
              {formatTime(displayTime)}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 w-full">
              <div className="flex gap-4 w-full">
                <button 
                  onClick={toggleTimer}
                  className={cn(
                    "flex-1 py-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2",
                    isRunning 
                      ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200" 
                      : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/20"
                  )}
                >
                  {isRunning ? <><Pause size={24}/> Pausar</> : <><Play size={24} className="ml-1"/> {elapsedTime > 0 ? 'Retomar' : 'Iniciar Foco'}</>}
                </button>
                
                {elapsedTime > 0 && !isRunning && (
                  <button 
                    onClick={finishSession}
                    className="px-8 py-4 rounded-2xl text-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                  >
                    <Square size={24} className="fill-current"/> Finalizar
                  </button>
                )}
              </div>
              
              {elapsedTime > 0 && !isRunning && (
                <button 
                  onClick={() => {
                    if (confirm("Deseja realmente cancelar esta sessão? O tempo não será salvo.")) {
                      setElapsedTime(0);
                      setIsFinished(false);
                      setActiveTask(null);
                    }
                  }}
                  className="w-full py-3 text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Cancelar Sessão
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Sessão Concluída</h2>
              <p className="text-neutral-500 font-medium">Tempo focado: <span className="text-neutral-900">{formatTime(elapsedTime)}</span></p>
            </div>
            
            <div className="space-y-6">
              
              {/* Show questions only if activityType implies practice */}
              {['Questões', 'Simulado', 'Revisão'].includes(activityType) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Questões Feitas</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        value={questions.total}
                        onChange={(e) => setQuestions({...questions, total: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Acertos</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        value={questions.correct}
                        onChange={(e) => setQuestions({...questions, correct: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-neutral-900 mb-2 block">Causa dos Erros (Opcional)</label>
                    <select 
                      className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 text-base font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 appearance-none"
                      value={questions.errorReason}
                      onChange={(e) => setQuestions({...questions, errorReason: e.target.value as ErrorReason})}
                    >
                      <option value="">Não mapear</option>
                      <option value="teoria">Falta de Teoria</option>
                      <option value="interpretacao">Interpretação</option>
                      <option value="atencao">Falta de Atenção</option>
                      <option value="tempo">Pressão do Tempo</option>
                      <option value="calculo">Erro de Cálculo</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="text-sm font-semibold text-neutral-900 mb-2 block">Dificuldade Percebida (Opcional)</label>
                <select 
                  className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 text-base font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 appearance-none"
                  value={difficulty || ''}
                  onChange={(e) => setDifficulty((e.target.value as any) || undefined)}
                >
                  <option value="">Selecione...</option>
                  <option value="low">Fácil - Fluiu bem</option>
                  <option value="medium">Média - Alguns obstáculos</option>
                  <option value="high">Difícil - Muito travado</option>
                </select>
              </div>

              <button 
                onClick={saveSession}
                className="w-full py-4 mt-4 rounded-2xl text-lg font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Salvar no Histórico
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
