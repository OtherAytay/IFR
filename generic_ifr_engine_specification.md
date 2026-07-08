# Generic Interactive FapRoulette (IFR) Engine - Project Specification

## 1. Project Overview
The goal of this project is to build a fully generic, client-side execution engine and Creator Studio for Interactive FapRoulettes. The platform empowers non-technical creators to build highly interactive, state-driven, and media-rich games (similar to the Club Bambi experience) using a visual node-based editor, without writing code.

The entire application runs **100% client-side** with no centralized backend or database, maximizing privacy, portability, and minimizing infrastructure costs.

## 2. Tech Stack & Architecture
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **State Management:** Zustand (for complex editor state)
- **Creator Studio Canvas:** React Flow (for visual node editing)
- **Data Persistence (Player & Creator):** Both the player engine and creator studio automatically persist data via IndexedDB/localStorage to survive reloads, and both feature easily accessible export/import functionality to save progress or workspaces to local JSON files.
- **Styling:** Mantine (inherited from existing project) + custom CSS modules where necessary.

## 3. Data Model & Core Concepts

### 3.1 The `.json` Game File
A game is fully defined by a single exported `game.json` file. This file contains:
- **Global Variables:** Custom user-defined variables (Number, String, Boolean) that persist for the entire game.
- **Local Variables:** Scoped specifically to a Scene. By default, they expire when the player leaves the scene. However, their values can be explicitly mapped and forwarded to the next scene via **Payload Mappings**.
- **Tags:** Boolean flags applied to the player (e.g., `LOCKED`, `SENSITIVE`) that can expire after a set duration, or can be managed manually via scene and edge mutations (e.g., expiring after a specific scene is handled).
- **Theme Settings:** Primary color, background color, and font selections.
- **Node Graph:** A dictionary of Scene Nodes and their connecting Edges.

### 3.2 Scenes (Formerly Nodes) and Blocks
To clarify nomenclature: what were previously referred to as "nodes" in rigid engines are now **Scenes**. Scenes represent a single "Screen" or "View" presented to the player. The atomic functional pieces that make up a Scene are now encapsulated as **Blocks**. Creators can add multiple blocks of any type to a single Scene.

**Block Types:**
1. **Media Block:** External URLs or base64 data URIs for images, video, or audio.
2. **Content Block:** Text descriptions utilizing a templating engine to inject variables (e.g., "Your debt is ${{debt}}").
3. **Task Block (Native):** A native UI component featuring a countdown timer and visual/audio metronome (BPM).
4. **Interaction Block:** The required action to progress. Can be a `Continue` button, a `Choice` (multiple buttons), or a `Roll` (RNG).
   - **Rolls** support two modes: **Simple Integer** (returns 1 to maxRoll) and **Mapped Distribution**. In Mapped Distribution mode, creators define branches with specific weights and text labels (e.g., 1-3 is "Do a flip"). The engine handles calculating ranges and rendering a visual table of outcomes. Upon rolling, the local variable stores the mapped text label directly, avoiding the need for multiple edge mutations.

**Layout Presets:**
Nodes feature a `layoutPreset` (e.g., "Standard Split", "Grid", "Fullscreen Media", "Stacked"). The engine reads this preset and automatically organizes the arrays of blocks gracefully.

### 3.3 Edges, Conditions, Mutations, and Payload Mapping
Edges connect nodes and dictate the flow of the game. **Multiple distinct edges can connect the exact same two nodes**, allowing for different routing logic or background mutations.

**Evaluation & Routing:**
- Edges extending from an Interaction Block (like a Roll or Choice) are evaluated in a strict, **creator-defined priority order**.
- To prevent dead-ends, every branching interaction must designate exactly one **Default/Fallback Edge** that is taken if no other edge conditions are met.
- **Conditions:** Built using a simple list builder. Creators choose if the list evaluates via `Logical AND` (all conditions true) or `Logical OR` (any condition true). Edge conditions can be bound directly to **Choice IDs** or **Roll Branch IDs** to efficiently route outcomes.

