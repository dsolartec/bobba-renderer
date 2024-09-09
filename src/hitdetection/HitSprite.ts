import { Sprite, type DestroyOptions } from 'pixi.js';
import EventTarget, {
  type EventTargetOptions,
  type IEventData,
} from '../events/EventTarget';
import type IEventTarget from '../events/IEventTarget';
import type HitTexture from './HitTexture';
import { BehaviorSubject } from 'rxjs';
import BobbaRenderer from '../BobbaRenderer';

interface HitSpriteOptions extends Pick<EventTargetOptions, 'group' | 'tag'> {
  texture: HitTexture;
}

export default class HitSprite extends Sprite implements IEventTarget {
  private event: EventTarget | null;
  private eventObservable: BehaviorSubject<IEventData | null>;

  private mirrored: boolean;
  private ignoreMouse: boolean;

  private _onClick: EventTargetOptions['onClick'];
  private _onDoubleClick: EventTargetOptions['onDoubleClick'];

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly options: HitSpriteOptions
  ) {
    super(options.texture);

    this.event = null;
    this.eventObservable = new BehaviorSubject<IEventData | null>(null);

    this.mirrored = false;
    this.ignoreMouse = false;

    this.onRender = () => this.eventObservable.next(this.getHitBox());

    this.createEvent();
  }

  set onClick(callback: EventTargetOptions['onClick']) {
    this._onClick = callback;
  }

  set onDoubleClick(callback: EventTargetOptions['onDoubleClick']) {
    this._onDoubleClick = callback;
  }

  private getHitBox(): IEventData {
    const position = this.getGlobalPosition();

    if (this.mirrored) {
      return {
        x: position.x - this.texture.width,
        y: position.y,
        width: this.texture.width,
        height: this.texture.height,
      };
    }

    return {
      x: position.x,
      y: position.y,
      width: this.texture.width,
      height: this.texture.height,
    };
  }

  createEvent(): void {
    this.event = new EventTarget(this.bobbaRenderer, {
      group: this.options.group,
      hits: (point) => {
        if (!this.visible || this.ignoreMouse) return false;

        const hitBox = this.getHitBox();

        const inBoundsX =
          hitBox.x <= point.x && point.x <= hitBox.x + hitBox.width;
        const inBoundsY =
          hitBox.y <= point.y && point.y <= hitBox.y + hitBox.height;

        if (inBoundsX && inBoundsY) {
          const position = this.getGlobalPosition();

          return this.options.texture.hits(
            point,
            { x: position.x, y: position.y },
            this.mirrored
          );
        }

        return false;
      },
      observable: this.eventObservable,
      onClick: (e) => this._onClick && this._onClick(e),
      onDoubleClick: (e) => this._onDoubleClick && this._onDoubleClick(e),
      target: this,
      tag: this.options.tag,
      zIndez: this.zIndex,
    });
  }

  setIgnoreMouse(value: boolean): void {
    this.ignoreMouse = value;
  }

  setMirror(value: boolean): void {
    this.mirrored = value;
    this.scale.x = value ? -1 : 1;
  }

  destroyEvent(): void {
    if (this.event != null) {
      this.event.destroy();
      this.event = null;
    }
  }

  destroy(options?: DestroyOptions): void {
    super.destroy(options);

    this.destroyEvent();
  }
}
