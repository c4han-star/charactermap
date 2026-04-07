# ARCHITECTURE.md

## Project: Character Relationship Tracker
**Client:** Youngpyung Lee  
**Developer:** Finnick Chen

---

## 1. Core Design Philosophy

The central deliverable of this app is not a database, not an AI pipeline, and not a filter — it is a **relationship map that makes complex character networks immediately understandable at a glance**.

Every architectural decision should be evaluated against one question: does this make the graph clearer and more useful?

---

## 2. Relationship Graph: The Soul of the App

### 2.1 What the Graph Needs to Communicate

A user landing on the map view should be able to answer these questions within seconds, without reading any prose:

- Who are the main characters? (importance / centrality)
- How are two specific characters connected? (edge label + type)
- Are these characters on the same side? (visual grouping / color)
- Who is connected to whom indirectly? (graph traversal, reachable at a glance)

These four goals drive every decision below.

### 2.2 Node Design: Characters

Each character is a node. The node must carry enough information to be identifiable without being cluttered.

**Node anatomy:**

```
┌─────────────────────┐
│   [avatar / icon]   │
│                     │
│    Character Name   │
│  [ role badge ]     │
└─────────────────────┘
```

- **Size encodes importance.** Protagonist nodes are larger than supporting nodes, which are larger than minor nodes. This immediately draws the eye to the characters that matter most, matching how a reader mentally organizes a cast.
- **Color encodes faction or group.** Characters belonging to the same family, organization, or side share a hue. This is the most powerful visual signal for "are these people aligned?"
- **Role badge** (small pill label: Protagonist / Antagonist / Supporting) provides a secondary text cue without dominating the visual.
- **Avatar** is optional but significantly improves recognizability for drama/series use cases where character faces are known.

**Node states:**

| State | Visual |
|---|---|
| Default | Normal size, faction color, soft shadow |
| Hovered | Slight scale-up, highlight ring, connected edges brighten |
| Selected | Strong highlight ring, all non-connected nodes dim (focus mode) |
| Filtered out | Hidden entirely — absent nodes reduce visual noise |

### 2.3 Edge Design: Relationships

Each relationship is an edge. The edge must communicate type, direction, and weight without requiring the user to read a legend first.

**Color encodes relationship type** — a consistent vocabulary used across the entire app:

| Type | Color | Rationale |
|---|---|---|
| Family | Amber / warm gold | Warmth, heritage |
| Romantic | Rose / soft red | Convention; immediately legible |
| Ally / Friend | Teal / green | Trust, cooperation |
| Rival / Enemy | Crimson | Conflict, tension |
| Neutral | Grey | Background noise |
| Other | Purple | Unusual or complex bonds |

**Line style encodes certainty:**
- Solid line: confirmed, known relationship
- Dashed line: secret, suspected, or one-sided relationship

**Arrow encodes direction.** Directed relationships (unrequited feeling, mentor→student) get an arrowhead on the target end. Mutual relationships have no arrowhead.

**Edge thickness** optionally encodes narrative significance — a central romance feels heavier than a passing acquaintance.

**Edge label** sits at the midpoint of the edge: "rivals", "siblings", "former allies". The color is the fast visual signal; the label is the confirmation. Both are needed.

**Edge interaction:**
- Hovering an edge highlights both connected nodes and shows a tooltip with the full relationship description.
- When a node is selected, edges to non-connected nodes dim so only that character's connections remain clearly visible.

### 2.4 Layout Strategy

Graph layout is one of the hardest problems in network visualization. A poor layout makes even simple graphs look like spaghetti.

**Default: force-directed layout via `elkjs`**

React Flow does not provide built-in physics layout, so we integrate `elkjs` (Eclipse Layout Kernel) to compute initial node positions. Force-directed layouts naturally cluster connected characters together and push unrelated characters apart — this matches narrative structure well (allies cluster, rivals sit across from each other).

**Constraints applied on top of the simulation:**

1. **Protagonist anchoring.** Main characters are pinned near the center. Supporting characters orbit outward. This prevents the protagonist from being pushed to a corner by the physics.
2. **Faction grouping.** Characters sharing a faction color receive a mild attractive force toward a shared centroid, producing readable clusters without hard boundaries.
3. **Edge length by relationship type.** Family and romantic edges are shorter (closeness = proximity); rival and neutral edges are longer. Layout geometry reinforces the semantic meaning.

**User control:**
- Nodes are draggable. Positions are saved to `graph_layouts` in Supabase and restored on next visit.
- "Reset Layout" button reruns the force simulation from scratch.
- Zoom and pan are always enabled.

### 2.5 Focus Mode (Click Interaction)

When a user clicks a character node:

1. All nodes and edges **not directly connected** to that character fade to 20% opacity.
2. A **Character Detail Panel** slides in from the right (bottom on mobile).
3. The panel shows name, role, faction, description, and a sorted list of relationships.
4. Clicking a relationship entry in the panel **animates the graph** to highlight that specific edge and its two endpoints.
5. Clicking the background or pressing Escape exits focus mode and restores full opacity.

This interaction answers the user's most common question: *"who is this person and how do they connect to characters I already know?"*

### 2.6 Character Detail Panel

The panel stays open alongside the graph — not a modal — so the user reads relationship details while keeping the visual context in view.

