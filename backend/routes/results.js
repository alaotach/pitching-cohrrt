const express = require('express');
const router = express.Router();
const { loadPitches } = require('../pitchesStore');
const { loadRatings } = require('../ratingsStore');

// GET results for a pitch
router.get('/:pitchId', (req, res) => {
  const pitches = loadPitches();
  const ratings = loadRatings();
  const { pitchId } = req.params;
  const pitch = pitches.find(p => p.id === pitchId);
  if (!pitch) return res.status(404).json({ error: 'Pitch not found' });
  const pitchRatings = ratings.filter(r => r.pitch_id === pitchId);
  const count = pitchRatings.length;
  const average = count ? pitchRatings.reduce((sum, r) => sum + r.score, 0) / count : 0;
  const distribution = {};
  pitchRatings.forEach(r => {
    distribution[r.score] = (distribution[r.score] || 0) + 1;
  });
  res.json({ pitch, count, average, distribution });
});

module.exports = router;
