'use client'
import { Scene, Block, MediaBlock, TextBlock, TaskBlock, InteractionBlock, RerollPolicy, Game } from '@/types/game';
import { Roller } from '@/components/Roller';
import { Container, Grid, Stack, Image, Text, Button, Paper, Group, Center, SimpleGrid, Box, RingProgress, Table } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useState, useEffect, ReactNode } from 'react';
import { IconRefresh, IconHome } from '@tabler/icons-react';

function TaskTimer({ block, onComplete }: { block: TaskBlock, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(block.durationSeconds);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setTimeLeft(block.durationSeconds);
  }, [block.id, block.durationSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => {
        const next = Math.max(0, t - 1);
        if (next === 0) onComplete();
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  useEffect(() => {
    if (!block.bpm) return;
    const interval = (60 / block.bpm) * 1000;
    const metronome = setInterval(() => {
      setPulse(true);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}
      setTimeout(() => setPulse(false), 100);
    }, interval);
    return () => clearInterval(metronome);
  }, [block.bpm]);

  const progress = ((block.durationSeconds - timeLeft) / block.durationSeconds) * 100;

  return (
    <Box style={{ transform: pulse ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.1s' }}>
      <RingProgress
        size={120}
        thickness={12}
        roundCaps
        sections={[{ value: progress, color: 'violet' }]}
        label={<Text c="violet" fw={700} ta="center" size="xl">{timeLeft}s</Text>}
      />
    </Box>
  );
}

export interface LookupVariableContext {
  game?: Game;
  scene: Scene;
  localVariables?: Record<string, any>;
  globalVariables?: Record<string, any>;
}

export const lookupVariable = (name: string, ctx: LookupVariableContext) => {
  const { game, scene, localVariables, globalVariables } = ctx;
  if (game?.scenes) {
    for (const s of Object.values(game.scenes)) {
      const def = s.localVariables?.find(v => v.name === name);
      if (def && localVariables && localVariables[def.id] !== undefined) {
        return localVariables[def.id];
      }

      for (const b of s.blocks) {
        if (b.type === 'interaction') {
          const ib = b as InteractionBlock;
          const label = ib.label || (ib.interactionType === 'roll' ? 'Roll' : 'Choice');
          
          if (ib.interactionType === 'roll') {
            if (name === `${label} Value` || name === label) {
              if (localVariables?.[`rollValue_${b.id}`] !== undefined) {
                return localVariables[`rollValue_${b.id}`];
              }
            }
            if (name === `${label} Outcome`) {
              if (localVariables?.[`rollOutcome_${b.id}`] !== undefined) {
                return localVariables[`rollOutcome_${b.id}`];
              }
            }
          } else if (ib.interactionType === 'choice') {
            if (name === `${label} Text` || name === label) {
              if (localVariables?.[`choiceValue_${b.id}`] !== undefined) {
                return localVariables[`choiceValue_${b.id}`];
              }
            }
          }
        }
      }
    }
  }

  const localDef = scene.localVariables?.find(v => v.name === name);
  if (localDef) {
    return localDef.defaultValue;
  }

  const globalDef = game?.globalVariables?.find(v => v.name === name);
  if (globalDef) {
    if (globalVariables && globalVariables[globalDef.id] !== undefined) {
      return globalVariables[globalDef.id];
    }
    return globalDef.defaultValue;
  }
  return undefined;
};

export const evaluateExpression = (expression: string, rawMatch: string, ctx: LookupVariableContext): { value: string; resolved: boolean } => {
  if (!expression.includes('[')) {
    const val = lookupVariable(expression.trim(), ctx);
    if (val !== undefined) return { value: String(val), resolved: true };
    return { value: rawMatch, resolved: false };
  }

  let vars: string[] = [];
  let values: any[] = [];
  let hasUnresolvable = false;

  let safeExpr = expression.replace(/\[([^\]]+)\]/g, (bracketMatch: string, varName: string) => {
    const val = lookupVariable(varName.trim(), ctx);
    if (val === undefined) {
      hasUnresolvable = true;
      return '0';
    }
    
    const varId = `var_${vars.length}`;
    vars.push(varId);
    
    if (val === true) values.push(1);
    else if (val === false) values.push(0);
    else values.push(val);
    
    return varId;
  });

  if (hasUnresolvable) return { value: rawMatch, resolved: false };

  let checkStr = safeExpr.replace(/var_\d+/g, '');
  if (!/^[\d\s\+\-\*\/\(\)\.]*$/.test(checkStr)) {
    return { value: rawMatch, resolved: false };
  }

  try {
    const func = new Function(...vars, `return ${safeExpr};`);
    const result = func(...values);
    
    if (typeof result === 'number' && Number.isNaN(result)) {
      return { value: rawMatch, resolved: false };
    }
    
    return { value: String(result), resolved: true };
  } catch (e) {
    return { value: rawMatch, resolved: false };
  }
};

export const interpolateTextHelper = (text: string, ctx: LookupVariableContext): string => {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    return evaluateExpression(expression, match, ctx).value;
  });
};

