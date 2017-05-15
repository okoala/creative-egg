import crypto = require('crypto');
import os = require('os');

import { PackageHelper } from '../common/PackageHelper';
import { IConfigSettings } from './../configuration/IConfigSettings';

/**
 *  Shape of telemetry config resource returned from the server.
 */
export interface ITelemetryAppInstanceData {

  /** serverGlimpseVersion */
  glimpseVersion: string;

  /** unique ID for the machine hosting the server.  This is a SHA256 hash of the machine's mac address. */
  machineId: string;

  /** name of the application hosting the glimpse.server */
  appName: string;

  /** OS Platform where server is running */
  operatingSystemPlatform: string;

  /** OS Release where server is running */
  operatingSystemRelease: string;

  /** OS Type where server is running */
  operatingSystemType: string;

  /** Version of the runtime */
  runtimeVersion: string;

  /** Runtime Name.  e.g., 'NodeJS' or '.net' */
  runtimeName: string;
}

/**
 * singletone instance per app
 */
let telemetryAppInstanceData: ITelemetryAppInstanceData;

/**
 * retrieve an ITelemetryAppInstanceData for the currently running app.
 */
export function getTelemetryAppInstanceData(configSettings: IConfigSettings) {
  if (!telemetryAppInstanceData) {
    const glimpseVersion = PackageHelper.instance.getPackageVersion(PackageHelper.instance.findGlimpseCommonPackageJsonPath());
    const appName = PackageHelper.instance.getPackageName(PackageHelper.instance.findAppPackageJsonPath());

    telemetryAppInstanceData = {
      glimpseVersion,
      appName,
      machineId: AppInstanceDataHelpers.computeMachineId(configSettings.get('telemetry.identity.salt', undefined)),
      operatingSystemPlatform: os.platform(),
      operatingSystemRelease: os.release(),
      operatingSystemType: os.type(),
      runtimeVersion: process.version,
      runtimeName: 'NodeJS'
    };
  }

  return telemetryAppInstanceData;
}

export class AppInstanceDataHelpers {

  /**
   * compute machine ID for this node
   * @salt - an optional user-specified value that gives users control over their machine identity in our telemetry system.
   *         if specified, it will be included in the hashed value of the mac address that we use a "machine identity" for
   *         for telemetry.
   */
  public static computeMachineId(salt: string) {
    const macAddress = AppInstanceDataHelpers.getMacAddress();
    let data = macAddress;
    if (salt && salt.length > 0) {
      data = `salt: ${salt}, macAddress: ${macAddress}`;
    }
    const machineId = crypto.createHash('sha256')
      .update(data, 'utf8')
      .digest('hex');
    return machineId;
  }

  /**
   * Retrieve a mac address for the current node
   */
  public static getMacAddress() {
    const networkInterfaces = os.networkInterfaces();

    // if more than one mac address, just pick the first one that is not internal
    const interfaceNames = Object.keys(networkInterfaces);
    for (let i = 0; i < interfaceNames.length; i++) {
      const name = interfaceNames[i];
      const iface = networkInterfaces[name];
      for (let j = 0; j < iface.length; j++) {
        const entry = iface[j];
        if (!entry.internal) {
          let addr = entry.mac;
          if (os.platform() === 'win32') {
            // maintain consistency with what getmac library returns
            addr = addr.replace(/:/g, '-').toUpperCase();
          }
          return addr;
        }
      }
    }

    return '00-00-00-00-00-00';
  }
}
