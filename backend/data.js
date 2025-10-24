// In-memory data store for demonstration (replace with DB in production)
let pitches = [];
let ratings = [];
let sessionState = { id: 'session', current_pitch_id: null, status: 'idle', updated_at: new Date().toISOString() };

module.exports = {
  pitches,
  ratings,
  sessionState
};
