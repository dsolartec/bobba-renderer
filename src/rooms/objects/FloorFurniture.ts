import BobbaRenderer from '../../BobbaRenderer';
import BaseFurniture from '../../furniture/BaseFurniture';
import type IRoomPosition from '../interfaces/IRoomPosition';
import RoomVisualization from '../RoomVisualization';
import TileMap from '../tiles/TileMap';
import RoomObject from './RoomObject';

export interface FloorFurnitureOptions {
  animationID?: number;
  direction: number;
  name: string;
  onLoad?: () => void;
  roomPosition: IRoomPosition;
}

export default class FloorFurniture extends RoomObject {
  private furni: BaseFurniture | null;

  private roomPosition: IRoomPosition;

  private animationID: number | null;
  private direction: number;
  private readonly name: string;

  private readonly onLoad: (() => void) | null;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    options: FloorFurnitureOptions
  ) {
    super();

    this.furni = null;

    this.roomPosition = options.roomPosition;

    this.animationID = options.animationID ?? null;
    this.direction = options.direction;
    this.name = options.name;

    this.onLoad = options.onLoad ?? null;
  }

  setNextAnimation(): void {
    if (this.furni == null) return;

    const available = this.furni.getAvailableAnimations();
    if (available.length === 0) return;

    let index = available.findIndex((id) => id === this.furni?.getAnimation());
    if (index < 0) return;

    if (index === available.length - 1) index = 0;
    else index += 1;

    this.animationID = available[index];
    this.furni.setAnimation(this.animationID);
  }

  hasAnimation(): boolean {
    if (this.furni == null) return false;

    return this.furni.getAvailableAnimations().length > 0;
  }

  setAnimation(animationID: number): void {
    if (this.furni == null) return;

    this.animationID = animationID;
    this.furni.setAnimation(this.animationID);
  }

  private updatePosition(): void {
    const position = this.roomPosition;

    this.furni?.setPoint(TileMap.getPosition(position));
    this.furni?.setZIndex(RoomVisualization.getZOrder(position) * 999);
  }

  onRoomCameraMove(): void {}

  initialize(): void {
    this.furni = new BaseFurniture(
      this.bobbaRenderer,
      this.getRoom().getRoomVisualization().getPrimaryLayer(),
      'floor',
      this.name,
      this.animationID,
      this.direction,
      this.onLoad
    );

    this.updatePosition();
  }

  dispose(): void {}
}
