
import React, { useState, useEffect } from 'react';
import { MusicalNote, NoteName, AppMode, Accidental } from '../types';
import StaffRenderer from './StaffRenderer';

interface FlashcardProps {
  note: MusicalNote;
  onNext: (correct: boolean) => void;
  showAnswer: boolean;
  setShowAnswer: (val: boolean) => void;
  mode: AppMode;
  includeAccidentals: boolean;
}

interface NoteButton {
  label: string;
  matches: { name: NoteName; accidental: Accidental }[];
  id: string;
}

const NATURAL_NOTES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const ENHARMONIC_BUTTONS: NoteButton[] = [
  { label: 'C♯ / D♭', id: 'cs-db', matches: [{ name: 'C', accidental: 'sharp' }, { name: 'D', accidental: 'flat' }] },
  { label: 'D♯ / E♭', id: 'ds-eb', matches: [{ name: 'D', accidental: 'sharp' }, { name: 'E', accidental: 'flat' }] },
  { label: 'F♯ / G♭', id: 'fs-gb', matches: [{ name: 'F', accidental: 'sharp' }, { name: 'G', accidental: 'flat' }] },
  { label: 'G♯ / A♭', id: 'gs-ab', matches: [{ name: 'G', accidental: 'sharp' }, { name: 'A', accidental: 'flat' }] },
  { label: 'A♯ / B♭', id: 'as-bb', matches: [{ name: 'A', accidental: 'sharp' }, { name: 'B', accidental: 'flat' }] },
];

const Flashcard: React.FC<FlashcardProps> = ({ note, onNext, showAnswer, setShowAnswer, mode, includeAccidentals }) => {
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [wrongButtonIds, setWrongButtonIds] = useState<string[]>([]);
  const [isAutoProgressing, setIsAutoProgressing] = useState(false);

  // Reset state when note changes
  useEffect(() => {
    setSelectedButtonId(null);
    setWrongButtonIds([]);
    setIsAutoProgressing(false);
  }, [note]);

  const handleGuess = (button: NoteButton) => {
    if (showAnswer || isAutoProgressing) return;

    const isCorrect = button.matches.some(
      m => m.name === note.name && m.accidental === note.accidental
    );

    if (isCorrect) {
      setSelectedButtonId(button.id);
      setIsAutoProgressing(true);
      
      setTimeout(() => {
        onNext(wrongButtonIds.length === 0);
      }, 1000);
    } else {
      if (!wrongButtonIds.includes(button.id)) {
        setWrongButtonIds([...wrongButtonIds, button.id]);
      }
    }
  };

  const getAccidentalSymbol = (acc: Accidental) => {
    if (acc === 'sharp') return '♯';
    if (acc === 'flat') return '♭';
    return '';
  };

  const renderButtons = () => {
    const naturalButtons: NoteButton[] = NATURAL_NOTES.map(name => ({
      label: name,
      id: `nat-${name}`,
      matches: [{ name, accidental: 'none' }]
    }));

    if (!includeAccidentals) {
      return (
        <div className="grid grid-cols-4 gap-3">
          {naturalButtons.map((btn) => {
            const isWrong = wrongButtonIds.includes(btn.id);
            const isCorrect = selectedButtonId === btn.id;
            
            return (
              <button
                key={btn.id}
                onClick={() => handleGuess(btn)}
                disabled={isWrong || showAnswer || isAutoProgressing}
                className={`
                  py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95
                  ${isCorrect ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 
                    isWrong ? 'bg-red-50 text-red-300 cursor-not-allowed border-red-100' : 
                    'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100'}
                `}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-4 w-full">
        {/* Row 1: Naturals */}
        <div className="grid grid-cols-7 gap-1.5">
          {naturalButtons.map((btn) => {
            const isWrong = wrongButtonIds.includes(btn.id);
            const isCorrect = selectedButtonId === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleGuess(btn)}
                disabled={isWrong || showAnswer || isAutoProgressing}
                className={`
                  py-4 rounded-lg font-bold text-sm transition-all transform active:scale-95 border-2
                  ${isCorrect ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 
                    isWrong ? 'bg-red-50 border-red-100 text-red-200 cursor-not-allowed' : 
                    'bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-600 border-slate-100 shadow-sm'}
                `}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Enharmonic Pairs */}
        <div className="grid grid-cols-5 gap-2 px-4">
          {ENHARMONIC_BUTTONS.map((btn) => {
            const isWrong = wrongButtonIds.includes(btn.id);
            const isCorrect = selectedButtonId === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleGuess(btn)}
                disabled={isWrong || showAnswer || isAutoProgressing}
                className={`
                  py-3 rounded-lg font-bold text-[10px] transition-all transform active:scale-95 border-b-4
                  ${isCorrect ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg translate-y-0.5' : 
                    isWrong ? 'bg-red-100 border-red-200 text-red-300 cursor-not-allowed' : 
                    'bg-slate-800 text-indigo-100 border-slate-900 hover:bg-slate-700 active:translate-y-0.5'}
                `}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto perspective-1000">
      <div 
        className={`relative w-full min-h-[580px] transition-all duration-700 preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}
      >
        {/* Front Side */}
        <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border-2 border-slate-100 ${showAnswer ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
          
          {/* Success Overlay */}
          {isAutoProgressing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 rounded-3xl animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-100 p-6 rounded-full mb-4">
                <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-3xl font-black text-emerald-600 font-serif italic tracking-tight">Correct!</span>
            </div>
          )}

          <div className="text-slate-400 text-sm font-semibold tracking-widest uppercase mb-6">
            {mode === 'REVEAL' ? 'Identify the Note' : 'Select the Note'}
          </div>
          
          <StaffRenderer note={note} />

          {mode === 'REVEAL' ? (
            <button 
              onClick={() => setShowAnswer(true)}
              className="mt-12 text-slate-400 text-sm italic hover:text-indigo-500 transition-colors"
            >
              Click card to reveal answer
            </button>
          ) : (
            <div className="mt-10 w-full">
              {renderButtons()}
              <p className="text-center text-slate-400 text-[10px] mt-8 font-bold uppercase tracking-widest">
                {wrongButtonIds.length > 0 ? `Incorrect tries: ${wrongButtonIds.length}` : (includeAccidentals ? 'Enharmonic grouping active' : 'Pick the correct note name')}
              </p>
            </div>
          )}
        </div>

        {/* Back Side (Study Mode Only) */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-3xl shadow-xl border-2 border-indigo-100 ${!showAnswer ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
          <div className="text-indigo-600 text-sm font-semibold tracking-widest uppercase mb-4">Answer</div>
          <div className="text-8xl font-black text-slate-900 mb-2 font-serif">
            {note.name}{getAccidentalSymbol(note.accidental)}
          </div>
          <div className="text-xl text-indigo-600 font-medium mb-12">
            Octave {note.octave} • {note.clef.toLowerCase()} clef
          </div>

          <div className="w-full bg-white/60 p-6 rounded-2xl border border-indigo-100 text-center">
            <p className="text-slate-600 text-sm">
              This note is <strong>{note.name}{getAccidentalSymbol(note.accidental)}</strong>.
              {note.accidental === 'sharp' && ` It shares the same pitch as ${String.fromCharCode(note.name.charCodeAt(0) + 1)}♭.`}
              {note.accidental === 'flat' && ` It shares the same pitch as ${String.fromCharCode(note.name.charCodeAt(0) - 1)}♯.`}
            </p>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNext(true);
            }}
            className="mt-10 px-12 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-colors transform active:scale-95"
          >
            Next Note
          </button>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes fadeInZoom {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation: fadeInZoom 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Flashcard;
