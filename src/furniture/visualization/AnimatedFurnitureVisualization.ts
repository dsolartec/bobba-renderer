import BobbaRenderer from '../../BobbaRenderer';
import FurnitureVisualization from './FurnitureVisualization';

interface InProgressAnimation {
  id: number;
  frame: number;
}

export default class AnimatedFurnitureVisualization extends FurnitureVisualization {
  private direction: number | null;

  private queue: Record<
    string,
    {
      frames: InProgressAnimation[];
      frameRepeat: number;
      hasLoop: boolean;
      startFrame: number | null;
      isMajor: boolean;
    }
  >;

  private cancelTicker: (() => void) | null;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private animationID: number | null
  ) {
    super();

    this.direction = null;

    this.queue = {};

    this.cancelTicker = null;
  }

  override hasAnimation(): boolean {
    return true;
  }

  private handleTick(frame: number): void {
    const layers = this.getCurrentView()?.getLayers() ?? [];

    const layersIDs = Object.keys(this.queue);
    if (layersIDs.length === 0) {
      this.stopAnimation();
      return;
    }

    const hasLoop = Object.values(this.queue).some((layer) => layer.hasLoop);

    for (const layerID of layersIDs) {
      const layerData = this.queue[layerID];
      if (layerData.startFrame == null) layerData.startFrame = frame;

      const frames = layerData.frames;
      if (frames.length === 0) {
        delete this.queue[layerID];
        continue;
      }

      const layer = layers.find(
        (layer) => layer.getLayerID() === Number(layerID)
      );

      if (layer == null) {
        delete this.queue[layerID];
        continue;
      }

      let frameIndex: number = 0;
      if (layer.getLoopCount() != null) {
        frameIndex = (frame - layerData.startFrame) % frames.length;
      }

      const data = frames[frameIndex];
      if (data == null) continue;

      if (data.id != this.animationID && layerData.isMajor) {
        this.animationID = data.id;
        this.updateFurniture();
        break;
      } else if (data.id != this.animationID) continue;

      layer.setCurrentFrameIndex(data.frame);

      if (layerData.frameRepeat >= layer.getFrameRepeat()) {
        layerData.frameRepeat = 1;

        if (layer.getLoopCount() == null && !hasLoop) {
          frames.shift();

          if (frames.length === 0) delete this.queue[layerID];
        }

        continue;
      }

      layerData.frameRepeat += 1;
    }
  }

  private updateFurniture(): void {
    const view = this.getCurrentView();
    if (view == null) return;

    view.setDisplayAnimation(this.animationID);
    if (this.direction != null) view.setDisplayDirection(this.direction);
    view.updateDisplay();
  }

  override updateDirection(direction: number): void {
    if (this.direction === direction) return;

    this.direction = direction;
    this.updateFurniture();
  }

  private generateAnimationFrames(
    animationID: number,
    withTransitionTo: boolean
  ): void {
    const data = this.getCurrentView()?.getVisualizationData();
    if (data == null) return;

    if (withTransitionTo) {
      const transitionTo = data.getTransitionToForAnimation(64, animationID);
      if (transitionTo != null) {
        this.generateAnimationFrames(transitionTo, withTransitionTo);
      }
    }

    const animation = data.getAnimation(64, animationID);
    if (animation == null) return;

    for (const [layerID, layer] of Object.entries(animation.layers)) {
      if (this.queue[layerID] == null) {
        this.queue[layerID] = {
          frames: [],
          startFrame: null,
          frameRepeat: 1,
          hasLoop: layer.loopCount != null,
          isMajor: false,
        };
      }

      if (!this.queue[layerID].hasLoop && layer.loopCount != null) {
        this.queue[layerID].hasLoop = true;
      }

      layer.frames.forEach((frame) =>
        this.queue[layerID].frames.push({
          id: animation.id,
          frame,
        })
      );
    }

    const majorID = Object.entries(this.queue).sort(
      ([_, a], [__, b]) => b.frames.length - a.frames.length
    )[0];

    this.queue[majorID[0]].isMajor = true;
  }

  private _startAnimation(
    animationID: number,
    withTransitionTo: boolean
  ): void {
    this.animationID = animationID;
    this.generateAnimationFrames(animationID, withTransitionTo);

    this.handleTick(this.bobbaRenderer.getCurrentTickerFrame());
    this.cancelTicker = this.bobbaRenderer.subscribeToTicker(
      this.handleTick.bind(this)
    );
  }

  startAnimation(animationID: number): void {
    if (this.isAnimating()) this.stopAnimation();

    this._startAnimation(animationID, true);
  }

  stopAnimation(): void {
    if (this.cancelTicker != null) this.cancelTicker();

    this.queue = {};

    this.cancelTicker = null;
  }

  isAnimating(): boolean {
    return Object.keys(this.queue).length > 0;
  }

  update(): void {
    if (this.direction == null) return;
    if (this.animationID != null) this._startAnimation(this.animationID, false);

    this.updateFurniture();
  }

  destroy(): void {}
}
