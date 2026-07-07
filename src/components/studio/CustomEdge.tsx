import { BaseEdge, EdgeLabelRenderer, EdgeProps } from '@xyflow/react';
import { useStudioStore } from '../../store/studioStore';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const { setSelectedEdge } = useStudioStore();
  const offset = (data?.offset as number) || 0;
  
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const midX = sourceX + dx / 2;
  const midY = sourceY + dy / 2;
  
  // Normalize perpendicular vector
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  
  // Control point pushed outward by offset amount
  const cx = midX + nx * offset;
  const cy = midY + ny * offset;

  // SVG Quadratic Bezier Curve
  const edgePath = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;

  // Bezier curve evaluation at t=0.5 for label placement
  const labelX = 0.5 * (midX + cx);
  const labelY = 0.5 * (midY + cy);

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: data.isDefault ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-yellow-filled)',
              padding: '2px 8px',
              borderRadius: 4,
              color: data.isDefault ? 'white' : 'black',
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: 'all',
              cursor: 'pointer'
            }}
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEdge(id);
            }}
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
