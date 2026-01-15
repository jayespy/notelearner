
import React from 'react';

export const TREBLE_CLEF_PATH = "M15.5 50.5c-2.3 0-4.3-.8-5.9-2.3-1.6-1.5-2.4-3.5-2.4-5.8 0-2.3.8-4.3 2.4-5.9 1.6-1.6 3.6-2.4 5.9-2.4s4.3.8 5.9 2.4c1.6 1.6 2.4 3.6 2.4 5.9 0 2.3-.8 4.3-2.4 5.9-1.6 1.5-3.6 2.2-5.9 2.2zM22.5 45.5v-30c0-1.7-.6-3.1-1.8-4.2-1.2-1.2-2.6-1.8-4.2-1.8s-3.1.6-4.2 1.8c-1.2 1.2-1.8 2.6-1.8 4.2v30c0 1.7.6 3.1 1.8 4.2 1.2 1.2 2.6 1.8 4.2 1.8s3.1-.6 4.2-1.8c1.2-1.2 1.8-2.6 1.8-4.2z";

// Map Note Name to its position relative to C in an octave
export const NOTE_STEP_MAP: Record<string, number> = {
  'C': 0,
  'D': 1,
  'E': 2,
  'F': 3,
  'G': 4,
  'A': 5,
  'B': 6
};

// Map Base Clef / Treble Clef to their anchor notes (Line 1)
export const CLEF_ANCHORS = {
  TREBLE: { name: 'E', octave: 4 }, // Bottom line is E4
  BASS: { name: 'G', octave: 2 }    // Bottom line is G2
};
