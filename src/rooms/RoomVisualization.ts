import { Container, Point, type DestroyOptions } from 'pixi.js';
import Tile from './tiles/Tile';
import TileMap from './tiles/TileMap';
import type {
  ParsedTileType,
  ParsedTileWall,
  TileMapBounds,
} from './tiles/TileMap';
import type IRoomPosition from './interfaces/IRoomPosition';
import TileCursor from './tiles/TileCursor';
import WallWest from './tiles/WallWest';
import type IRoomUpdateTilesData from './interfaces/IRoomUpdateTilesData';
import { WallKind } from './tiles/Walls';
import WallNorth from './tiles/WallNorth';
import WallOuterCorner from './tiles/WallOuterCorner';
import Stair from './tiles/Stair';
import StairCorner, { StairCornerType } from './tiles/StairCorner';
import type RoomDirection from './interfaces/RoomDirection';
import { Subject } from 'rxjs';
import BobbaRenderer from '../BobbaRenderer';

export default class RoomVisualization extends Container {
  private tileClickSubscription: Subject<IRoomPosition>;

  private primaryLayer: Container;

  private walls: (WallWest | WallNorth | WallOuterCorner)[];
  private tiles: (Tile | Stair | StairCorner)[];
  private tilesCursors: TileCursor[];

  private hideWalls: boolean;
  private hideFloor: boolean;
  private hideTileCursor: boolean;

  constructor(
    private readonly bobbaRenderer: BobbaRenderer,
    private readonly tilemap: TileMap
  ) {
    super();

    this.tileClickSubscription = new Subject();

    this.primaryLayer = new Container({ sortableChildren: true });
    this.addChild(this.primaryLayer);

    this.walls = [];
    this.tiles = [];
    this.tilesCursors = [];

    this.hideWalls = false;
    this.hideFloor = false;
    this.hideTileCursor = false;

    this.updateHeightmap();
  }

  static getZOrder({ roomX, roomY, roomZ }: IRoomPosition): number {
    return roomX + roomY + roomZ;
  }

  getTileClickSubscription(): Subject<IRoomPosition> {
    return this.tileClickSubscription;
  }

  getTileMap(): TileMap {
    return this.tilemap;
  }

  getRoomHeight(): number {
    return (this.getRoomBounds().maxY ?? 0) - (this.getRoomBounds().minY ?? 0);
  }

  getRoomWidth(): number {
    return (this.getRoomBounds().maxX ?? 0) - (this.getRoomBounds().minX ?? 0);
  }

  getPrimaryLayer(): Container {
    return this.primaryLayer;
  }

  private getRoomBounds(): TileMapBounds {
    const hasWalls = this.hideWalls || this.hideFloor;

    const bounds = this.tilemap.getBounds();

    const { sizes } = this.getUpdateTilesData();
    const { border: borderWidth, floor, walls } = sizes;

    const minOffsetY = hasWalls ? 0 : -walls.height - borderWidth;
    const minXOffset = hasWalls ? 0 : -borderWidth;
    const maxOffsetX = hasWalls ? 0 : borderWidth;
    const maxOffsetY = hasWalls ? 0 : floor.height;

    return {
      minX: (bounds.minX ?? 0) + minXOffset,
      maxX: (bounds.maxX ?? 0) + maxOffsetX,
      minY: (bounds.minY ?? 0) + minOffsetY,
      maxY: (bounds.maxY ?? 0) + maxOffsetY,
    };
  }

  private getUpdateTilesData(): IRoomUpdateTilesData {
    return {
      colors: {
        floor: {
          left: 0x838357,
          right: 0x666644,
          top: 0x989865,
        },
        walls: {
          left: 0x91949f,
          right: 0xbbbecd,
          top: 0x70727b,
        },
      },
      sizes: {
        base: 32,
        border: 8,
        floor: {
          height: 8,
        },
        walls: {
          height: this.tilemap.getLargestDiff() * 32 + 116,
        },
      },
      textures: {
        floor: null,
        wall: null,
      },
    };
  }

  private destroyAllSprites(): void {
    [...this.walls, ...this.tiles, ...this.tilesCursors].forEach((container) =>
      container.destroy({ children: true })
    );

    this.walls = [];
    this.tiles = [];
    this.tilesCursors = [];
  }

  private updateAllSprites(): void {
    [...this.walls, ...this.tiles].forEach((container) =>
      container.update(this.getUpdateTilesData())
    );
  }

  private createWestWallElement(
    { roomX, roomY, roomZ }: IRoomPosition,
    hideBorder: boolean,
    offsetZIndex: number,
    cutawayHeight: number | null = null
  ): void {
    const position = TileMap.getPosition({ roomX: roomX + 1, roomY, roomZ });

    const wall = new WallWest(
      this.getUpdateTilesData(),
      hideBorder,
      cutawayHeight
    );
    wall.x = position.x;
    wall.y = position.y;
    wall.zIndex =
      RoomVisualization.getZOrder({ roomX, roomY, roomZ }) * offsetZIndex;
    wall.setRoomZ(roomZ);

    this.primaryLayer.addChild(wall);
    this.walls.push(wall);
  }

  private createNorthWallElement(
    { roomX, roomY, roomZ }: IRoomPosition,
    hideBorder: boolean
  ): void {
    const position = TileMap.getPosition({ roomX, roomY: roomY + 1, roomZ });

    const data = this.getUpdateTilesData();

    const wall = new WallNorth(data, hideBorder, null);
    wall.x = position.x + data.sizes.base;
    wall.y = position.y;
    wall.zIndex = RoomVisualization.getZOrder({ roomX, roomY, roomZ });
    wall.setRoomZ(roomZ);

    this.primaryLayer.addChild(wall);
    this.walls.push(wall);
  }

