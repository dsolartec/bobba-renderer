import type { Container, PointData } from 'pixi.js';
import FurnitureSprite from '../FurnitureSprite';
import type { EventTargetOptions } from '../../events/EventTarget';
import BobbaRenderer from '../../BobbaRenderer';
import FurniDrawDefinition, { FurniDrawPart } from '../FurniDrawDefinition';

export default class FurnitureVisualizationLayer {
  private needRefreshPosition: boolean;
  private needRefreshSprites: boolean;

  private point: PointData | null;
  private zIndex: number | null;
  private alpha: number | null;
  private highlight: boolean | null;

  private frameIndex: number;

  private sprites: Map<number, FurnitureSprite>;
  private mountedSprites: Set<FurnitureSprite>;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly furniDrawDefinition: FurniDrawDefinition,
    private readonly furniDrawPart: FurniDrawPart,
    private readonly furnisContainer: Container,
    private readonly eventOptions: Pick<
      Partial<EventTargetOptions>,
      'onClick' | 'onDoubleClick'
    >
  ) {
    this.needRefreshPosition = false;
    this.needRefreshSprites = false;

    this.point = null;
    this.zIndex = null;
    this.alpha = null;
    this.highlight = null;

    this.frameIndex = 0;
    if (this.furniDrawPart.assets[this.frameIndex] == null) {
      this.frameIndex = this.furniDrawPart.assets.findIndex((v) => v != null);
    }

    this.sprites = new Map();
    this.mountedSprites = new Set();
  }

  getLayerID(): number {
    return this.furniDrawPart.layerIndex;
  }

  getSprites(): Map<number, FurnitureSprite> {
    return this.sprites;
  }

  getFrameIndex(): number {
    return this.frameIndex;
  }

  getFrameRepeat(): number {
    return this.furniDrawPart.frameRepeat;
  }

  getLoopCount(): number | null {
    return this.furniDrawPart.loopCount ?? null;
  }

  setCurrentFrameIndex(frameIndex: number): void {
    if (this.frameIndex === frameIndex) return;

    this.frameIndex = frameIndex;

    this.destroySprites();
    this.updateSprites();
  }

  setPoint(point: PointData): void {
    if (this.point && this.point.x === point.x && this.point.y === point.y)
      return;

    this.point = point;
    this.needRefreshPosition = true;
  }

  setZIndex(zIndex: number): void {
    if (this.zIndex === zIndex) return;

    this.zIndex = zIndex;
    this.needRefreshPosition = true;
  }

  setAlpha(alpha: number): void {
    if (this.alpha === alpha) return;

    this.alpha = alpha;
    this.needRefreshSprites = true;
  }

  setHighlight(highlight: boolean): void {
    if (this.highlight === highlight) return;

    this.highlight = highlight;
    this.needRefreshSprites = true;
  }

  private destroySprites(): void {
    this.sprites.forEach((sprite) => {
      this.furnisContainer.removeChild(sprite);
      sprite.visible = false;
    });

    this.mountedSprites = new Set();
  }

  private getSprite(frameIndex: number): FurnitureSprite | null {
    const cache = this.sprites.get(frameIndex);
    if (cache != null) return cache;

    const asset = this.furniDrawPart.assets[frameIndex];
    if (asset == null) return null;

    const texture = this.furniDrawDefinition.getTexture(
      asset.source ?? asset.name
    );

    const { z, layer, shadow, mask, tint } = this.furniDrawPart;

    const sprite = new FurnitureSprite(this.bobbaRenderer, {
      tag: layer?.tag,
      texture,
    });

    sprite.onClick = (e) =>
      this.eventOptions.onClick && this.eventOptions.onClick(e);
    sprite.onDoubleClick = (e) =>
      this.eventOptions.onDoubleClick && this.eventOptions.onDoubleClick(e);

    sprite.setIgnoreMouse(layer?.ignoreMouse != null && layer.ignoreMouse);
    sprite.visible = false;

    let alpha = this.alpha ?? 1;
    if (layer != null && layer.alpha != null) {
      alpha = (layer.alpha / 255) * alpha;
    }

    if (shadow === true) {
      if (this.highlight) sprite.alpha = 0;
      else sprite.alpha = alpha / 5;
    } else sprite.alpha = alpha;

    sprite.setMirror(asset.flipH);
    sprite.setOffset({
      x: +(32 - asset.x * (asset.flipH ? -1 : 1)),
      y: -asset.y + 16,
    });

    if (this.zIndex != null) {
      sprite.setOffsetZIndex(shadow === true ? -this.zIndex : (z ?? 0));
      sprite.setBaseZIndex(this.zIndex);
    }

    if (this.point != null) sprite.setBase(this.point);

    if (mask === true) sprite.tint = 0xffffff;
    else if (tint != null) sprite.tint = parseInt(tint, 16);

    if (layer != null && layer.ink != null) {
      sprite.blendMode = layer.ink === 'ADD' ? 'add' : 'normal';
    }

    this.sprites.set(frameIndex, sprite);

    return sprite;
  }

  private addSprite(sprite: FurnitureSprite): void {
    if (this.mountedSprites.has(sprite)) return;

    this.mountedSprites.add(sprite);
    this.furnisContainer.addChild(sprite);
  }

  private updateSprites(): void {
    const sprite = this.getSprite(this.frameIndex);
    if (sprite == null) return;

    this.addSprite(sprite);
    sprite.visible = true;
  }

  update(): void {
    if (this.needRefreshPosition) {
      this.needRefreshPosition = false;

      this.sprites.forEach((sprite) => {
        if (this.point != null) sprite.setBase(this.point);
        if (this.zIndex != null) sprite.setBaseZIndex(this.zIndex);
      });
    }

    if (this.needRefreshSprites) {
      this.needRefreshSprites = false;
      this.destroySprites();
      this.updateSprites();
    }
  }

  destroy(): void {
    this.destroySprites();
  }
}
