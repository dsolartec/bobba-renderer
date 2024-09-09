import BaseData from '../../utils/BaseData';

export interface FurniInfo {
  id: number;
  name: string;
  revision: number;
}

export type FurniPlacement = 'floor' | 'wall';

export default class FurnitureData extends BaseData {
  private floorItems: Map<string, FurniInfo>;
  private wallItems: Map<string, FurniInfo>;

  constructor(xml: string) {
    super(xml);

    this.floorItems = new Map();
    this.wallItems = new Map();

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<FurnitureData> {
    const response = await fetch(url);
    const text = await response.text();

    return new FurnitureData(text);
  }

  getFurniInfoByName(
    name: string,
    placement: FurniPlacement
  ): FurniInfo | null {
    const items = placement === 'floor' ? this.floorItems : this.wallItems;
    return items.get(name) ?? null;
  }

  private setCacheData(): void {
    const floorItems = this.querySelectorAll('roomitemtypes furnitype');
    floorItems.forEach((element) => {
      const name = element.getAttribute('classname');
      if (name == null || this.floorItems.has(name)) return;

      const id = Number(element.getAttribute('id'));
      if (isNaN(id)) return;

      let revision = Number(element.querySelector('revision')?.innerHTML);
      if (isNaN(revision)) revision = 0;

      this.floorItems.set(name, { id, name, revision });
    });

    const wallItems = this.querySelectorAll('wallitemtypes furnitype');
    wallItems.forEach((element) => {
      const name = element.getAttribute('classname');
      if (name == null || this.wallItems.has(name)) return;

      const id = Number(element.getAttribute('id'));
      if (isNaN(id)) return;

      let revision = Number(element.querySelector('revision')?.innerHTML);
      if (isNaN(revision)) revision = 0;

      this.wallItems.set(name, { id, name, revision });
    });
  }
}
