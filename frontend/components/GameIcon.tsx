import type { DailyGameConfig } from '@shared/game';

// Small original vector stamps for the local deck; no game-state or answer data.
const PATHS: Record<DailyGameConfig['engine'], string> = {
  'defense-v1': 'M32 9 Q38 12 54 49 Q32 60 10 49 Z M22 43 L31 23 M38 43 L42 43',
  'dodge-v1':
    'M18 14 Q32 8 46 14 L51 46 Q32 55 13 46 Z M20 20 L44 20 L42 31 L22 31 Z M13 23 L9 23 M51 23 L55 23 M20 43 L24 43 M40 43 L44 43',
  'tap-v1':
    'M32 20 Q18 0 13 17 Q14 27 29 30 M32 20 Q46 0 51 17 Q50 27 35 30 M32 16 L32 54 M24 34 L12 42 M40 34 L52 42 M23 45 L15 55 M41 45 L49 55',
  'classify-v1': 'M10 17 L54 17 L54 49 L10 49 Z M10 17 L32 35 L54 17 M15 11 L49 11',
  'timing-v1':
    'M8 14 L56 14 L56 50 L8 50 Z M14 20 L40 20 L40 43 L14 43 Z M47 24 L50 24 M47 33 L50 33 M47 42 L50 42',
  'sequence-v1':
    'M11 8 L53 8 L53 56 L11 56 Z M18 20 L46 20 L46 50 L18 50 Z M32 20 L32 50 M28 13 L36 13',
  'sort-v1': 'M22 12 L10 20 L16 32 L23 28 L21 53 L43 53 L41 28 L48 32 L54 20 L42 12 Q32 22 22 12 Z',
};
export function GameIcon({ engine }: { engine: DailyGameConfig['engine'] }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        d={PATHS[engine]}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
