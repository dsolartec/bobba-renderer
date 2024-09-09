import BobbaRenderer from '../../BobbaRenderer';
import AnimatedFurnitureVisualization from '../visualization/AnimatedFurnitureVisualization';
import BasicFurnitureVisualization from '../visualization/BasicFurnitureVisualization';
import type FurnitureVisualization from '../visualization/FurnitureVisualization';

export interface FurniBundleIndexData {
  logic: string;
  visualization: string;
}

export default class FurnitureIndexData {
  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly data: FurniBundleIndexData
  ) {}

  getVisualization(animationID: number | null): FurnitureVisualization {
    switch (this.data.visualization) {
      case 'furniture_animated':
        return new AnimatedFurnitureVisualization(
          this.bobbaRenderer,
          animationID
        );

      case 'furniture_static':
        return new BasicFurnitureVisualization();

      default:
        throw new Error(
          `Invalid furniture visualization: ${this.data.visualization}`
        );
    }
  }
}
