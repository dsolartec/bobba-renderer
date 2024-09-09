import type { FederatedPointerEvent, Point } from 'pixi.js';
import type EventNode from './EventNode';
import type EventTarget from './EventTarget';
import type { EventGroupIdentifier, IEvent } from './EventTarget';
import BobbaRenderer from '../BobbaRenderer';

type IEventPropagationTrigger = (target: EventTarget, event: IEvent) => void;

export default class EventPropagation {
  private skip: Set<EventGroupIdentifier>;
  private allow: Set<EventGroupIdentifier>;
  private stopped: boolean;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly position: Point,
    private readonly event: FederatedPointerEvent,
    private readonly elements: EventNode[],
    private readonly trigger: IEventPropagationTrigger
  ) {
    this.skip = new Set();
    this.allow = new Set();
    this.stopped = false;

    this.propagate();
  }

  private propagate(): void {
    for (const node of this.elements) {
      if (
        this.bobbaRenderer.getEventsManager().getStopPropagation() ||
        this.event.propagationStopped ||
        this.stopped
      )
        break;

      if (
        this.skip.has(node.getTarget().getGroup().getEventGroupIdentifier()) &&
        !this.allow.has(node.getTarget().getGroup().getEventGroupIdentifier())
      )
        continue;

      if (
        this.allow.size > 0 &&
        !this.allow.has(node.getTarget().getGroup().getEventGroupIdentifier())
      )
        continue;

      const target = node.getTarget();

      this.trigger(target, {
        tag: target.getTag(),
        getElement: () => target.getTarget(),
        getOriginalEvent: () => this.event,
        getPosition: () => this.position,
        stopPropagation: () => {
          this.stopped = true;
        },
      });
    }
  }
}
