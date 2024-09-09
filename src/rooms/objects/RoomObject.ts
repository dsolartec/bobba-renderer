import type Room from '../Room';

export default abstract class RoomObject {
  private room: Room | null;

  private destroyed: boolean;

  constructor() {
    this.room = null;

    this.destroyed = false;
  }

  abstract onRoomCameraMove(): void;

  abstract initialize(): void;
  abstract dispose(): void;

  getRoom(): Room {
    if (this.room == null) throw new Error('Invalid RoomObject');
    return this.room;
  }

  setRoom(room: Room): this {
    this.room = room;
    return this;
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;

    this.room = null;
    this.dispose();
  }
}
