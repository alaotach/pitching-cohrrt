const express = require('express');
const router = express.Router();
const { loadPitches } = require('../pitchesStore');
const { loadRatings } = require('../ratingsStore');

// GET export all data as CSV
router.get('/', (req, res) => {
  const pitches = loadPitches();
  const ratings = loadRatings();
  let csvContent = 'Pitch Title,Pitch Description,Device ID,Score,Timestamp\n';
  pitches.forEach(pitch => {
    const pitchRatings = ratings.filter(r => r.pitch_id === pitch.id);
    pitchRatings.forEach(rating => {
      csvContent += `"${pitch.title}","${pitch.description}","${rating.device_id}",${rating.score},${rating.created_at}\n`;
    });
  });
  res.setHeader('Content-Type', 'text/csv');
  res.send(csvContent);
});

module.exports = router;
