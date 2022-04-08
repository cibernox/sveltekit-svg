"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const svgo_1 = require("svgo");
const compiler_1 = require("svelte/compiler");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const { readFile } = fs_1.promises;
const svgRegex = /(<svg.*?)(>.*)/s;
function addComponentProps(data) {
    const parts = svgRegex.exec(data);
    if (!parts) {
        throw new Error('Invalid SVG');
    }
    const [, head, body] = parts;
    return `${head} {...$$props}${body}`;
}
// TODO: Remove this when Vite 2.7.0 is well-adopted.
// https://github.com/vitejs/vite/blob/v2.7.1/packages/vite/CHANGELOG.md#270-2021-12-07
function getSsrOption(transformOptions) {
    return typeof transformOptions === 'object'
        ? transformOptions.ssr
        : transformOptions;
}
function readSvg(options = { type: 'component' }) {
    const resvg = /\.svg(?:\?(src|url|component))?$/;
    const cache = new Map();
    if (options.includePaths) {
        // Normalize the include paths prefixes ahead of time
        options.includePaths = options.includePaths.map((pattern) => {
            const filepath = path_1.default.resolve(path_1.default.normalize(pattern));
            return path_1.default.sep === '\\' ? filepath.replace(/\\/g, '/') : filepath;
        });
    }
    return {
        name: 'sveltekit-svg',
        async transform(source, id, transformOptions) {
            if (options.includePaths) {
                const isIncluded = options.includePaths.some((pattern) => {
                    return id.startsWith(pattern);
                });
                if (!isIncluded) {
                    return undefined;
                }
            }
            const match = id.match(resvg);
            const isBuild = getSsrOption(transformOptions);
            if (match) {
                const type = match[1];
                if (type === 'url' || (!type && options.type === 'url')) {
                    return source;
                }
                try {
                    const cacheKey = `${id}:${isBuild}`;
                    const cached = cache.get(cacheKey);
                    if (cached) {
                        return cached;
                    }
                    const filename = id.replace(/\.svg(\?.*)$/, '.svg');
                    let data = (await readFile(filename)).toString('utf-8');
                    const opt = options.svgoOptions !== false ? (0, svgo_1.optimize)(data, {
                        path: filename,
                        ...(options.svgoOptions || {}),
                    }) : { data };
                    if (type === 'src' || (!type && options.type === 'src')) {
                        data = `\nexport default \`${opt.data}\`;`;
                    }
                    else {
                        opt.data = addComponentProps(opt.data);
                        const { js } = (0, compiler_1.compile)(opt.data, {
                            css: false,
                            filename: id,
                            hydratable: true,
                            namespace: 'svg',
                            generate: isBuild ? 'ssr' : 'dom',
                        });
                        delete js.map;
                        data = js;
                    }
                    cache.set(cacheKey, data);
                    return data;
                }
                catch (err) {
                    console.error('Failed reading SVG "%s": %s', id, err.message, err);
                }
            }
            return undefined;
        },
    };
}
module.exports = readSvg;
