import { Container, FederatedPointerEvent, Point } from 'pixi.js';
import BobbaRenderer from '../BobbaRenderer';

interface EventDragOptions {
  hits?: (point: Point) => boolean;
  initialOffsets?: Point;
  target: Container;
}

export default class EventDrag {
  private target: Container;
  private hits: ((Point: Point) => boolean) | null;

  private state: 'waiting' | 'wait_for_distance' | 'dragging';
  private startPosition: Point | null;
  private currentPosition: Point | null;
  private pointerID: number | null;
  private offsets: Point;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    options: Container | EventDragOptions
  ) {
    this.offsets = new Point();

    if (options instanceof Container) {
      this.target = options;
      this.hits = null;
    } else {
      this.target = options.target;
      this.offsets = options.initialOffsets ?? this.offsets;
      this.hits = options.hits ?? null;
    }

    this.state = 'waiting';
    this.startPosition = null;
    this.currentPosition = null;
    this.pointerID = null;

    this.updateTargetPosition();
  }

  initialize(): void {
    window.addEventListener('pointermove', this.handlePointerMove.bind(this));
    window.addEventListener('pointerup', this.handlePointerUp.bind(this));
  }

  updateOffsets(offsets: Point): void {
    this.offsets = offsets;
    this.updateTargetPosition();
  }

  private updateTargetPosition(): void {
    let diff = new Point();
    if (this.state === 'dragging') {
      diff.x = (this.currentPosition?.x ?? 0) - (this.startPosition?.x ?? 0);
      diff.y = (this.currentPosition?.y ?? 0) - (this.startPosition?.y ?? 0);
    }

    this.target.x = this.offsets.x + diff.x;
    this.target.y = this.offsets.y + diff.y;
  }

  handlePointerDown(e: FederatedPointerEvent): void {
    if (this.state !== 'waiting') return;

    const startPoint = e.getLocalPosition(this.target.parent);
    if (this.hits != null && !this.hits(startPoint)) return;

    this.state = 'wait_for_distance';
    this.startPosition = startPoint;
    this.pointerID = e.pointerId;
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.state === 'waiting' || this.pointerID !== e.pointerId) return;

    const box = this.bobbaRenderer
      .getApplication()
      .canvas.getBoundingClientRect();

    const position = new Point(
      e.clientX - box.x - this.target.parent.worldTransform.tx,
      e.clientY - box.y - this.target.parent.worldTransform.tx
    );

    if (this.state === 'wait_for_distance') {
      const distance = Math.sqrt(
        (position.x - (this.startPosition?.x ?? 0)) ** 2 +
          (position.y - (this.startPosition?.y ?? 0)) ** 2
      );

      if (distance >= 10) {
        this.state = 'dragging';
        this.startPosition = position;
        this.currentPosition = position;

        this.updateTargetPosition();
      }

      return;
    }

    this.currentPosition = position;

    this.updateTargetPosition();
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.state === 'waiting' || this.pointerID !== e.pointerId) return;

    let needUpdate = false;
    if (this.state === 'dragging') {
      this.offsets.x +=
        (this.currentPosition?.x ?? 0) - (this.startPosition?.x ?? 0);
      this.offsets.y +=
        (this.currentPosition?.y ?? 0) - (this.startPosition?.y ?? 0);

      needUpdate = true;
    }

    this.state = 'waiting';
    this.startPosition = null;
    this.currentPosition = null;
    this.pointerID = null;

    if (needUpdate) this.updateTargetPosition();
  }

  destroy(): void {
    window.removeEventListener(
      'pointermove',
      this.handlePointerMove.bind(this)
    );
    window.removeEventListener('pointerup', this.handlePointerUp.bind(this));
  }
}
