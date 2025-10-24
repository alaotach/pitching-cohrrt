export interface Pitch {
  id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

export interface Rating {
  id: string;
  pitch_id: string;
  device_id: string;
  score: number;
  created_at: string;
}

export interface SessionState {
  id: string;
  current_pitch_id: string | null;
  status: 'idle' | 'active';
  feedback_enabled: boolean;
  updated_at: string;
}

export interface PitchResults {
  pitch: Pitch;
  count: number;
  average: number;
  distribution: Record<string, number>;
}

export interface Feedback {
  id: string;
  device_id: string;
  rating: number;
  message: string;
  created_at: string;
}