'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ACME API client
 */

var helper = require('./helper');

/**
 * AcmeApi
 *
 * @class
 * @param {HttpClient} httpClient
 */

var AcmeApi = function () {
    function AcmeApi(httpClient) {
        var accountUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        (0, _classCallCheck3.default)(this, AcmeApi);

        this.http = httpClient;
        this.accountUrl = accountUrl;
    }

    /**
     * Get account URL
     *
     * @private
     * @returns {string} Account URL
     */

    (0, _createClass3.default)(AcmeApi, [{
        key: 'getAccountUrl',
        value: function getAccountUrl() {
            if (!this.accountUrl) {
                throw new Error('No account URL found, register account first');
            }

            return this.accountUrl;
        }

        /**
         * ACME API HTTP request
         *
         * @private
         * @param {object} payload Request payload
         * @param {string} resource Request resource
         * @param {string} method HTTP method
         * @param {array} [validStatusCodes] Array of valid HTTP response status codes, default: `[]`
         * @param {boolean} [jwsKid] Use KID in JWS header, default: `true`
         * @param {string} [url] HTTP request url
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'apiRequest',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(payload, resource, method) {
                var validStatusCodes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
                var jwsKid = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
                var url = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
                var resp, kid;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (url) {
                                    _context.next = 4;
                                    break;
                                }

                                _context.next = 3;
                                return this.http.getResourceUrl(resource);

                            case 3:
                                url = _context.sent;

                            case 4:
                                resp = void 0;
                                kid = jwsKid ? this.getAccountUrl() : null;

                                if (!(method.toLowerCase() === 'get')) {
                                    _context.next = 12;
                                    break;
                                }

                                _context.next = 9;
                                return this.http.request(url, method);

                            case 9:
                                resp = _context.sent;
                                _context.next = 15;
                                break;

                            case 12:
                                _context.next = 14;
                                return this.http.signedRequest(url, method, payload, kid);

                            case 14:
                                resp = _context.sent;

                            case 15:
                                if (!(validStatusCodes.length && validStatusCodes.indexOf(resp.status) === -1)) {
                                    _context.next = 17;
                                    break;
                                }

                                throw new Error(helper.formatResponseError(resp));

                            case 17:
                                return _context.abrupt('return', resp);

                            case 18:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function apiRequest(_x5, _x6, _x7) {
                return _ref.apply(this, arguments);
            }

            return apiRequest;
        }()

        /**
         * HTTP GET helper
         *
         * @param {string} url HTTP request URL
         * @param {array} [validStatusCodes] Array of valid HTTP response status codes, default: `[]`
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'get',
        value: function get(url) {
            var validStatusCodes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            return this.apiRequest(null, null, 'get', validStatusCodes, false, url);
        }

        /**
         * Get Terms of Service URL
         *
         * @returns {Promise<string>} ToS URL
         */

    }, {
        key: 'getTermsOfServiceUrl',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                var meta;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this.http.getResourceUrl('meta');

                            case 2:
                                meta = _context2.sent;

                                if (meta.termsOfService) {
                                    _context2.next = 5;
                                    break;
                                }

                                throw new Error('Unable to locate Terms of Service URL');

                            case 5:
                                return _context2.abrupt('return', meta.termsOfService);

                            case 6:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function getTermsOfServiceUrl() {
                return _ref2.apply(this, arguments);
            }

            return getTermsOfServiceUrl;
        }()

        /**
         * Create new account
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
         *
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'createAccount',
        value: function () {
            var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(data) {
                var resp;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.next = 2;
                                return this.apiRequest(data, 'newAccount', 'post', [200, 201], false);

                            case 2:
                                resp = _context3.sent;


                                /* Set account URL */
                                if (resp.headers.location) {
                                    this.accountUrl = resp.headers.location;
                                }

                                return _context3.abrupt('return', resp);

                            case 5:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function createAccount(_x9) {
                return _ref3.apply(this, arguments);
            }

            return createAccount;
        }()

        /**
         * Update account
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
         *
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'updateAccount',
        value: function updateAccount(data) {
            return this.apiRequest(data, null, 'post', [200, 202], true, this.getAccountUrl());
        }

        /**
         * Update account key
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
         *
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'updateAccountKey',
        value: function updateAccountKey(data) {
            return this.apiRequest(data, 'keyChange', 'post', [200]);
        }

        /**
         * Create new order
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
         *
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'createOrder',
        value: function createOrder(data) {
            return this.apiRequest(data, 'newOrder', 'post', [201]);
        }

        /**
         * Finalize order
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
         *
         * @param {string} url Finalization URL
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'finalizeOrder',
        value: function finalizeOrder(url, data) {
            return this.apiRequest(data, null, 'post', [200], true, url);
        }

        /**
         * Get identifier authorization
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#identifier-authorization
         *
         * @param {string} url Authorization URL
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'getAuthorization',
        value: function getAuthorization(url) {
            return this.get(url, [200]);
        }

        /**
         * Update identifier authorization
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#deactivating-an-authorization
         *
         * @param {string} url Authorization URL
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'updateAuthorization',
        value: function updateAuthorization(url, data) {
            return this.apiRequest(data, null, 'post', [200], true, url);
        }

        /**
         * Complete challenge
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
         *
         * @param {string} url Challenge URL
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'completeChallenge',
        value: function completeChallenge(url, data) {
            return this.apiRequest(data, null, 'post', [200], true, url);
        }

        /**
         * Revoke certificate
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
         *
         * @param {object} data Request payload
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'revokeCert',
        value: function revokeCert(data) {
            return this.apiRequest(data, 'revokeCert', 'post', [200]);
        }
    }]);
    return AcmeApi;
}();

/* Export API */


module.exports = AcmeApi;