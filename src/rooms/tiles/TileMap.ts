import { PointData } from 'pixi.js';
import type IRoomPosition from '../interfaces/IRoomPosition';
import type RoomDirection from '../interfaces/RoomDirection';
import Stair from './Stair';
import type { StairCornerType } from './StairCorner';
import type { TileType } from './Tile';
import Tile from './Tile';
import Walls, { WallKind } from './Walls';
import BobbaRenderer from '../../BobbaRenderer';

export interface ParsedTileWall {
  type: 'wall';
  kind: WallKind;
  height: number;
  offsetZIndex?: number;
  hideBorder?: boolean;
}

export type ParsedTileType =
  | ParsedTileWall
  | { type: 'tile'; z: number }
  | { type: 'hidden' }
  | { type: 'stairs'; kind: RoomDirection; z: number }
  | { type: 'stairCorner'; kind: StairCornerType; z: number }
  | { type: 'door'; z: number };

export interface TileMapBounds {
  minX: number | null;
  minY: number | null;
  maxX: number | null;
  maxY: number | null;
}

export default class TileMap {
  constructor(
    private tiles: TileType[][],
    private tilemap: ParsedTileType[][],
    private largestDiff: number,
    private wallOffsets: PointData,
    private positionOffsets: PointData,
    private maskOffsets: PointData
  ) {}

  static getPosition(
    position: IRoomPosition,
    wallOffsets?: PointData
  ): PointData {
    const roomX = position.roomX + (wallOffsets?.x ?? 0);
    const roomY = position.roomY + (wallOffsets?.y ?? 0);

    const base = 32;

    const xPos = roomX * base - roomY * base;
    const yPos = roomX * (base / 2) + roomY * (base / 2);

    return { x: xPos, y: yPos - position.roomZ * base };
  }

  getOriginalTiles(): TileType[][] {
    return this.tiles;
  }

  getTiles(): ParsedTileType[][] {
    return this.tilemap;
  }

  getLargestDiff(): number {
    return this.largestDiff;
  }

  getBounds(): TileMapBounds {
    let bounds: TileMapBounds = {
      minX: null,
      minY: null,
      maxX: null,
      maxY: null,
    };

    this.tilemap.forEach((row, y) => {
      row.forEach((column, x) => {
        if (column.type !== 'tile') return;

        const position = TileMap.getPosition(
          {
            roomX: x,
            roomY: y,
            roomZ: column.z,
          },
          this.wallOffsets
        );

        const localMaxX = position.x + 64;
        const localMaxY = position.y + 32;

        if (bounds.minX == null || position.x < bounds.minX) {
          bounds.minX = position.x;
        }

        if (bounds.minY == null || position.y < bounds.minY) {
          bounds.minY = position.y;
        }

        if (bounds.maxX == null || localMaxX > bounds.maxX) {
          bounds.maxX = localMaxX;
        }

        if (bounds.maxY == null || localMaxY > bounds.maxY) {
          bounds.maxY = localMaxY;
        }
      });
    });

    if (
      bounds.minX == null ||
      bounds.minY == null ||
      bounds.maxX == null ||
      bounds.maxY == null
    ) {
      throw new Error('Couldnt figure out dimensions');
    }

    return bounds;
  }

  private static pad(tilemap: TileType[][]) {
    const firstRow = tilemap[0];
    if (firstRow == null) throw new Error('Invalid row');

    if (firstRow.some((type) => type !== 'x')) {
      tilemap = [firstRow.map(() => 'x' as const), ...tilemap];
    }

    const nonPrefixedRows = tilemap.filter((row) => row[0] !== 'x');
    if (nonPrefixedRows.length > 1) {
      tilemap = tilemap.map((row): TileType[] => ['x', ...row]);
    }
  }

  static fromArray(
    bobbaRenderer: BobbaRenderer,
    tilemap: TileType[][]
  ): TileMap {
    const wallInfo = Walls.fromTilemap(bobbaRenderer, tilemap);

    TileMap.pad(tilemap);

    const result: ParsedTileType[][] = tilemap.map((row) =>
      row.map(() => ({ type: 'hidden' as const }))
    );

    let lowestTile: number | null = null;
    let highestTile: number | null = null;

    function applyHighLowTile(current: number) {
      if (highestTile == null || current > highestTile) {
        highestTile = current;
      }

      if (lowestTile == null || current < lowestTile) {
        lowestTile = current;
      }
    }

    let hasDoor = false;

    for (let y = 0; y < tilemap.length; y++) {
      for (let x = 0; x < tilemap[y].length; x++) {
        const tileInfo = Tile.getTileInfo({ tilemap, x, y });
        const northTileInfo = Tile.getTileInfo({ tilemap, x, y: y - 1 });
        const southTileInfo = Tile.getTileInfo({ tilemap, x, y: y + 1 });
        const southEastTileInfo = Tile.getTileInfo({
          tilemap,
          x: x + 1,
          y: y + 1,
        });

        const wall = wallInfo.getOne({ x, y });
        if (wall) {
          let hideBorder: boolean | undefined;
          let offsetZIndex: number | undefined;

          switch (wall.kind) {
            case WallKind.Column:
              hideBorder = southEastTileInfo.height != null;
              break;

            case WallKind.Row:
              hideBorder =
                southTileInfo.rowDoor || southEastTileInfo.height != null;
              offsetZIndex = northTileInfo.rowDoor ? 1010 : 0;
              break;
          }

          result[y][x] = {
            type: 'wall',
            kind: wall.kind,
            height: wall.height,
            hideBorder,
            offsetZIndex,
          };
        }

        if (tileInfo.rowDoor && !hasDoor) {
          const wallBelow = wallInfo.getOne({ x, y: y + 1 });
          const wallAbove = wallInfo.getOne({ x, y: y - 1 });

          if (wallBelow || wallAbove) {
            result[y][x] = { type: 'door', z: tileInfo.height ?? 0 };
            hasDoor = true;
            continue;
          }
        }

        if (tileInfo.height == null) continue;

        applyHighLowTile(tileInfo.height);

        const stairsInfo = Stair.getStairsInfo({ tilemap, x, y });
        if (stairsInfo == null) {
          result[y][x] = { type: 'tile', z: tileInfo.height };
          continue;
        }

        if (stairsInfo.isCorner && stairsInfo.cornerType != null) {
          result[y][x] = {
            type: 'stairCorner',
            kind: stairsInfo.cornerType,
            z: tileInfo.height,
          };
        } else if (stairsInfo.direction != null) {
          result[y][x] = {
            type: 'stairs',
            kind: stairsInfo.direction,
            z: tileInfo.height,
          };
        }
      }
    }

    let largestDiff = 0;
    if (lowestTile != null && highestTile != null) {
      largestDiff = highestTile - lowestTile;
    }

    return new TileMap(
      tilemap,
      result,
      largestDiff,
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: -1, y: -1 }
    );
  }

  static fromString(bobbaRenderer: BobbaRenderer, tilemap: string): TileMap {
    tilemap = tilemap.replace(/\r/g, '\n');
    tilemap = tilemap.replace(/ /g, '');

    const newTileMap = tilemap
      .split('\n')
      .map((row) => row.trim())
      .filter((row) => row.length > 0)
      .map((row) => row.split('').map((str) => str as TileType));

    return TileMap.fromArray(bobbaRenderer, newTileMap);
  }
}
