export type VariableType = 'number' | 'string' | 'boolean';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: number | string | boolean;
}

export interface Tag {
  id: string;
  name: string;
  // If set, tag expires after this duration in seconds (optional feature)
  duration?: number;
}

export interface ThemeSettings {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

export type RerollPolicyType = 'per-task' | 'shared-pool';

export interface RerollPolicy {
  type: RerollPolicyType;
  defaultAllowance?: number; // E.g., 1 for per-task, or starting value for shared-pool
}

export interface GameSettings {
  theme: ThemeSettings;
  rerollPolicy: RerollPolicy;
}

// ----------------------------------------------------------------------------
// Blocks
// ----------------------------------------------------------------------------
export type BlockType = 'media' | 'text' | 'task' | 'interaction' | 'container';

export interface BaseBlock {
  id: string;
  type: BlockType;
  editorCollapsed?: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string; // URL or base64
  mediaType: 'image' | 'video' | 'audio';
}

export interface MediaBlock extends BaseBlock {
  type: 'media';
  mediaId?: string; // references MediaAsset.id
  url?: string; // Legacy URL or base64
  mediaType?: 'image' | 'video' | 'audio'; // Legacy
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  text: string; // Supports templating e.g., "Your debt is ${{debt}}"
}

export interface TaskBlock extends BaseBlock {
  type: 'task';
  durationSeconds: number;
  bpm?: number; // Optional metronome
}

export type InteractionType = 'continue' | 'choice' | 'roll';

export interface InteractionChoice {
  id: string;
  label: string;
}

export interface RollBranch {
  id: string;
  weight: number;
  min: number;
  max: number;
  label: string;
}

export interface InteractionBlock extends BaseBlock {
  type: 'interaction';
  interactionType: InteractionType;
  label?: string; // For continue or roll
  choices?: InteractionChoice[]; // For choice
  rollBranches?: RollBranch[]; // For mapped distribution roll
  isMappedRoll?: boolean; // If true, uses mapped distribution instead of simple integer
  rerollsGranted?: number; // Override default rerolls for this block
  maxRoll?: number; // Maximum roll value (default: 10, capped at 100)
  isRequired?: boolean; // If true, must be interacted with before continuing
}

export interface ContainerBlock extends BaseBlock {
  type: 'container';
  direction: 'row' | 'column';
  backgroundColor?: string;
  borderColor?: string;
  blocks: Block[];
}

export type Block = MediaBlock | TextBlock | TaskBlock | InteractionBlock | ContainerBlock;

// ----------------------------------------------------------------------------
// Mutations & Conditions
// ----------------------------------------------------------------------------
export type MutationOperation = 'set' | 'add' | 'subtract' | 'multiply' | 'divide' | 'add_tag' | 'remove_tag';

export interface Mutation {
  id: string;
  targetId: string; // Variable ID or Tag ID
  operation: MutationOperation;
  value?: number | string | boolean; // Omitted for add_tag/remove_tag
}

export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'has_tag' | 'missing_tag' | 'contains' | 'is_in';

export interface Condition {
  id: string;
  targetId: string; // Variable ID or Tag ID or interaction choice ID or roll branch ID
  operator: ConditionOperator;
  value?: number | string | boolean;
}

export interface ConditionGroup {
  logicalOperator: 'AND' | 'OR';
  conditions: Condition[];
}

// ----------------------------------------------------------------------------
// Scenes & Edges
// ----------------------------------------------------------------------------
export interface VariableMapping {
  sourceId: string;
  targetId: string;
}

export type LayoutPreset = 'standard-split' | 'grid' | 'fullscreen-media' | 'stacked';

export interface Scene {
  id: string;
  name: string;
  blocks: Block[];
  sceneMutations: Mutation[]; // Applied when leaving the scene
  sceneVariableMappings?: VariableMapping[]; // Map source local to target local regardless of edge taken
  inheritAllLocals?: boolean; // Forward all local variables automatically
  localVariables: Variable[]; // Scoped to this scene
  editorMetadata?: {
    position: { x: number; y: number };
  };
}

export interface Edge {
  id: string;
  name?: string;
  sourceSceneId: string;
  targetSceneId: string;
  
  // Evaluation Priority & Conditions
  priority: number;
  isDefaultFallback?: boolean; // Must have one per branching interaction
  conditionGroup?: ConditionGroup;

  // Which interaction triggered this? E.g., choice ID or just the interaction block ID
  triggerInteractionId?: string; 

  edgeMutations: Mutation[]; // Applied silently on traverse
  edgeVariableMappings?: VariableMapping[]; // Map source local to target local on traversal
  inheritAllLocals?: boolean; // Forward all local variables automatically
}

// ----------------------------------------------------------------------------
// The Game
// ----------------------------------------------------------------------------
export interface Game {
  id: string;
  title: string;
  version: string;
  coverMediaId?: string;
  
  settings: GameSettings;
  globalVariables: Variable[];
  tags: Tag[];
  mediaAssets?: MediaAsset[]; // Array of media assets for the game
  
  scenes: Record<string, Scene>;
  edges: Record<string, Edge[]>; // Keyed by sourceSceneId for easy traversal
  
  startSceneId: string;
}
