import {relative, dirname, basename, extname, format, join} from 'path';

import {YfmToc} from '../models';
import {filterFiles} from '../services/utils';
import {isExternalHref} from './url';
import {getSinglePageAnchorId} from './singlePage';

export function transformToc(toc: YfmToc | null, pathToFileDirectory: string): YfmToc | null {
    if (!toc) {
        return null;
    }

    const localToc: YfmToc = JSON.parse(JSON.stringify(toc));

    if (localToc.items) {
        localToc.items = filterFiles(localToc.items, 'items', {}, {
            removeHiddenTocItems: true,
        });
    }

    const baseTocPath: string = localToc.base || '';
    const navigationItemQueue = [localToc];

    while (navigationItemQueue.length) {
        const navigationItem = navigationItemQueue.shift();

        if (!navigationItem) {
            continue;
        }

        const {items, href} = navigationItem;

        if (items) {
            navigationItemQueue.push(...navigationItem.items);
        }

        if (href && !isExternalHref(href)) {
            /* Path to directory with toc.yaml */
            const pathToIndexDirectory: string = relative(pathToFileDirectory, baseTocPath);

            const fileExtension: string = extname(href);
            const filename: string = basename(href, fileExtension);
            const transformedFilename: string = format({
                name: filename,
                ext: '.html',
            });

            navigationItem.href = join(pathToIndexDirectory, dirname(href), transformedFilename);
        }
    }

    return localToc;
}

export function transformTocForSinglePage(toc: YfmToc | null, options: {root: string; currentPath: string}) {
    const {root, currentPath} = options;

    if (!toc) {
        return null;
    }

    const localToc: YfmToc = JSON.parse(JSON.stringify(toc));

    if (localToc.items) {
        localToc.items = filterFiles(localToc.items, 'items', {}, {
            removeHiddenTocItems: true,
        });
    }

    function processItems(items: YfmToc[]) {
        items.forEach((item) => {
            if (item.items) {
                processItems(item.items);
            }

            if (item.href && !isExternalHref(item.href)) {
                item.href = getSinglePageAnchorId({root, currentPath, pathname: item.href});
            }
        });
    }

    processItems(localToc.items);

    localToc.singlePage = true;

    return localToc;
}
