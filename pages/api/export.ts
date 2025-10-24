import { NextApiRequest, NextApiResponse } from 'next';
import { exportAllData } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const exportData = await exportAllData();
    
    // Generate CSV content
    let csvContent = 'Pitch Title,Pitch Description,Device ID,Score,Timestamp\n';
    
    exportData.forEach(({ pitch, ratings }) => {
      if (ratings && ratings.length > 0) {
        ratings.forEach(rating => {
          csvContent += `"${pitch.title}","${pitch.description}","${rating.device_id}",${rating.score},"${rating.created_at}"\n`;
        });
      } else {
        csvContent += `"${pitch.title}","${pitch.description}","","",""\n`;
      }
    });

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pitch-ratings.csv"');
    
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}