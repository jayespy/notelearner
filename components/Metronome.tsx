
import React, { useState, useEffect, useRef, useCallback } from 'react';

const Metronome: React.FC = () => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
    const [currentBeat, setCurrentBeat] = useState(0);

    const audioContext = useRef<AudioContext | null>(null);
    const timerID = useRef<number | null>(null);
    const nextNoteTime = useRef(0);
    const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
    const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)
    const beatRef = useRef(0);
    const beatsPerMeasureRef = useRef(4);

    const playClick = useCallback((time: number, isFirstBeat: boolean, beatNumber: number) => {
        if (!audioContext.current) return;

        const osc = audioContext.current.createOscillator();
        const envelope = audioContext.current.createGain();

        osc.frequency.value = isFirstBeat ? 1000 : 800;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(envelope);
        envelope.connect(audioContext.current.destination);

        osc.start(time);
        osc.stop(time + 0.1);

        // Schedule visual update - sync with audio more precisely
        const delay = Math.max(0, (time - audioContext.current.currentTime) * 1000);
        setTimeout(() => {
            setCurrentBeat(beatNumber);
        }, Math.max(0, delay));
    }, []);

    const scheduler = useCallback(() => {
        if (!audioContext.current) return;

        while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
            const currentBeatNum = beatRef.current;
            const isFirstBeat = currentBeatNum === 0;
            playClick(nextNoteTime.current, isFirstBeat, currentBeatNum);

            const secondsPerBeat = 60.0 / bpm;
            nextNoteTime.current += secondsPerBeat;

            beatRef.current = (beatRef.current + 1) % beatsPerMeasureRef.current;
        }
        timerID.current = window.setTimeout(scheduler, lookahead);
    }, [bpm, playClick]);

    const togglePlay = () => {
        if (!isPlaying) {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (audioContext.current.state === 'suspended') {
                audioContext.current.resume();
            }

            beatRef.current = 0;
            nextNoteTime.current = audioContext.current.currentTime + 0.05;
            setIsPlaying(true);
            scheduler();
        } else {
            setIsPlaying(false);
            if (timerID.current) {
                clearTimeout(timerID.current);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (timerID.current) {
                clearTimeout(timerID.current);
            }
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center">
                {/* Visual Beat Indicator */}
                <div className="flex space-x-3 mb-12">
                    {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-100 ${isPlaying && currentBeat === i
                                ? (i === 0 ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-200' : 'bg-indigo-400 scale-110')
                                : 'bg-slate-200'
                                }`}
                        />
                    ))}
                </div>

                {/* BPM Display */}
                <div className="text-center mb-8">
                    <div className="text-7xl font-black text-slate-900 tabular-nums mb-1 tracking-tighter">
                        {bpm}
                    </div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Beats Per Minute</div>
                </div>

                {/* BPM Slider */}
                <div className="w-full px-4 mb-10">
                    <input
                        type="range"
                        min="40"
                        max="240"
                        value={bpm}
                        onChange={(e) => setBpm(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>40</span>
                        <span>140</span>
                        <span>240</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 gap-8 w-full">
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Time Signature</label>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            {[2, 3, 4, 6].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setBeatsPerMeasure(num);
                                        beatsPerMeasureRef.current = num;
                                        if (isPlaying) {
                                            // Reset beat if we change time signature while playing to avoid confusion
                                            beatRef.current = 0;
                                            setCurrentBeat(0);
                                        }
                                    }}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${beatsPerMeasure === num ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {num}/4
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={togglePlay}
                        className={`w-full py-6 rounded-[2rem] text-xl font-black transition-all transform active:scale-95 flex items-center justify-center space-x-3 ${isPlaying
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200'
                            : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100 hover:bg-indigo-700'
                            }`}
                    >
                        {isPlaying ? (
                            <>
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                <span>STOP</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                <span>START</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Tempo</div>
                    <div className="text-sm font-bold text-slate-700">
                        {bpm <= 60 ? 'Adagio' : bpm <= 76 ? 'Andante' : bpm <= 120 ? 'Moderato' : bpm <= 168 ? 'Allegro' : 'Presto'}
                    </div>
                </div>
                <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Rhythm</div>
                    <div className="text-sm font-bold text-slate-700">{beatsPerMeasure} Beats</div>
                </div>
            </div>
        </div>
    );
};

export default Metronome;
