const express = require('express');
const router = express.Router();
const { getSessionState, getPitches } = require('../storage.js');

// GET session state (persistent)
router.get('/', (req, res) => {
  const sessionState = getSessionState();
  const pitches = getPitches();
  let activePitch = null;
  if (sessionState.current_pitch_id) {
    activePitch = pitches.find(p => p.id === sessionState.current_pitch_id) || null;
  }
  res.json({ sessionState, activePitch });
});

module.exports = router;
