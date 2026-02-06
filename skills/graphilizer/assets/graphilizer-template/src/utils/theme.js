export const DEFAULT_PALETTE = [
  '#6c9bcf', '#e94560', '#53d769', '#ffd93d', '#a855f7',
  '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#f43f5e',
  '#8b5cf6', '#14b8a6',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getNodeTypeStyle(typeName, nodeTypes = {}) {
  const def = nodeTypes[typeName];
  if (def) {
    return {
      color: def.color || DEFAULT_PALETTE[hashString(typeName) % DEFAULT_PALETTE.length],
      icon: def.icon || null,
      borderStyle: def.borderStyle || 'solid',
      shape: def.shape || 'default',
    };
  }
  const idx = hashString(typeName) % DEFAULT_PALETTE.length;
  return {
    color: DEFAULT_PALETTE[idx],
    icon: null,
    borderStyle: 'solid',
    shape: 'default',
  };
}

export function getEdgeTypeStyle(typeName, edgeTypes = {}) {
  const def = edgeTypes[typeName];
  if (def) {
    return {
      color: def.color || DEFAULT_PALETTE[hashString(typeName) % DEFAULT_PALETTE.length],
      style: def.style || 'solid',
      animated: def.animated || false,
    };
  }
  const idx = hashString(typeName) % DEFAULT_PALETTE.length;
  return {
    color: DEFAULT_PALETTE[idx],
    style: 'solid',
    animated: false,
  };
}
