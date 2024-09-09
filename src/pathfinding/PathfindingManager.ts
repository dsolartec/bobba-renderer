import { PointData } from 'pixi.js';
import PathfindingPoint from './PathfindingPoint';
import { TileType } from '../rooms/tiles/Tile';

export default class PathfindingManager {
  constructor() {}

  private generatePointsFromTilemap(
    tilemap: TileType[][]
  ): PathfindingPoint[][] {
    let points: PathfindingPoint[][] = [];

    for (let y = 0; y < tilemap.length; y++) {
      points[y] = [];

      for (let x = 0; x < tilemap[y].length; x++) {
        points[y][x] = new PathfindingPoint(x, y, tilemap[y][x] !== 'x');
      }
    }

    return points;
  }

  private isValidPoint(
    points: PathfindingPoint[][],
    { x, y }: PointData
  ): boolean {
    return x >= 0 && x < points[0].length && y >= 0 && y < points.length;
  }

  private getNeighbors(
    points: PathfindingPoint[][],
    point: PathfindingPoint
  ): PathfindingPoint[] {
    const neighbors: PathfindingPoint[] = [];

    const { x, y } = point.toRoomPoint();

    // ↑
    if (this.isValidPoint(points, { x, y: y - 1 })) {
      const current = points[y - 1][x];
      if (current.walkable) neighbors.push(current);
    }

    // →
    if (this.isValidPoint(points, { x: x + 1, y })) {
      const current = points[y][x + 1];
      if (current.walkable) neighbors.push(current);
    }

    // ↓
    if (this.isValidPoint(points, { x, y: y + 1 })) {
      const current = points[y + 1][x];
      if (current.walkable) neighbors.push(current);
    }

    // ←
    if (this.isValidPoint(points, { x: x - 1, y })) {
      const current = points[y][x - 1];
      if (current.walkable) neighbors.push(current);
    }

    // ↖
    if (this.isValidPoint(points, { x: x - 1, y: y - 1 })) {
      const current = points[y - 1][x - 1];
      if (current.walkable) neighbors.push(current);
    }

    // ↗
    if (this.isValidPoint(points, { x: x + 1, y: y - 1 })) {
      const current = points[y - 1][x + 1];
      if (current.walkable) neighbors.push(current);
    }

    // ↘
    if (this.isValidPoint(points, { x: x + 1, y: y + 1 })) {
      const current = points[y + 1][x + 1];
      if (current.walkable) neighbors.push(current);
    }

    // ↙
    if (this.isValidPoint(points, { x: x - 1, y: y + 1 })) {
      const current = points[y + 1][x - 1];
      if (current.walkable) neighbors.push(current);
    }

    return neighbors;
  }

  private applyHeuristic({ x, y }: PointData): number {
    const F = Math.SQRT2 - 1;
    return (x < y ? F * x + y : F * y + x) * 1000000;
  }

  private backtrace(point: PathfindingPoint): PointData[] {
    const path = [point.toRoomPoint()];

    while (point.parent) {
      point = point.parent;
      path.push(point.toRoomPoint());
    }

    return path.reverse();
  }

  find(
    tilemap: TileType[][],
    { x: startX, y: startY }: PointData,
    { x: endX, y: endY }: PointData
  ): PointData[] {
    const points = this.generatePointsFromTilemap(tilemap);

    if (
      !this.isValidPoint(points, { x: startX, y: startY }) ||
      !this.isValidPoint(points, { x: endX, y: endY })
    )
      return [];

    const [startPoint, endPoint] = [points[startY][startX], points[endY][endX]];
    const openList: PathfindingPoint[] = [];

    openList.push(startPoint);
    startPoint.opened = true;

    while (openList.length > 0) {
      openList.sort((a, b) => a.f - b.f);

      const current = openList.pop();
      if (current == null)
        throw new Error('Current pathfinding point is null.');

      current.closed = true;

      if (current === endPoint) return this.backtrace(current);

      const neighbors = this.getNeighbors(points, current);
      for (const neighbor of neighbors) {
        if (neighbor.closed) continue;

        const { x, y } = neighbor.toRoomPoint();
        const ng =
          current.g +
          (x - current.x === 0 || y - current.y === 0 ? 1 : Math.SQRT2);

        if (!neighbor.opened || ng < neighbor.g) {
          neighbor.g = ng;
          neighbor.h =
            neighbor.h ||
            this.applyHeuristic({
              x: Math.abs(x - endX),
              y: Math.abs(y - endY),
            });
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;

          if (neighbor.opened) {
            openList.sort((a, b) => a.f - b.f);
            continue;
          }

          openList.push(neighbor);
          neighbor.opened = true;
        }
      }
    }

    return [];
  }
}
