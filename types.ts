
export type Clef = 'TREBLE' | 'BASS';

export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type Accidental = 'sharp' | 'flat' | 'natural' | 'none';

export interface MusicalNote {
  name: NoteName;
  octave: number;
  accidental: Accidental;
  clef: Clef;
}

export type AppMode = 'STRICT' | 'REVEAL';

// Fix for services/gemini.ts: Exporting the interface expected for mnemonic responses
export interface MnemonicResponse {
  mnemonic: string;
  fact: string;
}
