import FurnitureVisualization from './FurnitureVisualization';
import type FurnitureVisualizationView from './FurnitureVisualizationView';

export default class BasicFurnitureVisualization extends FurnitureVisualization {
  private direction: number | null;

  constructor() {
    super();

    this.direction = null;
  }

  override setView(view: FurnitureVisualizationView): void {
    super.setView(view);
    this.update();
  }

  startAnimation(animationID: number): void {}
  stopAnimation(): void {}

  isAnimating(): boolean {
    return false;
  }

  updateDirection(direction: number): void {
    if (this.direction === direction) return;

    this.direction = direction;
    this.update();
  }

  update(): void {
    if (this.direction == null) return;

    const view = this.getCurrentView();
    if (view == null) return;

    view.setDisplayDirection(this.direction);
    view.updateDisplay();
  }

  destroy(): void {}
}
