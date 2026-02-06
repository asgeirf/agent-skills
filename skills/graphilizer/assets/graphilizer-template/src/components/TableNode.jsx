import { Handle, Position } from '@xyflow/react';

const handleStyle = { opacity: 0, width: 6, height: 6 };

function TableNode({ data }) {
  const { label, typeName, color, icon, dimmed, highlighted, rows } = data;

  return (
    <div
      className={`table-node ${dimmed ? 'dimmed' : ''} ${highlighted ? 'highlighted' : ''}`}
      style={{
        background: '#1e2a3a',
        border: `2px solid ${color}`,
        borderRadius: 8,
        minWidth: 180,
        overflow: 'hidden',
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

      {/* Header */}
      <div
        className="table-node-header"
        style={{ background: color + '30', borderBottom: `1px solid ${color}40` }}
      >
        {icon && <span className="table-node-icon">{icon}</span>}
        <span className="table-node-title">{label}</span>
        <span className="table-node-badge" style={{ background: color + '30', color }}>{typeName}</span>
      </div>

      {/* Rows */}
      {rows && rows.length > 0 && (
        <div className="table-node-body">
          {rows.map((row, i) => (
            <div key={i} className="table-node-row">
              <span className="table-node-key">{row.key}</span>
              <span className="table-node-value">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TableNode;
