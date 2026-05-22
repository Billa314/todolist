'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Link2,
  CheckCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Flag,
  Percent,
  Play,
  Square,
  Sparkles,
  Search,
  Bell,
  Paperclip
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  raw_input: string;
  energy_mode: 'high_brain' | 'routine' | 'fried';
  urls: string[];
  ai_daily_research: {
    summary: string;
    urls: string[];
  } | null;
  is_completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
  progress: number;
  emoji: string;
  images: string[];
  created_at: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filtering & Search
  const [energyFilter, setEnergyFilter] = useState<'all' | 'high_brain' | 'routine' | 'fried'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Input states
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🧠');
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notification states
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // Modal / Detailed View
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTrayId, setExpandedTrayId] = useState<string | null>(null);

  const emojiList = ['🧠', '☕', '🥱', '🚀', '📚', '💻', '🎨', '🔑', '🌱', '🎯'];

  // Load tasks & request notifications
  useEffect(() => {
    fetchTasks();
    checkNotificationPermission();
  }, []);

  // Timer for voice recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsGranted(permission === 'granted');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        checkDueDates(data.tasks);
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setErrorMsg('Could not connect to Supabase backend API. Check your .env setup.');
    } finally {
      setLoading(false);
    }
  };

  const checkDueDates = (loadedTasks: Task[]) => {
    const today = new Date().toDateString();
    loadedTasks.forEach((task) => {
      if (task.due_date && !task.is_completed) {
        const taskDate = new Date(task.due_date).toDateString();
        if (taskDate === today) {
          triggerLocalNotification(task);
        }
      }
    });
  };

  const triggerLocalNotification = (task: Task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🎯 Task Due Today!`, {
        body: `"${task.title}" requires your attention today. Energy: ${task.energy_mode}`,
        icon: '/favicon.ico',
      });
    }
  };

  // Add standard text task or parse voice input
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() && !isRecording) return;

    try {
      setLoading(true);
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newText.trim(),
          priority,
          due_date: dueDate || null,
          emoji: selectedEmoji,
          progress: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewText('');
        setDueDate('');
        setPriority('medium');
        setSelectedEmoji('🧠');
        setShowOptionsDrawer(false);
        fetchTasks();
      } else {
        alert(data.error || 'Failed to create task');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error creating task');
    } finally {
      setLoading(false);
    }
  };

  // Audio Recorder Native API
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Audio recorder permissions denied:', err);
      alert('Microphone access is required to use voice inputs.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioBlob = async (audioBlob: Blob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-task.webm');
      formData.append('priority', priority);
      formData.append('emoji', selectedEmoji);
      if (dueDate) formData.append('due_date', dueDate);

      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        fetchTasks();
        setShowOptionsDrawer(false);
      } else {
        alert(data.error || 'Failed to extract voice task');
      }
    } catch (err: any) {
      console.error('Voice parsing failed:', err);
      alert('Error submitting voice recording.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Checkbox
  const toggleCompleted = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_completed: !currentStatus } : t))
        );
        if (selectedTask?.id === id) {
          setSelectedTask((prev) => prev ? { ...prev, is_completed: !currentStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Progress
  const handleProgressChange = async (id: string, val: number) => {
    try {
      // Optimitic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, progress: val } : t))
      );
      if (selectedTask?.id === id) {
        setSelectedTask((prev) => prev ? { ...prev, progress: val } : null);
      }

      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: val })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setIsModalOpen(false);
        setSelectedTask(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Research Update Accept / Reject
  const handleResearchAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${id}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        if (selectedTask?.id === id) {
          setSelectedTask(data.task);
        }
      } else {
        alert(data.error || 'Failed to update research data');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Local Image Upload (Base64 insertion)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, task: Task) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const updatedImages = [...task.images, base64String];

      try {
        setLoading(true);
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: updatedImages })
        });
        const data = await res.json();
        if (data.success) {
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, images: updatedImages } : t))
          );
          setSelectedTask((prev) => prev ? { ...prev, images: updatedImages } : null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Grounding Search Manually
  const triggerManualResearch = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cron/daily-research');
      const data = await res.json();
      if (data.success) {
        alert('Daily grounding research complete! Check tasks for research labels.');
        fetchTasks();
      } else {
        alert(data.error || 'Failed grounding research scan');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering grounding research');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p: 'high' | 'medium' | 'low') => {
    switch (p) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  const getEnergyModeLabel = (mode: 'high_brain' | 'routine' | 'fried') => {
    switch (mode) {
      case 'high_brain': return { label: '🧠 High Brain', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'routine': return { label: '☕ Routine', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'fried': return { label: '🥱 Fried', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
    }
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesMode = energyFilter === 'all' || t.energy_mode === energyFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.raw_input && t.raw_input.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col gap-6 relative select-none">
      
      {/* Notifications Warning Box */}
      {!notificationsGranted && (
        <div className="glass-panel p-3.5 rounded-2xl border border-indigo-500/20 flex items-center justify-between gap-4 text-xs font-semibold text-indigo-300">
          <span className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" /> Enable daily timeline notification popups?
          </span>
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            Allow
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* 1. Main energy selectors */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          🧠 Select Your Cognitive Load Filter
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setEnergyFilter('all')}
            className={`py-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all duration-300 cursor-pointer ${
              energyFilter === 'all'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600 text-white scale-[1.02] shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            ✨ All
          </button>
          <button
            onClick={() => setEnergyFilter('high_brain')}
            className={`py-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all duration-300 cursor-pointer ${
              energyFilter === 'high_brain'
                ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300 scale-[1.02] shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20'
            }`}
          >
            🧠 High Brain
          </button>
          <button
            onClick={() => setEnergyFilter('routine')}
            className={`py-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all duration-300 cursor-pointer ${
              energyFilter === 'routine'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 scale-[1.02] shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/20'
            }`}
          >
            ☕ Routine
          </button>
          <button
            onClick={() => setEnergyFilter('fried')}
            className={`py-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all duration-300 cursor-pointer ${
              energyFilter === 'fried'
                ? 'bg-teal-500/20 border-teal-400/50 text-teal-300 scale-[1.02] shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-teal-400 hover:bg-teal-950/20'
            }`}
          >
            🥱 Fried
          </button>
        </div>
      </div>

      {/* 2. Text Input & Recorder Panel */}
      <form onSubmit={handleAddTask} className="glass-panel p-5 rounded-3xl border border-slate-700/50 flex flex-col gap-4 relative">
        <div className="flex items-center gap-3">
          {/* Main Input Text Field */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={isRecording ? `Listening and extracting... (${recordingSeconds}s)` : "Describe task or start speaking..."}
              disabled={isRecording}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            />
            {/* Add Options Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowOptionsDrawer(!showOptionsDrawer)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {showOptionsDrawer ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Microphone action button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative cursor-pointer ${
              isRecording
                ? 'bg-red-500 text-white scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/10'
            }`}
          >
            <Mic className="w-5 h-5 text-white" />
          </button>

          {/* Submit Text task Button */}
          {!isRecording && newText.trim() && (
            <button
              type="submit"
              className="px-4 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-2xl text-sm flex items-center gap-1 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Add <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Audio waves when recording */}
        {isRecording && (
          <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-red-500/20">
            <div className="sound-wave-container">
              <div className="sound-bar"></div>
              <div className="sound-bar"></div>
              <div className="sound-bar"></div>
              <div className="sound-bar"></div>
              <div className="sound-bar"></div>
            </div>
            <span className="text-xs font-semibold text-red-400">
              Recording live voice. Press mic again to stop & parse instantly.
            </span>
          </div>
        )}

        {/* Options drawer */}
        {showOptionsDrawer && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 animate-float">
            {/* Priority Flags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Flag</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    priority === 'high' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> High
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('medium')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    priority === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> Mid
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    priority === 'low' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> Low
                </button>
              </div>
            </div>

            {/* Due date calendar picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date Timeline</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Profile Emoji Selection dropdown list */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Emoji Avatar</label>
              <div className="grid grid-cols-5 gap-1 bg-slate-900/40 border border-slate-800 rounded-xl p-1 justify-items-center">
                {emojiList.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setSelectedEmoji(e)}
                    className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-800/80 cursor-pointer ${
                      selectedEmoji === e ? 'bg-cyan-500/20 scale-110 border border-cyan-500/40' : 'border border-transparent'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* 3. Search and Grounding Control Panel */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/20 p-4 rounded-3xl border border-slate-850">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cognitive task logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button
          onClick={triggerManualResearch}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-cyan-400 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-cyan-500/25 hover:border-cyan-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" /> Scan Daily Grounding Research
        </button>
      </div>

      {/* 4. Task Grid Lists */}
      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
          <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">Contacting Gemini and loading your dashboard...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800/60 max-w-lg mx-auto w-full flex flex-col items-center gap-4 animate-float">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/60 flex items-center justify-center text-3xl">
            🔮
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Clear Cognitive State</h3>
            <p className="text-sm text-slate-400">
              {searchQuery ? 'No matching tasks inside filter.' : 'Your cognitive workspace is fully offloaded. Use text or record a task to fill.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const isUrgent = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString();
            const energyInfo = getEnergyModeLabel(task.energy_mode);

            return (
              <div
                key={task.id}
                className={`glass-card p-5 rounded-2xl border flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  task.is_completed ? 'opacity-65' : ''
                } ${
                  task.priority === 'high'
                    ? 'animate-glow-cyan border-red-500/25'
                    : task.priority === 'medium'
                    ? 'border-yellow-500/20'
                    : 'border-green-500/20'
                }`}
                onClick={() => openTaskModal(task)}
              >
                {/* Daily Research Alert Banner (Top layout override) */}
                {task.ai_daily_research && (
                  <div
                    className="mb-4 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-teal-500/10 border border-cyan-400/40 p-4 rounded-xl flex flex-col gap-3 relative shadow-inner animate-float"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5 animate-pulse">
                        ✨ New Internet Research Found Today!
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed italic">
                      "{task.ai_daily_research.summary}"
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {task.ai_daily_research.urls && task.ai_daily_research.urls.map((linkUrl, index) => (
                        <a
                          key={index}
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-md text-[9px] bg-slate-900/80 hover:bg-slate-900 border border-cyan-500/30 text-cyan-400 flex items-center gap-1 transition-colors"
                        >
                          <Link2 className="w-2.5 h-2.5" /> Source Link {index + 1}
                        </a>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cyan-500/20">
                      <button
                        onClick={() => handleResearchAction(task.id, 'accept')}
                        className="py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg text-[10px] text-center transition-colors cursor-pointer"
                      >
                        [Accept Update]
                      </button>
                      <button
                        onClick={() => handleResearchAction(task.id, 'reject')}
                        className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-lg text-[10px] text-center transition-colors cursor-pointer"
                      >
                        [Reject Update]
                      </button>
                    </div>
                  </div>
                )}

                {/* Task card content header */}
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Emoji Profile avatar and title */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-lg">
                        {task.emoji}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 ${
                          task.is_completed ? 'line-through text-slate-500' : ''
                        }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider ${energyInfo?.color}`}>
                            {energyInfo?.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider flex items-center gap-0.5 ${getPriorityColor(task.priority)}`}>
                            <Flag className="w-2.5 h-2.5" /> {task.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Completion Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompleted(task.id, task.is_completed);
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        task.is_completed
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 border-transparent text-white'
                          : 'border-slate-700 hover:border-cyan-500'
                      }`}
                    >
                      {task.is_completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                  </div>

                  {/* Task details body */}
                  {task.raw_input && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-slate-800 pl-2 ml-1">
                      {task.raw_input}
                    </p>
                  )}
                </div>

                {/* Progress bar slider */}
                <div className="mt-4 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Percent className="w-3 h-3 text-cyan-400" /> Completion Progress</span>
                    <span className="text-cyan-400">{task.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={task.progress}
                    disabled={task.is_completed}
                    onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
                  />
                </div>

                {/* Card footer detail list */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900">
                  {/* Timeline Badge */}
                  {task.due_date ? (
                    <div className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                      task.is_completed
                        ? 'text-slate-500 bg-slate-950/40 border-slate-900'
                        : isUrgent
                        ? 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse'
                        : 'text-slate-400 bg-slate-950/40 border-slate-800'
                    }`}>
                      <Calendar className="w-3 h-3 text-cyan-400" /> Due: {new Date(task.due_date).toLocaleDateString()} {isUrgent && '⚠️ TODAY'}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-600 italic">No deadline set</span>
                  )}

                  {/* Resource Link Tray trigger */}
                  <div className="flex items-center gap-2">
                    {task.urls && task.urls.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTrayId(expandedTrayId === task.id ? null : task.id);
                        }}
                        className="px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-cyan-400 border border-slate-800 flex items-center gap-1 transition-all duration-200 cursor-pointer"
                      >
                        Links ({task.urls.length}) {expandedTrayId === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Resource Link Tray content */}
                {expandedTrayId === task.id && task.urls && task.urls.length > 0 && (
                  <div
                    className="mt-3 p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex flex-col gap-2 relative animate-float"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Extracted Resource Links</span>
                    <div className="flex flex-col gap-1.5">
                      {task.urls.map((linkUrl, i) => (
                        <a
                          key={i}
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 font-medium truncate"
                        >
                          <Link2 className="w-3 h-3 shrink-0 text-cyan-500" /> {linkUrl}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Detailed Task View Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700/50 p-6 flex flex-col gap-5 relative overflow-hidden animate-float">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl w-10 h-10 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center shrink-0">
                  {selectedTask.emoji}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{selectedTask.title}</h3>
                  <span className="text-[10px] text-slate-500">Created on {new Date(selectedTask.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTask(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Info */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Energy Mode</span>
                  <span className="text-slate-200 font-bold">{getEnergyModeLabel(selectedTask.energy_mode)?.label}</span>
                </div>
                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl flex flex-col gap-1">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Priority Flag</span>
                  <span className="text-slate-200 font-bold capitalize">{selectedTask.priority} Priority</span>
                </div>
              </div>

              {selectedTask.raw_input && (
                <div className="flex flex-col gap-1.5 p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Description / Raw Input</span>
                  <p className="text-xs text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                    "{selectedTask.raw_input}"
                  </p>
                </div>
              )}

              {/* Resource Url Section */}
              <div className="flex flex-col gap-2 p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-cyan-400" /> Resource Links
                </span>
                {selectedTask.urls && selectedTask.urls.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedTask.urls.map((linkUrl, idx) => (
                      <a
                        key={idx}
                        href={linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-500 shrink-0" /> {linkUrl}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No links extracted</span>
                )}
              </div>

              {/* Saved Images Section */}
              <div className="flex flex-col gap-3 p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-cyan-400" /> Saved Task Images
                  </span>
                  <label className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer">
                    <Paperclip className="w-3 h-3" /> Attach Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, selectedTask)}
                      className="hidden"
                    />
                  </label>
                </div>

                {selectedTask.images && selectedTask.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {selectedTask.images.map((base64Img, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                        <img
                          src={base64Img}
                          alt={`Uploaded Task Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No attached images yet</span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-900 mt-2">
              <button
                onClick={() => deleteTask(selectedTask.id)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
