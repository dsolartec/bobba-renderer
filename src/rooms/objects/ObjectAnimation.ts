import BobbaRenderer from '../../BobbaRenderer';
import type IRoomPosition from '../interfaces/IRoomPosition';

export default class ObjectAnimation<T> {
  private startTime: number;
  private destroyed: boolean;

  private currentPosition: IRoomPosition | null;
  private diffPosition: IRoomPosition | null;

  private finishCurrent: (() => void) | null;
  private cancelTicker: (() => void) | null;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly onStart: (data: T) => void,
    private readonly onUpdatePosition: (
      position: IRoomPosition,
      data: T
    ) => void,
    private readonly onStop: (data: T) => void
  ) {
    this.startTime = 0;
    this.destroyed = false;

    this.currentPosition = null;
    this.diffPosition = null;

    this.finishCurrent = null;
    this.cancelTicker = null;
  }

  move(
    currentPosition: IRoomPosition,
    newPosition: IRoomPosition,
    data: T
  ): void {
    if (this.finishCurrent != null) {
      this.finishCurrent();
      this.finishCurrent = null;
    }

    this.onStart(data);

    this.startTime = performance.now();
    this.currentPosition = currentPosition;

    this.diffPosition = {
      roomX: newPosition.roomX - currentPosition.roomX,
      roomY: newPosition.roomY - currentPosition.roomY,
      roomZ: newPosition.roomZ - currentPosition.roomZ,
    };

    const handleFinish = () => {
      this.currentPosition = null;
      this.diffPosition = null;

      this.onStop(data);

      cancelTicker();
    };

    const cancelTicker = this.bobbaRenderer.subscribeToTicker(() => {
      if (this.destroyed) return;

      const timeDiff = performance.now() - this.startTime;

      let factor = timeDiff / 500;
      if (factor > 1) factor = 1;

      if (this.currentPosition != null && this.diffPosition != null) {
        this.onUpdatePosition(
          {
            roomX:
              this.currentPosition.roomX + this.diffPosition.roomX * factor,
            roomY:
              this.currentPosition.roomY + this.diffPosition.roomY * factor,
            roomZ:
              this.currentPosition.roomZ + this.diffPosition.roomZ * factor,
          },
          data
        );
      }

      if (factor >= 1) handleFinish();
    });

    this.finishCurrent = handleFinish;
    this.cancelTicker = cancelTicker;
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.cancelTicker && this.cancelTicker();
  }
}
