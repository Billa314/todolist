'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Link2, Plus, Search, Trash2, Tag, Calendar, FileText, CheckCircle } from 'lucide-react';

interface StudyMaterial {
  id: string;
  title: string;
  content: string;
  url: string;
  tag: string;
  createdAt: string;
}

export default function PrepPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [tag, setTag] = useState('Study');
  
  const [showAddForm, setShowAddForm] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('cognitive_flow_prep_materials');
    if (saved) {
      try {
        setMaterials(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse prep materials:', e);
      }
    } else {
      // Add default seeds for wow factor
      const seedMaterials: StudyMaterial[] = [
        {
          id: 'seed-1',
          title: 'NextJS App Router Architecture Guide',
          content: 'Keep Server Components as default. Use "use client" only at leaves. Use API Route handlers inside /api for REST endpoints. Supabase can be connected via service-role keys securely on the server-side.',
          url: 'https://nextjs.org/docs',
          tag: 'Web Dev',
          createdAt: new Date().toLocaleDateString(),
        },
        {
          id: 'seed-2',
          title: 'Gemini Multimodal Processing Techniques',
          content: 'Gemini 1.5/2.5 Flash can accept audio inline data in base64 format. The parameter inlineData expects: { data: string, mimeType: string }. This allows zero-dependency transcription and entity extraction!',
          url: 'https://ai.google.dev/gemini-api/docs',
          tag: 'AI',
          createdAt: new Date().toLocaleDateString(),
        }
      ];
      setMaterials(seedMaterials);
      localStorage.setItem('cognitive_flow_prep_materials', JSON.stringify(seedMaterials));
    }
  }, []);

  // Save to LocalStorage
  const saveMaterials = (updated: StudyMaterial[]) => {
    setMaterials(updated);
    localStorage.setItem('cognitive_flow_prep_materials', JSON.stringify(updated));
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newMaterial: StudyMaterial = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      content: content.trim(),
      url: url.trim(),
      tag,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newMaterial, ...materials];
    saveMaterials(updated);

    // Reset Form
    setTitle('');
    setContent('');
    setUrl('');
    setTag('Study');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    saveMaterials(updated);
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col gap-6 select-none">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            📚 Preparation Study Hub
          </h2>
          <p className="text-sm text-slate-400">
            A standalone space to upload, organize, and read your developer or study notes. Saved entirely on your local device.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 transform active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {showAddForm ? 'Close Form' : 'Add Material'} <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMaterial}
          className="glass-panel p-5 rounded-2xl border border-slate-700/50 flex flex-col gap-4 animate-float"
        >
          <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            ✍️ Insert Study Material
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Material Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Supabase RLS Policy Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Category Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  <option value="Study">Study 📚</option>
                  <option value="Web Dev">Web Dev 💻</option>
                  <option value="AI">AI 🤖</option>
                  <option value="Math">Math 📐</option>
                  <option value="General">General 📌</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Resource URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Study Notes / Core Content</label>
            <textarea
              required
              rows={4}
              placeholder="Paste guide contents, syntax, summary, or details here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer"
          >
            Save Note to Device
          </button>
        </form>
      )}

      {/* Search and counters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search study materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div className="flex gap-4 shrink-0 text-xs font-semibold text-slate-400">
          <div>Total Notes: <span className="text-cyan-400 font-bold">{materials.length}</span></div>
          <div>Filtered: <span className="text-teal-400 font-bold">{filteredMaterials.length}</span></div>
        </div>
      </div>

      {/* Materials grid list */}
      {filteredMaterials.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800/60 max-w-lg mx-auto w-full flex flex-col items-center gap-4 animate-float">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-3xl">
            📖
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">No Study Materials Found</h3>
            <p className="text-sm text-slate-400">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Start by clicking "Add Material" above to populate your study desk!'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="glass-card p-5 rounded-2xl border border-slate-800/50 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Card top details */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> {material.tag}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> {material.createdAt}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" /> {material.title}
                  </h4>
                  <p className="text-sm text-slate-300 mt-2 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                    {material.content}
                  </p>
                </div>
              </div>

              {/* Card bottom actions */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-800/80">
                {material.url ? (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Open Resource Link
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No url links saved</span>
                )}

                <button
                  onClick={() => handleDelete(material.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
