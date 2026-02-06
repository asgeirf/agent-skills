import { Handle, Position } from '@xyflow/react';

const handleStyle = { opacity: 0, width: 6, height: 6 };

function CardNode({ data }) {
  const { label, typeName, color, icon, dimmed, highlighted, description, tags, image } = data;

  let iconEl = null;
  if (image && /^https?:\/\//.test(image)) {
    iconEl = <img src={image} alt="" className="card-node-image" />;
  } else if (icon && icon.length <= 2) {
    iconEl = <span className="card-node-emoji">{icon}</span>;
  } else {
    iconEl = (
      <span className="card-node-dot" style={{ background: color }} />
    );
  }

  return (
    <div
      className={`card-node ${dimmed ? 'dimmed' : ''} ${highlighted ? 'highlighted' : ''}`}
      style={{
        background: highlighted ? '#243044' : '#1e2a3a',
        border: `2px solid ${color}`,
        borderRadius: 10,
        minWidth: 160,
        maxWidth: 220,
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

      <div className="card-node-visual">
        {iconEl}
      </div>
      <div className="card-node-content">
        <div className="card-node-label">{label}</div>
        <div className="card-node-badge" style={{ background: color + '20', color }}>{typeName}</div>
        {description && <div className="card-node-desc">{description}</div>}
        {tags && tags.length > 0 && (
          <div className="card-node-tags">
            {tags.map((tag, i) => (
              <span key={i} className="card-node-tag" style={{ borderColor: color + '50', color: color }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardNode;
