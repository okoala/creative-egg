import * as uuid from 'uuid';

function createByteToHex() {
  'use strict';
  const bytesToHex: string[] = [];
  for (let i = 0; i < 256; i++) {
    // add 0x100 so string is always length 3.
    // We can then do substring to get the last two hex digits (e.g., '00' for 0x100).
    bytesToHex[i] = (i + 0x100).toString(16).substr(1);
  }
  return bytesToHex;
}

export class GuidHelper {
  private static _bytesToHex = createByteToHex();

  public static newGuid(includeDashes = true) {
    let guid;
    if (includeDashes) {
      guid = uuid.v1();
    } else {
      const buf = [];
      uuid.v1({}, buf, 0);
      guid = '';
      for (const b of buf) {
        guid += GuidHelper._bytesToHex[b];
      }
    }
    return guid;
  }
}
