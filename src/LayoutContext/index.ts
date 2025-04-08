import { LayoutProvider, useLayoutContext } from './context/LayoutProvider';
import LayoutControls from './components/LayoutControls';
import DirectionControls from './components/controls/DirectionControls';
import SpacingControls from './components/controls/SpacingControls';
import AutoLayoutToggle from './components/controls/AutoLayoutToggle';
import { DagreEngine, engines } from './engines';
import type { 
  LayoutDirection, 
  LayoutAlgorithm,
  LayoutEngine, 
  LayoutContextState,
  ParentResizingOptions 
} from './context/LayoutContext';

// Export the public API
// Components and functions
export {
  LayoutProvider,
  LayoutControls,
  useLayoutContext,
  DirectionControls,
  SpacingControls,
  AutoLayoutToggle,
  DagreEngine,
  engines,
};

// Re-export types with explicit "export type" syntax   
export type {
  LayoutDirection,
  LayoutAlgorithm,
  LayoutEngine,
  LayoutContextState,
  ParentResizingOptions
};