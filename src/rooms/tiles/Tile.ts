import { Container, Point, PointData, Texture, TilingSprite } from 'pixi.js';
import Matrixes from '../utils/Matrixes';
import IRoomUpdateTilesData from '../interfaces/IRoomUpdateTilesData';

export type TileTypeNumber =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v';

export type TileType = TileTypeNumber | 'x';

const TILE_OFFSETS = {
  none: { x: 0, y: 0 },
  north: { x: 0, y: -1 },
  northEast: { x: 1, y: -1 },
  east: { x: 1, y: 0 },
  southEast: { x: 1, y: 1 },
  south: { x: 0, y: 1 },
  southWest: { x: -1, y: 1 },
  west: { x: -1, y: 0 },
  northWest: { x: -1, y: -1 },
};

export interface TileInfo {
  hasNearTilesForColumnWall: boolean;
  hasNearTilesForRowWall: boolean;
  rowEdge: boolean;
  columnEdge: boolean;
  innerEdge: boolean;
  height: number | null;
  rowDoor: boolean;
}

export default class Tile extends Container {
  private tilePosition: Point;

  constructor(private updateTilesData: IRoomUpdateTilesData) {
    super();

    this.tilePosition = new Point(0, 0);
  }

  private updateSprites(): void {
    this.removeChildren();

    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const width = this.updateTilesData.sizes.base;

    const tile = new TilingSprite({
      height: width,
      texture,
      tilePosition: this.tilePosition,
      tint: this.updateTilesData.colors.floor.top,
      width,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x: 0, y: 0 }));

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: this.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width,
    });

    borderLeft.setFromMatrix(Matrixes.getLeft({ width, height, x: 0, y: 0 }));

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: this.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width,
    });

    borderRight.setFromMatrix(Matrixes.getRight({ width, height, x: 0, y: 0 }));

    this.addChild(tile, borderLeft, borderRight);
  }

  public setTilePosition(point: Point) {
    this.tilePosition = point;
    this.updateSprites();
  }

  update(data: IRoomUpdateTilesData): void {
    this.updateTilesData = data;
    this.updateSprites();
  }

  private static getNumberOfTileType(tile: TileType | undefined): number | 'x' {
    if (tile === 'x' || !tile) return 'x';

    const parsedNumber = Number(tile);
    if (!isNaN(parsedNumber)) return parsedNumber;

    return tile.charCodeAt(0) - 96 + 9;
  }

  static getTile({
    tilemap,
    x,
    y,
    offset = 'none',
  }: {
    tilemap: TileType[][];
    offset?: keyof typeof TILE_OFFSETS;
  } & PointData): number | 'x' {
    x += TILE_OFFSETS[offset].x;
    y += TILE_OFFSETS[offset].y;

    if (!tilemap[y] || !tilemap[y][x]) return 'x';

    return this.getNumberOfTileType(tilemap[y][x]);
  }

  static isValidTile(tile: number | 'x'): tile is number {
    return !isNaN(Number(tile));
  }

  static getTileInfo({
    tilemap,
    x,
    y,
  }: { tilemap: TileType[][] } & PointData): TileInfo {
    const tile = this.getTile({ tilemap, x, y });

    const north = this.getTile({ tilemap, x, y, offset: 'north' });
    const east = this.getTile({ tilemap, x, y, offset: 'east' });
    const south = this.getTile({ tilemap, x, y, offset: 'south' });
    const west = this.getTile({ tilemap, x, y, offset: 'west' });

    const northEast = this.getTile({ tilemap, x, y, offset: 'northEast' });
    const northWest = this.getTile({ tilemap, x, y, offset: 'northWest' });
    const southEast = this.getTile({ tilemap, x, y, offset: 'southEast' });
    const southWest = this.getTile({ tilemap, x, y, offset: 'southWest' });

    return {
      hasNearTilesForColumnWall:
        this.isValidTile(tile) &&
        (this.isValidTile(northWest) ||
          this.isValidTile(west) ||
          this.isValidTile(southWest)) &&
        (this.isValidTile(northEast) ||
          this.isValidTile(east) ||
          this.isValidTile(southEast)),
      hasNearTilesForRowWall:
        this.isValidTile(tile) &&
        (this.isValidTile(northWest) ||
          this.isValidTile(north) ||
          this.isValidTile(northEast)) &&
        (this.isValidTile(southWest) ||
          this.isValidTile(south) ||
          this.isValidTile(southEast)),
      rowEdge: !this.isValidTile(west) && this.isValidTile(tile),
      columnEdge: !this.isValidTile(north) && this.isValidTile(tile),
      innerEdge:
        !this.isValidTile(northWest) &&
        this.isValidTile(tile) &&
        this.isValidTile(north) &&
        this.isValidTile(west),
      height: this.isValidTile(tile) ? tile : null,
      rowDoor:
        !this.isValidTile(north) &&
        !this.isValidTile(west) &&
        !this.isValidTile(northWest) &&
        !this.isValidTile(south) &&
        !this.isValidTile(southWest) &&
        this.isValidTile(east) &&
        this.isValidTile(tile),
    };
  }
}
