/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { GoogleGenAI } from "@google/genai";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Quote, 
  RefreshCw,
  Calendar,
  Bike,
  Dumbbell,
  Pill,
  Youtube,
  Layout
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category?: 'cycle' | 'fitness' | 'health' | 'work' | 'other';
}

const INITIAL_TASKS: Task[] = [
  { id: "1", text: "사이클타기", completed: false, category: 'cycle' },
  { id: "2", text: "윗몸일으키기", completed: false, category: 'fitness' },
  { id: "3", text: "약먹기", completed: false, category: 'health' },
  { id: "4", text: "유튜브 쇼츠관리", completed: false, category: 'work' },
];

const CATEGORY_ICONS = {
  cycle: <Bike className="w-4 h-4" />,
  fitness: <Dumbbell className="w-4 h-4" />,
  health: <Pill className="w-4 h-4" />,
  work: <Youtube className="w-4 h-4" />,
  other: <Layout className="w-4 h-4" />,
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("todo-tasks") : null;
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [newTask, setNewTask] = useState("");
  const [quote, setQuote] = useState("오늘도 멋진 하루를 시작해보세요!");
  const [author, setAuthor] = useState("AI Motivator");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Save tasks to local storage
  useEffect(() => {
    localStorage.setItem("todo-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const fetchQuote = useCallback(async () => {
    setIsLoadingQuote(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "성공, 노력, 행복에 관한 짧고 강렬한 한국어 명언 하나와 그 저자를 알려줘. JSON 형식으로: { \"quote\": \"내용\", \"author\": \"저자\" }",
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      if (data.quote) {
        setQuote(data.quote);
        setAuthor(data.author || "Unknown");
      }
    } catch (error) {
      console.error("Failed to fetch quote:", error);
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
      category: 'other'
    };
    setTasks([task, ...tasks]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-400 uppercase bg-blue-900/30 rounded-full"
          >
            <Calendar className="w-3 h-3" />
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Daily Habits
          </h1>

          {/* Quote Section */}
          <motion.div 
            key={quote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative p-6 bg-gray-900/50 rounded-2xl shadow-sm border border-gray-800 group"
          >
            <Quote className="absolute -top-3 -left-3 w-8 h-8 text-blue-900/30 fill-blue-900/20" />
            <div className="relative">
              <p className="text-lg italic text-gray-200 mb-2 leading-relaxed">
                "{quote}"
              </p>
              <p className="text-sm font-medium text-gray-500">
                — {author}
              </p>
            </div>
            <button 
              onClick={fetchQuote}
              disabled={isLoadingQuote}
              className="absolute bottom-3 right-3 p-2 text-gray-600 hover:text-blue-400 transition-colors disabled:opacity-50"
              title="새 명언 가져오기"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingQuote ? 'animate-spin' : ''}`} />
            </button>
          </motion.div>
        </header>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-gray-400">오늘의 달성률</span>
            <span className="text-2xl font-bold text-blue-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-8 flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="새로운 할 일을 입력하세요..."
            className="flex-1 px-5 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-gray-600"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            추가
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  task.completed 
                    ? 'border-gray-900 bg-gray-900/30' 
                    : 'border-gray-800 bg-gray-900/50 shadow-sm hover:border-blue-900/50'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 transition-colors ${
                    task.completed ? 'text-blue-500' : 'text-gray-600 hover:text-blue-400'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1 flex items-center gap-3">
                  {task.category && (
                    <div className={`p-2 rounded-lg ${
                      task.completed ? 'bg-gray-800 text-gray-600' : 'bg-blue-900/20 text-blue-400'
                    }`}>
                      {CATEGORY_ICONS[task.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other}
                    </div>
                  )}
                  <span className={`text-lg font-medium transition-all ${
                    task.completed ? 'text-gray-600 line-through' : 'text-gray-200'
                  }`}>
                    {task.text}
                  </span>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <p>할 일이 없습니다. 새로운 목표를 추가해보세요!</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <footer className="mt-12 pt-8 border-t border-gray-800 flex justify-between text-sm text-gray-600 font-medium">
          <p>{tasks.length}개의 할 일</p>
          <p>{completedCount}개 완료됨</p>
        </footer>
      </div>
    </div>
  );
}
