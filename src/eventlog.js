const events = require('events');

const eventEmitter = new events.EventEmitter();

function emit(msg, authClientId) {
    const payload = {
        msg, authClientId
    };
    eventEmitter.emit('acme', payload);
}


module.exports = { emit };

