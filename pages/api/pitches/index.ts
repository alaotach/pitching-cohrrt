import { NextApiRequest, NextApiResponse } from 'next';
import { getPitches, createPitch } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const pitches = await getPitches();
        res.status(200).json(pitches);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pitches' });
      }
      break;

    case 'POST':
      try {
        const { title, description } = req.body;
        const pitch = await createPitch(title, description || '');
        res.status(201).json(pitch);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create pitch' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}