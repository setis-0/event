import {createCollection, createGroup, EventDispather, EventQueue, EventStream} from "../src";
import {expect,assert} from "chai";

describe('dispatcher', function () {
    it('проверка очереди если одного всписке собития не существует', function (done) {
        let event = new EventDispather();
        event
            .listener
            .on('begin', function () {
                this.data.start = process.hrtime();
            })
            .on('end', function () {
                done();


            });
        event
            .addQueue({
            name:'start',
            queue:[
                'begin',
                'asd',
                'end',
                'asdf'
            ]
        });
        event.dispatch('start');
    });
    it('ошибка запуск не существующий списка очереди',function(){
        const event = new EventDispather();
        event
            .addQueue({
                name:'start',
                queue:[
                    'begin',
                    'end',
                ]
            });
        expect(()=>{
            event
                .addQueue({
                    name:'start',
                    queue:[
                        'begin',
                        'end',
                    ]
                });
        }).to.throw(`уже существует такой список очереди start`);
    })
    it('ввод данных и получение результата', function (done) {
        let event = new EventDispather();
        event
            .listener
            .on('begin', function (i) {
                assert.equal(i, 2);
                this.data.i = 2;
            })
            .on('sum', function () {
                this.data.i += 2;
            })
            .on('assert', function () {
                assert.equal(this.data.i, 4, 'assert 4');
            })
            .on('end', function () {
                done();
            });

        event
            .addQueue({
                name:'start',
                queue:[
                    'begin',
                    'sum',
                    'assert',
                    'end',
                ]
            });
        event.dispatch('start',{begin: [2]});
    });
    it('проверка асинхроная группа событий', function () {
        let event = new EventDispather();
        event
            .listener
            .on('begin', async function (i) {
                assert.equal(i, 2);
                this.data.i = 2;
                this.data.start = process.hrtime();
            })
            .on('sum', async function () {
                this.data.i += 2;
            })
            .on('assert', function () {
                assert.equal(this.data.i, 4);
            })
            .on('event1', async function () {
                await new Promise(resolve => {
                    setTimeout(resolve, 1);
                });
                this.data.event1 = (new Date()).getTime();

            })
            .on('event2', async function () {
                await  new Promise(resolve => {
                    setTimeout(resolve, 5);
                });
                this.data.event2 = (new Date()).getTime();
            })
            .on('end', async function () {
                assert.equal((this.data.event2 - this.data.event1) > 0, true);
            });
        event
            .addQueue({
                name:'start',
                queue:[
                    'begin',
                    'sum',
                    'assert',
                    createCollection('event', ['event1', 'event2', 'assert']),
                    'end'
                ]
            });
        const queue:EventQueue = event.queue.get('start');
        assert.instanceOf(queue,EventQueue);
        expect(queue.list).to.include.members([
            'begin',
            'sum',
            'assert',
            'event',
            'end'
        ])
        assert.equal(queue.storage.has('event'),true);
        const collection:EventQueue = queue.storage.get('event');
        assert.instanceOf(collection,EventQueue);
        expect(collection.list).to.include.members([
            'event1', 'event2', 'assert'
        ])
        return event.dispatch('start',{
            begin:[2]
        });
    });
    it('проверка группу событий', async function () {
        let event = new EventDispather();
        event
            .listener
            .on('begin', function (i) {
                this.data = { i: 2};
            })
            .on('sum', function () {
                this.data.i += 2;
            })
            .on('assert', function () {
                assert.equal(this.data.i, 4, 'assert');
            })
            .on('event1', function () {
                console.log(this.data,this.source.data);
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.data.event1 = (new Date()).getTime();
                        resolve();
                    }, 15);
                });


            })
            .on('event2', function (callback) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.data.event2 = (new Date()).getTime();
                        resolve();
                    }, 1);
                });
            })
            .on('end', function () {
                assert.equal((this.data.event2 - this.data.event1) > 0, true);

            });

        event
            .addQueue({
                name:'start',
                queue:[
                    'begin',
                    'sum',
                    'assert',
                    createGroup('event', ['event1', 'event2', 'assert']),
                    'end'
                ]
            });
        const queue:EventQueue = event.queue.get('start');
        assert.instanceOf(queue,EventQueue);
        expect(queue.list).to.include.members([
            'begin',
            'sum',
            'assert',
            'event',
            'end'
        ])
        assert.equal(queue.storage.has('event'),true);
        const group:EventQueue = queue.storage.get('event');
        assert.instanceOf(group,EventQueue);
        expect(group.list).to.include.members([
            'event1',
            'event2',
            'assert'
        ])
        return event.dispatch('start',{
            begin:[2]
        });
    });
    it('проверка списка очереди', function (done) {
        let event = new EventDispather();
        event
            .listener
            .on('begin', function (i) {
                assert.equal(i,2);
                this.data.i = i;

            })
            .on('sum', function () {
                this.data.i += 2;
            })
            .on('group:assert', function () {
                assert.equal(this.data.i, 4);
                assert.equal((this.data.group_event2 - this.data.group_event1) > 0, true);
                return Promise.resolve();
            })
            .on('collection:assert', function () {
                assert.equal(this.data.i, 4);
                assert.equal((this.data.collection_event1 - this.data.collection_event2) > 0, true);

            })
            .on('group:event1', function () {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.data.group_event1 = (new Date()).getTime();
                        resolve();
                    }, 15);
                })


            })
            .on('group:event2', function (callback) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.data.group_event2 = (new Date()).getTime();
                        resolve();
                    }, 1);
                })
            })
            .on('collection:event1', function (callback) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.data.collection_event1 = (new Date()).getTime();
                        resolve();
                    }, 15);
                })

            })
            .on('collection:event2', function () {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.data.collection_event2 = (new Date()).getTime();
                        resolve();
                    }, 1);
                })
            })
            .on('end', function (this:EventStream) {
                done();
            });

        event
            .addQueue({
                name:'start',
                queue:[
                    'begin',
                    'sum',
                    createCollection('collection', ['collection:event1', 'collection:event2']),
                    'collection:assert',
                    createGroup('group', ['group:event1', 'group:event2', 'group:assert']),
                    'end',
                ]
            });
        const queue:EventQueue = event.queue.get('start');
        assert.instanceOf(queue,EventQueue);
        expect(queue.list).to.include.members([
            'begin',
            'sum',
            'collection',
            'collection:assert',
            'group',
            'end',
        ])
        assert.equal(queue.storage.has('group'),true);
        const group:EventQueue = queue.storage.get('group');
        assert.instanceOf(group,EventQueue);
        expect(group.list).to.include.members([
            'group:event1', 'group:event2', 'group:assert'
        ]);
        assert.equal(queue.storage.has('collection'),true);
        const collection:EventQueue = queue.storage.get('collection');
        assert.instanceOf(collection,EventQueue);
        expect(collection.list).to.include.members([
            'collection:event1', 'collection:event2'
        ])
        event.dispatch('start',{
            begin:[2]
        });
    });
});