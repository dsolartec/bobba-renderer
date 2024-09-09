import ByteBuffer from 'bytebuffer';

export default class BobbaAssetBundle {
  public static readonly VERSION = 1;

  private files: Map<string, ArrayBuffer | Buffer> = new Map();
  private blobs: Map<string, Blob> = new Map();
  private strings: Map<string, string> = new Map();

  constructor(
    files: { fileName: string; buffer: ArrayBuffer | Buffer }[] = []
  ) {
    files.forEach((file) => this.files.set(file.fileName, file.buffer));
  }

  getFiles() {
    return Array.from(this.files.entries());
  }

  static fromBuffer(buffer: ArrayBuffer | Buffer) {
    const byteBuffer = ByteBuffer.wrap(buffer);

    const readFile = () => {
      const fileNameLength = byteBuffer.readUint16();
      const fileName = byteBuffer.readString(fileNameLength);
      const fileLength = byteBuffer.readUint32();
      const buffer = byteBuffer.readBytes(fileLength);

      return {
        fileName,
        buffer: buffer.toArrayBuffer(),
      };
    };

    const version = byteBuffer.readByte();
    const fileCount = byteBuffer.readUint16();
    const files: { fileName: string; buffer: ArrayBuffer | Buffer }[] = [];

    for (let i = 0; i < fileCount; i++) {
      const file = readFile();
      files.push(file);
    }

    return new BobbaAssetBundle(files);
  }

  static async fromUrl(url: string) {
    const response = await fetch(url);
    if (response.status >= 400)
      throw new Error(`Failed to load: ${url} - ${response.status}`);

    const buffer = await response.arrayBuffer();

    return BobbaAssetBundle.fromBuffer(buffer);
  }

  async getBlob(name: string): Promise<Blob> {
    const current = this.blobs.get(name);
    if (current != null) return current;

    const buffer = this.files.get(name);
    if (buffer == null) throw new Error(`Couldn't find ${name}.`);

    const blob = new Blob([buffer]);
    this.blobs.set(name, blob);

    return blob;
  }

  async getString(name: string): Promise<string> {
    const current = this.strings.get(name);
    if (current != null) return current;

    const buffer = this.files.get(name);
    if (buffer == null) throw new Error(`Couldn't find ${name}.`);

    const encoder = new TextDecoder();
    const string = encoder.decode(buffer);
    this.strings.set(name, string);

    return string;
  }
}
