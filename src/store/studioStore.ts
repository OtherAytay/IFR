import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, Scene, Edge } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

export interface EditorState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
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
  addBlock: (sceneId: string, blockType: 'media' | 'text' | 'task' | 'interaction') => void;
  updateBlock: (sceneId: string, blockId: string, updates: any) => void;
  removeBlock: (sceneId: string, blockId: string) => void;
  
  // Add other mutations later as needed (update scene, update block, etc.)
  setGame: (game: Game) => void;
}

export type StudioStore = EditorState & GameState;

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
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  // Game State
  game: initialGame,
  
  setGame: (game) => set({ game }),
  
  addScene: (x, y) => set((state) => {
    const newScene: Scene = {
      id: uuidv4(),
      name: 'New Scene',
      blocks: [],
      layoutPreset: 'standard-split',
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

  addBlock: (sceneId, blockType) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;
    
    let newBlock: any = { id: uuidv4(), type: blockType };
    if (blockType === 'media') newBlock = { ...newBlock, mediaType: 'image', url: '' };
    if (blockType === 'text') newBlock = { ...newBlock, text: 'New text content' };
    if (blockType === 'task') newBlock = { ...newBlock, durationSeconds: 60 };
    if (blockType === 'interaction') newBlock = { ...newBlock, interactionType: 'continue', label: 'Continue' };

    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [sceneId]: { ...scene, blocks: [...scene.blocks, newBlock] }
        }
      }
    };
  }),

  updateBlock: (sceneId, blockId, updates) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;
    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [sceneId]: { 
            ...scene, 
            blocks: scene.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
          }
        }
      }
    };
  }),

  removeBlock: (sceneId, blockId) => set((state) => {
    const scene = state.game.scenes[sceneId];
    if (!scene) return state;
    return {
      game: {
        ...state.game,
        scenes: {
          ...state.game.scenes,
          [sceneId]: { 
            ...scene, 
            blocks: scene.blocks.filter(b => b.id !== blockId)
          }
        }
      }
    };
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
