'use client';

import { Group } from '@mantine/core';
import { StudioCanvas } from '../../../components/studio/StudioCanvas';
import { Inspector } from '../../../components/studio/Inspector';

export default function CreatorStudioPage() {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <StudioCanvas />
      </div>
      <Inspector />
    </>
  );
}
