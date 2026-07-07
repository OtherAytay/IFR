'use client';

import { Group } from '@mantine/core';
import { StudioCanvas } from '../../../components/studio/StudioCanvas';
import { Inspector } from '../../../components/studio/Inspector';

export default function CreatorStudioPage() {
  return (
    <Group style={{ height: 'calc(100vh - 7rem)', width: '100%', overflow: 'hidden' }} align="stretch" gap={0} wrap="nowrap">
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        <StudioCanvas />
      </div>
      <Inspector />
    </Group>
  );
}
