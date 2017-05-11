import { runTest } from '../../test/inspectors/ExpressProxyTester';
import { multiRequire } from '@glimpse/multi-require';

const VERSIONS = [
    '4.1.x',
    '4.2.x',
    '4.3.x',
    '4.4.x',
    '4.5.x',
    '4.6.x',
    '4.7.x',
    '4.8.x',
    '4.9.x',
    '4.10.x',
    '4.11.x',
    '4.12.x',
    '4.13.x',
    '4.14.x',
    '4.15.x'
];

for (const version of VERSIONS) {
    runTest(version, (cb) => {
        multiRequire('express', [ version ], { jade: '1.11.0' }, (err, baseDir, versions) => {
            if (err) {
                throw err;
            }
            cb({
                moduleId: 'express',
                isBuiltIn: false,
                version: versions[version].resolvedVersion,
                modulePath: versions[version].modulePath,
                originalModule: versions[version].originalModule
            });
        });
    });
}
