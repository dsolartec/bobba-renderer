import { Container, PointData, type DestroyOptions } from 'pixi.js';
import type { TileType } from './tiles/Tile';
import TileMap, { type ParsedTileType } from './tiles/TileMap';
import type IRoomPosition from './interfaces/IRoomPosition';
import RoomObject from './objects/RoomObject';
import BobbaRenderer from '../BobbaRenderer';
import RoomVisualization from './RoomVisualization';
import FloorFurniture, {
  FloorFurnitureOptions,
} from './objects/FloorFurniture';
import Avatar, { AvatarOptions } from './objects/Avatar';

export type RoomTileMap = TileType[][] | string;

export default class Room extends Container {
  private _onTileClick: ((position: IRoomPosition) => void) | null;

  private visualization: RoomVisualization;
  private objects: Set<RoomObject>;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    tilemap: RoomTileMap
  ) {
    super();

    this._onTileClick = null;

    this.visualization = new RoomVisualization(
      bobbaRenderer,
      typeof tilemap === 'string'
        ? TileMap.fromString(bobbaRenderer, tilemap)
        : TileMap.fromArray(bobbaRenderer, tilemap)
    );

    this.visualization.getTileClickSubscription().subscribe((position) => {
      this._onTileClick && this._onTileClick(position);
    });

    this.objects = new Set();

    this.addChild(this.visualization);
  }

  set onTileClick(callback: (position: IRoomPosition) => void) {
    this._onTileClick = callback;
  }

  getObjects(): RoomObject[] {
    return Array.from(this.objects);
  }

  getRoomVisualization(): RoomVisualization {
    return this.visualization;
  }

  getTileAtPosition({ x, y }: PointData): ParsedTileType | null {
    const tiles = this.getRoomVisualization().getTileMap().getTiles();
    if (tiles[y] == null || tiles[y][x] == null) return null;

    return tiles[y][x];
  }

  createAvatar(options: AvatarOptions): Avatar {
    const avatar = new Avatar(this.bobbaRenderer, options);
    this.addObject(avatar);

    return avatar;
  }

  createFurniture(options: FloorFurnitureOptions): FloorFurniture {
    const furni = new FloorFurniture(this.bobbaRenderer, options);
    this.addObject(furni);

    return furni;
  }

  addObject(...objects: RoomObject[]): void {
    for (const object of objects) {
      if (this.objects.has(object)) continue;

      this.objects.add(object.setRoom(this));
      object.initialize();
    }
  }

  destroy(options?: DestroyOptions): void {
    super.destroy(options);

    this.visualization.destroy();
    this.objects.forEach((object) => object.destroy());
  }
}
