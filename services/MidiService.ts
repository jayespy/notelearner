// MIDI Service for detecting and handling MIDI keyboard input
import { NoteName, Accidental } from '../types';

export interface MidiNote {
    note: number; // MIDI note number (0-127)
    velocity: number; // How hard the key was pressed (0-127)
    noteName: string; // e.g., "C4", "D#5"
}

export class MidiService {
    private midiAccess: MIDIAccess | null = null;
    private onNoteCallback: ((note: MidiNote) => void) | null = null;

    async initialize(): Promise<boolean> {
        if (!navigator.requestMIDIAccess) {
            console.error('❌ Web MIDI API not supported in this browser');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            console.log('✅ MIDI Access granted');
            this.setupMidiInputs();
            return true;
        } catch (error) {
            console.error('❌ Failed to get MIDI access:', error);
            return false;
        }
    }

    private setupMidiInputs() {
        if (!this.midiAccess) return;

        const inputs = Array.from(this.midiAccess.inputs.values());
        console.log(`🎹 Found ${inputs.length} MIDI input device(s):`);

        inputs.forEach((input, index) => {
            console.log(`  ${index + 1}. ${input.name} (${input.manufacturer})`);
            input.onmidimessage = this.handleMidiMessage.bind(this);
        });

        if (inputs.length === 0) {
            console.warn('⚠️ No MIDI devices detected. Please connect your Yamaha keyboard.');
        }
    }

    private handleMidiMessage(event: MIDIMessageEvent) {
        const [status, note, velocity] = event.data;

        // Note On message (status byte 144-159, or 0x90-0x9F)
        const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;

        if (isNoteOn && this.onNoteCallback) {
            const midiNote: MidiNote = {
                note,
                velocity,
                noteName: this.midiNoteToName(note)
            };

            console.log('🎹 MIDI Note:', midiNote);
            this.onNoteCallback(midiNote);
        }
    }

    private midiNoteToName(midiNote: number): string {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteName = noteNames[midiNote % 12];
        return `${noteName}${octave}`;
    }

    // Convert MIDI note name to app's note format
    parseNoteName(noteName: string): { name: NoteName; accidental: Accidental; octave: number } {
        const match = noteName.match(/^([A-G])(#|b)?(\d+)$/);
        if (!match) {
            throw new Error(`Invalid note name: ${noteName}`);
        }

        const [, name, accidental, octaveStr] = match;
        return {
            name: name as NoteName,
            accidental: accidental === '#' ? 'sharp' : accidental === 'b' ? 'flat' : 'none',
            octave: parseInt(octaveStr)
        };
    }

    onNote(callback: (note: MidiNote) => void) {
        this.onNoteCallback = callback;
    }

    getConnectedDevices(): string[] {
        if (!this.midiAccess) return [];
        return Array.from(this.midiAccess.inputs.values()).map(input => input.name || 'Unknown Device');
    }

    isSupported(): boolean {
        return 'requestMIDIAccess' in navigator;
    }
}

export const midiService = new MidiService();
