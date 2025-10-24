'use client';

import { Card } from '@/components/ui/card';

export default function QRVotePage() {
  const voteUrl = 'https://cohrrt.thehubitz.com/audience';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-4xl w-full">
        {/* Logos */}
        <div className="flex items-center justify-center gap-12 mb-12">
          <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-20 object-contain" />
          <img src="/hubitz-logo.png" alt="The Hubitz" className="h-20 object-contain" />
        </div>

        {/* Main Content */}
        <Card className="p-12 border-4" style={{ borderColor: '#2B4C7E' }}>
          <h1 className="text-5xl font-bold mb-6" style={{ color: '#2B4C7E' }}>
            Scan to Vote
          </h1>
          
          <p className="text-2xl text-gray-600 mb-12">
            Rate the pitches in real-time
          </p>

          {/* QR Code */}
          <div className="bg-white p-8 rounded-2xl inline-block shadow-lg mb-8" style={{ border: '4px solid #FF6B35' }}>
            <img
              src="/voting.png"
              alt="Scan to Vote QR Code"
              className="w-96 h-96 object-contain"
            />
          </div>

          <div className="bg-gray-100 p-6 rounded-xl inline-block">
            <p className="text-xl font-mono text-gray-700">
              {voteUrl}
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-gray-500 mt-8 text-lg">
          Open your phone camera and point it at the QR code
        </p>
      </div>
    </div>
  );
}
