const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');

function saveRatings(ratings) {
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2), 'utf-8');
}

function loadRatings() {
  if (!fs.existsSync(RATINGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf-8'));
}

module.exports = { saveRatings, loadRatings, RATINGS_FILE };
