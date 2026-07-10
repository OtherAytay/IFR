'use client'
import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, Group, SimpleGrid, Button, ActionIcon, Stack } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconFilePlus, IconX, IconDeviceGamepad, IconTrash, IconRefresh, IconEdit } from '@tabler/icons-react';
import '@mantine/dropzone/styles.css';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useStudioStore } from '../../store/studioStore';

export default function Home() {
  const [savedGames, setSavedGames] = useState<any[]>([]);
  const router = useRouter();
  const setGame = useStudioStore(state => state.setGame);
  const setEditingSaveId = useStudioStore(state => state.setEditingSaveId);

  useEffect(() => {
    // Load saved games from localStorage
    const loadGames = () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('ifr_save_'));
      const games = keys.map(k => {
        try {
          const data = JSON.parse(localStorage.getItem(k) || '{}');
          return { id: k.replace('ifr_save_', ''), ...data };
        } catch (e) {
          return null;
        }
      }).filter(g => g !== null);
      
      // Sort by lastPlayed descending
      games.sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());
      
      setSavedGames(games);
    };
    loadGames();
  }, []);

  const handleDrop = async (files: File[]) => {
    const file = files[0];
    const text = await file.text();
    try {
      const parsedData = JSON.parse(text);
      const newId = uuidv4();
      
      let saveData;
      if (parsedData.state && parsedData.gameData) {
        // It's a save.json file
        saveData = {
          title: parsedData.title || "Untitled Game",
          lastPlayed: new Date().toISOString(),
          gameData: parsedData.gameData,
          state: parsedData.state
        };
      } else {
        // It's a game.json file
        saveData = {
          title: parsedData.title || "Untitled Game",
          lastPlayed: new Date().toISOString(),
          gameData: parsedData, 
          state: {} // Initial state wrapper
        };
      }
      
      localStorage.setItem(`ifr_save_${newId}`, JSON.stringify(saveData));
      router.push(`/play/${newId}`);
    } catch (e) {
      console.error("Failed to parse JSON", e);
      alert("Invalid game.json file. Could not parse JSON.");
    }
  };

  const deleteSave = (id: string) => {
    if (confirm("Are you sure you want to delete this save?")) {
      localStorage.removeItem(`ifr_save_${id}`);
      setSavedGames(savedGames.filter(g => g.id !== id));
    }
  };

  const restartSave = (id: string) => {
    if (confirm("Are you sure you want to restart this game? All progress will be lost.")) {
      const raw = localStorage.getItem(`ifr_save_${id}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          parsed.state = {};
          parsed.lastPlayed = new Date().toISOString();
          localStorage.setItem(`ifr_save_${id}`, JSON.stringify(parsed));
          router.push(`/play/${id}`);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const editSave = (id: string) => {
    const raw = localStorage.getItem(`ifr_save_${id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.gameData) {
          setGame(parsed.gameData);
          setEditingSaveId(id);
          router.push('/create');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} c="violet" mb="xs">Game Library</Title>
          <Text c="dimmed">Load a new game.json or continue your previously saved games.</Text>
        </div>

        <Dropzone
          onDrop={handleDrop}
          onReject={(files) => alert('File rejected. Must be a JSON file.')}
          maxSize={10 * 1024 ** 2} // 10MB
          accept={['application/json']}
          radius="md"
          styles={{ inner: { pointerEvents: 'all' } }}
        >
          <Group justify="center" gap="xl" mih={150} style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size={50} color="var(--mantine-color-blue-6)" stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={50} color="var(--mantine-color-red-6)" stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFilePlus size={50} color="var(--mantine-color-dimmed)" stroke={1.5} />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                Drag and drop a <Text span c="violet" fw={700}>game.json</Text> or <Text span c="violet" fw={700}>save.json</Text> here
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Attach a game file to create a new slot, or a save file to resume progress
              </Text>
            </div>
          </Group>
        </Dropzone>

        {savedGames.length > 0 && (
          <div>
            <Title order={3} mb="md">Continue Playing</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {savedGames.map((game) => (
                <Card key={game.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section withBorder p="md">
                    <Group justify="space-between">
                      <Title order={4} lineClamp={1}>{game.title}</Title>
                      <IconDeviceGamepad size={24} color="var(--mantine-color-violet-6)" />
                    </Group>
                  </Card.Section>

                  <Text size="sm" c="dimmed" mt="md">
                    Last played: {new Date(game.lastPlayed).toLocaleString()}
                  </Text>

                  <Group mt="md" wrap="nowrap">
                    <Button style={{flexGrow: 1}} variant="light" color="violet" onClick={() => router.push(`/play/${game.id}`)}>
                      {(!game.state || Object.keys(game.state).length === 0) ? 'Play' : 'Resume'}
                    </Button>
                    <ActionIcon variant="light" color="blue" size={36} onClick={() => editSave(game.id)}>
                      <IconEdit size={20} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="orange" size={36} onClick={() => restartSave(game.id)}>
                      <IconRefresh size={20} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" size={36} onClick={() => deleteSave(game.id)}>
                      <IconTrash size={20} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </div>
        )}
      </Stack>
    </Container>
  );
}
