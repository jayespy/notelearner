
import React from 'react';
import { MusicalNote, Clef } from '../types';
import { NOTE_STEP_MAP, CLEF_ANCHORS } from '../constants';

interface StaffRendererProps {
  note: MusicalNote;
}

const StaffRenderer: React.FC<StaffRendererProps> = ({ note }) => {
  const staffWidth = 240;
  const staffHeight = 160;
  const lineSpacing = 14;
  const centerY = staffHeight / 2;
  
  // Calculate vertical position
  // We determine the offset from the bottom line of the clef
  const anchor = CLEF_ANCHORS[note.clef];
  const anchorSteps = (anchor.octave * 7) + NOTE_STEP_MAP[anchor.name];
  const targetSteps = (note.octave * 7) + NOTE_STEP_MAP[note.name];
  const stepDiff = targetSteps - anchorSteps;
  
  // Each step (e.g. C to D) is half a line spacing
  // The bottom line (index 0) is at Y = baseline
  const baseline = centerY + (2 * lineSpacing);
  const noteY = baseline - (stepDiff * (lineSpacing / 2));
  
  const lines = [0, 1, 2, 3, 4].map(i => baseline - (i * lineSpacing));

  // Determine if ledger lines are needed
  const ledgerLines: number[] = [];
  if (noteY > baseline + 2) {
    // Below staff
    for (let y = baseline + lineSpacing; y <= noteY + 2; y += lineSpacing) {
      ledgerLines.push(y);
    }
  } else if (noteY < lines[4] - 2) {
    // Above staff
    for (let y = lines[4] - lineSpacing; y >= noteY - 2; y -= lineSpacing) {
      ledgerLines.push(y);
    }
  }

  return (
    <div className="w-full flex justify-center py-8 bg-white rounded-xl shadow-inner border border-slate-100">
      <svg width={staffWidth} height={staffHeight} viewBox={`0 0 ${staffWidth} ${staffHeight}`} className="overflow-visible">
        {/* Draw Staff Lines */}
        {lines.map((y, i) => (
          <line key={i} x1="20" y1={y} x2={staffWidth - 20} y2={y} stroke="#334155" strokeWidth="1.5" />
        ))}

        {/* Draw Clef */}
        <text 
            x="30" 
            y={note.clef === 'TREBLE' ? baseline - lineSpacing * 1.2 : baseline - lineSpacing * 2.5} 
            fontSize={note.clef === 'TREBLE' ? "75" : "60"} 
            className="select-none fill-slate-800 font-serif"
            style={{ fontFamily: 'serif' }}
        >
          {note.clef === 'TREBLE' ? '𝄞' : '𝄢'}
        </text>

        {/* Ledger Lines */}
        {ledgerLines.map((y, i) => (
          <line key={i} x1={staffWidth / 2 - 15} y1={y} x2={staffWidth / 2 + 15} y2={y} stroke="#334155" strokeWidth="1.5" />
        ))}

        {/* Accidental */}
        {note.accidental !== 'none' && (
           <text 
             x={staffWidth / 2 - 28} 
             y={noteY + 8} 
             fontSize="30" 
             className="fill-slate-800"
           >
             {note.accidental === 'sharp' ? '♯' : note.accidental === 'flat' ? '♭' : '♮'}
           </text>
        )}

        {/* Note Head */}
        <ellipse 
          cx={staffWidth / 2} 
          cy={noteY} 
          rx="8" 
          ry="6" 
          transform={`rotate(-20, ${staffWidth / 2}, ${noteY})`}
          className="fill-slate-900"
        />

        {/* Note Stem (Conditional logic for direction) */}
        {/* Generally, notes on the middle line and above have stems pointing down */}
        {(() => {
            const middleLineY = lines[2];
            const isPointingUp = noteY > middleLineY;
            const stemX = isPointingUp ? (staffWidth / 2) + 7.5 : (staffWidth / 2) - 7.5;
            const stemHeight = lineSpacing * 3.5;
            const stemYEnd = isPointingUp ? noteY - stemHeight : noteY + stemHeight;
            
            return (
              <line 
                x1={stemX} 
                y1={noteY} 
                x2={stemX} 
                y2={stemYEnd} 
                stroke="#0f172a" 
                strokeWidth="1.5" 
              />
            );
        })()}
      </svg>
    </div>
  );
};

export default StaffRenderer;
