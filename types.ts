
export type Clef = 'TREBLE' | 'BASS';

export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type Accidental = 'sharp' | 'flat' | 'natural' | 'none';

export type DifficultyLevel = 1 | 2 | 3;

export interface MusicalNote {
  name: NoteName;
  octave: number;
  accidental: Accidental;
  clef: Clef;
}

export interface Challenge {
  level: DifficultyLevel;
  // Level 1: single note
  singleNote?: MusicalNote;
  // Level 2: sequence of 3-4 notes
  sequence?: MusicalNote[];
  // Level 3: parallel treble and bass notes
  trebleNotes?: MusicalNote[];
  bassNotes?: MusicalNote[];
}

export type AppMode = 'STRICT' | 'REVEAL';
