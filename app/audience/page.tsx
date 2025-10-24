'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPulse } from '@/components/ui/loading-pulse';
import { Textarea } from '@/components/ui/textarea';
import { getDeviceId } from '@/lib/device';
import { API_BASE_URL } from '@/lib/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
import { Users, Clock, TrendingUp, MessageSquare, QrCode } from 'lucide-react';

interface PitchData {
  pitchId: string;
  title: string;
  description: string;
}

interface ResultsData {
  pitchId: string;
  count: number;
  average: number;
  distribution: Record<string, number>;
}

export default function AudiencePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  // Remove results from audience
  const [results, setResults] = useState<ResultsData | null>(null); // legacy, not used
  // Track done pitches in localStorage
  const [donePitches, setDonePitches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('donePitches');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [audienceUrl, setAudienceUrl] = useState<string>('');

  useEffect(() => {
    // Initialize device ID
    setDeviceId(getDeviceId());

    // Set the audience URL
    if (typeof window !== 'undefined') {
      setAudienceUrl(window.location.href);
    }

    // Check if feedback was already submitted
    if (typeof window !== 'undefined') {
      const submitted = localStorage.getItem('feedbackSubmitted');
      if (submitted === 'true') {
        setFeedbackSubmitted(true);
      }
    }

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      path: '/api/socket',
    });


    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join:audience');
      // Always sync with backend state after (re)connect
      fetchInitialState();
    });

    // Debug: log all events
    newSocket.onAny((event, ...args) => {
      console.log('[Socket Event]', event, args);
    });

    // Listen for poll events
    newSocket.on('poll:start', (data: PitchData) => {
      setCurrentPitch(data);
      setRating(0);
      setHasRated(false);
      setResults(null);
    });

    newSocket.on('poll:stop', () => {
      setCurrentPitch(null);
      setRating(0);
      setHasRated(false);
      setResults(null);
    });

  // Do not listen for results:update (results are confidential)

    newSocket.on('rating:success', () => {
      setHasRated(true);
      setIsSubmitting(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsSubmitting(false);
    });

    newSocket.on('feedback:enabled', (data: { enabled: boolean }) => {
      setFeedbackEnabled(data.enabled);
    });

  setSocket(newSocket);
  // Fetch initial state
  fetchInitialState();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchInitialState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/state`);
      const data = await response.json();
      if (data.sessionState?.status === 'active' && data.activePitch) {
        setCurrentPitch({
          pitchId: data.activePitch.id,
          title: data.activePitch.title,
          description: data.activePitch.description
        });
      }
      // Set feedback enabled state
      if (data.sessionState?.feedback_enabled !== undefined) {
        setFeedbackEnabled(data.sessionState.feedback_enabled);
      }
    } catch (error) {
      console.error('Failed to fetch initial state:', error);
    }
  };

  const submitRating = async () => {
    if (!socket || !currentPitch || !rating || hasRated || donePitches.includes(currentPitch.pitchId)) return;
    setIsSubmitting(true);
    socket.emit('rating:submit', {
      pitchId: currentPitch.pitchId,
      deviceId,
      score: rating
    });
    // Mark this pitch as done for this user
    const updatedDone = [...donePitches, currentPitch.pitchId];
    setDonePitches(updatedDone);
    if (typeof window !== 'undefined') {
      localStorage.setItem('donePitches', JSON.stringify(updatedDone));
    }
  };

  const submitFeedback = async () => {
    if (!feedbackRating || feedbackSubmitted) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          rating: feedbackRating,
          message: feedbackMessage.trim() || ''
        })
      });
      
      if (response.ok) {
        setFeedbackSubmitted(true);
        setFeedbackMessage('');
        setFeedbackRating(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('feedbackSubmitted', 'true');
        }
        // Notify via socket
        if (socket) {
          socket.emit('feedback:submitted');
        }
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (!currentPitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Logos Header */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-12 object-contain" />
            </div>
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <img src="/hubitz-logo.png" alt="The Hubitz" className="h-12 object-contain" />
            </div>
          </div>
          
          {!feedbackEnabled && (
            <Card className="w-full text-center mb-6 border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader>
                <LoadingPulse>
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl" 
                       style={{ background: 'linear-gradient(135deg, #2B4C7E 0%, #3A5F9E 100%)' }}>
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                </LoadingPulse>
                <CardTitle className="text-3xl bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">Waiting for next pitch...</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  The organizer will start the next pitch shortly. Stay tuned!
                </p>
                <LoadingPulse>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                </LoadingPulse>
              </CardContent>
            </Card>
          )}

          {/* Event Feedback Section - Show even when no pitch is active */}
          {feedbackEnabled && (
            <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-xl">
                  <MessageSquare className="w-6 h-6 mr-2" />
                  Event Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!feedbackSubmitted ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-700 font-medium mb-3">
                        1. How would you rate this event? <span className="text-red-500">*</span>
                      </p>
                      <div className="flex justify-center gap-4">
                        {[
                          { value: 1, emoji: '😞', label: 'Poor' },
                          { value: 2, emoji: '😕', label: 'Fair' },
                          { value: 3, emoji: '😐', label: 'Good' },
                          { value: 4, emoji: '😊', label: 'Great' },
                          { value: 5, emoji: '🤩', label: 'Excellent' }
                        ].map(({ value, emoji, label }) => (
                          <button
                            key={value}
                            onClick={() => setFeedbackRating(value)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                              feedbackRating === value
                                ? 'scale-110'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={feedbackRating === value ? { 
                              borderColor: '#FF6B35', 
                              backgroundColor: '#FFF5F0' 
                            } : {}}
                          >
                            <span className="text-3xl mb-1">{emoji}</span>
                            <span className="text-xs text-gray-600">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-700 font-medium mb-3">
                        2. Your suggestions:
                      </p>
                      <Textarea
                        placeholder="Share your suggestions to improve future events (optional)..."
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    
                    <Button
                      onClick={submitFeedback}
                      disabled={!feedbackRating}
                      className="w-full text-white hover:opacity-90 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)' }}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium">Thank you for your feedback!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Logos Header */}
        <div className="flex items-center justify-center gap-8 mb-8 pt-4">
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-12 object-contain" />
          </div>
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <img src="/hubitz-logo.png" alt="The Hubitz" className="h-12 object-contain" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-900 to-orange-500 bg-clip-text text-transparent">Rate This Pitch</h1>
          <p className="text-gray-600">Share your feedback in real-time</p>
        </div>

        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">{currentPitch.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPitch.description && (
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentPitch.description}
              </p>
            )}
          </CardContent>
        </Card>

        {!hasRated && !donePitches.includes(currentPitch.pitchId) ? (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle className="text-center text-2xl" style={{ color: '#2B4C7E' }}>Your Rating</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <StarRating
                value={rating}
                onChange={setRating}
                disabled={isSubmitting}
              />
              <Button
                size="lg"
                onClick={submitRating}
                disabled={!rating || isSubmitting}
                className="w-full text-lg py-7 text-white hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all font-semibold rounded-xl"
                style={{ background: 'linear-gradient(135deg, #2B4C7E 0%, #3A5F9E 100%)' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-0 shadow-xl" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)' }}>
            <CardContent className="text-center py-10">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#4CAF50' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#2E7D32' }}>
                Thanks for your rating!
              </h3>
              <p className="text-green-700 text-lg">
                You have already voted for this pitch.
              </p>
            </CardContent>
          </Card>
        )}

  {/* Results are confidential, not shown to audience */}

        {/* Event Feedback Section */}
        {feedbackEnabled && (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <MessageSquare className="w-6 h-6 mr-2" />
                Event Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!feedbackSubmitted ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-700 font-medium mb-3">
                      1. How would you rate this event? <span className="text-red-500">*</span>
                    </p>
                    <div className="flex justify-center gap-4">
                      {[
                        { value: 1, emoji: '😞', label: 'Poor' },
                        { value: 2, emoji: '😕', label: 'Fair' },
                        { value: 3, emoji: '😐', label: 'Good' },
                        { value: 4, emoji: '😊', label: 'Great' },
                        { value: 5, emoji: '🤩', label: 'Excellent' }
                      ].map(({ value, emoji, label }) => (
                        <button
                          key={value}
                          onClick={() => setFeedbackRating(value)}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            feedbackRating === value
                              ? 'border-blue-500 bg-blue-50 scale-110'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-3xl mb-1">{emoji}</span>
                          <span className="text-xs text-gray-600">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-700 font-medium mb-3">
                      2. Your suggestions:
                    </p>
                    <Textarea
                      placeholder="Share your suggestions to improve future events (optional)..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  
                  <Button
                    onClick={submitFeedback}
                    disabled={!feedbackRating}
                    className="w-full text-white hover:opacity-90 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)' }}
                  >
                    Submit Feedback
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#E8F5E9' }}>
                    <svg className="w-6 h-6" style={{ color: '#4CAF50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">Thank you for your feedback!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}