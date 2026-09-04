import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDailyConfig, type DailyGameConfig } from '@shared/game';
import { GameExperience } from '@frontend/components/GameExperience';
import { TodayPage } from '@frontend/components/TodayPage';
import { formatCountdown, getDailyInfo } from '@frontend/lib/date';
import { loadPrototypeState, savePrototypeState, type PrototypeState } from '@frontend/lib/storage';
import { useReducedMotion } from '@frontend/lib/use-reduced-motion';
import { useStartGameTool } from '@frontend/lib/webmcp';

type View = 'today' | 'game';

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
  ].join('-');
}

function previousLocalDateKey(date: Date): string {
  return localDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
}

export function App() {
  const [view, setView] = useState<View>('today');
  const [now, setNow] = useState(() => new Date());
  const [prototype, setPrototype] = useState<PrototypeState>(() =>
    loadPrototypeState(window.localStorage),
  );
  const reducedMotion = useReducedMotion();
  const daily = useMemo(() => getDailyInfo(now), [now]);
  const [config, setConfig] = useState<DailyGameConfig>(() =>
    getDailyConfig(getDailyInfo(new Date()).challengeNumber - 1),
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const startGame = useCallback(() => setView('game'), []);
  useStartGameTool(startGame, config.title);

  const updatePrototype = useCallback(
    (update: (current: PrototypeState) => PrototypeState) => {
      const next = update(prototype);
      const saved = savePrototypeState(window.localStorage, next);
      setPrototype(next);
      return saved;
    },
    [prototype],
  );

  const finishGame = useCallback(
    (score: number) => {
      updatePrototype((current) => {
        const currentDate = new Date();
        const today = localDateKey(currentDate);
        const isSameDay = current.stats.lastPlayedDate === today;
        const nextStreak = isSameDay
          ? current.stats.streak
          : current.stats.lastPlayedDate === previousLocalDateKey(currentDate)
            ? current.stats.streak + 1
            : 1;
        return {
          ...current,
          bestScores: {
            ...current.bestScores,
            [config.id]: Math.max(current.bestScores[config.id] ?? 0, score),
          },
          stats: { streak: nextStreak, lastPlayedDate: today },
        };
      });
    },
    [config.id, updatePrototype],
  );

  if (view === 'game') {
    return (
      <div data-reduced-motion={reducedMotion ? 'true' : 'false'}>
        <GameExperience
          key={config.id}
          config={config}
          bestScore={prototype.bestScores[config.id] ?? 0}
          reducedMotion={reducedMotion}
          onFinish={finishGame}
          nextGameCountdown={formatCountdown(daily.millisecondsRemaining)}
          onExit={(target) => {
            setView('today');
            if (target === 'vote') {
              window.requestAnimationFrame(() => document.querySelector('#vote')?.scrollIntoView());
            }
          }}
        />
      </div>
    );
  }

  return (
    <div data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <TodayPage
        config={config}
        challengeNumber={daily.challengeNumber}
        countdown={formatCountdown(daily.millisecondsRemaining)}
        bestScore={prototype.bestScores[config.id] ?? 0}
        streak={prototype.stats.streak}
        selectedVote={prototype.votes[daily.challengeNumber.toString()]}
        onPlay={startGame}
        onVote={(candidateId) =>
          updatePrototype((current) => ({
            ...current,
            votes: { ...current.votes, [daily.challengeNumber.toString()]: candidateId },
          }))
        }
        onSuggestion={(text) =>
          updatePrototype((current) => ({
            ...current,
            suggestions: [
              ...current.suggestions,
              { text, savedAt: new Date().toISOString() },
            ].slice(-20),
          }))
        }
        onSelectDevelopmentConfig={setConfig}
      />
    </div>
  );
}
