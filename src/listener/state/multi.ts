import {EventListener} from "../../interface/listener";

export class EventListenerStateMulti<L> implements EventListener {
    private readonly listeners: Map<string, Array<L>> = new Map();

    on(name: string, listener: L): this {
        if (this.listeners.has(name)) {
            let l = this.listeners.get(name);
            if (l === undefined) {
                this.listeners.set(name, [listener]);
            }
            if (l instanceof Array) {
                l.push(listener);
            }
        } else {
            this.listeners.set(name, [listener]);
        }
        return this;
    }

    off(name: string, listener?: L): this {
        if (this.listeners.has(name)) {
            if (listener === undefined) {
                this.listeners.delete(name);
            } else {
                const listeners = this.listeners.get(name);
                while (listeners.indexOf(listener) !== -1) {
                    listeners.splice(listeners.indexOf(listener), 1);
                }
                if (listeners.length < 1) {
                    this.listeners.delete(name);
                }
            }
        }
        return this;
    }

    has(name: string): boolean {
        return this.listeners.has(name);
    }

    getListener(name: string): L[] {
        if (name === undefined || !this.listeners.has(name) || this.listeners.get(name).length < 1) {
            return [];
        }
        return Array.from(this.listeners.get(name).values());
    }

    eventsListener(): string[] {
        return Array.from(this.listeners.keys());
    }

}