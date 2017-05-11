import { IModuleInfo } from './IModuleInfo';
import * as path from 'path';

// tslint:disable:no-var-requires
const mod = require('module');
// tslint:enable:no-var-requires

const moduleInfoCache: { [modulePath: string]: IModuleInfo } = {};

// tslint:disable:no-string-literal
const builtinModules: string[] = Object.keys(process['binding']('natives'));
// tslint:enable:no-string-literal

function checkIfBuiltIn(moduleName) {
    return builtinModules.indexOf(moduleName) !== -1;
}

function getPackageVersion(moduleName: string, modulePath: string): Object {

    // Need to recursively find package.json heading downwards
    // from path.dirname(resolvedPath);
    let dir = modulePath;
    while (dir !== path.dirname(dir)) {
        dir = path.dirname(dir);
        try {
            const packageInfo = require(path.join(dir, 'package.json'));
            // We need to check and make sure that the
            // package.json we found is for the module we want,
            // not a different module higher up the directory tree
            if (packageInfo.name === moduleName) {
                return packageInfo.version;
            }
        } catch (e) {
            // This means package.json doesn't exist, need to keep looking higher up the directory tree
        }
    }
    throw new Error(`Internal Error: could not find the package.json file for ${moduleName} at ${modulePath}`);
}

export function resolveModulePath(request: string, startDir: string) {
    let dir = path.resolve(startDir);
    const paths = [ path.join(dir, 'node_modules') ];
    while (dir !== path.dirname(dir)) {
        dir = path.dirname(dir);
        paths.push(path.join(dir, 'node_modules'));
    }
    return mod._findPath(request, paths, false);
}

export function getModuleInfo(moduleId: string, modulePath: string, originalModule): IModuleInfo {
    if (moduleInfoCache[modulePath]) {
        return moduleInfoCache[modulePath];
    }
    const isBuiltIn = checkIfBuiltIn(moduleId);
    let version;
    if (isBuiltIn) {
        version = process.version.replace(/^v/, '');
    } else {
        version = getPackageVersion(moduleId, modulePath);
    }

    return moduleInfoCache[modulePath] = {
        moduleId,
        modulePath,
        version,
        isBuiltIn,
        originalModule
    };
}
