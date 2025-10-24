import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionState, getPitches } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current session state
    const sessionState = await getSessionState();

    let activePitch = null;

    // If there's an active pitch, get its details
    if (sessionState.current_pitch_id) {
      const pitches = await getPitches();
      activePitch = pitches.find(p => p.id === sessionState.current_pitch_id) || null;
    }

    res.status(200).json({
      sessionState,
      activePitch
    });
  } catch (error) {
    console.error('State API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}