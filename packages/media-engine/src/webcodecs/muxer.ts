export interface MuxerConfig {
  width: number;
  height: number;
  frameRate: number;
  duration: number;
}

export interface TrackConfig {
  type: 'video' | 'audio';
  codec: string;
  timescale?: number;
}

interface Box {
  type: string;
  size: number;
  data?: Uint8Array;
  children?: Box[];
}

export class MP4Muxer {
  private config: MuxerConfig;
  private chunks: EncodedVideoChunk[] = [];
  private timescale = 1000;

  constructor(config: MuxerConfig) {
    this.config = config;
  }

  addChunk(chunk: EncodedVideoChunk): void {
    this.chunks.push(chunk);
  }

  finalize(): ArrayBuffer {
    const boxes: Box[] = [];

    // ftyp box
    boxes.push(this.createFtypBox());

    // moov box
    boxes.push(this.createMoovBox());

    // mdat box
    boxes.push(this.createMdatBox());

    return this.serializeBoxes(boxes);
  }

  private createFtypBox(): Box {
    const majorBrand = new TextEncoder().encode('isom');
    const minorVersion = new Uint8Array([0, 0, 0, 0]);
    const compatibleBrands = new TextEncoder().encode('isomavc1mp41');
    
    const data = new Uint8Array(majorBrand.length + minorVersion.length + compatibleBrands.length);
    data.set(majorBrand, 0);
    data.set(minorVersion, majorBrand.length);
    data.set(compatibleBrands, majorBrand.length + minorVersion.length);

    return {
      type: 'ftyp',
      size: 8 + data.length,
      data,
    };
  }

  private createMoovBox(): Box {
    const children: Box[] = [];

    // mvhd box (movie header)
    children.push(this.createMvhdBox());

    // trak box (track)
    children.push(this.createTrakBox());

    const data = this.serializeBoxes(children);

    return {
      type: 'moov',
      size: 8 + data.byteLength,
      data: new Uint8Array(data),
    };
  }

  private createMvhdBox(): Box {
    const data = new Uint8Array(100);
    const view = new DataView(data.buffer);

    // version and flags
    view.setUint32(0, 0);

    // creation time
    view.setUint32(4, 0);
    // modification time
    view.setUint32(8, 0);
    // timescale
    view.setUint32(12, this.timescale);
    // duration
    view.setUint32(16, Math.floor(this.config.duration * this.timescale));
    // rate (1.0)
    view.setUint32(20, 0x00010000);
    // volume (1.0)
    view.setUint16(24, 0x0100);
    // reserved
    data.set(new Uint8Array(10), 26);
    // matrix (identity)
    view.setUint32(36, 0x00010000);
    view.setUint32(52, 0x00010000);
    view.setUint32(68, 0x40000000);

    return {
      type: 'mvhd',
      size: 8 + data.length,
      data,
    };
  }

  private createTrakBox(): Box {
    const children: Box[] = [];

    children.push(this.createTkhdBox());
    children.push(this.createMdiaBox());

    const data = this.serializeBoxes(children);

    return {
      type: 'trak',
      size: 8 + data.byteLength,
      data: new Uint8Array(data),
    };
  }

  private createTkhdBox(): Box {
    const data = new Uint8Array(84);
    const view = new DataView(data.buffer);

    // version and flags
    view.setUint32(0, 0x00000003);
    // creation time
    view.setUint32(4, 0);
    // modification time
    view.setUint32(8, 0);
    // track id
    view.setUint32(12, 1);
    // reserved
    view.setUint32(16, 0);
    // duration
    view.setUint32(20, Math.floor(this.config.duration * this.timescale));
    // reserved
    data.set(new Uint8Array(8), 24);
    // layer and alternate group
    view.setUint16(32, 0);
    view.setUint16(34, 0);
    // volume
    view.setUint16(36, 0);
    // reserved
    view.setUint16(38, 0);
    // matrix
    view.setUint32(40, 0x00010000);
    view.setUint32(56, 0x00010000);
    view.setUint32(72, 0x40000000);
    // width
    view.setUint32(76, this.config.width << 16);
    // height
    view.setUint32(80, this.config.height << 16);

    return {
      type: 'tkhd',
      size: 8 + data.length,
      data,
    };
  }

