import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, Scene, Edge } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

export interface EditorState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  editingSaveId: string | null;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setEditingSaveId: (id: string | null) => void;
}

export interface GameState {
  game: Game;
  
  // Canvas / Scene actions
  addScene: (x: number, y: number) => void;
  updateScenePosition: (id: string, x: number, y: number) => void;
  
  // Edge actions
  addEdge: (source: string, target: string) => void;
  deleteEdge: (source: string, edgeId: string) => void;
  updateEdge: (source: string, edgeId: string, updates: Partial<Edge>) => void;
  
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  addBlock: (sceneId: string, blockType: 'media' | 'text' | 'task' | 'interaction' | 'container', interactionType?: 'choice' | 'roll', targetContainerId?: string) => void;
  updateBlock: (sceneId: string, blockId: string, updates: any) => void;
  removeBlock: (sceneId: string, blockId: string) => void;
  moveBlock: (sceneId: string, blockId: string, sourceContainerId: string, targetContainerId: string, sourceIndex: number, targetIndex: number) => void;
  
  // Add other mutations later as needed (update scene, update block, etc.)
  setGame: (game: Game) => void;
}

export type StudioStore = EditorState & GameState;

export function sanitizeGame(game: Game): Game {
  if (!game || !game.scenes) return game;
  const sanitizedScenes = { ...game.scenes };
  
  for (const sceneId in sanitizedScenes) {
    const scene = sanitizedScenes[sceneId];
    if (!scene) continue;
    
    // Separate non-continue blocks and continue blocks
    const nonContinueBlocks = (scene.blocks || []).filter(
      b => b.type !== 'interaction' || (b as any).interactionType !== 'continue'
    );
    let continueBlock = (scene.blocks || []).find(
      b => b.type === 'interaction' && (b as any).interactionType === 'continue'
    );
    
    if (!continueBlock) {
      continueBlock = {
        id: 'continue_' + uuidv4(),
        type: 'interaction',
        interactionType: 'continue',
        label: 'Continue'
      };
    }
    
    sanitizedScenes[sceneId] = {
      ...scene,
      blocks: [...nonContinueBlocks, continueBlock]
    };
  }
  
  return {
    ...game,
    scenes: sanitizedScenes
  };
}

const initialGame: Game = {
  id: uuidv4(),
  title: 'Untitled Game',
  version: '1.0.0',
  settings: {
    theme: {
      primaryColor: '#1971c2',
      backgroundColor: '#f8f9fa',
      fontFamily: 'sans-serif'
    },
    rerollPolicy: { type: 'per-task' }
  },
  globalVariables: [],
  tags: [],
  scenes: {},
  edges: {},
  startSceneId: ''
};

