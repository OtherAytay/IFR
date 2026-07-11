import { Handle, Position } from '@xyflow/react';
import { Card, Text, Badge, Group, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Scene } from '../../types/game';
import { useStudioStore } from '../../store/studioStore';

interface SceneNodeProps {
  data: {
    scene: Scene;
  };
  selected: boolean;
}

export function SceneNode({ data, selected }: SceneNodeProps) {
  const { scene } = data;
  const game = useStudioStore(state => state.game);
  
  const outboundEdges = game.edges[scene.id] || [];
  const hasOutboundEdges = outboundEdges.length > 0;
  const hasDefaultEdge = outboundEdges.some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);
  const showMissingDefaultError = hasOutboundEdges && !hasDefaultEdge;

  return (
    <>
      <Card
        shadow="sm"
        p="md"
        radius="md"
        withBorder
        style={{
          width: 250,
          borderColor: selected ? '#228be6' : undefined,
          borderWidth: selected ? 2 : 1,
        }}
      >
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={500} truncate>{scene.name}</Text>
            {scene.sceneMutations.length > 0 && (
              <Badge size="xs" color="violet" variant="light" tt="none">Mutation</Badge>
            )}
          </Group>

          {scene.blocks.length === 0 ? (
            <Text c="dimmed" size="xs">No blocks yet</Text>
          ) : (
            <Stack gap={4}>
              {scene.blocks.map((block) => (
                <Badge 
                  key={block.id} 
                  variant="light" 
                  color={
                    block.type === 'media' ? 'blue' : 
                    block.type === 'task' ? 'red' : 
                    block.type === 'interaction' ? 'green' : 'gray'
                  }
                  fullWidth
                  style={{ textTransform: 'none', justifyContent: 'flex-start' }}
                >
                  {block.type === 'task' && 'durationSeconds' in block 
                    ? `Task: ${block.durationSeconds}s`
                    : block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                </Badge>
              ))}
            </Stack>
          )}

          {showMissingDefaultError && (
            <Group gap="xs" style={{ background: 'var(--mantine-color-red-light)', padding: '6px 8px', borderRadius: 4, marginTop: 4 }} wrap="nowrap">
              <IconAlertCircle size={14} color="var(--mantine-color-red-filled)" style={{ flexShrink: 0 }} />
              <Text size="xs" c="red.9" fw={500} style={{ lineHeight: 1.2 }}>No default branch</Text>
            </Group>
          )}
        </Stack>
        <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
        <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      </Card>
    </>
  );
}
