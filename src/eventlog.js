const events = require("events")

const eventEmitter = new events.EventEmitter();
function api() {

    this.emit = emit
}


    function emit(msg,authClientId)  {

        let payload = {
            msg,authClientId
        }
        eventEmitter.emit("acme", payload)
    }


module.exports = api

