'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Award } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-16">
        {/* Logos Header with shadow */}
        <div className="flex items-center justify-center gap-12 mb-16">
          <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-16 object-contain" />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <img src="/hubitz-logo.png" alt="The Hubitz" className="h-16 object-contain" />
          </div>
        </div>
        
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform" 
                 style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)' }}>
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-900 via-blue-700 to-orange-500 bg-clip-text text-transparent">
            Pitch Rating
          </h1>
          <div className="w-32 h-1 mx-auto mb-6 rounded-full" style={{ background: 'linear-gradient(90deg, #2B4C7E 0%, #FF6B35 100%)' }}></div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time pitch evaluation platform. Rate presentations instantly and see live results with powerful analytics.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all font-semibold rounded-xl"
              style={{ background: 'linear-gradient(135deg, #2B4C7E 0%, #3A5F9E 100%)' }}
              onClick={() => router.push('/audience')}
            >
              <Users className="w-6 h-6 mr-2" />
              Join as Audience
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" 
                   style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' }}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl" style={{ color: '#2B4C7E' }}>Real-time Voting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                Audience members can rate pitches instantly with live updates across all devices.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" 
                   style={{ background: 'linear-gradient(135deg, #2B4C7E 0%, #3A5F9E 100%)' }}>
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl" style={{ color: '#2B4C7E' }}>Live Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                Watch results update in real-time with detailed statistics and visual charts.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" 
                   style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)' }}>
                <Award className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl" style={{ color: '#2B4C7E' }}>Easy Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                Simple admin interface to manage pitches, control polls, and export results.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer spacing */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}