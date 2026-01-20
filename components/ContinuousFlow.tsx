import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MusicalNote, NoteName, Accidental, Clef } from '../types';
import { midiService } from '../services/MidiService';
import { NOTE_STEP_MAP, CLEF_ANCHORS } from '../constants';

interface ContinuousFlowProps {
    generateNote: () => MusicalNote;
    includeAccidentals: boolean;
    clef: Clef;
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

const ContinuousFlow: React.FC<ContinuousFlowProps> = ({ generateNote, includeAccidentals, clef }) => {
    // Note queue - always maintain 4 notes
    const [noteQueue, setNoteQueue] = useState<MusicalNote[]>(() => {
        return Array.from({ length: 5 }, () => generateNote());
    });

    // Stats tracking
    const [streak, setStreak] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [lastCorrectTime, setLastCorrectTime] = useState<number | null>(null);
    const [notesPerMinute, setNotesPerMinute] = useState(0);

    // UI state
    const [isSliding, setIsSliding] = useState(false);
    const [showError, setShowError] = useState(false);
    const [midiConnected, setMidiConnected] = useState(false);
    const [lastMidiNote, setLastMidiNote] = useState<string | null>(null);

    // Refs for MIDI callbacks
    const noteQueueRef = useRef(noteQueue);
    const isSlidingRef = useRef(isSliding);
    const generateNoteRef = useRef(generateNote);
    const lastCallTimeRef = useRef(0); // For debouncing duplicate calls

    useEffect(() => {
        noteQueueRef.current = noteQueue;
        isSlidingRef.current = isSliding;
        generateNoteRef.current = generateNote;
    }, [noteQueue, isSliding, generateNote]);

    // Initialize MIDI
    useEffect(() => {
        const initMidi = async () => {
            const success = await midiService.initialize();
            setMidiConnected(success);
            if (success) {
                console.log('🎹 MIDI connected for Continuous Flow');
            }
        };
        initMidi();
    }, []);

    const handleCorrectNote = useCallback(() => {
        if (isSlidingRef.current) return;

        // Debounce: prevent duplicate calls within 100ms
        const now = Date.now();
        if (now - lastCallTimeRef.current < 100) {
            console.log('⏭️ Skipping duplicate call');
            return;
        }
        lastCallTimeRef.current = now;

        setIsSliding(true);

        // Update stats
        setStreak(prev => prev + 1);
        setTotalCorrect(prev => prev + 1);
        setTotalAttempts(prev => prev + 1);

        // Calculate speed
        if (lastCorrectTime) {
            const timeDiff = (now - lastCorrectTime) / 1000; // seconds
            const currentRate = 60 / timeDiff; // notes per minute
            setNotesPerMinute(prev => prev === 0 ? currentRate : (prev * 0.7 + currentRate * 0.3)); // Smoothed average
        }
        setLastCorrectTime(now);

        // Slide animation and add new note
        setTimeout(() => {
            setNoteQueue(prev => {
                // Remove first note, add new note at the end
                const newNote = generateNoteRef.current();
                const newQueue = [...prev.slice(1), newNote];
                console.log('Queue updated:', prev.map(n => n.name), '→', newQueue.map(n => n.name));
                return newQueue;
            });
            setIsSliding(false);
        }, 200); // Match animation duration
    }, [lastCorrectTime]);

    const handleWrongNote = useCallback(() => {
        setShowError(true);
        setStreak(0);
        setTotalAttempts(prev => prev + 1);

        setTimeout(() => {
            setShowError(false);
        }, 300);
    }, []);

    const checkNote = useCallback((noteName: NoteName, accidental: Accidental, octave?: number) => {
        const currentNote = noteQueueRef.current[0];

        const nameMatch = noteName === currentNote.name;
        const accidentalMatch = accidental === currentNote.accidental;
        const octaveMatch = octave === undefined || octave === currentNote.octave;

        if (nameMatch && accidentalMatch && octaveMatch) {
            handleCorrectNote();
            return true;
        } else {
            handleWrongNote();
            return false;
        }
    }, [handleCorrectNote, handleWrongNote]);

    // MIDI support
    useEffect(() => {
        if (!midiConnected) return;

        const handleMidiNote = (midiNote: { note: number; velocity: number; noteName: string }) => {
            if (isSlidingRef.current) return;

            setLastMidiNote(midiNote.noteName);

            try {
                const parsed = midiService.parseNoteName(midiNote.noteName);
                const isCorrect = checkNote(parsed.name, parsed.accidental, parsed.octave);
                setLastMidiNote(`${midiNote.noteName} ${isCorrect ? '✅' : '❌'}`);
            } catch (error) {
                console.error('Error parsing MIDI note:', error);
            }
        };

        midiService.onNote(handleMidiNote);
    }, [midiConnected, checkNote]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSliding) return;

            const key = e.key.toLowerCase();

            // Natural keys C-D-E-F-G-A-B
            if (['a', 'b', 'c', 'd', 'e', 'f', 'g'].includes(key)) {
                e.preventDefault();
                const name = key.toUpperCase() as NoteName;
                checkNote(name, 'none');
            }

            // Accidental keys 1-5
            if (includeAccidentals && ['1', '2', '3', '4', '5'].includes(key)) {
                e.preventDefault();
                const btn = ENHARMONIC_BUTTONS[parseInt(key) - 1];
                const match = btn.matches[0];
                checkNote(match.name, match.accidental);
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isSliding, includeAccidentals, checkNote]);

