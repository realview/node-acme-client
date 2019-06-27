'use strict';

const events = require('events');

let notifier = new events.EventEmitter();

function emit(msg, authClientId) {
    var payload = {
        msg: msg, authClientId: authClientId
    };
    notifier.emit('acme', payload);
}

module.exports = { notifier, emit };