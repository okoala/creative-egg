// NOTE: this module needs to load early in the pipeline so that we can
//       capture the `originalQuery`.
const originalQuery = window.location.search.substring(1);

export function getOriginalQueryStringParam(parameter) {
    return getQueryStringParam(parameter, originalQuery);
}

export function getQueryStringParam(parameter, query: string = window.location.search.substring(1)) {
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) === parameter) {
            return decodeURIComponent(pair[1]);
        }
    }

    return undefined;
}



// WEBPACK FOOTER //
// ./src/client/common/util/UrlUtilities.ts