'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

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
 * ACME HTTP client
 */

var crypto = require('crypto');
var os = require('os');
var axios = require('axios');
var debug = require('debug')('acme-client');
var helper = require('./helper');
var forge = require('./crypto/forge');
var pkg = require('./../package.json');

var userAgentString = 'node-' + pkg.name + '/' + pkg.version + ' (' + os.type() + ' ' + os.release() + ')';

/**
 * ACME HTTP client
 *
 * @class
 * @param {string} directoryUrl ACME directory URL
 * @param {buffer} accountKey PEM encoded account private key
 */

var HttpClient = function () {
    function HttpClient(directoryUrl, accountKey) {
        (0, _classCallCheck3.default)(this, HttpClient);

        this.directoryUrl = directoryUrl;
        this.accountKey = accountKey;

        this.directory = null;
        this.jwk = null;
    }

    /**
     * HTTP request
     *
     * @param {string} url HTTP URL
     * @param {string} method HTTP method
     * @param {object} [opts] Request options
     * @returns {Promise<object>} HTTP response
     */

    (0, _createClass3.default)(HttpClient, [{
        key: 'request',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(url, method) {
                var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
                var resp;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                opts.url = url;
                                opts.method = method;
                                opts.validateStatus = null;

                                if (typeof opts.headers === 'undefined') {
                                    opts.headers = {};
                                }

                                opts.headers['Content-Type'] = 'application/jose+json';
                                opts.headers['User-Agent'] = userAgentString;

                                debug('HTTP request: ' + method + ' ' + url);
                                _context.next = 9;
                                return axios.request(opts);

                            case 9:
                                resp = _context.sent;


                                debug('RESP ' + resp.status + ' ' + method + ' ' + url);
                                return _context.abrupt('return', resp);

                            case 12:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function request(_x2, _x3) {
                return _ref.apply(this, arguments);
            }

            return request;
        }()

        /**
         * Ensure provider directory exists
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#directory
         *
         * @returns {Promise}
         */

    }, {
        key: 'getDirectory',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                var resp;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (this.directory) {
                                    _context2.next = 5;
                                    break;
                                }

                                _context2.next = 3;
                                return this.request(this.directoryUrl, 'get');

                            case 3:
                                resp = _context2.sent;

                                this.directory = resp.data;

                            case 5:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function getDirectory() {
                return _ref2.apply(this, arguments);
            }

            return getDirectory;
        }()

        /**
         * Get JSON Web Key
         *
         * @returns {Promise<object>} {e, kty, n}
         */

    }, {
        key: 'getJwk',
        value: function () {
            var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
                var exponent, modulus;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (!this.jwk) {
                                    _context3.next = 2;
                                    break;
                                }

                                return _context3.abrupt('return', this.jwk);

                            case 2:
                                _context3.next = 4;
                                return forge.getPublicExponent(this.accountKey);

                            case 4:
                                exponent = _context3.sent;
                                _context3.next = 7;
                                return forge.getModulus(this.accountKey);

                            case 7:
                                modulus = _context3.sent;


                                this.jwk = {
                                    e: helper.b64encode(exponent),
                                    kty: 'RSA',
                                    n: helper.b64encode(modulus)
                                };

                                return _context3.abrupt('return', this.jwk);

                            case 10:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function getJwk() {
                return _ref3.apply(this, arguments);
            }

            return getJwk;
        }()

        /**
         * Get nonce from directory API endpoint
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#getting-a-nonce
         *
         * @returns {Promise<string>} nonce
         */

    }, {
        key: 'getNonce',
        value: function () {
            var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
                var url, resp;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return this.getResourceUrl('newNonce');

                            case 2:
                                url = _context4.sent;
                                _context4.next = 5;
                                return this.request(url, 'head');

                            case 5:
                                resp = _context4.sent;

                                if (resp.headers['replay-nonce']) {
                                    _context4.next = 8;
                                    break;
                                }

                                throw new Error('Failed to get nonce from ACME provider');

                            case 8:
                                return _context4.abrupt('return', resp.headers['replay-nonce']);

                            case 9:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function getNonce() {
                return _ref4.apply(this, arguments);
            }

            return getNonce;
        }()

        /**
         * Get URL for a directory resource
         *
         * @param {string} resource API resource name
         * @returns {Promise<string>} URL
         */

    }, {
        key: 'getResourceUrl',
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(resource) {
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                _context5.next = 2;
                                return this.getDirectory();

                            case 2:
                                if (this.directory[resource]) {
                                    _context5.next = 4;
                                    break;
                                }

                                throw new Error('Could not resolve URL for API resource: "' + resource + '"');

                            case 4:
                                return _context5.abrupt('return', this.directory[resource]);

                            case 5:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function getResourceUrl(_x4) {
                return _ref5.apply(this, arguments);
            }

            return getResourceUrl;
        }()

        /**
         * Create signed HTTP request body
         *
         * @param {string} url Request URL
         * @param {object} payload Request payload
         * @param {string} [nonce] Request nonce
         * @returns {Promise<object>} Signed HTTP request body
         */

    }, {
        key: 'createSignedBody',
        value: function () {
            var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(url, payload) {
                var nonce = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
                var kid = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
                var header, result, signer;
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                /* JWS header */
                                header = {
                                    url: url,
                                    alg: 'RS256'
                                };


                                if (nonce) {
                                    debug('Using nonce: ' + nonce);
                                    header.nonce = nonce;
                                }

                                /* KID or JWK */

                                if (!kid) {
                                    _context6.next = 6;
                                    break;
                                }

                                header.kid = kid;
                                _context6.next = 9;
                                break;

                            case 6:
                                _context6.next = 8;
                                return this.getJwk();

                            case 8:
                                header.jwk = _context6.sent;

                            case 9:

                                /* Request payload */
                                result = {
                                    payload: helper.b64encode((0, _stringify2.default)(payload)),
                                    protected: helper.b64encode((0, _stringify2.default)(header))
                                };

                                /* Signature */

                                signer = crypto.createSign('RSA-SHA256').update(result.protected + '.' + result.payload, 'utf8');

                                result.signature = helper.b64escape(signer.sign(this.accountKey, 'base64'));

                                return _context6.abrupt('return', result);

                            case 13:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function createSignedBody(_x7, _x8) {
                return _ref6.apply(this, arguments);
            }

            return createSignedBody;
        }()

        /**
         * Signed HTTP request
         *
         * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#request-authentication
         *
         * @param {string} url Request URL
         * @param {string} method HTTP method
         * @param {object} payload Request payload
         * @param {string} [kid] KID
         * @returns {Promise<object>} HTTP response
         */

    }, {
        key: 'signedRequest',
        value: function () {
            var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(url, method, payload) {
                var kid = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
                var nonce, data;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                _context7.next = 2;
                                return this.getNonce();

                            case 2:
                                nonce = _context7.sent;
                                _context7.next = 5;
                                return this.createSignedBody(url, payload, nonce, kid);

                            case 5:
                                data = _context7.sent;
                                return _context7.abrupt('return', this.request(url, method, { data: data }));

                            case 7:
                            case 'end':
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function signedRequest(_x10, _x11, _x12) {
                return _ref7.apply(this, arguments);
            }

            return signedRequest;
        }()
    }]);
    return HttpClient;
}();

/* Export client */


module.exports = HttpClient;