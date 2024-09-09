import Room, { type RoomTileMap } from './Room';
import RoomCamera from './RoomCamera';
import BobbaRenderer from '../BobbaRenderer';

interface CreateRoomOptions {
  addToStage?: boolean;
  tilemap: RoomTileMap;
  withCamera?: boolean;
}

export default class RoomsManager {
  constructor(private readonly bobbaRenderer: BobbaRenderer) {}

  createRoom({
    addToStage = true,
    tilemap,
    withCamera = true,
  }: CreateRoomOptions): Room {
    const room = new Room(this.bobbaRenderer, tilemap);

    if (withCamera) {
      const camera = new RoomCamera(this.bobbaRenderer, room);
      if (addToStage)
        this.bobbaRenderer.getApplication().stage.addChild(camera);
    } else if (addToStage)
      this.bobbaRenderer.getApplication().stage.addChild(room);

    return room;
  }
}
