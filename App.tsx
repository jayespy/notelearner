
import React, { useState, useCallback, useEffect } from 'react';
import { Clef, MusicalNote, NoteName, Accidental, AppMode } from './types';
import Flashcard from './components/Flashcard';

const NOTE_NAMES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function App() {
  const [clefPreference, setClefPreference] = useState<Clef>('TREBLE');
  const [includeAccidentals, setIncludeAccidentals] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('STRICT'); // STRICT = Buttons, REVEAL = Flip
  const [currentNote, setCurrentNote] = useState<MusicalNote | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ seen: 0, correctFirstTry: 0 });

  const generateRandomNote = useCallback(() => {
    const name = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
    const accidental: Accidental = includeAccidentals 
        ? (Math.random() > 0.7 ? (Math.random() > 0.5 ? 'sharp' : 'flat') : 'none')
        : 'none';
    
    let octave = 4;
    if (clefPreference === 'TREBLE') {
      // Treble Clef range roughly C4 to G5 for beginner learning
      octave = Math.random() > 0.5 ? 4 : 5;
      if (octave === 5 && ['A', 'B'].includes(name)) octave = 4;
      if (octave === 4 && ['C'].includes(name) && Math.random() > 0.5) octave = 5; 
    } else {
      // Bass Clef range roughly E2 to C4
      octave = Math.random() > 0.5 ? 2 : 3;
      if (octave === 3 && name === 'C') octave = 4; // Middle C
    }

    setCurrentNote({
      name,
      octave,
      accidental,
      clef: clefPreference
    });
    setShowAnswer(false);
  }, [clefPreference, includeAccidentals]);

  useEffect(() => {
    generateRandomNote();
  }, [generateRandomNote]);

  const handleNext = (correctFirstTry: boolean) => {
    setStats(prev => ({ 
      seen: prev.seen + 1, 
      correctFirstTry: prev.correctFirstTry + (correctFirstTry ? 1 : 0) 
    }));
    generateRandomNote();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight font-serif italic mb-2">NoteMaster</h1>
        <p className="text-slate-500 font-medium">Test your musical knowledge with interactive staves.</p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Settings Sidebar */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Practice Config
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Learning Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setAppMode('STRICT')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${appMode === 'STRICT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Quiz
                  </button>
                  <button 
                    onClick={() => setAppMode('REVEAL')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${appMode === 'REVEAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Study
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Clef</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setClefPreference('TREBLE')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${clefPreference === 'TREBLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Treble
                  </button>
                  <button 
                    onClick={() => setClefPreference('BASS')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${clefPreference === 'BASS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Bass
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Accidentals</h4>
                  <p className="text-xs text-slate-500">Sharps and flats</p>
                </div>
                <button 
                  onClick={() => setIncludeAccidentals(!includeAccidentals)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${includeAccidentals ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${includeAccidentals ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-500 font-medium">Session Accuracy</span>
                    <span className="text-indigo-600 font-bold">{stats.seen === 0 ? 0 : Math.round((stats.correctFirstTry / stats.seen) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.seen === 0 ? 0 : (stats.correctFirstTry / stats.seen) * 100}%` }} />
                </div>
                <div className="flex justify-between mt-3 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <span>Attempts: {stats.seen}</span>
                  <span>Mastery Goal: 90%</span>
                </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-white overflow-hidden relative">
            <div className="relative z-10">
                <h3 className="font-bold mb-1">Quick Note</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  In <strong>Quiz Mode</strong>, identifying a note with an accidental requires recognizing both the position and the symbol.
                </p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-7xl text-slate-700 font-serif rotate-12 select-none">𝄞</div>
          </div>
        </section>

        {/* Flashcard Area */}
        <section className="lg:col-span-8 flex flex-col items-center">
          {currentNote ? (
            <Flashcard 
              note={currentNote} 
              onNext={handleNext} 
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              mode={appMode}
              includeAccidentals={includeAccidentals}
            />
          ) : (
            <div className="animate-pulse flex flex-col items-center justify-center p-24 w-full bg-white rounded-3xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-4"></div>
                <div className="w-48 h-4 bg-slate-100 rounded"></div>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-24 text-slate-400 text-sm flex items-center space-x-2">
        <span>Procedural SVG Music Engine • Accurate Note Placement</span>
      </footer>
    </div>
  );
}

export default App;
