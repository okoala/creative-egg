export function getGuid(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    /* tslint:disable:no-bitwise */
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    /* tslint:enable:no-bitwise */
    return v.toString(16);
  });
}

export function convertBlobToText(blob: Blob, encoding: string, cb: (content: string) => void) {
  const fileReader = new FileReader();
  fileReader.onloadend = () => {
    cb(fileReader.result);
  };
  fileReader.readAsText(blob, encoding);
}
