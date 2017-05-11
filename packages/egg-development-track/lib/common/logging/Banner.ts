import { PackageHelper } from '../common/PackageHelper';

// we only want to print banner once
let bannerPrinted = false;

function repeat(string: string, times: number): string {
    let result: string = '';

    for (let i = 0; i < times; i++) {
        result += string;
    }

    return result;
}

function rightPad(s: string, length: number) {
    return s = s + repeat(' ', length - s.length);
}

export function printBannerGreeting(clientUri?: string): void {
    if (!bannerPrinted) {
        bannerPrinted = true;
        const packageHelper = PackageHelper.instance;
        const packagePath = packageHelper.findPackageJsonPath(__dirname);
        const packageVersion = packageHelper.getPackageVersion(packagePath);

        const logText = 'Running Project Glimpse v' + packageVersion;
        const clientHeader = ' - Open Glimpse at: ';
        const docsHeader = ' - More info at: ';
        const max = Math.max(clientHeader.length, docsHeader.length);

        const clientText = `${rightPad(clientHeader, max)} ${clientUri}`;
        const docsText = `${rightPad(docsHeader, max)} http://node.getglimpse.com`;
        const horizontalRule = repeat('=', Math.max(logText.length, clientText.length, docsText.length));
        const horizontalRule2 = repeat('-', logText.length);
        const parts = [
            '',
            horizontalRule,
            logText,
            horizontalRule2,
            clientText,
            docsText,
            horizontalRule,
            ''
        ];

        if (!clientUri) {
            // remove clientText if client not specified
            parts.splice(parts.indexOf(clientText), 1);
        }

        console.log(parts.join(require('os').EOL));
    }
}
