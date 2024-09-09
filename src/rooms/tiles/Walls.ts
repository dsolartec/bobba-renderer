import { PointData } from 'pixi.js';
import BobbaRenderer from '../../BobbaRenderer';
import type { TileType } from './Tile';
import Tile from './Tile';

export enum WallKind {
  OuterConner,
  InnerConner,
  Row,
  Column,
}

export interface Wall {
  kind: WallKind;
  height: number;
}

interface RowWall {
  startY: number;
  endY: number;
  x: number;
  height: number;
}

interface ColumnWall {
  startX: number;
  endX: number;
  y: number;
  height: number;
}

interface WallsProps {
  eastToWest: ColumnWall[];
  northToSouth: RowWall[];
}

export default class Walls {
  private eastToWest: Map<string, ColumnWall>;
  private northToSouth: Map<string, RowWall>;

  constructor({ eastToWest, northToSouth }: WallsProps) {
    this.eastToWest = new Map();
    this.northToSouth = new Map();

    eastToWest.forEach((info) => {
      for (let x = info.startX; x <= info.endX; x++) {
        this.eastToWest.set(`${x}_${info.y}`, info);
      }
    });

    northToSouth.forEach((info) => {
      for (let y = info.startY; y <= info.endY; y++) {
        this.northToSouth.set(`${info.x}_${y}`, info);
      }
    });
  }

  private static getEastToWestFromTilemap(
    bobbaRenderer: BobbaRenderer,
    tilemap: TileType[][]
  ): ColumnWall[] {
    let lastWallStartY: number | null = null;
    let lastWallStartX: number | null = null;
    let wallStartX: number | null = null;
    let wallEndX: number | null = null;
    let height: number | null = null;

    function registerWall(y: number): boolean {
      if (wallStartX == null || wallEndX == null) return false;

      if (lastWallStartX != null && Math.abs(lastWallStartX - wallStartX) !== 1)
        return false;
      else lastWallStartX = wallStartX;

      if (lastWallStartY != null && Math.abs(lastWallStartY - y) !== 0)
        return false;

      walls.push({
        startX: wallStartX,
        endX: wallEndX,
        y: y - 1,
        height: height ?? 0,
      });

      return true;
    }

    const walls: ColumnWall[] = [];
    for (let y = 0; y < tilemap.length; y++) {
      for (let x = 0; x < tilemap[0].length; x++) {
        const current = Tile.getTileInfo({ tilemap, x, y });
        if (current.columnEdge && !current.rowDoor) {
          wallEndX = x;

          if (wallStartX == null) wallStartX = x;
          if (height == null || (current.height ?? 0) < height)
            height = current.height;
          if (lastWallStartY == null || Math.abs(lastWallStartY - y) === 0)
            lastWallStartY = y;
        } else if (wallStartX != null && wallEndX != null) {
          if (lastWallStartY != null && Math.abs(lastWallStartY - y) !== 0)
            break;

          let x1 = x;
          while (true) {
            if (x1 >= tilemap[y].length - 1) {
              x1 = -1;
              break;
            }

            const t = Tile.getTileInfo({ tilemap, x: x1, y });
            if (t.columnEdge) break;

            x1 += 1;
          }

          const path = bobbaRenderer
            .getPathfindingManager()
            .find(tilemap, { x: x1, y }, { x: wallStartX, y });

          if (path.length > 0) {
            registerWall(y);

            lastWallStartX = null;
            wallStartX = null;
            wallEndX = null;
            height = null;
            continue;
          }

          break;
        }
      }

      if (wallStartX != null && wallEndX != null) {
        if (!registerWall(y)) break;

        wallStartX = null;
        wallEndX = null;
        height = null;
      }
    }

    return walls;
  }

  private static getNorthToSouthFromTilemap(
    bobbaRenderer: BobbaRenderer,
    tilemap: TileType[][]
  ): RowWall[] {
    let lastWallStartX: number | null = null;
    let lastWallStartY: number | null = null;
    let wallStartY: number | null = null;
    let wallEndY: number | null = null;
    let height: number | null = null;

    function registerWall(x: number): boolean {
      if (wallStartY == null || wallEndY == null) return false;

      if (lastWallStartY != null && Math.abs(lastWallStartY - wallStartY) !== 1)
        return false;
      else lastWallStartY = wallStartY;

      if (lastWallStartX != null && Math.abs(lastWallStartX - x) !== 0)
        return false;

      walls.push({
        startY: wallStartY,
        endY: wallEndY,
        x: x - 1,
        height: height ?? 0,
      });

      return true;
    }

    const walls: RowWall[] = [];
    for (let x = 0; x < tilemap[0].length; x++) {
      for (let y = 0; y < tilemap.length; y++) {
        const westTile = Tile.getTileInfo({ tilemap, x: x - 1, y });
        const current = Tile.getTileInfo({ tilemap, x, y });
        if (current.rowEdge && !current.rowDoor) {
          wallEndY = y;

          if (wallStartY == null) wallStartY = y;
          if (height == null || (current.height ?? 0) < height)
            height = current.height;
          if (lastWallStartX == null || Math.abs(lastWallStartX - x) === 0)
            lastWallStartX = x;
        } else if (westTile.rowEdge && westTile.rowDoor) {
          continue;
        } else if (wallStartY != null && wallEndY != null) {
          if (lastWallStartX != null && Math.abs(lastWallStartX - x) !== 0)
            break;

          let y1 = y;
          while (true) {
            if (y1 >= tilemap.length - 1) {
              y1 = -1;
              break;
            }

            const t = Tile.getTileInfo({ tilemap, x, y: y1 });
            if (t.columnEdge) break;

            y1 += 1;
          }

          const path = bobbaRenderer
            .getPathfindingManager()
            .find(tilemap, { x, y: y1 }, { x, y: wallStartY });

          if (path.length > 0) {
            registerWall(x);

            lastWallStartY = null;
            wallStartY = null;
            wallEndY = null;
            height = null;
            continue;
          }

          break;
        }
      }

      if (wallStartY != null && wallEndY != null) {
        if (!registerWall(x)) break;

        wallStartY = null;
        wallEndY = null;
        height = null;
      }
    }

    return walls;
  }

  static fromTilemap(
    bobbaRenderer: BobbaRenderer,
    tilemap: TileType[][]
  ): Walls {
    return new Walls({
      eastToWest: Walls.getEastToWestFromTilemap(bobbaRenderer, tilemap),
      northToSouth: Walls.getNorthToSouthFromTilemap(bobbaRenderer, tilemap),
    });
  }

  private getEastToWest({ x, y }: PointData): ColumnWall | undefined {
    return this.eastToWest.get(`${x}_${y}`);
  }

  private getNorthSouth({ x, y }: PointData): RowWall | undefined {
    return this.northToSouth.get(`${x}_${y}`);
  }

  getOne({ x, y }: PointData): Wall | null {
    const eastWall = this.getEastToWest({ x: x + 1, y });
    const southWall = this.getNorthSouth({ x, y: y + 1 });

    if (eastWall && southWall) {
      return {
        kind: WallKind.OuterConner,
        height: Math.min(eastWall.height, southWall.height),
      };
    }

    const westWall = this.getEastToWest({ x, y });
    const northWall = this.getNorthSouth({ x, y });

    if (westWall && northWall) {
      return {
        kind: WallKind.InnerConner,
        height: Math.min(westWall.height, northWall.height),
      };
    }

    if (northWall) return { kind: WallKind.Row, height: northWall.height };
    if (westWall) return { kind: WallKind.Column, height: westWall.height };

    return null;
  }
}
