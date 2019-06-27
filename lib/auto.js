'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ACME auto helper
 */

var Promise = require('bluebird');
var debug = require('debug')('acme-client');
var forge = require('./crypto/forge');
var eventLog = require('./eventlog');

var defaultOpts = {
    csr: null,
    email: null,
    termsOfServiceAgreed: false,
    challengePriority: ['http-01', 'dns-01'],
    challengeCreateFn: function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            throw new Error('Missing challengeCreateFn()');

                        case 1:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, undefined);
        }));

        function challengeCreateFn() {
            return _ref.apply(this, arguments);
        }

        return challengeCreateFn;
    }(),
    challengeRemoveFn: function () {
        var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            throw new Error('Missing challengeRemoveFn()');

                        case 1:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, undefined);
        }));

        function challengeRemoveFn() {
            return _ref2.apply(this, arguments);
        }

        return challengeRemoveFn;
    }(),
    authClientId: ''
};

/**
 * ACME client auto mode
 *
 * @param {AcmeClient} client ACME client
 * @param {object} userOpts Options
 * @returns {Promise<buffer>} Certificate
 */

module.exports = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(client, userOpts) {
        var _this = this;

        var opts, accountPayload, csrDomains, domains, orderPayload, order, authorizations, challengePromises;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        opts = (0, _assign2.default)({}, defaultOpts, userOpts);
                        accountPayload = { termsOfServiceAgreed: opts.termsOfServiceAgreed };


                        if (!Buffer.isBuffer(opts.csr)) {
                            opts.csr = Buffer.from(opts.csr);
                        }

                        if (opts.email) {
                            accountPayload.contact = ['mailto:' + opts.email];
                        }

                        /**
                         * Register account
                         */

                        debug('[auto] Checking account');

                        _context4.prev = 5;

                        client.getAccountUrl();
                        debug('[auto] Account URL already exists, skipping account registration');
                        _context4.next = 15;
                        break;

                    case 10:
                        _context4.prev = 10;
                        _context4.t0 = _context4['catch'](5);

                        debug('[auto] Registering account');
                        _context4.next = 15;
                        return client.createAccount(accountPayload);

                    case 15:

                        /**
                         * Parse domains from CSR
                         */

                        debug('[auto] Parsing domains from Certificate Signing Request');
                        _context4.next = 18;
                        return forge.readCsrDomains(opts.csr);

                    case 18:
                        csrDomains = _context4.sent;
                        domains = [csrDomains.commonName].concat(csrDomains.altNames);


                        debug('[auto] Resolved ' + domains.length + ' domains from parsing the Certificate Signing Request');

                        /**
                         * Place order
                         */

                        debug('[auto] Placing new certificate order with ACME provider');
                        orderPayload = {
                            identifiers: domains.map(function (d) {
                                return { type: 'dns', value: d };
                            })
                        };
                        _context4.next = 25;
                        return client.createOrder(orderPayload);

                    case 25:
                        order = _context4.sent;
                        _context4.next = 28;
                        return client.getAuthorizations(order);

                    case 28:
                        authorizations = _context4.sent;


                        debug('[auto] Placed certificate order successfully, received ' + authorizations.length + ' identity authorizations');

                        /**
                         * Resolve and satisfy challenges
                         */

                        debug('[auto] Resolving and satisfying authorization challenges');

                        challengePromises = authorizations.map(function () {
                            var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(authz) {
                                var d, challenge, keyAuthorization;
                                return _regenerator2.default.wrap(function _callee3$(_context3) {
                                    while (1) {
                                        switch (_context3.prev = _context3.next) {
                                            case 0:
                                                d = authz.identifier.value;

                                                /* Select challenge based on priority */

                                                challenge = authz.challenges.sort(function (a, b) {
                                                    var aidx = opts.challengePriority.indexOf(a.type);
                                                    var bidx = opts.challengePriority.indexOf(b.type);

                                                    if (aidx === -1) return 1;
                                                    if (bidx === -1) return -1;
                                                    return aidx - bidx;
                                                }).slice(0, 1)[0];

                                                if (challenge) {
                                                    _context3.next = 4;
                                                    break;
                                                }

                                                throw new Error('Unable to select challenge for ' + d + ', no challenge found');

                                            case 4:
                                                debug('[auto] [' + d + '] Found ' + authz.challenges.length + ' challenges, selected type: ' + challenge.type);
                                                eventLog.emit(' [' + d + '] Found ' + authz.challenges.length + ' challenges, selected type: ' + challenge.type, opts.authClientId);

                                                /* Trigger challengeCreateFn() */
                                                debug('[auto] [' + d + '] Trigger challengeCreateFn()');
                                                _context3.next = 9;
                                                return client.getChallengeKeyAuthorization(challenge);

                                            case 9:
                                                keyAuthorization = _context3.sent;
                                                _context3.prev = 10;
                                                _context3.next = 13;
                                                return opts.challengeCreateFn(authz, challenge, keyAuthorization);

                                            case 13:

                                                /* Verify challenge and wait for valid status */
                                                debug('[auto] [' + d + '] Verifying challenge and waiting for valid status');
                                                eventLog.emit(' [' + d + '] Verifying challenge and waiting for valid status', opts.authClientId);
                                                _context3.next = 17;
                                                return client.verifyChallenge(authz, challenge, opts.authClientId);

                                            case 17:
                                                _context3.next = 19;
                                                return client.completeChallenge(challenge, opts.authClientId);

                                            case 19:
                                                _context3.next = 21;
                                                return client.waitForValidStatus(challenge, opts.authClientId);

                                            case 21:
                                                _context3.prev = 21;

                                                /* Trigger challengeRemoveFn(), suppress errors */
                                                debug('[auto] [' + d + '] Trigger challengeRemoveFn()');

                                                _context3.prev = 23;
                                                _context3.next = 26;
                                                return opts.challengeRemoveFn(authz, challenge, keyAuthorization);

                                            case 26:
                                                _context3.next = 31;
                                                break;

                                            case 28:
                                                _context3.prev = 28;
                                                _context3.t0 = _context3['catch'](23);

                                                debug('[auto] [' + d + '] challengeRemoveFn threw error: ' + _context3.t0.message);

                                            case 31:
                                                return _context3.finish(21);

                                            case 32:
                                            case 'end':
                                                return _context3.stop();
                                        }
                                    }
                                }, _callee3, _this, [[10, , 21, 32], [23, 28]]);
                            }));

                            return function (_x3) {
                                return _ref4.apply(this, arguments);
                            };
                        }());


                        debug('[auto] Waiting for challenge valid status');
                        _context4.next = 35;
                        return Promise.all(challengePromises);

                    case 35:

                        /**
                         * Finalize order and download certificate
                         */

                        debug('[auto] Finalizing order and downloading certificate');
                        _context4.next = 38;
                        return client.finalizeOrder(order, opts.csr);

                    case 38:
                        return _context4.abrupt('return', client.getCertificate(order));

                    case 39:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this, [[5, 10]]);
    }));

    return function (_x, _x2) {
        return _ref3.apply(this, arguments);
    };
}();