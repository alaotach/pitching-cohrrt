'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Award } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Pitch Rating
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Real-time pitch evaluation platform. Rate presentations instantly and see live results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/audience')}
            >
              <Users className="w-5 h-5 mr-2" />
              Join as Audience
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => router.push('/admin')}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Organizer Login
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Real-time Voting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Audience members can rate pitches instantly with live updates across all devices.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Live Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Watch results update in real-time with detailed statistics and visual charts.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Easy Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Simple admin interface to manage pitches, control polls, and export results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}