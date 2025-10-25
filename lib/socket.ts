import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { 
  getSessionState, 
  updateSessionState, 
  upsertRating, 
  calculateResults,
  getPitches
} from './storage';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIO;
    };
  };
};

export type PitchData = {
  id: string;
  title: string;
  description: string;
};

export type ResultsData = {
  pitchId: string;
  count: number;
  average: number;
  distribution: Record<string, number>;
};

export const initSocket = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new ServerIO(res.socket.server, {
      path: '/backend/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join audience room
      socket.on('join:audience', () => {
        socket.join('audience');
        console.log('Client joined audience:', socket.id);
      });

      // Join admin room
      socket.on('join:admin', () => {
        socket.join('admin');
        console.log('Client joined admin:', socket.id);
      });

      // Handle rating submission
      socket.on('rating:submit', async (data: { pitchId: string; deviceId: string; score: number }) => {
        try {
          const { pitchId, deviceId, score } = data;

          // Verify poll is active
          const sessionState = await getSessionState();

          if (sessionState.status !== 'active' || sessionState.current_pitch_id !== pitchId) {
            socket.emit('error', { message: 'Poll is not active' });
            return;
          }

          // Upsert rating
          await upsertRating(pitchId, deviceId, score);

          // Emit success to the submitting client
          socket.emit('rating:success', { pitchId, score });

          // Calculate and broadcast updated results
          await broadcastResults(io, pitchId);
        } catch (error) {
          console.error('Rating submission error:', error);
          socket.emit('error', { message: 'Failed to submit rating' });
        }
      });

      // Handle admin actions
      socket.on('poll:start', async (data: { pitchId: string }) => {
        try {
          const { pitchId } = data;

          // Get pitch details
          const pitches = await getPitches();
          const pitch = pitches.find(p => p.id === pitchId);

          if (!pitch) {
            socket.emit('error', { message: 'Pitch not found' });
            return;
          }

          // Update session state
          await updateSessionState({
            current_pitch_id: pitchId,
            status: 'active'
          });

          // Broadcast to audience
          io.to('audience').emit('poll:start', {
            pitchId: pitch.id,
            title: pitch.title,
            description: pitch.description
          });

          // Broadcast initial results
          await broadcastResults(io, pitchId);

          console.log('Poll started for pitch:', pitch.title);
        } catch (error) {
          console.error('Poll start error:', error);
          socket.emit('error', { message: 'Failed to start poll' });
        }
      });

      socket.on('poll:stop', async (data: { pitchId: string }) => {
        try {
          const { pitchId } = data;

          // Update session state
          await updateSessionState({
            current_pitch_id: null,
            status: 'idle'
          });

          // Broadcast to audience
          io.to('audience').emit('poll:stop', { pitchId });

          console.log('Poll stopped for pitch:', pitchId);
        } catch (error) {
          console.error('Poll stop error:', error);
          socket.emit('error', { message: 'Failed to stop poll' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
};

async function broadcastResults(io: ServerIO, pitchId: string) {
  try {
    const results = await calculateResults(pitchId);
    
    // Broadcast to both audience and admin
    io.to('audience').emit('results:update', results);
    io.to('admin').emit('admin:stats', results);
  } catch (error) {
    console.error('Broadcast results error:', error);
  }
}