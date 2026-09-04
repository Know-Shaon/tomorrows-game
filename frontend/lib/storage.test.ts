import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, loadPrototypeState, savePrototypeState } from './storage';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('versioned prototype storage', () => {
  it('recovers from corrupt data and reports it', () => {
    const storage = new MemoryStorage();
    const report = vi.fn();
    storage.setItem(STORAGE_KEY, '{broken');

    const state = loadPrototypeState(storage, report);

    expect(state.version).toBe(1);
    expect(state.bestScores).toEqual({});
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(report).toHaveBeenCalledOnce();
  });

  it('migrates safe legacy best scores', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 0, bestScores: { 'samosa-shield': 420, bad: 'no' } }),
    );

    expect(loadPrototypeState(storage, vi.fn()).bestScores).toEqual({ 'samosa-shield': 420 });
  });

  it('returns false and reports failed writes', () => {
    const storage = new MemoryStorage();
    const report = vi.fn();
    storage.setItem = () => {
      throw new Error('quota');
    };
    const state = loadPrototypeState(storage, report);

    expect(savePrototypeState(storage, state, report)).toBe(false);
    expect(report).toHaveBeenCalledWith('Could not save local prototype data.', expect.any(Error));
  });
});
