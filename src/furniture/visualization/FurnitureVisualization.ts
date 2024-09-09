import type FurnitureVisualizationView from './FurnitureVisualizationView';

export default abstract class FurnitureVisualization {
  private previousView: FurnitureVisualizationView | null;
  private currentView: FurnitureVisualizationView | null;

  constructor() {
    this.previousView = null;
    this.currentView = null;
  }

  protected get mounted(): boolean {
    return this.currentView != null;
  }

  hasAnimation(): boolean {
    return false;
  }

  getCurrentView(): FurnitureVisualizationView | null {
    return this.currentView;
  }

  setView(view: FurnitureVisualizationView): void {
    this.previousView = this.currentView;
    this.currentView = view;
  }

  abstract update(): void;
  abstract destroy(): void;

  abstract updateDirection(direction: number): void;

  abstract startAnimation(animationID: number): void;
  abstract stopAnimation(): void;
  abstract isAnimating(): boolean;
}
