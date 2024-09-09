import type { Container, PointData } from 'pixi.js';
import type { FurniPlacement } from './data/FurnitureData';
import FurnitureVisualizationView from './visualization/FurnitureVisualizationView';
import type FurnitureVisualization from './visualization/FurnitureVisualization';
import type { EventTargetOptions } from '../events/EventTarget';
import FurniDrawDefinition from './FurniDrawDefinition';
import BobbaRenderer from '../BobbaRenderer';

export default class BaseFurniture {
  private needRefreshFurniture: boolean;
  private needRefreshPosition: boolean;
  private needRefreshZIndex: boolean;

  private drawDefinition: FurniDrawDefinition | null;
  private visualization: FurnitureVisualization | null;

  private point: PointData;
  private zIndex: number;

  private eventOptions: Pick<
    Partial<EventTargetOptions>,
    'onClick' | 'onDoubleClick'
  >;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly furnisContainer: Container,
    private readonly furniPlacement: FurniPlacement,
    private readonly furniName: string,
    private animation: number | null,
    private direction: number,
    private readonly onLoad: (() => void) | null = null
  ) {
    this.needRefreshFurniture = false;
    this.needRefreshPosition = false;
    this.needRefreshZIndex = false;

    this.drawDefinition = null;
    this.visualization = null;

    this.point = { x: 0, y: 0 };
    this.zIndex = 0;

    this.eventOptions = {};

    this.loadFurniture();

    this.bobbaRenderer
      .getApplication()
      .ticker.add(this.handleTicker.bind(this));
  }

  set onClick(callback: EventTargetOptions['onClick']) {
    this.eventOptions.onClick = callback;
  }

  set onDoubleClick(callback: EventTargetOptions['onDoubleClick']) {
    this.eventOptions.onDoubleClick = callback;
  }

  getAvailableAnimations(): number[] {
    return (
      this.drawDefinition?.getVisualizationData().getAvailableAnimations(64) ??
      []
    );
  }

  getAnimation(): number {
    return this.animation ?? 0;
  }

  setAnimation(animationID: number): void {
    this.animation = animationID;

    if (this.visualization != null) {
      this.visualization.startAnimation(animationID);
    }
  }

  setPoint(point: PointData): void {
    if (this.point.x === point.x && this.point.y === point.y) return;

    this.point = point;
    this.needRefreshPosition = true;
  }

  setZIndex(zIndex: number): void {
    if (this.zIndex === zIndex) return;

    this.zIndex = zIndex;
    this.needRefreshZIndex = true;
  }

  private loadFurniture(): void {
    this.bobbaRenderer
      .getFurnitureManager()
      .loadFurni(this.furniName, this.furniPlacement)
      .then((result) => {
        this.drawDefinition = result;
        this.visualization = result.getVisualization(this.animation);

        this.updateFurniture();
        this.onLoad && this.onLoad();
      });
  }

  private updateDirection(): void {
    if (this.drawDefinition == null || this.visualization == null) return;

    const validDirections = this.drawDefinition.getDirections();
    let realDirection: number = validDirections[0] ?? 0;

    for (const validDirection of validDirections) {
      if (validDirection === this.direction) {
        realDirection = this.direction;
        break;
      }

      if (validDirection > this.direction) break;

      realDirection = validDirection;
    }

    this.visualization.updateDirection(realDirection);
  }

  private updatePosition(): void {
    const view = this.visualization?.getCurrentView();
    if (view == null) return;

    view.setPoint(this.point);
    view.setZIndex(this.zIndex);
    view.updateLayers();
  }

  private updateFurniture(): void {
    if (this.drawDefinition == null || this.visualization == null) return;

    this.visualization.getCurrentView()?.destroy();

    const view = new FurnitureVisualizationView(
      this.bobbaRenderer,
      this.drawDefinition,
      this.furnisContainer,
      this.eventOptions
    );

    view.setPoint(this.point);
    view.setZIndex(this.zIndex);
    view.setAlpha(1);
    view.setHighlight(false);
    view.setDisplayDirection(this.direction);
    view.setDisplayAnimation(this.animation);

    this.visualization.setView(view);

    this.updateDirection();
    this.updatePosition();

    this.visualization.update();
  }

  private handleTicker(): void {
    if (this.needRefreshFurniture) {
      this.needRefreshFurniture = false;
      this.updateFurniture();
    }

    if (this.needRefreshPosition) {
      this.needRefreshPosition = false;
      this.updatePosition();
    }

    if (this.needRefreshZIndex) {
      this.needRefreshZIndex = false;
    }
  }
}
