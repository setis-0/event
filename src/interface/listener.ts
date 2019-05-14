export interface EventListener {

    /**
     * @description добавление обработчика на событие
     * @param {string} name
     * @param listener
     * @returns {this}
     */
    on(name: string, listener: any): this;

    /**
     * @description удаление определеного обработчика события или удаление все обработчиков на определеное событие
     * @param {string} name
     * @param listener
     * @returns {this}
     */
    off(name: string, listener?: any): this;

    /**
     * @description
     * @param {string} name
     * @returns {boolean}
     */
    has(name: string): boolean;

    /**
     * @description получение обработчик события
     * @param {string} name
     * @returns {any}
     */
    getListener(name: string): any[];

    /**
     * @description получение все событий
     * @returns {string[]}
     */
    eventsListener(): string[];
}
export interface EventEmit{
    emit(parameters: {
        context?: any,
        sync?: boolean,
        call: string,
        args?: any[],

    }):Promise<any>;
}
export enum EventListenersMode{
    /**
     * только один обработчик на  событие
     */
    Once = 0,
    /**
     * несколько обработчиков на событие , могут и повторяущиеся
     */
    Multi = 1,
    /**
     * несколько обработчиков на событие , но уникальные
     */
    Uniq = 2
}


export interface EventListenerEmitContext {

    emit(parameters:{
        context?:any,
        sync?: boolean,
        call:string,
        args?:any[],

    }):Promise<any>
}


export enum EventProxyPriority {
    Dst = 1,
    Src = 0

}
export enum EventProxyMatch{
    //найти только первым попавшем источнике
    Any = 0,
    // найти все
    All = 1,
    // найти все но только уникальные события
    Uniq = 2
}

export interface EventProxy extends EventListener{
    dst: EventListener;
    src:EventListener;
    /**
     * @description только чтение
     */
    read:boolean;
    /**
     * приоритет чтение
     */
    priority:EventProxyPriority;
    /**
     *
     */
    match:EventProxyMatch;

}