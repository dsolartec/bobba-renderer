import { Matrix, PointData } from 'pixi.js';

export interface Dimensions {
  width: number;
  height: number;
}

interface PlanePoints {
  a: PointData;
  b: PointData;
  c: PointData;
  d: PointData;
}

export default class Matrixes {
  private static createPlaneMatrix(
    points: PlanePoints,
    { width, height, x, y }: Dimensions & PointData
  ): Matrix {
    let diffDxCx = points.d.x - points.c.x;
    let diffDyCy = points.d.y - points.c.y;
    let diffBxCx = points.b.x - points.c.x;
    let diffByCy = points.b.y - points.c.y;

    if (Math.abs(diffBxCx - width) <= 1) diffBxCx = width;
    if (Math.abs(diffByCy - width) <= 1) diffByCy = width;
    if (Math.abs(diffDxCx - height) <= 1) diffDxCx = height;
    if (Math.abs(diffDyCy - height) <= 1) diffDyCy = height;

    const a = diffBxCx / width;
    const b = diffByCy / width;
    const c = diffDxCx / height;
    const d = diffDyCy / height;

    const baseX = x + points.c.x;
    const baseY = y + points.c.y;

    return new Matrix(a, b, c, d, baseX, baseY);
  }

  static getFloor({ x, y }: PointData): Matrix {
    return this.createPlaneMatrix(
      {
        c: { x: 0, y: 16 },
        d: { x: 32, y: 0 },
        a: { x: 64, y: 16 },
        b: { x: 32, y: 32 },
      },
      {
        width: 32,
        height: 32,
        x,
        y,
      }
    );
  }

  static getLeft({ width, height, x, y }: Dimensions & PointData): Matrix {
    return this.createPlaneMatrix(
      {
        b: { x: 0, y: 16 },
        c: { x: width, y: 16 + width / 2 },
        d: { x: width, y: 16 + width / 2 + height },
        a: { x: 0, y: 16 + height },
      },
      { width, height, x, y }
    );
  }

  static getRight({ width, height, x, y }: Dimensions & PointData): Matrix {
    return this.createPlaneMatrix(
      {
        b: { x: 32, y: 32 },
        c: { x: 32 + width, y: 32 - width / 2 },
        d: { x: 32 + width, y: 32 + height - width / 2 },
        a: { x: 32, y: 32 + height },
      },
      { width, height, x, y }
    );
  }
}
