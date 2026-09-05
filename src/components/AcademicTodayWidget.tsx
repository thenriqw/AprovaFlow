import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../lib/firebase';
import { GraduationCap, ExternalLink, Clock } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export default function AcademicTodayWidget() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const token = await getAccessToken();
    if (!token) {
      setHasToken(false);
      setLoading(false);
      return;
    }
    setHasToken(true);

    try {
      // First fetch active courses
      const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (coursesRes.status === 401) {
        setHasToken(false);
        setLoading(false);
        return;
      }
      const coursesData = await coursesRes.json();
      const courses = coursesData.courses || [];

      let allTasks: any[] = [];
      const now = new Date();
      const limitDate = addDays(now, 2); // next 48 hours (2 days)

      // Fetch coursework for each course
      for (const course of courses) {
        const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const cwData = await cwRes.json();
        const courseWork = cwData.courseWork || [];

        // filter those due within 48 hours
        courseWork.forEach((work: any) => {
          if (work.dueDate) {
            // Google Classroom returns date as { year, month, day } and time as { hours, minutes } in UTC
            const dueDateTime = new Date(
              work.dueDate.year,
              work.dueDate.month - 1,
              work.dueDate.day,
              work.dueTime?.hours || 23,
              work.dueTime?.minutes || 59
            );
            
            // Only upcoming tasks within 48h
            if (isAfter(dueDateTime, now) && isBefore(dueDateTime, limitDate)) {
              allTasks.push({
                ...work,
                courseName: course.name,
                dueDateTime
              });
            }
          }
        });
      }

      // Sort by due date
      allTasks.sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime());
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching academic tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!hasToken) {
    return null; // Silently hide if not connected to avoid spamming the user
  }

  if (tasks.length === 0) {
    return null; // Hide if no tasks due in 48 hours
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold tracking-wider uppercase text-neutral-500 ml-1 flex items-center gap-2">
        <GraduationCap size={16} /> 
        Vencendo em breve (Classroom)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map(task => (
          <a
            key={task.id}
            href={task.alternateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-neutral-900 text-white border border-neutral-800 rounded-xl p-5 hover:bg-neutral-800 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase tracking-wider rounded">
                  {task.courseName}
                </span>
                <h3 className="font-semibold mt-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {task.title}
                </h3>
              </div>
              <ExternalLink size={14} className="text-neutral-500 group-hover:text-blue-400 shrink-0 ml-2" />
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium mt-4">
              <Clock size={14} />
              Vence: {format(task.dueDateTime, "dd/MM 'às' HH:mm")}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
