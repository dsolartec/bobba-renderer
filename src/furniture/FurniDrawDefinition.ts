import type HitTexture from '../hitdetection/HitTexture';
import type { FurnitureAsset } from './data/FurnitureAssetsData';
import type { FurniInfo } from './data/FurnitureData';
import type FurnitureVisualizationData from './data/FurnitureVisualizationData';
import type { LayerVisualizationData } from './data/FurnitureVisualizationData';
import FurniBundle from './FurniBundle';
import type FurnitureVisualization from './visualization/FurnitureVisualization';

export interface FurniDrawPart {
  assets: FurnitureAsset[];
  layerIndex: number;
  frameRepeat: number;
  shadow?: boolean;
  layer: LayerVisualizationData | null;
  z?: number;
  tint?: string;
  mask?: boolean;
  loopCount?: number;
}

export default class FurniDrawDefinition {
  private readonly size: number;

  constructor(
    private readonly furniInfo: FurniInfo,
    private readonly furniBundle: FurniBundle
  ) {
    this.size = 64;
  }

  getVisualization(animationID: number | null): FurnitureVisualization {
    return this.furniBundle.getIndex().getVisualization(animationID);
  }

  getVisualizationData(): FurnitureVisualizationData {
    return this.furniBundle.getVisualization();
  }

  private getFurniNameParts(): { name: string; color: number } {
    const [name, color] = this.furniInfo.name.split('*');

    return {
      name,
      color: color != null ? Number(color) : 0,
    };
  }

  private getAssetName(direction: number, char: string, frame: number): string {
    return `${this.getFurniNameParts().name}_${this.size}_${char}_${direction}_${frame}`;
  }

  private getCharFromLayerIndex(index: number): string {
    return String.fromCharCode(index + 97);
  }

  get(direction: number, animation: number | null = null): FurniDrawPart[] {
    const parts: FurniDrawPart[] = [];

    const shadow = this.furniBundle
      .getAssets()
      .getOne(this.getAssetName(direction, 'sd', 0));

    if (shadow != null) {
      parts.push({
        assets: [shadow],
        frameRepeat: 1,
        layer: null,
        shadow: true,
        layerIndex: -1,
      });
    }

    const { name, color } = this.getFurniNameParts();

    const mask = this.furniBundle
      .getAssets()
      .getOne(`${name}_${this.size}_${direction}_mask`);

    if (mask != null) {
      parts.push({
        assets: [mask],
        frameRepeat: 1,
        layer: null,
        mask: true,
        layerIndex: -2,
      });
    }

    const layerCount = this.furniBundle
      .getVisualization()
      .getLayerCount(this.size);

    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const directionLayer = this.furniBundle
        .getVisualization()
        .getDirectionLayer(this.size, direction, layerIndex);
      const layer = this.furniBundle
        .getVisualization()
        .getLayer(this.size, layerIndex);
      const char = this.getCharFromLayerIndex(layerIndex);

      const animationLayer =
        animation != null
          ? this.furniBundle
              .getVisualization()
              .getAnimationLayer(this.size, animation, layerIndex)
          : undefined;

      const colorLayer = this.furniBundle
        .getVisualization()
        .getColor(this.size, color, layerIndex);

      const x = directionLayer?.x ?? 0;
      const y = directionLayer?.y ?? 0;
      const z = directionLayer?.z ?? layer?.z ?? 0;

      let assets: FurnitureAsset[] = [];
      if (animationLayer != null) {
        animationLayer.frames.forEach((frameNumber) => {
          const asset = this.furniBundle
            .getAssets()
            .getOne(this.getAssetName(direction, char, frameNumber));

          if (asset == null) {
            assets[frameNumber] = {
              x: 0,
              y: 0,
              flipH: false,
              name: 'unknown',
              valid: true,
            };

            return;
          }

          assets[frameNumber] = {
            ...asset,
            x: asset.x + (asset.flipH ? x : -x),
            y: asset.y - y,
          };
        });
      }

      const baseAsset = this.furniBundle
        .getAssets()
        .getOne(this.getAssetName(direction, char, 0));

      if (assets.length === 0 && baseAsset != null) assets.push(baseAsset);

      parts.push({
        assets,
        frameRepeat: animationLayer?.frameRepeat ?? 1,
        layerIndex,
        layer,
        loopCount: animationLayer?.loopCount,
        tint: colorLayer,
        z,
      });
    }

    return parts;
  }

  getDirections(): number[] {
    return this.furniBundle
      .getVisualization()
      .getDirections(this.size)
      .sort((a, b) => a - b);
  }

  getTexture(name: string): HitTexture {
    return this.furniBundle.getTexture(name);
  }
}
