import { NextApiRequest, NextApiResponse } from 'next';
import { calculateResults } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pitchId } = req.query;

  if (typeof pitchId !== 'string') {
    return res.status(400).json({ error: 'Invalid pitch ID' });
  }

  try {
    const results = await calculateResults(pitchId);
    res.status(200).json(results);
  } catch (error) {
    console.error('Results API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}