export const interpolateTextNodeHelper = (text: string, ctx: LookupVariableContext): ReactNode => {
  if (!text) return '';
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const expression = part.slice(2, -2);
      const { value, resolved } = evaluateExpression(expression, part, ctx);
      if (resolved) {
        return <strong key={index}>{value}</strong>;
      }
      return part;
    }
    return part;
  });
};

export function SceneRenderer({ 
  scene, 
  onInteract, 
  onLocalUpdate, 
  localVariables,
  globalVariables,
  game,
  rerollPolicy,
  blockRerolls,
  rerollPool,
  onRestartGame,
  onReturnToLibrary
}: { 
  scene: Scene, 
  onInteract: (block: InteractionBlock, context?: any) => void,
  onLocalUpdate: (mutations: any[]) => void,
  localVariables?: Record<string, number | string | boolean>,
  globalVariables?: Record<string, number | string | boolean>,
  game?: Game,
  rerollPolicy?: RerollPolicy,
  blockRerolls?: Record<string, number>,
  rerollPool?: number,
  onRestartGame?: () => void,
  onReturnToLibrary?: () => void
}) {
  
  // Group blocks by type
  const mediaBlocks = scene.blocks.filter(b => b.type === 'media') as MediaBlock[];
  const textBlocks = scene.blocks.filter(b => b.type === 'text') as TextBlock[];
  const taskBlocks = scene.blocks.filter(b => b.type === 'task') as TaskBlock[];
  const interactionBlocks = scene.blocks.filter(b => b.type === 'interaction') as InteractionBlock[];

  // State for required tasks
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Reset tracking when scene changes
  useEffect(() => {
    setCompletedTasks(new Set());
  }, [scene.id]);

  const edges = game?.edges ? game.edges[scene.id] || [] : [];
  const isLastNode = edges.length === 0;

  // Helper to render media blocks (carousel if multiple)
  const renderMedia = () => {
    if (mediaBlocks.length === 0) return null;
    if (mediaBlocks.length === 1) {
      const b = mediaBlocks[0];
      return <MediaRenderer block={b} />;
    }
    return (
      <Carousel withIndicators height="100%">
        {mediaBlocks.map(b => (
          <Carousel.Slide key={b.id}>
            <MediaRenderer block={b} />
          </Carousel.Slide>
        ))}
      </Carousel>
    );
  };

  const ctx: LookupVariableContext = { game, scene, localVariables, globalVariables };
  const interpolateText = (text: string) => interpolateTextHelper(text, ctx);
  const interpolateTextNode = (text: string) => interpolateTextNodeHelper(text, ctx);

  // Helper to render content/task/interaction side
  const renderContent = () => {
    return (
      <Stack gap="xl" p="md" style={{ height: '100%', justifyContent: 'center' }}>
        {textBlocks.map(b => (
          <Text key={b.id} size="lg" style={{ whiteSpace: 'pre-wrap' }}>{interpolateTextNode(b.text)}</Text>
        ))}
        
        {taskBlocks.length > 0 && (
          <Paper withBorder p="md" radius="md">
            <Group justify="center">
              {taskBlocks.map(b => (
                <Stack key={b.id} align="center" gap="xs">
                  <TaskTimer 
                    block={b} 
                    onComplete={() => setCompletedTasks(prev => {
                      const n = new Set(prev);
                      n.add(b.id);
                      return n;
                    })} 
                  />
                </Stack>
              ))}
            </Group>
          </Paper>
        )}

        <Group justify="center" mt="xl">
          {interactionBlocks.map(b => {
            let rerollsLeft = 0;
            if (b.interactionType === 'roll') {
              if (rerollPolicy?.type === 'shared-pool') {
                rerollsLeft = rerollPool ?? 0;
              } else {
                const maxAllowance = b.rerollsGranted !== undefined 
                  ? b.rerollsGranted 
                  : (rerollPolicy?.defaultAllowance !== undefined ? rerollPolicy.defaultAllowance : 1);
                const used = blockRerolls?.[b.id] ?? 0;
                rerollsLeft = Math.max(0, maxAllowance - used);
              }
            }

            const allRequiredTasksDone = taskBlocks
              .every(t => completedTasks.has(t.id));

            const allRequiredInteractionsDone = interactionBlocks
              .filter(ib => ib.interactionType !== 'continue' && ib.isRequired !== false)
              .every(ib => {
                if (ib.interactionType === 'choice') {
                  return localVariables?.[`choice_${ib.id}`] !== undefined;
                }
                if (ib.interactionType === 'roll') {
                  return localVariables?.[`rollValue_${ib.id}`] !== undefined;
                }
                return true;
              });

            return (
              <InteractionRenderer 
                key={b.id} 
                block={b} 
                onInteract={onInteract}
                localVariables={localVariables}
                rerollsLeft={rerollsLeft}
                isContinueDisabled={b.interactionType === 'continue' ? ((b.isRequired !== false ? !allRequiredTasksDone : false) || !allRequiredInteractionsDone) : false}
                interpolateText={interpolateText}
                interpolateTextNode={interpolateTextNode}
                isLastNode={isLastNode}
                onRestartGame={onRestartGame}
                onReturnToLibrary={onReturnToLibrary}
              />
            );
          })}
        </Group>
      </Stack>
    );
  };

  // Render layouts
  switch (scene.layoutPreset) {
    case 'standard-split':
      return (
        <Grid gap={0} style={{ minHeight: '100vh', margin: 0 }}>
          {mediaBlocks.length > 0 && (
            <Grid.Col span={{ base: 12, md: 6 }} style={{ minHeight: '50vh', backgroundColor: 'var(--mantine-color-gray-1)' }}>
              {renderMedia()}
            </Grid.Col>
          )}
          <Grid.Col span={{ base: 12, md: mediaBlocks.length > 0 ? 6 : 12 }}>
            <Container h="100%" pt="5rem">
              {renderContent()}
            </Container>
          </Grid.Col>
        </Grid>
      );
    
    case 'grid':
      return (
        <Container size="xl" pt="5rem" pb="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Paper shadow="xs" p="md">{renderMedia()}</Paper>
            <Paper shadow="xs" p="md">{renderContent()}</Paper>
          </SimpleGrid>
        </Container>
      );

    case 'fullscreen-media':
      return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
            {renderMedia()}
          </div>
          <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', zIndex: 1, width: '90%', maxWidth: '800px' }}>
            <Paper shadow="xl" p="xl" radius="md" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
              {renderContent()}
            </Paper>
          </div>
        </div>
      );

    case 'stacked':
    default:
      return (
        <Container size="md" pt="5rem" pb="xl">
          <Stack gap="xl">
            {renderMedia()}
            {renderContent()}
          </Stack>
        </Container>
      );
  }
}

