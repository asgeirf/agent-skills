function DetailPanel({ selectedNode, nodes, edges, onSelectNode, onClose, nodeTypes }) {
  if (!selectedNode) return null;

  const { label, typeName, color, icon, metadata } = selectedNode.data || {};
  const def = (nodeTypes || {})[typeName] || {};

  // Find connections
  const incoming = edges
    .filter((e) => e.target === selectedNode.id)
    .map((e) => {
      const source = nodes.find((n) => n.id === e.source);
      return { edge: e, node: source };
    });

  const outgoing = edges
    .filter((e) => e.source === selectedNode.id)
    .map((e) => {
      const target = nodes.find((n) => n.id === e.target);
      return { edge: e, node: target };
    });

  let iconEl = null;
  if (icon && /^https?:\/\//.test(icon)) {
    iconEl = <img src={icon} alt="" style={{ width: 28, height: 28 }} />;
  } else if (icon && icon.length <= 2) {
    iconEl = <span style={{ fontSize: 24 }}>{icon}</span>;
  } else {
    iconEl = (
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: color, display: 'inline-block' }} />
    );
  }

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={onClose}>&times;</button>

      <div className="detail-header">
        <div className="detail-icon">{iconEl}</div>
        <div className="detail-title">{label}</div>
        <div className="detail-badge" style={{ background: (color || '#6c9bcf') + '20', color: color || '#6c9bcf' }}>
          {typeName}
        </div>
      </div>

      {metadata && Object.keys(metadata).length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Details</div>
          <table className="detail-table">
            <tbody>
              {Object.entries(metadata).map(([key, value]) => (
                <tr key={key}>
                  <td className="detail-key">{key}</td>
                  <td className="detail-value">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {incoming.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">From ({incoming.length})</div>
          {incoming.map(({ edge, node }) => (
            <button
              key={edge.id}
              className="detail-connection"
              onClick={() => node && onSelectNode(node)}
            >
              <span className="detail-connection-label">
                {node?.data?.label || edge.source}
              </span>
              {edge.data?.label && (
                <span className="detail-connection-edge">{edge.data.label}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">To ({outgoing.length})</div>
          {outgoing.map(({ edge, node }) => (
            <button
              key={edge.id}
              className="detail-connection"
              onClick={() => node && onSelectNode(node)}
            >
              <span className="detail-connection-label">
                {node?.data?.label || edge.target}
              </span>
              {edge.data?.label && (
                <span className="detail-connection-edge">{edge.data.label}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DetailPanel;
