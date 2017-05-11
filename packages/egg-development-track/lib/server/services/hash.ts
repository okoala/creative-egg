'use strict';

import crc = require('crc');
import _ = require('lodash');

export class Hash {
    private static hashStrings(strings: string[]): string {
        return crc.crc32(strings.join('&')).toString(16).toLowerCase();
    }

    private static hashKeyValuePairs(keyValuePairs: string[][]): string {
        // NOTE: Lodash does not guarantee map order so sorting is required.
        //       Glimpse.Server.Configuration.Metadata.Hash doesn't sort the
        //       pairs, so hashes between servers cannot be compared directly.

        return this.hashStrings(
            _.chain(keyValuePairs)
                .sortBy(
                    function sort(keyValuePair) {
                        return keyValuePair[0];
                    })
                .map(
                    function map(keyValuePair) {
                        return keyValuePair[0].toString() + '=' + keyValuePair[1].toString();
                    })
                .value());
    }

    public static hashObject(object: Object): string {
        return this.hashKeyValuePairs(_.toPairs(object));
    }
}
