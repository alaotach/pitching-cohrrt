'use client';

import { useEffect, useState } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getDeviceId } from '@/lib/device';
import { API_BASE_URL } from '@/lib/api';

interface Pitch {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface ResultsData {
  pitchId: string;
  count: number;
  average: number;
  distribution: Record<string, number>;
}

export default function AudiencePage() {
  const [allPitches, setAllPitches] = useState<Pitch[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<string>(''); // pitch ID being submitted
  const [feedbackEnabled, setFeedbackEnabled] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [showRecap, setShowRecap] = useState<boolean>(false);
  const [recapResults, setRecapResults] = useState<Record<string, ResultsData>>({});

  useEffect(() => {
    // Initialize device ID
    setDeviceId(getDeviceId());

    // Load user's previous ratings from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRatings');
      if (stored) {
        setUserRatings(JSON.parse(stored));
      }

      const submitted = localStorage.getItem('feedbackSubmitted');
      if (submitted === 'true') {
        setFeedbackSubmitted(true);
      }
    }

    // Fetch all pitches
    fetchAllPitches();

    // Poll for session state every 3 seconds
    const interval = setInterval(() => {
      checkRecapAndFeedback();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchAllPitches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pitches`);
      const data = await response.json();
      setAllPitches(data || []);
    } catch (error) {
      console.error('Failed to fetch pitches:', error);
    }
  };

  const checkRecapAndFeedback = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/state`);
      const data = await response.json();
      
      if (data.sessionState?.status === 'recap') {
        setShowRecap(true);
        fetchAllResults();
      } else if (data.sessionState?.feedback_enabled) {
        setFeedbackEnabled(true);
        setShowRecap(false);
      } else {
        setShowRecap(false);
      }
    } catch (error) {
      console.error('Failed to check state:', error);
    }
  };

  const fetchAllResults = async () => {
    const results: Record<string, ResultsData> = {};
    for (const pitch of allPitches) {
      try {
        const response = await fetch(`${API_BASE_URL}/results/${pitch.id}`);
        const data = await response.json();
        results[pitch.id] = data;
      } catch (error) {
        console.error(`Failed to fetch results for ${pitch.id}:`, error);
      }
    }
    setRecapResults(results);
  };

  const submitRating = async (pitchId: string, score: number) => {
    setIsSubmitting(pitchId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pitch_id: pitchId,
          device_id: deviceId,
          score
        })
      });
      
      if (response.ok) {
        // Save rating locally
        const newRatings = { ...userRatings, [pitchId]: score };
        setUserRatings(newRatings);
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRatings', JSON.stringify(newRatings));
        }
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting('');
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
          message: feedbackMessage
        })
      });
      
      if (response.ok) {
        setFeedbackSubmitted(true);
        setFeedbackMessage('');
        setFeedbackRating(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('feedbackSubmitted', 'true');
        }
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Logos Header */}
        <div className="flex items-center justify-center gap-8 mb-8 pt-4">
          <img src="/cohrrt-logo.png" alt="Cohrrt" className="h-12 object-contain" />
          <img src="/hubitz-logo.png" alt="The Hubitz" className="h-12 object-contain" />
        </div>

        {/* Show Recap */}
        {showRecap && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: '#2B4C7E' }}>
              Results Recap
            </h1>
            {allPitches.map((pitch, index) => {
              const pitchResults = recapResults[pitch.id];
              return (
                <Card key={pitch.id} className="mb-6" style={{ borderColor: '#FF6B35', borderWidth: '2px' }}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {index + 1}. {pitch.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pitch.description && (
                      <p className="text-gray-700 mb-4">{pitch.description}</p>
                    )}
                    
                    {pitchResults && pitchResults.count > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ color: '#FF6B35' }}>
                              {pitchResults.average.toFixed(1)} ⭐
                            </p>
                            <p className="text-sm text-gray-600">Average Rating</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ color: '#2B4C7E' }}>
                              {pitchResults.count}
                            </p>
                            <p className="text-sm text-gray-600">Total Votes</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Show All Pitches for Voting */}
        {!showRecap && !feedbackEnabled && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: '#2B4C7E' }}>
              Rate All Pitches
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Vote on any pitch you want. You can vote on all of them!
            </p>

            {allPitches.length === 0 && (
              <Card className="text-center p-8">
                <p className="text-gray-500">No pitches available yet. Please check back later!</p>
              </Card>
            )}

            {allPitches.map((pitch, index) => (
              <Card key={pitch.id} className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {index + 1}. {pitch.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pitch.description && (
                    <p className="text-gray-700 mb-4">{pitch.description}</p>
                  )}

                  {userRatings[pitch.id] ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">
                            You rated: {userRatings[pitch.id]} ⭐
                          </p>
                          <p className="text-sm text-green-700">Thanks for your feedback!</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-center font-medium mb-3">Your Rating:</p>
                      <StarRating
                        value={0}
                        onChange={(score) => submitRating(pitch.id, score)}
                        disabled={isSubmitting === pitch.id}
                      />
                      {isSubmitting === pitch.id && (
                        <p className="text-center text-sm text-gray-500 mt-2">Submitting...</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Feedback Form */}
        {feedbackEnabled && !showRecap && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
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
                      2. Any suggestions or comments? (Optional)
                    </p>
                    <Textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={submitFeedback}
                    disabled={!feedbackRating}
                    className="w-full text-white hover:opacity-90"
                    style={{ backgroundColor: '#FF6B35' }}
                  >
                    Submit Feedback
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Thank You!
                  </h3>
                  <p className="text-green-700">
                    Your feedback has been submitted successfully.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
