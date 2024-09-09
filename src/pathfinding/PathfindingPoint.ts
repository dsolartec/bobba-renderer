import { PointData } from 'pixi.js';

export default class PathfindingPoint {
  public parent: PathfindingPoint | null;

  public f: number;
  public g: number;
  public h: number;

  public opened: boolean;
  public closed: boolean;

  constructor(
    public readonly x: number,
    public readonly y: number,
    public walkable: boolean
  ) {
    this.parent = null;

    this.f = 0;
    this.g = 0;
    this.h = 0;

    this.opened = false;
    this.closed = false;
  }

  toRoomPoint(): PointData {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
