import {EventListener, EventListenersMode, EventProxy, EventProxyMatch, EventProxyPriority} from "../interface";
import {createEventListenerState,   getEventLitenerState} from "./state";
import {EventEmitter} from "../emitter";

export class EventListenerProxy  implements EventProxy {
    dst: EventListener;
    src: EventListener;
    read: boolean;
    priority: EventProxyPriority;
    match: EventProxyMatch;

    constructor(parameters: { src: EventListener, dst?: EventListener, read?: boolean, priority?: EventProxyPriority, match?: EventProxyMatch }) {
        let {dst, src, read = false, priority = EventProxyPriority.Dst, match = EventProxyMatch.Uniq} = parameters;
        this.match = match;
        this.priority = priority;
        this.read = read;
        if (!src) {
            throw new Error();
        }
        if (src && !dst) {
            let mode:EventListenersMode;
            if(src instanceof EventEmitter){
                mode = src.mode;
            }
            else if(typeof src === "number" && [EventListenersMode.Uniq,EventListenersMode.Multi,EventListenersMode.Once].indexOf(src) !==-1){
                mode = src;
            }
            else {
                mode = getEventLitenerState(src)
            }
            this.dst = createEventListenerState(mode)
        } else {
            this.dst = dst;
        }

    }

    on(name: string, listener: any): this {
        if (this.read) {
            throw new Error();
        }
        this.dst.on(name, listener);
        return this;
    }

    off(name: string, listener?: any): this {
        if (this.read) {
            throw new Error();
        }
        this.dst.off(name, listener);
        return this;
    }

    has(name: string): boolean {
        if (this.dst.has(name) || this.src.has(name)) {
            return true;
        }
        return false;
    }

    getListener(name: string): any[] {
        const a = (this.priority === EventProxyPriority.Src) ? this.src : this.dst;
        const b = (this.priority !== EventProxyPriority.Src) ? this.dst : this.src;
        if (a === b) {
            return a.getListener(name);
        }
        const f1 = a.has(name);
        const f2 = b.has(name);
        if (!f1 && !f2) {
            return [];
        }
        if (!f1 && f2) {
            return b.getListener(name);
        }
        if (f1 && !f2) {
            return a.getListener(name);
        }
        switch (this.match) {
            case EventProxyMatch.Any:
                return a.getListener(name);
            case EventProxyMatch.All:
                return a.getListener(name).concat(b.getListener(name));
            case EventProxyMatch.Uniq:
                return Array.from((new Set([
                    ...a.getListener(name),
                    ...b.getListener(name),
                ])).values());
            default:
                throw new Error();
        }
    }

    eventsListener(): string[] {
        return Array.from((new Set([
            ...this.src.eventsListener(),
            ...this.dst.eventsListener(),
        ])).values());
    }

}