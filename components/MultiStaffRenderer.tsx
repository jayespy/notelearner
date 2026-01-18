
import React from 'react';
import { MusicalNote, Clef, Challenge } from '../types';
import { NOTE_STEP_MAP, CLEF_ANCHORS } from '../constants';

interface MultiStaffRendererProps {
    challenge: Challenge;
    playedNotes?: boolean[];
    wrongNoteIndex?: number;
}

const MultiStaffRenderer: React.FC<MultiStaffRendererProps> = ({ challenge, playedNotes = [], wrongNoteIndex }) => {
    const lineSpacing = 14;
    const noteSpacing = 60; // Horizontal spacing between notes in a sequence

    // Calculate note position
    const calculateNoteY = (note: MusicalNote, baseline: number): number => {
        const anchor = CLEF_ANCHORS[note.clef];
        const anchorSteps = (anchor.octave * 7) + NOTE_STEP_MAP[anchor.name];
        const targetSteps = (note.octave * 7) + NOTE_STEP_MAP[note.name];
        const stepDiff = targetSteps - anchorSteps;
        return baseline - (stepDiff * (lineSpacing / 2));
    };

    // Calculate ledger lines for a note
    const calculateLedgerLines = (noteY: number, baseline: number, topLine: number): number[] => {
        const ledgerLines: number[] = [];
        if (noteY > baseline + 2) {
            // Below staff
            for (let y = baseline + lineSpacing; y <= noteY + 2; y += lineSpacing) {
                ledgerLines.push(y);
            }
        } else if (noteY < topLine - 2) {
            // Above staff
            for (let y = topLine - lineSpacing; y >= noteY - 2; y -= lineSpacing) {
                ledgerLines.push(y);
            }
        }
        return ledgerLines;
    };

    // Render a single staff with notes
    const renderStaff = (notes: MusicalNote[], clef: Clef, startX: number, startY: number, width: number, startIndex: number = 0) => {
        const baseline = startY + (2 * lineSpacing);
        const lines = [0, 1, 2, 3, 4].map(i => baseline - (i * lineSpacing));
        const middleLineY = lines[2];

        return (
            <g>
                {/* Staff Lines */}
                {lines.map((y, i) => (
                    <line key={`line-${i}`} x1={startX} y1={y} x2={startX + width} y2={y} stroke="#334155" strokeWidth="1.5" />
                ))}

                {/* Clef */}
                <text
                    x={startX + 10}
                    y={clef === 'TREBLE' ? baseline - lineSpacing * 1.2 : baseline - lineSpacing * 2.5}
                    fontSize={clef === 'TREBLE' ? "75" : "60"}
                    className="select-none fill-slate-800 font-serif"
                    style={{ fontFamily: 'serif' }}
                >
                    {clef === 'TREBLE' ? '𝄞' : '𝄢'}
                </text>

                {/* Notes */}
                {notes.map((note, index) => {
                    const globalIndex = startIndex + index;
                    const noteX = startX + 70 + (index * noteSpacing);
                    const noteY = calculateNoteY(note, baseline);
                    const ledgerLines = calculateLedgerLines(noteY, baseline, lines[4]);
                    const isPointingUp = noteY > middleLineY;
                    const stemX = isPointingUp ? noteX + 7.5 : noteX - 7.5;
                    const stemHeight = lineSpacing * 3.5;
                    const stemYEnd = isPointingUp ? noteY - stemHeight : noteY + stemHeight;

                    // Determine note color based on state
                    const isPlayed = playedNotes[globalIndex] === true;
                    const isWrong = wrongNoteIndex === globalIndex;
                    const noteFillClass = isWrong ? 'fill-red-500' : isPlayed ? 'fill-emerald-500' : 'fill-slate-900';
                    const stemColor = isWrong ? '#ef4444' : isPlayed ? '#10b981' : '#0f172a';

                    return (
                        <g key={`note-${index}`}>
                            {/* Ledger Lines */}
                            {ledgerLines.map((y, i) => (
                                <line key={`ledger-${index}-${i}`} x1={noteX - 15} y1={y} x2={noteX + 15} y2={y} stroke="#334155" strokeWidth="1.5" />
                            ))}

                            {/* Accidental */}
                            {note.accidental !== 'none' && (
                                <text
                                    x={noteX - 28}
                                    y={noteY + 8}
                                    fontSize="30"
                                    className="fill-slate-800"
                                >
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
                                className={`${noteFillClass} transition-all duration-200`}
                                style={isWrong ? { animation: 'pulse 0.3s ease-in-out' } : {}}
                            />

                            {/* Note Stem */}
                            <line
                                x1={stemX}
                                y1={noteY}
                                x2={stemX}
                                y2={stemYEnd}
                                stroke={stemColor}
                                strokeWidth="1.5"
                                className="transition-all duration-200"
                            />
                        </g>
                    );
                })}
            </g>
        );
    };

    // Determine dimensions based on difficulty level
    let svgWidth = 240;
    let svgHeight = 160;
    let content;

    if (challenge.level === 1 && challenge.singleNote) {
        // Level 1: Single note
        svgWidth = 240;
        svgHeight = 160;
        content = renderStaff([challenge.singleNote], challenge.singleNote.clef, 20, 20, 200);
    } else if (challenge.level === 2 && challenge.sequence) {
        // Level 2: Sequence of notes
        const noteCount = challenge.sequence.length;
        svgWidth = 140 + (noteCount * noteSpacing);
        svgHeight = 160;
        content = renderStaff(challenge.sequence, challenge.sequence[0].clef, 20, 20, svgWidth - 40);
    } else if (challenge.level === 3 && challenge.trebleNotes && challenge.bassNotes) {
        // Level 3: Grand staff (treble + bass)
        const noteCount = Math.max(challenge.trebleNotes.length, challenge.bassNotes.length);
        svgWidth = 140 + (noteCount * noteSpacing);
        svgHeight = 320; // Double height for two staves

        const staffWidth = svgWidth - 40;
        const trebleStartY = 20;
        const bassStartY = 180;
        const baseline = trebleStartY + (2 * lineSpacing);
        const lines = [0, 1, 2, 3, 4].map(i => baseline - (i * lineSpacing));
        const middleLineY = lines[2];

        // For Level 3, we need to render notes with interleaved indices
        // Treble notes: indices 0, 2, 4, 6... (even)
        // Bass notes: indices 1, 3, 5, 7... (odd)
        const renderGrandStaff = () => {
            const trebleBaseline = trebleStartY + (2 * lineSpacing);
            const trebleLines = [0, 1, 2, 3, 4].map(i => trebleBaseline - (i * lineSpacing));
            const trebleMiddleLineY = trebleLines[2];

            const bassBaseline = bassStartY + (2 * lineSpacing);
            const bassLines = [0, 1, 2, 3, 4].map(i => bassBaseline - (i * lineSpacing));
            const bassMiddleLineY = bassLines[2];

            return (
                <g>
                    {/* Treble Staff Lines */}
                    {trebleLines.map((y, i) => (
                        <line key={`treble-line-${i}`} x1={20} y1={y} x2={20 + staffWidth} y2={y} stroke="#334155" strokeWidth="1.5" />
                    ))}

                    {/* Treble Clef */}
                    <text
                        x={30}
                        y={trebleBaseline - lineSpacing * 1.2}
                        fontSize="75"
                        className="select-none fill-slate-800 font-serif"
                        style={{ fontFamily: 'serif' }}
                    >
                        𝄞
                    </text>

                    {/* Bass Staff Lines */}
                    {bassLines.map((y, i) => (
                        <line key={`bass-line-${i}`} x1={20} y1={y} x2={20 + staffWidth} y2={y} stroke="#334155" strokeWidth="1.5" />
                    ))}

                    {/* Bass Clef */}
                    <text
                        x={30}
                        y={bassBaseline - lineSpacing * 2.5}
                        fontSize="60"
                        className="select-none fill-slate-800 font-serif"
                        style={{ fontFamily: 'serif' }}
                    >
                        𝄢
                    </text>

                    {/* Treble Notes */}
                    {challenge.trebleNotes.map((note, index) => {
                        const globalIndex = index * 2; // Even indices: 0, 2, 4, 6...
                        const noteX = 20 + 70 + (index * noteSpacing);
                        const noteY = calculateNoteY(note, trebleBaseline);
                        const ledgerLines = calculateLedgerLines(noteY, trebleBaseline, trebleLines[4]);
                        const isPointingUp = noteY > trebleMiddleLineY;
                        const stemX = isPointingUp ? noteX + 7.5 : noteX - 7.5;
                        const stemHeight = lineSpacing * 3.5;
                        const stemYEnd = isPointingUp ? noteY - stemHeight : noteY + stemHeight;

                        const isPlayed = playedNotes[globalIndex] === true;
                        const isWrong = wrongNoteIndex === globalIndex;
                        const noteFillClass = isWrong ? 'fill-red-500' : isPlayed ? 'fill-emerald-500' : 'fill-slate-900';
                        const stemColor = isWrong ? '#ef4444' : isPlayed ? '#10b981' : '#0f172a';

                        return (
                            <g key={`treble-note-${index}`}>
                                {ledgerLines.map((y, i) => (
                                    <line key={`treble-ledger-${index}-${i}`} x1={noteX - 15} y1={y} x2={noteX + 15} y2={y} stroke="#334155" strokeWidth="1.5" />
                                ))}
                                {note.accidental !== 'none' && (
                                    <text x={noteX - 28} y={noteY + 8} fontSize="30" className="fill-slate-800">
                                        {note.accidental === 'sharp' ? '♯' : note.accidental === 'flat' ? '♭' : '♮'}
                                    </text>
                                )}
                                <ellipse
                                    cx={noteX} cy={noteY} rx="8" ry="6"
                                    transform={`rotate(-20, ${noteX}, ${noteY})`}
                                    className={`${noteFillClass} transition-all duration-200`}
                                    style={isWrong ? { animation: 'pulse 0.3s ease-in-out' } : {}}
                                />
                                <line
                                    x1={stemX} y1={noteY} x2={stemX} y2={stemYEnd}
                                    stroke={stemColor} strokeWidth="1.5"
                                    className="transition-all duration-200"
                                />
                            </g>
                        );
                    })}

                    {/* Bass Notes */}
                    {challenge.bassNotes.map((note, index) => {
                        const globalIndex = index * 2 + 1; // Odd indices: 1, 3, 5, 7...
                        const noteX = 20 + 70 + (index * noteSpacing);
                        const noteY = calculateNoteY(note, bassBaseline);
                        const ledgerLines = calculateLedgerLines(noteY, bassBaseline, bassLines[4]);
                        const isPointingUp = noteY > bassMiddleLineY;
                        const stemX = isPointingUp ? noteX + 7.5 : noteX - 7.5;
                        const stemHeight = lineSpacing * 3.5;
                        const stemYEnd = isPointingUp ? noteY - stemHeight : noteY + stemHeight;

                        const isPlayed = playedNotes[globalIndex] === true;
                        const isWrong = wrongNoteIndex === globalIndex;
                        const noteFillClass = isWrong ? 'fill-red-500' : isPlayed ? 'fill-emerald-500' : 'fill-slate-900';
                        const stemColor = isWrong ? '#ef4444' : isPlayed ? '#10b981' : '#0f172a';

                        return (
                            <g key={`bass-note-${index}`}>
                                {ledgerLines.map((y, i) => (
                                    <line key={`bass-ledger-${index}-${i}`} x1={noteX - 15} y1={y} x2={noteX + 15} y2={y} stroke="#334155" strokeWidth="1.5" />
                                ))}
                                {note.accidental !== 'none' && (
                                    <text x={noteX - 28} y={noteY + 8} fontSize="30" className="fill-slate-800">
                                        {note.accidental === 'sharp' ? '♯' : note.accidental === 'flat' ? '♭' : '♮'}
                                    </text>
                                )}
                                <ellipse
                                    cx={noteX} cy={noteY} rx="8" ry="6"
                                    transform={`rotate(-20, ${noteX}, ${noteY})`}
                                    className={`${noteFillClass} transition-all duration-200`}
                                    style={isWrong ? { animation: 'pulse 0.3s ease-in-out' } : {}}
                                />
                                <line
                                    x1={stemX} y1={noteY} x2={stemX} y2={stemYEnd}
                                    stroke={stemColor} strokeWidth="1.5"
                                    className="transition-all duration-200"
                                />
                            </g>
                        );
                    })}

                    {/* Brace connecting the staves */}
                    <path
                        d={`M 15 ${trebleStartY + 20} Q 10 ${(trebleStartY + bassStartY) / 2 + 40} 15 ${bassStartY + 60}`}
                        stroke="#334155"
                        strokeWidth="2"
                        fill="none"
                    />
                </g>
            );
        };

        content = renderGrandStaff();
    }

    return (
        <div className="w-full flex justify-center py-8 bg-white rounded-xl shadow-inner border border-slate-100">
            <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
                {content}
            </svg>
        </div>
    );
};

export default MultiStaffRenderer;
