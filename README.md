# 🎹 NoteMaster - Musical Flashcards

An interactive web application for learning to read musical notation using flashcards. Practice identifying notes on the treble and bass clefs with support for both computer keyboards and MIDI keyboards.

## Features

- 🎼 **Interactive Staff Renderer** - Displays notes on treble or bass clef
- 🎹 **MIDI Keyboard Support** - Connect your Yamaha or other MIDI keyboard for realistic practice
- ⌨️ **Computer Keyboard Support** - Use your computer keyboard (A-G keys) for quick practice
- 🎯 **Two Learning Modes**:
  - **Quiz Mode**: Test yourself by selecting the correct note
  - **Study Mode**: Flip cards to reveal answers
- ♯♭ **Accidentals Support** - Optional sharps and flats for advanced practice
- 📊 **Session Tracking** - Track your accuracy and progress

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000/`

## MIDI Keyboard Setup

For detailed instructions on connecting your MIDI keyboard, see [MIDI_SETUP.md](MIDI_SETUP.md).

## Technologies

- React 19
- TypeScript
- Vite
- Web MIDI API
- SVG-based staff rendering
