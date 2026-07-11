# Remaining Features

**1. Inline Conditional Content (Attribute-based Text)**
The generic spec mentions templating variables (e.g., `Your debt is ${{debt}}`), but it does not mention conditional content blocks or inline conditionals (e.g., `{{if ROUGH}} ... {{endif}}`). Currently, you would have to create entirely separate Scene Nodes for every variation of a task, which would quickly result in an unmanageable node graph.

*Proposed Implementation:* **Handlebars-style Logic:** Add support for inline templating (e.g., `{{#if ROUGH}}...{{/if}}`) directly within Content blocks. This keeps the node graph clean and manageable without requiring entirely new block types.

**2. Player Action History / Log UI**
Club Bambi features an extensive "Event History" accordion in the side panel that meticulously logs past clients, rolls, and outcomes. While the generic spec mentions saving "roll history" to the save state, it does not specify a user-facing History Log UI component for the player to review their past actions.

*Proposed Implementation:* **Floating History Drawer:** Implement a native slide-out panel that automatically logs visited scene names and roll outcomes. This would be available globally in the player UI, providing an out-of-the-box solution without requiring creators to manually wire log blocks.

**3. Visual Roll Grids & Highlights (The Client Selection Screen)**
When selecting a client in Club Bambi, the user is presented with a 5-column grid of image cards. When they roll, the selected client's card is highlighted. The generic spec's Roll Block and Layout Presets do not detail a way to visually bind a roll's outcome to highlight specific media blocks in a grid.

*Proposed Implementation:* **Visual Grid Roll Block:** Introduce a new specialized interaction block that accepts a list of images/titles, renders them as a visual grid, and natively handles the selection animation and highlighting when a roll occurs.

**4. Status Bar and Pre-built Tracking Components**
Club Bambi features custom hover-cards and specialized UI trackers in the Status Bar (e.g., a Satisfaction Progress Bar showing "Can Finish" thresholds, and derived stat indicators like Uniform level bonuses). The generic engine currently lacks specialized visual UI blocks and a dedicated status bar layout for tracking and visualizing derived stats or progress beyond standard text injection.

*Proposed Implementation:* **"Status Bar" System Overlay:** Introduce a global UI layer that lives outside the Node Graph. Creators can map variables to built-in components (Progress Bars, Hover-cards, Stat trackers) that persist across scenes, creating a consistent HUD for players.

**5. Player-Facing Game Options (Gameplay Modifiers)**
Club Bambi allows the user to toggle settings like stroke speed unit (BPM vs %) and task time modifier (0.5x, 1x, 1.5x). The generic spec does not account for a user-facing settings menu that can globally hook into and modify Task Block execution.

*Proposed Implementation:* **Creator-defined Options Menu & Live Interpolation:** Since creators can already build pre-game configuration screens using standard Choice blocks and Global Variables, we expand this by allowing creators to build custom "Options Menu" scenes accessible at any time. Selections map directly to global variables in real-time. To fully support this, the engine must automatically re-process text interpolation and variable states whenever an option is changed mid-scene.
