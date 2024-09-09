import type { Texture } from 'pixi.js';

interface UpdateFloorColorsData {
  left: number;
  right: number;
  top: number;
}

interface UpdateWallColorsData {
  left: number;
  right: number;
  top: number;
}

interface UpdateColorsData {
  floor: UpdateFloorColorsData;
  walls: UpdateWallColorsData;
}

interface UpdateFloorSizesData {
  height: number;
}

interface UpdateWallSizesData {
  height: number;
}

interface UpdateSizesData {
  base: number;
  border: number;
  floor: UpdateFloorSizesData;
  walls: UpdateWallSizesData;
}

interface UpdateTexturesData {
  floor: Texture | null;
  wall: Texture | null;
}

export default interface IRoomUpdateTilesData {
  colors: UpdateColorsData;
  sizes: UpdateSizesData;
  textures: UpdateTexturesData;
}
