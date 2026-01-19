
export type Clef = 'TREBLE' | 'BASS';

export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type Accidental = 'sharp' | 'flat' | 'natural' | 'none';

export type DifficultyLevel = 1 | 2 | 3;

export type PracticeMode = 'SINGLE' | 'MULTI' | 'MUSICAL';

export interface MusicalNote {
  name: NoteName;
  octave: number;
  accidental: Accidental;
  clef: Clef;
}

export interface Challenge {
  mode: PracticeMode;
  // SINGLE mode: single note
  singleNote?: MusicalNote;
  // MULTI mode: sequence of 3-4 notes
  sequence?: MusicalNote[];
  // MUSICAL mode: parallel treble and bass notes
  trebleNotes?: MusicalNote[];
  bassNotes?: MusicalNote[];
}

export type AppMode = 'STRICT' | 'REVEAL';
