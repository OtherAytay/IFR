'use client'
import { Scene, Block, MediaBlock, TextBlock, TaskBlock, InteractionBlock } from '@/types/game';
import { Container, Grid, Stack, Image, Text, Button, Paper, Group, Center, SimpleGrid } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useState, useEffect } from 'react';

export function SceneRenderer({ 
  scene, 
  onInteract, 
  onLocalUpdate, 
  useReroll 
}: { 
  scene: Scene, 
  onInteract: (block: InteractionBlock, context?: any) => void,
  onLocalUpdate: (mutations: any[]) => void,
  useReroll?: () => boolean
}) {
  
  // Group blocks by type
  const mediaBlocks = scene.blocks.filter(b => b.type === 'media') as MediaBlock[];
  const textBlocks = scene.blocks.filter(b => b.type === 'text') as TextBlock[];
  const taskBlocks = scene.blocks.filter(b => b.type === 'task') as TaskBlock[];
  const interactionBlocks = scene.blocks.filter(b => b.type === 'interaction') as InteractionBlock[];

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

  // Helper to render content/task/interaction side
  const renderContent = () => {
    return (
      <Stack gap="xl" p="md" style={{ height: '100%', justifyContent: 'center' }}>
        {textBlocks.map(b => (
          <Text key={b.id} size="lg">{b.text}</Text>
        ))}
        
        {taskBlocks.length > 0 && (
          <Paper withBorder p="md" radius="md">
            {taskBlocks.map(b => (
              <Center key={b.id}>
                <Text fw={700} c="violet">Task: {b.durationSeconds} seconds</Text>
                {/* Full task timer UI goes here */}
              </Center>
            ))}
          </Paper>
        )}

        <Group justify="center" mt="xl">
          {interactionBlocks.map(b => (
            <InteractionRenderer 
              key={b.id} 
              block={b} 
              onInteract={onInteract}
              useReroll={useReroll}
            />
          ))}
        </Group>
      </Stack>
    );
  };

  // Render layouts
  switch (scene.layoutPreset) {
    case 'standard-split':
      return (
        <Grid gutter={0} style={{ minHeight: '100vh', margin: 0 }}>
          <Grid.Col span={{ base: 12, md: 6 }} style={{ minHeight: '50vh', backgroundColor: 'var(--mantine-color-gray-1)' }}>
            {renderMedia()}
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Container h="100%">
              {renderContent()}
            </Container>
          </Grid.Col>
        </Grid>
      );
    
    case 'grid':
      return (
        <Container size="xl" py="xl">
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
        <Container size="md" py="xl">
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
  useReroll 
}: { 
  block: InteractionBlock, 
  onInteract: (block: InteractionBlock, context?: any) => void,
  useReroll?: () => boolean
}) {
  
  if (block.interactionType === 'continue') {
    return (
      <Button size="xl" color="violet" onClick={() => onInteract(block)}>
        {block.label || 'Continue'}
      </Button>
    );
  }

  if (block.interactionType === 'choice') {
    return (
      <Stack w="100%">
        {block.choices?.map(c => (
          <Button key={c.id} variant="outline" size="lg" color="violet" onClick={() => onInteract(block, { choiceId: c.id })}>
            {c.label}
          </Button>
        ))}
      </Stack>
    );
  }

  if (block.interactionType === 'roll') {
    return (
      <Stack align="center">
        <Button size="xl" color="violet" onClick={() => {
          const result = Math.floor(Math.random() * 100) + 1; // 1-100
          onInteract(block, { rollResult: result });
        }}>
          {block.label || 'Roll Dice'}
        </Button>
      </Stack>
    );
  }

  return null;
}
