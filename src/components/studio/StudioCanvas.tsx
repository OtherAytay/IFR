'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
  Node,
  Edge as RFEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@mantine/core';
import { useStudioStore } from '../../store/studioStore';
import { SceneNode } from './SceneNode';
import { CustomEdge } from './CustomEdge';

const edgeTypes = {
  custom: CustomEdge,
};

const nodeTypes = {
  scene: SceneNode,
};

export function StudioCanvas() {
  const { game, addScene, updateScenePosition, addEdge, setSelectedNode, setSelectedEdge } = useStudioStore();

  const nodes: Node[] = useMemo(() => {
    return Object.values(game.scenes).map((scene) => ({
      id: scene.id,
      type: 'scene',
      position: scene.editorMetadata?.position || { x: 0, y: 0 },
      data: { scene },
    }));
  }, [game.scenes]);

  const edges: RFEdge[] = useMemo(() => {
    const allEdges: RFEdge[] = [];
    const pairCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    Object.values(game.edges).forEach((sourceEdges) => {
      sourceEdges.forEach((edge) => {
        // Track per-source count for numbering
        const sCount = sourceCounts[edge.sourceSceneId] || 0;
        sourceCounts[edge.sourceSceneId] = sCount + 1;
        
        // A branch is only visually default (blue) if it mathematically has 0 conditions
        const isDefault = !edge.conditionGroup || edge.conditionGroup.conditions.length === 0;

        // Track undirected pair count for unique geometric arcing
        const scene1 = edge.sourceSceneId < edge.targetSceneId ? edge.sourceSceneId : edge.targetSceneId;
        const scene2 = edge.sourceSceneId < edge.targetSceneId ? edge.targetSceneId : edge.sourceSceneId;
        const pairKey = `${scene1}-${scene2}`;
        
        const count = pairCounts[pairKey] || 0;
        pairCounts[pairKey] = count + 1;

        // Base geometric sequence: 0, 60, -60, 120, -120
        const offsetMagnitude = Math.floor((count + 1) / 2) * 60;
        const offsetSign = count % 2 === 1 ? 1 : -1;
        const geometricOffset = count === 0 ? 0 : offsetMagnitude * offsetSign;

        // If the edge direction is inverted relative to our normalized pair string, 
        // we must invert the offset to occupy the exact assigned geometric arc.
        const isAligned = edge.sourceSceneId === scene1;
        const curveOffset = isAligned ? geometricOffset : -geometricOffset;

        allEdges.push({
          id: edge.id,
          source: edge.sourceSceneId,
          target: edge.targetSceneId,
          type: 'custom',
          data: {
            label: edge.name || `Edge ${sCount + 1}`,
            offset: curveOffset,
            isDefault
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: isDefault ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-yellow-filled)',
          },
          style: { 
            strokeWidth: 2, 
            stroke: isDefault ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-yellow-filled)' 
          },
        });
      });
    });
    return allEdges;
  }, [game.edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateScenePosition(change.id, change.position.x, change.position.y);
        }
      });
    },
    [updateScenePosition]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // For now, we ignore edge deletion from canvas, but we can wire it up later
    },
    []
  );

  const isValidConnection = useCallback(
    (connection: Connection) => connection.source !== connection.target,
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addEdge(params.source, params.target);
      }
    },
    [addEdge]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left">
          <Button onClick={() => addScene(100, 100)}>Add Scene</Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
