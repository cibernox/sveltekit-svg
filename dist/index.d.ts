import { OptimizeOptions } from 'svgo';
interface Options {
    /**
     * Output type
     * @default "component"
     */
    type?: 'src' | 'url' | 'component';
    /**
     * Verbatim [SVGO](https://github.com/svg/svgo) options
     */
    svgoOptions?: OptimizeOptions | false;
    /**
     * Paths to apply the SVG plugin on. This can be useful if you want to apply
     * different SVGO options/plugins on different SVGs.
     *
     * The paths are path prefixes and should be relative to your
     * `svelte.config.js` file.
     *
     * @example
     * ```
     * {
     *   includePaths: ['src/assets/icons/', 'src/images/icons/']
     * }
     * ```
     */
    includePaths?: string[];
}
declare function readSvg(options?: Options): {
    name: string;
    transform(source: string, id: string, transformOptions: boolean | {
        ssr: boolean;
    }): Promise<any>;
};
export = readSvg;
