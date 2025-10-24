import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pitch, Rating, SessionState } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PITCHES_FILE = path.join(DATA_DIR, 'pitches.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const SESSION_FILE = path.join(DATA_DIR, 'session.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generic file operations
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Pitches operations
export async function getPitches(): Promise<Pitch[]> {
  const pitches = await readJsonFile<Pitch[]>(PITCHES_FILE, []);
  return pitches.sort((a, b) => a.order - b.order);
}

export async function createPitch(title: string, description: string = ''): Promise<Pitch> {
  const pitches = await getPitches();
  const maxOrder = pitches.length > 0 ? Math.max(...pitches.map(p => p.order)) : 0;
  
  const newPitch: Pitch = {
    id: uuidv4(),
    title,
    description,
    order: maxOrder + 1,
    created_at: new Date().toISOString()
  };
  
  pitches.push(newPitch);
  await writeJsonFile(PITCHES_FILE, pitches);
  return newPitch;
}

export async function updatePitch(id: string, updates: Partial<Pitch>): Promise<Pitch | null> {
  const pitches = await getPitches();
  const index = pitches.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  pitches[index] = { ...pitches[index], ...updates };
  await writeJsonFile(PITCHES_FILE, pitches);
  return pitches[index];
}

export async function deletePitch(id: string): Promise<boolean> {
  const pitches = await getPitches();
  const filtered = pitches.filter(p => p.id !== id);
  
  if (filtered.length === pitches.length) return false;
  
  await writeJsonFile(PITCHES_FILE, filtered);
  
  // Also remove ratings for this pitch
  const ratings = await getRatings();
  const filteredRatings = ratings.filter(r => r.pitch_id !== id);
  await writeJsonFile(RATINGS_FILE, filteredRatings);
  
  return true;
}

// Ratings operations
export async function getRatings(): Promise<Rating[]> {
  return await readJsonFile<Rating[]>(RATINGS_FILE, []);
}

export async function getRatingsByPitch(pitchId: string): Promise<Rating[]> {
  const ratings = await getRatings();
  return ratings.filter(r => r.pitch_id === pitchId);
}

export async function upsertRating(pitchId: string, deviceId: string, score: number): Promise<Rating> {
  const ratings = await getRatings();
  const existingIndex = ratings.findIndex(r => r.pitch_id === pitchId && r.device_id === deviceId);
  
  const rating: Rating = {
    id: existingIndex >= 0 ? ratings[existingIndex].id : uuidv4(),
    pitch_id: pitchId,
    device_id: deviceId,
    score,
    created_at: existingIndex >= 0 ? ratings[existingIndex].created_at : new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    ratings[existingIndex] = rating;
  } else {
    ratings.push(rating);
  }
  
  await writeJsonFile(RATINGS_FILE, ratings);
  return rating;
}

// Session state operations
export async function getSessionState(): Promise<SessionState> {
  const defaultState: SessionState = {
    id: 'active',
    current_pitch_id: null,
    status: 'idle',
    updated_at: new Date().toISOString()
  };
  
  return await readJsonFile<SessionState>(SESSION_FILE, defaultState);
}

export async function updateSessionState(updates: Partial<SessionState>): Promise<SessionState> {
  const currentState = await getSessionState();
  const newState = {
    ...currentState,
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  await writeJsonFile(SESSION_FILE, newState);
  return newState;
}

// Results calculation
export async function calculateResults(pitchId: string) {
  const ratings = await getRatingsByPitch(pitchId);
  
  if (ratings.length === 0) {
    return {
      pitchId,
      count: 0,
      average: 0,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };
  }
  
  const count = ratings.length;
  const average = ratings.reduce((sum, r) => sum + r.score, 0) / count;
  
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  ratings.forEach(r => {
    distribution[r.score.toString()]++;
  });
  
  return {
    pitchId,
    count,
    average: Math.round(average * 10) / 10,
    distribution
  };
}

// Export functionality
export async function exportAllData() {
  const pitches = await getPitches();
  const ratings = await getRatings();
  
  const exportData = pitches.map(pitch => {
    const pitchRatings = ratings.filter(r => r.pitch_id === pitch.id);
    return {
      pitch,
      ratings: pitchRatings
    };
  });
  
  return exportData;
}