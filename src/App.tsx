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
  Layout,
  Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initialize Gemini (Lazy initialization to prevent crash if key is missing)
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Gemini initialization failed:", e);
    return null;
  }
};

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

const COLUMN_COLORS = [
  "bg-yellow-400", // 1열: 노란색
  "bg-blue-400",   // 2열: 파랑색
  "bg-green-400",  // 3열: 초록색
  "bg-red-400",    // 4열: 빨강색
  "bg-gray-400",   // 5열: 회색
  "bg-purple-400", // 6열: 보라색
];

const FALLBACK_QUOTES = [
  { quote: "어제보다 나은 오늘을 만드는 것은 당신의 선택입니다.", author: "마크 트웨인" },
  { quote: "작은 습관이 모여 위대한 인생을 만듭니다.", author: "아리스토텔레스" },
  { quote: "시작하는 것이 반입니다. 지금 바로 시작하세요!", author: "아리스토텔레스" },
  { quote: "성공은 매일 반복되는 작은 노력의 합계입니다.", author: "로버트 콜리어" },
  { quote: "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 당신의 믿음대로 될 것입니다.", author: "헨리 포드" },
  { quote: "오늘의 노력이 내일의 당신을 만듭니다.", author: "엘버트 허버드" },
  { quote: "꿈을 꾸는 것보다 더 중요한 것은 그 꿈을 향해 나아가는 것입니다.", author: "월트 디즈니" },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("todo-tasks") : null;
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [newTask, setNewTask] = useState("");
  const [quote, setQuote] = useState("오늘도 멋진 하루를 시작해보세요!");
  const [author, setAuthor] = useState("AI Motivator");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  // Lotto state
  const [lottoSets, setLottoSets] = useState<number[][]>([]);
  const [isLoadingLotto, setIsLoadingLotto] = useState(false);

  // Save tasks to local storage
  useEffect(() => {
    localStorage.setItem("todo-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const fetchQuote = useCallback(async () => {
    const ai = getAiClient();
    if (!ai) {
      // AI가 없을 경우 로컬 명언 리스트에서 무작위로 선택
      const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
      const fallback = FALLBACK_QUOTES[randomIndex];
      setQuote(fallback.quote);
      setAuthor(fallback.author);
      return;
    }

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
      // 에러 발생 시에도 로컬 명언으로 대체
      const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
      const fallback = FALLBACK_QUOTES[randomIndex];
      setQuote(fallback.quote);
      setAuthor(fallback.author);
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  const fetchLottoNumbers = useCallback(async () => {
    const ai = getAiClient();
    if (!ai) {
      // Fallback random numbers if AI is not available
      const fallback = Array.from({ length: 5 }, () => 
        Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b)
      );
      setLottoSets(fallback);
      return;
    }

    setIsLoadingLotto(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "최근 5년간의 로또 당첨 번호 데이터를 분석하여 통계적으로 의미 있는 로또 번호 5세트(각 6개 숫자, 1-45 범위)를 추천해줘. 각 세트는 오름차순으로 정렬해줘. JSON 형식으로: { \"lottoSets\": [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12], ...] }",
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      if (data.lottoSets) {
        setLottoSets(data.lottoSets);
      }
    } catch (error) {
      console.error("Failed to fetch lotto numbers:", error);
      // Fallback random numbers
      const fallback = Array.from({ length: 5 }, () => 
        Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b)
      );
      setLottoSets(fallback);
    } finally {
      setIsLoadingLotto(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
    fetchLottoNumbers();

    // Automatically update quote every 1 hour
    const quoteInterval = setInterval(fetchQuote, 3600000);
    
    return () => clearInterval(quoteInterval);
  }, [fetchQuote, fetchLottoNumbers]);

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
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full"
          >
            <Calendar className="w-3 h-3" />
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900">
            Daily Habits
          </h1>

          {/* Quote Section */}
          <motion.div 
            key={quote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative p-6 bg-white rounded-2xl shadow-sm border border-gray-100 group mb-6"
          >
            <Quote className="absolute -top-3 -left-3 w-8 h-8 text-blue-100 fill-blue-50" />
            <div className="relative">
              <p className="text-lg italic text-gray-700 mb-2 leading-relaxed">
                "{quote}"
              </p>
              <p className="text-sm font-medium text-gray-400">
                — {author}
              </p>
            </div>
            <button 
              onClick={fetchQuote}
              disabled={isLoadingQuote}
              className="absolute bottom-3 right-3 p-2 text-gray-300 hover:text-blue-500 transition-colors disabled:opacity-50"
              title="새 명언 가져오기"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingQuote ? 'animate-spin' : ''}`} />
            </button>
          </motion.div>

          {/* Lotto Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <Ticket className="w-5 h-5" />
                <span>AI 로또 번호 추천 (최근 5년 데이터 기반)</span>
              </div>
              <button 
                onClick={fetchLottoNumbers}
                disabled={isLoadingLotto}
                className="text-xs font-semibold text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLotto ? 'animate-spin' : ''}`} />
                번호 갱신
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoadingLotto ? (
                <div className="py-8 text-gray-400 text-sm animate-pulse">데이터 분석 중...</div>
              ) : (
                lottoSets.map((set, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-xl"
                  >
                    <span className="text-xs font-bold text-gray-400 w-8">#{idx + 1}</span>
                    <div className="flex gap-2">
                      {set.map((num, nIdx) => (
                        <div 
                          key={nIdx}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${COLUMN_COLORS[nIdx] || "bg-gray-400"}`}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </header>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-gray-500">오늘의 달성률</span>
            <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-500 rounded-full"
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
            className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
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
                className={`group flex items-center gap-4 p-4 bg-white rounded-xl border transition-all ${
                  task.completed ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 shadow-sm hover:border-blue-200'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 transition-colors ${
                    task.completed ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'
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
                      task.completed ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500'
                    }`}>
                      {CATEGORY_ICONS[task.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other}
                    </div>
                  )}
                  <span className={`text-lg font-medium transition-all ${
                    task.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}>
                    {task.text}
                  </span>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>할 일이 없습니다. 새로운 목표를 추가해보세요!</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <footer className="mt-12 pt-8 border-t border-gray-200 flex justify-between text-sm text-gray-400 font-medium">
          <p>{tasks.length}개의 할 일</p>
          <p>{completedCount}개 완료됨</p>
        </footer>
      </div>
    </div>
  );
}
