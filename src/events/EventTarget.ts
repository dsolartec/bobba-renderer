import type {
  Container,
  ContainerOptions,
  FederatedPointerEvent,
  Point,
  PointData,
} from 'pixi.js';
import { BehaviorSubject, type Observable } from 'rxjs';
import BobbaRenderer from '../BobbaRenderer';

export interface IEventData {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const TILE_CURSOR_EVENT_GROUP = Symbol('TILE_CURSOR');
export const TOOLTIP_EVENT_GROUP = Symbol('TOOLTIP');
export const BUTTON_EVENT_GROUP = Symbol('BUTTON');
export const SCROLLBAR_EVENT_GROUP = Symbol('SCROLLBAR');
export const WINDOW_EVENT_GROUP = Symbol('WINDOW');
export const CAMERA_EVENT_GROUP = Symbol('CAMERA');
export const FURNITURE_GROUP = Symbol('FURNITURE');
export const AVATAR_GROUP = Symbol('AVATAR');

export type EventGroupIdentifier =
  | typeof TILE_CURSOR_EVENT_GROUP
  | typeof TOOLTIP_EVENT_GROUP
  | typeof BUTTON_EVENT_GROUP
  | typeof SCROLLBAR_EVENT_GROUP
  | typeof WINDOW_EVENT_GROUP
  | typeof CAMERA_EVENT_GROUP
  | typeof FURNITURE_GROUP
  | typeof AVATAR_GROUP;

export interface IEventGroup {
  getEventGroupIdentifier(): EventGroupIdentifier;
}

export interface IEvent<T extends Container = Container> {
  tag: string | null;
  getElement(): T;
  getOriginalEvent(): FederatedPointerEvent;
  getPosition(): Point;
  stopPropagation(): void;
}

interface EventTargetHandlers<T extends Container> {
  onClick(event: IEvent<T>): void;
  onDoubleClick(event: IEvent<T>): void;
  onPointerDown(event: IEvent<T>): void;
  onPointerUp(event: IEvent<T>): void;
  onPointerOver(event: IEvent<T>): void;
  onPointerMove(event: IEvent<T>): void;
  onPointerOut(event: IEvent<T>): void;
  onPointerTargetChanged(event: IEvent<T>): void;
}

export interface EventTargetApplyToExtraOptions<T extends Container> {
  cursor: ContainerOptions['cursor'];
  offsets: () => PointData;
  onComplete(event: EventTarget<T>): void;
}

export interface BaseEventTargetOptions<T extends Container> {
  group: IEventGroup | EventGroupIdentifier;
  hits(point: PointData): boolean;
  observable: Observable<IEventData | null>;
  tag?: string;
  target: T;
  zIndez: number;
}

export type EventTargetOptions<T extends Container = Container> =
  BaseEventTargetOptions<T> & Partial<EventTargetHandlers<T>>;

export type EventTargetApplyToOptions<T extends Container = Container> = Omit<
  EventTargetOptions<T>,
  'hits' | 'observable' | 'target'
> &
  Partial<EventTargetApplyToExtraOptions<T>>;

export default class EventTarget<T extends Container = Container>
  implements Omit<EventTargetHandlers<T>, 'onDoubleClick'>
{
  private doubleClickInitialEvent: IEvent<T> | null;
  private doubleClickTimeout: number | null;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly options: EventTargetOptions<T>
  ) {
    this.doubleClickInitialEvent = null;
    this.doubleClickTimeout = null;

    this.bobbaRenderer.getEventsManager().register(this);
  }

  static applyTo<T extends Container>(
    bobbaRenderer: BobbaRenderer,
    target: T,
    options: EventTargetApplyToOptions<T>
  ): T {
    const observable = new BehaviorSubject<IEventData | null>(null);

    if (options.cursor === 'pointer') target.eventMode = 'static';
    target.cursor = options.cursor;

    target.onRender = () => {
      const position = target.getGlobalPosition();

      observable.next({
        width: target.width,
        height: target.height,
        x: position.x,
        y: position.y,
      });
    };

    const e = new EventTarget(bobbaRenderer, {
      ...options,
      hits: (point) => {
        const offsetX = options.offsets ? options.offsets().x : 0;
        const offsetY = options.offsets ? options.offsets().y : 0;

        return (
          point.x > offsetX + target.x &&
          point.x < offsetX + target.x + target.width &&
          point.y > offsetY + target.y &&
          point.y < offsetY + target.y + target.height
        );
      },
      observable,
      target,
    });

    if (options.onComplete != null) options.onComplete(e);

    return target;
  }

  getGroup(): IEventGroup {
    if (this.options.group instanceof Object) {
      if ('getEventGroupIdentifier' in this.options.group) {
        return this.options.group;
      }

      throw new Error('Invalid event target group.');
    }

    return {
      getEventGroupIdentifier: () => {
        if (!(this.options.group instanceof Object)) return this.options.group;
        throw new Error('Invalid event target group.');
      },
    };
  }

  getObservable(): Observable<IEventData | null> {
    return this.options.observable;
  }

  getTag(): string | null {
    return this.options.tag ?? null;
  }

  getTarget(): T {
    return this.options.target;
  }

  getZIndex(): number {
    return this.options.zIndez;
  }

  hits(point: PointData): boolean {
    return this.options.hits(point);
  }

  private resetDoubleClick(): void {
    if (this.doubleClickInitialEvent != null) {
      this.doubleClickInitialEvent = null;
    }

    if (this.doubleClickTimeout != null) {
      clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = null;
    }
  }

  onClick(event: IEvent<T>): void {
    if (this.doubleClickInitialEvent == null) {
      this.options.onClick && this.options.onClick(event);

      if (this.options.onDoubleClick != null) {
        this.doubleClickInitialEvent = event;
        this.doubleClickTimeout = window.setTimeout(
          () => this.resetDoubleClick(),
          350
        );
      }
    } else {
      event.stopPropagation();

      this.options.onDoubleClick &&
        this.options.onDoubleClick(this.doubleClickInitialEvent);
      this.resetDoubleClick();
    }
  }

  onPointerDown(event: IEvent<T>): void {
    this.options.onPointerDown && this.options.onPointerDown(event);
  }

  onPointerUp(event: IEvent<T>): void {
    this.options.onPointerUp && this.options.onPointerUp(event);
  }

  onPointerOver(event: IEvent<T>): void {
    this.options.onPointerOver && this.options.onPointerOver(event);
  }

  onPointerMove(event: IEvent<T>): void {
    this.options.onPointerMove && this.options.onPointerMove(event);
  }

  onPointerOut(event: IEvent<T>): void {
    this.options.onPointerOut && this.options.onPointerOut(event);
  }

  onPointerTargetChanged(event: IEvent<T>): void {
    this.options.onPointerTargetChanged &&
      this.options.onPointerTargetChanged(event);
  }

  destroy(): void {
    this.bobbaRenderer.getEventsManager().remove(this);
  }
}
