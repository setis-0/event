import {EventListenerStateMulti} from "./multi";
import {EventListenerStateOnce} from "./once";
import {EventListenerStateUniq} from "./uniq";
import {EventListener, EventListenersMode} from "../../interface";
import {EventEmitter} from "../../emitter";

export * from './multi'
export * from './once'
export * from './uniq'

export function createEventListenerState(mode: EventListenersMode) {
    switch (mode) {
        case EventListenersMode.Multi:
            return new EventListenerStateMulti();
        case EventListenersMode.Once:
            return new EventListenerStateOnce();
        case EventListenersMode.Uniq:
            return new EventListenerStateUniq();
        default:
            throw new Error(`not found EventListenersMode of createEventListenerState()`);
    }
}

export function getEventLitenerState(data: EventListener|EventListenersMode): EventListenersMode {
    if([EventListenersMode.Once, EventListenersMode.Multi, EventListenersMode.Uniq].indexOf(data as EventListenersMode) !== -1){
        return data as EventListenersMode;
    }
    if (data instanceof EventListenerStateMulti) {
        return EventListenersMode.Multi;
    }
    if (data instanceof EventListenerStateOnce) {
        return EventListenersMode.Once;
    }
    if (data instanceof EventListenerStateUniq) {
        return EventListenersMode.Uniq;
    }
    if (data instanceof EventEmitter && [EventListenersMode.Once, EventListenersMode.Multi, EventListenersMode.Uniq].indexOf(data.mode) !== -1) {
        return data.mode;
    }
    console.log(data)
    throw new Error(`not found EventListenersMode of getEventLitenerState()`)
}




