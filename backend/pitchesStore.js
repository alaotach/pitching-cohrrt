const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const PITCHES_FILE = path.join(DATA_DIR, 'pitches.json');

function savePitches(pitches) {
  fs.writeFileSync(PITCHES_FILE, JSON.stringify(pitches, null, 2), 'utf-8');
}

function loadPitches() {
  if (!fs.existsSync(PITCHES_FILE)) return [];
  return JSON.parse(fs.readFileSync(PITCHES_FILE, 'utf-8'));
}

module.exports = { savePitches, loadPitches, PITCHES_FILE };
