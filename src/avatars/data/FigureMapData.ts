import BaseData from '../../utils/BaseData';

export default class FigureMapData extends BaseData {
  private libraryForPartMap: Map<string, string>;
  private allLibraries: string[];

  constructor(xml: string) {
    super(xml);

    this.libraryForPartMap = new Map();
    this.allLibraries = [];

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<FigureMapData> {
    const response = await fetch(url);
    const text = await response.text();

    return new FigureMapData(text);
  }

  private getLibraryForPartKey(partID: number, type: string): string {
    return `${partID}_${type}`;
  }

  getLibraryOfPart(partID: number, type: string): string | null {
    return (
      this.libraryForPartMap.get(
        this.getLibraryForPartKey(partID, type === 'hrb' ? 'hr' : type)
      ) ?? null
    );
  }

  getLibraries(): string[] {
    return this.allLibraries;
  }

  private setCacheData(): void {
    const allLibraries = this.querySelectorAll('lib');
    allLibraries.forEach((element) => {
      const libraryID = element.getAttribute('id');
      if (libraryID == null) return;

      this.allLibraries.push(libraryID);

      const parts = Array.from(element.querySelectorAll('part'));
      parts.forEach((part) => {
        const partID = Number(part.getAttribute('id'));
        if (isNaN(partID)) return;

        const partType = part.getAttribute('type');
        if (partType == null) return;

        this.libraryForPartMap.set(
          this.getLibraryForPartKey(partID, partType),
          libraryID
        );
      });
    });
  }
}
