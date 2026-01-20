
import React, { useState } from 'react';
import { Todo, Priority } from '../types';
import { getSmartSubtasks } from '../services/geminiService';

interface TaskCardProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    high: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${styles[priority]}`}>
      {priority}
    </span>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ todo, onToggle, onDelete }) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subtasks.length > 0) {
      setIsExpanding(!isExpanding);
      return;
    }
    setLoadingAi(true);
    const result = await getSmartSubtasks(todo.title, todo.description || '');
    setSubtasks(result);
    setLoadingAi(false);
    setIsExpanding(true);
  };

  return (
    <div className={`group bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${todo.is_completed ? 'bg-gray-50/50' : 'hover:-translate-y-0.5'}`}>
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(todo.id, !todo.is_completed)}
          className={`mt-1.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            todo.is_completed 
              ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-100' 
              : 'border-gray-200 hover:border-indigo-300 bg-white'
          }`}
        >
          {todo.is_completed && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className={`font-bold text-[15px] transition-all ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {todo.title}
            </h3>
            <PriorityBadge priority={todo.priority} />
          </div>
          
          {todo.description && (
            <p className={`text-xs leading-relaxed mb-3 ${todo.is_completed ? 'text-gray-300' : 'text-gray-500'}`}>
              {todo.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${todo.is_completed ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
              # {todo.category}
            </span>
            {todo.due_date && (
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(todo.due_date).toLocaleDateString('ko-KR')}까지
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAiBreakdown}
            className={`p-2 rounded-xl transition-all ${isExpanding ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
            title="AI 하위 단계 생성"
          >
            {loadingAi ? (
               <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanding && subtasks.length > 0 && (
        <div className="mt-5 pl-10 pr-4 py-4 bg-gray-50/80 rounded-2xl border-l-4 border-indigo-400 animate-in slide-in-from-top-2 duration-300">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">AI가 추천하는 구체적 단계</h4>
          <ul className="space-y-2.5">
            {subtasks.map((st, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full" />
                <span className="flex-1 leading-relaxed">{st}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
