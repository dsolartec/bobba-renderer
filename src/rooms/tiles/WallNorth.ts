import WallWest from './WallWest';

export default class WallNorth extends WallWest {
  updateSprites(): void {
    this.offsetX = this.updateTilesData.sizes.base;
    this.scale.x = -1;

    const left = this.updateTilesData.colors.walls.left;
    this.updateTilesData.colors.walls.left =
      this.updateTilesData.colors.walls.right;
    this.updateTilesData.colors.walls.right = left;

    super.updateSprites();
  }
}