  private createMdiaBox(): Box {
    const children: Box[] = [];

    children.push(this.createMdhdBox());
    children.push(this.createHdlrBox());
    children.push(this.createMinfBox());

    const data = this.serializeBoxes(children);

    return {
      type: 'mdia',
      size: 8 + data.byteLength,
      data: new Uint8Array(data),
    };
  }

  private createMdhdBox(): Box {
    const data = new Uint8Array(20);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0); // version and flags
    view.setUint32(4, 0); // creation time
    view.setUint32(8, 0); // modification time
    view.setUint32(12, this.timescale); // timescale
    view.setUint32(16, Math.floor(this.config.duration * this.timescale)); // duration

    return {
      type: 'mdhd',
      size: 8 + data.length,
      data,
    };
  }

  private createHdlrBox(): Box {
    const data = new Uint8Array(21);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0); // version and flags
    data.set(new Uint8Array(4), 4); // pre_defined
    data.set(new TextEncoder().encode('vide'), 8); // handler_type
    data.set(new Uint8Array(12), 12); // reserved
    data.set(new TextEncoder().encode('Video'), 16); // name (partial)

    return {
      type: 'hdlr',
      size: 8 + data.length,
      data,
    };
  }

  private createMinfBox(): Box {
    const children: Box[] = [];

    children.push(this.createVmhdBox());
    children.push(this.createDinfBox());
    children.push(this.createStblBox());

    const data = this.serializeBoxes(children);

    return {
      type: 'minf',
      size: 8 + data.byteLength,
      data: new Uint8Array(data),
    };
  }

  private createVmhdBox(): Box {
    const data = new Uint8Array(12);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0x00000001); // version and flags
    view.setUint16(4, 0); // graphicsmode
    view.setUint16(6, 0); // opcolor
    view.setUint16(8, 0);
    view.setUint16(10, 0);

    return {
      type: 'vmhd',
      size: 8 + data.length,
      data,
    };
  }

  private createDinfBox(): Box {
    const data = this.serializeBoxes([this.createDrefBox()]);

    return {
      type: 'dinf',
      size: 8 + data.byteLength,
      data: new Uint8Array(data),
    };
  }

  private createDrefBox(): Box {
    const urlData = new Uint8Array(4);
    const view = new DataView(urlData.buffer);
    view.setUint32(0, 0x00000001); // version and flags (self-contained)

    const urlBox: Box = {
      type: 'url ',
      size: 8 + urlData.length,
      data: urlData,
    };

    const entryData = this.serializeBoxes([urlBox]);

    const data = new Uint8Array(8 + entryData.byteLength);
    const dataView = new DataView(data.buffer);
    dataView.setUint32(0, 0); // version and flags
    dataView.setUint32(4, 1); // entry count
    data.set(new Uint8Array(entryData), 8);

    return {
      type: 'dref',
      size: 8 + data.length,
      data,
    };
  }

  private createStblBox(): Box {
    const children: Box[] = [];

    children.push(this.createStsdBox());
    children.push(this.createSttsBox());
    children.push(this.createStscBox());
    children.push(this.createStszBox());
    children.push(this.createStcoBox());

    const data = this.serializeBoxes(children);

    return {
      type: 'stbl',
      size: 8 + data.byteLength,
      data: new Uint8Array(data),
    };
  }

  private createStsdBox(): Box {
    const avc1Box = this.createAvc1Box();
    const entryData = this.serializeBoxes([avc1Box]);

    const data = new Uint8Array(8 + entryData.byteLength);
    const view = new DataView(data.buffer);
    view.setUint32(0, 0); // version and flags
    view.setUint32(4, 1); // entry count
    data.set(new Uint8Array(entryData), 8);

    return {
      type: 'stsd',
      size: 8 + data.length,
      data,
    };
  }

  private createAvc1Box(): Box {
    const children: Box[] = [this.createAvcCBox()];
    const childData = this.serializeBoxes(children);

    const data = new Uint8Array(78 + childData.byteLength);
    const view = new DataView(data.buffer);

    data.set(new Uint8Array(6), 0); // reserved
    view.setUint16(6, 1); // data_reference_index
    view.setUint16(8, 0); // pre_defined
    view.setUint16(10, 0); // reserved
    data.set(new Uint8Array(12), 12); // pre_defined
    view.setUint16(24, this.config.width);
    view.setUint16(26, this.config.height);
    view.setUint32(28, 0x00480000); // horizresolution
    view.setUint32(32, 0x00480000); // vertresolution
    view.setUint32(36, 0); // reserved
    view.setUint16(40, 1); // frame_count
    data.set(new Uint8Array(32), 42); // compressorname (padded)
    view.setUint16(74, 0x0018); // depth
    view.setInt16(76, -1); // pre_defined
    data.set(new Uint8Array(childData), 78);

    return {
      type: 'avc1',
      size: 8 + data.length,
      data,
    };
  }

  private createAvcCBox(): Box {
    const data = new Uint8Array(23);
    const view = new DataView(data.buffer);

    view.setUint8(0, 1); // configurationVersion
    data.set([0x64, 0x00, 0x1F], 1); // AVCProfileIndication, profile_compatibility, AVCLevelIndication
    view.setUint8(4, 0xFF); // lengthSizeMinusOne
    view.setUint8(5, 0xE1); // numOfSequenceParameterSets
    // SPS NAL unit (placeholder)
    view.setUint8(6, 0x00);
    view.setUint8(7, 0x08);
    data.set([0x27, 0x64, 0x00, 0x1F, 0xAC, 0xD9, 0x40, 0x50], 8);
    view.setUint8(16, 0x01); // numOfPictureParameterSets
    // PPS NAL unit (placeholder)
    view.setUint8(17, 0x00);
    view.setUint8(18, 0x04);
    data.set([0x28, 0xCE, 0x3C, 0x80], 19);

    return {
      type: 'avcC',
      size: 8 + data.length,
      data,
    };
  }

  private createSttsBox(): Box {
    const data = new Uint8Array(16);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0); // version and flags
    view.setUint32(4, 1); // entry count
    view.setUint32(8, this.chunks.length || 1); // sample count
    view.setUint32(12, Math.floor(this.timescale / this.config.frameRate)); // sample delta

    return {
      type: 'stts',
      size: 8 + data.length,
      data,
    };
  }

  private createStscBox(): Box {
    const data = new Uint8Array(16);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0); // version and flags
    view.setUint32(4, 1); // entry count
    view.setUint32(8, 1); // first chunk
    view.setUint32(12, this.chunks.length || 1); // samples per chunk

    return {
      type: 'stsc',
      size: 8 + data.length,
      data,
    };
  }

  private createStszBox(): Box {
    const sampleCount = this.chunks.length || 1;
    const data = new Uint8Array(12 + sampleCount * 4);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0); // version and flags
    view.setUint32(4, 0); // sample size (0 = variable)
    view.setUint32(8, sampleCount); // sample count

    // Sample sizes (placeholders)
    for (let i = 0; i < sampleCount; i++) {
      view.setUint32(12 + i * 4, this.chunks[i]?.byteLength ?? 1000);
    }

    return {
      type: 'stsz',
      size: 8 + data.length,
      data,
    };
  }

  private createStcoBox(): Box {
    const data = new Uint8Array(12);
    const view = new DataView(data.buffer);

    view.setUint32(0, 0); // version and flags
    view.setUint32(4, 1); // entry count
    view.setUint32(8, 0); // chunk offset (placeholder)

    return {
      type: 'stco',
      size: 8 + data.length,
      data,
    };
  }

  private createMdatBox(): Box {
    let totalSize = 0;
    for (const chunk of this.chunks) {
      totalSize += chunk.byteLength;
    }

    // If no chunks, create placeholder
    if (totalSize === 0) {
      return {
        type: 'mdat',
        size: 8,
        data: new Uint8Array(0),
      };
    }

    const data = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of this.chunks) {
      const chunkData = new Uint8Array(chunk.byteLength);
      chunk.copyTo(chunkData);
      data.set(chunkData, offset);
      offset += chunk.byteLength;
    }

    return {
      type: 'mdat',
      size: 8 + data.length,
      data,
    };
  }

  private serializeBoxes(boxes: Box[]): ArrayBuffer {
    let totalSize = 0;
    for (const box of boxes) {
      totalSize += box.size;
    }

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const data = new Uint8Array(buffer);
    let offset = 0;

    for (const box of boxes) {
      view.setUint32(offset, box.size);
      data.set(new TextEncoder().encode(box.type), offset + 4);
      if (box.data) {
        data.set(box.data, offset + 8);
      }
      offset += box.size;
    }

    return buffer;
  }
}
