"use strict";

var events = require("events");

var eventEmitter = new events.EventEmitter();
function api() {

    this.emit = emit;
}

function emit(msg, authClientId) {

    var payload = {
        msg: msg, authClientId: authClientId
    };
    eventEmitter.emit("acme", payload);
}

module.exports = api;