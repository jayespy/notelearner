
import React, { useState, useEffect, useCallback } from 'react';
import { MusicalNote, NoteName, AppMode, Accidental, Challenge } from '../types';
import MultiStaffRenderer from './MultiStaffRenderer';
import { midiService } from '../services/MidiService';

interface FlashcardProps {
  challenge: Challenge;
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
  shortcut?: string;
}

const NATURAL_NOTES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const ENHARMONIC_BUTTONS: NoteButton[] = [
  { label: 'C♯ / D♭', id: 'cs-db', shortcut: '1', matches: [{ name: 'C', accidental: 'sharp' }, { name: 'D', accidental: 'flat' }] },
  { label: 'D♯ / E♭', id: 'ds-eb', shortcut: '2', matches: [{ name: 'D', accidental: 'sharp' }, { name: 'E', accidental: 'flat' }] },
  { label: 'F♯ / G♭', id: 'fs-gb', shortcut: '3', matches: [{ name: 'F', accidental: 'sharp' }, { name: 'G', accidental: 'flat' }] },
  { label: 'G♯ / A♭', id: 'gs-ab', shortcut: '4', matches: [{ name: 'G', accidental: 'sharp' }, { name: 'A', accidental: 'flat' }] },
  { label: 'A♯ / B♭', id: 'as-bb', shortcut: '5', matches: [{ name: 'A', accidental: 'sharp' }, { name: 'B', accidental: 'flat' }] },
];

