import React from 'react';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { SyntaxHighlight } from './SyntaxHighlightExtension';
import { Paper, Title, Group, Text, Popover, Anchor, Box, ActionIcon } from '@mantine/core';
import { IconInfoCircle, IconX } from '@tabler/icons-react';

interface RichTextBlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
}

function Code({ children }: { children: React.ReactNode }) {
  return <Text component="span" size="xs" ff="monospace" c="pink" bg="dark.7" p={2} style={{ borderRadius: 4 }}>{children}</Text>;
}

export function RichTextBlockEditor({ value, onChange, onClose }: RichTextBlockEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Link, SyntaxHighlight],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        style: 'min-height: 100%; flex: 1;',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <Paper 
      shadow="xl"
      withBorder
      p="md" 
      style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)'
      }}
    >
      <Group justify="space-between" mb="xs" align="flex-start">
        <Box>
          <Title order={5}>Text Content</Title>
          <Popover width={400} position="bottom-start" withArrow shadow="md">
            <Popover.Target>
              <Anchor size="xs" component="button" type="button" display="flex" style={{ alignItems: 'center', gap: 4 }}>
                <IconInfoCircle size={14} /> View Templating Cheat Sheet
              </Anchor>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm" fw={700} mb={4}>Variables</Text>
              <Text size="xs" mb="sm">Use <Code>[Variable Name]</Code> to inject the value of a variable.</Text>
              
              <Text size="sm" fw={700} mb={4}>Tags</Text>
              <Text size="xs" mb="sm">Use <Code>#[Tag Name]</Code> to check if the player has an active tag (evaluates to 1 or 0).</Text>
              
              <Text size="sm" fw={700} mb={4}>Conditionals</Text>
              <Text size="xs" mb="sm">
                Wrap text in <Code>{`{{if condition}}`}</Code> and <Code>{`{{endif}}`}</Code>.<br/>
                Optional: Use <Code>{`{{else}}`}</Code> for fallback content.
              </Text>
              
              <Text size="sm" fw={700} mb={4}>Math & Logic</Text>
              <Text size="xs">
                Supports <Code>{`>, <, >=, <=, ==, !=, &&, ||`}</Code>.<br/>
                Example: <Code>{`{{if [Gold] > 100 && #[VIP]}}`}</Code>
              </Text>
            </Popover.Dropdown>
          </Popover>
        </Box>
        {onClose && (
          <ActionIcon onClick={onClose} variant="subtle" color="gray">
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>

      <style>{`
        .mantine-RichTextEditor-root {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          min-height: 0; /* allows flex child to shrink if needed */
          background-color: light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-8)) !important;
          border-radius: var(--mantine-radius-md) !important;
          border: 1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4)) !important;
          overflow: hidden;
        }
        .mantine-RichTextEditor-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background-color: light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-8)) !important;
          border-bottom-left-radius: var(--mantine-radius-md) !important;
          border-bottom-right-radius: var(--mantine-radius-md) !important;
        }
        .mantine-RichTextEditor-content .tiptap {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          padding: 16px;
          outline: none;
          box-sizing: border-box;
        }
        .mantine-RichTextEditor-content .tiptap p {
          margin: 0 0 8px 0;
        }
        .syntax-block {
          color: var(--mantine-color-grape-6);
          font-weight: 700;
        }
        .syntax-variable {
          color: var(--mantine-color-blue-5);
          font-weight: 700;
        }
        .syntax-tag {
          color: var(--mantine-color-teal-5);
          font-weight: 700;
        }
      `}</style>
      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar sticky stickyOffset={0}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>
    </Paper>
  );
}
