---
name: graphilizer
description: Generate interactive graph visualizations in the browser from any data - codebases, infrastructure, relationships, knowledge maps
triggers:
  - interactive graph
  - explore graph
  - visualize relationships
  - knowledge graph
  - dependency graph
  - network diagram
  - graphilizer
---

# Graphilizer Skill

Generate interactive graph visualizations that open in the browser for live exploration. You describe a domain — codebases, infrastructure, relationships, knowledge maps, anything — and this skill produces a React Flow app with search, filtering, and detail inspection. Unlike flow-graph which records videos, graphilizer keeps a live dev server running so the user can pan, zoom, click nodes, and explore.

## Workflow

### 1. Understand the Request

Parse the user's description to identify:
- **Domain** — what kind of data is being visualized (codebase, infrastructure, relationships, etc.)
- **Node types** — categories of entities (e.g. `service`, `database`, `user` for infrastructure)
- **Edge types** — categories of relationships (e.g. `depends-on`, `calls`, `reads-from`)
- **Grouping** — logical clusters of related nodes

### 2. Define Node and Edge Types

Create domain-specific type definitions in `settings.nodeTypes` and `settings.edgeTypes`. Each type gets a color, optional icon (emoji or image URL), and optional border/line style. Types are fully custom — define whatever makes sense for the domain.

### 3. Generate Graph JSON

Create the graph data JSON following the schema in [references/graphilizer-schema.md](references/graphilizer-schema.md).

```json
{
  "settings": {
    "title": "My Service Map",
    "description": "Production microservices and their dependencies",
    "layout": { "direction": "LR", "nodeSpacing": 80, "rankSpacing": 120 },
    "nodeTypes": {
      "service": { "color": "#4A90D9", "icon": "🔧" },
      "database": { "color": "#E8A838", "icon": "🗄️" }
    },
    "edgeTypes": {
      "calls": { "color": "#4A90D9", "style": "solid", "animated": true },
      "reads": { "color": "#E8A838", "style": "dashed" }
    }
  },
  "groups": [
    { "id": "backend", "label": "Backend Services" }
  ],
  "nodes": [
    { "id": "api", "label": "API Gateway", "type": "service", "group": "backend", "metadata": { "language": "Go", "team": "platform" } },
    { "id": "db", "label": "PostgreSQL", "type": "database", "metadata": { "version": "15", "size": "200GB" } }
  ],
  "edges": [
    { "id": "e1", "source": "api", "target": "db", "label": "queries", "type": "reads" }
  ]
}
```

### 4. Write the JSON File

Write the graph JSON to a temporary file, e.g. `/tmp/graphilizer-data.json`.

### 5. Setup (first run only)

Install the skill's dependencies if not yet done:

```bash
cd <skill-dir> && npm install --prefer-offline --no-audit --no-fund
cd <skill-dir>/assets/graphilizer-template && npm install --prefer-offline --no-audit --no-fund
```

Where `<skill-dir>` is the directory containing this SKILL.md file.

### 6. Launch the Interactive Visualization

Run the serve script:

```bash
node <skill-dir>/scripts/serve.mjs /tmp/graphilizer-data.json --open
```

This starts a Vite dev server and opens the visualization in the user's default browser. The server stays running until the user is done exploring.

## Key Points

- **Node and edge types are domain-agnostic** — define whatever types make sense for the use case
- **Icons** can be emojis, image URLs, or omitted entirely (shows a colored dot)
- **Positions are optional** — dagre auto-layout handles positioning when positions are not specified
- **Metadata** on nodes and edges is freeform key-value data that appears in the detail panel when clicked
- **Groups** cluster related nodes visually with a labeled container
- **Search** filters across labels and metadata values
- **Types not in the definitions** get auto-assigned colors from a default palette

## Example: Breaking Bad Character Network

```json
{
  "settings": {
    "title": "Breaking Bad",
    "description": "Character relationships",
    "layout": { "direction": "TB", "nodeSpacing": 100, "rankSpacing": 150 },
    "nodeTypes": {
      "protagonist": { "color": "#4CAF50", "icon": "🧪" },
      "antagonist": { "color": "#F44336", "icon": "💀" },
      "family": { "color": "#2196F3", "icon": "👨‍👩‍👦" },
      "dea": { "color": "#FF9800", "icon": "🔫" }
    },
    "edgeTypes": {
      "family": { "color": "#2196F3", "style": "solid" },
      "business": { "color": "#4CAF50", "style": "dashed", "animated": true },
      "conflict": { "color": "#F44336", "style": "dotted" }
    }
  },
  "groups": [
    { "id": "white-family", "label": "White Family" },
    { "id": "cartel", "label": "Drug Trade" }
  ],
  "nodes": [
    { "id": "walt", "label": "Walter White", "type": "protagonist", "group": "white-family", "metadata": { "alias": "Heisenberg", "occupation": "Chemistry Teacher" } },
    { "id": "jesse", "label": "Jesse Pinkman", "type": "protagonist", "group": "cartel", "metadata": { "role": "Cook", "catchphrase": "Yeah, science!" } },
    { "id": "skyler", "label": "Skyler White", "type": "family", "group": "white-family" },
    { "id": "hank", "label": "Hank Schrader", "type": "dea", "metadata": { "role": "DEA Agent" } },
    { "id": "gus", "label": "Gus Fring", "type": "antagonist", "group": "cartel", "metadata": { "front": "Los Pollos Hermanos" } }
  ],
  "edges": [
    { "id": "e1", "source": "walt", "target": "jesse", "label": "partners", "type": "business" },
    { "id": "e2", "source": "walt", "target": "skyler", "label": "married", "type": "family" },
    { "id": "e3", "source": "hank", "target": "skyler", "label": "in-laws", "type": "family" },
    { "id": "e4", "source": "walt", "target": "gus", "label": "rivals", "type": "conflict" },
    { "id": "e5", "source": "gus", "target": "jesse", "label": "employer", "type": "business" }
  ]
}
```

## Schema Reference

See [references/graphilizer-schema.md](references/graphilizer-schema.md) for the complete JSON format specification.
