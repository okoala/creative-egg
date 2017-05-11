import path = require('path');

import { FileHelper } from './FileHelper';

export interface INpmPackage {
    name?: string;
    version?: string;
}

export interface IPackageHelper {
    /**
     * Find the package.json file associated with the file
     * used as the "main" file for this running instance of node.
     */
    findAppPackageJsonPath(): string;

    /**
     * Find the glimpse.common package.json file path
     */
    findGlimpseCommonPackageJsonPath(): string;

    /**
     * Given child path, find the package.json file path associated with
     * child that path
     */
    findPackageJsonPath(dir: string): string;

    /**
     * Given packageJsonPath, determine version from package.json
     */
    getPackageVersion(packageJsonPath: string): string;

    /**
     * Given packageJsonPath, determine name from package.json
     */
    getPackageName(packageJsonPath: string): string;

    /**
     * Given packageJsonPath, get the target package
     */
    getPackage(packageJsonPath: string): INpmPackage;

    /**
     * Given child path, get the package associated with
     * child that path
     */
    getPackageFromChildPath(dir: string): INpmPackage;
}

export class PackageHelper implements IPackageHelper {
    private static _instance = new PackageHelper();

    public static get instance(): PackageHelper {
        return PackageHelper._instance;
    }

    /**
     * Find the package.json file associated with the file
     * used as the "main" file for this running instance of node.
     */
    public findAppPackageJsonPath(): string {
        return this.findPackageJsonPath(require.main.filename);
    }

    /**
     * Find the glimpse.common package.json file
     */
    public findGlimpseCommonPackageJsonPath(): string {
        return this.findPackageJsonPath(__dirname);
    }

    /**
     * Given child path, find the package.json file path associated with
     * child that path
     */
    public findPackageJsonPath(dir: string): string {
        const fileName = 'package.json';
        const dirName = path.dirname(dir);

        return FileHelper.findFileInParent(dirName, fileName);
    }

    /**
     * Given packageJsonPath, determine version from package.json
     */
    public getPackageVersion(packageJsonPath: string): string {
        return this.getPackageRootProperty(packageJsonPath, 'version');
    }

    /**
     * Given packageJsonPath, determine name from package.json
     */
    public getPackageName(packageJsonPath: string): string {
        return this.getPackageRootProperty(packageJsonPath, 'name');
    }

    /**
     * Given packageJsonPath, get the target package
     */
    public getPackage(packageJsonPath: string): INpmPackage {
        let json = undefined;
        if (packageJsonPath) {
            json = require.main.require(packageJsonPath);
        }
        return json;
    }

    private getPackageRootProperty(packageJsonPath: string, property: string) {
        let value = '';
        const json = this.getPackage(packageJsonPath);
        if (json && json[property]) {
            value = json[property];
        }
        return value;
    }

    /**
     * Given child path, get the package associated with
     * child that path
     */
    public getPackageFromChildPath(dir: string): INpmPackage {
        const packageJsonPath = this.findPackageJsonPath(dir);
        if (packageJsonPath) {
            return this.getPackage(packageJsonPath);
        }
    }
}