  private createOuterCornerWallElement({
    roomX,
    roomY,
    roomZ,
  }: IRoomPosition): void {
    const position = TileMap.getPosition({ roomX: roomX + 1, roomY, roomZ });

    const wall = new WallOuterCorner(this.getUpdateTilesData());
    wall.x = position.x;
    wall.y = position.y;
    wall.zIndex = RoomVisualization.getZOrder({ roomX, roomY, roomZ });
    wall.setRoomZ(roomZ);

    this.primaryLayer.addChild(wall);
    this.walls.push(wall);
  }

  private createWallElement(
    roomPosition: IRoomPosition,
    wall: ParsedTileWall
  ): void {
    if (this.hideWalls || this.hideFloor) return;

    switch (wall.kind) {
      case WallKind.Column:
        this.createNorthWallElement(roomPosition, wall.hideBorder ?? false);
        break;

      case WallKind.Row:
        this.createWestWallElement(
          roomPosition,
          wall.hideBorder ?? false,
          wall.offsetZIndex ?? 0
        );
        break;

      case WallKind.InnerConner:
        this.createNorthWallElement(roomPosition, false);
        this.createWestWallElement(roomPosition, true, wall.offsetZIndex ?? 0);
        break;

      case WallKind.OuterConner:
        this.createOuterCornerWallElement(roomPosition);
        break;
    }
  }

  private createTileCursorElement(roomPosition: IRoomPosition): void {
    if (this.hideTileCursor) return;

    const position = TileMap.getPosition(roomPosition);

    const tileCursor = new TileCursor(this.bobbaRenderer, roomPosition);
    tileCursor.x = position.x;
    tileCursor.y = position.y;
    tileCursor.zIndex = RoomVisualization.getZOrder(roomPosition) * 1000;

    tileCursor.onClick = (position) =>
      this.tileClickSubscription.next(position);

    this.primaryLayer.addChild(tileCursor);
    this.tilesCursors.push(tileCursor);
  }

  private createTileElement(roomPosition: IRoomPosition): void {
    if (this.hideFloor) return;

    const xEven = roomPosition.roomX % 2 === 0;
    const yEven = roomPosition.roomY % 2 === 0;

    const position = TileMap.getPosition(roomPosition);

    const tile = new Tile(this.getUpdateTilesData());
    tile.setTilePosition(new Point(xEven ? 32 : 0, yEven ? 32 : 0));
    tile.x = position.x;
    tile.y = position.y;
    tile.zIndex = RoomVisualization.getZOrder(roomPosition);

    this.primaryLayer.addChild(tile);
    this.tiles.push(tile);

    this.createTileCursorElement(roomPosition);
  }

  private createDoor(roomPosition: IRoomPosition): void {
    this.createTileElement(roomPosition);
    this.createWestWallElement(roomPosition, true, 1010, 90);
  }

  private createStairElement(
    roomPosition: IRoomPosition,
    direction: RoomDirection
  ): void {
    const position = TileMap.getPosition(roomPosition);

    const stair = new Stair(this.getUpdateTilesData(), direction);
    stair.x = position.x;
    stair.y = position.y;
    stair.zIndex = RoomVisualization.getZOrder(roomPosition);

    this.primaryLayer.addChild(stair);
    this.tiles.push(stair);

    this.createTileCursorElement(roomPosition);

    this.createTileCursorElement({
      ...roomPosition,
      roomZ: roomPosition.roomZ + 1,
    });
  }

  private createStairCornerElement(
    roomPosition: IRoomPosition,
    cornerType: StairCornerType
  ): void {
    const position = TileMap.getPosition(roomPosition);

    const stair = new StairCorner(this.getUpdateTilesData(), cornerType);
    stair.x = position.x;
    stair.y = position.y;
    stair.zIndex = RoomVisualization.getZOrder(roomPosition);

    this.primaryLayer.addChild(stair);
    this.tiles.push(stair);

    this.createTileCursorElement(roomPosition);

    this.createTileCursorElement({
      ...roomPosition,
      roomZ: roomPosition.roomZ + 1,
    });
  }

  private createHeightmapElement(
    tile: ParsedTileType,
    roomX: number,
    roomY: number
  ): void {
    switch (tile.type) {
      case 'wall':
        this.createWallElement({ roomX, roomY, roomZ: tile.height }, tile);
        break;

      case 'tile':
        this.createTileElement({ roomX, roomY, roomZ: tile.z });
        break;

      case 'door':
        this.createDoor({ roomX, roomY, roomZ: tile.z });
        break;

      case 'stairs':
        this.createStairElement({ roomX, roomY, roomZ: tile.z }, tile.kind);
        break;

      case 'stairCorner':
        this.createStairCornerElement(
          { roomX, roomY, roomZ: tile.z },
          tile.kind
        );
        break;
    }
  }

  private updateHeightmap(): void {
    this.destroyAllSprites();

    const tilemap = this.tilemap.getTiles();
    for (let y = 0; y < tilemap.length; y++) {
      for (let x = 0; x < tilemap[y].length; x++) {
        this.createHeightmapElement(tilemap[y][x], x, y);
      }
    }

    this.updateAllSprites();

    this.x = -(this.getRoomBounds().minX ?? 0);
    this.y = -(this.getRoomBounds().minY ?? 0);
  }

  destroy(options?: DestroyOptions): void {
    super.destroy(options);
    this.destroyAllSprites();
  }
}
