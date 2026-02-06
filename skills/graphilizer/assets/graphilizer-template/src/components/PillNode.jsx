import { Handle, Position } from '@xyflow/react';

const handleStyle = { opacity: 0, width: 6, height: 6 };

function PillNode({ data }) {
  const { label, color, icon, dimmed, highlighted } = data;

  return (
    <div
      className={`pill-node ${dimmed ? 'dimmed' : ''} ${highlighted ? 'highlighted' : ''}`}
      style={{
        background: highlighted ? color + '35' : color + '20',
        border: `1.5px solid ${color}`,
        borderRadius: 20,
        padding: '4px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        boxShadow: highlighted ? `0 0 10px ${color}50` : 'none',
        transition: 'box-shadow 0.4s ease, background 0.4s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <Handle type="target" position={Position.Top} id="t-top" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="t-left" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="t-right" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="s-top" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="s-left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-right" style={handleStyle} />

      {icon && <span className="pill-node-icon">{icon}</span>}
      <span className="pill-node-label" style={{ color: '#e0e0e0' }}>{label}</span>
    </div>
  );
}

export default PillNode;
