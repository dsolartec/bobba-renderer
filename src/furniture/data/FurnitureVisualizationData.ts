interface LayerDirectionVisualizationData {
  id: string;
  x?: number;
  y?: number;
  z?: number;
}

interface DirectionVisualizationData {
  id: string;
  layers: { [layerID: number]: LayerDirectionVisualizationData };
}

export interface LayerVisualizationData {
  id: number;
  z: number;
  alpha?: number;
  ignoreMouse?: boolean;
  ink?: string;
  tag?: string;
}

interface LayerAnimationVisualizationData {
  id: number;
  frameRepeat?: number;
  frames: number[];
  loopCount?: number;
  random: boolean;
}

interface AnimationVisualizationData {
  id: number;
  layers: Record<number, LayerAnimationVisualizationData>;
  transitionTo?: number;
}

interface LayerColorVisualizationData {
  id: string;
  color: string;
}

interface ColorVisualizationData {
  id: string;
  layers: Record<number, LayerColorVisualizationData>;
}

interface VisualizationData {
  animations: Record<number, AnimationVisualizationData>;
  colors: Record<number, ColorVisualizationData>;
  directions: Record<number, DirectionVisualizationData>;
  layerCount: number;
  layers: Record<number, LayerVisualizationData>;
}

export type FurniBundleVisualizationData = Record<number, VisualizationData>;

export default class FurnitureVisualizationData {
  constructor(private readonly data: FurniBundleVisualizationData) {}

  getAnimation(
    size: number,
    animationID: number
  ): AnimationVisualizationData | null {
    return this.data[size]?.animations[animationID] ?? null;
  }

  getAnimationLayer(
    size: number,
    animationID: number,
    layerID: number
  ): LayerAnimationVisualizationData | null {
    return this.getAnimation(size, animationID)?.layers[layerID] ?? null;
  }

  getAvailableAnimations(size: number): number[] {
    return Object.entries(this.data[size]?.animations ?? {})
      .filter(([_, animation]) => animation.transitionTo == null)
      .map(([animationID]) => Number(animationID));
  }

  getColor(size: number, colorID: number, layerID: number) {
    return this.data[size]?.colors[colorID]?.layers[layerID]?.color ?? null;
  }

  getDirections(size: number): number[] {
    return Object.keys(this.data[size]?.directions ?? {}).map((id) =>
      Number(id)
    );
  }

  getDirectionLayer(
    size: number,
    direction: number,
    layerID: number
  ): Pick<LayerDirectionVisualizationData, 'x' | 'y' | 'z'> | null {
    const directionLayer =
      this.data[size]?.directions[direction]?.layers[layerID] ?? null;
    if (directionLayer == null) return null;

    return {
      x: directionLayer.x,
      y: directionLayer.y,
      z: directionLayer.z,
    };
  }

  getLayer(size: number, layerID: number): LayerVisualizationData | null {
    return this.data[size]?.layers[layerID] ?? null;
  }

  getLayerCount(size: number): number {
    const visualization = this.data[size];
    if (visualization == null) throw new Error('Invalid visualization.');

    const layerCount = Number(visualization.layerCount);
    return isNaN(layerCount) ? 0 : layerCount;
  }

  getTransitionToForAnimation(
    size: number,
    transitionTo: number
  ): number | null {
    const animations = this.data[size]?.animations;
    if (animations == null) return null;

    const to = Object.entries(animations).find(
      ([_, animation]) => animation.transitionTo === transitionTo
    );
    if (to == null) return null;

    return Number(to[0]);
  }
}