```
┌─────────────────────────────────┐
│ [avatar]  Character Name        │
│           Protagonist · House A │
│                                 │
│ Description                     │
│ Short bio or extracted summary  │
│                                 │
│ Relationships                   │
│ ● [rose]   Loves →  Character B │
│ ● [amber]  Sibling  Character C │
│ ● [red]    Rivals ← Character D │
└─────────────────────────────────┘
```

The colored dot on each relationship entry matches the edge color on the graph, reinforcing the visual vocabulary established in section 2.3.

---

## 3. Data Model

The schema is designed to serve the graph renderer directly — every column maps to a visible property of a node or edge.

### `stories`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `title` | `text` | |
| `media_type` | `enum('novel','drama','film','series','other')` | |
| `total_units` | `integer` | Total chapters or episodes |
| `description` | `text` | |

### `characters`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `story_id` | `uuid` (FK) | |
| `name` | `text` | |
| `role` | `enum('protagonist','antagonist','supporting','minor')` | → node size |
| `faction` | `text` | → node color group |
| `description` | `text` | Shown in detail panel |
| `image_url` | `text` | Optional avatar |
| `introduced_at_unit` | `integer` | For progress filter |

### `relationships`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `story_id` | `uuid` (FK) | |
| `source_character_id` | `uuid` (FK) | |
| `target_character_id` | `uuid` (FK) | |
| `label` | `text` | Short phrase shown on edge midpoint |
| `relationship_type` | `enum('family','romantic','ally','rival','neutral','other')` | → edge color |
| `is_directed` | `boolean` | → arrowhead rendering |
| `strength` | `integer (1–3)` | → edge thickness |
| `notes` | `text` | Full description in hover tooltip and panel |
| `introduced_at_unit` | `integer` | For progress filter |

### `graph_layouts`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `story_id` | `uuid` (FK) | |
| `layout_data` | `jsonb` | `{ [characterId]: { x: number, y: number } }` |
| `updated_at` | `timestamptz` | |

### DB → React Flow Transform (`graphUtils.ts`)

```typescript
const nodes: Node[] = characters.map(c => ({
  id: c.id,
  type: 'characterNode',
  position: layoutData[c.id] ?? computedPosition(c),
  data: {
    name: c.name,
    role: c.role,        // → node size class
    faction: c.faction,  // → node color
    imageUrl: c.image_url,
    description: c.description,
  }
}));

const edges: Edge[] = relationships.map(r => ({
  id: r.id,
  source: r.source_character_id,
  target: r.target_character_id,
  type: 'relationshipEdge',
  markerEnd: r.is_directed ? { type: MarkerType.ArrowClosed } : undefined,
  data: {
    label: r.label,
    relationshipType: r.relationship_type, // → edge color
    strength: r.strength,                  // → edge thickness
    notes: r.notes,
  }
}));
```

---

## 4. AI Extraction Pipeline

AI reduces the friction of populating the graph with real data. Its output feeds the data model above.

**Flow:**
1. User pastes raw story text into `StoryInputModal`
2. Client posts to `POST /api/extract` (server-side; API key never reaches the browser)
3. Server sends a structured prompt to Claude requesting JSON output matching the schema
4. Response is validated with Zod; failures surface a descriptive error to the user
5. Valid data is written to Supabase (additive merge — not overwrite)
6. Graph re-fetches and renders the new nodes and edges

**Key extraction instructions to Claude:**
- Return only valid JSON, no prose, no markdown fences
- For each character: name, role, faction (infer from alliances/family groupings), short description
- For each relationship: source name, target name, label, type from fixed enum, is_directed, notes
- Normalize character names (nickname and full name → single entry)
- On ambiguous name match, flag it rather than guess

**Merge strategy:** new characters matched by normalized name. Exact match → skip or fill empty fields. New relationship between existing characters → insert if not present. Ambiguous match → surface disambiguation UI before writing to DB.

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js App Router | Server Components for data fetching, Client Components for interactive graph, API Routes for AI calls |
| Graph rendering | React Flow + elkjs | React Flow handles all interaction; elkjs computes force-directed layouts with constraints |
| Database | Supabase (Postgres) | Relational model fits character/relationship structure naturally |
| Styling | Tailwind CSS | Fast iteration; color vocabulary enforced via CSS variables |
| AI extraction | Claude API (server-side) | Strong structured output, reliable JSON schema following |
| Schema validation | Zod | Validates AI output before any DB write |

---

## 6. Check-in Milestones

### Check-in 1 — Foundation
- Initialize Next.js + Supabase, migrate schema
- Homepage and story selection page with hardcoded sample data
- `CharacterNode` and `RelationshipEdge` custom components rendering correctly in React Flow with static props
- Color vocabulary and node size scale defined and applied — the visual language is established before any real data

### Check-in 2 — Core Graph Experience
- `graphUtils.ts`: DB rows → React Flow nodes and edges
- elkjs layout with protagonist anchoring and faction grouping
- Focus mode: click node → dim others → `CharacterDetailPanel` slides in
- Edge hover tooltip
- End-to-end: real data from Supabase renders and is interactive in the map

### Check-in 3 — AI Input + Polish
- `POST /api/extract` Claude pipeline with Zod validation
- `StoryInputModal`: paste text → extract → map updates live
- Persist and restore user node positions via `graph_layouts`
- Spoiler progress filter (query-layer `introduced_at_unit`)
- Loading states, empty states, error handling
- Demo-ready with at least one fully populated story
