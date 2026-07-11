'use client'
import { Scene, Block, MediaBlock, TextBlock, TaskBlock, InteractionBlock, RerollPolicy, Game } from '@/types/game';
import { Roller } from '@/components/Roller';
import { Container, Grid, Stack, Image, Text, Button, Paper, Group, Center, SimpleGrid, Box, RingProgress, Table, Card, Divider } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useState, useEffect, ReactNode, Fragment } from 'react';
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
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompletedTasks(new Set());
  }, [scene.id]);

  const edges = game?.edges ? game.edges[scene.id] || [] : [];
  const isLastNode = edges.length === 0;

  const ctx: LookupVariableContext = { game, scene, localVariables, globalVariables };
  const interpolateText = (text: string) => interpolateTextHelper(text, ctx);
  const interpolateTextNode = (text: string) => interpolateTextNodeHelper(text, ctx);

  const allTasks: TaskBlock[] = [];
  const allInteractions: InteractionBlock[] = [];
  
  const collectBlocks = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.type === 'task') allTasks.push(b);
      else if (b.type === 'interaction') allInteractions.push(b);
      else if (b.type === 'container') collectBlocks(b.blocks);
    }
  };
  collectBlocks(scene.blocks);

  const allRequiredTasksDone = allTasks.every(t => completedTasks.has(t.id));
  const allRequiredInteractionsDone = allInteractions
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

  const renderBlock = (b: Block): ReactNode => {
    if (b.type === 'media') {
      return <MediaRenderer key={b.id} block={b} />;
    }
    if (b.type === 'text') {
      return <Text key={b.id} size="lg" style={{ whiteSpace: 'pre-wrap' }}>{interpolateTextNode(b.text)}</Text>;
    }
    if (b.type === 'task') {
      return (
        <Center key={b.id}>
          <TaskTimer 
            block={b} 
            onComplete={() => setCompletedTasks(prev => {
              const n = new Set(prev);
              n.add(b.id);
              return n;
            })} 
          />
        </Center>
      );
    }
    if (b.type === 'interaction') {
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
      return (
        <Box key={b.id} w="100%">
          <InteractionRenderer 
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
        </Box>
      );
    }
    if (b.type === 'container') {
      return (
        <Paper 
          key={b.id}
          p="md" 
          radius="md" 
          withBorder={!!b.borderColor} 
          style={{ 
            backgroundColor: b.backgroundColor ? (b.backgroundColor.startsWith('#') ? `${b.backgroundColor}33` : `color-mix(in srgb, var(--mantine-color-${b.backgroundColor}-filled), transparent 80%)`) : 'transparent',
            borderColor: b.borderColor ? (b.borderColor.startsWith('#') ? `${b.borderColor}80` : `color-mix(in srgb, var(--mantine-color-${b.borderColor}-filled), transparent 50%)`) : undefined,
            borderWidth: b.borderColor ? 1 : 0,
            borderStyle: 'solid'
          }}
        >
          <Stack 
            gap="md" 
            align="center"
            style={{ 
              flexDirection: b.direction === 'row' ? 'row' : 'column',
              width: '100%'
            }}
          >
            {b.blocks.map(renderBlock)}
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Container size="md" pt="5rem" pb="xl">
      <Stack gap="xl" w="100%">
        {scene.blocks.map(renderBlock)}
      </Stack>
    </Container>
  );
}

function MediaRenderer({ block }: { block: MediaBlock }) {
  const content = block.mediaType === 'video' ? (
    <video
      src={block.url}
      autoPlay
      loop
      muted
      playsInline
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    />
  ) : (
    <Image
      src={block.url}
      alt="Media"
      radius="md"
      w="auto"
      h="auto"
      maw="100%"
      mah="100%"
    />
  );

  return (
    <Box style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {content}
    </Box>
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
        <Group gap="md" grow w="100%">
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
      <Button fullWidth onClick={() => onInteract(block)} disabled={isContinueDisabled}>
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
