import { Game, Edge, ConditionGroup, Condition, Mutation, InteractionBlock } from '../types/game';
import { GameState } from './GameState';

export class ExecutionEngine {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /**
   * Evaluates if a given condition group passes based on the current game state.
   */
  public evaluateConditionGroup(conditionGroup: ConditionGroup | undefined, state: GameState): boolean {
    if (!conditionGroup || conditionGroup.conditions.length === 0) {
      return true; // Empty conditions pass
    }

    const evaluateCondition = (cond: Condition): boolean => {
      // 1. Resolve variable or tag value
      let valueInState: number | string | boolean | undefined;
      
      if (cond.operator === 'has_tag' || cond.operator === 'missing_tag') {
        valueInState = state.activeTags[cond.targetId] !== undefined;
      } else {
        // Try local then global
        valueInState = state.localVariables[cond.targetId];
        if (valueInState === undefined) {
          valueInState = state.globalVariables[cond.targetId];
        }
      }

      if (valueInState === undefined && (cond.operator !== 'has_tag' && cond.operator !== 'missing_tag')) {
        return false; // Variable not found
      }

      // 2. Apply operator
      switch (cond.operator) {
        case '==': return valueInState === cond.value;
        case '!=': return valueInState !== cond.value;
        case '>': return Number(valueInState) > Number(cond.value);
        case '<': return Number(valueInState) < Number(cond.value);
        case '>=': return Number(valueInState) >= Number(cond.value);
        case '<=': return Number(valueInState) <= Number(cond.value);
        case 'has_tag': return valueInState === true;
        case 'missing_tag': return valueInState === false;
        default: return false;
      }
    };

    if (conditionGroup.logicalOperator === 'AND') {
      return conditionGroup.conditions.every(evaluateCondition);
    } else {
      return conditionGroup.conditions.some(evaluateCondition);
    }
  }

  /**
   * Applies a list of mutations to the game state. Returns a new mutated state.
   */
  public applyMutations(mutations: Mutation[], currentState: GameState): GameState {
    // We clone state lightly. In a real app, you might use immer or structuredClone
    const nextState: GameState = {
      ...currentState,
      globalVariables: { ...currentState.globalVariables },
      localVariables: { ...currentState.localVariables },
      activeTags: { ...currentState.activeTags },
      blockRerolls: { ...currentState.blockRerolls }
    };

    for (const mutation of mutations) {
      const { targetId, operation, value } = mutation;
      
      if (operation === 'add_tag') {
        nextState.activeTags[targetId] = null; // Basic indefinite for now, handle durations later
        continue;
      }
      if (operation === 'remove_tag') {
        delete nextState.activeTags[targetId];
        continue;
      }

      // Determine where the variable lives
      let isLocal = targetId in nextState.localVariables;
      let isGlobal = targetId in nextState.globalVariables;
      
      // If variable doesn't exist, default to creating a global one, or rely on Game definition
      // For simplicity here we assume it's global if not found in local
      const targetDict = isLocal ? nextState.localVariables : nextState.globalVariables;
      const currentValue = targetDict[targetId] ?? 0;

      switch (operation) {
        case 'set':
          if (value !== undefined) targetDict[targetId] = value;
          break;
        case 'add':
          targetDict[targetId] = Number(currentValue) + Number(value);
          break;
        case 'subtract':
          targetDict[targetId] = Number(currentValue) - Number(value);
          break;
        case 'multiply':
          targetDict[targetId] = Number(currentValue) * Number(value);
          break;
        case 'divide':
          targetDict[targetId] = Number(currentValue) / Number(value);
          break;
      }
    }

    return nextState;
  }

  /**
   * Determines the next edge to take from the current scene, triggered by an interaction block.
   */
  public determineNextEdge(interactionId: string, state: GameState): Edge | null {
    const edgesFromCurrent = this.game.edges[state.currentSceneId] || [];
    
    // Filter edges associated with this interaction
    const relevantEdges = edgesFromCurrent.filter(e => e.triggerInteractionId === interactionId || !e.triggerInteractionId);
    
    // Sort by priority (higher priority first)
    const sortedEdges = relevantEdges.sort((a, b) => b.priority - a.priority);

    let defaultEdge: Edge | null = null;

    for (const edge of sortedEdges) {
      if (edge.isDefaultFallback) {
        defaultEdge = edge;
      }
      
      if (!edge.isDefaultFallback && this.evaluateConditionGroup(edge.conditionGroup, state)) {
        return edge;
      }
    }

    return defaultEdge;
  }

  /**
   * Traverses to the next scene, applying relevant mutations.
   */
  public traverseEdge(edge: Edge, currentState: GameState): GameState {
    const currentScene = this.game.scenes[currentState.currentSceneId];
    
    // Combine scene exit mutations and edge traversal mutations
    const combinedMutations = [
      ...(currentScene?.sceneMutations || []),
      ...(edge.edgeMutations || [])
    ];

    let nextState = this.applyMutations(combinedMutations, currentState);
    
    // Process local variable inheritance and explicit mappings
    const oldLocals = nextState.localVariables;
    const inheritedLocals: Record<string, number | string | boolean> = {};

    if (currentScene?.inheritAllLocals || edge.inheritAllLocals) {
      Object.assign(inheritedLocals, oldLocals);
    } else {
      // Process explicit mappings
      const sceneMappings = currentScene?.sceneVariableMappings || [];
      const edgeMappings = edge.edgeVariableMappings || [];
      const allMappings = [...sceneMappings, ...edgeMappings];
      
      for (const mapping of allMappings) {
        if (oldLocals[mapping.sourceId] !== undefined) {
          inheritedLocals[mapping.targetId] = oldLocals[mapping.sourceId];
        }
      }
    }
    
    // Update scene ID
    nextState.currentSceneId = edge.targetSceneId;
    
    // Initialize new scene's local variables
    const nextScene = this.game.scenes[edge.targetSceneId];
    nextState.localVariables = {}; // clear old locals
    if (nextScene) {
      for (const v of nextScene.localVariables) {
        nextState.localVariables[v.id] = v.defaultValue;
      }
    }
    
    // Apply inherited locals (they OVERWRITE defaults)
    Object.assign(nextState.localVariables, inheritedLocals);

    return nextState;
  }
}
