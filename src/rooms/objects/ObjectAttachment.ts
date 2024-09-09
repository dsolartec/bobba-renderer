import { Container, type ContainerOptions, type PointData } from 'pixi.js';

export default class ObjectAttachment extends Container {
  protected _onUpdateSize: (() => void) | null;
  protected offsets: PointData;

  constructor(options?: ContainerOptions) {
    super(options);

    this._onUpdateSize = null;
    this.offsets = { x: 0, y: 0 };
  }

  set onUpdateSize(callback: () => void) {
    this._onUpdateSize = callback;
  }

  setOffsets(offsets: PointData): void {
    this.offsets = offsets;
  }
}
