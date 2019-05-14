/**
 * @description очередь событий
 */
export function setParentEventQueue(parent: EventQueue, child: EventQueue) {
    if (child === parent) {
        throw new Error();
    }
    const storageParent = parent.storage;
    const storageChild = child.storage;
    if (storageChild !== storageParent) {
        for (let [name, value] of child.storage.entries()) {
            if (!storageParent.has(name)) {
                storageParent.set(name, value);
                setParentEventQueue(value, parent);
            } else {
                if (storageParent.get(name) !== value) {
                    throw new Error();
                }
            }
        }
        storageParent.set(child.name, child);
        Object.defineProperty(child, 'storage', {
            writable: false,
            value: storageParent
        });
    }

}

export function createCollection(name: string, events: (string | EventQueue)[]): EventQueue {
    const queue =  new EventQueue({
        name: name,
        sync: false,
        list: events.map(value => (value instanceof EventQueue) ? value.name : value),
    });
    for (let el of events.filter(value => (value instanceof EventQueue))) {
        queue.addQueue(el as EventQueue);
    }
    return queue;
}

export function createGroup(name: string, events: (string | EventQueue)[]): EventQueue {
    const queue =  new EventQueue({
        name: name,
        sync: true,
        list: events.map(value => (value instanceof EventQueue) ? value.name : value),
    });
    for (let el of events.filter(value => (value instanceof EventQueue))) {
        queue.addQueue(el as EventQueue);
    }
    return queue;
}
export class EventQueue {

    readonly name: string;
    /**
     * параметер для определения событие как будет испольнять синхроно ли ?
     */
    readonly sync: boolean;

    readonly storage: Map<string, EventQueue>;

    constructor(parameters: { sync?: boolean, storage?: Map<string, EventQueue>, name: string, list?: string[] }) {
        let {sync = false, storage = new Map(), name, list = []} = parameters;
        this.sync = sync;
        this.storage = storage;
        this.name = name;
        this._list = list;

    }
    private _list: string[];

    get list(): string[] {
        return this._list;
    }

    set list(value: string[]) {
        value.filter(name=> this.storage.has(name)).forEach(value2 => setParentEventQueue(this,this.storage.get(value2)));
        this._list = value;
    }
    clean(names: string[] = this._list){
        names.filter(value=> !this.hasDeep(value)).forEach(value => this.storage.delete(value));
    }

    createChild(options:{
        sync?: boolean,
        name: string,
        list?: string[]
    }){
        return new EventQueue({
            ...options,
            storage: this.storage
        });
    }

    protected elAdd(action: 'push' | 'unshift', args: (string | EventQueue)[]) {
        args.forEach(value => {
            if (value instanceof EventQueue) {
                if (this.storage.has(value.name)) {
                    if (this.storage.get(value.name) !== value) {
                        throw new Error();
                    }
                } else {
                    this.storage.set(value.name, value);
                }
                this._list[action](value.name);
            } else {
                this._list[action](value);
            }
        });
    }

    protected elRemove(args: (string | EventQueue)[]) {
        let list = [...this._list];
        args.forEach(value => {
            if (value instanceof EventQueue) {
                const {name} = value;
                if (this.storage.has(name)) {
                    this.storage.delete(name)
                }
                list = list.filter(v => v !== name)
            } else {
                list = list.filter(v => v !== value)
            }
        });
        this._list = list;
    }

    addQueue(data:EventQueue):this{
        if(!(data instanceof  EventQueue) || (this.storage.has(data.name) && this.storage.get(data.name) !== data)){
            throw new Error();
        }
        this.storage.set(data.name,data);
        setParentEventQueue(this,data);
        return this;
    }
    removeQueue(data:EventQueue|string):this{
        this.storage.delete((typeof data ==='string')?data:data.name);
        return this;
    }
    createCollection(name: string, events: (string|EventQueue)[]):EventQueue {
        const queue = new EventQueue({
            name: name,
            sync: false,
            storage:this.storage
        });
        return queue.push(...events);
    }
    addCollection(name: string, events: (string|EventQueue)[]):EventQueue {
        const queue = this.createCollection(name,events);
        this.push(queue);
        return queue;
    }
    createGroup(name: string, events: (string|EventQueue)[]):EventQueue {
        const queue = new EventQueue({
            name: name,
            sync: true,
            storage:this.storage
        });
        return queue.push(...events);
    }
    addGroup(name: string, events: (string|EventQueue)[]):EventQueue {
        const queue = this.createGroup(name,events);
        this.push(queue);
        return queue;
    }
    push(...args: (string | EventQueue)[]): this {
        this.elAdd('push', args);
        return this;
    }

    unshift(...args: (string | EventQueue)[]): this {
        this.elAdd('unshift', args);
        return this;
    }

    remove(...args: (string | EventQueue)[]): this {
        this.elRemove( args);
        return this;
    }

    start(): string {
        if (this._list.length < 1) {
            throw new Error();
        }
        return this._list[0];
    }

    end(): string {
        if (this._list.length < 1) {
            throw new Error();
        }
        return this._list[this._list.length - 1];
    }
    hasDeep(name:string):boolean{
        for(let queue of this.storage.values()){
            if(queue.has(name,true)){
                return true
            }
        }
        return false;
    }
    hasNoDeep(name:string):boolean{
        return (this._list.indexOf(name) !== -1);
    }
    has(name: string,deep:boolean = true): boolean {
        if(deep){
            if(this.hasNoDeep(name)){
                return true;
            }
            return this.hasDeep(name);
        }
        return this.hasNoDeep(name);
    }

    mode(name:string):boolean{
        if(this.name === name || this.hasNoDeep(name)){
            return this.sync;
        }
        if(this.hasDeep(name)){
            return this.storage.get(name).sync;
        }
        return true;
    }

    isAsync(name:string):boolean{
        return !this.mode(name);
    }
    isSync(name:string):boolean{
        return this.mode(name);
    }

    protected trigger(after: boolean, search: string, names: (string | EventQueue)[] | string | EventQueue) {
        let index = this._list.indexOf(search);
        if (index === -1) {
            throw new Error(`not found name:${name}`);
        }
        if (after) {
            index++;
        }
        this._list = (names instanceof Array) ?
            [...this._list.slice(0, index), ...names.map(value => {
                return (value instanceof EventQueue) ? value.name : value;
            }), ...this._list.slice(index)] :
            [...this._list.slice(0, index), (names instanceof EventQueue) ? names.name : names, ...this._list.slice(index)];
    }

    after(search: string, names: (string | EventQueue)[] | string | EventQueue):this{
        this.trigger(true,search,names);
        return this;
    }
    before(search: string, names: (string | EventQueue)[] | string | EventQueue):this{
        this.trigger(false,search,names);
        return this;
    }
    toObject(){
        return {
            [this.name]: {
                async: !this.sync,
                list: this._list.map(name => {
                    if(this.storage.has(name)){
                        return this.storage.get(name).toObject()
                    }
                    return name;
                })
            }
        };

    }
    toString(){
        return this.name;
    }

    * [Symbol.iterator]() {
        for (let value of this._list) {
            if (this.storage.has(value)) {
                yield this.storage.get(value);
            } else {
                yield value
            }
        }
    }

}

