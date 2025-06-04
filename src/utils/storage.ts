import { EventConfig } from '../App';

export function saveConfig(config: EventConfig): void {
  if (config.tripId) {
    localStorage.setItem(`trip_${config.tripId}`, JSON.stringify(config));
  }
}

export function loadConfig(tripId: string): EventConfig | null {
  const data = localStorage.getItem(`trip_${tripId}`);
  return data ? JSON.parse(data) : null;
}

export function generateTripId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRIP_';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}