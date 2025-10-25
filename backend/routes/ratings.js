const express = require('express');
const router = express.Router();
const { saveRatings, loadRatings } = require('../ratingsStore');
const { checkAndStartAutoRecap } = require('../autoRecap');

// GET all ratings
router.get('/', (req, res) => {
  const ratings = loadRatings();
  res.json(ratings);
});

// GET ratings by pitch
router.get('/pitch/:pitchId', (req, res) => {
  const ratings = loadRatings();
  const { pitchId } = req.params;
  const filtered = ratings.filter(r => r.pitch_id === pitchId);
  res.json(filtered);
});

// POST or update a rating
router.post('/', (req, res) => {
  const ratings = loadRatings();
  const { pitch_id, device_id, score } = req.body;
  let rating = ratings.find(r => r.pitch_id === pitch_id && r.device_id === device_id);
  if (rating) {
    rating.score = score;
    rating.created_at = new Date().toISOString();
    saveRatings(ratings);
    res.json(rating);
  } else {
    rating = {
      id: Date.now().toString(),
      pitch_id,
      device_id,
      score,
      created_at: new Date().toISOString()
    };
    ratings.push(rating);
    saveRatings(ratings);
    res.status(201).json(rating);
  }
  
  // Check if all pitches are done and auto-start recap
  checkAndStartAutoRecap();
});

module.exports = router;
