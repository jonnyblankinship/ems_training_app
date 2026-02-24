'use client';

import { useState } from 'react';
import { BookOpen, Radio } from 'lucide-react';
import { StudyBuddy } from '@/components/StudyBuddy';
import { PatientEncounter } from '@/components/PatientEncounter';

type Tab = 'study' | 'encounter';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('study');

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4">
        <div className="flex items-center gap-3 py-4">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">EMS</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">EMS Training Assistant</h1>
            <p className="text-xs text-slate-500">Training use only — simulated environment</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex -mx-4 px-4">
          <button
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'study'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Study Buddy
          </button>
          <button
            onClick={() => setActiveTab('encounter')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'encounter'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Radio className="w-4 h-4" />
            Patient Encounter
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'study' ? <StudyBuddy /> : <PatientEncounter />}
      </main>
    </div>
  );
}
