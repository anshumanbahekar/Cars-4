export interface DailyChallenge {
  date: string;
  seed: number;
  map: number;
  weather: number;
  difficulty: number;
  title: string;
}

const tracks = ['Radiator Springs', 'Copper Canyon', 'Alpine Pass', 'Metro Speedway', 'Thunder Ridge'];

export function challengeForDate(date: string): DailyChallenge {
  let hash = 2166136261;
  for (const char of date) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return {
    date,
    seed: (hash & 0x7fffffff) || 1,
    map: hash % tracks.length,
    weather: (hash >>> 8) % 3,
    difficulty: 1 + ((hash >>> 16) % 2),
    title: tracks[hash % tracks.length],
  };
}

function isChallenge(value: unknown): value is DailyChallenge {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DailyChallenge>;
  return typeof v.date === 'string' && typeof v.seed === 'number' && Number.isInteger(v.seed)
    && typeof v.map === 'number' && v.map >= 0 && v.map < tracks.length
    && typeof v.weather === 'number' && v.weather >= 0 && v.weather < 3
    && typeof v.difficulty === 'number' && v.difficulty >= 0 && v.difficulty < 4
    && typeof v.title === 'string';
}

export async function loadChallenge(): Promise<DailyChallenge> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const response = await fetch('/api/challenge', { signal: AbortSignal.timeout(4000) });
    if (response.ok) {
      const body: unknown = await response.json();
      if (isChallenge(body) && body.date === today) return body;
    }
  } catch { /* The same daily track remains playable offline. */ }
  return challengeForDate(today);
}
