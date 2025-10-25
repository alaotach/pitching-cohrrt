'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResultsChart } from '@/components/charts/results-chart';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pitch, SessionState, Feedback } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';
import { 
  Play, 
  Square, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Users, 
  TrendingUp,
  BarChart3,
  Settings,
  MessageSquare,
  QrCode
} from 'lucide-react';

interface ResultsData {
  pitchId: string;
  count: number;
  average: number;
  distribution: Record<string, number>;
}

export default function AdminPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentResults, setCurrentResults] = useState<ResultsData | null>(null);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [selectedPitchId, setSelectedPitchId] = useState<string>('');
  const [newPitch, setNewPitch] = useState({ title: '', description: '' });
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [audienceUrl, setAudienceUrl] = useState('');

  useEffect(() => {
    // Simple passcode authentication
    const checkAuth = () => {
      const adminPass = 'aloolelo@43';
      if (passcode === adminPass) {
        setIsAuthenticated(true);
        initializeAdmin();
      }
    };

    if (passcode) {
      checkAuth();
    }
  }, [passcode]);

  useEffect(() => {
    // Set the audience URL based on current location
    if (typeof window !== 'undefined') {
      setAudienceUrl(`${window.location.origin}/audience`);
    }
  }, []);

  const initializeAdmin = () => {
    // Fetch initial data
    fetchPitches();
    fetchSessionState();
    fetchFeedback();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      fetchSessionState();
      if (sessionState?.current_pitch_id) {
        fetchCurrentResults(sessionState.current_pitch_id);
      }
      fetchFeedback();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  };

  const fetchPitches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pitches`);
      const data = await response.json();
      setPitches(data || []);
    } catch (error) {
      console.error('Failed to fetch pitches:', error);
    }
  };

  const fetchSessionState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/state`);
      const data = await response.json();
      setSessionState(data.sessionState);
      if (data.sessionState?.current_pitch_id) {
        setSelectedPitchId(data.sessionState.current_pitch_id);
        // Fetch current results
        const resultsResponse = await fetch(`${API_BASE_URL}/results/${data.sessionState.current_pitch_id}`);
        const resultsData = await resultsResponse.json();
        setCurrentResults(resultsData);
      }
    } catch (error) {
      console.error('Failed to fetch session state:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`);
      const data = await response.json();
      setFeedbackList(data || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  const fetchCurrentResults = async (pitchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/results/${pitchId}`);
      const data = await response.json();
      setCurrentResults(data);
    } catch (error) {
      console.error('Failed to fetch current results:', error);
    }
  };

  const startEvent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/event/start`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchSessionState();
      }
    } catch (error) {
      console.error('Failed to start event:', error);
    }
  };

  const nextPitch = async () => {
    try {
      await fetch(`${API_BASE_URL}/event/next`, {
        method: 'POST',
      });
      await fetchSessionState();
    } catch (error) {
      console.error('Failed to advance:', error);
    }
  };

  const resetEvent = async () => {
    try {
      await fetch(`${API_BASE_URL}/event/reset`, {
        method: 'POST',
      });
      await fetchSessionState();
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

  const addPitch = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pitches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPitch),
      });
      
      if (response.ok) {
        const pitch = await response.json();
        setPitches(prev => [...prev, pitch]);
        setNewPitch({ title: '', description: '' });
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error('Failed to add pitch:', error);
    }
  };

  const updatePitch = async () => {
    if (!editingPitch) return;

    try {
      const response = await fetch(`${API_BASE_URL}/pitches/${editingPitch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPitch),
      });
      
      if (response.ok) {
        const updatedPitch = await response.json();
        setPitches(prev => prev.map(p => p.id === updatedPitch.id ? updatedPitch : p));
        setEditingPitch(null);
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error('Failed to update pitch:', error);
    }
  };

  const deletePitch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pitch?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/pitches/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPitches(prev => prev.filter(p => p.id !== id));
        if (selectedPitchId === id) {
          setSelectedPitchId('');
        }
      }
    } catch (error) {
      console.error('Failed to delete pitch:', error);
    }
  };

  const exportResults = () => {
    window.open(`${API_BASE_URL}/export`, '_blank');
  };

  const toggleFeedback = async () => {
    if (!sessionState) return;
    
    const newFeedbackState = !sessionState.feedback_enabled;
    try {
      const response = await fetch(`${API_BASE_URL}/state/feedback/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newFeedbackState }),
      });
      if (response.ok) {
        const data = await response.json();
        setSessionState(data.sessionState);
      }
    } catch (error) {
      console.error('Failed to toggle feedback:', error);
    }
  };

  const generateQRCode = () => {
    setShowQRDialog(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center gap-6 mb-4">
              <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-10 object-contain" />
              <img src="/hubitz-logo.png" alt="The Hubitz" className="h-10 object-contain" />
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
              <Settings className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-center" style={{ color: '#2B4C7E' }}>Organizer Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && setPasscode(passcode)}
            />
            <Button onClick={() => setPasscode(passcode)} className="w-full">
              Login
            </Button>
            {/* Passcode hint removed for production */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Logos Header */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-12 object-contain" />
          <img src="/hubitz-logo.png" alt="The Hubitz" className="h-12 object-contain" />
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B4C7E' }}>Admin Dashboard</h1>
          <p className="text-gray-600">Manage pitches and control live rating sessions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Live Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Live Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  <p>The event will automatically progress through all pitches.</p>
                  <p>Each pitch gets 2 minutes for voting before moving to next.</p>
                  <p>After all pitches, results recap shows for 15 seconds each, then feedback form.</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={startEvent}
                    disabled={sessionState?.status !== 'idle' || pitches.length === 0}
                    className="flex-1"
                    style={{ backgroundColor: '#2B4C7E', color: 'white' }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Event
                  </Button>
                  <Button
                    onClick={nextPitch}
                    disabled={sessionState?.status !== 'active'}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip to Next →
                  </Button>
                  <Button
                    onClick={resetEvent}
                    disabled={sessionState?.status === 'idle'}
                    variant="destructive"
                  >
                    Reset
                  </Button>
                </div>

                {sessionState?.status === 'active' && (
                  <Badge className="w-full justify-center bg-green-100 text-green-800 hover:bg-green-100">
                    Event is LIVE - Auto-progressing
                  </Badge>
                )}

                {sessionState?.status === 'recap' && (
                  <Badge className="w-full justify-center" style={{ backgroundColor: '#FF6B35', color: 'white' }}>
                    Showing Results Recap
                  </Badge>
                )}

                {sessionState?.feedback_enabled && (
                  <Badge className="w-full justify-center bg-blue-100 text-blue-800 hover:bg-blue-100">
                    Feedback Form Active
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Pitch Manager */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Pitch Manager
                  </CardTitle>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Pitch
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Pitch</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Pitch title"
                          value={newPitch.title}
                          onChange={(e) => setNewPitch(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <Textarea
                          placeholder="Pitch description (optional)"
                          value={newPitch.description}
                          onChange={(e) => setNewPitch(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <Button onClick={addPitch} className="w-full">
                          Add Pitch
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pitches.map(pitch => (
                    <div key={pitch.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{pitch.title}</h4>
                        {pitch.description && (
                          <p className="text-sm text-gray-500 truncate">{pitch.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPitch(pitch);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePitch(pitch.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Pitch</DialogTitle>
                </DialogHeader>
                {editingPitch && (
                  <div className="space-y-4">
                    <Input
                      placeholder="Pitch title"
                      value={editingPitch.title}
                      onChange={(e) => setEditingPitch(prev => 
                        prev ? { ...prev, title: e.target.value } : null
                      )}
                    />
                    <Textarea
                      placeholder="Pitch description (optional)"
                      value={editingPitch.description}
                      onChange={(e) => setEditingPitch(prev => 
                        prev ? { ...prev, description: e.target.value } : null
                      )}
                    />
                    <Button onClick={updatePitch} className="w-full">
                      Update Pitch
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column - Live Stats */}
          <div className="space-y-6">
            {currentResults ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {currentResults.average.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {currentResults.count}
                        </div>
                        <div className="text-sm text-gray-600">Total Ratings</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Rating Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResultsChart distribution={currentResults.distribution} className="w-full h-full" />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Poll</h3>
                  <p className="text-gray-500">Start a poll to see live results here</p>
                </CardContent>
              </Card>
            )}

            {/* All Pitch Results Table */}
            {allResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Pitch Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left">Pitch</th>
                          <th className="px-2 py-1 text-center">Avg</th>
                          <th className="px-2 py-1 text-center">Count</th>
                          <th className="px-2 py-1 text-center">1★</th>
                          <th className="px-2 py-1 text-center">2★</th>
                          <th className="px-2 py-1 text-center">3★</th>
                          <th className="px-2 py-1 text-center">4★</th>
                          <th className="px-2 py-1 text-center">5★</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allResults.map(r => (
                          <tr key={r.pitchId} className="border-t">
                            <td className="px-2 py-1">{r.title}</td>
                            <td className="px-2 py-1 text-center">{r.average?.toFixed(1) ?? '-'}</td>
                            <td className="px-2 py-1 text-center">{r.count ?? '-'}</td>
                            <td className="px-2 py-1 text-center">{r.distribution?.['1'] ?? '-'}</td>
                            <td className="px-2 py-1 text-center">{r.distribution?.['2'] ?? '-'}</td>
                            <td className="px-2 py-1 text-center">{r.distribution?.['3'] ?? '-'}</td>
                            <td className="px-2 py-1 text-center">{r.distribution?.['4'] ?? '-'}</td>
                            <td className="px-2 py-1 text-center">{r.distribution?.['5'] ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Button */}
            <Card>
              <CardHeader>
                <CardTitle>Export Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={exportResults} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </CardContent>
            </Card>

            {/* Feedback Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Event Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Feedback</p>
                    <p className="text-sm text-gray-500">Allow audience to submit feedback</p>
                  </div>
                  <Switch
                    checked={sessionState?.feedback_enabled || false}
                    onCheckedChange={toggleFeedback}
                  />
                </div>
                
                {sessionState?.feedback_enabled && (
                  <>
                    <Button onClick={generateQRCode} className="w-full" variant="outline">
                      <QrCode className="w-4 h-4 mr-2" />
                      Show QR Code
                    </Button>
                    
                    <Button 
                      onClick={() => setShowFeedbackDialog(true)} 
                      className="w-full"
                      variant="outline"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Feedback ({feedbackList.length})
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback Dialog */}
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Event Feedback ({feedbackList.length})</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {feedbackList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No feedback received yet</p>
              ) : (
                feedbackList.map((feedback) => {
                  const emojiMap: Record<number, string> = {
                    1: '😞',
                    2: '😕',
                    3: '😐',
                    4: '😊',
                    5: '🤩'
                  };
                  const labelMap: Record<number, string> = {
                    1: 'Poor',
                    2: 'Fair',
                    3: 'Good',
                    4: 'Great',
                    5: 'Excellent'
                  };
                  return (
                    <Card key={feedback.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{emojiMap[feedback.rating]}</span>
                          <span className="font-semibold text-lg">{labelMap[feedback.rating]}</span>
                          <Badge variant="outline" className="ml-auto">
                            Rating: {feedback.rating}/5
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{feedback.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(feedback.created_at).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audience Page QR Code</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(audienceUrl)}`}
                  alt="QR Code for audience page"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-600">
                Scan to access: <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{audienceUrl}</code>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}