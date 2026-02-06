import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

function SearchPanel({
  nodes,
  edges,
  searchIndex,
  nodeTypes,
  edgeTypes,
  activeNodeTypes,
  toggleNodeType,
  activeGroups,
  toggleGroup,
  availableTypes,
  availableGroups,
  matchCount,
  totalCount,
  onSelectResult,
  focusDepth,
  onFocusDepthChange,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return searchIndex
      .filter((item) => item.searchText.includes(q))
      .slice(0, 10);
  }, [query, searchIndex]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [results]);

  // Show dropdown when query has results
  useEffect(() => {
    setOpen(results.length > 0 && query.trim().length > 0);
  }, [results, query]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectResult = useCallback(
    (item) => {
      setQuery('');
      setOpen(false);
      onSelectResult(item);
    },
    [onSelectResult]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[highlightIdx]) {
        e.preventDefault();
        selectResult(results[highlightIdx]);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [open, results, highlightIdx, selectResult]
  );

  // Find source/target labels for edge results
  const nodeLabels = useMemo(() => {
    const map = {};
    for (const n of nodes) {
      if (n.data?.label) map[n.id] = n.data.label;
    }
    return map;
  }, [nodes]);

  return (
    <div className="search-panel" ref={panelRef}>
      {/* Autocomplete search */}
      <div className="search-section">
        <div className="autocomplete-wrap">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="search-input"
          />
          {open && (
            <div className="autocomplete-dropdown">
              {results.map((item, i) => (
                <button
                  key={item.id}
                  className={`autocomplete-item ${i === highlightIdx ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHighlightIdx(i)}
                  onClick={() => selectResult(item)}
                >
                  {item.kind === 'node' ? (
                    <>
                      <span className="ac-icon">
                        {item.icon && item.icon.length <= 2
                          ? item.icon
                          : null}
                        {(!item.icon || item.icon.length > 2) && (
                          <span
                            className="ac-dot"
                            style={{ background: item.color }}
                          />
                        )}
                      </span>
                      <span className="ac-label">{item.label}</span>
                      <span
                        className="ac-badge"
                        style={{
                          background: item.color + '25',
                          color: item.color,
                        }}
                      >
                        {item.typeName}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="ac-icon ac-edge-icon">
                        <svg width="14" height="14" viewBox="0 0 14 14">
                          <path
                            d="M2 7h10M9 4l3 3-3 3"
                            stroke={item.color || '#8b949e'}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </span>
                      <span className="ac-label">{item.label || ''}</span>
                      <span className="ac-sublabel">
                        {nodeLabels[item.source] || item.source} {'\u2192'}{' '}
                        {nodeLabels[item.target] || item.target}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="search-count">
          {matchCount} of {totalCount}
        </div>
      </div>

      {/* Depth slider */}
      <div className="panel-section">
        <div className="section-title">Depth</div>
        <div className="depth-slider-wrap">
          <label className="depth-label">
            <strong>{focusDepth}</strong>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={focusDepth}
            onChange={(e) => onFocusDepthChange(Number(e.target.value))}
            className="depth-slider"
          />
        </div>
      </div>

      {/* Node Type Toggles */}
      {availableTypes.length > 0 && (
        <div className="panel-section">
          <div className="section-title">Types</div>
          <div className="toggle-pills">
            {availableTypes.map((type) => {
              const def = nodeTypes[type] || {};
              const color = def.color || '#6c9bcf';
              const active = activeNodeTypes.has(type);
              return (
                <button
                  key={type}
                  className={`type-pill ${active ? 'active' : ''}`}
                  style={{ '--pill-color': color }}
                  onClick={() => toggleNodeType(type)}
                >
                  {def.icon && def.icon.length <= 2 && (
                    <span className="pill-icon">{def.icon}</span>
                  )}
                  {(!def.icon || def.icon.length > 2) && (
                    <span
                      className="pill-dot"
                      style={{ background: active ? '#fff' : color }}
                    />
                  )}
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Group Toggles */}
      {availableGroups.length > 0 && (
        <div className="panel-section">
          <div className="section-title">Groups</div>
          <div className="toggle-pills">
            {availableGroups.map((group) => {
              const active = activeGroups.has(group);
              return (
                <button
                  key={group}
                  className={`group-pill ${active ? 'active' : ''}`}
                  onClick={() => toggleGroup(group)}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPanel;
