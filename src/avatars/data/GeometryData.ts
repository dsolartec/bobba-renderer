import BaseData from '../../utils/BaseData';

interface AvatarGeometry {
  id: string;
  width: number;
  height: number;
  dx: number;
  dy: number;
}

interface BodyPartItem {
  id: string;
  z: number;
  radius: number;
}

export interface BodyPart {
  id: string;
  z: number;
  items: BodyPartItem[];
}

export default class GeometryData extends BaseData {
  private bodyPartMap: Map<string, BodyPart>;
  private avatarSetMap: Map<string, string[]>;
  private geometries: Map<string, AvatarGeometry>;
  private bodyPartItemMap: Map<string, BodyPartItem>;

  constructor(xml: string) {
    super(xml);

    this.bodyPartMap = new Map();
    this.avatarSetMap = new Map();
    this.geometries = new Map();
    this.bodyPartItemMap = new Map();

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<GeometryData> {
    const response = await fetch(url);
    const text = await response.text();

    return new GeometryData(text);
  }

  getBodyPartItem(
    geometry: string,
    bodyPartID: string,
    itemID: string
  ): BodyPartItem | null {
    return (
      this.bodyPartItemMap.get(`${geometry}_${bodyPartID}_${itemID}`) ?? null
    );
  }

  getBodyPart(geometry: string, bodyPartID: string): BodyPart | null {
    return this.bodyPartMap.get(`${geometry}_${bodyPartID}`) ?? null;
  }

  getBodyParts(avaterSet: string): string[] {
    return this.avatarSetMap.get(avaterSet) ?? [];
  }

  getGeometry(geometry: string): AvatarGeometry | null {
    return this.geometries.get(geometry) ?? null;
  }

  private getGeometryFromElement(element: Element): AvatarGeometry {
    const id = element.getAttribute('id');
    if (id == null) throw new Error('Invalid id');

    const width = Number(element.getAttribute('width'));
    const height = Number(element.getAttribute('height'));
    const dx = Number(element.getAttribute('dx'));
    const dy = Number(element.getAttribute('dy'));

    return {
      id,
      width,
      height,
      dx,
      dy,
    };
  }

  private getBodyPartFromElement(element: Element): BodyPart | null {
    const id = element.getAttribute('id');
    if (id == null) return null;

    const z = Number(element.getAttribute('z'));
    if (isNaN(z)) return null;

    return { id, z, items: [] };
  }

  private getBodyPartItemFromElement(element: Element): BodyPartItem | null {
    const id = element.getAttribute('id');
    if (id == null) return null;

    const z = Number(element.getAttribute('z'));
    if (isNaN(z)) return null;

    const radius = Number(element.getAttribute('radius'));
    if (isNaN(radius)) return null;

    return { id, z, radius };
  }

  private setCacheData(): void {
    this.querySelectorAll(`canvas[scale="h"] geometry`).forEach((element) => {
      const geometry = this.getGeometryFromElement(element);
      this.geometries.set(geometry.id, geometry);
    });

    this.querySelectorAll('avatarset').forEach((element) => {
      const setID = element.getAttribute('id');
      if (setID == null) return;

      element.querySelectorAll('bodypart').forEach((bodyPart) => {
        const id = bodyPart.getAttribute('id');
        if (id != null) {
          this.avatarSetMap.set(setID, [
            ...(this.avatarSetMap.get(setID) ?? []),
            id,
          ]);
        }
      });
    });

    this.querySelectorAll('type').forEach((element) => {
      const typeID = element.getAttribute('id');
      if (typeID == null) return;

      element.querySelectorAll('bodypart').forEach((bp) => {
        const bodyPart = this.getBodyPartFromElement(bp);
        if (bodyPart == null) return;

        const bodyPartItems: BodyPartItem[] = [];
        bp.querySelectorAll('item').forEach((item) => {
          const bodyPartItem = this.getBodyPartItemFromElement(item);
          if (bodyPartItem == null) return;

          this.bodyPartItemMap.set(
            `${typeID}_${bodyPart.id}_${bodyPartItem.id}`,
            bodyPartItem
          );

          bodyPartItems.push(bodyPartItem);
        });

        this.bodyPartMap.set(`${typeID}_${bodyPart.id}`, {
          ...bodyPart,
          items: bodyPartItems,
        });
      });
    });
  }
}
