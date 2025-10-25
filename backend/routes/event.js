const express = require('express');
const router = express.Router();
const { startAutoPitchProgression, advanceToNextPitch, resetEvent } = require('../autoProgression');
const { getSessionState } = require('../storage');

// Start the event (begins auto-progression through all pitches)
router.post('/start', (req, res) => {
  try {
    const success = startAutoPitchProgression();
    if (!success) {
      return res.status(400).json({ error: 'No pitches available' });
    }
    const state = getSessionState();
    res.json({ success: true, sessionState: state });
  } catch (error) {
    console.error('Event start error:', error);
    res.status(500).json({ error: 'Failed to start event' });
  }
});

// Skip to next pitch immediately (manual override)
router.post('/next', (req, res) => {
  try {
    advanceToNextPitch();
    const state = getSessionState();
    res.json({ success: true, sessionState: state });
  } catch (error) {
    console.error('Next pitch error:', error);
    res.status(500).json({ error: 'Failed to advance' });
  }
});

// Reset event to beginning
router.post('/reset', (req, res) => {
  try {
    resetEvent();
    const state = getSessionState();
    res.json({ success: true, sessionState: state });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset event' });
  }
});

module.exports = router;
