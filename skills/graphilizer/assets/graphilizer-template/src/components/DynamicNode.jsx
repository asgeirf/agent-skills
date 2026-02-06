import { Handle, Position } from '@xyflow/react';

const handleStyle = { opacity: 0, width: 6, height: 6 };

function DynamicNode({ data }) {
  const { label, typeName, color, icon, dimmed, highlighted } = data;

  let iconEl;
  if (icon && /^https?:\/\//.test(icon)) {
    iconEl = <img src={icon} alt="" style={{ width: 20, height: 20 }} />;
  } else if (icon && icon.length <= 2) {
    iconEl = <span className="dynamic-node-emoji">{icon}</span>;
  } else {
    iconEl = (
      <span
        className="dynamic-node-dot"
        style={{ background: color, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }}
      />
    );
  }

  return (
    <div
      className={`dynamic-node ${dimmed ? 'dimmed' : ''} ${highlighted ? 'highlighted' : ''}`}
      style={{
        background: highlighted ? '#243044' : '#1e2a3a',
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#e0e0e0',
        fontSize: 13,
        boxShadow: highlighted ? `0 0 12px ${color}60, 0 0 4px ${color}40` : 'none',
        transition: 'box-shadow 0.4s ease, background 0.4s ease',
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
      <div className="dynamic-node-icon">{iconEl}</div>
      <div className="dynamic-node-content">
        <div className="dynamic-node-label">{label}</div>
        <div
          className="dynamic-node-badge"
          style={{ background: color + '20', color }}
        >
          {typeName}
        </div>
      </div>
    </div>
  );
}

export default DynamicNode;
