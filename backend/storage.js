const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const PITCHES_FILE = path.join(DATA_DIR, 'pitches.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const SESSION_FILE = path.join(DATA_DIR, 'session.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Pitches operations
function getPitches() {
  const pitches = readJsonFile(PITCHES_FILE, []);
  return pitches.sort((a, b) => a.order - b.order);
}

// Ratings operations
function getRatings() {
  return readJsonFile(RATINGS_FILE, []);
}

function getRatingsByPitch(pitchId) {
  const ratings = getRatings();
  return ratings.filter(r => r.pitch_id === pitchId);
}

function upsertRating(pitchId, deviceId, score) {
  const ratings = getRatings();
  const existingIndex = ratings.findIndex(r => r.pitch_id === pitchId && r.device_id === deviceId);
  const now = new Date().toISOString();
  const rating = {
    id: existingIndex >= 0 ? ratings[existingIndex].id : uuidv4(),
    pitch_id: pitchId,
    device_id: deviceId,
    score,
    created_at: existingIndex >= 0 ? ratings[existingIndex].created_at : now
  };
  if (existingIndex >= 0) {
    ratings[existingIndex] = rating;
  } else {
    ratings.push(rating);
  }
  writeJsonFile(RATINGS_FILE, ratings);
  return rating;
}

// Session state operations
function getSessionState() {
  const defaultState = {
    id: 'active',
    current_pitch_id: null,
    status: 'idle',
    feedback_enabled: false,
    recap_index: 0,
    updated_at: new Date().toISOString()
  };
  return readJsonFile(SESSION_FILE, defaultState);
}

function updateSessionState(updates) {
  const currentState = getSessionState();
  const newState = {
    ...currentState,
    ...updates,
    updated_at: new Date().toISOString()
  };
  writeJsonFile(SESSION_FILE, newState);
  return newState;
}

// Results calculation
function calculateResults(pitchId) {
  const ratings = getRatingsByPitch(pitchId);
  if (ratings.length === 0) {
    return {
      pitchId,
      count: 0,
      average: 0,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };
  }
  const count = ratings.length;
  const average = ratings.reduce((sum, r) => sum + r.score, 0) / count;
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  ratings.forEach(r => {
    distribution[r.score.toString()]++;
  });
  return {
    pitchId,
    count,
    average: Math.round(average * 10) / 10,
    distribution
  };
}

// Feedback operations
function getFeedback() {
  return readJsonFile(FEEDBACK_FILE, []);
}

function saveFeedback(deviceId, rating, message) {
  const feedbackList = getFeedback();
  const feedback = {
    id: uuidv4(),
    device_id: deviceId,
    rating,
    message,
    created_at: new Date().toISOString()
  };
  feedbackList.push(feedback);
  writeJsonFile(FEEDBACK_FILE, feedbackList);
  return feedback;
}

module.exports = {
  getSessionState,
  updateSessionState,
  upsertRating,
  calculateResults,
  getPitches,
  getFeedback,
  saveFeedback
};
