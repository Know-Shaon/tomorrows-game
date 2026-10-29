import { concealedTimer } from '@shared/game/encore';
import type { DailyGameConfig, DailyGameState } from '@shared/game';

export function actionVerbFor(config: DailyGameConfig): string {
  if (config.engine === 'defense-v1') return 'SHOO';
  if (config.engine === 'dodge-v1') return 'DODGE';
  if (config.engine === 'tap-v1') return 'SWAT';
  if (config.engine === 'classify-v1') return 'DECIDE';
  if (config.engine === 'timing-v1') return 'STOP';
  if (config.engine === 'sequence-v1') return 'HIT';
  return 'SORT';
}

export function accessibleGameStatus(config: DailyGameConfig, state: DailyGameState): string {
  if (state.engine === 'defense-v1')
    return `${state.threats.length} pigeons approaching. Samosa health ${state.health} of ${config.engine === 'defense-v1' ? config.maxHealth : 3}.`;
  if (state.engine === 'dodge-v1') {
    const wave = state.waves.find((item) => !item.resolved);
    const obstacles = wave?.hazards.flatMap((hazard, lane) => (hazard ? [lane + 1] : []));
    return `Car in lane ${state.targetLane + 1}. ${obstacles?.length ? `Potholes approaching in lanes ${obstacles.join(', ')}.` : 'Road is clear.'}`;
  }
  if (state.engine === 'tap-v1') {
    if (!state.target) return 'The desk is clear.';
    const objectName =
      state.target.token === 'mosquito'
        ? 'A mosquito is buzzing'
        : state.target.token === 'coffee'
          ? 'A coffee mug is on the desk'
          : state.target.token === 'notification'
            ? 'A phone notification is on the desk'
            : 'A mouse cursor is crossing the desk';
    return `${objectName}.`;
  }
  if (state.engine === 'classify-v1') {
    const card =
      config.engine === 'classify-v1' ? config.cards[state.currentCardIndex ?? -1] : null;
    return card ? `Message from ${card.sender}: ${card.subject}.` : 'Waiting for the next message.';
  }
  if (state.engine === 'timing-v1')
    return `Round ${Math.min(state.round, config.engine === 'timing-v1' ? config.targetsSeconds.length : 1)}. Timer ${concealedTimer(config, state.timerSeconds, state.targetSeconds, state.waitingTicks) ? 'hidden' : state.timerSeconds.toFixed(2)} seconds. Target ${state.targetSeconds.toFixed(2)} seconds.`;
  if (state.engine === 'sequence-v1')
    return `Current floor ${state.currentFloor.toFixed(1)}. Hit floor ${state.requests[state.requestIndex] ?? 'complete'}.`;
  if (config.engine !== 'sort-v1') return 'Waiting for the next garment.';
  const item = config.items[state.currentItemIndex ?? -1];
  return item ? `${item.token.replaceAll('-', ' ')}.` : 'Waiting for the next garment.';
}
