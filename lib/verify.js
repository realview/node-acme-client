'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * Verify ACME HTTP challenge
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#http-challenge
 *
 * @param {object} authz Identifier authorization
 * @param {object} challenge Authorization challenge
 * @param {string} keyAuthorization Challenge key authorization
 * @param {string} [suffix] URL suffix
 * @returns {Promise<boolean>}
 */

var verifyHttpChallenge = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(authz, challenge, keyAuthorization) {
        var suffix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '/.well-known/acme-challenge/' + challenge.token;
        var challengeUrl, resp;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        debug('Sending HTTP query to ' + authz.identifier.value + ', suffix: ' + suffix);
                        challengeUrl = 'http://' + authz.identifier.value + suffix;
                        _context.next = 4;
                        return axios.get(challengeUrl);

                    case 4:
                        resp = _context.sent;


                        debug('Query successful, HTTP status code: ' + resp.status);

                        if (!(!resp.data || resp.data !== keyAuthorization)) {
                            _context.next = 8;
                            break;
                        }

                        throw new Error('Authorization not found in HTTP response from ' + authz.identifier.value);

                    case 8:

                        debug('Key authorization match for ' + challenge.type + '/' + authz.identifier.value + ', ACME challenge verified');
                        return _context.abrupt('return', true);

                    case 10:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function verifyHttpChallenge(_x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Verify ACME DNS challenge
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#dns-challenge
 *
 * @param {object} authz Identifier authorization
 * @param {object} challenge Authorization challenge
 * @param {string} keyAuthorization Challenge key authorization
 * @param {string} [prefix] DNS prefix
 * @returns {Promise<boolean>}
 */

var verifyDnsChallenge = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(authz, challenge, keyAuthorization) {
        var _ref3;

        var prefix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '_acme-challenge.';
        var authClientId = arguments[4];
        var challengeRecord, result, records;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        debug('Resolving DNS TXT records for ' + authz.identifier.value + ', prefix: ' + prefix);
                        eventLog.emit('Resolving DNS TXT records for ' + authz.identifier.value + ', prefix: ' + prefix, authClientId);
                        challengeRecord = '' + prefix + authz.identifier.value;
                        _context2.next = 5;
                        return dns.resolveCnameAsync(challengeRecord).then(function (r) {
                            return dns.resolveTxtAsync(r[0]);
                        });

                    case 5:
                        result = _context2.sent;
                        records = (_ref3 = []).concat.apply(_ref3, (0, _toConsumableArray3.default)(result));


                        debug('Query successful, found ' + records.length + ' DNS TXT records');

                        if (!(records.indexOf(keyAuthorization) === -1)) {
                            _context2.next = 10;
                            break;
                        }

                        throw new Error('Authorization not found in DNS TXT records for ' + authz.identifier.value);

                    case 10:
                        debug('Key authorization match for ' + challenge.type + '/' + authz.identifier.value + ', ACME challenge verified');
                        eventLog.emit('Key authorization match for ' + challenge.type + '/' + authz.identifier.value, authClientId);

                        return _context2.abrupt('return', true);

                    case 13:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function verifyDnsChallenge(_x6, _x7, _x8) {
        return _ref2.apply(this, arguments);
    };
}();

/**
 * Export API
 */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ACME challenge verification
 */

var Promise = require('bluebird');
var dns = Promise.promisifyAll(require('dns'));

dns.setServers(['8.8.8.8']);
var axios = require('axios');
var debug = require('debug')('acme-client');
var eventLog = require('./eventlog');module.exports = {
    'http-01': verifyHttpChallenge,
    'dns-01': verifyDnsChallenge
};