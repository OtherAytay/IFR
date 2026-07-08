'use client'
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Game, Scene, Block, Edge, ConditionGroup, Mutation, InteractionBlock } from '@/types/game';
import { Container, Button, Drawer, Stack, Title, Text, Badge, ActionIcon, Transition, Group } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { SceneRenderer } from './SceneRenderer';

export interface PlayerState {
  currentSceneId: string;
  globalVariables: Record<string, number | string | boolean>;
  localVariables: Record<string, number | string | boolean>;
  tags: string[]; // Active tag IDs
  rerollPool: number;
  blockRerolls: Record<string, number>;
}

export function PlayerEngine({ initialSaveData, saveId }: { initialSaveData: any, saveId: string }) {
  const gameData: Game = initialSaveData.gameData;
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    // Initialize state if empty
    if (!initialSaveData.state || Object.keys(initialSaveData.state).length === 0) {
      const initialGlobals: Record<string, any> = {};
      gameData.globalVariables?.forEach(v => {
        initialGlobals[v.id] = v.defaultValue;
      });

      return {
        currentSceneId: gameData.startSceneId,
        globalVariables: initialGlobals,
        localVariables: {},
        tags: [],
        rerollPool: gameData.settings?.rerollPolicy?.type === 'shared-pool' ? (gameData.settings.rerollPolicy.defaultAllowance || 0) : 0,
        blockRerolls: {}
      };
    }
    const loadedState = initialSaveData.state as PlayerState;
    if (!loadedState.blockRerolls) {
      loadedState.blockRerolls = {};
    }
    return loadedState;
  });

  const [profileOpened, setProfileOpened] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const currentScene = gameData.scenes[playerState.currentSceneId];

  // Auto-Save Effect & Manual Trigger
  const saveState = useCallback((newState: PlayerState) => {
    const raw = localStorage.getItem(`ifr_save_${saveId}`);
    if (raw) {
      const data = JSON.parse(raw);
      data.state = newState;
      data.lastPlayed = new Date().toISOString();
      localStorage.setItem(`ifr_save_${saveId}`, JSON.stringify(data));
    }
  }, [saveId]);

  useEffect(() => {
    saveState(playerState);
  }, [playerState, saveState]);

  // Apply Theme as CSS Variables on Mount
  useEffect(() => {
    if (gameData.settings?.theme) {
      const root = document.documentElement;
      const { primaryColor, backgroundColor, fontFamily } = gameData.settings.theme;
      if (primaryColor) root.style.setProperty('--mantine-primary-color-filled', primaryColor);
      if (backgroundColor) root.style.setProperty('--mantine-color-body', backgroundColor);
      if (fontFamily) root.style.setProperty('--mantine-font-family', fontFamily);
    }
  }, [gameData.settings?.theme]);

  // Evaluates a condition against the current state
  const evaluateConditions = (conditionGroup?: ConditionGroup, interactionContext?: any, evalLocals?: Record<string, any>): boolean => {
    if (!conditionGroup || !conditionGroup.conditions || conditionGroup.conditions.length === 0) return true;
    
    const results = conditionGroup.conditions.map(cond => {
      let valueToCompare: any = null;
      
      // Determine if the targetId is actually a choice ID or roll branch ID
      let choiceSelected = false;
      let isChoiceIdCondition = false;
      let branchRolled = false;
      let isBranchIdCondition = false;
      const sceneBlocks = gameData.scenes[playerState.currentSceneId]?.blocks || [];
      sceneBlocks.forEach(b => {
        if (b.type === 'interaction') {
          if (b.interactionType === 'choice') {
            const isChoiceOfThisBlock = b.choices?.some(c => c.id === cond.targetId);
            if (isChoiceOfThisBlock) {
              isChoiceIdCondition = true;
              const selectedId = evalLocals ? evalLocals[`choice_${b.id}`] : playerState.localVariables[`choice_${b.id}`];
              if (selectedId === cond.targetId) {
                choiceSelected = true;
              }
            }
          } else if (b.interactionType === 'roll' && b.isMappedRoll) {
            const isBranchOfThisBlock = b.rollBranches?.some(br => br.id === cond.targetId);
            if (isBranchOfThisBlock) {
              isBranchIdCondition = true;
              const rolledBranchId = evalLocals ? evalLocals[`rollBranch_${b.id}`] : playerState.localVariables[`rollBranch_${b.id}`];
              if (rolledBranchId === cond.targetId) {
                branchRolled = true;
              }
            }
          }
        }
      });
      
      if (cond.operator === 'has_tag' || cond.operator === 'missing_tag') {
        const hasTag = playerState.tags.includes(cond.targetId);
        return cond.operator === 'has_tag' ? hasTag : !hasTag;
      }
      
      if (isChoiceIdCondition) {
        valueToCompare = choiceSelected;
      } else if (isBranchIdCondition) {
        valueToCompare = branchRolled;
      } else if (cond.targetId in playerState.globalVariables) {
        valueToCompare = playerState.globalVariables[cond.targetId];
      } else if (evalLocals && cond.targetId in evalLocals) {
        valueToCompare = evalLocals[cond.targetId];
      } else if (cond.targetId in playerState.localVariables) {
        valueToCompare = playerState.localVariables[cond.targetId];
      } else if (interactionContext && interactionContext.choiceId === cond.targetId) {
        valueToCompare = true;
      } else if (interactionContext && interactionContext.rollBranchId === cond.targetId) {
        valueToCompare = true;
      }

      // Simple evaluation (could be expanded)
      switch (cond.operator) {
        case '==': return valueToCompare == cond.value;
        case '!=': return valueToCompare != cond.value;
        case '>': return Number(valueToCompare) > Number(cond.value);
        case '<': return Number(valueToCompare) < Number(cond.value);
        case '>=': return Number(valueToCompare) >= Number(cond.value);
        case '<=': return Number(valueToCompare) <= Number(cond.value);
        case 'contains': return String(valueToCompare).includes(String(cond.value));
        case 'is_in': return String(cond.value).includes(String(valueToCompare));
        default: return false;
      }
    });

    return conditionGroup.logicalOperator === 'AND' ? results.every(r => r) : results.some(r => r);
  };

  // Applies an array of mutations to the state copy
  const applyMutations = (mutations: Mutation[], stateDraft: PlayerState) => {
    if (!mutations) return;
    mutations.forEach(mut => {
      if (mut.operation === 'add_tag') {
        if (!stateDraft.tags.includes(mut.targetId)) stateDraft.tags.push(mut.targetId);
      } else if (mut.operation === 'remove_tag') {
        stateDraft.tags = stateDraft.tags.filter(t => t !== mut.targetId);
      } else {
        // Handle numerical/string mutations
        let currentValue = stateDraft.globalVariables[mut.targetId] ?? stateDraft.localVariables[mut.targetId] ?? 0;
        let newValue: any = currentValue;
        
        const val = mut.value as number;
        switch (mut.operation) {
          case 'set': newValue = mut.value; break;
          case 'add': newValue = Number(currentValue) + Number(val); break;
          case 'subtract': newValue = Number(currentValue) - Number(val); break;
          case 'multiply': newValue = Number(currentValue) * Number(val); break;
          case 'divide': newValue = Number(currentValue) / Number(val); break;
        }

        if (mut.targetId in stateDraft.globalVariables) stateDraft.globalVariables[mut.targetId] = newValue;
        else stateDraft.localVariables[mut.targetId] = newValue;
      }
    });
  };

  // Called by the SceneRenderer when the player interacts
  const handleInteraction = (interactionBlock: InteractionBlock, context?: any) => {
    if (interactionBlock.interactionType === 'choice') {
      const choiceId = context?.choiceId;
      const choiceLabel = context?.choiceLabel;
      if (choiceId !== undefined) {
        setPlayerState(prev => {
          const nextState = {
            ...prev,
            localVariables: {
              ...prev.localVariables,
              [`choice_${interactionBlock.id}`]: choiceId
            }
          };
          if (choiceLabel !== undefined) {
            nextState.localVariables[`choiceValue_${interactionBlock.id}`] = choiceLabel;
          }
          saveState(nextState);
          return nextState;
        });
      }
      return;
    }

    if (interactionBlock.interactionType === 'roll') {
      const rollValue = context?.rollValue;
      const rollOutcome = context?.rollOutcome;
      const rollBranchId = context?.rollBranchId;
      const isReroll = context?.isReroll;
      
      if (rollValue !== undefined) {
        setPlayerState(prev => {
          const nextState = {
            ...prev,
            localVariables: {
              ...prev.localVariables,
              [`rollValue_${interactionBlock.id}`]: rollValue
            }
          };
          if (rollOutcome !== undefined) {
            nextState.localVariables[`rollOutcome_${interactionBlock.id}`] = rollOutcome;
          }
          if (rollBranchId !== undefined) {
            nextState.localVariables[`rollBranch_${interactionBlock.id}`] = rollBranchId;
          }
          if (isReroll) {
            if (gameData.settings?.rerollPolicy?.type === 'shared-pool') {
              nextState.rerollPool = Math.max(0, prev.rerollPool - 1);
            } else {
              nextState.blockRerolls = {
                ...prev.blockRerolls,
                [interactionBlock.id]: (prev.blockRerolls[interactionBlock.id] || 0) + 1
              };
            }
          }
          saveState(nextState);
          return nextState;
        });
      }
      return;
    }



    if (interactionBlock.interactionType === 'continue') {
      // Find Edges originating from currentScene
      const edges = gameData.edges ? gameData.edges[playerState.currentSceneId] || [] : [];
      
      const evalLocals = { ...playerState.localVariables };

      // Filter edges and evaluate them in priority order
      const relevantEdges = edges
        .filter(e => !e.triggerInteractionId || e.triggerInteractionId === interactionBlock.id)
        .sort((a, b) => a.priority - b.priority);

      let chosenEdge = relevantEdges.find(e => evaluateConditions(e.conditionGroup, context, evalLocals));
      
      if (!chosenEdge) {
        chosenEdge = relevantEdges.find(e => e.isDefaultFallback);
      }

      if (!chosenEdge) {
        console.warn("No valid routing edge found and no default fallback.");
        saveState(playerState);
        return;
      }

      // Prepare next state draft
      const nextState = JSON.parse(JSON.stringify(playerState)) as PlayerState;
      nextState.localVariables = evalLocals;
      
      // Apply Scene exit mutations
      if (currentScene.sceneMutations) {
        applyMutations(currentScene.sceneMutations, nextState);
      }
      
      // Apply Edge traversal mutations
      if (chosenEdge.edgeMutations) {
        applyMutations(chosenEdge.edgeMutations, nextState);
      }

      // Handle Local Variables passing logic
      const nextLocals: Record<string, any> = {};
      if (chosenEdge.inheritAllLocals || currentScene.inheritAllLocals) {
        Object.assign(nextLocals, nextState.localVariables);
      } else {
        // Apply explicit variable mappings
        const sceneMappings = currentScene.sceneVariableMappings || [];
        const edgeMappings = chosenEdge.edgeVariableMappings || [];
        const allMappings = [...sceneMappings, ...edgeMappings];
        for (const mapping of allMappings) {
          if (nextState.localVariables[mapping.sourceId] !== undefined) {
            nextLocals[mapping.targetId] = nextState.localVariables[mapping.sourceId];
          }
        }
      }

      nextState.localVariables = nextLocals;
      nextState.currentSceneId = chosenEdge.targetSceneId;
      
      // Reset blockRerolls for the new scene
      nextState.blockRerolls = {};

      // Trigger Transition
      setTransitioning(true);
      setTimeout(() => {
        setPlayerState(nextState);
        setTransitioning(false);
      }, 400); // 400ms fade transition
    }
  };

  // Update Reroll Pool (called by tasks/rolls locally)
  const useReroll = () => {
    if (playerState.rerollPool > 0) {
      setPlayerState(prev => ({...prev, rerollPool: prev.rerollPool - 1}));
      return true;
    }
    return false;
  };

  if (!currentScene) {
    return <Container><Title c="red">Error: Scene {playerState.currentSceneId} not found.</Title></Container>;
  }

  return (
    <>
      {/* Persistent Floating Profile Toggle */}
      <ActionIcon 
        size="xl" 
        radius="xl" 
        variant="filled" 
        color="violet"
        style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100 }}
        onClick={() => setProfileOpened(true)}
      >
        <IconUser />
      </ActionIcon>

      <Drawer opened={profileOpened} onClose={() => setProfileOpened(false)} position="right" title="Player Status">
        <Stack>
          <Title order={5}>Variables</Title>
          {Object.entries(playerState.globalVariables).map(([id, val]) => {
            const varDef = gameData.globalVariables?.find(v => v.id === id);
            return (
              <Group justify="space-between" key={id}>
                <Text>{varDef?.name || id}:</Text>
                <Text fw={700}>{String(val)}</Text>
              </Group>
            );
          })}
          
          {gameData.settings?.rerollPolicy?.type === 'shared-pool' && (
            <Group justify="space-between">
              <Text>Rerolls left:</Text>
              <Text fw={700}>{playerState.rerollPool}</Text>
            </Group>
          )}

          <Title order={5} mt="md">Active Tags</Title>
          <Group>
            {playerState.tags.length === 0 && <Text c="dimmed">No active tags</Text>}
            {playerState.tags.map(tId => {
              const tagDef = gameData.tags?.find(t => t.id === tId);
              return <Badge key={tId} color="grape">{tagDef?.name || tId}</Badge>;
            })}
          </Group>
        </Stack>
      </Drawer>

      {/* Main Scene Render with Transition */}
      <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.4s ease', minHeight: '100vh' }}>
        <SceneRenderer 
          scene={currentScene} 
          onInteract={handleInteraction}
          onLocalUpdate={(mutations) => {
            // Apply local mutations without routing
            const draft = JSON.parse(JSON.stringify(playerState));
            applyMutations(mutations, draft);
            setPlayerState(draft);
          }}
          useReroll={gameData.settings?.rerollPolicy?.type === 'shared-pool' ? useReroll : undefined}
          localVariables={playerState.localVariables}
          globalVariables={playerState.globalVariables}
          game={gameData}
          rerollPolicy={gameData.settings?.rerollPolicy}
          blockRerolls={playerState.blockRerolls}
          rerollPool={playerState.rerollPool}
        />
      </div>
    </>
  );
}
