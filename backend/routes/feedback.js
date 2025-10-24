const express = require('express');
const { getFeedback, saveFeedback } = require('../storage');

const router = express.Router();

// GET /api/feedback - Get all feedback
router.get('/', (req, res) => {
  try {
    const feedback = getFeedback();
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// POST /api/feedback - Submit feedback
router.post('/', (req, res) => {
  try {
    const { deviceId, rating, message } = req.body;
    
    if (!deviceId || !rating) {
      return res.status(400).json({ error: 'Device ID and rating are required' });
    }

    const feedback = saveFeedback(deviceId, rating, message || '');
    res.json(feedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

module.exports = router;
