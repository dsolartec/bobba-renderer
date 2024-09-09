import BaseData from '../../utils/BaseData';

export interface FigureDataPaletteColor {
  color: number;
  id: number;
  index: number;
  isHC: boolean;
  selectable: boolean;
}

export interface FigureDataPalette {
  id: number;
  colors: Map<number, FigureDataPaletteColor>;
}

export interface FigureDataPart {
  colorable: boolean;
  colorIndex: number;
  id: number;
  index: number;
  type: string;
}

export interface FigureDataSet {
  colorable: boolean;
  gender: 'F' | 'M' | 'U';
  hiddenLayers: Set<string>;
  id: number;
  isHC: boolean;
  parts: FigureDataPart[];
  preselectable: boolean;
  selectable: boolean;
  sellable: boolean;
}

interface FigureDataSetType {
  paletteID: number;
  sets: Map<number, FigureDataSet>;
  type: string;
}

export default class FigureData extends BaseData {
  private palettes: Map<number, FigureDataPalette>;
  private setTypes: Map<string, FigureDataSetType>;

  constructor(xml: string) {
    super(xml);

    this.palettes = new Map();
    this.setTypes = new Map();

    this.setCacheData();
  }

  static async fromUrl(url: string): Promise<FigureData> {
    const response = await fetch(url);
    const text = await response.text();

    return new FigureData(text);
  }

  getPaletteForSetType(setTypeID: string): FigureDataPalette | null {
    const setType = this.setTypes.get(setTypeID);
    if (setType == null) return null;

    return this.palettes.get(setType.paletteID) ?? null;
  }

  getColor(setTypeID: string, colorID: number): number | null {
    return (
      this.getPaletteForSetType(setTypeID)?.colors.get(colorID)?.color ?? null
    );
  }

  getParts(setTypeID: string, setID: number): FigureDataPart[] {
    return this.setTypes.get(setTypeID)?.sets.get(setID)?.parts ?? [];
  }

  getSets(setTypeID: string): FigureDataSet[] {
    return Array.from(this.setTypes.get(setTypeID)?.sets.values() ?? []);
  }

  getHiddenLayers(setTypeID: string, setID: number): string[] {
    return Array.from(
      this.setTypes.get(setTypeID)?.sets.get(setID)?.hiddenLayers ?? new Set()
    );
  }

  private setCacheData(): void {
    this.querySelectorAll('colors palette').forEach((palette) => {
      const paletteID = Number(palette.getAttribute('id'));
      if (isNaN(paletteID)) return;

      const paletteColors: FigureDataPalette['colors'] = new Map();
      Array.from(palette.querySelectorAll('color')).forEach((colorXML) => {
        const colorID = Number(colorXML.getAttribute('id'));
        if (isNaN(colorID)) return;

        let index = Number(colorXML.getAttribute('index'));
        if (isNaN(index)) return;

        let clubLevel = Number(colorXML.getAttribute('club'));
        if (isNaN(clubLevel)) clubLevel = 0;

        let selectable = Number(colorXML.getAttribute('selectable'));
        if (isNaN(selectable)) selectable = 1;

        paletteColors.set(colorID, {
          color: parseInt(colorXML.innerHTML, 16),
          id: colorID,
          index,
          isHC: clubLevel === 2,
          selectable: selectable === 1,
        });
      });

      this.palettes.set(paletteID, {
        id: paletteID,
        colors: paletteColors,
      });
    });

    this.querySelectorAll('sets settype').forEach((setTypeXML) => {
      const setType = setTypeXML.getAttribute('type');
      if (setType == null) return;

      const paletteID = Number(setTypeXML.getAttribute('paletteid'));
      if (isNaN(paletteID)) return;

      const sets: FigureDataSetType['sets'] = new Map();
      Array.from(setTypeXML.querySelectorAll('set')).forEach((setXML) => {
        const setID = Number(setXML.getAttribute('id'));
        if (isNaN(setID)) return;

        let gender = setXML.getAttribute('gender');
        if (gender == null) gender = 'U';
        if (gender != 'M' && gender != 'F' && gender != 'U') return;

        let clubLevel = Number(setXML.getAttribute('club'));
        if (isNaN(clubLevel)) clubLevel = 0;

        let colorable = Number(setXML.getAttribute('colorable'));
        if (isNaN(colorable)) colorable = 0;

        let selectable = Number(setXML.getAttribute('selectable'));
        if (isNaN(selectable)) selectable = 1;

        let preselectable = Number(setXML.getAttribute('preselectable'));
        if (isNaN(preselectable)) preselectable = 0;

        let sellable = Number(setXML.getAttribute('sellable'));
        if (isNaN(sellable)) sellable = 0;

        const hiddenLayers: FigureDataSet['hiddenLayers'] = new Set();
        Array.from(setXML.querySelectorAll('hiddenLayers layer')).forEach(
          (hiddenLayerXML) => {
            const hiddenPartType = hiddenLayerXML.getAttribute('parttype');
            if (hiddenPartType == null) return;

            hiddenLayers.add(hiddenPartType);
          }
        );

        const parts: FigureDataSet['parts'] = [];
        Array.from(setXML.querySelectorAll('part')).forEach((partXML) => {
          const partID = Number(partXML.getAttribute('id'));
          if (isNaN(partID)) return;

          const partType = partXML.getAttribute('type');
          if (partType == null) return;

          let colorable = Number(partXML.getAttribute('colorable'));
          if (isNaN(colorable)) colorable = 0;

          const index = Number(partXML.getAttribute('index'));
          if (isNaN(colorable)) return;

          const colorIndex = Number(partXML.getAttribute('colorindex'));
          if (isNaN(colorable)) return;

          parts.push({
            colorable: colorable === 1,
            colorIndex,
            id: partID,
            index,
            type: partType,
          });
        });

        sets.set(setID, {
          colorable: colorable === 1,
          gender,
          hiddenLayers,
          id: setID,
          isHC: clubLevel === 2,
          parts,
          preselectable: preselectable === 1,
          selectable: selectable === 1,
          sellable: sellable === 1,
        });
      });

      this.setTypes.set(setType, {
        paletteID,
        sets,
        type: setType,
      });
    });
  }
}
