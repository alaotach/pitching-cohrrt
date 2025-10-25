const express = require('express');
const router = express.Router();
const { getPitches, calculateResults, getSessionState, updateSessionState } = require('../storage');
const { forceStartRecap, stopAutoAdvance } = require('../autoRecap');

// Start recap (now automated, but keep for manual trigger)
router.post('/start', (req, res) => {
  try {
    const success = forceStartRecap();
    if (!success) {
      return res.status(400).json({ error: 'No pitches available' });
    }
    
    const pitches = getPitches();
    const firstPitch = pitches[0];
    const results = calculateResults(firstPitch.id);
    
    res.json({
      pitch: firstPitch,
      index: 0,
      total: pitches.length,
      results
    });
  } catch (error) {
    console.error('Recap start error:', error);
    res.status(500).json({ error: 'Failed to start recap' });
  }
});

// Get current recap pitch
router.get('/current', (req, res) => {
  try {
    const state = getSessionState();
    
    if (state.status !== 'recap') {
      return res.json({ active: false });
    }
    
    const pitches = getPitches();
    const currentPitch = pitches[state.recap_index];
    
    if (!currentPitch) {
      return res.json({ active: false });
    }
    
    const results = calculateResults(currentPitch.id);
    
    res.json({
      active: true,
      pitch: currentPitch,
      index: state.recap_index,
      total: pitches.length,
      results
    });
  } catch (error) {
    console.error('Get recap error:', error);
    res.status(500).json({ error: 'Failed to get recap' });
  }
});

// Next pitch
router.post('/next', (req, res) => {
  try {
    const pitches = getPitches();
    const state = getSessionState();
    const nextIndex = state.recap_index + 1;
    
    if (nextIndex >= pitches.length) {
      // End of recap
      updateSessionState({ status: 'idle', recap_index: 0, feedback_enabled: true });
      return res.json({ ended: true, feedback_enabled: true });
    }
    
    updateSessionState({ recap_index: nextIndex });
    const nextPitch = pitches[nextIndex];
    const results = calculateResults(nextPitch.id);
    
    res.json({
      pitch: nextPitch,
      index: nextIndex,
      total: pitches.length,
      results
    });
  } catch (error) {
    console.error('Recap next error:', error);
    res.status(500).json({ error: 'Failed to go to next pitch' });
  }
});

// Previous pitch
router.post('/previous', (req, res) => {
  try {
    const pitches = getPitches();
    const state = getSessionState();
    const prevIndex = Math.max(0, state.recap_index - 1);
    
    updateSessionState({ recap_index: prevIndex });
    const prevPitch = pitches[prevIndex];
    const results = calculateResults(prevPitch.id);
    
    res.json({
      pitch: prevPitch,
      index: prevIndex,
      total: pitches.length,
      results
    });
  } catch (error) {
    console.error('Recap previous error:', error);
    res.status(500).json({ error: 'Failed to go to previous pitch' });
  }
});

// End recap
router.post('/end', (req, res) => {
  try {
    stopAutoAdvance();
    updateSessionState({ status: 'idle', recap_index: 0, feedback_enabled: true });
    res.json({ success: true, feedback_enabled: true });
  } catch (error) {
    console.error('Recap end error:', error);
    res.status(500).json({ error: 'Failed to end recap' });
  }
});

module.exports = router;