export const useStudioStore = create<StudioStore>()(
  persist(
    (set) => ({
  // Editor State
  selectedNodeId: null,
  selectedEdgeId: null,
  editingSaveId: null,
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setEditingSaveId: (id) => set({ editingSaveId: id }),

  // Game State
  game: initialGame,
  
  setGame: (game) => set({ game: sanitizeGame(game) }),
  
  addScene: (x, y) => set((state) => {
    const continueBlockId = uuidv4();
    const newScene: Scene = {
      id: uuidv4(),
      name: 'New Scene',
      blocks: [
        {
          id: continueBlockId,
          type: 'interaction',
          interactionType: 'continue',
          label: 'Continue'
        }
      ],

      sceneMutations: [],
      localVariables: [],
      editorMetadata: { position: { x, y } }
    };
    
    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [newScene.id]: newScene
        },
        // Set as start scene if it's the first one
        startSceneId: Object.keys(state.game.scenes).length === 0 ? newScene.id : state.game.startSceneId
      }
    };
  }),
  
  updateScenePosition: (id, x, y) => set((state) => {
    const scene = state.game.scenes[id];
    if (!scene) return state;
    
    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [id]: {
            ...scene,
            editorMetadata: {
              ...scene.editorMetadata,
              position: { x, y }
            }
          }
        }
      }
    };
  }),
  
  updateScene: (id, updates) => set((state) => {
    const scene = state.game.scenes[id];
    if (!scene) return state;
    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [id]: { ...scene, ...updates }
        }
      }
    };
  }),

  deleteScene: (id) => set((state) => {
    const newScenes = { ...state.game.scenes };
    delete newScenes[id];

    const newEdges = { ...state.game.edges };
    delete newEdges[id];

    // Remove any inbound edges to this scene
    Object.keys(newEdges).forEach(sourceId => {
      newEdges[sourceId] = newEdges[sourceId].filter(e => e.targetSceneId !== id);
      if (newEdges[sourceId].length === 0) {
        delete newEdges[sourceId];
      }
    });

    return {
      game: {
        ...state.game,
        scenes: newScenes,
        edges: newEdges,
        startSceneId: state.game.startSceneId === id ? '' : state.game.startSceneId
      },
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
    };
  }),

  addBlock: (sceneId, blockType, interactionType, targetContainerId) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;
    
    let newBlock: any = { id: uuidv4(), type: blockType };
    if (blockType === 'media') newBlock = { ...newBlock, mediaType: 'image', url: '' };
    if (blockType === 'text') newBlock = { ...newBlock, text: 'New text content' };
    if (blockType === 'task') newBlock = { ...newBlock, durationSeconds: 60 };
    if (blockType === 'container') newBlock = { ...newBlock, direction: 'column', blocks: [] };
    
    let newLocalVariables = [...(scene.localVariables || [])];
    if (blockType === 'interaction') {
      const type = interactionType || 'choice';
      newBlock = { 
        ...newBlock, 
        interactionType: type, 
        label: type === 'roll' ? 'Roll' : undefined,
        choices: type === 'choice' ? [{ id: uuidv4(), label: 'Option 1' }] : undefined,
        isRequired: true
      };
      
      if (type === 'roll') {
        newBlock.maxRoll = 10;
        newLocalVariables.push({
          id: `rollValue_${newBlock.id}`,
          name: `roll_value`,
          type: 'number',
          defaultValue: 0
        });
      } else if (type === 'choice') {
        newLocalVariables.push({
          id: `choiceValue_${newBlock.id}`,
          name: `selected_choice_text`,
          type: 'string',
          defaultValue: ''
        });
      }
    }

    const recursivelyAddBlock = (blocks: any[]): any[] => {
      if (targetContainerId) {
        return blocks.map(b => {
          if (b.id === targetContainerId && b.type === 'container') {
            return { ...b, blocks: [...b.blocks, newBlock] };
          }
          if (b.type === 'container') {
            return { ...b, blocks: recursivelyAddBlock(b.blocks) };
          }
          return b;
        });
      } else {
        const continueIdx = blocks.findIndex(b => b.type === 'interaction' && b.interactionType === 'continue');
        if (continueIdx !== -1) {
          const newBlocks = [...blocks];
          newBlocks.splice(continueIdx, 0, newBlock);
          return newBlocks;
        }
        return [...blocks, newBlock];
      }
    };

    let blocks = recursivelyAddBlock(scene.blocks);
    if (!blocks.some(b => b.type === 'interaction' && b.interactionType === 'continue')) {
        blocks.push({ id: 'continue_' + uuidv4(), type: 'interaction', interactionType: 'continue', label: 'Continue' });
    }

    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [sceneId]: { 
            ...scene, 
            blocks,
            localVariables: newLocalVariables
          }
        }
      }
    };
  }),

  updateBlock: (sceneId, blockId, updates) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;

    let newLocalVariables = [...(scene.localVariables || [])];
    let block: any = null;
    const findBlock = (blocks: any[]) => {
      for (const b of blocks) {
        if (b.id === blockId) block = b;
        if (b.type === 'container') findBlock(b.blocks);
      }
    };
    findBlock(scene.blocks);

    let additionalUpdates = {};

    if (block && block.type === 'interaction') {
      if (updates.interactionType !== undefined) {
        const currentInteractionType = (block as any).interactionType;
        const newInteractionType = updates.interactionType;

        if (currentInteractionType !== 'roll' && newInteractionType === 'roll') {
          additionalUpdates = { maxRoll: 10, choices: undefined, isMappedRoll: false, rollBranches: undefined };
          newLocalVariables.push({
            id: `rollValue_${blockId}`,
            name: `roll_value`,
            type: 'number',
            defaultValue: 0
          });
          newLocalVariables = newLocalVariables.filter(v => v.id !== `choiceValue_${blockId}`);
        } else if (currentInteractionType !== 'choice' && newInteractionType === 'choice') {
          additionalUpdates = { choices: [{ id: uuidv4(), label: 'Option 1' }], maxRoll: undefined, isMappedRoll: undefined, rollBranches: undefined };
          newLocalVariables.push({
            id: `choiceValue_${blockId}`,
            name: `selected_choice_text`,
            type: 'string',
            defaultValue: ''
          });
          newLocalVariables = newLocalVariables.filter(v => !v.id.startsWith(`rollValue_${blockId}`) && !v.id.startsWith(`rollOutcome_${blockId}`));
        } else if (newInteractionType === 'continue') {
          newLocalVariables = newLocalVariables.filter(v => !v.id.startsWith(`rollValue_${blockId}`) && !v.id.startsWith(`rollOutcome_${blockId}`) && !v.id.startsWith(`choiceValue_${blockId}`));
        }
      }

      if (updates.isMappedRoll !== undefined) {
        if (updates.isMappedRoll) {
          newLocalVariables.push({
            id: `rollOutcome_${blockId}`,
            name: `roll_outcome`,
            type: 'string',
            defaultValue: ''
          });
        } else {
          newLocalVariables = newLocalVariables.filter(v => v.id !== `rollOutcome_${blockId}`);
        }
      }
    }

    const recursivelyUpdate = (blocks: any[]): any[] => {
      return blocks.map(b => {
        if (b.id === blockId) return { ...b, ...updates, ...additionalUpdates };
        if (b.type === 'container') return { ...b, blocks: recursivelyUpdate(b.blocks) };
        return b;
      });
    };

    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [sceneId]: { 
            ...scene, 
            blocks: recursivelyUpdate(scene.blocks),
            localVariables: newLocalVariables
          }
        }
      }
    };
  }),

  removeBlock: (sceneId, blockId) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;

    let block: any = null;
    const findBlock = (blocks: any[]) => {
      for (const b of blocks) {
        if (b.id === blockId) block = b;
        if (b.type === 'container') findBlock(b.blocks);
      }
    };
    findBlock(scene.blocks);

    if (block && block.type === 'interaction' && (block as any).interactionType === 'continue') {
      return state; // Prevent removing the continue block
    }

    let newLocalVariables = scene.localVariables || [];

    if (block && block.type === 'interaction') {
      if ((block as any).interactionType === 'roll') {
        newLocalVariables = newLocalVariables.filter(v => !v.id.startsWith(`rollValue_${blockId}`) && !v.id.startsWith(`rollOutcome_${blockId}`));
      } else if ((block as any).interactionType === 'choice') {
        newLocalVariables = newLocalVariables.filter(v => v.id !== `choiceValue_${blockId}`);
      }
    }

    const recursivelyRemove = (blocks: any[]): any[] => {
      return blocks.filter(b => b.id !== blockId).map(b => {
        if (b.type === 'container') return { ...b, blocks: recursivelyRemove(b.blocks) };
        return b;
      });
    };

    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [sceneId]: { 
            ...scene, 
            blocks: recursivelyRemove(scene.blocks),
            localVariables: newLocalVariables
          }
        }
      }
    };
  }),

  moveBlock: (sceneId, blockId, sourceContainerId, targetContainerId, sourceIndex, targetIndex) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;

    let movedBlock: any = null;

    if (blockId === targetContainerId) return state;

    const isDescendant = (blocks: any[], targetId: string): boolean => {
      for (const b of blocks) {
        if (b.id === blockId) {
          const findInSelf = (subBlocks: any[]): boolean => {
            for (const sub of subBlocks) {
              if (sub.id === targetId) return true;
              if (sub.type === 'container' && findInSelf(sub.blocks)) return true;
            }
            return false;
          };
          if (b.type === 'container' && findInSelf(b.blocks)) return true;
        }
        if (b.type === 'container' && isDescendant(b.blocks, targetId)) return true;
      }
      return false;
    };

    if (isDescendant(scene.blocks, targetContainerId)) return state;
    
    const removeFromParent = (blocks: any[], parentId: string): any[] => {
      if (parentId === 'blocks' && sourceContainerId === 'blocks') {
        const newBlocks = [...blocks];
        movedBlock = newBlocks.splice(sourceIndex, 1)[0];
        return newBlocks;
      }
      return blocks.map(b => {
        if (b.id === sourceContainerId && b.type === 'container') {
          const newNested = [...b.blocks];
          movedBlock = newNested.splice(sourceIndex, 1)[0];
          return { ...b, blocks: newNested };
        }
        if (b.type === 'container') {
          return { ...b, blocks: removeFromParent(b.blocks, b.id) };
        }
        return b;
      });
    };

    let updatedBlocks = removeFromParent(scene.blocks, 'blocks');
    if (!movedBlock) return state;

    const insertIntoParent = (blocks: any[], parentId: string): any[] => {
      if (parentId === 'blocks' && targetContainerId === 'blocks') {
        const newBlocks = [...blocks];
        newBlocks.splice(targetIndex, 0, movedBlock);
        return newBlocks;
      }
      return blocks.map(b => {
        if (b.id === targetContainerId && b.type === 'container') {
          const newNested = [...(b.blocks || [])];
          newNested.splice(targetIndex, 0, movedBlock);
          return { ...b, blocks: newNested };
        }
        if (b.type === 'container') {
          return { ...b, blocks: insertIntoParent(b.blocks, b.id) };
        }
        return b;
      });
    };

    updatedBlocks = insertIntoParent(updatedBlocks, 'blocks');

    return { game: { ...state.game, scenes: { ...state.game.scenes, [sceneId]: { ...scene, blocks: updatedBlocks } } } };
  }),
  
  addEdge: (source, target) => set((state) => {
    const existingEdges = state.game.edges[source] || [];
    const needsDefaultEdge = !existingEdges.some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);

    const newEdge: Edge = {
      id: uuidv4(),
      sourceSceneId: source,
      targetSceneId: target,
      priority: existingEdges.length,
      conditionGroup: needsDefaultEdge ? { logicalOperator: 'AND', conditions: [] } : {
        logicalOperator: 'AND',
        conditions: [{
          id: uuidv4(),
          targetId: 'newVar',
          operator: '==',
          value: true
        }]
      },
      edgeMutations: []
    };
    
    return {
      game: {
        ...state.game,
        edges: {
          ...state.game.edges,
          [source]: [...existingEdges, newEdge]
        }
      }
    };
  }),

  deleteEdge: (source, edgeId) => set((state) => {
    const existingEdges = state.game.edges[source] || [];
    return {
      game: {
        ...state.game,
        edges: {
          ...state.game.edges,
          [source]: existingEdges.filter(e => e.id !== edgeId)
        }
      }
    };
  }),

  updateEdge: (source, edgeId, updates) => set((state) => {
    const existingEdges = state.game.edges[source] || [];
    return {
      game: {
        ...state.game,
        edges: {
          ...state.game.edges,
          [source]: existingEdges.map(e => e.id === edgeId ? { ...e, ...updates } : e)
        }
      }
    };
  })
    }),
    {
      name: 'studio-storage',
      partialize: (state) => ({ game: state.game })
    }
  )
);
