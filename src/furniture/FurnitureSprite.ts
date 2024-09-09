import { PointData } from 'pixi.js';
import {
  FURNITURE_GROUP,
  type EventTargetOptions,
} from '../events/EventTarget';
import HitSprite from '../hitdetection/HitSprite';
import type HitTexture from '../hitdetection/HitTexture';
import BobbaRenderer from '../BobbaRenderer';

interface FurnitureSpriteOptions extends Pick<EventTargetOptions, 'tag'> {
  texture: HitTexture;
}

export default class FurnitureSprite extends HitSprite {
  private base: PointData;
  private baseZIndex: number;

  private offset: PointData;
  private offsetZIndex: number;

  constructor(bobbaRenderer: BobbaRenderer, options: FurnitureSpriteOptions) {
    super(bobbaRenderer, {
      group: FURNITURE_GROUP,
      tag: options.tag,
      texture: options.texture,
    });

    this.base = { x: 0, y: 0 };
    this.baseZIndex = 0;

    this.offset = { x: 0, y: 0 };
    this.offsetZIndex = 0;
  }

  setBase(base: PointData): void {
    this.base = base;
    this.update();
  }

  setBaseZIndex(zIndex: number): void {
    this.baseZIndex = zIndex;
    this.update();
  }

  setOffset(offset: PointData): void {
    this.offset = offset;
    this.update();
  }

  setOffsetZIndex(zIndex: number): void {
    this.offsetZIndex = zIndex;
    this.update();
  }

  private update(): void {
    this.x = this.base.x + this.offset.x;
    this.y = this.base.y + this.offset.y;
    this.zIndex = this.baseZIndex + this.offsetZIndex;
  }
}
