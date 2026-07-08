'use client';

import React, { useState } from 'react';
import { Paper, Title, Text, Stack, TextInput, Divider, Button, Menu, ActionIcon, Group, NativeSelect, NumberInput, Textarea, Card, ColorInput, Checkbox, Select, Input, Tooltip, ThemeIcon, Badge, Autocomplete, Switch, Collapse } from '@mantine/core';
import { IconTrash, IconPlus, IconSettings, IconGripVertical, IconAlertCircle, IconUpload, IconExternalLink, IconPhoto, IconAlignLeft, IconClock, IconHandClick, IconVariable, IconTag, IconTagOff, IconPencil, IconFilter, IconChevronDown, IconChevronUp, IconLock } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useStudioStore } from '../../store/studioStore';
import { Block, LayoutPreset, Edge, Scene } from '../../types/game';
import { compressImageToDataURL } from '../../utils/imageCompressor';

const BLOCK_CONFIG = {
  media:       { label: 'Media',       color: 'blue',   Icon: IconPhoto     },
  text:        { label: 'Text',        color: 'green',  Icon: IconAlignLeft },
  task:        { label: 'Task',        color: 'orange', Icon: IconClock     },
  interaction: { label: 'Interaction', color: 'violet', Icon: IconHandClick },
} as const;

const MUTATION_CONFIG = {
  set:        { label: 'Set Variable', color: 'teal',   Icon: IconVariable },
  add_tag:    { label: 'Add Tag',      color: 'grape',  Icon: IconTag      },
  remove_tag: { label: 'Remove Tag',   color: 'pink',   Icon: IconTagOff   },
} as const;

export function getCleanVariableLabel(vId: string, vName: string, scene: Scene | undefined) {
  if (vName && vName.trim() !== '' && vName !== 'roll_value' && vName !== 'roll_outcome' && vName !== 'roll_branch' && vName !== 'selected_choice_id' && vName !== 'selected_choice_text') {
    return vName;
  }
  if (scene) {
    if (vId.startsWith('choiceValue_')) {
      const blockId = vId.replace('choiceValue_', '');
      const block = scene.blocks.find(b => b.id === blockId);
      return `${(block as any)?.label || 'Choice'} Text`;
    }
    if (vId.startsWith('choice_')) {
      const blockId = vId.replace('choice_', '');
      const block = scene.blocks.find(b => b.id === blockId);
      return `${(block as any)?.label || 'Choice'} ID`;
    }
    if (vId.startsWith('rollValue_')) {
      const blockId = vId.replace('rollValue_', '');
      const block = scene.blocks.find(b => b.id === blockId);
      return `${(block as any)?.label || 'Roll'} Value`;
    }
    if (vId.startsWith('rollOutcome_')) {
      const blockId = vId.replace('rollOutcome_', '');
      const block = scene.blocks.find(b => b.id === blockId);
      return `${(block as any)?.label || 'Roll'} Outcome`;
    }
    if (vId.startsWith('rollBranch_')) {
      const blockId = vId.replace('rollBranch_', '');
      const block = scene.blocks.find(b => b.id === blockId);
      return `${(block as any)?.label || 'Roll'} Branch ID`;
    }
  }
  return vName || vId;
}

export function getIncomingVariablesForScene(
  game: any, 
  targetSceneId: string, 
  visited: Set<string> = new Set()
): Map<string, { sourceScene: string, name: string, type?: string, defaultValue?: any }> {
  const vars = new Map<string, { sourceScene: string, name: string, type?: string, defaultValue?: any }>();
  if (visited.has(targetSceneId)) return vars;
  visited.add(targetSceneId);

  Object.values(game.edges).flat().forEach((edge: any) => {
    if (edge.targetSceneId === targetSceneId) {
      const sourceScene = game.scenes[edge.sourceSceneId];
      if (!sourceScene) return;

      // Variables naturally defined in the source scene
      const sourceVars = new Map<string, { sourceScene: string, name: string, type?: string, defaultValue?: any }>();
      (sourceScene.localVariables || []).forEach((v: any) => {
        sourceVars.set(v.id, { 
          sourceScene: sourceScene.name, 
          name: getCleanVariableLabel(v.id, v.name, sourceScene),
          type: v.type,
          defaultValue: v.defaultValue
        });
      });

      // Variables inherited by the source scene
      const inheritedBySource = getIncomingVariablesForScene(game, sourceScene.id, new Set(visited));
      inheritedBySource.forEach((v, id) => {
        sourceVars.set(id, v);
      });

      if (edge.inheritAllLocals || sourceScene.inheritAllLocals) {
        sourceVars.forEach((v, id) => {
          vars.set(id, v);
        });
      }

      (sourceScene.sceneVariableMappings || []).forEach((m: any) => {
        const srcVar = sourceVars.get(m.sourceId);
        vars.set(m.targetId, { 
          sourceScene: sourceScene.name, 
          name: srcVar ? srcVar.name : m.sourceId, 
          type: srcVar?.type,
          defaultValue: srcVar?.defaultValue
        });
      });

      (edge.edgeVariableMappings || []).forEach((m: any) => {
        const srcVar = sourceVars.get(m.sourceId);
        vars.set(m.targetId, { 
          sourceScene: sourceScene.name, 
          name: srcVar ? srcVar.name : m.sourceId, 
          type: srcVar?.type,
          defaultValue: srcVar?.defaultValue
        });
      });
    }
  });

  return vars;
}



