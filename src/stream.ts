import uuidV4 = require('uuid/v4');
import {EventQueue} from "./queue";
import {EventEmitter} from "./emitter";

export class EventStream {
    readonly uuid: string;
    readonly time: number;
    stop:boolean = false;
    active: Set<string> = new Set();
    timewatch: Map<string,number> = new Map();
    constructor(public readonly listeners: EventEmitter,
                public readonly queue: EventQueue,
                public readonly source: EventStream | null = null,
                public data:Object = {},
                public params:Object = {}
    ) {
        this.uuid = uuidV4();
        this.time = new Date().getTime();
    }

    async emit(name: string, ...args: any[]) {
        if(this.isPropagationStopped()){
            return;
        }
        this.active.add(name);
        const time = new Date().getTime();
        await this.listeners.emit({
            context: this,
            sync: this.queue.isSync(name),
            call: name,
            args: args,
        });
        this.active.delete(name);
        this.timewatch.set(name,new Date().getTime()-time)
    }

    isPropagationStopped():boolean {
        return (this.source === null) ? this.stop : this.source.isPropagationStopped();

    }
    stopPropagation():this{
        this.stop = true;
        return this;
    }
    async dispatch() {
        if(this.queue.sync){
            for (let event of this.queue) {
                if(this.isPropagationStopped()){
                    return;
                }
                if (event instanceof EventQueue) {
                    const stream = new EventStream(this.listeners,event,this,this.data,this.params);
                    this.active.add(event.name);
                    const time = new Date().getTime();
                    await stream.dispatch();
                    this.timewatch.set(event.name,new Date().getTime()-time);
                    this.active.delete(event.name);
                    // console.log(`event sub:${event.name} eq`,(this.data === stream.data && this.params === stream.params));
                } else {
                    let args = (this.params.hasOwnProperty(event)) ? this.params[event] : [];
                    await this.emit(event, ...args);
                }
            }
        }else{
            let collections = [];
            for (let event of this.queue) {
                if (event instanceof EventQueue) {
                    const stream = new EventStream(this.listeners,event,this,this.data,this.params);
                    collections.push(stream.dispatch());
                } else {
                    let args = (this.params.hasOwnProperty(event)) ? this.params[event] : [];
                    collections.push(this.emit(event, ...args));
                }
            }
            await Promise.all(collections);
        }
    }

}