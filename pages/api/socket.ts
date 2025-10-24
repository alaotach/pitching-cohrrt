import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/lib/socket';
import { initSocket } from '@/lib/socket';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method === 'GET') {
    const io = initSocket(res);
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}