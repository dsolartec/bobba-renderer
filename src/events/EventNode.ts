import type { Subscription } from 'rxjs';
import RBush from 'rbush';
import type EventTarget from './EventTarget';
import type { IEventData } from './EventTarget';

export default class EventNode {
  private data: IEventData | null;
  private subscription: Subscription;

  constructor(
    private readonly target: EventTarget,
    private bush: RBush<EventNode>
  ) {
    this.data = null;

    this.subscription = target
      .getObservable()
      .subscribe(this._updateData.bind(this));
  }

  getTarget(): EventTarget {
    return this.target;
  }

  get minX(): number {
    if (this.data == null) throw new Error("Event data wasn't set");
    return this.data.x;
  }

  get minY(): number {
    if (this.data == null) throw new Error("Event data wasn't set");
    return this.data.y;
  }

  get maxX(): number {
    if (this.data == null) throw new Error("Event data wasn't set");
    return this.data.x + this.data.width;
  }

  get maxY(): number {
    if (this.data == null) throw new Error("Event data wasn't set");
    return this.data.y + this.data.height;
  }

  destroy(): void {
    if (this.data != null) this.bush.remove(this);
    this.subscription.unsubscribe();
  }

  private _updateData(data: IEventData | null): void {
    if (this.data != null) this.bush.remove(this);

    this.data = data;
    if (data != null) this.bush.insert(this);
  }
}
