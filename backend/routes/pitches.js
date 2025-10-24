const express = require('express');
const router = express.Router();
const { getPitches } = require('../storage.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');
const PITCHES_FILE = path.join(DATA_DIR, 'pitches.json');

function savePitches(pitches) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PITCHES_FILE, JSON.stringify(pitches, null, 2), 'utf-8');
}

// GET all pitches

router.get('/', (req, res) => {
  const pitches = getPitches();
  res.json(pitches);
});

// POST create a new pitch
router.post('/', (req, res) => {
  const pitches = getPitches();
  const { title, description } = req.body;
  const newPitch = {
    id: uuidv4(),
    title,
    description: description || '',
    order: pitches.length + 1,
    created_at: new Date().toISOString()
  };
  pitches.push(newPitch);
  savePitches(pitches);
  res.status(201).json(newPitch);
});

// PUT update a pitch
router.put('/:id', (req, res) => {
  const pitches = getPitches();
  const { id } = req.params;
  const { title, description, order } = req.body;
  const pitch = pitches.find(p => p.id === id);
  if (!pitch) return res.status(404).json({ error: 'Pitch not found' });
  if (title !== undefined) pitch.title = title;
  if (description !== undefined) pitch.description = description;
  if (order !== undefined) pitch.order = order;
  savePitches(pitches);
  res.json(pitch);
});

// DELETE a pitch
router.delete('/:id', (req, res) => {
  const pitches = getPitches();
  const { id } = req.params;
  const idx = pitches.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Pitch not found' });
  pitches.splice(idx, 1);
  savePitches(pitches);
  res.json({ success: true });
});

module.exports = router;
