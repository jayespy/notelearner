# 🎹 MIDI Keyboard Setup Guide

## What Changed

Your NoteMaster app now supports **MIDI keyboards** (like your Yamaha keyboard)! 

The app uses the **Web MIDI API** to detect notes played on your physical MIDI keyboard.

## Setup Instructions

### 1. Connect Your Yamaha Keyboard

1. **Connect via USB**: Plug your Yamaha keyboard into your Mac using a USB cable
2. **Power on**: Make sure your keyboard is powered on
3. **Check Mac recognizes it**: 
   - Go to **System Settings > MIDI Studio** (or use Audio MIDI Setup app)
   - You should see your Yamaha keyboard listed

### 2. Open the App in Browser

1. Navigate to: `http://localhost:3000/`
2. **IMPORTANT**: The app will ask for MIDI permission - **ALLOW IT**
3. Look for the **green indicator** in the top-left corner:
   - ✅ **Green "MIDI Connected"** = Your keyboard is detected!
   - ⚠️ **Gray "MIDI Not Connected"** = Keyboard not detected

### 3. Test Your Keyboard

1. Make sure you're in **Quiz Mode** (not Study Mode)
2. Look at the musical staff showing a note
3. **Play that note on your Yamaha keyboard**
4. If correct, the app will automatically advance to the next note!

## How It Works

- The app listens for MIDI "Note On" messages from your keyboard
- When you play a note, it compares:
  - **Note name** (C, D, E, F, G, A, B)
  - **Accidental** (sharp, flat, or natural)
  - **Octave** (the specific octave)
- All three must match for the answer to be correct

## Troubleshooting

### "MIDI Not Connected" shows gray

**Try these steps:**

1. **Refresh the browser** - The MIDI API initializes on page load
2. **Check browser permissions**:
   - Chrome: Click the lock icon in address bar > Site settings > MIDI devices > Allow
   - Safari: Preferences > Websites > MIDI > Allow for localhost
3. **Reconnect your keyboard**: Unplug and replug the USB cable
4. **Check macOS Audio MIDI Setup**:
   - Open "Audio MIDI Setup" app
   - Window > Show MIDI Studio
   - Your Yamaha keyboard should appear

### Notes not being detected

1. Check the **console** (F12 > Console tab) for messages like:
   - `🎹 MIDI Note: ...` - This means notes ARE being detected
   - `❌ Wrong MIDI note` - Note detected but doesn't match
2. Make sure you're playing the **exact note** shown (including octave)
3. Try playing different notes and watch the "Last note" indicator

### Browser Compatibility

- ✅ **Chrome/Edge**: Full support
- ✅ **Opera**: Full support  
- ⚠️ **Safari**: Requires macOS 10.15+ and may need permission
- ❌ **Firefox**: Limited/no Web MIDI support

## Console Debugging

Open the browser console (F12) to see detailed logs:
- `✅ MIDI Access granted` - MIDI initialized successfully
- `🎹 Found X MIDI input device(s)` - Lists your connected keyboards
- `🎹 MIDI Note: {note: 60, noteName: "C4"}` - Shows each note you play
- `✅ Correct MIDI note!` - You played the right note!
- `❌ Wrong MIDI note` - You played the wrong note

## Features

- **Computer keyboard still works**: You can use both MIDI keyboard AND computer keys
- **Real-time feedback**: See each note you play in the top-left indicator
- **Automatic progression**: Correct notes automatically advance to the next question
- **Octave-aware**: The app checks the exact octave, not just the note name

Enjoy learning with your Yamaha keyboard! 🎹🎵
