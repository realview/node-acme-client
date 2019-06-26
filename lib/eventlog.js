'use strict';

var events = require('events');

var eventEmitter = new events.EventEmitter();

function emit(msg, authClientId) {
    var payload = {
        msg: msg, authClientId: authClientId
    };
    eventEmitter.emit('acme', payload);
}
function api() {
    this.emit = emit;

    return this;
}

module.exports = api;