**Mutations:**
Multiple mutations (e.g., adding a Tag, `debt += 50`) can be attached to a single **Edge** or directly to the **Scene** itself.
- **Scene Mutations (On Exit):** Associated with leaving the scene itself. These are processed at the same time as the mutations of whichever outbound edge is traversed. This allows lifecycle management of state (like tag expiration) that must happen when a scene resolves, regardless of the chosen route.
- **Edge Mutations:** Applied silently when the player traverses that specific edge.

**Payload Mappings (State Passing):**
To share transient state (like a Roll result) across scenes without polluting the global namespace, creators can map Local Variables from the exiting Scene to the destination Scene. Like mutations, these can be applied at two levels:
- **Scene Mappings (On Exit):** Maps variables to the destination scene regardless of which edge is taken.
- **Edge Mappings:** Maps variables to the destination scene only when that specific edge is taken.
*Note:* To prevent tedious wiring, both Scenes and Edges can feature an **"Inherit All Locals"** toggle, which effortlessly forwards the entire local scope to the next scene.

### 3.4 Reroll Mechanics
Rerolls are a **first-class engine mechanic**, natively supported by Roll Interaction Blocks. Creators configure a global reroll policy in the Game Settings:

- **Per-Task:** Each Roll Block grants a fixed number of rerolls (e.g., 1). If a scene contains multiple Roll Blocks, each block gets its own distinct allowance of rerolls.
- **Shared Pool:** A global reroll counter (backed by a system variable, e.g., `_rerolls`) that is shared across all scenes and all blocks. Multiple roll blocks within the same scene will each deduct from this single global pool. Creators can mutate this variable via edges like any other global variable (e.g., granting bonus rerolls).

The Player Engine renders the reroll UI natively on all Roll Interaction Blocks, showing the remaining count and disabling the reroll button when exhausted.

## 4. Feature Specifications

### 4.1 Creator Studio (The Editor)
- **Canvas View:** A drag-and-drop workspace using React Flow to visually map the game's routing.
- **Node Inspector:** A sidebar that opens when a node is selected, allowing creators to:
  - Add/Remove/Reorder Blocks.
  - Set block content (text, external media URLs).
  - Configure Task Block timers and BPMs.
  - Select the Layout Preset.
- **Edge Inspector:** Clicking an edge allows creators to:
  - Define simple List-based routing conditions.
  - Assign mutation rules (alter variables, add tags).
- **Global Settings Panel:**
  - Define initial variables and tags.
  - Set the global visual theme (Colors and Fonts).
- **Export/Import System:** Save the current workspace state to a local `game.json` file, or load an existing one to continue editing.

### 4.2 Player Engine (The Client)
- **JSON Loader:** A landing page where users drag-and-drop a `game.json` file to begin playing.
- **Execution Loop:** Deterministically processes the current Scene Node, evaluates Edge conditions in order, applies mutations, and routes to the next Node based on interaction.
- **Native Task UI:** Beautifully rendered native countdown timers and pulsing metronomes based on Task Block parameters.
- **Save State System:**
  - **Auto-Save:** Progress (current node, variable values, roll history, active tags) is automatically saved to browser IndexedDB/localStorage to survive page reloads.
  - **Manual Export:** Players can download a `save.json` file to move their progress across devices or browsers.

## 5. Media Handling Strategy
Because there is no backend storage, the framework relies on a hybrid media approach:
- **Primary Method:** Creators use external URLs for media hosted on 3rd-party services (Imgur, RedGifs, personal servers).
- **Secondary Method (End-to-End Native Utility):** The studio provides an end-to-end Javascript utility where users can provide any image file. The utility handles compressing the image and converting it into a base64 data string embedded directly in the JSON, prioritizing portability.

## 6. Development Phasing

- **Phase 1:** Core Data Structure & Headless Execution Engine (TypeScript definitions, state traversal logic, and condition evaluation).
- **Phase 2:** Basic Creator Studio (React Flow canvas, Node/Edge inspector, JSON import/export).
- **Phase 3:** The Player UI (Interpreting the JSON, rendering Layout Presets, handling local save states).
- **Phase 4:** Native Components & Polish (Task Block timers/metronomes, Theming system, UI refinements).
