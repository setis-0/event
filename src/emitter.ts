import {EventEmit, EventListener, EventListenersMode} from "./interface";
import {createEventListenerState, getEventLitenerState} from "./listener/state";
import {EventListenerEmit} from "./listener/emit";

export class EventEmitter implements EventListener, EventEmit {

    readonly mode: EventListenersMode;
    protected _listener: EventListener;
    protected _emit: EventEmit;

    constructor(parameters: { listener?: EventListener | EventListenersMode, emit?: EventEmit | { context?: any; notFoundEventError?: boolean, listener?: EventListener } } = {}) {
        const {
            listener = EventListenersMode.Once, emit = {
                context: null,
                notFoundEventError: false,
            }
        } = parameters;
        switch (typeof listener) {
            case "number":
                this._listener = createEventListenerState(listener as EventListenersMode);
                this.mode = listener as EventListenersMode;
                break;
            case "object":
                this.mode = getEventLitenerState(listener as EventListener);
                this._listener = listener as EventListener;
                break;
            default:
                console.log(listener, typeof listener)
                throw new Error(`not found listener`);
        }
        if (emit instanceof EventListenerEmit) {
            this._emit = emit as EventListenerEmit;
        } else {
            this._emit = new EventListenerEmit({
                ...emit as { context?: any; notFoundEventError?: boolean, listener?: EventListener },
                listener: this._listener
            })
        }
    }

    on(name: string, listener: any): this {
        this._listener.on(name, listener);
        return this;
    }

    off(name: string, listener?: any): this {
        this._listener.off(name, listener);
        return this;
    }

    has(name: string): boolean {
        return this._listener.has(name);
    }

    getListener(name: string): any[] {
        return this._listener.getListener(name);
    }

    eventsListener(): string[] {
        return this._listener.eventsListener();
    }

    emit(parameters: { context?: any; sync?: boolean; call: string; args?: any[]; }): Promise<any> {
        return this._emit.emit(parameters);
    }

}
