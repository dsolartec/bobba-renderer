import {
  Container,
  Graphics,
  type DestroyOptions,
  type PointData,
} from 'pixi.js';
import { BehaviorSubject } from 'rxjs';
import isPointInside from '../utils/isPointInside';
import type IRoomPosition from '../interfaces/IRoomPosition';
import EventTarget, {
  IEventData,
  TILE_CURSOR_EVENT_GROUP,
} from '../../events/EventTarget';
import BobbaRenderer from '../../BobbaRenderer';

const graphicPoints = {
  p1: { x: 0, y: 16 },
  p2: { x: 32, y: 0 },
  p3: { x: 64, y: 16 },
  p4: { x: 32, y: 32 },
};

export default class TileCursor extends Container {
  private _onClick: ((position: IRoomPosition) => void) | null;

  private observable: BehaviorSubject<IEventData | null>;
  private event: EventTarget;

  private hover: boolean;

  constructor(
    bobbaRenderer: BobbaRenderer,
    private readonly roomPosition: IRoomPosition
  ) {
    super();

    this._onClick = null;

    this.observable = new BehaviorSubject<IEventData | null>(null);
    this.event = new EventTarget(bobbaRenderer, {
      group: TILE_CURSOR_EVENT_GROUP,
      hits: this.hits.bind(this),
      observable: this.observable,
      onClick: () => this._onClick && this._onClick(this.roomPosition),
      onPointerOver: () => this.updateHover(true),
      onPointerOut: () => this.updateHover(false),
      target: this,
      zIndez: -1000,
    });

    this.hover = false;

    this.onRender = this.onUpdateRender.bind(this);

    this.updateSprites();
  }

  set onClick(callback: (position: IRoomPosition) => void) {
    this._onClick = callback;
  }

  hits({ x, y }: PointData): boolean {
    const position = this.getGlobalPosition();

    return isPointInside({ x: x - position.x, y: y - position.y }, [
      { ...graphicPoints.p1 },
      { ...graphicPoints.p2 },
      { ...graphicPoints.p3 },
      { ...graphicPoints.p4 },
    ]);
  }

  private onUpdateRender(): void {
    const position = this.getGlobalPosition();

    this.observable.next({
      width: 64,
      height: 32,
      x: position.x,
      y: position.y,
    });
  }

  destroy(options?: DestroyOptions): void {
    super.destroy(options);
    this.event.destroy();
  }

  private updateSprites(): void {
    this.removeChildren();

    if (this.hover) {
      const graphics = new Graphics();

      function drawBorder(color: number, alpha: number, offsetY: number): void {
        graphics
          .moveTo(graphicPoints.p1.x, graphicPoints.p1.y + offsetY)
          .lineTo(graphicPoints.p2.x, graphicPoints.p2.y + offsetY)
          .lineTo(graphicPoints.p3.x, graphicPoints.p3.y + offsetY)
          .lineTo(graphicPoints.p4.x, graphicPoints.p4.y + offsetY)
          .fill({ color, alpha })
          .moveTo(graphicPoints.p1.x + 6, graphicPoints.p1.y + offsetY)
          .lineTo(graphicPoints.p2.x, graphicPoints.p2.y + 3 + offsetY)
          .lineTo(graphicPoints.p3.x - 6, graphicPoints.p3.y + offsetY)
          .lineTo(graphicPoints.p4.x, graphicPoints.p4.y - 3 + offsetY)
          .cut();
      }

      drawBorder(0x000000, 0.33, 0);
      drawBorder(0xa7d1e0, 1, -2);
      drawBorder(0xffffff, 1, -3);

      this.addChild(graphics);
    }
  }

  private updateHover(hover: boolean): void {
    if (this.hover === hover) return;

    this.hover = hover;
    this.updateSprites();
  }
}