// ─── Shared card-style header helper ──────────────────────────────────────────
function CardHeader({
  color, Icon, label, badge, onDelete, children, dragHandleProps, iconTooltip
}: {
  color: string;
  Icon: React.ComponentType<{ size?: number }>;
  label: string;
  badge?: React.ReactNode;
  onDelete?: () => void;
  children?: React.ReactNode;
  dragHandleProps?: any;
  iconTooltip?: string;
}) {
  return (
    <Group
      justify="space-between"
      px="sm"
      py={6}
      style={{
        background: `var(--mantine-color-${color}-light)`,
        borderBottom: `1px solid var(--mantine-color-${color}-light-hover)`,
      }}
    >
      <Group gap="xs">
        {dragHandleProps && (
          <div {...dragHandleProps} style={{ display: 'flex', cursor: 'grab', color: `var(--mantine-color-${color}-6)` }}>
            <IconGripVertical size={14} />
          </div>
        )}
        {iconTooltip ? (
          <Tooltip label={iconTooltip} position="top" withArrow>
            <ThemeIcon size="xs" variant="transparent" color={color}>
              <Icon size={13} />
            </ThemeIcon>
          </Tooltip>
        ) : (
          <ThemeIcon size="xs" variant="transparent" color={color}>
            <Icon size={13} />
          </ThemeIcon>
        )}
        <Text size="xs" fw={700} c={`${color}.8`} style={{ letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {label}
        </Text>
        {badge}
      </Group>
      <Group gap={4}>
        {children}
        {onDelete && (
          <ActionIcon size="sm" color="red" variant="subtle" onClick={onDelete}>
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}

// ─── Variable Card ─────────────────────────────────────────────────────────────
function VariableCard({
  variable,
  color = 'teal',
  isIncoming = false,
  isReadonly = false,
  isFullyReadonly = false,
  isAutoVariable = false,
  onChangeName,
  onChangeType,
  onChangeDefault,
  onDelete,
}: {
  variable: { id: string; name: string; type: string; defaultValue: any };
  color?: string;
  isIncoming?: boolean;
  isReadonly?: boolean;
  isFullyReadonly?: boolean;
  isAutoVariable?: boolean;
  onChangeName: (name: string) => void;
  onChangeType: (type: string) => void;
  onChangeDefault: (val: any) => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p={0}
      style={{
        borderLeft: `3px solid var(--mantine-color-${color}-6)`,
        overflow: 'hidden',
      }}
    >
      <CardHeader
        color={isIncoming ? 'blue' : color}
        Icon={isAutoVariable ? IconLock : IconVariable}
        iconTooltip={isAutoVariable ? "This variable is linked to a block interaction and cannot be manually modified." : undefined}
        label={variable.name || 'Variable'}
        badge={
          <Badge size="xs" variant="light" color={isIncoming ? 'blue' : color} radius="sm">
            {variable.type}
          </Badge>
        }
        onDelete={onDelete}
      >
        {isIncoming && (
          <Badge size="xs" variant="filled" color="blue" radius="sm">⚡ Incoming</Badge>
        )}
      </CardHeader>
      <Stack gap="xs" p="sm">
        <Group gap="xs" wrap="nowrap" align="flex-end">
          <TextInput
            size="xs"
            label="Name"
            variant="filled"
            value={variable.name}
            onChange={(e) => onChangeName(e.currentTarget.value)}
            disabled={isFullyReadonly}
            style={{ flex: 1 }}
          />
          <NativeSelect
            size="xs"
            label="Type"
            variant="filled"
            data={[
              { value: 'number',  label: 'Number'  },
              { value: 'boolean', label: 'Boolean' },
              { value: 'string',  label: 'String'  },
            ]}
            value={variable.type}
            onChange={(e) => onChangeType(e.currentTarget.value)}
            disabled={isFullyReadonly || isReadonly}
            style={{ width: 95 }}
          />
          {variable.type === 'boolean' ? (
            <Input.Wrapper size="xs" label="Default" style={{ width: 68 }}>
              <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  size="xs"
                  radius="sm"
                  checked={variable.defaultValue as boolean}
                  onChange={(e) => onChangeDefault(e.currentTarget.checked)}
                  disabled={isFullyReadonly}
                />
              </div>
            </Input.Wrapper>
          ) : (
            <TextInput
              size="xs"
              label="Default"
              variant="filled"
              value={String(variable.defaultValue)}
              onChange={(e) => {
                let val: any = e.currentTarget.value;
                if (variable.type === 'number') val = Number(val) || 0;
                onChangeDefault(val);
              }}
              disabled={isFullyReadonly}
              style={{ width: 68 }}
            />
          )}
        </Group>
      </Stack>
    </Card>
  );
}

// ─── Condition Card ────────────────────────────────────────────────────────────
const OPERATOR_LABELS: Record<string, string> = {
  '==': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'at least',
  '<=': 'at most',
  'has_tag': 'has tag',
  'missing_tag': 'missing tag',
  'contains': 'contains',
  'is_in': 'is in',
};

function ConditionCard({
  cond,
  dragHandleProps,
  isDeleteDisabled,
  onChangeTargetId,
  onChangeOperator,
  onChangeValue,
  onDelete,
  targetOptions,
}: {
  cond: { id: string; targetId: string; operator: string; value?: any };
  dragHandleProps?: any;
  isDeleteDisabled?: boolean;
  onChangeTargetId: (id: string) => void;
  onChangeOperator: (op: string) => void;
  onChangeValue: (val: any) => void;
  onDelete: () => void;
  targetOptions: any[];
}) {
  const isTagOp = cond.operator === 'has_tag' || cond.operator === 'missing_tag';
  
  // Resolve name and type for header and contextual options
  let resolvedName = cond.targetId;
  let targetType = 'number'; // default
  
  if (targetOptions) {
    const item = targetOptions.find((i: any) => i.value === cond.targetId);
    if (item) {
      resolvedName = item.label;
      if (item.type) targetType = item.type;
      else if (item.group === 'Tags') targetType = 'tag';
    } else if (isTagOp) {
      targetType = 'tag';
    }
  }

  // Build a compact summary for the header label
  const headerLabel = cond.targetId
    ? isTagOp
      ? `${resolvedName} · ${OPERATOR_LABELS[cond.operator] ?? cond.operator}`
      : `${resolvedName} ${cond.operator} ${targetType === 'boolean' ? (cond.value ? 'true' : 'false') : (cond.value ?? '?')}`
    : 'Condition';

  // Contextual operator options
  let operatorData: { value: string, label: string }[] = [];
  if (targetType === 'tag') {
    operatorData = [
      { value: 'has_tag', label: 'Has Tag' },
      { value: 'missing_tag', label: 'Missing Tag' }
    ];
  } else if (targetType === 'boolean') {
    operatorData = [
      { value: '==', label: '== (equals)' },
      { value: '!=', label: '!= (not equals)' }
    ];
  } else if (targetType === 'string') {
    operatorData = [
      { value: '==', label: '== (equals)' },
      { value: '!=', label: '!= (not equals)' },
      { value: 'contains', label: 'contains' },
      { value: 'is_in', label: 'is in' }
    ];
  } else { // number
    operatorData = [
      { value: '==', label: '== (equals)' },
      { value: '!=', label: '!= (not equals)' },
      { value: '>', label: '> (greater than)' },
      { value: '<', label: '< (less than)' },
      { value: '>=', label: '>= (at least)' },
      { value: '<=', label: '<= (at most)' }
    ];
  }

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p={0}
      style={{
        borderLeft: '3px solid var(--mantine-color-yellow-6)',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        color="yellow"
        Icon={IconFilter}
        label={headerLabel}
        onDelete={isDeleteDisabled ? undefined : onDelete}
        dragHandleProps={dragHandleProps}
      >
        {isDeleteDisabled && (
          <ActionIcon size="sm" color="red" variant="subtle" disabled>
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </CardHeader>
      <Stack gap="xs" p="sm">
        {isTagOp ? (
          <Autocomplete
            size="xs"
            label="Tag"
            variant="filled"
            placeholder="Type or select tag..."
            data={(targetOptions || []).filter((o: any) => o.group === 'Tags').map((o: any) => o.value)}
            value={cond.targetId}
            onChange={(val) => onChangeTargetId(val)}
          />
        ) : (
          <Select
            size="xs"
            label="Variable"
            variant="filled"
            placeholder="Select variable..."
            data={(() => {
              const vars = (targetOptions || []).filter((o: any) => o.group !== 'Tags');
              const grouped: Record<string, any[]> = {};
              vars.forEach((v: any) => {
                if (!grouped[v.group]) grouped[v.group] = [];
                grouped[v.group].push({ value: v.value, label: v.label });
              });
              return Object.keys(grouped).map(group => ({ group, items: grouped[group] }));
            })()}
            searchable
            value={cond.targetId}
            onChange={(val) => onChangeTargetId(val || '')}
          />
        )}
        <Group grow gap="xs">
          <NativeSelect
            size="xs"
            label="Operator"
            variant="filled"
            data={operatorData}
            value={cond.operator}
            onChange={(e) => onChangeOperator(e.currentTarget.value)}
          />
          {!isTagOp && (
            targetType === 'boolean' ? (
              <Input.Wrapper size="xs" label="Compare Value">
                <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    size="xs"
                    radius="sm"
                    checked={cond.value as boolean}
                    onChange={(e) => onChangeValue(e.currentTarget.checked)}
                  />
                </div>
              </Input.Wrapper>
            ) : (
              <TextInput
                size="xs"
                label="Compare Value"
                variant="filled"
                placeholder={targetType === 'string' ? 'e.g. hello' : 'e.g. 50'}
                value={String(cond.value ?? '')}
                onChange={(e) => {
                  let val: any = e.currentTarget.value;
                  if (val === 'true') val = true;
                  if (val === 'false') val = false;
                  if (!isNaN(Number(val)) && val !== '') val = Number(val);
                  onChangeValue(val);
                }}
              />
            )
          )}
        </Group>
      </Stack>
    </Card>
  );
}

// ─── Mutation Card ─────────────────────────────────────────────────────────────
function MutationCard({
  mut,
  idx,
  onChangeOperation,
  onChangeTargetId,
  onChangeValue,
  onDelete,
  targetOptions,
}: {
  mut: { id: string; operation: string; targetId: string; value?: any };
  idx: number;
  onChangeOperation: (op: string) => void;
  onChangeTargetId: (id: string) => void;
  onChangeValue: (val: any) => void;
  onDelete: () => void;
  targetOptions: any[];
}) {
  const isVarOp = ['set', 'add', 'subtract', 'multiply', 'divide'].includes(mut.operation);
  const cfg = MUTATION_CONFIG[isVarOp ? 'set' : mut.operation as keyof typeof MUTATION_CONFIG] ?? { label: mut.operation, color: 'gray', Icon: IconPencil };
  const { color, Icon } = cfg;

  let resolvedName = mut.targetId;
  let targetType = 'number'; // default
  
  const isTagOp = mut.operation === 'add_tag' || mut.operation === 'remove_tag';

  if (targetOptions) {
    const item = targetOptions.find((i: any) => i.value === mut.targetId);
    if (item) {
      resolvedName = item.label;
      if (item.type) targetType = item.type;
      else if (item.group === 'Tags') targetType = 'tag';
    } else if (isTagOp) {
      targetType = 'tag';
    }
  }

  // Build a compact summary for the header label
  let headerOpText = mut.operation;
  if (isVarOp) headerOpText = mut.operation === 'set' ? '=' : mut.operation === 'add' ? '+=' : mut.operation === 'subtract' ? '-=' : mut.operation === 'multiply' ? '*=' : '/=';
  else if (mut.operation === 'add_tag') headerOpText = '+tag';
  else if (mut.operation === 'remove_tag') headerOpText = '-tag';

  const headerLabel = mut.targetId
    ? isTagOp
      ? `${resolvedName} ${headerOpText}`
      : `${resolvedName} ${headerOpText} ${targetType === 'boolean' ? (mut.value ? 'true' : 'false') : (mut.value ?? '?')}`
    : 'Mutation';

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p={0}
      style={{
        borderLeft: `3px solid var(--mantine-color-${color}-6)`,
        overflow: 'hidden',
      }}
    >
      <CardHeader color={color} Icon={Icon} label={headerLabel} onDelete={onDelete} />
      <Stack gap="xs" p="sm">
        <NativeSelect
          size="xs"
          label="Operation"
          variant="filled"
          data={[
            { value: 'set',        label: 'Change Variable' },
            { value: 'add_tag',    label: 'Add Tag'      },
            { value: 'remove_tag', label: 'Remove Tag'   },
          ]}
          value={isVarOp ? 'set' : mut.operation}
          onChange={(e) => {
            const newOp = e.currentTarget.value;
            onChangeOperation(newOp);
            // If switching to a tag op, we might want to clear value, but leaving it is fine.
          }}
        />
        {isTagOp ? (
          <Autocomplete
            size="xs"
            label="Tag"
            variant="filled"
            placeholder="Type or select tag..."
            data={(targetOptions || []).filter((o: any) => o.group === 'Tags').map((o: any) => o.value)}
            value={mut.targetId}
            onChange={(val) => onChangeTargetId(val)}
          />
        ) : (
          <Select
            size="xs"
            label="Variable"
            variant="filled"
            placeholder="Select variable..."
            data={(() => {
              const vars = (targetOptions || []).filter((o: any) => o.group !== 'Tags');
              const grouped: Record<string, any[]> = {};
              vars.forEach((v: any) => {
                if (!grouped[v.group]) grouped[v.group] = [];
                grouped[v.group].push({ value: v.value, label: v.label });
              });
              return Object.keys(grouped).map(group => ({ group, items: grouped[group] }));
            })()}
            searchable
            value={mut.targetId}
            onChange={(val) => onChangeTargetId(val || '')}
          />
        )}
        
        {isVarOp && targetType === 'number' && (
          <NativeSelect
            size="xs"
            label="Modification"
            variant="filled"
            data={[
              { value: 'set', label: 'Set to' },
              { value: 'add', label: 'Add' },
              { value: 'subtract', label: 'Subtract' },
              { value: 'multiply', label: 'Multiply by' },
              { value: 'divide', label: 'Divide by' },
            ]}
            value={mut.operation}
            onChange={(e) => onChangeOperation(e.currentTarget.value)}
          />
        )}

        {isVarOp && (
          targetType === 'boolean' ? (
            <Input.Wrapper size="xs" label="New Value">
              <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  size="xs"
                  radius="sm"
                  checked={mut.value as boolean}
                  onChange={(e) => {
                    // For boolean, force the operation to 'set'
                    if (mut.operation !== 'set') onChangeOperation('set');
                    onChangeValue(e.currentTarget.checked);
                  }}
                />
              </div>
            </Input.Wrapper>
          ) : (
            <TextInput
              size="xs"
              label="New Value"
              variant="filled"
              placeholder={targetType === 'string' ? 'e.g. hello' : 'e.g. 50'}
              value={String(mut.value ?? '')}
              onChange={(e) => {
                let val: any = e.currentTarget.value;
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                if (!isNaN(Number(val)) && val !== '') val = Number(val);
                onChangeValue(val);
              }}
            />
          )
        )}
      </Stack>
    </Card>
  );
}

function BlockEditor({ sceneId, block, dragHandleProps }: { sceneId: string; block: Block; dragHandleProps?: any }) {
  const { updateBlock, removeBlock } = useStudioStore();
  const cfg = BLOCK_CONFIG[block.type as keyof typeof BLOCK_CONFIG] ?? { label: block.type, color: 'gray', Icon: IconAlignLeft };
  const { label, color, Icon } = cfg;

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p={0}
      style={{
        borderLeft: `3px solid var(--mantine-color-${color}-6)`,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <Group
        justify="space-between"
        px="sm"
        py={6}
        style={{
          background: `var(--mantine-color-${color}-light)`,
          borderBottom: `1px solid var(--mantine-color-${color}-light-hover)`,
        }}
      >
        <Group gap="xs">
          {dragHandleProps && (
            <div {...dragHandleProps} style={{ display: 'flex', cursor: 'grab', color: `var(--mantine-color-${color}-6)` }}>
              <IconGripVertical size={14} />
            </div>
          )}
          <ThemeIcon size="xs" variant="transparent" color={color}>
            <Icon size={13} />
          </ThemeIcon>
          <Text size="xs" fw={700} c={`${color}.8`} style={{ letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            {label}
          </Text>
        </Group>
        {!(block.type === 'interaction' && block.interactionType === 'continue') && (
          <ActionIcon size="sm" color="red" variant="subtle" onClick={() => removeBlock(sceneId, block.id)}>
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </Group>

      {/* Card body */}
      <Stack gap="xs" p="sm">
        {block.type === 'media' && (
          <>
            <NativeSelect
              size="xs"
              label="Media Type"
              variant="filled"
              value={block.mediaType}
              data={[
                { value: 'image', label: 'Image' },
                { value: 'video', label: 'Video' },
                { value: 'audio', label: 'Audio' },
              ]}
              onChange={(e) => updateBlock(sceneId, block.id, { mediaType: e.currentTarget.value })}
            />
            <TextInput
              size="xs"
              label="URL"
              variant="filled"
              placeholder="https://…"
              value={block.url}
              onChange={(e) => updateBlock(sceneId, block.id, { url: e.currentTarget.value })}
              leftSection={
                block.url ? (
                  <Tooltip label="Preview in new tab" position="top" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        if (block.url.startsWith('data:')) {
                          const win = window.open();
                          if (win) {
                            win.document.write(`<iframe src="${block.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            win.document.title = 'Media Preview';
                            win.document.close();
                          }
                        } else {
                          window.open(block.url, '_blank');
                        }
                      }}
                    >
                      <IconExternalLink size={13} />
                    </ActionIcon>
                  </Tooltip>
                ) : undefined
              }
              rightSection={
                block.mediaType === 'image' ? (
                  <Tooltip label="Embed local image" position="top" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          try {
                            const dataURL = await compressImageToDataURL(file);
                            updateBlock(sceneId, block.id, { url: dataURL });
                          } catch (err) {
                            console.error('Failed to compress image:', err);
                          }
                        };
                        input.click();
                      }}
                    >
                      <IconUpload size={13} />
                    </ActionIcon>
                  </Tooltip>
                ) : null
              }
            />
          </>
        )}

        {block.type === 'text' && (
          <Textarea
            size="xs"
            label="Text Content"
            description="Supports ${{var}} templating"
            variant="filled"
            value={block.text}
            autosize
            minRows={2}
            onChange={(e) => updateBlock(sceneId, block.id, { text: e.currentTarget.value })}
          />
        )}

        {block.type === 'task' && (
          <>
            <NumberInput
              size="xs"
              label="Duration (seconds)"
              variant="filled"
              min={0}
              value={block.durationSeconds}
              onChange={(val) => updateBlock(sceneId, block.id, { durationSeconds: Number(val) || 0 })}
            />
            <NumberInput
              size="xs"
              label="BPM"
              description="Optional metronome"
              variant="filled"
              min={1}
              value={block.bpm || ''}
              onChange={(val) => updateBlock(sceneId, block.id, { bpm: val === '' ? undefined : Number(val) })}
            />
          </>
        )}

        {block.type === 'interaction' && (
          <>
            <NativeSelect
              size="xs"
               label="Interaction Type"
               variant="filled"
               disabled={block.interactionType === 'continue'}
               value={block.interactionType}
               data={block.interactionType === 'continue'
                 ? [{ value: 'continue', label: 'Continue' }]
                 : [
                     { value: 'choice',   label: 'Choice'   },
                     { value: 'roll',     label: 'Roll'     },
                   ]
               }
               onChange={(e) => updateBlock(sceneId, block.id, { interactionType: e.currentTarget.value })}
             />
             {block.interactionType !== 'continue' && (
               <Switch
                 size="xs"
                 label="Required Interaction"
                 description="Player must complete this interaction before continuing."
                 checked={block.isRequired !== false}
                 onChange={(e) => updateBlock(sceneId, block.id, { isRequired: e.currentTarget.checked })}
               />
             )}
            {(block.interactionType === 'continue' || block.interactionType === 'roll') && (
              <TextInput
                size="xs"
                label="Button Label"
                variant="filled"
                placeholder={block.interactionType === 'roll' ? 'Roll' : 'Continue'}
                value={block.label || ''}
                onChange={(e) => updateBlock(sceneId, block.id, { label: e.currentTarget.value })}
              />
            )}
            {block.interactionType === 'roll' && (
              <Stack gap="xs">
                <NumberInput
                  size="xs"
                  label="Rerolls Granted (Override)"
                  description="Leave empty to use global default"
                  variant="filled"
                  value={block.rerollsGranted ?? ''}
                  onChange={(val) => updateBlock(sceneId, block.id, { rerollsGranted: typeof val === 'number' ? val : undefined })}
                  min={0}
                />
                <Switch
                  size="xs"
                  label="Mapped Distribution"
                  checked={block.isMappedRoll || false}
                  onChange={(e) => updateBlock(sceneId, block.id, { isMappedRoll: e.currentTarget.checked })}
                />
                
                {!block.isMappedRoll ? (
                  <NumberInput
                    size="xs"
                    label="Maximum Roll Value"
                    description="Random roll range will be 1 to X (max 100)"
                    variant="filled"
                    min={2}
                    max={100}
                    value={block.maxRoll !== undefined ? block.maxRoll : 10}
                    onChange={(val) => updateBlock(sceneId, block.id, { maxRoll: val === '' ? 10 : Math.min(100, Math.max(2, Number(val) || 10)) })}
                  />
                ) : (
                  <Stack gap="xs">
                    <Text size="xs" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Distribution Branches</Text>
                    {(block.rollBranches || []).map((branch, idx) => (
                      <Group key={branch.id} gap="xs" wrap="nowrap" align="flex-end">
                        <NumberInput
                          size="xs"
                          label="Weight"
                          variant="filled"
                          min={1}
                          value={branch.weight || 1}
                          onChange={(val) => {
                            const newBranches = [...(block.rollBranches || [])];
                            newBranches[idx] = { ...branch, weight: Number(val) || 1 };
                            let currentMin = 1;
                            const computedBranches = newBranches.map(b => {
                              const w = Math.max(1, b.weight || 1);
                              const min = currentMin;
                              const max = currentMin + w - 1;
                              currentMin = max + 1;
                              return { ...b, weight: w, min, max };
                            });
                            updateBlock(sceneId, block.id, { rollBranches: computedBranches });
                          }}
                          style={{ width: 60 }}
                        />
                        <TextInput
                          size="xs"
                          label={branch.min === branch.max ? `Roll ${branch.min}` : `Roll ${branch.min}-${branch.max}`}
                          variant="filled"
                          placeholder="Outcome text"
                          value={branch.label}
                          style={{ flex: 1 }}
                          onChange={(e) => {
                            const newBranches = [...(block.rollBranches || [])];
                            newBranches[idx] = { ...branch, label: e.currentTarget.value };
                            updateBlock(sceneId, block.id, { rollBranches: newBranches });
                          }}
                        />
                        <ActionIcon size="sm" color="red" variant="subtle" mb={4} onClick={() => {
                          const newBranches = (block.rollBranches || []).filter(b => b.id !== branch.id);
                          let currentMin = 1;
                          const computedBranches = newBranches.map(b => {
                            const w = Math.max(1, b.weight || 1);
                            const min = currentMin;
                            const max = currentMin + w - 1;
                            currentMin = max + 1;
                            return { ...b, weight: w, min, max };
                          });
                          updateBlock(sceneId, block.id, { rollBranches: computedBranches });
                        }}>
                          <IconTrash size={13} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button
                      size="xs"
                      variant="light"
                      color="violet"
                      leftSection={<IconPlus size={12} />}
                      onClick={() => {
                        const newBranches = [...(block.rollBranches || []), { id: crypto.randomUUID(), weight: 1, min: 1, max: 1, label: 'New Outcome' }];
                        let currentMin = 1;
                        const computedBranches = newBranches.map(b => {
                          const w = Math.max(1, b.weight || 1);
                          const min = currentMin;
                          const max = currentMin + w - 1;
                          currentMin = max + 1;
                          return { ...b, weight: w, min, max };
                        });
                        updateBlock(sceneId, block.id, { rollBranches: computedBranches });
                      }}
                    >
                      Add Outcome
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}
            {block.interactionType === 'choice' && (
              <Stack gap="xs">
                <Text size="xs" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Choices</Text>
                {(block.choices || []).map((choice, idx) => (
                  <Group key={choice.id} gap="xs" wrap="nowrap">
                    <TextInput
                      size="xs"
                      variant="filled"
                      placeholder={`Choice ${idx + 1}`}
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
                      <IconTrash size={13} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => {
                    const newChoices = [...(block.choices || []), { id: crypto.randomUUID(), label: 'New Choice' }];
                    updateBlock(sceneId, block.id, { choices: newChoices });
                  }}
                >
                  Add Choice
                </Button>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}

function SceneInspector({ sceneId }: { sceneId: string }) {
  const { game, updateScene, addBlock, setGame } = useStudioStore();
  const [incomingVarsExpanded, setIncomingVarsExpanded] = useState(false);
  const scene = game.scenes[sceneId];
  if (!scene) return null;

  // Auto-detect incoming variables
  const incomingVars = getIncomingVariablesForScene(game, scene.id);

  const availableLocalsOptions = [
    ...(scene.localVariables || []).map(v => ({ value: v.id, label: v.name, type: v.type })),
    ...Array.from(incomingVars.entries()).map(([id, data]) => ({ value: id, label: `${data.name} (from ${data.sourceScene})`, type: data.type }))
  ];
  // Deduplicate options by value
  const uniqueAvailableLocalsOptions = availableLocalsOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

  const mutationTargetOptions = [
    ...uniqueAvailableLocalsOptions.map(v => ({ ...v, group: 'Local Variables' })),
    { value: '_rerolls', label: 'Shared Rerolls', type: 'number', group: 'System Variables' },
    ...(game.globalVariables || []).map(v => ({ value: v.id, label: v.name, type: v.type || typeof v.defaultValue, group: 'Global Variables' })),
    ...(game.tags || []).map(t => ({ value: t.name, label: t.name, type: 'tag', group: 'Tags' }))
  ];

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    if (result.type === 'blocks') {
      const nonContinueBlocks = scene.blocks.filter(b => b.type !== 'interaction' || (b as any).interactionType !== 'continue');
      const continueBlock = scene.blocks.find(b => b.type === 'interaction' && (b as any).interactionType === 'continue');
      
      const newBlocks = Array.from(nonContinueBlocks);
      const [moved] = newBlocks.splice(result.source.index, 1);
      newBlocks.splice(result.destination.index, 0, moved);
      
      if (continueBlock) {
        newBlocks.push(continueBlock);
      }
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
        <ActionIcon variant="light" color="cyan" onClick={() => {
          updateScene(scene.id, { 
            localVariables: [...(scene.localVariables || []), { id: crypto.randomUUID(), name: 'newVar', type: 'number', defaultValue: 0 }] 
          });
        }}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="xs">
        {incomingVars.size > 0 && (
          <Card
            withBorder
            shadow="sm"
            radius="md"
            p={0}
            style={{
              borderLeft: `3px solid var(--mantine-color-blue-6)`,
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={() => setIncomingVarsExpanded(!incomingVarsExpanded)}
          >
            <Group
              justify="space-between"
              px="sm"
              py={8}
              style={{
                background: `var(--mantine-color-blue-light)`,
              }}
            >
              <Group gap="xs">
                <ThemeIcon size="xs" variant="transparent" color="blue">
                  <IconVariable size={14} />
                </ThemeIcon>
                <Text size="xs" fw={700} c="blue.8" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Detected Incoming Variables
                </Text>
              </Group>
              <Group gap={6}>
                {Array.from(incomingVars.values()).slice(0, 3).map(v => (
                  <Badge key={v.name} size="xs" variant="filled" color="blue" tt="none">{v.name}</Badge>
                ))}
                {incomingVars.size > 3 && (
                  <Badge size="xs" variant="filled" color="blue" tt="none">+{incomingVars.size - 3}</Badge>
                )}
                <ActionIcon size="sm" variant="transparent" color="blue">
                  {incomingVarsExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                </ActionIcon>
              </Group>
            </Group>
            
            <Collapse in={incomingVarsExpanded}>
              <Stack gap="xs" p="sm" style={{ borderTop: '1px solid var(--mantine-color-blue-light-hover)' }}>
                {Array.from(incomingVars.values()).map(v => (
                  <VariableCard
                    key={v.name}
                    variable={{ 
                      id: v.name, 
                      name: v.name, 
                      type: v.type || 'number', 
                      defaultValue: v.defaultValue !== undefined ? v.defaultValue : (v.type === 'boolean' ? false : v.type === 'string' ? '' : 0) 
                    }}
                    color="blue"
                    isIncoming={true}
                    isReadonly={true}
                    isFullyReadonly={true}
                    onChangeName={() => {}}
                    onChangeType={() => {}}
                    onChangeDefault={() => {}}
                  />
                ))}
              </Stack>
            </Collapse>
          </Card>
        )}
        {(scene.localVariables || []).map((variable, idx) => {
          const isIncoming = incomingVars.has(variable.id) || Array.from(incomingVars.values()).some(v => v.name === variable.name);
          const isAutoVariable = variable.id.startsWith('rollValue_') || variable.id.startsWith('rollOutcome_') || variable.id.startsWith('rollBranch_') || variable.id.startsWith('choice_') || variable.id.startsWith('choiceValue_');
          return (
            <VariableCard
              key={variable.id}
              variable={variable}
              color={isAutoVariable ? "violet" : "cyan"}
              isIncoming={isIncoming}
              isReadonly={isAutoVariable}
              isAutoVariable={isAutoVariable}
              onChangeName={(name) => {
                const newVars = [...scene.localVariables];
                newVars[idx] = { ...variable, name };
                updateScene(scene.id, { localVariables: newVars });
              }}
              onChangeType={(type) => {
                const newVars = [...scene.localVariables];
                let defaultValue: any = 0;
                if (type === 'boolean') defaultValue = false;
                if (type === 'string') defaultValue = '';
                newVars[idx] = { ...variable, type: type as any, defaultValue };
                updateScene(scene.id, { localVariables: newVars });
              }}
              onChangeDefault={(val) => {
                const newVars = [...scene.localVariables];
                newVars[idx] = { ...variable, defaultValue: val };
                updateScene(scene.id, { localVariables: newVars });
              }}
              onDelete={isAutoVariable ? undefined : () => updateScene(scene.id, { localVariables: scene.localVariables.filter(v => v.id !== variable.id) })}
            />
          );
        })}
      </Stack>
      
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
            <Menu.Item onClick={() => addBlock(scene.id, 'interaction', 'choice')}>Choice Block</Menu.Item>
            <Menu.Item onClick={() => addBlock(scene.id, 'interaction', 'roll')}>Roll Block</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {(() => {
        const nonContinueBlocks = scene.blocks.filter(b => b.type !== 'interaction' || (b as any).interactionType !== 'continue');
        const continueBlock = scene.blocks.find(b => b.type === 'interaction' && (b as any).interactionType === 'continue');
        
        return (
          <Stack gap="md">
            {nonContinueBlocks.length === 0 ? (
              <Text size="sm" c="dimmed">No content blocks yet. Add media, text, or tasks above.</Text>
            ) : (
              <Droppable droppableId="blocks" type="blocks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <Stack gap="md">
                      {nonContinueBlocks.map((block, idx) => (
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
            
            {continueBlock && (
              <div style={{ borderTop: '1px dashed var(--mantine-color-gray-3)', paddingTop: '10px' }}>
                <BlockEditor sceneId={scene.id} block={continueBlock} />
              </div>
            )}
          </Stack>
        );
      })()}

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
        <Title order={5}>Mutations</Title>
        <ActionIcon variant="light" color="teal" onClick={() => {
          const newMutations = [...(scene.sceneMutations || []), { id: crypto.randomUUID(), operation: 'set', targetId: 'newVar', value: true }];
          updateScene(scene.id, { sceneMutations: newMutations as any });
        }}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      {(!scene.sceneMutations || scene.sceneMutations.length === 0) ? (
        <Text size="sm" c="dimmed">No mutations.</Text>
      ) : (
        <Stack gap="sm">
          {scene.sceneMutations.map((mut: any, idx: number) => (
            <MutationCard
              key={mut.id}
              mut={mut}
              idx={idx}
              targetOptions={mutationTargetOptions}
              onChangeOperation={(op) => {
                const newMutations = [...scene.sceneMutations];
                newMutations[idx] = { ...mut, operation: op };
                updateScene(scene.id, { sceneMutations: newMutations });
              }}
              onChangeTargetId={(id) => {
                const newMutations = [...scene.sceneMutations];
                newMutations[idx] = { ...mut, targetId: id };
                updateScene(scene.id, { sceneMutations: newMutations });
              }}
              onChangeValue={(val) => {
                const newMutations = [...scene.sceneMutations];
                newMutations[idx] = { ...mut, value: val };
                updateScene(scene.id, { sceneMutations: newMutations });
              }}
              onDelete={() => {
                const newMutations = scene.sceneMutations.filter((m: any) => m.id !== mut.id);
                updateScene(scene.id, { sceneMutations: newMutations });
              }}
            />
          ))}
        </Stack>
      )}

      <Divider mt="md" />
      <Group justify="space-between">
        <Title order={5}>Payload Mapping</Title>
        <ActionIcon variant="light" color="violet" disabled={scene.inheritAllLocals} onClick={() => {
          updateScene(scene.id, { 
            sceneVariableMappings: [...(scene.sceneVariableMappings || []), { sourceId: 'sourceVar', targetId: 'targetVar' }] 
          });
        }}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
      <Checkbox
        size="xs"
        label="All Local Variables"
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
  const sourceScene = game.scenes[sourceId];
  const incomingVars = getIncomingVariablesForScene(game, sourceId);
  
  const availableLocalsOptions = [
    ...(sourceScene?.localVariables || []).map(v => ({ 
      value: v.id, 
      label: getCleanVariableLabel(v.id, v.name, sourceScene), 
      type: v.type 
    })),
    ...Array.from(incomingVars.entries()).map(([id, data]) => ({ value: id, label: `${data.name} (from ${data.sourceScene})`, type: data.type }))
  ];
  const uniqueAvailableLocalsOptions = availableLocalsOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

  const interactionBlocks = sourceScene?.blocks.filter(b => b.type === 'interaction') || [];
  const choiceAndRollOptions = interactionBlocks.flatMap(b => {
    const block = b as any;
    if (block.interactionType === 'choice' && block.choices) {
      return block.choices.map((c: any) => ({
        value: c.id,
        label: `${block.label || 'Choice'}: ${c.label}`,
        type: 'boolean',
        group: 'Choices'
      }));
    }
    if (block.interactionType === 'roll' && block.isMappedRoll && block.rollBranches) {
      return block.rollBranches.map((br: any) => ({
        value: br.id,
        label: `${block.label || 'Roll'}: ${br.label}`,
        type: 'boolean',
        group: 'Roll Outcomes'
      }));
    }
    return [];
  });

  const conditionTargetOptions = [
    ...uniqueAvailableLocalsOptions.map(v => ({ ...v, group: 'Local Variables' })),
    { value: '_rerolls', label: 'Shared Rerolls', type: 'number', group: 'System Variables' },
    ...(game.globalVariables || []).map(v => ({ value: v.id, label: v.name, type: v.type || typeof v.defaultValue, group: 'Global Variables' })),
    ...(game.tags || []).map(t => ({ value: t.name, label: t.name, type: 'tag', group: 'Tags' })),
    ...choiceAndRollOptions
  ];

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
          <ActionIcon variant="light" color="yellow" onClick={() => {
            const newConditions = [...(edge!.conditionGroup?.conditions || []), { id: crypto.randomUUID(), targetId: 'newVar', operator: '==', value: true }];
            updateEdge(sourceId, edgeId, { conditionGroup: { logicalOperator: edge!.conditionGroup?.logicalOperator || 'AND', conditions: newConditions as any } });
          }}>
            <IconPlus size={16} />
          </ActionIcon>
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
                          <ConditionCard
                            cond={cond}
                            dragHandleProps={provided.dragHandleProps}
                            isDeleteDisabled={
                              edge!.conditionGroup!.conditions.length <= 1 &&
                              (game.edges[sourceId] || []).some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0)
                            }
                            onChangeTargetId={(id) => {
                              const newConditions = [...edge!.conditionGroup!.conditions];
                              newConditions[idx] = { ...cond, targetId: id };
                              updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                            }}
                            targetOptions={conditionTargetOptions}
                            onChangeOperator={(op) => {
                              const newConditions = [...edge!.conditionGroup!.conditions];
                              newConditions[idx] = { ...cond, operator: op as any };
                              updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                            }}
                            onChangeValue={(val) => {
                              const newConditions = [...edge!.conditionGroup!.conditions];
                              newConditions[idx] = { ...cond, value: val };
                              updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                            }}
                            onDelete={() => {
                              const newConditions = edge!.conditionGroup!.conditions.filter(c => c.id !== cond.id);
                              updateEdge(sourceId, edgeId, { conditionGroup: { ...edge!.conditionGroup!, conditions: newConditions } });
                            }}
                          />
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
        <ActionIcon variant="light" color="teal" onClick={() => {
          const newMutations = [...(edge.edgeMutations || []), { id: crypto.randomUUID(), operation: 'set', targetId: 'newVar', value: true }];
          updateEdge(sourceId, edgeId, { edgeMutations: newMutations as any });
        }}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      {(!edge.edgeMutations || edge.edgeMutations.length === 0) ? (
        <Text size="sm" c="dimmed">No mutations.</Text>
      ) : (
        <Stack gap="sm">
          {edge.edgeMutations.map((mut, idx) => (
            <MutationCard
              key={mut.id}
              mut={mut}
              idx={idx}
              targetOptions={conditionTargetOptions}
              onChangeOperation={(op) => {
                const newMutations = [...edge!.edgeMutations!];
                newMutations[idx] = { ...mut, operation: op as any };
                updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
              }}
              onChangeTargetId={(id) => {
                const newMutations = [...edge!.edgeMutations!];
                newMutations[idx] = { ...mut, targetId: id };
                updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
              }}
              onChangeValue={(val) => {
                const newMutations = [...edge!.edgeMutations!];
                newMutations[idx] = { ...mut, value: val };
                updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
              }}
              onDelete={() => {
                const newMutations = edge!.edgeMutations!.filter(m => m.id !== mut.id);
                updateEdge(sourceId, edgeId, { edgeMutations: newMutations });
              }}
            />
          ))}
        </Stack>
      )}

      <Divider mt="md" />
      <Group justify="space-between">
        <Title order={5}>Payload Mapping</Title>
        <ActionIcon variant="light" color="violet" disabled={edge.inheritAllLocals} onClick={() => {
          updateEdge(sourceId, edgeId, { 
            edgeVariableMappings: [...(edge?.edgeVariableMappings || []), { sourceId: 'sourceVar', targetId: 'targetVar' }] 
          });
        }}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
      <Checkbox
        size="xs"
        label="All Local Variables"
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

  const wrapInspector = (content: React.ReactNode) => (
    <div style={{
      position: 'fixed',
      top: '4.5rem',
      right: 0,
      bottom: '1rem',
      width: '24rem',
      padding: '0.75rem 0.75rem 0.75rem 0',
      zIndex: 200,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Paper 
        p="md" 
        radius="md"
        bg="var(--mantine-color-body)"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          pointerEvents: 'auto',
          boxShadow: 'var(--mantine-shadow-md)',
          border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      >
        {content}
      </Paper>
    </div>
  );

  if (selectedNodeId) {
    const scene = game.scenes[selectedNodeId];
    if (!scene) return null;
    return wrapInspector(<SceneInspector sceneId={selectedNodeId} />);
  }

  if (selectedEdgeId) {
    return wrapInspector(<EdgeInspector edgeId={selectedEdgeId} />);
  }

  const hasIntegrityError = Object.values(game.scenes).some(scene => {
    const allEdges = game.edges[scene.id] || [];
    const hasOutboundEdges = allEdges.length > 0;
    const hasDefaultEdge = allEdges.some(e => !e.conditionGroup || e.conditionGroup.conditions.length === 0);
    return hasOutboundEdges && !hasDefaultEdge;
  });

  return wrapInspector(
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
          <VariableCard
            key={variable.id}
            variable={{ ...variable, type: variable.type || typeof variable.defaultValue }}
            color="teal"
            onChangeName={(name) => {
              const newVars = [...game.globalVariables];
              newVars[idx] = { ...variable, name };
              setGame({ ...game, globalVariables: newVars });
            }}
            onChangeType={(type) => {
              const newVars = [...game.globalVariables];
              let defaultValue: any = 0;
              if (type === 'boolean') defaultValue = false;
              if (type === 'string') defaultValue = '';
              newVars[idx] = { ...variable, type: type as any, defaultValue };
              setGame({ ...game, globalVariables: newVars });
            }}
            onChangeDefault={(val) => {
              const newVars = [...game.globalVariables];
              newVars[idx] = { ...variable, defaultValue: val };
              setGame({ ...game, globalVariables: newVars });
            }}
            onDelete={() => setGame({ ...game, globalVariables: game.globalVariables.filter(v => v.id !== variable.id) })}
          />
        ))}
        <Button
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconPlus size={12} />}
          onClick={() => {
            setGame({ 
              ...game, 
              globalVariables: [...game.globalVariables, { id: crypto.randomUUID(), name: 'newVar', type: 'number', defaultValue: 0 }] 
            });
          }}
        >
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


      <Divider />

      <Title order={5}>Reroll Mechanics</Title>
      <Select
        label="Reroll Policy Type"
        data={[
          { value: 'per-task', label: 'Per-Task' },
          { value: 'shared-pool', label: 'Shared Pool' }
        ]}
        value={game.settings.rerollPolicy?.type || 'per-task'}
        onChange={(val) => setGame({ ...game, settings: { ...game.settings, rerollPolicy: { ...game.settings.rerollPolicy, type: val as 'per-task' | 'shared-pool' } } })}
      />
      <NumberInput
        label="Default Allowance"
        description={game.settings.rerollPolicy?.type === 'shared-pool' ? "Starting global reroll pool" : "Default rerolls per roll block"}
        value={game.settings.rerollPolicy?.defaultAllowance ?? 1}
        onChange={(val) => setGame({ ...game, settings: { ...game.settings, rerollPolicy: { ...game.settings.rerollPolicy, defaultAllowance: typeof val === 'number' ? val : undefined } } })}
        min={0}
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
  );
}
