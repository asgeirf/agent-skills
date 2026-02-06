import { useState } from 'react';

function Legend({ nodeTypes, edgeTypes }) {
  const [collapsed, setCollapsed] = useState(false);

  const nodeEntries = Object.entries(nodeTypes || {});
  const edgeEntries = Object.entries(edgeTypes || {});

  if (nodeEntries.length === 0 && edgeEntries.length === 0) return null;

  return (
    <div className="legend">
      <button className="legend-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? 'Legend \u25B2' : 'Legend \u25BC'}
      </button>
      {!collapsed && (
        <div className="legend-content">
          {nodeEntries.length > 0 && (
            <div className="legend-section">
              <div className="legend-section-title">Nodes</div>
              {nodeEntries.map(([name, def]) => (
                <div key={name} className="legend-item">
                  <span
                    className="legend-dot"
                    style={{ background: def.color || '#6c9bcf' }}
                  />
                  <span className="legend-label">{name}</span>
                </div>
              ))}
            </div>
          )}
          {edgeEntries.length > 0 && (
            <div className="legend-section">
              <div className="legend-section-title">Edges</div>
              {edgeEntries.map(([name, def]) => {
                const dashStyle = def.style === 'dashed' ? '6 3' : def.style === 'dotted' ? '2 3' : 'none';
                return (
                  <div key={name} className="legend-item">
                    <svg width="24" height="10" className="legend-line">
                      <line
                        x1="0" y1="5" x2="24" y2="5"
                        stroke={def.color || '#6c9bcf'}
                        strokeWidth="2"
                        strokeDasharray={dashStyle}
                      />
                    </svg>
                    <span className="legend-label">{name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Legend;
