import type { Container, PointData } from 'pixi.js';
import FurnitureVisualizationLayer from './FurnitureVisualizationLayer';
import type FurnitureVisualizationData from '../data/FurnitureVisualizationData';
import type { EventTargetOptions } from '../../events/EventTarget';
import FurniDrawDefinition from '../FurniDrawDefinition';
import BobbaRenderer from '../../BobbaRenderer';

export default class FurnitureVisualizationView {
  private layers: FurnitureVisualizationLayer[] | null;

  private point: PointData | null;
  private zIndex: number | null;
  private alpha: number | null;
  private highlight: boolean | null;

  private animationID: number | null;
  private direction: number | null;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly furniDrawDefinition: FurniDrawDefinition,
    private readonly furnisContainer: Container,
    private readonly eventOptions: Pick<
      Partial<EventTargetOptions>,
      'onClick' | 'onDoubleClick'
    >
  ) {
    this.layers = [];

    this.point = null;
    this.zIndex = null;
    this.alpha = null;
    this.highlight = null;

    this.animationID = null;
    this.direction = null;
  }

  getLayers(): FurnitureVisualizationLayer[] {
    if (this.layers == null) {
      throw new Error(
        "Layers aren't set yet. Call `updateDisplay` before accessing the layers."
      );
    }

    return this.layers;
  }

  getVisualizationData(): FurnitureVisualizationData {
    return this.furniDrawDefinition.getVisualizationData();
  }

  private getPoint(): PointData {
    if (this.point == null)
      throw new Error('Invalid furniture visualization view.');
    return this.point;
  }

  setPoint(point: PointData): void {
    this.point = point;
  }

  private getZIndex(): number {
    if (this.zIndex == null)
      throw new Error('Invalid furniture visualization view.');
    return this.zIndex;
  }

  setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
  }

  private getAlpha(): number {
    if (this.alpha == null)
      throw new Error('Invalid furniture visualization view.');
    return this.alpha;
  }

  setAlpha(alpha: number): void {
    this.alpha = alpha;
  }

  private getHighlight(): boolean {
    if (this.highlight == null)
      throw new Error('Invalid furniture visualization view.');
    return this.highlight;
  }

  setHighlight(highlight: boolean): void {
    this.highlight = highlight;
  }

  setDisplayAnimation(animationID: number | null): void {
    this.animationID = animationID;
  }

  setDisplayDirection(direction: number): void {
    this.direction = direction;
  }

  updateLayers(): void {
    this.layers?.forEach((layer) => {
      layer.setPoint(this.getPoint());
      layer.setZIndex(this.getZIndex());
      layer.setAlpha(this.getAlpha());
      layer.setHighlight(this.getHighlight());
      layer.update();
    });
  }

  updateDisplay(): void {
    if (this.direction == null)
      throw new Error('Invalid furniture visualization view.');

    this.destroy();

    this.layers = this.furniDrawDefinition
      .get(this.direction, this.animationID)
      .map(
        (layer) =>
          new FurnitureVisualizationLayer(
            this.bobbaRenderer,
            this.furniDrawDefinition,
            layer,
            this.furnisContainer,
            this.eventOptions
          )
      );

    this.updateLayers();
  }

  destroy(): void {
    if (this.layers != null) {
      this.layers.forEach((layer) => layer.destroy());
      this.layers = null;
    }
  }
}
