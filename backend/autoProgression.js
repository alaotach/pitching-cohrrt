const { getPitches, getSessionState, updateSessionState, getRatings, calculateResults } = require('./storage');

let progressTimer = null;
let recapTimer = null;

// Start the automatic pitch progression
function startAutoPitchProgression() {
  stopAutoPitchProgression(); // Clear any existing timers
  
  const pitches = getPitches();
  if (pitches.length === 0) return false;
  
  // Start with first pitch
  const firstPitch = pitches[0];
  updateSessionState({ 
    status: 'active', 
    current_pitch_id: firstPitch.id,
    recap_index: 0
  });
  
  // Auto-advance after 2 minutes
  scheduleNextPitch(2 * 60 * 1000); // 2 minutes
  return true;
}

// Move to next pitch or start recap
function advanceToNextPitch() {
  const state = getSessionState();
  const pitches = getPitches();
  
  if (state.status !== 'active' || !state.current_pitch_id) return;
  
  const currentIndex = pitches.findIndex(p => p.id === state.current_pitch_id);
  const nextIndex = currentIndex + 1;
  
  if (nextIndex >= pitches.length) {
    // All pitches done, start recap
    startRecapMode();
  } else {
    // Move to next pitch
    const nextPitch = pitches[nextIndex];
    updateSessionState({ 
      current_pitch_id: nextPitch.id,
      status: 'active'
    });
    
    // Schedule next advancement
    scheduleNextPitch(2 * 60 * 1000); // 2 minutes
  }
}

function scheduleNextPitch(delay) {
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(() => {
    advanceToNextPitch();
  }, delay);
}

// Start recap mode showing all results
function startRecapMode() {
  stopAutoPitchProgression();
  
  const pitches = getPitches();
  if (pitches.length === 0) return;
  
  updateSessionState({ 
    status: 'recap', 
    current_pitch_id: null,
    recap_index: 0
  });
  
  // Auto-advance through recap every 15 seconds
  startRecapAutoAdvance();
}

function startRecapAutoAdvance() {
  if (recapTimer) clearInterval(recapTimer);
  
  recapTimer = setInterval(() => {
    const state = getSessionState();
    const pitches = getPitches();
    
    if (state.status !== 'recap') {
      stopRecapAutoAdvance();
      return;
    }
    
    const nextIndex = state.recap_index + 1;
    
    if (nextIndex >= pitches.length) {
      // End recap, show feedback
      updateSessionState({ 
        status: 'idle', 
        recap_index: 0, 
        feedback_enabled: true,
        current_pitch_id: null
      });
      stopRecapAutoAdvance();
    } else {
      // Show next pitch recap
      updateSessionState({ recap_index: nextIndex });
    }
  }, 15000); // 15 seconds per pitch
}

function stopAutoPitchProgression() {
  if (progressTimer) {
    clearTimeout(progressTimer);
    progressTimer = null;
  }
}

function stopRecapAutoAdvance() {
  if (recapTimer) {
    clearInterval(recapTimer);
    recapTimer = null;
  }
}

function resetEvent() {
  stopAutoPitchProgression();
  stopRecapAutoAdvance();
  updateSessionState({ 
    status: 'idle', 
    current_pitch_id: null,
    recap_index: 0,
    feedback_enabled: false
  });
}

module.exports = {
  startAutoPitchProgression,
  advanceToNextPitch,
  resetEvent,
  stopAutoPitchProgression,
  stopRecapAutoAdvance
};
