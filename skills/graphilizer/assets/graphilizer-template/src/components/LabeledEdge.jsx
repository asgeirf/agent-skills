import { getBezierPath } from '@xyflow/react';

function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  animated,
}) {
  const { label, color, dashStyle, timelineState } = data || {};

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let strokeDasharray = 'none';
  if (dashStyle === 'dashed') strokeDasharray = '8 4';
  else if (dashStyle === 'dotted') strokeDasharray = '2 4';

  // Three-state timeline styling
  const isFuture = timelineState === 'future';
  const isActive = timelineState === 'active';

  const edgeOpacity = isFuture ? 0.12 : 1;
  const strokeWidth = isActive ? 3 : 2;
  const labelOpacity = isFuture ? 0.12 : isActive ? 1 : 0.7;

  return (
    <g style={{ opacity: edgeOpacity, transition: 'opacity 0.4s ease' }}>
      {/* Glow behind active edge */}
      {isActive && (
        <path
          d={edgePath}
          style={{
            stroke: color,
            strokeWidth: 8,
            strokeDasharray: 'none',
            fill: 'none',
            opacity: 0.25,
            filter: 'blur(4px)',
          }}
        />
      )}
      <path
        d={edgePath}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray,
          fill: 'none',
          ...style,
        }}
        markerEnd={markerEnd}
      />
      {isActive && (
        <circle r={5} fill={color} opacity={0.95}>
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
      {label && (
        <foreignObject
          x={labelX - 50}
          y={labelY - 12}
          width={100}
          height={24}
          className="edge-label-container"
          style={{ opacity: labelOpacity, transition: 'opacity 0.4s ease' }}
        >
          <div
            className="edge-label"
            style={{
              background: isActive ? color + '50' : color + '30',
              color: '#e0e0e0',
              border: `1px solid ${color}${isActive ? '80' : '40'}`,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default LabeledEdge;
