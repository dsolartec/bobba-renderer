import { Container, Graphics, Point, Texture, TilingSprite } from 'pixi.js';
import type IRoomUpdateTilesData from '../interfaces/IRoomUpdateTilesData';
import Matrixes from '../utils/Matrixes';

export enum StairCornerType {
  NorthEast,
  SouthEast,
  SouthWest,
  NorthWest,
  InnerNorthEast,
  InnerNorthWest,
}

export default class StairCorner extends Container {
  constructor(
    private updateTilesData: IRoomUpdateTilesData,
    private cornerType: StairCornerType
  ) {
    super();

    this.sortableChildren = true;
  }

  private createNorthEastStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;

    const tile = new TilingSprite({
      height: index === 3 ? 8 : 16,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase - x,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x: x * 2, y: -x }));

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: tileBase - x,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x: x * 2,
        y: -x,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: stairBase,
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x,
        y: -x * 1.5,
      })
    );

    return [borderLeft, borderRight, tile];
  }

  private createSouthEastStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;

    const tile = new TilingSprite({
      height: tileBase - x,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase - x,
      zIndex: 1,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x, y: -x * 0.5 }));

    // | ______  (0, tb) -> (tms, tb)
    // | |  ___| (tms, tb) -> (tms, tb - sb)
    // y | |     (tms, tb - sb) -> (sb, tb - sb)
    // | | |     (sb, tb - sb) -> (sb, tms)
    // | |_|     (sb, tms) -> (tms, 0) -> (0, tb)
    // \-- x --
    const tileMaskSize = tileBase - x;
    const tileMask = new Graphics({
      scale: tile.scale,
      skew: tile.skew,
      x: tile.x,
      y: tile.y,
    })
      .lineTo(0, tileBase)
      .lineTo(tileMaskSize, tileBase)
      .lineTo(tileMaskSize, tileBase - stairBase)
      .lineTo(stairBase, tileBase - stairBase)
      .lineTo(stairBase, tileBase - tileMaskSize)
      .lineTo(0, tileBase - tileMaskSize)
      .lineTo(0, tileBase)
      .fill({ color: 0xffffff });

    tile.mask = tileMask;

    const borderLeftInner = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: tileBase - stairBase - x,
    });

    borderLeftInner.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeftInner.width,
        height: borderLeftInner.height,
        x: tileBase,
        y: -stairBase,
      })
    );

    const borderRightInner = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase - stairBase - x,
    });

    borderRightInner.setFromMatrix(
      Matrixes.getRight({
        width: borderRightInner.width,
        height: borderRightInner.height,
        x: -stairBase * (3 - index),
        y: -stairBase * 1.5 - x * 0.5,
      })
    );

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: borderLeftInner.tint,
      width: stairBase,
      zIndex: 2,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x,
        y: -x * 0.5,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: stairBase,
      zIndex: 2,
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x: stairBase * (3 - index),
        y: -stairBase * 1.5 - x * 0.5,
      })
    );

    return [
      borderLeftInner,
      borderRightInner,
      borderLeft,
      borderRight,
      tile,
      tileMask,
    ];
  }

  private createSouthWestStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;

    const tile = new TilingSprite({
      height: tileBase - x,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase - x,
      zIndex: 1,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x: 0, y: -x }));

    // | ______ (tb - tms, tb) -> (tb, tb)
    // | |___ | (tb, tb) -> (tb, tb - tms)
    // y    | | (tb, tb - tms) -> (tb - sb, tb - tms)
    // |    | | (tb - sb, tb - tms) -> (tb - sb, tb - sb)
    // |    |_| (tb - sb, tb - sb) -> (tb - tms, tb - sb)
    // \-- x -- (tb - tms, tb - sb) -> (tb - tms, tb)
    const tileMaskSize = tileBase - x;
    const tileMask = new Graphics({
      scale: tile.scale,
      skew: tile.skew,
      x: tile.x - x * 2,
      y: tile.y,
    })
      .lineTo(tileBase - tileMaskSize, tileBase)
      .lineTo(tileBase, tileBase)
      .lineTo(tileBase, tileBase - tileMaskSize)
      .lineTo(tileBase - stairBase, tileBase - tileMaskSize)
      .lineTo(tileBase - stairBase, tileBase - stairBase)
      .lineTo(tileBase - tileMaskSize, tileBase - stairBase)
      .lineTo(tileBase - tileMaskSize, tileBase)
      .fill({ color: 0xffffff });

    tile.mask = tileMask;

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: stairBase,
      zIndex: 2,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x: stairBase * (3 - index),
        y: -stairBase * (index - 1) * 1.5,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase - x,
      zIndex: 2,
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x: -x,
        y: -x * 1.5,
      })
    );

    return [borderLeft, borderRight, tile, tileMask];
  }

  private createNorthWestStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;

    const tile = new TilingSprite({
      height: tileBase - x,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase - x,
    });

    tile.setFromMatrix(Matrixes.getFloor({ x, y: -x * 1.5 }));

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: tileBase - x,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x,
        y: -x * 1.5,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase - x,
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x: 0,
        y: -x * 2,
      })
    );

    return [borderLeft, borderRight, tile];
  }

  private createInnerNorthEastStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;
    const y = tileBase - stairBase;

    const tile = new TilingSprite({
      height: tileBase - x,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase - x,
      zIndex: 5 + (3 - index),
    });

    tile.setFromMatrix(Matrixes.getFloor({ x: 0, y: -y + x }));

    // | ______  (0, tb) -> (tb, tb)
    // | |___  | (0, tb - sb) -> (tb - sb, tb - sb)
    // y     | | (tb - sb, tb - sb) -> (tb - sb, 0)
    // |     | | (tb, tb) -> (tb, 0)
    // |     |_| (tb - sb, 0) -> (tb, 0)
    // \-- x --
    const tileMaskSize = tileBase - (tileBase - x);
    const tileMask = new Graphics({
      x: -x * 2,
      y: -stairBase + x,
      scale: tile.scale,
      skew: tile.skew,
    })
      .lineTo(tileMaskSize, tileBase)
      .lineTo(tileBase, tileBase)
      .lineTo(tileBase, tileMaskSize)
      .lineTo(y, tileMaskSize)
      .lineTo(y, y)
      .lineTo(tileMaskSize, y)
      .lineTo(tileMaskSize, tileBase)
      .fill({ color: 0xffffff });

    tile.mask = tileMask;

    const borderLeftInner = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: y - x,
      zIndex: 4 + (3 - index),
    });

    borderLeftInner.setFromMatrix(
      Matrixes.getLeft({
        width: y - x,
        height,
        x: y - x,
        y: -stairBase * (3 - index) * 1.5,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase,
      zIndex: 3 + (3 - index),
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: tileBase,
        height,
        x: -x,
        y: -y + x * 0.5,
      })
    );

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: borderLeftInner.tint,
      width: stairBase,
      zIndex: tile.zIndex,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: stairBase,
        height,
        x: y - x,
        y: -(tileBase / 2) + (stairBase / 2) * (index + 1),
      })
    );

    return [tileMask, tile, borderLeftInner, borderRight, borderLeft];
  }

  private createInnerNorthWestStair(index: number): Container[] {
    const texture = this.updateTilesData.textures.floor ?? Texture.WHITE;
    const height = this.updateTilesData.sizes.floor.height;
    const stairBase = this.updateTilesData.sizes.border;
    const tileBase = this.updateTilesData.sizes.base;

    const x = stairBase * index;

    const tile = new TilingSprite({
      height: tileBase - x,
      texture,
      tilePosition: new Point(0, 0),
      tint: this.updateTilesData.colors.floor.top,
      width: tileBase - x,
    });

    tile.setFromMatrix(
      Matrixes.getFloor({
        x,
        y: -tileBase + stairBase + x * 1.5,
      })
    );

    // | ______  (0, tb) -> (tms, tb)
    // | |  ___| (tms, tb) -> (tms, tb - sb)
    // y | |     (tms, tb - sb) -> (sb, tb - sb)
    // | | |     (sb, tb - sb) -> (sb, tms)
    // | |_|     (sb, tms) -> (tms, 0) -> (0, tb)
    // \-- x --
    const tileMaskSize = tileBase - x;
    const tileMask = new Graphics({
      scale: tile.scale,
      skew: tile.skew,
      x: tile.x - x,
      y: tile.y + x * 0.5,
    })
      .lineTo(0, tileBase)
      .lineTo(tileMaskSize, tileBase)
      .lineTo(tileMaskSize, tileBase - stairBase)
      .lineTo(stairBase, tileBase - stairBase)
      .lineTo(stairBase, tileBase - tileMaskSize)
      .lineTo(0, tileBase - tileMaskSize)
      .lineTo(0, tileBase)
      .fill({ color: 0xffffff });

    tile.mask = tileMask;

    const borderLeftInner = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.left,
      width: tileBase - stairBase - x,
    });

    borderLeftInner.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeftInner.width,
        height: borderLeftInner.height,
        x: tileBase,
        y: -tileBase + x * 2,
      })
    );

    const borderRightInner = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: this.updateTilesData.colors.floor.right,
      width: tileBase - stairBase - x,
    });

    borderRightInner.setFromMatrix(
      Matrixes.getRight({
        width: borderRightInner.width,
        height: borderRightInner.height,
        x: -tileBase + stairBase + x,
        y: -stairBase * (3 - index) * 1.5,
      })
    );

    const borderLeft = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: borderLeftInner.tint,
      width: stairBase,
    });

    borderLeft.setFromMatrix(
      Matrixes.getLeft({
        width: borderLeft.width,
        height: borderLeft.height,
        x,
        y: -tileBase + stairBase + x * 1.5,
      })
    );

    const borderRight = new TilingSprite({
      height,
      texture,
      tilePosition: tile.tilePosition,
      tint: borderRightInner.tint,
      width: stairBase,
    });

    borderRight.setFromMatrix(
      Matrixes.getRight({
        width: borderRight.width,
        height: borderRight.height,
        x: stairBase * (3 - index),
        y: -stairBase * (3 - index) * 1.5,
      })
    );

    return [
      tile,
      tileMask,
      borderLeftInner,
      borderRightInner,
      borderLeft,
      borderRight,
    ];
  }

  private updateSprites(): void {
    this.removeChildren();

    const fns = {
      [StairCornerType.NorthEast]: this.createNorthEastStair,
      [StairCornerType.SouthEast]: this.createSouthEastStair,
      [StairCornerType.SouthWest]: this.createSouthWestStair,
      [StairCornerType.NorthWest]: this.createNorthWestStair,
      [StairCornerType.InnerNorthEast]: this.createInnerNorthEastStair,
      [StairCornerType.InnerNorthWest]: this.createInnerNorthWestStair,
    };

    for (let i = 0; i < 4; i++) {
      this.addChild(...fns[this.cornerType].call(this, i));
    }
  }

  update(data: IRoomUpdateTilesData): void {
    this.updateTilesData = data;
    this.updateSprites();
  }
}
