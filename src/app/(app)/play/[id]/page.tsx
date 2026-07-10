'use client'
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Text, Center, Loader } from '@mantine/core';
import { PlayerEngine } from '@/engine/PlayerEngine';

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [saveData, setSaveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(`ifr_save_${id}`);
    if (!raw) {
      alert("Save file not found!");
      router.push('/');
      return;
    }
    
    try {
      const parsed = JSON.parse(raw);
      setSaveData(parsed);
    } catch (e) {
      console.error(e);
      alert("Save file is corrupted.");
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  if (loading) {
    return <Center h="100vh"><Loader size="xl" color="violet" /></Center>;
  }

  if (!saveData) {
    return null;
  }

  return (
    <PlayerEngine initialSaveData={saveData} saveId={id} />
  );
}
