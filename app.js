const VF = Vex.Flow;
let notes = []; // array of strings like "c/4"
const loadTextBtn = document.getElementById("loadTextBtn");

// 1. Populate key dropdowns
const KEYS = [
  "C", "G", "D", "A", "E", "B", "F#", "C#",
  "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"
];
function populateKeys() {
  const from = document.getElementById("keyFrom");
  const to = document.getElementById("keyTo");
  KEYS.forEach(k => {
    from.add(new Option(k, k));
    to.add(new Option(k, k));
  });
}
populateKeys();

// 2. Note input handlers
document.querySelectorAll(".note-input button[data-note]").forEach(btn => {
  btn.addEventListener("click", () => {
    notes.push(btn.dataset.note);
    renderStave("notation", notes);
  });
});
document.getElementById("clearBtn").addEventListener("click", () => {
  notes = [];
  renderStave("notation", notes);
  renderStave("transposedNotation", []);
});

// Text-entry loader
loadTextBtn.addEventListener("click", () => {
  const input = document.getElementById("noteText").value.trim();
  if (!input) return;
  notes = input.split(/\s+/);
  renderStave("notation", notes);
  renderStave("transposedNotation", []);
});

// Enable Enter key in text input to load notes
const noteTextInput = document.getElementById("noteText");
noteTextInput.addEventListener("keydown", e => {
  if (e.key === "Enter") loadTextBtn.click();
});

// 3. Transpose button
document.getElementById("transposeBtn").addEventListener("click", () => {
  const fromKey = document.getElementById("keyFrom").value;
  const toKey   = document.getElementById("keyTo").value;
  const transposed = transposeNotes(notes, fromKey, toKey);
  renderStave("transposedNotation", transposed);
});

// 4. Render function
function renderStave(containerId, noteArray) {
  const div = document.getElementById(containerId);
  div.innerHTML = "";
  if (!noteArray.length) return;
  const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
  renderer.resize(500, 150);
  const context = renderer.getContext();
  const stave   = new VF.Stave(10, 40, 480);
  stave.addClef("treble").setContext(context).draw();
  const vfNotes = noteArray.map(n => new VF.StaveNote({ keys: [n], duration: "q" }));
  new VF.Formatter().joinVoices([new VF.Voice({ num_beats: vfNotes.length, beat_value: 4 }).addTickables(vfNotes)])
    .formatToStave(vfNotes, stave);
  context.openGroup();
  vfNotes.forEach(n => n.setContext(context).draw());
  context.closeGroup();
}

// 5. Transposition logic
function transposeNotes(noteArray, fromKey, toKey) {
  const semitones = intervalBetweenKeys(fromKey, toKey);
  return noteArray.map(n => shiftNote(n, semitones));
}

// On-screen piano keyboard builder
function buildKeyboard() {
  const container = document.getElementById("keyboard");
  const whiteNotes = ["C","D","E","F","G","A","B"];
  const blackMap = { C: "C#", D: "D#", F: "F#", G: "G#", A: "A#" };
  const OCTAVES = [4,5];
  let keyIndex = 0;
  OCTAVES.forEach(oct => {
    whiteNotes.forEach(note => {
      const w = document.createElement("div");
      w.className = "white-key";
      w.dataset.note = `${note.toLowerCase()}/${oct}`;
      w.addEventListener("click", () => {
        notes.push(w.dataset.note);
        renderStave("notation", notes);
      });
      container.appendChild(w);
      if (blackMap[note]) {
        const b = document.createElement("div");
        b.className = "black-key";
        b.style.left = `${keyIndex * 40 + 28}px`;
        b.dataset.note = `${blackMap[note].toLowerCase()}/${oct}`;
        b.addEventListener("click", () => {
          notes.push(b.dataset.note);
          renderStave("notation", notes);
        });
        container.appendChild(b);
      }
      keyIndex++;
    });
  });
}
buildKeyboard();

// Helpers: map note name to MIDI, shift, map back
const NOTE_TO_SEMITONE = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11
};
function noteStringToMidi(noteStr) {
  const [name, octave] = noteStr.split("/");
  return NOTE_TO_SEMITONE[name] + 12 * (parseInt(octave, 10) + 1);
}
function midiToNoteString(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  const name = Object.keys(NOTE_TO_SEMITONE).find(k => NOTE_TO_SEMITONE[k] === semitone && k.length <= 2);
  return `${name}/${octave}`;
}
function shiftNote(noteStr, semitones) {
  const midi = noteStringToMidi(noteStr);
  return midiToNoteString(midi + semitones);
}
function intervalBetweenKeys(fromKey, toKey) {
  const from = NOTE_TO_SEMITONE[fromKey];
  const to   = NOTE_TO_SEMITONE[toKey];
  let diff = to - from;
  if (diff < 0) diff += 12;
  return diff;
}