function MediaRenderer({ block }: { block: MediaBlock }) {
  if (block.mediaType === 'video') {
    return (
      <video src={block.url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    );
  }
  return (
    <Image src={block.url} alt="Media" fit="contain" style={{ width: '100%', height: '100%' }} />
  );
}

function InteractionRenderer({ 
  block, 
  onInteract, 
  localVariables,
  rerollsLeft,
  isContinueDisabled,
  interpolateText,
  interpolateTextNode,
  isLastNode,
  onRestartGame,
  onReturnToLibrary
}: { 
  block: InteractionBlock, 
  onInteract: (block: InteractionBlock, context?: any) => void,
  localVariables?: Record<string, number | string | boolean>,
  rerollsLeft?: number,
  isContinueDisabled?: boolean,
  interpolateText?: (text: string) => string,
  interpolateTextNode?: (text: string) => ReactNode,
  isLastNode?: boolean,
  onRestartGame?: () => void,
  onReturnToLibrary?: () => void
}) {
  
  if (block.interactionType === 'continue') {
    if (isLastNode) {
      return (
        <Group gap="md">
          <Button variant="light" color="orange" onClick={onRestartGame} leftSection={<IconRefresh size={20} />}>
            Restart Game
          </Button>
          <Button color="violet" onClick={onReturnToLibrary} leftSection={<IconHome size={20} />}>
            Return to Library
          </Button>
        </Group>
      );
    }
    const labelNode = interpolateTextNode ? interpolateTextNode(block.label || 'Continue') : (interpolateText ? interpolateText(block.label || 'Continue') : (block.label || 'Continue'));
    return (
      <Button onClick={() => onInteract(block)} disabled={isContinueDisabled}>
        {labelNode}
      </Button>
    );
  }

  if (block.interactionType === 'choice') {
    const selectedChoiceId = localVariables ? localVariables[`choice_${block.id}`] : undefined;
    return (
      <Stack w="100%">
        {block.choices?.map(c => {
          const isSelected = selectedChoiceId === c.id;
          const labelText = interpolateText ? interpolateText(c.label) : c.label;
          const labelNode = interpolateTextNode ? interpolateTextNode(c.label) : labelText;
          return (
            <Button 
              key={c.id} 
              variant={isSelected ? 'filled' : 'outline'} 
              onClick={() => onInteract(block, { choiceId: c.id, choiceLabel: labelText })}
            >
              {labelNode}
            </Button>
          );
        })}
      </Stack>
    );
  }

  if (block.interactionType === 'roll') {
    const rollValue = localVariables ? localVariables[`rollValue_${block.id}`] : undefined;
    const rollOutcome = localVariables ? localVariables[`rollOutcome_${block.id}`] : undefined;
    const hasRolled = rollValue !== undefined;

    if (block.isMappedRoll && block.rollBranches && block.rollBranches.length > 0) {
      const maxRoll = Math.max(...block.rollBranches.map(b => b.max));
      const rolledBranchId = localVariables ? localVariables[`rollBranch_${block.id}`] : undefined;

      const performRoll = (result: number, isReroll: boolean = false) => {
        const branch = block.rollBranches!.find(b => result >= b.min && result <= b.max);
        if (branch) {
          const outcomeLabel = interpolateText ? interpolateText(branch.label) : branch.label;
          onInteract(block, { rollValue: result, rollOutcome: outcomeLabel, rollBranchId: branch.id, isReroll });
        }
      };

      return (
        <Stack align="center" gap="sm" w="100%">
          <Paper withBorder radius="md" style={{ overflow: 'hidden' }} w="100%">
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={100}>Roll</Table.Th>
                  <Table.Th>Outcome</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {block.rollBranches.map(branch => {
                  const isWinningBranch = hasRolled && rolledBranchId === branch.id;
                  const rangeStr = branch.min === branch.max ? `${branch.min}` : `${branch.min}-${branch.max}`;
                  const labelText = interpolateText ? interpolateText(branch.label) : branch.label;
                  const labelNode = interpolateTextNode ? interpolateTextNode(branch.label) : labelText;
                  return (
                    <Table.Tr 
                      key={branch.id} 
                      bg={isWinningBranch ? 'var(--mantine-primary-color-light)' : undefined}
                      style={{ transition: 'background-color 0.3s ease' }}
                    >
                      <Table.Td fw={isWinningBranch ? 700 : undefined} c={isWinningBranch ? 'var(--mantine-primary-color-light-color)' : undefined}>
                        {rangeStr}
                      </Table.Td>
                      <Table.Td fw={isWinningBranch ? 700 : undefined} c={isWinningBranch ? 'var(--mantine-primary-color-light-color)' : undefined}>
                        {labelNode}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>

          <Roller 
            roll={hasRolled ? Number(rollValue) : null}
            setRoll={(val) => performRoll(val, hasRolled)}
            rollFn={() => {
              const maxRange = Math.max(...block.rollBranches!.map(b => b.max));
              return Math.floor(Math.random() * maxRange) + 1;
            }}
            rerolls={rerollsLeft}
            maxRoll={Math.max(...block.rollBranches.map(b => b.max))}
            buttonLabel={interpolateTextNode ? interpolateTextNode(block.label || 'Roll') : (interpolateText ? interpolateText(block.label || 'Roll') : (block.label || 'Roll'))}
          />
        </Stack>
      );
    }

    // Simple Roll
    const maxRoll = block.maxRoll !== undefined ? block.maxRoll : 10;
    return (
      <Stack align="center" gap="xs">
        <Roller 
          roll={hasRolled ? (rollValue as number) : null}
          setRoll={(val) => {
            onInteract(block, { rollValue: val, isReroll: hasRolled });
          }}
          rollFn={() => Math.floor(Math.random() * maxRoll) + 1}
          rerolls={rerollsLeft}
          reroll={() => {}}
          maxRoll={maxRoll}
          buttonLabel={interpolateTextNode ? interpolateTextNode(block.label || 'Roll') : (interpolateText ? interpolateText(block.label || 'Roll') : (block.label || 'Roll'))}
        />
      </Stack>
    );
  }

  return null;
}
