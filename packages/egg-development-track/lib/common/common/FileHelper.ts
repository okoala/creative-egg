import fs = require('fs');
import path = require('path');

export class FileHelper {
    /**
     * Given a starting directory, attempts to find a file name of the specified name,
     * walking up the hierarchy.
     */
    public static findFileInParent(startDirectory: string, fileName: string): string {
        let testPath = undefined;
        let stat = undefined;

        do {
            testPath = path.join(startDirectory, fileName);
            try {
                stat = fs.statSync(testPath);
            }
            catch (err) {
                // swallow error if file doesn't exist
            }
            startDirectory = path.dirname(startDirectory);
        } while ((!stat || !stat.isFile()) && startDirectory !== path.dirname(startDirectory));

        if (stat && stat.isFile()) {
            return testPath;
        }

        return;
    }
}
