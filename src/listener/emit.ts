import {EventEmit, EventListener} from "../interface";
import {EventListenerStateMulti} from "./state/multi";
import {EventListenerStateOnce, EventListenerStateUniq} from "./state";

function emit(context: any,
              args: any[],
              listener: any) {
    return new Promise((resolve, reject) => {
        // console.log(context,args,listener)
        try {
            const answer = listener.apply(context, args);
            (answer instanceof Promise) ? answer.then(resolve, reject) : resolve(answer);
        } catch (e) {
            // console.log(context,args,listener,e)
            reject(e);
        }
    })
}

export class EventListenerEmit<C = any> implements EventEmit {
    protected listener: EventListener;
    protected context: C | null;
    protected notFoundEventError: boolean;

    constructor(parameters: { listener: EventListener, context?: any, notFoundEventError?: boolean }) {
        let {listener, context = null, notFoundEventError = false} = parameters;
        if (listener instanceof EventListenerStateMulti ||
            listener instanceof EventListenerStateOnce ||
            listener instanceof EventListenerStateUniq) {
            this.listener = listener;
        } else {
            throw new Error(`listener not implements EventListener (EventListenerStateMulti,EventListenerStateOnce,EventListenerStateUniq)`)
        }
        this.context = context;
        this.notFoundEventError = notFoundEventError;
    }

    async emit<CL = C>(parameters: {
        context?: CL | C,
        sync?: boolean,
        call: string,
        args?: any[],
        onErrorNotFound?: boolean

    }) {
        const {context = this.context, call, args = [], sync = true, onErrorNotFound = this.notFoundEventError} = parameters;
        if (!this.listener.has(call)) {
            if (!onErrorNotFound) {
                return;
            }
            throw new Error();
        }
        if (sync) {
            let result = [];
            for (let listener of this.listener.getListener(call)) {
                result.push(await emit(context, args, listener));
            }
            return result;
        }
        return await Promise.all(this.listener.getListener(call).map(listener => emit(context, args, listener)));

    }
}