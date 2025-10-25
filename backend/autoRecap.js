const { getPitches, calculateResults, getSessionState, updateSessionState, getRatings } = require('./storage');

let recapTimer = null;

// Auto-start recap when all pitches have ratings
function checkAndStartAutoRecap() {
  const pitches = getPitches();
  const ratings = getRatings();
  const state = getSessionState();
  
  // Don't start if already in recap or active poll
  if (state.status !== 'idle') return;
  
  // Check if all pitches have been rated
  const allPitchesRated = pitches.every(pitch => {
    const pitchRatings = ratings.filter(r => r.pitch_id === pitch.id);
    return pitchRatings.length > 0;
  });
  
  if (allPitchesRated && pitches.length > 0) {
    // Start recap automatically
    updateSessionState({ status: 'recap', recap_index: 0, current_pitch_id: null });
    startAutoAdvance();
  }
}

// Auto-advance to next pitch every 30 seconds
function startAutoAdvance() {
  stopAutoAdvance(); // Clear any existing timer
  
  recapTimer = setInterval(() => {
    const state = getSessionState();
    const pitches = getPitches();
    
    if (state.status !== 'recap') {
      stopAutoAdvance();
      return;
    }
    
    const nextIndex = state.recap_index + 1;
    
    if (nextIndex >= pitches.length) {
      // End of recap, enable feedback
      updateSessionState({ status: 'idle', recap_index: 0, feedback_enabled: true });
      stopAutoAdvance();
    } else {
      // Move to next pitch
      updateSessionState({ recap_index: nextIndex });
    }
  }, 30000); // 30 seconds
}

function stopAutoAdvance() {
  if (recapTimer) {
    clearInterval(recapTimer);
    recapTimer = null;
  }
}

// Manual trigger for testing
function forceStartRecap() {
  const pitches = getPitches();
  if (pitches.length === 0) return false;
  
  updateSessionState({ status: 'recap', recap_index: 0, current_pitch_id: null });
  startAutoAdvance();
  return true;
}

module.exports = {
  checkAndStartAutoRecap,
  forceStartRecap,
  stopAutoAdvance
};
