const express = require('express');
const router = express.Router();
const { getSessionState, getPitches, updateSessionState } = require('../storage.js');

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

// POST start poll
router.post('/poll/start', (req, res) => {
  try {
    const { pitchId } = req.body;
    const pitches = getPitches();
    const pitch = pitches.find(p => p.id === pitchId);
    
    if (!pitch) {
      return res.status(404).json({ error: 'Pitch not found' });
    }
    
    const updatedState = updateSessionState({ 
      current_pitch_id: pitchId, 
      status: 'active' 
    });
    
    res.json({ 
      sessionState: updatedState,
      pitch
    });
  } catch (error) {
    console.error('Poll start error:', error);
    res.status(500).json({ error: 'Failed to start poll' });
  }
});

// POST stop poll
router.post('/poll/stop', (req, res) => {
  try {
    const updatedState = updateSessionState({ 
      current_pitch_id: null, 
      status: 'idle' 
    });
    
    res.json({ sessionState: updatedState });
  } catch (error) {
    console.error('Poll stop error:', error);
    res.status(500).json({ error: 'Failed to stop poll' });
  }
});

// POST toggle feedback
router.post('/feedback/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const updatedState = updateSessionState({ feedback_enabled: enabled });
    res.json({ sessionState: updatedState });
  } catch (error) {
    console.error('Feedback toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle feedback' });
  }
});

module.exports = router;
