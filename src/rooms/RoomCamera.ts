import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Point,
  PointData,
  Rectangle,
  type DestroyOptions,
} from 'pixi.js';
import type Room from './Room';
import BobbaRenderer from '../BobbaRenderer';

enum RoomCameraStateType {
  Dragging = 'DRAGGING',
  WaitForDistance = 'WAIT_FOR_DISTANCE',
  Waiting = 'WAITING',
}

interface RoomCameraDraggingState {
  type: RoomCameraStateType.Dragging;
  current: PointData;
  pointerID: number;
  start: PointData;
  skipBoundsCheck?: boolean;
}

interface RoomCameraWaitForDistanceState {
  type: RoomCameraStateType.WaitForDistance;
  start: PointData;
  pointerID: number;
}

type RoomCameraState =
  | { type: RoomCameraStateType.Waiting }
  | RoomCameraWaitForDistanceState
  | RoomCameraDraggingState;

interface RoomCameraOptions {
  initializeDragEvents: boolean;
}

export default class RoomCamera extends Container {
  private state: RoomCameraState;
  private target: Window;

  private offsets: PointData;

  private bg: Graphics;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly room: Room,
    private readonly options: RoomCameraOptions = { initializeDragEvents: true }
  ) {
    super({ zIndex: -1 });

    this.state = { type: RoomCameraStateType.Waiting };
    this.target = window;

    this.offsets = {
      x: ~~(
        this.getParentBounds().width / 2 -
        this.room.getRoomVisualization().getRoomWidth() / 2
      ),
      y: ~~(
        this.getParentBounds().height / 2 -
        this.room.getRoomVisualization().getRoomHeight() / 2
      ),
    };

    this.bg = new Graphics();
    this.addChild(this.bg, this.room);

    if (options.initializeDragEvents) {
      this.eventMode = 'static';
      this.hitArea = this.getParentBounds();

      this.addListener('pointerdown', this.handlePointerDown.bind(this));
      this.target.addEventListener(
        'pointermove',
        this.handlePointerMove.bind(this)
      );
      this.target.addEventListener(
        'pointerup',
        this.handlePointerUp.bind(this)
      );

      window.addEventListener('resize', this.handleResize.bind(this));
    }

    this.renderBG();
    this.updatePosition();
  }

  destroy(options?: DestroyOptions): void {
    super.destroy(options);

    this.removeListener('pointerdown', this.handlePointerDown.bind(this));
    this.target.removeEventListener(
      'pointermove',
      this.handlePointerMove.bind(this)
    );
    this.target.removeEventListener(
      'pointerup',
      this.handlePointerUp.bind(this)
    );
  }

  private getParentBounds(): Rectangle {
    return this.bobbaRenderer.getApplication().screen;
  }

  private updatePosition(): void {
    switch (this.state.type) {
      case RoomCameraStateType.Dragging: {
        const diffX = this.state.current.x - this.state.start.x;
        const diffY = this.state.current.y - this.state.start.y;

        this.room.x = this.offsets.x + diffX;
        this.room.y = this.offsets.y + diffY;
        break;
      }

      default: {
        this.room.x = this.offsets.x;
        this.room.y = this.offsets.y;
        break;
      }
    }

    this.room.getObjects().forEach((object) => object.onRoomCameraMove());
  }

  private handlePointerDown(e: FederatedPointerEvent): void {
    const position = e.getLocalPosition(this.parent);

    if (this.state.type === RoomCameraStateType.Waiting) {
      this.state = {
        type: RoomCameraStateType.WaitForDistance,
        pointerID: e.pointerId,
        start: { x: position.x, y: position.y },
      };
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    const box = this.bobbaRenderer
      .getApplication()
      .canvas.getBoundingClientRect();

    const position = new Point(
      e.clientX - box.x - this.parent.worldTransform.tx,
      e.clientY - box.y - this.parent.worldTransform.tx
    );

    if (this.state.type === RoomCameraStateType.WaitForDistance) {
      if (this.state.pointerID !== e.pointerId) return;

      const distance = Math.sqrt(
        (position.x - this.state.start.x) ** 2 +
          (position.y - this.state.start.y) ** 2
      );

      if (distance >= 10) {
        this.state = {
          type: RoomCameraStateType.Dragging,
          current: { x: position.x, y: position.y },
          pointerID: e.pointerId,
          start: { x: position.x, y: position.y },
        };

        this.updatePosition();
      }
    } else if (this.state.type === RoomCameraStateType.Dragging) {
      if (this.state.pointerID !== e.pointerId) return;

      this.bobbaRenderer.getEventsManager().setStopPropagation(true);

      this.state = {
        ...this.state,
        current: { x: position.x, y: position.y },
      };

      this.updatePosition();
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (
      this.state.type === RoomCameraStateType.Waiting ||
      this.state.pointerID !== e.pointerId
    )
      return;

    const needUpdate = this.state.type === RoomCameraStateType.Dragging;
    if (this.state.type === RoomCameraStateType.Dragging) {
      const diffX = this.state.current.x - this.state.start.x;
      const diffY = this.state.current.y - this.state.start.y;

      const currentOffsets = {
        x: this.offsets.x + diffX,
        y: this.offsets.y + diffY,
      };

      this.offsets = currentOffsets;

      this.bobbaRenderer.getEventsManager().setStopPropagation(false);
    }

    this.state = { type: RoomCameraStateType.Waiting };
    if (needUpdate) this.updatePosition();
  }

  private renderBG(): void {
    this.bg
      .clear()
      .rect(0, 0, this.getParentBounds().width, this.getParentBounds().height)
      .fill(0x000000);
  }

  private handleResize(): void {
    this.renderBG();
  }
}
