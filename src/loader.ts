import {join, normalize, parse, relative} from "path";
import {promisify} from "util";
import * as fs from 'fs';

const lstat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

enum LoaderMode {
    LoaderModeOne = 'one',
    LoaderModeMany = 'many',
    LoaderModeList = 'list',
    LoaderModeListener = 'listener',
}

export interface InterfaceLogger {
    debug: (...args) => void;
    log: (...args) => void;
    info: (...args) => void;
    error: (...args) => void;

    [type: string]: () => void;
}

export class EventLoader<V> extends Map<string, V> {
    dir: Set<string> | string;
    logger: InterfaceLogger;
    ext: string[];
    depth: number;
    args?: any[];

    constructor(parameters: { dir: string | string[], logger: InterfaceLogger, ext?: string[], depth?: number, events?: { [k: string]: V }, args?: any[] }) {

        super();
        let {dir, logger, ext = ['ts', 'js'], depth = 100, events, args} = parameters;
        if (args) {
            this.args = args;
        }
        this.ext = ext;
        this.depth = depth;
        if (events) {
            Object.keys(events).forEach(value => this.set(value, events[value]));
        }
        this.logger = logger;
        switch (typeof dir) {
            case "string":
                this.dir = <string>dir;
                break;
            case "object":
                if (dir instanceof Array) {
                    this.dir = new Set(dir);
                }
                break
        }

    }

    async run() {

        if (this.dir instanceof Set) {
            if (this.dir.size === 0) {
                throw new Error(`EventLoader.run не указана директория`)
            }
            await Promise.all(Array.from(this.dir).map(value => this.loader(value)));
        } else {
            if (this.dir === undefined || this.dir === '') {
                throw new Error(`EventLoader.run не указана директория`)
            }
            await this.loader(this.dir);
        }
        this.logger.info(`event:${this.size}  list:${Array.from(this.keys()).join(",")}`)
    }

    async loader(link: string, depth: number = 0, subdir: boolean = true) {
        this.logger.debug(link, depth, subdir);
        if (this.depth <= depth) {
            this.logger.log(`превышен лимит глубиный :${this.depth}`);
            return;
        }
        const statData = await lstat(link);
        let path = link;
        if (statData.isDirectory()) {
            if (subdir) {
                let index = await Promise.all(
                    this.ext
                        .map(value => normalize(`${link}/index.${value}`))
                        .map(value => {
                            return stat(value).then(value1 => {
                                return {path: value, status: value1}
                            }, reason => {
                                return {path: value, status: false, error: reason}
                            })
                        }));
                let filter = index.filter(value => value.status !== false);
                if (filter.length === 0) {
                    return await this.loader(link, depth + 1, false);
                }
                path = filter[0].path;
            } else {
                const list = await readdir(link);
                return Promise.all(list.map(file => {
                    return this.loader(join(link, file), depth);
                }));
            }
        }
        return this.handler(path)
    }

    async handler(path: string) {
        const link = normalize(relative(join(__dirname,'..'),path).replace('../',''));
        let module;
        try {
            module = require(path);
        } catch (e) {
            this.logger.error(`EventLoader.handler path:${link}  error:${e.message}`);
            return false;
        }

        let name = module.name || parse(path).name;
        switch (module.method) {
            case LoaderMode.LoaderModeOne: {
                this.logger.debug(`eventLoader.handler path:${link} mode:${LoaderMode.LoaderModeOne}`);
                this.logger.debug(`eventLoader.handler set:${name}`, module.default);
                this.set(name, module.default);
            }
                break;
            default:
            case LoaderMode.LoaderModeMany: {
                this.logger.debug(`eventLoader.handler path:${link} mode:${LoaderMode.LoaderModeMany}`);
                Object.keys(module).forEach(value => {
                    this.logger.debug(`eventLoader.handler set:${name}.${value}`, module[value]);
                    this.set(`${name}.${value}`, module[value]);
                })

            }
                break;
            case LoaderMode.LoaderModeListener: {
                this.logger.debug(`eventLoader.handler path:${link} mode:${LoaderMode.LoaderModeListener}`);
                const list = await module.default(...this.args);
                Object.keys(list).forEach(value => {
                    this.logger.debug(`eventLoader.handler set:${value}`, list[value]);
                    this.set(value, list[value]);
                })

            }
                break;
            case LoaderMode.LoaderModeList: {
                this.logger.debug(`eventLoader.handler path:${link} mode:${LoaderMode.LoaderModeList}`);
                const list = await module.default(...this.args);
                <string[]>list.forEach(value => {
                    this.logger.debug(`eventLoader.handler set:${value}`, module[value]);
                    this.set(value, module[value]);
                })
            }
                break;

        }
    }
}