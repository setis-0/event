/**
 * Created by alex on 18.06.17.
 */
import {assert} from 'chai';
import {EventEmitter} from "../src/emitter";


describe('emitter', function () {

    it('проверка передачи аргументов', function (done) {
        const event = new EventEmitter();
        event
            .on('sum', function (a, b) {
                event.emit({
                    call: 'data',
                    args: [a + b]
                });
                setTimeout(() => {
                    event.emit({
                        call: 'done'
                    });
                }, 15);
            })
            .on('data', function (sum) {
                assert.equal(sum, 5);
            })
            .on('done', function () {
                done();
            });
        event.emit({
            call: 'sum',
            args: [2, 3]
        });
    });
    it('передача контекста', function (done) {
        let context = {
            emit: (name: string, ...args) => {
                return event.emit({
                    call: name,
                    args: args
                })
            }
        };
        const event = new EventEmitter({emit: {context: context}});

        event
            .on('sum', function (a, b) {
                this.sum = a + b;
                this.emit('data', a + b);
                setTimeout(() => {
                    this.emit('done');
                }, 15);
            })
            .on('data', function (sum) {

                assert.equal(sum, 5);
                assert.equal(this.sum, 5);
            })
            .on('done', function () {
                done();
            });
        event.emit({
            call: 'sum',
            args: [2, 3]
        });

    });


});