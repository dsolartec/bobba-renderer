import { Container, Matrix, Texture, TilingSprite } from 'pixi.js';
import type IRoomUpdateTilesData from '../interfaces/IRoomUpdateTilesData';

export default class WallWest extends Container {
  protected offsetX: number;
  private roomZ: number;

  constructor(
    protected updateTilesData: IRoomUpdateTilesData,
    private hideBorder: boolean,
    private cutawayHeight: number | null
  ) {
    super();

    this.offsetX = 0;
    this.roomZ = 0;
  }

  setRoomZ(value: number): void {
    this.roomZ = value;
    this.updateSprites();
  }

  private getOffsetX(): number {
    return this.scale.x * this.offsetX - this.updateTilesData.sizes.border;
  }

  private getWallHeight(): number {
    return this.updateTilesData.sizes.walls.height - (this.cutawayHeight ?? 0);
  }

  protected updateSprites(): void {
    this.removeChildren();

    const wall = new TilingSprite(
      this.updateTilesData.textures.wall ?? Texture.WHITE
    );
    wall.height =
      this.getWallHeight() - this.roomZ * this.updateTilesData.sizes.base;
    wall.tint = this.updateTilesData.colors.walls.left;
    wall.setFromMatrix(new Matrix(-1, 0.5, 0, 1));
    wall.width = this.updateTilesData.sizes.base;
    wall.y = -this.updateTilesData.sizes.walls.height;
    wall.x = this.getOffsetX() + this.updateTilesData.sizes.border + wall.width;

    this.addChild(wall);

    if (!this.hideBorder) {
      const border = new TilingSprite(
        this.updateTilesData.textures.wall ?? Texture.WHITE
      );
      border.height =
        this.updateTilesData.sizes.walls.height +
        this.updateTilesData.sizes.floor.height;
      border.tint = this.updateTilesData.colors.walls.right;
      border.width = this.updateTilesData.sizes.border;
      border.setFromMatrix(new Matrix(-1, -0.5, 0, 1));
      border.y = wall.y + wall.width / 2;
      border.x = this.getOffsetX() + this.updateTilesData.sizes.border;

      this.addChild(border);
    }

    const top = new TilingSprite(
      this.updateTilesData.textures.wall ?? Texture.WHITE
    );
    top.tint = this.updateTilesData.colors.walls.top;
    top.setFromMatrix(new Matrix(1, 0.5, 1, -0.5));
    top.width = this.updateTilesData.sizes.border;
    top.height = wall.width;
    top.y = wall.y + wall.width / 2 - top.width / 2;
    top.x = this.getOffsetX();

    this.addChild(top);
  }

  update(data: IRoomUpdateTilesData): void {
    this.updateTilesData = data;
    this.updateSprites();
  }
}
