const { getSessionState, updateSessionState, upsertRating, calculateResults, getPitches, getFeedback } = require('./storage.js');

function setupSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join:audience', () => {
      socket.join('audience');
      console.log('Client joined audience:', socket.id);
      // Send current feedback state to newly joined audience
      const state = getSessionState();
      socket.emit('feedback:enabled', { enabled: state.feedback_enabled || false });
    });

    socket.on('join:admin', () => {
      socket.join('admin');
      console.log('Client joined admin:', socket.id);
    });

    socket.on('rating:submit', (data) => {
      try {
        const { pitchId, deviceId, score } = data;
        const sessionState = getSessionState();
        if (sessionState.status !== 'active' || sessionState.current_pitch_id !== pitchId) {
          socket.emit('error', { message: 'Poll is not active' });
          return;
        }
        upsertRating(pitchId, deviceId, score);
        socket.emit('rating:success', { pitchId, score });
        broadcastResults(io, pitchId);
        broadcastAllResults(io);
      } catch (error) {
        console.error('Rating submission error:', error);
        socket.emit('error', { message: 'Failed to submit rating' });
      }
    });

    socket.on('poll:start', (data) => {
      try {
        const { pitchId } = data;
        console.log('[poll:start] Received for pitchId:', pitchId);
        const pitches = getPitches();
        const pitch = pitches.find(p => p.id === pitchId);
        if (!pitch) {
          console.log('[poll:start] Pitch not found:', pitchId);
          socket.emit('error', { message: 'Pitch not found' });
          return;
        }
        const updatedState = updateSessionState({ current_pitch_id: pitchId, status: 'active' });
        console.log('[poll:start] Session state updated:', updatedState);
        io.to('audience').emit('poll:start', {
          pitchId: pitch.id,
          title: pitch.title,
          description: pitch.description
        });
        broadcastResults(io, pitchId);
        console.log('Poll started for pitch:', pitch.title);
      } catch (error) {
        console.error('Poll start error:', error);
        socket.emit('error', { message: 'Failed to start poll' });
      }
    });

    socket.on('poll:stop', (data) => {
      try {
        const { pitchId } = data;
        updateSessionState({ current_pitch_id: null, status: 'idle' });
        io.to('audience').emit('poll:stop', { pitchId });
        broadcastAllResults(io);
        console.log('Poll stopped for pitch:', pitchId);
      } catch (error) {
        console.error('Poll stop error:', error);
        socket.emit('error', { message: 'Failed to stop poll' });
      }
    });

    socket.on('feedback:toggle', (data) => {
      try {
        const { enabled } = data;
        updateSessionState({ feedback_enabled: enabled });
        io.to('audience').emit('feedback:enabled', { enabled });
        console.log('Feedback toggled:', enabled);
      } catch (error) {
        console.error('Feedback toggle error:', error);
        socket.emit('error', { message: 'Failed to toggle feedback' });
      }
    });

    socket.on('feedback:submitted', () => {
      try {
        broadcastFeedback(io);
      } catch (error) {
        console.error('Feedback broadcast error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  function broadcastResults(io, pitchId) {
    try {
      const results = calculateResults(pitchId);
      // Results are confidential: only emit to admin
      io.to('admin').emit('admin:stats', results);
    } catch (error) {
      console.error('Broadcast results error:', error);
    }
  }

  function broadcastAllResults(io) {
    try {
      const pitches = getPitches();
      const allResults = [];
      for (const pitch of pitches) {
        const results = calculateResults(pitch.id);
        allResults.push({
          pitchId: pitch.id,
          title: pitch.title,
          ...results
        });
      }
      io.to('admin').emit('admin:all-results', allResults);
    } catch (error) {
      console.error('Broadcast all results error:', error);
    }
  }

  function broadcastFeedback(io) {
    try {
      const feedback = getFeedback();
      io.to('admin').emit('feedback:update', feedback);
    } catch (error) {
      console.error('Broadcast feedback error:', error);
    }
  }
}

module.exports = setupSocket;
