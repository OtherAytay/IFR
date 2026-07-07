'use client';

import { Paper, Title, Text, Stack, TextInput, Divider, Button, Menu, ActionIcon, Group, NativeSelect, NumberInput, Textarea, Card, ColorInput, Checkbox, Select, Input } from '@mantine/core';
import { IconTrash, IconPlus, IconSettings, IconGripVertical, IconAlertCircle } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useStudioStore } from '../../store/studioStore';
import { Block, LayoutPreset, Edge } from '../../types/game';

function BlockEditor({ sceneId, block, dragHandleProps }: { sceneId: string; block: Block; dragHandleProps?: any }) {
  const { updateBlock, removeBlock } = useStudioStore();

  return (
    <Card withBorder shadow="sm" radius="md" p="sm">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          {dragHandleProps && (
            <div {...dragHandleProps} style={{ display: 'flex', cursor: 'grab' }}>
              <IconGripVertical size={16} color="gray" />
            </div>
          )}
          <Text size="sm" fw={600} style={{ textTransform: 'capitalize' }}>
            {block.type} Block
          </Text>
        </Group>
        <Group gap={4}>
          <ActionIcon size="sm" variant="default" onClick={() => {
            const scene = useStudioStore.getState().game.scenes[sceneId];
            const idx = scene.blocks.findIndex(b => b.id === block.id);
            if (idx > 0) {
              const newBlocks = [...scene.blocks];
              [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
              useStudioStore.getState().updateScene(sceneId, { blocks: newBlocks });
            }
          }}>↑</ActionIcon>
          <ActionIcon size="sm" variant="default" onClick={() => {
            const scene = useStudioStore.getState().game.scenes[sceneId];
            const idx = scene.blocks.findIndex(b => b.id === block.id);
            if (idx < scene.blocks.length - 1) {
              const newBlocks = [...scene.blocks];
              [newBlocks[idx + 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx + 1]];
              useStudioStore.getState().updateScene(sceneId, { blocks: newBlocks });
            }
          }}>↓</ActionIcon>
          <ActionIcon color="red" variant="subtle" onClick={() => removeBlock(sceneId, block.id)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {block.type === 'media' && (
        <Stack gap="xs">
          <NativeSelect 
            size="xs"
            label="Media Type"
            value={block.mediaType}
            data={['image', 'video', 'audio']}
            onChange={(e) => updateBlock(sceneId, block.id, { mediaType: e.currentTarget.value })}
          />
          <TextInput 
            size="xs"
            label="URL or Base64"
            value={block.url}
            onChange={(e) => updateBlock(sceneId, block.id, { url: e.currentTarget.value })}
          />
        </Stack>
      )}

      {block.type === 'text' && (
        <Textarea 
          size="xs"
          label="Text Content (Supports ${{var}} templating)"
          value={block.text}
          autosize
          minRows={2}
          onChange={(e) => updateBlock(sceneId, block.id, { text: e.currentTarget.value })}
        />
      )}

      {block.type === 'task' && (
        <Stack gap="xs">
          <NumberInput 
            size="xs"
            label="Duration (Seconds)"
            value={block.durationSeconds}
            onChange={(val) => updateBlock(sceneId, block.id, { durationSeconds: Number(val) || 0 })}
          />
          <NumberInput 
            size="xs"
            label="BPM (Optional Metronome)"
            value={block.bpm || ''}
            onChange={(val) => updateBlock(sceneId, block.id, { bpm: val === '' ? undefined : Number(val) })}
          />
        </Stack>
      )}

      {block.type === 'interaction' && (
        <Stack gap="xs">
          <NativeSelect 
            size="xs"
            label="Interaction Type"
            value={block.interactionType}
            data={['continue', 'choice', 'roll']}
            onChange={(e) => updateBlock(sceneId, block.id, { interactionType: e.currentTarget.value })}
          />
          {(block.interactionType === 'continue' || block.interactionType === 'roll') && (
            <TextInput 
              size="xs"
              label="Button Label"
              value={block.label || ''}
              onChange={(e) => updateBlock(sceneId, block.id, { label: e.currentTarget.value })}
            />
          )}
          {block.interactionType === 'choice' && (
            <Stack gap="xs">
              <Text size="xs" fw={500}>Choices</Text>
              {(block.choices || []).map((choice, idx) => (
                <Group key={choice.id} gap="xs" wrap="nowrap">
                  <TextInput 
                    size="xs"
                    value={choice.label}
                    style={{ flex: 1 }}
                    onChange={(e) => {
                      const newChoices = [...(block.choices || [])];
                      newChoices[idx] = { ...choice, label: e.currentTarget.value };
                      updateBlock(sceneId, block.id, { choices: newChoices });
                    }}
                  />
                  <ActionIcon size="sm" color="red" variant="subtle" onClick={() => {
                    const newChoices = (block.choices || []).filter(c => c.id !== choice.id);
                    updateBlock(sceneId, block.id, { choices: newChoices });
                  }}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}
              <Button size="xs" variant="light" onClick={() => {
                const newChoices = [...(block.choices || []), { id: crypto.randomUUID(), label: 'New Choice' }];
                updateBlock(sceneId, block.id, { choices: newChoices });
              }}>
                Add Choice
              </Button>
            </Stack>
          )}
        </Stack>
      )}
    </Card>
  );
}

function SceneInspector({ sceneId }: { sceneId: string }) {
  const { game, updateScene, addBlock, setGame } = useStudioStore();
  const scene = game.scenes[sceneId];
  if (!scene) return null;

  // Auto-detect incoming variables
  const incomingVars = new Map<string, {sourceScene: string, name: string}>();
  Object.values(game.edges).flat().forEach(edge => {
    if (edge.targetSceneId === scene.id) {
      const sourceScene = game.scenes[edge.sourceSceneId];
      if (!sourceScene) return;
      
      if (edge.inheritAllLocals || sourceScene.inheritAllLocals) {
        (sourceScene.localVariables || []).forEach(v => incomingVars.set(v.id, { sourceScene: sourceScene.name, name: v.name }));
      }
      (sourceScene.sceneVariableMappings || []).forEach(m => incomingVars.set(m.targetId, { sourceScene: sourceScene.name, name: m.targetId }));
      (edge.edgeVariableMappings || []).forEach(m => incomingVars.set(m.targetId, { sourceScene: sourceScene.name, name: m.targetId }));
    }
  });

  const availableLocalsOptions = [
    ...(scene.localVariables || []).map(v => ({ value: v.id, label: v.name })),
    ...Array.from(incomingVars.entries()).map(([id, data]) => ({ value: id, label: `${data.name} (from ${data.sourceScene})` }))
  ];
  // Deduplicate options by value
  const uniqueAvailableLocalsOptions = availableLocalsOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    if (result.type === 'blocks') {
      const newBlocks = Array.from(scene.blocks);
      const [moved] = newBlocks.splice(result.source.index, 1);
      newBlocks.splice(result.destination.index, 0, moved);
      updateScene(scene.id, { blocks: newBlocks });
    }
    
    if (result.type === 'edges') {
      const edges = [...(game.edges[scene.id] || [])].sort((a, b) => a.priority - b.priority);
      const newEdges = Array.from(edges);
      const [moved] = newEdges.splice(result.source.index, 1);
      newEdges.splice(result.destination.index, 0, moved);
      
      newEdges.forEach((edge, index) => {
        edge.priority = index;
      });
      
      setGame({
        ...game,
        edges: { ...game.edges, [scene.id]: newEdges }
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Stack>
        <Group justify="space-between">
          <Title order={4}>Scene</Title>
          <ActionIcon 
            color="red" 
            variant="subtle" 
            size="sm" 
            onClick={() => {
              if (confirm(`Are you sure you want to delete the scene "${scene.name}"?`)) {
                useStudioStore.getState().deleteScene(scene.id);
              }
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      <TextInput 
        label="Scene Name" 
        value={scene.name} 
        onChange={(e) => updateScene(scene.id, { name: e.currentTarget.value })} 
      />
      <NativeSelect 
        label="Layout Preset"
        value={scene.layoutPreset}
        data={[
          { value: 'standard-split', label: 'Standard Split' },
          { value: 'grid', label: 'Grid' },
          { value: 'fullscreen-media', label: 'Fullscreen Media' },
          { value: 'stacked', label: 'Stacked' },
        ]}
        onChange={(e) => updateScene(scene.id, { layoutPreset: e.currentTarget.value as LayoutPreset })}
      />
      
      <Divider />
      <Group justify="space-between">
        <Title order={5}>Local Variables</Title>
        <Button size="xs" variant="light" onClick={() => {
          updateScene(scene.id, { 
            localVariables: [...(scene.localVariables || []), { id: crypto.randomUUID(), name: 'newVar', type: 'number', defaultValue: 0 }] 
          });
        }}>Add Variable</Button>
      </Group>

      {(() => {
        return (
          <Stack gap="xs">
            {incomingVars.size > 0 && (
              <Text size="xs" c="blue" fw={500}>Detected incoming variables: {Array.from(incomingVars.values()).map(v => v.name).join(', ')}</Text>
            )}
            {(scene.localVariables || []).map((variable, idx) => {
              const isIncoming = incomingVars.has(variable.id) || Array.from(incomingVars.values()).some(v => v.name === variable.name);
              return (
                <Card key={variable.id} p="xs" withBorder style={{ borderColor: isIncoming ? 'var(--mantine-color-blue-4)' : undefined }}>
                  <Group gap="xs" wrap="nowrap" align="flex-end">
                    <TextInput
                      size="xs"
                      label={isIncoming ? "Name (Incoming ⚡)" : "Name"}
                      value={variable.name}
                      onChange={(e) => {
                        const newVars = [...scene.localVariables];
                        newVars[idx] = { ...variable, name: e.currentTarget.value };
                        updateScene(scene.id, { localVariables: newVars });
                      }}
                      style={{ flex: 1 }}
                    />
                    <NativeSelect
                      size="xs"
                      label="Type"
                      data={['number', 'boolean', 'string']}
                      value={variable.type}
                      onChange={(e) => {
                        const newVars = [...scene.localVariables];
                        const type = e.currentTarget.value as any;
                        let defaultValue: any = 0;
                        if (type === 'boolean') defaultValue = false;
                        if (type === 'string') defaultValue = '';
                        newVars[idx] = { ...variable, type, defaultValue };
                        updateScene(scene.id, { localVariables: newVars });
                      }}
                      style={{ width: 90 }}
                    />
                    {variable.type === 'boolean' ? (
                      <Input.Wrapper size="xs" label="Default Value" style={{ width: 80 }}>
                        <div style={{ height: 30, display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            size="xs"
                            radius="sm"
                            checked={variable.defaultValue as boolean}
                            onChange={(e) => {
                              const newVars = [...scene.localVariables];
                              newVars[idx] = { ...variable, defaultValue: e.currentTarget.checked };
                              updateScene(scene.id, { localVariables: newVars });
                            }}
                          />
                        </div>
                      </Input.Wrapper>
                    ) : (
                      <TextInput
                        size="xs"
                        label="Default Value"
                        value={String(variable.defaultValue)}
                        onChange={(e) => {
                          const newVars = [...scene.localVariables];
                          let val: any = e.currentTarget.value;
                          if (variable.type === 'number') val = Number(val) || 0;
                          newVars[idx] = { ...variable, defaultValue: val };
                          updateScene(scene.id, { localVariables: newVars });
                        }}
                        style={{ width: 80 }}
                      />
                    )}
                    <ActionIcon size="sm" color="red" variant="subtle" mb={4} onClick={() => {
                      updateScene(scene.id, { localVariables: scene.localVariables.filter(v => v.id !== variable.id) });
                    }}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        );
      })()}
      
      <Divider />
      <Group justify="space-between">
        <Title order={5}>Blocks</Title>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="light" color="blue"><IconPlus size={16} /></ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => addBlock(scene.id, 'media')}>Media Block</Menu.Item>
            <Menu.Item onClick={() => addBlock(scene.id, 'text')}>Text Block</Menu.Item>
            <Menu.Item onClick={() => addBlock(scene.id, 'task')}>Task Block</Menu.Item>
            <Menu.Item onClick={() => addBlock(scene.id, 'interaction')}>Interaction Block</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {scene.blocks.length === 0 ? (
        <Text size="sm" c="dimmed">No blocks yet. Add one to get started.</Text>
      ) : (
        <Droppable droppableId="blocks" type="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Stack gap="md">
                {scene.blocks.map((block, idx) => (
                  <Draggable key={block.id} draggableId={block.id} index={idx}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <BlockEditor sceneId={scene.id} block={block} dragHandleProps={provided.dragHandleProps} />
                      </div>
                    )}
                  </Draggable>
                ))}
              </Stack>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      <Divider mt="md" />
      <Title order={5}>Outbound Edges</Title>
      
      {(() => {
        const allEdges = game.edges[scene.id] || [];
        const hasOutboundEdges = allEdges.length > 0;
        const hasDefaultEdge = allEdges.some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);
        const showMissingDefaultError = hasOutboundEdges && !hasDefaultEdge;
        
        return showMissingDefaultError ? (
          <Group gap="xs" style={{ background: 'var(--mantine-color-red-light)', padding: '8px 10px', borderRadius: 6 }} wrap="nowrap">
            <IconAlertCircle size={16} color="var(--mantine-color-red-filled)" style={{ flexShrink: 0 }} />
            <Text size="xs" c="red.9" fw={500} style={{ lineHeight: 1.3 }}>
              No default branch
            </Text>
          </Group>
        ) : (
          <Text size="xs" c="dimmed">Adjust evaluation priority (top is evaluated first)</Text>
        );
      })()}

      {(!game.edges[scene.id] || game.edges[scene.id].length === 0) ? (
        <Text size="sm" c="dimmed">No outbound edges.</Text>
      ) : (
        <Stack gap="xs">
          {(() => {
            const allEdges = game.edges[scene.id] || [];
            const defaultEdge = allEdges.find(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);
            const conditionalEdges = allEdges.filter(e => e !== defaultEdge).sort((a, b) => a.priority - b.priority);

            return (
              <>
                <Droppable droppableId="edges" type="edges">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <Stack gap="xs">
                        {conditionalEdges.map((edge, idx, arr) => (
                          <Draggable key={edge.id} draggableId={edge.id} index={idx}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <Card withBorder shadow="sm" radius="md" p="sm">
                                  <Group justify="space-between" wrap="nowrap">
                                    <Group gap="xs" style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
                                      <div {...provided.dragHandleProps} style={{ display: 'flex', cursor: 'grab' }}>
                                        <IconGripVertical size={16} color="gray" />
                                      </div>
                                      <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>
                                        <Text size="sm" fw={500} truncate>{edge.name || `Edge ${idx + 1}`}</Text>
                                        <Text size="xs" c="dimmed" truncate>To: {game.scenes[edge.targetSceneId]?.name || 'Unknown'}</Text>
                                      </Stack>
                                    </Group>
                                    <Group gap={4} wrap="nowrap">
                                      <Text size="xs" c="dimmed" mr="xs">{edge.conditionGroup?.conditions.length || 0} conditions</Text>
                                      <ActionIcon size="sm" variant="default" onClick={() => {
                                        if (idx > 0) {
                                          const newEdges = [...game.edges[scene.id]];
                                          const currentEdge = newEdges.find(e => e.id === edge.id)!;
                                          const edgeAbove = newEdges.find(e => e.id === arr[idx - 1].id)!;
                                          const tempPriority = currentEdge.priority;
                                          currentEdge.priority = edgeAbove.priority;
                                          edgeAbove.priority = tempPriority;
                                          useStudioStore.getState().setGame({
                                            ...game,
                                            edges: { ...game.edges, [scene.id]: newEdges }
                                          });
                                        }
                                      }}>↑</ActionIcon>
                                      <ActionIcon size="sm" variant="default" onClick={() => {
                                        if (idx < arr.length - 1) {
                                          const newEdges = [...game.edges[scene.id]];
                                          const currentEdge = newEdges.find(e => e.id === edge.id)!;
                                          const edgeBelow = newEdges.find(e => e.id === arr[idx + 1].id)!;
                                          const tempPriority = currentEdge.priority;
                                          currentEdge.priority = edgeBelow.priority;
                                          edgeBelow.priority = tempPriority;
                                          useStudioStore.getState().setGame({
                                            ...game,
                                            edges: { ...game.edges, [scene.id]: newEdges }
                                          });
                                        }
                                      }}>↓</ActionIcon>
                                      <ActionIcon color="red" variant="subtle" size="sm" onClick={() => {
                                        useStudioStore.getState().deleteEdge(scene.id, edge.id);
                                      }}>
                                        <IconTrash size={14} />
                                      </ActionIcon>
                                    </Group>
                                  </Group>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </Stack>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                
                {defaultEdge && (
                  <Card withBorder shadow="sm" radius="md" p="sm" bg="var(--mantine-color-gray-light)">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
                        <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>
                          <Text size="sm" fw={500} truncate>{defaultEdge.name || 'Default Edge'}</Text>
                          <Text size="xs" c="dimmed" truncate>To: {game.scenes[defaultEdge.targetSceneId]?.name || 'Unknown'}</Text>
                        </Stack>
                      </Group>
                      <Group gap={4} wrap="nowrap">
                        <Text size="xs" c="dimmed" mr="xs">0 conditions</Text>
                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => {
                          useStudioStore.getState().deleteEdge(scene.id, defaultEdge.id);
                        }}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                )}
              </>
            );
          })()}
        </Stack>
      )}

      <Divider mt="md" />
      <Group justify="space-between">
        <Title order={5}>Scene Payload Mapping</Title>
        <Button size="xs" variant="light" disabled={scene.inheritAllLocals} onClick={() => {
          updateScene(scene.id, { 
            sceneVariableMappings: [...(scene.sceneVariableMappings || []), { sourceId: 'sourceVar', targetId: 'targetVar' }] 
          });
        }}>Add Mapping</Button>
      </Group>
      <Checkbox
        size="xs"
        label="Inherit All Local Variables"
        description="Automatically pass all local variables to the next scene"
        checked={scene.inheritAllLocals || false}
        onChange={(e) => updateScene(scene.id, { inheritAllLocals: e.currentTarget.checked })}
      />
      {!scene.inheritAllLocals && (scene.sceneVariableMappings || []).map((mapping, idx) => (
        <Group key={idx} gap="xs" wrap="nowrap" align="center">
          <Select
            size="xs"
            placeholder="Source Var ID"
            searchable
            data={uniqueAvailableLocalsOptions}
            value={mapping.sourceId}
            onChange={(val) => {
              const newMap = [...(scene.sceneVariableMappings || [])];
              newMap[idx] = { ...mapping, sourceId: val || '' };
              updateScene(scene.id, { sceneVariableMappings: newMap });
            }}
            style={{ flex: 1 }}
          />
          <Text size="sm" c="dimmed">→</Text>
          <TextInput
            size="xs"
            placeholder="Target Var ID"
            value={mapping.targetId}
            onChange={(e) => {
              const newMap = [...(scene.sceneVariableMappings || [])];
              newMap[idx] = { ...mapping, targetId: e.currentTarget.value };
              updateScene(scene.id, { sceneVariableMappings: newMap });
            }}
            style={{ flex: 1 }}
          />
          <ActionIcon size="sm" color="red" variant="subtle" onClick={() => {
            updateScene(scene.id, { sceneVariableMappings: (scene.sceneVariableMappings || []).filter((_, i) => i !== idx) });
          }}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      ))}

      <Divider mt="md" />
      <Group justify="space-between">
        <Title order={5}>Scene Mutations</Title>
        <Button size="xs" variant="light" color="teal" onClick={() => {
          const newMutations = [...(scene.sceneMutations || []), { id: crypto.randomUUID(), operation: 'set', targetId: 'newVar', value: true }];
          updateScene(scene.id, { sceneMutations: newMutations as any });
        }}>
          Add Mutation
        </Button>
      </Group>

      {(!scene.sceneMutations || scene.sceneMutations.length === 0) ? (
        <Text size="sm" c="dimmed">No scene mutations.</Text>
      ) : (
        <Stack gap="sm">
          {scene.sceneMutations.map((mut: any, idx: number) => (
            <Card key={mut.id} withBorder shadow="sm" radius="md" p="sm">
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={600}>Mutation {idx + 1}</Text>
                <ActionIcon color="red" variant="subtle" size="sm" onClick={() => {
                  const newMutations = scene.sceneMutations.filter(m => m.id !== mut.id);
                  updateScene(scene.id, { sceneMutations: newMutations });
                }}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
              <Stack gap="xs">
                <NativeSelect
                  size="xs"
                  data={[
                    { value: 'set', label: 'Set variable' },
                    { value: 'add_tag', label: 'Add tag' },
                    { value: 'remove_tag', label: 'Remove tag' }
                  ]}
                  value={mut.operation}
                  onChange={(e) => {
                    const newMutations = [...scene.sceneMutations];
                    newMutations[idx] = { ...mut, operation: e.currentTarget.value as any };
                    updateScene(scene.id, { sceneMutations: newMutations });
                  }}
                />
                <TextInput
                  size="xs"
                  placeholder="Target name"
                  value={mut.targetId}
                  onChange={(e) => {
                    const newMutations = [...scene.sceneMutations];
                    newMutations[idx] = { ...mut, targetId: e.currentTarget.value };
                    updateScene(scene.id, { sceneMutations: newMutations });
                  }}
                />
                {(mut.operation === 'set') && (
                  <TextInput
                    size="xs"
                    placeholder="Value"
                    value={String(mut.value || '')}
                    onChange={(e) => {
                      const newMutations = [...scene.sceneMutations];
                      let val: any = e.currentTarget.value;
                      if (val === 'true') val = true;
                      if (val === 'false') val = false;
                      if (!isNaN(Number(val)) && val !== '') val = Number(val);
                      newMutations[idx] = { ...mut, value: val };
                      updateScene(scene.id, { sceneMutations: newMutations });
                    }}
                  />
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

    </Stack>
    </DragDropContext>
  );
}


function EdgeInspector({ edgeId }: { edgeId: string }) {
  const { game, updateEdge, deleteEdge, setSelectedEdge } = useStudioStore();
  
  // Find the edge
  let edge: Edge | null = null;
  let sourceId = '';
  for (const [src, edges] of Object.entries(game.edges)) {
    const found = edges.find(e => e.id === edgeId);
    if (found) {
      edge = found;
      sourceId = src;
      break;
    }
  }

  if (!edge) return null;

  const isDefaultBranch = !edge.conditionGroup || edge.conditionGroup.conditions.length === 0;

  // Auto-detect incoming variables for the source scene
  const incomingVars = new Map<string, {sourceScene: string, name: string}>();
  const sourceScene = game.scenes[sourceId];
  if (sourceScene) {
    Object.values(game.edges).flat().forEach(e => {
      if (e.targetSceneId === sourceId) {
        const prevScene = game.scenes[e.sourceSceneId];
        if (!prevScene) return;
        
        if (e.inheritAllLocals || prevScene.inheritAllLocals) {
          (prevScene.localVariables || []).forEach(v => incomingVars.set(v.id, { sourceScene: prevScene.name, name: v.name }));
        }
        (prevScene.sceneVariableMappings || []).forEach(m => incomingVars.set(m.targetId, { sourceScene: prevScene.name, name: m.targetId }));
        (e.edgeVariableMappings || []).forEach(m => incomingVars.set(m.targetId, { sourceScene: prevScene.name, name: m.targetId }));
      }
    });
  }

  const availableLocalsOptions = [
    ...(sourceScene?.localVariables || []).map(v => ({ value: v.id, label: v.name })),
    ...Array.from(incomingVars.entries()).map(([id, data]) => ({ value: id, label: `${data.name} (from ${data.sourceScene})` }))
  ];
  const uniqueAvailableLocalsOptions = availableLocalsOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Edge Inspector</Title>
        <ActionIcon color="red" variant="subtle" onClick={() => {
          deleteEdge(sourceId, edgeId);
          setSelectedEdge(null);
        }}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
      
      <TextInput 
        label="Edge Name" 
        placeholder="e.g. Success Path"
        value={edge.name || ''} 
        onChange={(e) => updateEdge(sourceId, edgeId, { name: e.currentTarget.value })} 
      />

      <Text size="sm" c="dimmed">Source: {game.scenes[edge.sourceSceneId]?.name || 'Unknown'}</Text>
      <Text size="sm" c="dimmed">Target: {game.scenes[edge.targetSceneId]?.name || 'Unknown'}</Text>
      
      <Divider />
      <Group justify="space-between">
        <Title order={5}>Conditions</Title>
        <Group gap="xs">
          {edge.conditionGroup && edge.conditionGroup.conditions.length > 1 && (
            <Button size="xs" variant="default" onClick={() => {
              updateEdge(sourceId, edgeId, { 
                conditionGroup: { 
                  ...edge!.conditionGroup!, 
                  logicalOperator: edge!.conditionGroup!.logicalOperator === 'AND' ? 'OR' : 'AND' 
                } 
              });
            }}>
              {edge.conditionGroup.logicalOperator}
            </Button>
          )}
          <Button size="xs" variant="light" onClick={() => {
            const newConditions = [...(edge!.conditionGroup?.conditions || []), { id: crypto.randomUUID(), targetId: 'newVar', operator: '==', value: true }];
            updateEdge(sourceId, edgeId, { conditionGroup: { logicalOperator: edge!.conditionGroup?.logicalOperator || 'AND', conditions: newConditions as any } });
          }}>
            Add Condition
          </Button>
        </Group>
      </Group>

      {isDefaultBranch ? (
        <Card withBorder shadow="sm" radius="md" p="sm" bg="var(--mantine-color-gray-light)">
          <Text size="sm" fw={500} ta="center">Default Branch</Text>
          <Text size="xs" c="dimmed" ta="center" mt={4}>This edge will be taken if no other edge conditions are met.</Text>
        </Card>
      ) : (
        <DragDropContext onDragEnd={(result) => {
          if (!result.destination) return;
          const newConditions = Array.from(edge!.conditionGroup!.conditions);
          const [moved] = newConditions.splice(result.source.index, 1);
          newConditions.splice(result.destination.index, 0, moved);
          updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
        }}>
          <Droppable droppableId="conditions" type="conditions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Stack gap="sm">
                  {edge.conditionGroup!.conditions.map((cond, idx) => (
                    <Draggable key={cond.id} draggableId={cond.id} index={idx}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                          <Card withBorder shadow="sm" radius="md" p="sm">
                            <Group justify="space-between" mb="xs">
                              <Group gap="xs">
                                <div {...provided.dragHandleProps} style={{ display: 'flex', cursor: 'grab' }}>
                                  <IconGripVertical size={16} color="gray" />
                                </div>
                                <Text size="xs" fw={600}>Condition {idx + 1}</Text>
                              </Group>
                              <Group gap={4}>
                                <ActionIcon size="sm" variant="default" onClick={() => {
                                  if (idx > 0) {
                                    const newConditions = [...edge!.conditionGroup!.conditions];
                                    [newConditions[idx - 1], newConditions[idx]] = [newConditions[idx], newConditions[idx - 1]];
                                    updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                                  }
                                }}>↑</ActionIcon>
                                <ActionIcon size="sm" variant="default" onClick={() => {
                                  if (idx < edge!.conditionGroup!.conditions.length - 1) {
                                    const newConditions = [...edge!.conditionGroup!.conditions];
                                    [newConditions[idx + 1], newConditions[idx]] = [newConditions[idx], newConditions[idx + 1]];
                                    updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                                  }
                                }}>↓</ActionIcon>
                                <ActionIcon 
                                  color="red" 
                                  variant="subtle" 
                                  size="sm" 
                                  disabled={edge!.conditionGroup!.conditions.length <= 1 && (() => {
                                    const allEdges = game.edges[sourceId] || [];
                                    return allEdges.some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);
                                  })()}
                                  onClick={() => {
                                    const newConditions = edge!.conditionGroup!.conditions.filter(c => c.id !== cond.id);
                                    updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                                  }}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Group>
                            <Stack gap="xs">
                              <Group grow gap="xs">
                                <TextInput
                                  size="xs"
                                  placeholder="Target Variable/Tag ID"
                                  value={cond.targetId}
                                  onChange={(e) => {
                                    const newConditions = [...edge!.conditionGroup!.conditions];
                                    newConditions[idx] = { ...cond, targetId: e.currentTarget.value };
                                    updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                                  }}
                                />
                              </Group>
                              <Group grow gap="xs">
                                <NativeSelect
                                  size="xs"
                                  data={[
                                    { value: '==', label: '==' },
                                    { value: '!=', label: '!=' },
                                    { value: '>', label: '>' },
                                    { value: '<', label: '<' },
                                    { value: '>=', label: '>=' },
                                    { value: '<=', label: '<=' },
                                    { value: 'has_tag', label: 'Has Tag' },
                                    { value: 'missing_tag', label: 'Missing Tag' }
                                  ]}
                                  value={cond.operator}
                                  onChange={(e) => {
                                    const newConditions = [...edge!.conditionGroup!.conditions];
                                    newConditions[idx] = { ...cond, operator: e.currentTarget.value as any };
                                    updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                                  }}
                                />
                                {cond.operator !== 'has_tag' && cond.operator !== 'missing_tag' && (
                                  <TextInput
                                    size="xs"
                                    placeholder="Value"
                                    value={String(cond.value)}
                                    onChange={(e) => {
                                      const newConditions = [...edge!.conditionGroup!.conditions];
                                      let val: any = e.currentTarget.value;
                                      if (val === 'true') val = true;
                                      if (val === 'false') val = false;
                                      if (!isNaN(Number(val)) && val !== '') val = Number(val);
                                      newConditions[idx] = { ...cond, value: val };
                                      updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                                    }}
                                  />
                                )}
                              </Group>
                            </Stack>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </Stack>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Divider mt="md" />
      <Group justify="space-between">
        <Title order={5}>Mutations</Title>
        <Button size="xs" variant="light" color="teal" onClick={() => {
          const newMutations = [...(edge.edgeMutations || []), { id: crypto.randomUUID(), operation: 'set', targetId: 'newVar', value: true }];
          updateEdge(sourceId, edgeId, { edgeMutations: newMutations as any });
        }}>
          Add Mutation
        </Button>
      </Group>

      {(!edge.edgeMutations || edge.edgeMutations.length === 0) ? (
        <Text size="sm" c="dimmed">No mutations.</Text>
      ) : (
        <Stack gap="sm">
          {edge.edgeMutations.map((mut, idx) => (
            <Card key={mut.id} withBorder shadow="sm" radius="md" p="sm">
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={600}>Mutation {idx + 1}</Text>
                <ActionIcon color="red" variant="subtle" size="sm" onClick={() => {
                  const newMutations = edge!.edgeMutations!.filter(m => m.id !== mut.id);
                  updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
                }}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
              <Stack gap="xs">
                <NativeSelect
                  size="xs"
                  data={[
                    { value: 'set', label: 'Set variable' },
                    { value: 'add_tag', label: 'Add tag' },
                    { value: 'remove_tag', label: 'Remove tag' }
                  ]}
                  value={mut.operation}
                  onChange={(e) => {
                    const newMutations = [...edge!.edgeMutations!];
                    newMutations[idx] = { ...mut, operation: e.currentTarget.value as any };
                    updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
                  }}
                />
                <TextInput
                  size="xs"
                  placeholder="Target name"
                  value={mut.targetId}
                  onChange={(e) => {
                    const newMutations = [...edge!.edgeMutations!];
                    newMutations[idx] = { ...mut, targetId: e.currentTarget.value };
                    updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
                  }}
                />
                {(mut.operation === 'set') && (
                  <TextInput
                    size="xs"
                    placeholder="Value"
                    value={String(mut.value || '')}
                    onChange={(e) => {
                      const newMutations = [...edge!.edgeMutations!];
                      let val: any = e.currentTarget.value;
                      if (val === 'true') val = true;
                      if (val === 'false') val = false;
                      if (!isNaN(Number(val)) && val !== '') val = Number(val);
                      newMutations[idx] = { ...mut, value: val };
                      updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
                    }}
                  />
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Divider mt="md" />
      <Group justify="space-between">
        <Title order={5}>Edge Payload Mapping</Title>
        <Button size="xs" variant="light" disabled={edge.inheritAllLocals} onClick={() => {
          updateEdge(sourceId, edgeId, { 
            edgeVariableMappings: [...(edge?.edgeVariableMappings || []), { sourceId: 'sourceVar', targetId: 'targetVar' }] 
          });
        }}>Add Mapping</Button>
      </Group>
      <Checkbox
        size="xs"
        label="Inherit All Local Variables"
        description="Automatically pass all local variables when this edge is taken"
        checked={edge.inheritAllLocals || false}
        onChange={(e) => updateEdge(sourceId, edgeId, { inheritAllLocals: e.currentTarget.checked })}
      />
      {!edge.inheritAllLocals && (edge.edgeVariableMappings || []).map((mapping, idx) => (
        <Group key={idx} gap="xs" wrap="nowrap" align="center">
          <Select
            size="xs"
            placeholder="Source Var ID"
            searchable
            data={uniqueAvailableLocalsOptions}
            value={mapping.sourceId}
            onChange={(val) => {
              const newMap = [...(edge?.edgeVariableMappings || [])];
              newMap[idx] = { ...mapping, sourceId: val || '' };
              updateEdge(sourceId, edgeId, { edgeVariableMappings: newMap });
            }}
            style={{ flex: 1 }}
          />
          <Text size="sm" c="dimmed">→</Text>
          <TextInput
            size="xs"
            placeholder="Target Var ID"
            value={mapping.targetId}
            onChange={(e) => {
              const newMap = [...(edge?.edgeVariableMappings || [])];
              newMap[idx] = { ...mapping, targetId: e.currentTarget.value };
              updateEdge(sourceId, edgeId, { edgeVariableMappings: newMap });
            }}
            style={{ flex: 1 }}
          />
          <ActionIcon size="sm" color="red" variant="subtle" onClick={() => {
            updateEdge(sourceId, edgeId, { edgeVariableMappings: (edge?.edgeVariableMappings || []).filter((_, i) => i !== idx) });
          }}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      ))}

    </Stack>
  );
}

export function Inspector() {
  const { game, selectedNodeId, selectedEdgeId, setGame } = useStudioStore();

  if (selectedNodeId) {
    const scene = game.scenes[selectedNodeId];
    if (!scene) return null;

    return (
      <Paper p="md" style={{ width: 350, height: '100%', overflowY: 'auto', borderLeft: '1px solid var(--mantine-color-default-border)' }}>
        <SceneInspector sceneId={selectedNodeId} />
      </Paper>
    );
  }

  if (selectedEdgeId) {
    return (
      <Paper p="md" style={{ width: 350, height: '100%', overflowY: 'auto', borderLeft: '1px solid var(--mantine-color-default-border)' }}>
        <EdgeInspector edgeId={selectedEdgeId} />
      </Paper>
    );
  }

  const hasIntegrityError = Object.values(game.scenes).some(scene => {
    const allEdges = game.edges[scene.id] || [];
    const hasOutboundEdges = allEdges.length > 0;
    const hasDefaultEdge = allEdges.some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);
    return hasOutboundEdges && !hasDefaultEdge;
  });

  return (
    <Paper p="md" style={{ width: 350, height: '100%', overflowY: 'auto', borderLeft: '1px solid var(--mantine-color-default-border)' }}>
      <Stack>
        <Group align="center">
          <IconSettings size={20} />
          <Title order={4}>Global Settings</Title>
        </Group>
        <TextInput 
          label="Game Title" 
          value={game.title}
          onChange={(e) => setGame({ ...game, title: e.currentTarget.value })}
        />
        <TextInput 
          label="Game Version" 
          value={game.version}
          onChange={(e) => setGame({ ...game, version: e.currentTarget.value })}
        />
        
        <Divider />

        <Title order={5}>Global Variables</Title>
        <Stack gap="xs">
          {game.globalVariables.map((variable, idx) => (
            <Card key={variable.id} p="xs" withBorder>
              <Group gap="xs" wrap="nowrap" align="flex-end">
                <TextInput
                  size="xs"
                  label="Name"
                  value={variable.name}
                  onChange={(e) => {
                    const newVars = [...game.globalVariables];
                    newVars[idx] = { ...variable, name: e.currentTarget.value };
                    setGame({ ...game, globalVariables: newVars });
                  }}
                  style={{ flex: 1 }}
                />
                <NativeSelect
                  size="xs"
                  label="Type"
                  data={['number', 'boolean', 'string']}
                  value={variable.type || typeof variable.defaultValue}
                  onChange={(e) => {
                    const newVars = [...game.globalVariables];
                    const type = e.currentTarget.value as any;
                    let defaultValue: any = 0;
                    if (type === 'boolean') defaultValue = false;
                    if (type === 'string') defaultValue = '';
                    newVars[idx] = { ...variable, type, defaultValue };
                    setGame({ ...game, globalVariables: newVars });
                  }}
                  style={{ width: 90 }}
                />
                {variable.type === 'boolean' ? (
                  <Input.Wrapper size="xs" label="Default Value" style={{ width: 80 }}>
                    <div style={{ height: 30, display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        size="xs"
                        radius="sm"
                        checked={variable.defaultValue as boolean}
                        onChange={(e) => {
                          const newVars = [...game.globalVariables];
                          newVars[idx] = { ...variable, defaultValue: e.currentTarget.checked };
                          setGame({ ...game, globalVariables: newVars });
                        }}
                      />
                    </div>
                  </Input.Wrapper>
                ) : (
                  <TextInput
                    size="xs"
                    label="Default Value"
                    value={String(variable.defaultValue)}
                    onChange={(e) => {
                      const newVars = [...game.globalVariables];
                      let val: any = e.currentTarget.value;
                      if (variable.type === 'number') val = Number(val) || 0;
                      newVars[idx] = { ...variable, defaultValue: val };
                      setGame({ ...game, globalVariables: newVars });
                    }}
                    style={{ width: 80 }}
                  />
                )}
                <ActionIcon size="sm" color="red" variant="subtle" mb={4} onClick={() => {
                  setGame({ ...game, globalVariables: game.globalVariables.filter(v => v.id !== variable.id) });
                }}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
          <Button size="xs" variant="light" onClick={() => {
            setGame({ 
              ...game, 
              globalVariables: [...game.globalVariables, { id: crypto.randomUUID(), name: 'newVar', type: 'number', defaultValue: 0 }] 
            });
          }}>
            Add Variable
          </Button>
        </Stack>

        <Divider />

        <Title order={5}>Starting Tags</Title>
        <Stack gap="xs">
          {game.tags.map((tag, idx) => (
            <Group key={tag.id} gap="xs" wrap="nowrap">
              <TextInput
                size="xs"
                value={tag.name}
                onChange={(e) => {
                  const newTags = [...game.tags];
                  newTags[idx] = { ...tag, name: e.currentTarget.value };
                  setGame({ ...game, tags: newTags });
                }}
                style={{ flex: 1 }}
              />
              <ActionIcon size="sm" color="red" variant="subtle" onClick={() => {
                setGame({ ...game, tags: game.tags.filter(t => t.id !== tag.id) });
              }}>
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))}
          <Button size="xs" variant="light" onClick={() => {
            setGame({ ...game, tags: [...game.tags, { id: crypto.randomUUID(), name: 'new_tag' }] });
          }}>
            Add Tag
          </Button>
        </Stack>

        <Divider />

        <Title order={5}>Theme Settings</Title>
        <ColorInput 
          label="Primary Color" 
          value={game.settings.theme.primaryColor}
          onChange={(val) => setGame({ ...game, settings: { ...game.settings, theme: { ...game.settings.theme, primaryColor: val } } })}
          swatches={[
            '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', 
            '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', 
            '#40c057', '#82c91e', '#fab005', '#fd7e14'
          ]}
        />
        <ColorInput 
          label="Background Color" 
          value={game.settings.theme.backgroundColor}
          onChange={(val) => setGame({ ...game, settings: { ...game.settings, theme: { ...game.settings.theme, backgroundColor: val } } })}
          swatches={[
            '#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6',
            '#25262b', '#1c1c1e', '#141517', '#101113'
          ]}
        />

        <Divider />

        {hasIntegrityError && (
          <Group gap="xs" style={{ background: 'var(--mantine-color-red-light)', padding: '8px 10px', borderRadius: 6 }} wrap="nowrap">
            <IconAlertCircle size={16} color="var(--mantine-color-red-filled)" style={{ flexShrink: 0 }} />
            <Text size="xs" c="red.9" fw={500} style={{ lineHeight: 1.3 }}>
              Fix all &quot;No default branch&quot; errors on the canvas before exporting.
            </Text>
          </Group>
        )}

        <Button 
          color="green" 
          mt={hasIntegrityError ? "sm" : "xl"}
          disabled={hasIntegrityError}
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(game, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", "game.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          }}
        >
          Export game.json
        </Button>
        <Button
          color="blue"
          variant="light"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const importedGame = JSON.parse(event.target?.result as string);
                  setGame(importedGame);
                } catch (err) {
                  alert("Failed to parse JSON file");
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }}
        >
          Import game.json
        </Button>
      </Stack>
    </Paper>
  );
}
