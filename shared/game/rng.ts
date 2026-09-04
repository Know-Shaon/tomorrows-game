export interface RandomResult {
  state: number;
  value: number;
}

export function nextSeededRandom(state: number): RandomResult {
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  value = (value ^ (value >>> 14)) >>> 0;

  return { state: nextState, value: value / 4_294_967_296 };
}
