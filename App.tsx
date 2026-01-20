
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from './services/supabase';
import { Todo, Priority } from './types';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { suggestTasksByGoal } from './services/geminiService';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [aiGoal, setAiGoal] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch error:', error);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTask = async (task: { title: string; description: string; priority: Priority; category: string; due_date: string | null }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, is_completed: false }])
      .select();

    if (!error && data) {
      setTodos([data[0], ...todos]);
    }
  };

  const toggleTodo = async (id: string, is_completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed })
      .eq('id', id);

    if (!error) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed } : t));
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTodos(prev => prev.filter(t => t.id !== id));
    }
  };

  const clearCompleted = async () => {
    const completedIds = todos.filter(t => t.is_completed).map(t => t.id);
    if (completedIds.length === 0) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', completedIds);

    if (!error) {
      setTodos(prev => prev.filter(t => !t.is_completed));
    }
  };

  const handleAiSuggestions = async () => {
    if (!aiGoal.trim()) return;
    setIsAiLoading(true);
    const suggestions = await suggestTasksByGoal(aiGoal);
    
    const formattedSuggestions = suggestions.map((s: any) => ({
      title: s.title,
      description: `AI Suggested task for: ${aiGoal}`,
      priority: (['low', 'medium', 'high'].includes(s.priority) ? s.priority : 'medium') as Priority,
      category: s.category || 'Goal',
      is_completed: false
    }));

    const { data, error } = await supabase
      .from('tasks')
      .insert(formattedSuggestions)
      .select();

    if (!error && data) {
      setTodos(prev => [...data, ...prev]);
      setAiGoal('');
    }
    setIsAiLoading(false);
  };

  const filteredTodos = useMemo(() => todos.filter(t => {
    if (filter === 'active') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  }), [todos, filter]);

  const completionStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.is_completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [todos]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 pb-20 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">ZenTask <span className="text-indigo-600 italic">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '진행중' : '완료'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-8">
        {/* Progress Section */}
        <section className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">오늘의 달성도</span>
            <span className="text-sm font-bold text-indigo-600">{completionStats.percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${completionStats.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium">
            {completionStats.total}개의 할 일 중 {completionStats.completed}개를 완료했습니다.
          </p>
        </section>

        {/* AI Assistant Banner */}
        <section className="bg-slate-900 p-7 rounded-3xl mb-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-300">AI Goal Planner</h2>
            </div>
            <h3 className="text-xl font-bold mb-4">어떤 목표를 달성하고 싶으신가요?</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="예: 이번 달 안에 마라톤 준비하기"
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm placeholder-gray-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiSuggestions()}
              />
              <button 
                onClick={handleAiSuggestions}
                disabled={isAiLoading || !aiGoal.trim()}
                className="bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-indigo-400 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                {isAiLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
                플랜 생성
              </button>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
        </section>

        <TaskForm onAdd={addTask} />

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              Task List <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{filteredTodos.length}</span>
            </h2>
            {todos.some(t => t.is_completed) && (
              <button 
                onClick={clearCompleted}
                className="text-[11px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-tight flex items-center gap-1"
              >
                완료 항목 삭제
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
               <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm font-medium text-gray-400">데이터를 불러오는 중...</p>
            </div>
          ) : filteredTodos.length > 0 ? (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <TaskCard key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-[2rem] px-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-gray-800 font-bold text-lg">완벽하게 비어있네요!</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                현재 계획된 할 일이 없습니다.<br/>새로운 목표를 추가하거나 AI 비서의 도움을 받아보세요.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-20 text-center pb-10">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Powered by Supabase & Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
