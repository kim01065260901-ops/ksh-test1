
import React, { useState } from 'react';
import { Priority } from '../types';

interface TaskFormProps {
  onAdd: (task: { title: string; description: string; priority: Priority; category: string; due_date: string | null }) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title,
      description,
      priority,
      category,
      due_date: dueDate || null
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="What needs to be done?"
            className="w-full text-lg font-medium border-none focus:ring-0 placeholder-gray-300 px-0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div>
          <textarea
            placeholder="Add a description..."
            className="w-full text-sm text-gray-600 border-none focus:ring-0 placeholder-gray-300 p-0 h-16 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Priority</label>
            <select
              className="text-xs bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Category</label>
            <select
              className="text-xs bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Shopping">Shopping</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Due</label>
            <input
              type="date"
              className="text-xs bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2 rounded-xl transition-all shadow-lg shadow-indigo-100"
          >
            Add Task
          </button>
        </div>
      </div>
    </form>
  );
};
