import {EventListener} from "../../interface/listener";

export class EventListenerStateUniq<L> implements EventListener {
    private readonly listeners: Map<string, Set<L>> = new Map();

    on(name: string, listener: L): this {
        if (this.listeners.has(name)) {
            let l = this.listeners.get(name);
            if (l === undefined) {
                this.listeners.set(name, new Set([listener]));
            }
            else if (l instanceof Set) {
                l.add(listener);
            } else {
                this.listeners.set(name, new Set([listener]));
            }
        } else {
            this.listeners.set(name, new Set([listener]));
        }
        return this;
    }

    off(name: string, listener?: L): this {
        if (this.listeners.has(name)) {
            if (listener === undefined) {
                this.listeners.delete(name);
            } else {
                const listeners = this.listeners.get(name);
                listeners.delete(listener);
                if (listeners.size < 1) {
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
        if (name === undefined || !this.listeners.has(name) || this.listeners.get(name).size < 1) {
            return [];
        }
        return Array.from(this.listeners.get(name).values());
    }

    eventsListener(): string[] {
        return Array.from(this.listeners.keys());
    }

}