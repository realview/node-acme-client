'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ACME client
 */

var crypto = require('crypto');
var debug = require('debug')('acme-client');
var Promise = require('bluebird');
var HttpClient = require('./http');
var AcmeApi = require('./api');
var verify = require('./verify');
var helper = require('./helper');
var _auto = require('./auto');
var eventLog = require('./eventlog');

/**
 * Default options
 */

var defaultOpts = {
    directoryUrl: undefined,
    accountKey: undefined,
    accountUrl: null,
    backoffAttempts: 5,
    backoffMin: 5000,
    backoffMax: 30000
};

/**
 * AcmeClient
 *
 * @class
 * @param {object} opts
 * @param {string} opts.directoryUrl ACME directory URL
 * @param {buffer|string} opts.accountKey PEM encoded account private key
 * @param {string} [opts.accountUrl] Account URL, default: `null`
 * @param {number} [opts.backoffAttempts] Maximum number of backoff attempts, default: `5`
 * @param {number} [opts.backoffMin] Minimum backoff attempt delay in milliseconds, default: `5000`
 * @param {number} [opts.backoffMax] Maximum backoff attempt delay in milliseconds, default: `30000`
 */

var AcmeClient = function () {
    function AcmeClient(opts) {
        (0, _classCallCheck3.default)(this, AcmeClient);

        if (!Buffer.isBuffer(opts.accountKey)) {
            opts.accountKey = Buffer.from(opts.accountKey);
        }

        this.opts = (0, _assign2.default)({}, defaultOpts, opts);

        this.backoffOpts = {
            attempts: this.opts.backoffAttempts,
            min: this.opts.backoffMin,
            max: this.opts.backoffMax
        };

        this.http = new HttpClient(this.opts.directoryUrl, this.opts.accountKey);
        this.api = new AcmeApi(this.http, this.opts.accountUrl);
    }

    /**
     * Get Terms of Service URL
     *
     * @returns {Promise<string>} ToS URL
     */

    (0, _createClass3.default)(AcmeClient, [{
        key: 'getTermsOfServiceUrl',
        value: function getTermsOfServiceUrl() {
            return this.api.getTermsOfServiceUrl();
        }

        /**
         * Get current account URL
         *
         * @returns {string} Account URL
         */

    }, {
        key: 'getAccountUrl',
        value: function getAccountUrl() {
            return this.api.getAccountUrl();
        }

        /**
         * Create a new account
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
         *
         * @param {object} [data] Request data
         * @returns {Promise<object>} Account
         */

    }, {
        key: 'createAccount',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                var resp;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.prev = 0;

                                this.getAccountUrl();

                                /* Account URL exists */
                                debug('Account URL exists, returning updateAccount()');
                                return _context.abrupt('return', this.updateAccount(data));

                            case 6:
                                _context.prev = 6;
                                _context.t0 = _context['catch'](0);
                                _context.next = 10;
                                return this.api.createAccount(data);

                            case 10:
                                resp = _context.sent;

                                if (!(resp.status === 200)) {
                                    _context.next = 14;
                                    break;
                                }

                                debug('Account already exists (HTTP 200), returning updateAccount()');
                                return _context.abrupt('return', this.updateAccount(data));

                            case 14:
                                return _context.abrupt('return', resp.data);

                            case 15:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[0, 6]]);
            }));

            function createAccount() {
                return _ref.apply(this, arguments);
            }

            return createAccount;
        }()

        /**
         * Update existing account
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
         *
         * @param {object} [data] Request data
         * @returns {Promise<object>} Account
         */

    }, {
        key: 'updateAccount',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                var resp;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.prev = 0;

                                this.api.getAccountUrl();
                                _context2.next = 8;
                                break;

                            case 4:
                                _context2.prev = 4;
                                _context2.t0 = _context2['catch'](0);

                                debug('No account URL found, returning createAccount()');
                                return _context2.abrupt('return', this.createAccount(data));

                            case 8:
                                _context2.next = 10;
                                return this.api.updateAccount(data);

                            case 10:
                                resp = _context2.sent;
                                return _context2.abrupt('return', resp.data);

                            case 12:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[0, 4]]);
            }));

            function updateAccount() {
                return _ref2.apply(this, arguments);
            }

            return updateAccount;
        }()

        /**
         * Update account private key
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
         *
         * @param {buffer|string} newAccountKey New PEM encoded private key
         * @param {object} [data] Additional request data
         * @returns {Promise<object>} Account
         */

    }, {
        key: 'updateAccountKey',
        value: function () {
            var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(newAccountKey) {
                var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                var accountUrl, newHttpClient, newApiClient, url, body, resp;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (!Buffer.isBuffer(newAccountKey)) {
                                    newAccountKey = Buffer.from(newAccountKey);
                                }

                                accountUrl = this.api.getAccountUrl();

                                /* Create new HTTP and API clients using new key */

                                newHttpClient = new HttpClient(this.opts.directoryUrl, newAccountKey);
                                newApiClient = new AcmeApi(newHttpClient, accountUrl);

                                /* Get new JWK */

                                data.account = accountUrl;
                                _context3.next = 7;
                                return this.http.getJwk();

                            case 7:
                                data.oldKey = _context3.sent;
                                _context3.next = 10;
                                return newHttpClient.getJwk();

                            case 10:
                                data.newKey = _context3.sent;
                                _context3.next = 13;
                                return newHttpClient.getResourceUrl('keyChange');

                            case 13:
                                url = _context3.sent;
                                _context3.next = 16;
                                return newHttpClient.createSignedBody(url, data);

                            case 16:
                                body = _context3.sent;
                                _context3.next = 19;
                                return this.api.updateAccountKey(body);

                            case 19:
                                resp = _context3.sent;


                                /* Replace existing HTTP and API client */
                                this.http = newHttpClient;
                                this.api = newApiClient;

                                return _context3.abrupt('return', resp.data);

                            case 23:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function updateAccountKey(_x4) {
                return _ref3.apply(this, arguments);
            }

            return updateAccountKey;
        }()

        /**
         * Create a new order
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
         *
         * @param {object} data Request data
         * @returns {Promise<object>} Order
         */

    }, {
        key: 'createOrder',
        value: function () {
            var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(data) {
                var resp;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return this.api.createOrder(data);

                            case 2:
                                resp = _context4.sent;

                                if (resp.headers.location) {
                                    _context4.next = 5;
                                    break;
                                }

                                throw new Error('Creating a new order did not return an order link');

                            case 5:

                                /* Add URL to response */
                                resp.data.url = resp.headers.location;
                                return _context4.abrupt('return', resp.data);

                            case 7:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function createOrder(_x5) {
                return _ref4.apply(this, arguments);
            }

            return createOrder;
        }()

        /**
         * Finalize order
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
         *
         * @param {object} order Order object
         * @param {buffer|string} csr PEM encoded Certificate Signing Request
         * @returns {Promise<object>} Order
         */

    }, {
        key: 'finalizeOrder',
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(order, csr) {
                var body, data, resp;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                if (order.finalize) {
                                    _context5.next = 2;
                                    break;
                                }

                                throw new Error('Unable to finalize order, URL not found');

                            case 2:

                                if (!Buffer.isBuffer(csr)) {
                                    csr = Buffer.from(csr);
                                }

                                body = helper.getPemBody(csr);
                                data = { csr: helper.b64escape(body) };
                                _context5.next = 7;
                                return this.api.finalizeOrder(order.finalize, data);

                            case 7:
                                resp = _context5.sent;
                                return _context5.abrupt('return', resp.data);

                            case 9:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function finalizeOrder(_x6, _x7) {
                return _ref5.apply(this, arguments);
            }

            return finalizeOrder;
        }()

        /**
         * Get identifier authorizations from order
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#identifier-authorization
         *
         * @param {object} order Order
         * @returns {Promise<object[]>} Authorizations
         */

    }, {
        key: 'getAuthorizations',
        value: function getAuthorizations(order) {
            var _this = this;

            return Promise.map(order.authorizations || [], function () {
                var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(url) {
                    var resp;
                    return _regenerator2.default.wrap(function _callee6$(_context6) {
                        while (1) {
                            switch (_context6.prev = _context6.next) {
                                case 0:
                                    _context6.next = 2;
                                    return _this.api.getAuthorization(url);

                                case 2:
                                    resp = _context6.sent;


                                    /* Add URL to response */
                                    resp.data.url = url;
                                    return _context6.abrupt('return', resp.data);

                                case 5:
                                case 'end':
                                    return _context6.stop();
                            }
                        }
                    }, _callee6, _this);
                }));

                return function (_x8) {
                    return _ref6.apply(this, arguments);
                };
            }());
        }

        /**
         * Deactivate identifier authorization
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#deactivating-an-authorization
         *
         * @param {object} authz Identifier authorization
         * @returns {Promise<object>} Authorization
         */

    }, {
        key: 'deactivateAuthorization',
        value: function () {
            var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(authz) {
                var data, resp;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                if (authz.url) {
                                    _context7.next = 2;
                                    break;
                                }

                                throw new Error('Unable to deactivate identifier authorization, URL not found');

                            case 2:
                                data = {
                                    status: 'deactivated'
                                };
                                _context7.next = 5;
                                return this.api.updateAuthorization(authz.url, data);

                            case 5:
                                resp = _context7.sent;
                                return _context7.abrupt('return', resp.data);

                            case 7:
                            case 'end':
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function deactivateAuthorization(_x9) {
                return _ref7.apply(this, arguments);
            }

            return deactivateAuthorization;
        }()

        /**
         * Get key authorization for ACME challenge
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#key-authorizations
         *
         * @param {object} challenge Challenge object returned by API
         * @returns {Promise<string>} Key authorization
         */

    }, {
        key: 'getChallengeKeyAuthorization',
        value: function () {
            var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(challenge) {
                var jwk, keysum, thumbprint, result, shasum;
                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                _context8.next = 2;
                                return this.http.getJwk();

                            case 2:
                                jwk = _context8.sent;
                                keysum = crypto.createHash('sha256').update((0, _stringify2.default)(jwk));
                                thumbprint = helper.b64escape(keysum.digest('base64'));
                                result = challenge.token + '.' + thumbprint;

                                if (!(challenge.type === 'http-01')) {
                                    _context8.next = 10;
                                    break;
                                }

                                return _context8.abrupt('return', result);

                            case 10:
                                if (!(challenge.type === 'dns-01')) {
                                    _context8.next = 13;
                                    break;
                                }

                                /* https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#dns-challenge */
                                shasum = crypto.createHash('sha256').update(result);
                                return _context8.abrupt('return', helper.b64escape(shasum.digest('base64')));

                            case 13:
                                throw new Error('Unable to produce key authorization, unknown challenge type: ' + challenge.type);

                            case 14:
                            case 'end':
                                return _context8.stop();
                        }
                    }
                }, _callee8, this);
            }));

            function getChallengeKeyAuthorization(_x10) {
                return _ref8.apply(this, arguments);
            }

            return getChallengeKeyAuthorization;
        }()

        /**
         * Verify that ACME challenge is satisfied
         *
         * @param {object} authz Identifier authorization
         * @param {object} challenge Authorization challenge
         * @returns {Promise}
         */

    }, {
        key: 'verifyChallenge',
        value: function () {
            var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(authz, challenge, authClientId) {
                var _this2 = this;

                var keyAuthorization, verifyFn;
                return _regenerator2.default.wrap(function _callee10$(_context10) {
                    while (1) {
                        switch (_context10.prev = _context10.next) {
                            case 0:
                                if (!(!authz.url || !challenge.url)) {
                                    _context10.next = 2;
                                    break;
                                }

                                throw new Error('Unable to verify ACME challenge, URL not found');

                            case 2:
                                if (!(typeof verify[challenge.type] === 'undefined')) {
                                    _context10.next = 4;
                                    break;
                                }

                                throw new Error('Unable to verify ACME challenge, unknown type: ' + challenge.type);

                            case 4:
                                _context10.next = 6;
                                return this.getChallengeKeyAuthorization(challenge);

                            case 6:
                                keyAuthorization = _context10.sent;

                                verifyFn = function () {
                                    var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9() {
                                        return _regenerator2.default.wrap(function _callee9$(_context9) {
                                            while (1) {
                                                switch (_context9.prev = _context9.next) {
                                                    case 0:
                                                        _context9.next = 2;
                                                        return verify[challenge.type](authz, challenge, keyAuthorization, '_acme-challenge.', authClientId);

                                                    case 2:
                                                    case 'end':
                                                        return _context9.stop();
                                                }
                                            }
                                        }, _callee9, _this2);
                                    }));

                                    return function verifyFn() {
                                        return _ref10.apply(this, arguments);
                                    };
                                }();

                                debug('Waiting for ACME challenge verification', this.backoffOpts);
                                return _context10.abrupt('return', helper.retry(verifyFn, this.backoffOpts, authClientId));

                            case 10:
                            case 'end':
                                return _context10.stop();
                        }
                    }
                }, _callee10, this);
            }));

            function verifyChallenge(_x11, _x12, _x13) {
                return _ref9.apply(this, arguments);
            }

            return verifyChallenge;
        }()

        /**
         * Notify provider that challenge has been completed
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
         *
         * @param {object} challenge Challenge object returned by API
         * @returns {Promise<object>} Challenge
         */

    }, {
        key: 'completeChallenge',
        value: function () {
            var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(challenge, authClientId) {
                var data, resp;
                return _regenerator2.default.wrap(function _callee11$(_context11) {
                    while (1) {
                        switch (_context11.prev = _context11.next) {
                            case 0:
                                _context11.next = 2;
                                return this.getChallengeKeyAuthorization(challenge);

                            case 2:
                                _context11.t0 = _context11.sent;
                                data = {
                                    keyAuthorization: _context11.t0
                                };
                                _context11.next = 6;
                                return this.api.completeChallenge(challenge.url, data);

                            case 6:
                                resp = _context11.sent;
                                return _context11.abrupt('return', resp.data);

                            case 8:
                            case 'end':
                                return _context11.stop();
                        }
                    }
                }, _callee11, this);
            }));

            function completeChallenge(_x14, _x15) {
                return _ref11.apply(this, arguments);
            }

            return completeChallenge;
        }()

        /**
         * Wait for ACME provider to verify status on a order, authorization or challenge
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
         *
         * @param {object} item An order, authorization or challenge object
         * @returns {Promise<object>} Valid order, authorization or challenge
         */

    }, {
        key: 'waitForValidStatus',
        value: function () {
            var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee13(item, authClientId) {
                var _this3 = this;

                var verifyFn;
                return _regenerator2.default.wrap(function _callee13$(_context13) {
                    while (1) {
                        switch (_context13.prev = _context13.next) {
                            case 0:
                                if (item.url) {
                                    _context13.next = 2;
                                    break;
                                }

                                throw new Error('Unable to verify status of item, URL not found');

                            case 2:
                                verifyFn = function () {
                                    var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(abort) {
                                        var resp;
                                        return _regenerator2.default.wrap(function _callee12$(_context12) {
                                            while (1) {
                                                switch (_context12.prev = _context12.next) {
                                                    case 0:
                                                        _context12.next = 2;
                                                        return _this3.api.get(item.url, [200]);

                                                    case 2:
                                                        resp = _context12.sent;


                                                        /* Verify status */
                                                        debug('Item has status: ' + resp.data.status);

                                                        if (!(resp.data.status === 'invalid')) {
                                                            _context12.next = 9;
                                                            break;
                                                        }

                                                        abort();
                                                        throw new Error(helper.formatResponseError(resp));

                                                    case 9:
                                                        if (!(resp.data.status === 'pending')) {
                                                            _context12.next = 13;
                                                            break;
                                                        }

                                                        throw new Error('Operation is pending');

                                                    case 13:
                                                        if (!(resp.data.status === 'valid')) {
                                                            _context12.next = 15;
                                                            break;
                                                        }

                                                        return _context12.abrupt('return', resp.data);

                                                    case 15:
                                                        throw new Error('Unexpected item status: ' + resp.data.status);

                                                    case 16:
                                                    case 'end':
                                                        return _context12.stop();
                                                }
                                            }
                                        }, _callee12, _this3);
                                    }));

                                    return function verifyFn(_x18) {
                                        return _ref13.apply(this, arguments);
                                    };
                                }();

                                debug('Waiting for valid status from: ' + item.url, this.backoffOpts);
                                return _context13.abrupt('return', helper.retry(verifyFn, this.backoffOpts));

                            case 5:
                            case 'end':
                                return _context13.stop();
                        }
                    }
                }, _callee13, this);
            }));

            function waitForValidStatus(_x16, _x17) {
                return _ref12.apply(this, arguments);
            }

            return waitForValidStatus;
        }()

        /**
         * Get certificate from ACME order
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate
         *
         * @param {object} order Order object
         * @returns {Promise<string>} Certificate
         */

    }, {
        key: 'getCertificate',
        value: function () {
            var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee14(order) {
                var resp;
                return _regenerator2.default.wrap(function _callee14$(_context14) {
                    while (1) {
                        switch (_context14.prev = _context14.next) {
                            case 0:
                                if (!(order.status !== 'valid')) {
                                    _context14.next = 4;
                                    break;
                                }

                                _context14.next = 3;
                                return this.waitForValidStatus(order);

                            case 3:
                                order = _context14.sent;

                            case 4:
                                if (order.certificate) {
                                    _context14.next = 6;
                                    break;
                                }

                                throw new Error('Unable to download certificate, URL not found');

                            case 6:
                                _context14.next = 8;
                                return this.http.request(order.certificate, 'get', { responseType: 'text' });

                            case 8:
                                resp = _context14.sent;
                                return _context14.abrupt('return', resp.data);

                            case 10:
                            case 'end':
                                return _context14.stop();
                        }
                    }
                }, _callee14, this);
            }));

            function getCertificate(_x19) {
                return _ref14.apply(this, arguments);
            }

            return getCertificate;
        }()

        /**
         * Revoke certificate
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
         *
         * @param {buffer|string} cert PEM encoded certificate
         * @param {object} [data] Additional request data
         * @returns {Promise}
         */

    }, {
        key: 'revokeCertificate',
        value: function () {
            var _ref15 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee15(cert) {
                var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                var body, resp;
                return _regenerator2.default.wrap(function _callee15$(_context15) {
                    while (1) {
                        switch (_context15.prev = _context15.next) {
                            case 0:
                                body = helper.getPemBody(cert);

                                data.certificate = helper.b64escape(body);

                                _context15.next = 4;
                                return this.api.revokeCert(data);

                            case 4:
                                resp = _context15.sent;
                                return _context15.abrupt('return', resp.data);

                            case 6:
                            case 'end':
                                return _context15.stop();
                        }
                    }
                }, _callee15, this);
            }));

            function revokeCertificate(_x21) {
                return _ref15.apply(this, arguments);
            }

            return revokeCertificate;
        }()

        /**
         * Auto mode
         *
         * @param {object} opts
         * @param {buffer|string} opts.csr Certificate Signing Request
         * @param {function} opts.challengeCreateFn Function returning Promise triggered before completing ACME challenge
         * @param {function} opts.challengeRemoveFn Function returning Promise triggered after completing ACME challenge
         * @param {string} [opts.email] Account email address
         * @param {boolean} [opts.termsOfServiceAgreed] Agree to Terms of Service, default: `false`
         * @param {string[]} [opts.challengePriority] Array defining challenge type priority, default: `['http-01', 'dns-01']`
         * @returns {Promise<string>} Certificate
         */

    }, {
        key: 'auto',
        value: function auto(opts) {
            return _auto(this, opts);
        }
    }]);
    return AcmeClient;
}();

/* Export client */


module.exports = AcmeClient;