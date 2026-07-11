'use client'
import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, Group, SimpleGrid, Button, ActionIcon, Stack, Image, Badge } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconFilePlus, IconX, IconDeviceGamepad, IconTrash, IconRefresh, IconEdit } from '@tabler/icons-react';
import '@mantine/dropzone/styles.css';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useStudioStore } from '../../store/studioStore';
import JSZip from 'jszip';
import { compressImageToDataURL, fileToDataURL } from '../../utils/imageCompressor';
import { saveMediaAsset } from '../../utils/indexedDB';
import { useAssetUrl } from '../../hooks/useAssetUrl';

function LibraryGameCover({ game }: { game: any }) {
  const coverAsset = game.gameData?.mediaAssets?.find((a: any) => a.id === game.gameData?.coverMediaId);
  const resolvedCoverUrl = useAssetUrl(coverAsset?.url === 'indexeddb' ? coverAsset.id : undefined) || coverAsset?.url;
  
  if (!resolvedCoverUrl) return null;
  return (
    <div style={{ width: '100%', height: 180, overflow: 'hidden' }}>
      <img
        src={resolvedCoverUrl}
        alt={game.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

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
    let parsedData: any = null;
    
    try {
      if (file.name.endsWith('.ifr') || file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        
        const mapFile = loadedZip.file("map.json");
        if (!mapFile) throw new Error("Invalid .ifr file: map.json is missing.");
        
        const mapDataString = await mapFile.async("string");
        parsedData = JSON.parse(mapDataString);
        
        if (parsedData.mediaAssets) {
          for (const asset of parsedData.mediaAssets) {
            if (asset.url.startsWith('media/')) {
              const fileInZip = loadedZip.file(asset.url);
              if (fileInZip) {
                const fileBlob = await fileInZip.async("blob");
                await saveMediaAsset(asset.id, fileBlob);
                asset.url = 'indexeddb';
              }
            }
          }
        }
      } else {
        const text = await file.text();
        parsedData = JSON.parse(text);
      }
      
      const newId = uuidv4();
      
      let saveData;
      if (parsedData.state && parsedData.gameData) {
        // It's a save file
        saveData = {
          title: parsedData.title || "Untitled Game",
          lastPlayed: new Date().toISOString(),
          gameData: parsedData.gameData,
          state: parsedData.state
        };
      } else {
        // It's a map file
        saveData = {
          title: parsedData.title || "Untitled Game",
          lastPlayed: new Date().toISOString(),
          gameData: parsedData, 
          state: {} 
        };
      }
      
      localStorage.setItem(`ifr_save_${newId}`, JSON.stringify(saveData));
      router.push(`/play/${newId}`);
    } catch (e) {
      console.error("Failed to parse map/save file", e);
      alert("Invalid map/save file. Could not parse it.");
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
          <Text c="dimmed">Load a new map or continue your previously saved games.</Text>
        </div>

        <Dropzone
          onDrop={handleDrop}
          onReject={(files) => alert('File rejected. Must be a .ifr map or .json save file.')}
          maxSize={100 * 1024 ** 2}
          accept={{
            'application/json': ['.json'],
            'application/zip': ['.zip', '.ifr'],
            'application/x-zip-compressed': ['.zip', '.ifr'],
            'application/octet-stream': ['.ifr']
          }}
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
                Drag and drop a <Text span c="violet" fw={700}>map (.ifr)</Text> or <Text span c="violet" fw={700}>save file</Text> here
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Attach a map file to create a new slot, or a save file to resume progress
              </Text>
            </div>
          </Group>
        </Dropzone>

        {savedGames.length > 0 && (
          <div>
            <Title order={3} mb="md">Continue Playing</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {savedGames.map((game) => (
                <Card key={game.id} shadow="sm" padding="lg" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column' }}>
                  <Card.Section>
                    <LibraryGameCover game={game} />
                  </Card.Section>
                  <Card.Section withBorder p="md" mt={(game.gameData?.coverMediaId && game.gameData.mediaAssets?.find((a: any) => a.id === game.gameData.coverMediaId)) ? 0 : undefined}>
                    <Group justify="space-between">
                      <Title order={4} lineClamp={1}>{game.title}</Title>
                      <IconDeviceGamepad size={24} color="var(--mantine-color-violet-6)" />
                    </Group>
                  </Card.Section>

                  <Text size="sm" c="dimmed" mt="md" style={{ flexGrow: 1 }}>
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

        <div>
          <Title order={3} mb="md">Bespoke Games</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column' }}>
              <Card.Section>
                <div style={{ width: '100%', height: 180, overflow: 'hidden' }}>
                  <img
                    src="/club-bambi/induction.png"
                    alt="Club Bambi"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </Card.Section>
              
              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={600} size="lg">Club Bambi</Text>
                <Badge color="pink" variant="light" size="sm">Bespoke</Badge>
              </Group>

              <Text size="sm" c="dimmed" style={{ flexGrow: 1 }} mb="md">
                An interactive training simulation at the notorious Club Bambi. Can you survive the clients, manage your outfits, and pay off your debt?
              </Text>

              <Button fullWidth color="pink" mt="auto" radius="md" onClick={() => router.push('/club-bambi')}>
                Play Club Bambi
              </Button>
            </Card>
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  );
}
