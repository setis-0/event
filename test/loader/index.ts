// import {EventLoader} from "../../src";
// import * as assert from "assert";
// import * as microtime from 'microtime';
// import {expect} from 'chai';
// import {normalize} from "path";
// describe('loader', () => {
//     it('run ', function (done) {
//         const events = new EventLoader<any>({
//             dir:[
//                 normalize(`${__dirname}/actions`)
//             ],
//             logger: {
//                 info: (...args) => {
//                     console.info(...args);
//                 },
//                 debug: (...args) => {
//                     console.debug(...args);
//                 },
//                 log: (...args) => {
//                     console.log(...args);
//                 },
//                 error: (...args) => {
//                     console.error(...args);
//                 }
//             }
//         });
//         events.run().then(value => {
//             done();
//         });
//
//     });
// });