    const handleButtonClick = useCallback((button: NoteButton) => {
        if (isSliding) return;
        const match = button.matches[0];
        checkNote(match.name, match.accidental);
    }, [isSliding, checkNote]);

    // Render continuous staff with all notes
    const renderContinuousStaff = () => {
        const lineSpacing = 14;
        const noteSpacing = 80;
        const startX = 20;
        const startY = 20;
        const baseline = startY + (2 * lineSpacing);
        const lines = [0, 1, 2, 3, 4].map(i => baseline - (i * lineSpacing));
        const middleLineY = lines[2];
        const staffWidth = 100 + (noteQueue.length * noteSpacing);

        const calculateNoteY = (note: MusicalNote): number => {
            const anchor = CLEF_ANCHORS[note.clef];
            const anchorSteps = (anchor.octave * 7) + NOTE_STEP_MAP[anchor.name];
            const targetSteps = (note.octave * 7) + NOTE_STEP_MAP[note.name];
            const stepDiff = targetSteps - anchorSteps;
            return baseline - (stepDiff * (lineSpacing / 2));
        };

        const calculateLedgerLines = (noteY: number): number[] => {
            const ledgerLines: number[] = [];
            if (noteY > baseline + 2) {
                for (let y = baseline + lineSpacing; y <= noteY + 2; y += lineSpacing) {
                    ledgerLines.push(y);
                }
            } else if (noteY < lines[4] - 2) {
                for (let y = lines[4] - lineSpacing; y >= noteY - 2; y -= lineSpacing) {
                    ledgerLines.push(y);
                }
            }
            return ledgerLines;
        };

        return (
            <svg width={staffWidth} height="160" viewBox={`0 0 ${staffWidth} 160`} className="mx-auto">
                {/* Staff Lines */}
                {lines.map((y, i) => (
                    <line key={`line-${i}`} x1={startX} y1={y} x2={staffWidth - 20} y2={y} stroke="#334155" strokeWidth="1.5" />
                ))}

                {/* Clef */}
                <text
                    x={startX + 10}
                    y={clef === 'TREBLE' ? baseline - lineSpacing * 1.2 : baseline - lineSpacing * 2.5}
                    fontSize={clef === 'TREBLE' ? "75" : "60"}
                    className="select-none fill-slate-800 font-serif"
                >
                    {clef === 'TREBLE' ? '𝄞' : '𝄢'}
                </text>

                {/* Notes with sliding animation */}
                <g style={{
                    transform: isSliding ? `translateX(-${noteSpacing}px)` : 'translateX(0)',
                    transition: isSliding ? 'transform 200ms linear' : 'none'
                }}>
                    {noteQueue.map((note, index) => {
                        const noteX = startX + 90 + (index * noteSpacing);
                        const noteY = calculateNoteY(note);
                        const ledgerLines = calculateLedgerLines(noteY);
                        const isPointingUp = noteY > middleLineY;
                        const stemX = isPointingUp ? noteX + 7.5 : noteX - 7.5;
                        const stemHeight = lineSpacing * 3.5;
                        const stemYEnd = isPointingUp ? noteY - stemHeight : noteY + stemHeight;

                        const isActive = index === 0;
                        const noteColor = showError && isActive ? '#ef4444' : isActive ? '#4f46e5' : '#0f172a';
                        const noteFillClass = showError && isActive ? 'fill-red-500' : isActive ? 'fill-indigo-600' : 'fill-slate-900';

                        return (
                            <g key={`note-${index}-${note.name}${note.octave}`}>
                                {/* Ledger Lines */}
                                {ledgerLines.map((y, i) => (
                                    <line key={`ledger-${index}-${i}`} x1={noteX - 15} y1={y} x2={noteX + 15} y2={y} stroke="#334155" strokeWidth="1.5" />
                                ))}

                                {/* Accidental */}
                                {note.accidental !== 'none' && (
                                    <text x={noteX - 28} y={noteY + 8} fontSize="30" className="fill-slate-800">
                                        {note.accidental === 'sharp' ? '♯' : note.accidental === 'flat' ? '♭' : '♮'}
                                    </text>
                                )}

                                {/* Note Head */}
                                <ellipse
                                    cx={noteX}
                                    cy={noteY}
                                    rx="8"
                                    ry="6"
                                    transform={`rotate(-20, ${noteX}, ${noteY})`}
                                    className={noteFillClass}
                                    style={showError && isActive ? { animation: 'pulse 0.3s ease-in-out' } : {}}
                                />

                                {/* Note Stem */}
                                <line
                                    x1={stemX}
                                    y1={noteY}
                                    x2={stemX}
                                    y2={stemYEnd}
                                    stroke={noteColor}
                                    strokeWidth="1.5"

                                />

                                {/* Active indicator (subtle glow/highlight) */}
                                {isActive && !showError && (
                                    <circle
                                        cx={noteX}
                                        cy={noteY}
                                        r="18"
                                        fill="none"
                                        stroke="#4f46e5"
                                        strokeWidth="2"
                                        opacity="0.3"
                                    />
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>
        );
    };

    const accuracy = totalAttempts === 0 ? 100 : Math.round((totalCorrect / totalAttempts) * 100);

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Stats Bar */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100">
                <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Streak</div>
                        <div className="text-4xl font-black text-indigo-600">{streak}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Speed</div>
                        <div className="text-4xl font-black text-purple-600">{Math.round(notesPerMinute)}</div>
                        <div className="text-[10px] text-slate-400 mt-1">notes/min</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Accuracy</div>
                        <div className="text-4xl font-black text-emerald-600">{accuracy}%</div>
                    </div>
                </div>
            </div>

            {/* Note Display - Continuous Staff */}
            <div className="w-full flex justify-center py-8 bg-white rounded-3xl shadow-xl border-2 border-slate-100 mb-8">
                <div className="overflow-hidden" style={{ width: '420px' }}>
                    {renderContinuousStaff()}
                </div>
            </div>

            {/* MIDI Feedback */}
            {midiConnected && (
                <div className="mb-8 text-center">
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

            {/* Button Controls */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8">
                {!includeAccidentals ? (
                    <div className="grid grid-cols-4 gap-3">
                        {NATURAL_NOTES.map(name => {
                            const btn: NoteButton = {
                                label: name,
                                id: `nat-${name}`,
                                shortcut: name,
                                matches: [{ name, accidental: 'none' }]
                            };
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => handleButtonClick(btn)}
                                    disabled={isSliding}
                                    className="relative py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 disabled:opacity-50"
                                >
                                    {btn.label}
                                    <span className="absolute top-1 right-2 text-[8px] opacity-30 font-mono">{btn.shortcut}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4 w-full">
                        {/* Row 1: Naturals */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {NATURAL_NOTES.map(name => {
                                const btn: NoteButton = {
                                    label: name,
                                    id: `nat-${name}`,
                                    shortcut: name,
                                    matches: [{ name, accidental: 'none' }]
                                };
                                return (
                                    <button
                                        key={btn.id}
                                        onClick={() => handleButtonClick(btn)}
                                        disabled={isSliding}
                                        className="relative py-4 rounded-lg font-bold text-sm transition-all transform active:scale-95 border-2 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-600 border-slate-100 shadow-sm disabled:opacity-50"
                                    >
                                        {btn.label}
                                        <span className="absolute top-0.5 right-1 text-[7px] opacity-30 font-mono uppercase">{btn.shortcut}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Row 2: Enharmonic Pairs */}
                        <div className="grid grid-cols-5 gap-2 px-4">
                            {ENHARMONIC_BUTTONS.map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleButtonClick(btn)}
                                    disabled={isSliding}
                                    className="relative py-3 rounded-lg font-bold text-[10px] transition-all transform active:scale-95 border-b-4 bg-slate-800 text-indigo-100 border-slate-900 hover:bg-slate-700 active:translate-y-0.5 disabled:opacity-50"
                                >
                                    {btn.label}
                                    <span className="absolute top-0.5 right-1 text-[7px] opacity-40 font-mono">{btn.shortcut}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContinuousFlow;
