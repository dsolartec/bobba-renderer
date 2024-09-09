import { Container, Matrix, Texture, TilingSprite } from 'pixi.js';
import type IRoomUpdateTilesData from '../interfaces/IRoomUpdateTilesData';

export default class WallOuterCorner extends Container {
  private roomZ: number;

  constructor(private updateTilesData: IRoomUpdateTilesData) {
    super();

    this.roomZ = 0;
  }

  setRoomZ(value: number): void {
    this.roomZ = value;
    this.updateSprites();
  }

  private updateSprites(): void {
    this.removeChildren();

    const base = this.updateTilesData.sizes.base;

    const top = new TilingSprite(
      this.updateTilesData.textures.wall ?? Texture.WHITE
    );
    top.setFromMatrix(new Matrix(1, 0.5, 1, -0.5));
    top.tint = this.updateTilesData.colors.walls.top;
    top.width = this.updateTilesData.sizes.border;
    top.height = top.width;
    top.x = -top.width;
    top.y =
      -this.updateTilesData.sizes.walls.height +
      this.roomZ * base -
      base / 2 +
      top.width / 2 +
      base -
      top.width;

    this.addChild(top);
  }

  update(data: IRoomUpdateTilesData): void {
    this.updateTilesData = data;
    this.updateSprites();
  }
}
