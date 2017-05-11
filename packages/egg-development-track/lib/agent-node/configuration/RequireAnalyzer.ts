import * as _ from 'lodash';

/**
 * Represents a package specifically known during analysis.
 */
export interface IKnownPackage {

    /**
     * The name of the package.
     */
    packageName: string;

    /**
     * (Optional) If provided, the module filename that represents the entrypoint of the package.
     */
    match?: string;
}

/**
 * Provides analysis of loaded Node modules.
 */
export class RequireAnalyzer {
    public static applicationPackageName = '!!!application!!!';

    /**
     * Gets a list package names, directly referenced by the application, that resulted in a set of modules being loaded.
     * 
     * @nodeModules - A set of loaded Node modules, mapped by ID.
     * @excludedModules - Packages which should be excluded from the resulting list
     */
    public static getReferencedPackageNames(nodeModules: { [key: string]: NodeModule }, excludedPackages: IKnownPackage[]): string[] {
        const excludedPackageNames = [ RequireAnalyzer.applicationPackageName ].concat(excludedPackages.map(parentModule => parentModule.packageName));
        const parentModuleCache: { [key: string]: string } = {};

        return _(nodeModules)
            .values<NodeModule>()
            .map(nodeModule => RequireAnalyzer.getReferencedPackageName(nodeModule, excludedPackages, parentModuleCache))
            .uniq()
            .filter(pkg => !_.includes(excludedPackageNames, pkg))
            .value();
    }

    /**
     * Gets the package name, directly referenced by the application, that resulted in a module being loaded.
     * 
     * @nodeModule - A loaded Node module.
     * @knownModules - Packages which are specifically known (e.g. have custom filename matching)
     */
    public static getReferencedPackageName(nodeModule: NodeModule, knownModules: IKnownPackage[] = [], parentModuleCache: { [key: string]: string } = {}): string {
        if (nodeModule) {
            // See if the cache already contains the package name...
            let packageName = parentModuleCache[nodeModule.id];

            if (packageName === undefined) {
                // No cached value, so see if the cache already contains the package name for the parent...
                packageName = RequireAnalyzer.getReferencedPackageName(nodeModule.parent, knownModules, parentModuleCache);

                if (packageName === RequireAnalyzer.applicationPackageName) {
                    // This module (or its parent) was directly referenced by the application; 
                    // see if this module represents a "known" package entrypoint...
                    const filename = nodeModule.filename.replace(/\\/g, '/').toLowerCase();

                    for (let i = 0; i < knownModules.length; i++) {
                        const parentModule = knownModules[i];

                        if (parentModule.match) {
                            const match = parentModule.match.replace(/\\/g, '/').toLowerCase();

                            if (_.endsWith(filename, match)) {
                                packageName = parentModule.packageName;

                                break;
                            }
                        }
                    }

                    if (packageName === RequireAnalyzer.applicationPackageName) {
                        // This module (or its parent) was directly referenced by the application; 
                        // see if this module represents a package entrypoint...
                        const nodeModuleString = '/node_modules/';
                        const nodeModulesIndex = filename.lastIndexOf(nodeModuleString);

                        if (nodeModulesIndex >= 0) {
                            const endOfScopeOrPackageIndex = filename.indexOf('/', nodeModulesIndex + nodeModuleString.length);

                            if (endOfScopeOrPackageIndex >= 0) {
                                packageName = filename.substring(nodeModulesIndex + nodeModuleString.length, endOfScopeOrPackageIndex);

                                if (packageName.length > 0 && packageName[0] === '@') {
                                    // The packageName is actually a package scope; find the package name...
                                    const endOfPackageIndex = filename.indexOf('/', endOfScopeOrPackageIndex + 1);

                                    if (endOfPackageIndex >= 0) {
                                        packageName += '/' + filename.substring(endOfScopeOrPackageIndex + 1, endOfPackageIndex);
                                    }
                                }
                            }
                            else {
                                packageName = nodeModule.filename;
                            }
                        }
                    }
                }

                parentModuleCache[nodeModule.id] = packageName;
            }

            return packageName;
        }

        return RequireAnalyzer.applicationPackageName;
    }
}