const Flashcard: React.FC<FlashcardProps> = ({ challenge, onNext, showAnswer, setShowAnswer, mode, includeAccidentals }) => {
  // Create a combined sequence for validation based on difficulty level
  const noteSequence: MusicalNote[] = React.useMemo(() => {
    if (challenge.level === 1 && challenge.singleNote) {
      return [challenge.singleNote];
    } else if (challenge.level === 2 && challenge.sequence) {
      return challenge.sequence;
    } else if (challenge.level === 3 && challenge.trebleNotes && challenge.bassNotes) {
      // Interleave treble and bass notes (reading order: left to right)
      const combined: MusicalNote[] = [];
      const maxLength = Math.max(challenge.trebleNotes.length, challenge.bassNotes.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < challenge.trebleNotes.length) combined.push(challenge.trebleNotes[i]);
        if (i < challenge.bassNotes.length) combined.push(challenge.bassNotes[i]);
      }
      return combined;
    }
    return [{ name: 'C' as NoteName, octave: 4, accidental: 'none' as Accidental, clef: 'TREBLE' as const }];
  }, [challenge]);

  // Extract the current note for Level 1 compatibility
  const note = noteSequence[0];

  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [wrongButtonIds, setWrongButtonIds] = useState<string[]>([]);
  const [isAutoProgressing, setIsAutoProgressing] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<{ key: string, code: string, time: number } | null>(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [lastMidiNote, setLastMidiNote] = useState<string | null>(null);

  // Sequential validation state (for Level 2 & 3)
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [playedNotes, setPlayedNotes] = useState<boolean[]>([]);
  const [wrongNoteIndex, setWrongNoteIndex] = useState<number | undefined>(undefined);

  // Use refs to avoid stale closures in MIDI callback
  const currentNoteRef = React.useRef(note);
  const wrongButtonIdsRef = React.useRef(wrongButtonIds);
  const isAutoProgressingRef = React.useRef(isAutoProgressing);
  const showAnswerRef = React.useRef(showAnswer);
  const currentNoteIndexRef = React.useRef(currentNoteIndex);
  const noteSequenceRef = React.useRef(noteSequence);
  const challengeLevelRef = React.useRef(challenge.level);

  // Update refs when values change
  React.useEffect(() => {
    currentNoteRef.current = note;
    wrongButtonIdsRef.current = wrongButtonIds;
    isAutoProgressingRef.current = isAutoProgressing;
    showAnswerRef.current = showAnswer;
    currentNoteIndexRef.current = currentNoteIndex;
    noteSequenceRef.current = noteSequence;
    challengeLevelRef.current = challenge.level;
  }, [note, wrongButtonIds, isAutoProgressing, showAnswer, currentNoteIndex, noteSequence, challenge.level]);

  // Initialize MIDI
  useEffect(() => {
    const initMidi = async () => {
      const success = await midiService.initialize();
      setMidiConnected(success);

      if (success) {
        const devices = midiService.getConnectedDevices();
        console.log('🎹 MIDI Devices connected:', devices);
      }
    };

    initMidi();
  }, []);

  // Reset state when challenge changes
  useEffect(() => {
    setSelectedButtonId(null);
    setWrongButtonIds([]);
    setIsAutoProgressing(false);
    setCurrentNoteIndex(0);
    setPlayedNotes([]);
    setWrongNoteIndex(undefined);
  }, [challenge]);

  const handleGuess = useCallback((button: NoteButton) => {
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
  }, [showAnswer, isAutoProgressing, note, onNext, wrongButtonIds]);

  // MIDI support
  useEffect(() => {
    if (!midiConnected) return;

    const handleMidiNote = (midiNote: { note: number; velocity: number; noteName: string }) => {
      setLastMidiNote(midiNote.noteName);
      console.log('🎹 MIDI Note played:', midiNote.noteName);

      // Use refs to get current values
      if (showAnswerRef.current || isAutoProgressingRef.current || mode === 'REVEAL') {
        console.log('⏭️ Skipping MIDI note - not in quiz mode or already answered');
        return;
      }

      try {
        const parsed = midiService.parseNoteName(midiNote.noteName);
        const level = challengeLevelRef.current;
        const sequence = noteSequenceRef.current;
        const currentIndex = currentNoteIndexRef.current;

        console.log('Parsed MIDI note:', parsed);
        console.log('Level:', level, 'Current index:', currentIndex, 'Total notes:', sequence.length);

        if (level === 1) {
          // Level 1: Original single-note validation
          const currentNote = sequence[0];
          console.log('Expected note:', { name: currentNote.name, accidental: currentNote.accidental, octave: currentNote.octave });

          const isCorrect =
            parsed.name === currentNote.name &&
            parsed.accidental === currentNote.accidental &&
            parsed.octave === currentNote.octave;

          if (isCorrect) {
            console.log('✅ Correct MIDI note!');
            setSelectedButtonId('midi-correct');
            setIsAutoProgressing(true);
            setLastMidiNote(`${midiNote.noteName} ✅`);

            setTimeout(() => {
              onNext(wrongButtonIdsRef.current.length === 0);
            }, 1000);
          } else {
            console.log('❌ Wrong MIDI note');
            setLastMidiNote(`${midiNote.noteName} ❌`);
          }
        } else {
          // Level 2 & 3: Sequential validation
          const expectedNote = sequence[currentIndex];
          console.log('Expected note at index', currentIndex, ':', { name: expectedNote.name, accidental: expectedNote.accidental, octave: expectedNote.octave });

          const isCorrect =
            parsed.name === expectedNote.name &&
            parsed.accidental === expectedNote.accidental &&
            parsed.octave === expectedNote.octave;

          if (isCorrect) {
            console.log(`✅ Correct note ${currentIndex + 1}/${sequence.length}!`);

            // Mark this note as played
            setPlayedNotes(prev => {
              const newPlayed = [...prev];
              newPlayed[currentIndex] = true;
              return newPlayed;
            });

            setLastMidiNote(`${midiNote.noteName} ✅`);

            // Check if this was the last note
            if (currentIndex + 1 >= sequence.length) {
              console.log('🎉 All notes played correctly!');
              setIsAutoProgressing(true);
              setTimeout(() => {
                onNext(true);
              }, 1000);
            } else {
              // Move to next note
              setCurrentNoteIndex(currentIndex + 1);
            }
          } else {
            console.log('❌ Wrong note in sequence');
            setLastMidiNote(`${midiNote.noteName} ❌`);

            // Flash red and reset
            setWrongNoteIndex(currentIndex);
            setTimeout(() => {
              setWrongNoteIndex(undefined);
              setCurrentNoteIndex(0);
              setPlayedNotes([]);
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error parsing MIDI note:', error);
      }
    };

    midiService.onNote(handleMidiNote);
  }, [midiConnected, mode, onNext]);

  // Keyboard support
  useEffect(() => {
    console.log('🎹 Keyboard listener mounted');
    console.log('Current state:', { showAnswer, isAutoProgressing, mode, includeAccidentals });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable computer keyboard for Level 2 & 3 (MIDI only)
      if (challenge.level > 1) {
        console.log('⌨️ Computer keyboard disabled for Level 2 & 3 (MIDI only)');
        return;
      }

      // Update visual indicator for ANY key press
      setLastKeyPressed({
        key: e.key,
        code: e.code,
        time: Date.now()
      });

      // Log ALL keyboard events to see if they're being received
      console.log('🔑 Key pressed:', {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        type: e.type,
        target: e.target,
        currentTarget: e.currentTarget,
        isTrusted: e.isTrusted,
        timeStamp: e.timeStamp
      });

      const key = e.key.toLowerCase();

      // Controls: Space or Enter
      if (key === ' ' || key === 'enter') {
        console.log('✅ Space/Enter detected, showAnswer:', showAnswer, 'mode:', mode);
        e.preventDefault(); // Prevent default scrolling/form submission
        if (showAnswer) {
          console.log('→ Calling onNext(true)');
          onNext(true);
        } else if (mode === 'REVEAL') {
          console.log('→ Calling setShowAnswer(true)');
          setShowAnswer(true);
        }
        return;
      }

      if (showAnswer || isAutoProgressing || mode === 'REVEAL') {
        console.log('⏭️ Skipping key - showAnswer:', showAnswer, 'isAutoProgressing:', isAutoProgressing, 'mode:', mode);
        return;
      }

      // Natural keys C-D-E-F-G-A-B
      if (['a', 'b', 'c', 'd', 'e', 'f', 'g'].includes(key)) {
        console.log('✅ Natural note key detected:', key);
        e.preventDefault(); // Prevent default browser behavior
        const name = key.toUpperCase() as NoteName;
        const btn: NoteButton = {
          label: name,
          id: `nat-${name}`,
          matches: [{ name, accidental: 'none' }]
        };
        console.log('→ Calling handleGuess for:', btn);
        handleGuess(btn);
      }

      // Accidental keys 1-5
      if (includeAccidentals && ['1', '2', '3', '4', '5'].includes(key)) {
        console.log('✅ Accidental key detected:', key);
        e.preventDefault(); // Prevent default browser behavior
        const btn = ENHARMONIC_BUTTONS[parseInt(key) - 1];
        console.log('→ Calling handleGuess for:', btn);
        handleGuess(btn);
      }
    };

    // Add event listener with capture phase to ensure we get the event first
    console.log('📌 Adding keydown listener to window');
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      console.log('🗑️ Removing keydown listener');
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [showAnswer, isAutoProgressing, mode, includeAccidentals, handleGuess, onNext, setShowAnswer]);

  const getAccidentalSymbol = (acc: Accidental) => {
    if (acc === 'sharp') return '♯';
    if (acc === 'flat') return '♭';
    return '';
  };

  const renderButtons = () => {
    const naturalButtons: NoteButton[] = NATURAL_NOTES.map(name => ({
      label: name,
      id: `nat-${name}`,
      shortcut: name,
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
                  relative py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95
                  ${isCorrect ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' :
                    isWrong ? 'bg-red-50 text-red-300 cursor-not-allowed border-red-100' :
                      'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100'}
                `}
              >
                {btn.label}
                <span className="absolute top-1 right-2 text-[8px] opacity-30 font-mono">{btn.shortcut}</span>
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
                  relative py-4 rounded-lg font-bold text-sm transition-all transform active:scale-95 border-2
                  ${isCorrect ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' :
                    isWrong ? 'bg-red-50 border-red-100 text-red-200 cursor-not-allowed' :
                      'bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-600 border-slate-100 shadow-sm'}
                `}
              >
                {btn.label}
                <span className="absolute top-0.5 right-1 text-[7px] opacity-30 font-mono uppercase">{btn.shortcut}</span>
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
                  relative py-3 rounded-lg font-bold text-[10px] transition-all transform active:scale-95 border-b-4
                  ${isCorrect ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg translate-y-0.5' :
                    isWrong ? 'bg-red-100 border-red-200 text-red-300 cursor-not-allowed' :
                      'bg-slate-800 text-indigo-100 border-slate-900 hover:bg-slate-700 active:translate-y-0.5'}
                `}
              >
                {btn.label}
                <span className="absolute top-0.5 right-1 text-[7px] opacity-40 font-mono">{btn.shortcut}</span>
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

          <div className="text-slate-400 text-sm font-semibold tracking-widest uppercase mb-6 flex items-center gap-2">
            {mode === 'REVEAL' ? 'Identify the Note' : 'Select the Note'}
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] lowercase font-mono">keyboard enabled</span>
          </div>

          <MultiStaffRenderer challenge={challenge} playedNotes={playedNotes} wrongNoteIndex={wrongNoteIndex} />

          {/* MIDI Feedback */}
          {midiConnected && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">🎹 MIDI:</span>
                {lastMidiNote ? (
                  <span className="text-sm font-mono font-bold text-slate-700">{lastMidiNote}</span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Play a note...</span>
                )}
              </div>
            </div>
          )}

          {mode === 'REVEAL' ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-12 text-slate-400 text-sm italic hover:text-indigo-500 transition-colors flex flex-col items-center gap-1"
            >
              <span>Click card to reveal answer</span>
              <span className="text-[10px] font-mono opacity-60">or press [SPACE]</span>
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
            className="mt-10 px-12 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-colors transform active:scale-95 flex flex-col items-center"
          >
            <span className="font-bold">Next Note</span>
            <span className="text-[9px] opacity-70 font-mono mt-0.5">[SPACE / ENTER]</span>
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
