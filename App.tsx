

import React, { useState, useCallback, useEffect } from 'react';
import { Clef, MusicalNote, NoteName, Accidental, AppMode, DifficultyLevel, Challenge, PracticeMode } from './types';
import Flashcard from './components/Flashcard';

const NOTE_NAMES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function App() {
  const [clefPreference, setClefPreference] = useState<Clef>('TREBLE');
  const [includeAccidentals, setIncludeAccidentals] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('STRICT'); // STRICT = Buttons, REVEAL = Flip
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('SINGLE');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(1);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ seen: 0, correctFirstTry: 0 });

  const generateRandomNote = useCallback((clef: Clef): MusicalNote => {
    const name = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];

    // Accidentals: 30% probability when enabled
    const accidental: Accidental = includeAccidentals
      ? (Math.random() > 0.7 ? (Math.random() > 0.5 ? 'sharp' : 'flat') : 'none')
      : 'none';

    let octave = 4;

    if (clef === 'TREBLE') {
      if (difficultyLevel === 1) {
        // Level 1: C4-B4 only (100%)
        octave = 4;
      } else if (difficultyLevel === 2) {
        // Level 2: 80% C4-B4, 20% C5-B5
        octave = Math.random() < 0.8 ? 4 : 5;
      } else {
        // Level 3: 80% C4-B4, 20% split 50/50 between C5-B5 or C6-B6
        const rand = Math.random();
        if (rand < 0.8) {
          octave = 4; // Primary range
        } else {
          octave = Math.random() < 0.5 ? 5 : 6; // 50/50 between octave 5 and 6
        }
      }
    } else {
      // Bass Clef
      if (difficultyLevel === 1) {
        // Level 1: C3-B3 only (100%)
        octave = 3;
      } else {
        // Level 2 & 3: 80% C3-B3, 20% C2-B2 (same for both)
        octave = Math.random() < 0.8 ? 3 : 2;
      }
    }

    return { name, octave, accidental, clef };
  }, [includeAccidentals, difficultyLevel]);

  const generateChallenge = useCallback(() => {
    let challenge: Challenge;

    if (practiceMode === 'SINGLE') {
      // Single note mode
      challenge = {
        mode: 'SINGLE',
        singleNote: generateRandomNote(clefPreference)
      };
    } else if (practiceMode === 'MULTI') {
      // Multi note mode: Sequence of 3-4 notes
      const count = Math.random() > 0.5 ? 3 : 4;
      const sequence: MusicalNote[] = [];
      for (let i = 0; i < count; i++) {
        sequence.push(generateRandomNote(clefPreference));
      }
      challenge = {
        mode: 'MULTI',
        sequence
      };
    } else {
      // Musical mode: Parallel treble and bass
      const count = Math.random() > 0.5 ? 2 : 3;
      const trebleNotes: MusicalNote[] = [];
      const bassNotes: MusicalNote[] = [];
      for (let i = 0; i < count; i++) {
        trebleNotes.push(generateRandomNote('TREBLE'));
        bassNotes.push(generateRandomNote('BASS'));
      }
      challenge = {
        mode: 'MUSICAL',
        trebleNotes,
        bassNotes
      };
    }

    setCurrentChallenge(challenge);
    setShowAnswer(false);
  }, [practiceMode, clefPreference, generateRandomNote]);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const handleNext = (correctFirstTry: boolean) => {
    setStats(prev => ({
      seen: prev.seen + 1,
      correctFirstTry: prev.correctFirstTry + (correctFirstTry ? 1 : 0)
    }));
    generateChallenge();
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Practice Mode</label>
                <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setPracticeMode('SINGLE')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${practiceMode === 'SINGLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setPracticeMode('MULTI')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${practiceMode === 'MULTI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Multi
                  </button>
                  <button
                    onClick={() => setPracticeMode('MUSICAL')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${practiceMode === 'MUSICAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Musical
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  {practiceMode === 'SINGLE' && '1 note at a time'}
                  {practiceMode === 'MULTI' && '3-4 notes in sequence'}
                  {practiceMode === 'MUSICAL' && 'Treble + Bass parallel'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setDifficultyLevel(1)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${difficultyLevel === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Level 1
                  </button>
                  <button
                    onClick={() => setDifficultyLevel(2)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${difficultyLevel === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Level 2
                  </button>
                  <button
                    onClick={() => setDifficultyLevel(3)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${difficultyLevel === 3 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Level 3
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  {difficultyLevel === 1 && 'Single octave only'}
                  {difficultyLevel === 2 && 'Two octaves (80/20)'}
                  {difficultyLevel === 3 && 'Three octaves (80/20)'}
                </p>
              </div>

              {practiceMode !== 'MUSICAL' && (
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
              )}

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
          {currentChallenge ? (
            <Flashcard
              challenge={currentChallenge}
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
