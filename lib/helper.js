'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * Retry promise
 *
 * @param {function} fn Function returning promise that should be retried
 * @param {number} attempts Maximum number of attempts
 * @param {Backoff} backoff Backoff instance
 * @returns {Promise}
 */

var retryPromise = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(fn, attempts, backoff) {
        var aborted, data, duration;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        aborted = false;
                        _context.prev = 1;
                        _context.next = 4;
                        return fn(function () {
                            aborted = true;
                        });

                    case 4:
                        data = _context.sent;
                        return _context.abrupt('return', data);

                    case 8:
                        _context.prev = 8;
                        _context.t0 = _context['catch'](1);

                        if (!(aborted || backoff.attempts + 1 >= attempts)) {
                            _context.next = 12;
                            break;
                        }

                        throw _context.t0;

                    case 12:
                        duration = backoff.duration();

                        debug('Promise rejected attempt #' + backoff.attempts + ', retrying in ' + duration + 'ms: ' + _context.t0.message);
                        //  eventLog.emit(`Verification Attempt #${backoff.attempts}, retrying in ${duration}ms: ${e.message}`,opts.authClientId)
                        _context.next = 16;
                        return Promise.delay(duration);

                    case 16:
                        return _context.abrupt('return', retryPromise(fn, attempts, backoff));

                    case 17:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[1, 8]]);
    }));

    return function retryPromise(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Retry promise
 *
 * @param {function} fn Function returning promise that should be retried
 * @param {object} [backoffOpts] Backoff options
 * @param {number} [backoffOpts.attempts] Maximum number of attempts, default: `5`
 * @param {number} [backoffOpts.min] Minimum attempt delay in milliseconds, default: `5000`
 * @param {number} [backoffOpts.max] Maximum attempt delay in milliseconds, default: `30000`
 * @returns {Promise}
 */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Utility methods
 */

var Promise = require('bluebird');
var Backoff = require('backo2');
var debug = require('debug')('acme-client');
var eventLog = require('./eventlog');function retry(fn) {
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$attempts = _ref2.attempts,
        attempts = _ref2$attempts === undefined ? 5 : _ref2$attempts,
        _ref2$min = _ref2.min,
        min = _ref2$min === undefined ? 5000 : _ref2$min,
        _ref2$max = _ref2.max,
        max = _ref2$max === undefined ? 30000 : _ref2$max;

    var backoff = new Backoff({ min: min, max: max });
    return retryPromise(fn, attempts, backoff);
}

/**
 * Escape base64 encoded string
 *
 * @param {string} str Base64 encoded string
 * @returns {string} Escaped string
 */

function b64escape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 encode and escape buffer or string
 *
 * @param {buffer|string} str Buffer or string to be encoded
 * @returns {string} Escaped base64 encoded string
 */

function b64encode(str) {
    var buf = Buffer.isBuffer(str) ? str : Buffer.from(str);
    return b64escape(buf.toString('base64'));
}

/**
 * Parse PEM body from buffer or string
 *
 * @param {buffer|string} str PEM encoded buffer or string
 * @returns {string} PEM body
 */

function getPemBody(str) {
    var pemStr = Buffer.isBuffer(str) ? str.toString() : str;
    return pemStr.replace(/(\s*-----(BEGIN|END) ([A-Z0-9- ]+)-----|\r|\n)*/g, '');
}

/**
 * Parse links from HTTP response headers
 *
 * @param {object} headers HTTP response headers
 * @returns {object} Links found from headers
 */

function linkParser(headers) {
    if (!headers || !headers.link) {
        return {};
    }

    var result = {};
    var links = headers.link.split(/,/);

    links.forEach(function (link) {
        var matches = link.match(/<([^>]*)>;rel="([^"]*)"/);

        if (matches) {
            result[matches[2]] = matches[1];
        }
    });

    return result;
}

/**
 * Find and format error in response object
 *
 * @param {object} resp HTTP response
 * @returns {string} Error message
 */

function formatResponseError(resp) {
    var result = void 0;

    if (resp.data.error) {
        result = resp.data.error.detail || resp.data.error;
    } else {
        result = resp.data.detail || (0, _stringify2.default)(resp.data);
    }

    return result.replace(/\n/g, '');
}

/* Export utils */
module.exports = {
    retry: retry,
    b64escape: b64escape,
    b64encode: b64encode,
    getPemBody: getPemBody,
    linkParser: linkParser,
    formatResponseError: formatResponseError
};