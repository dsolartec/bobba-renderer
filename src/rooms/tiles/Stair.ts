import { Container, Point, PointData, Texture, TilingSprite } from 'pixi.js';
import type IRoomUpdateTilesData from '../interfaces/IRoomUpdateTilesData';
import type { TileType } from './Tile';
import Tile from './Tile';
import Matrixes from '../utils/Matrixes';
import { StairCornerType } from './StairCorner';
import RoomDirection from '../interfaces/RoomDirection';

interface StairsInfo {
  isCorner: boolean;
  direction?: RoomDirection;
  cornerType?: StairCornerType;
}

export default class Stair extends Container {
  constructor(
    private updateTilesData: IRoomUpdateTilesData,
    private direction: RoomDirection
  ) {
    super();
  }

  private createNorthStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;
    const y = -x * 1.5;

    const tile = new TilingSprite({
      height: stairBase,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase,
    });

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: tile.width,
    });

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: stairBase,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x, y }));

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x,
        y,
      })
    );

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x,
        y,
      })
    );

    return [borderLeft, borderRight, tile];
  }

  private createEastStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;

    const tile = new TilingSprite({
      height: tileBase,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: stairBase,
    });

    tile.setFromMatrix(
      Matrixes.getFloor({
        x,
        y: -x / 2,
      })
    );

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: stairBase,
      zIndex: 1,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: stairBase,
        height,
        x,
        y: -x / 2,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase,
      zIndex: 1,
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x: -stairBase * (3 - index),
        y: -(tileBase - stairBase * 2.5) - x / 2,
      })
    );

    return [tile, borderLeft, borderRight];
  }

  private createSouthStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;
    const y = -(tileBase - stairBase) + x * 0.5;

    const tile = new TilingSprite({
      height: stairBase,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase,
    });

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: tile.width,
    });

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: stairBase,
      zIndex: 1,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x, y }));

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x,
        y,
      })
    );

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x,
        y,
      })
    );

    return [tile, borderLeft, borderRight];
  }

  private createWestStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = -stairBase * index;
    const y = x * 1.5;

    const tile = new TilingSprite({
      height: tileBase,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: stairBase,
    });

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: stairBase,
    });

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase,
    });

    tile.setFromMatrix(
      Matrixes.getFloor({
        x: x + tileBase - stairBase,
        y: y + stairBase * 1.5,
      })
    );

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: stairBase,
        height,
        x: x + tileBase - stairBase,
        y: y + stairBase * 1.5,
      })
    );

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x,
        y,
      })
    );

    return [borderLeft, borderRight, tile];
  }

  private updateSprites(): void {
    this.removeChildren();

    const fns: { [key in RoomDirection]?: (index: number) => Container[] } = {
      [RoomDirection.North]: this.createNorthStair,
      [RoomDirection.East]: this.createEastStair,
      [RoomDirection.South]: this.createSouthStair,
      [RoomDirection.West]: this.createWestStair,
    };

    for (let i = 0; i < 4; i++) {
      const children = fns[this.direction]?.call(this, i) ?? [];
      this.addChild(...children);
    }
  }

  update(data: IRoomUpdateTilesData): void {
    this.updateTilesData = data;
    this.updateSprites();
  }

  static getStairsInfo({
    tilemap,
    x,
    y,
  }: { tilemap: TileType[][] } & PointData): StairsInfo | null {
    const currentTile = Tile.getTile({ tilemap, x, y });
    const northTile = Tile.getTile({ tilemap, x, y, offset: 'north' });
    const northEastTile = Tile.getTile({ tilemap, x, y, offset: 'northEast' });
    const eastTile = Tile.getTile({ tilemap, x, y, offset: 'east' });
    const southEastTile = Tile.getTile({ tilemap, x, y, offset: 'southEast' });
    const southTile = Tile.getTile({ tilemap, x, y, offset: 'south' });
    const southWestTile = Tile.getTile({ tilemap, x, y, offset: 'southWest' });
    const northWestTile = Tile.getTile({ tilemap, x, y, offset: 'northWest' });
    const westTile = Tile.getTile({ tilemap, x, y, offset: 'west' });

    if (!Tile.isValidTile(currentTile)) return null;

    const hasValidNorthTile =
      Tile.isValidTile(northTile) && northTile - currentTile === 1;
    const hasValidSouthTile =
      Tile.isValidTile(southTile) && southTile - currentTile === 1;
    const hasValidWestTile =
      Tile.isValidTile(westTile) && westTile - currentTile === 1;
    const hasValidEastTile =
      Tile.isValidTile(eastTile) && eastTile - currentTile === 1;

    if (hasValidWestTile && !hasValidEastTile) {
      if (
        hasValidNorthTile ||
        (Tile.isValidTile(eastTile) &&
          eastTile === currentTile &&
          Tile.isValidTile(northEastTile) &&
          northEastTile - currentTile === 1)
      )
        return { isCorner: true, cornerType: StairCornerType.InnerNorthWest };

      return { isCorner: false, direction: RoomDirection.West };
    }

    if (hasValidEastTile && !hasValidWestTile) {
      if (hasValidNorthTile) {
        return { isCorner: true, cornerType: StairCornerType.InnerNorthEast };
      }

      return { isCorner: false, direction: RoomDirection.East };
    }

    if (
      hasValidNorthTile &&
      !hasValidEastTile &&
      !hasValidSouthTile &&
      !hasValidWestTile
    )
      return { isCorner: false, direction: RoomDirection.North };

    if (
      hasValidSouthTile &&
      !hasValidWestTile &&
      !hasValidNorthTile &&
      !hasValidEastTile
    )
      return { isCorner: false, direction: RoomDirection.South };

    // Corners
    if (
      Tile.isValidTile(northEastTile) &&
      (!Tile.isValidTile(westTile) || westTile <= currentTile) &&
      northEastTile - currentTile === 1
    )
      return { isCorner: true, cornerType: StairCornerType.NorthEast };

    if (
      Tile.isValidTile(southEastTile) &&
      (!Tile.isValidTile(eastTile) || eastTile <= currentTile) &&
      southEastTile - currentTile === 1
    )
      return { isCorner: true, cornerType: StairCornerType.SouthEast };

    if (
      Tile.isValidTile(southWestTile) &&
      (!Tile.isValidTile(westTile) || westTile <= currentTile) &&
      southWestTile - currentTile === 1
    )
      return { isCorner: true, cornerType: StairCornerType.SouthWest };

    if (
      Tile.isValidTile(northWestTile) &&
      (!Tile.isValidTile(westTile) || westTile <= currentTile) &&
      northWestTile - currentTile === 1
    )
      return { isCorner: true, cornerType: StairCornerType.NorthWest };

    return null;
  }
}
