
import { IPartSummary } from '../inspectors/IServerRequestInspector';
import { HttpHelper } from './HttpHelper';
import Dicer = require('dicer');
import { MultiPartFormParser } from './MultiPartFormParser';

export interface IMultiPartFormSummarizer {
    addChunk(chunk: Buffer | string);
    getParts(): IPartSummary[];
}

export function createMultiPartFormSummarizer(contentTypeHeader: string): IMultiPartFormSummarizer {
    const contentType = HttpHelper.parseContentType(contentTypeHeader);
    if (HttpHelper.isMultiPartFormData(contentType)) {
        const boundary = HttpHelper.getMultiPartFormBoundary(contentType);
        if (boundary && HttpHelper.isValidBoundary(boundary)) {
            // return new DicerSummarizer(boundary);
            return new CustomParserMultiPartSummarizer(boundary);
        }
    }
    return undefined;
}

function validateBoundary(boundary: string) {
    if (!HttpHelper.isValidBoundary(boundary)) {
        throw new Error('boundary is not valid.  Boundary must be between 1 & 70 characters in length');
    }
}

/**
 * IMultiPartFormSummarizer that uses dicer parser for multi-part form summaries
 */
export class DicerMultiPartSummarizer implements IMultiPartFormSummarizer {

    private partSummaries: IPartSummary[] = [];
    private dicer: Dicer;
    private failed: boolean = false;

    public constructor(boundary: string) {
        validateBoundary(boundary);

        this.dicer = new Dicer({ boundary });
        this.dicer.on('part', (part) => {
            const partSummary = { headers: {} };
            this.partSummaries.push(partSummary);

            part.on('header', (headers) => {
                partSummary.headers = headers;
            });

            // part.on('data', (partData) => {
            //     partSummary.length = partData.length;
            // });
        });
    }

    public addChunk(chunk: Buffer | string) {
        if (!this.failed) {
            try {
                this.dicer.write(chunk);
            } catch (err) {
                // dicer doesn't handle some input gracefully (e.g., whitespace after a boundary)
                // swallow exceptions here, and just forget about getting any part summaries.
                // primary thing is we don't blow up the request because we can't parse the input
                this.failed = true;
            }
        }
    }

    public getParts(): IPartSummary[] {
        return this.partSummaries;
    }
}

/**
 * MultiPartFormSummarizer that uses custom parser for multi-part form summaries
 */
export class CustomParserMultiPartSummarizer implements IMultiPartFormSummarizer {

    private parser: MultiPartFormParser;

    public constructor(boundary: string) {
        validateBoundary(boundary);
        this.parser = new MultiPartFormParser(boundary, 'utf8');
    }

    public addChunk(chunk: Buffer | string) {
        this.parser.addChunk(chunk);
    }

    public getParts(): IPartSummary[] {
        const summaries = this.parser.getParts().map((s) => {
            return {
                headers: this.convertRawHeaders(s.rawHeaders),
                bodyStartIndex: s.bodyStartIndex,
                bodyEndIndex: s.bodyEndIndex,
                bodyLength: s.bodyEndIndex - s.bodyStartIndex,
            };
        });
        return summaries;
    }

    private convertRawHeaders(rawHeaders: string): { [key: string]: string[] } {
        const h: { [key: string]: string[] } = {};
        rawHeaders = rawHeaders.trim();
        const lines = rawHeaders.split('\r\n');
        lines.forEach((l) => {
            const idx = l.indexOf(':');
            if (idx > 0) {
                const name = l.substring(0, idx).trim().toLowerCase();
                const value = l.substring(idx + 1, l.length).trim();
                if (!h[name]) {
                    h[name] = [];
                }
                h[name].push(value);
            }
        });

        return h;
    }
}
