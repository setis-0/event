import {EventQueue} from "./queue";
import {EventStream} from "./stream";
import {EventEmitter} from "./emitter";

export class EventDispather {
    constructor(
                readonly listener: EventEmitter = new EventEmitter(),
                readonly queue: Map<string, EventQueue> = new Map(),
                readonly streams: WeakSet<any> = new WeakSet()) {
    }

    dispatch(name: string, params: Object = {}, data: Object = {}) {
        if (!this.queue.has(name)) {
            throw new Error();
        }
        return this.stream(this.queue.get(name),params,data).dispatch();
    }

    stream(queue: EventQueue, params: Object = {}, data: Object = {}) {
        const stream = new EventStream(this.listener, queue, null, data, params);
        this.streams.add(stream);
        return stream;
    }

    addQueue(parameters: { name: string, queue?: (string | EventQueue)[], sync?: boolean, storage?: Map<string, EventQueue> }): EventQueue {
        let {name, queue, sync = true, storage = new Map()} = parameters;
        if (this.queue.has(name)) {
            throw new Error(`уже существует такой список очереди ${name}`);
        }
        const eq = new EventQueue({
            name,
            sync,
            list: queue.map(value => (value instanceof EventQueue) ? value.name : value),
            storage
        });
        for (let el of queue.filter(value => (value instanceof EventQueue))) {
            eq.addQueue(el as EventQueue);
        }
        this.queue.set(name, eq);
        return eq;
    }


}