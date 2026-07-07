import { Game, VariableType, Tag } from '../types/game';

export interface GameState {
  currentSceneId: string;
  globalVariables: Record<string, number | string | boolean>;
  localVariables: Record<string, number | string | boolean>;
  activeTags: Record<string, number | null>; // null if indefinite, otherwise timestamp/duration tracking
  
  // Reroll Tracking
  sharedRerolls: number; // For shared-pool
  blockRerolls: Record<string, number>; // For per-task, keyed by block ID
  
  // History or log could be added here
}

export function createInitialState(game: Game): GameState {
  const globalVariables: Record<string, number | string | boolean> = {};
  for (const v of game.globalVariables) {
    globalVariables[v.id] = v.defaultValue;
  }
  
  const activeTags: Record<string, number | null> = {};
  // Tags are usually added during gameplay, but we might want some default tags active
  
  const startScene = game.scenes[game.startSceneId];
  const localVariables: Record<string, number | string | boolean> = {};
  if (startScene) {
    for (const v of startScene.localVariables) {
      localVariables[v.id] = v.defaultValue;
    }
  }

  return {
    currentSceneId: game.startSceneId,
    globalVariables,
    localVariables,
    activeTags,
    sharedRerolls: game.settings.rerollPolicy.type === 'shared-pool' 
      ? (game.settings.rerollPolicy.defaultAllowance || 0)
      : 0,
    blockRerolls: {},
  };
}
