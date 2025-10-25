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
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://cohrrt.thehubitz.com/backend';
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
  
  // Recap mode state
  const [isRecapMode, setIsRecapMode] = useState<boolean>(false);
  const [recapPitch, setRecapPitch] = useState<any>(null);
  const [recapIndex, setRecapIndex] = useState<number>(0);
  const [recapTotal, setRecapTotal] = useState<number>(0);
  const [recapResults, setRecapResults] = useState<ResultsData | null>(null);

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
      transports: ['polling', 'websocket']
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

    newSocket.on('recap:show', (data: { pitch: any; index: number; total: number; results: ResultsData }) => {
      setIsRecapMode(true);
      setRecapPitch(data.pitch);
      setRecapIndex(data.index);
      setRecapTotal(data.total);
      setRecapResults(data.results);
      setCurrentPitch(null);
    });

    newSocket.on('recap:end', () => {
      setIsRecapMode(false);
      setRecapPitch(null);
      setRecapResults(null);
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Logos Header */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-12 object-contain" />
            <img src="/hubitz-logo.png" alt="The Hubitz" className="h-12 object-contain" />
          </div>
          
          {!feedbackEnabled && (
            <Card className="w-full text-center mb-6">
              <CardHeader>
                <LoadingPulse>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2B4C7E' }}>
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                </LoadingPulse>
                <CardTitle className="text-2xl" style={{ color: '#2B4C7E' }}>Waiting for next pitch...</CardTitle>
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
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
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
                      className="w-full"
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
    <div className="min-h-screen bg-white p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Logos Header */}
        <div className="flex items-center justify-center gap-8 mb-8 pt-4">
          <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-12 object-contain" />
          <img src="/hubitz-logo.png" alt="The Hubitz" className="h-12 object-contain" />
        </div>
        
        {/* Recap Mode */}
        {isRecapMode && recapPitch && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B4C7E' }}>Pitch Recap</h1>
              <p className="text-gray-600">Pitch {recapIndex + 1} of {recapTotal}</p>
            </div>

            <Card className="mb-6" style={{ borderColor: '#FF6B35', borderWidth: '2px' }}>
              <CardHeader>
                <CardTitle className="text-2xl">{recapPitch.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {recapPitch.description && (
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    {recapPitch.description}
                  </p>
                )}
                
                {/* Show results in recap */}
                {recapResults && recapResults.count > 0 && (
                  <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                    <h3 className="font-semibold text-lg mb-3" style={{ color: '#2B4C7E' }}>
                      Audience Ratings
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: '#FF6B35' }}>
                          {recapResults.average.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">Average Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: '#2B4C7E' }}>
                          {recapResults.count}
                        </p>
                        <p className="text-sm text-gray-600">Total Votes</p>
                      </div>
                    </div>
                    
                    {/* Star distribution */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(star => (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm w-12">{star} ⭐</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${recapResults.count > 0 ? (recapResults.distribution[star.toString()] || 0) / recapResults.count * 100 : 0}%`,
                                backgroundColor: '#FF6B35'
                              }}
                            />
                          </div>
                          <span className="text-sm w-8 text-right">
                            {recapResults.distribution[star.toString()] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#FFF5F2' }}>
              <p className="text-sm" style={{ color: '#FF6B35' }}>
                <strong>Admin is presenting all pitches</strong>
                <br />
                Feedback form will appear at the end
              </p>
            </div>
          </div>
        )}
        
        {/* Active Poll */}
        {!isRecapMode && currentPitch && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B4C7E' }}>Rate This Pitch</h1>
              <p className="text-gray-600">Share your feedback in real-time</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center">Your Rating</CardTitle>
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
                className="w-full text-lg py-6 text-white hover:opacity-90"
                style={{ backgroundColor: '#2B4C7E' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="text-center py-8">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Thanks for your rating!
              </h3>
              <p className="text-green-700">
                You have already voted for this pitch.
              </p>
            </CardContent>
          </Card>
        )}
          </>
        )}

  {/* Results are confidential, not shown to audience */}
      </div>
    </div>
  );
}