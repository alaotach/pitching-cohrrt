import { NextApiRequest, NextApiResponse } from 'next';
import { updatePitch, deletePitch } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid pitch ID' });
  }

  switch (method) {
    case 'PUT':
      try {
        const { title, description, order } = req.body;
        const pitch = await updatePitch(id, { title, description, order });
        
        if (!pitch) {
          return res.status(404).json({ error: 'Pitch not found' });
        }

        res.status(200).json(pitch);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update pitch' });
      }
      break;

    case 'DELETE':
      try {
        const success = await deletePitch(id);
        
        if (!success) {
          return res.status(404).json({ error: 'Pitch not found' });
        }

        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete pitch' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}