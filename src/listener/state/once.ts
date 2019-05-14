import {EventListener} from "../../interface/listener";

export class EventListenerStateOnce<L> implements EventListener {
    private readonly listeners: Map<string, L> = new Map();

    on(name: string, listener: L): this {
        if (this.listeners.has(name)) {
            throw new Error();
        }
        if (typeof listener !== "function") {
            throw new Error();
        }
        this.listeners.set(name, listener);
        return this;
    }

    off(name: string, listener?: L): this {
        if (this.listeners.has(name)) {
            if (listener && this.listeners.get(name) !== listener) {
                throw new Error();
            }
            this.listeners.delete(name);
        }
        return this;
    }

    has(name: string): boolean {
        return this.listeners.has(name);
    }


    getListener(name: string): L[] {
        if (!this.listeners.has(name)) {
            return [];
        }
        return [this.listeners.get(name)];

    }

    eventsListener(): string[] {
        return Array.from(this.listeners.keys());
    }

}