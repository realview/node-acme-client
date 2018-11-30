'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * Execute Certificate Signing Request generation
 *
 * @private
 * @param {object} opts CSR options
 * @param {string} csrConfig CSR configuration file
 * @param {buffer} key CSR private key
 * @returns {Promise<buffer>} CSR
 */

var generateCsr = function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(opts, csrConfig, key) {
        var tempConfigFilePath, tempKeyFilePath, result;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        tempConfigFilePath = void 0;

                        /* Write key to disk */

                        tempKeyFilePath = tempfile();
                        _context5.next = 4;
                        return fs.writeFileAsync(tempKeyFilePath, key);

                    case 4:
                        opts.key = tempKeyFilePath;

                        /* Write config to disk */

                        if (!csrConfig) {
                            _context5.next = 10;
                            break;
                        }

                        tempConfigFilePath = tempfile();
                        _context5.next = 9;
                        return fs.writeFileAsync(tempConfigFilePath, csrConfig);

                    case 9:
                        opts.config = tempConfigFilePath;

                    case 10:
                        _context5.next = 12;
                        return openssl('req', opts);

                    case 12:
                        result = _context5.sent;
                        _context5.next = 15;
                        return fs.unlinkAsync(tempKeyFilePath);

                    case 15:
                        if (!tempConfigFilePath) {
                            _context5.next = 18;
                            break;
                        }

                        _context5.next = 18;
                        return fs.unlinkAsync(tempConfigFilePath);

                    case 18:
                        return _context5.abrupt('return', result);

                    case 19:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, this);
    }));

    return function generateCsr(_x6, _x7, _x8) {
        return _ref5.apply(this, arguments);
    };
}();

/**
 * Create Certificate Signing Request subject
 *
 * @private
 * @param {object} opts CSR subject options
 * @returns {string} CSR subject
 */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * OpenSSL crypto engine
 *
 * @namespace openssl
 */

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var net = require('net');
var tempfile = require('tempfile');
var openssl = Promise.promisify(require('openssl-wrapper').exec);

function hexpad(str) {
    return str.length % 2 === 1 ? '0' + str : str;
}

/**
 * Parse domain names from a certificate or CSR
 *
 * @private
 * @param {string} cert Certificate or CSR
 * @returns {object} {commonName, altNames}
 */

function parseDomains(cert) {
    var altNames = [];
    var commonName = null;
    var commonNameMatch = cert.match(/Subject:.*? CN\s?=\s?([^\s,;/]+)/);
    var altNamesMatch = cert.match(/X509v3 Subject Alternative Name:\s?\n\s*([^\n]+)\n/);

    /* Subject common name */
    if (commonNameMatch) {
        commonName = commonNameMatch[1];
    }

    /* Alternative names */
    if (altNamesMatch) {
        altNamesMatch[1].split(/,\s*/).forEach(function (altName) {
            if (altName.match(/^DNS:/)) {
                altNames.push(altName.replace(/^DNS:/, ''));
            }
        });
    }

    return {
        commonName: commonName,
        altNames: altNames
    };
}

/**
 * Get OpenSSL action from buffer
 *
 * @private
 * @param {buffer} key Private key, certificate or CSR
 * @returns {string} OpenSSL action
 */

function getAction(key) {
    var keyString = key.toString();

    if (keyString.match(/CERTIFICATE\sREQUEST-{5}$/m)) {
        return 'req';
    } else if (keyString.match(/(PUBLIC|PRIVATE)\sKEY-{5}$/m)) {
        return 'rsa';
    }

    return 'x509';
}

/**
 * Check if key is public
 *
 * @private
 * @param {buffer} key
 * @returns {boolean} True if key is public
 */

function isPublic(key) {
    return !!key.toString().match(/PUBLIC\sKEY-{5}$/m);
}

/**
 * Generate a private RSA key
 *
 * @param {number} [size] Size of the key, default: `2048`
 * @returns {Promise<buffer>} Private RSA key
 */

function createPrivateKey() {
    var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2048;

    var opts = {};
    opts[size] = false;

    return openssl('genrsa', opts);
}

exports.createPrivateKey = createPrivateKey;

/**
 * Generate a public RSA key
 *
 * @param {buffer|string} key PEM encoded private key
 * @returns {Promise<buffer>} Public RSA key
 */

exports.createPublicKey = function (key) {
    if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    var action = getAction(key);
    var opts = { pubout: true };

    return openssl(action, key, opts);
};

/**
 * Get modulus
 *
 * @param {buffer|string} input PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} Modulus
 */

exports.getModulus = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(input) {
        var action, opts, buf, modulusMatch;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!Buffer.isBuffer(input)) {
                            input = Buffer.from(input);
                        }

                        action = getAction(input);
                        opts = { noout: true, modulus: true };


                        if (isPublic(input)) {
                            opts.pubin = true;
                        }

                        _context.next = 6;
                        return openssl(action, input, opts);

                    case 6:
                        buf = _context.sent;
                        modulusMatch = buf.toString().match(/^Modulus=([A-Fa-f0-9]+)$/m);

                        if (modulusMatch) {
                            _context.next = 10;
                            break;
                        }

                        throw new Error('No modulus found');

                    case 10:
                        return _context.abrupt('return', Buffer.from(modulusMatch[1], 'hex'));

                    case 11:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x2) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Get public exponent
 *
 * @param {buffer|string} input PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} Exponent
 */

exports.getPublicExponent = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(input) {
        var action, opts, buf, exponentMatch;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!Buffer.isBuffer(input)) {
                            input = Buffer.from(input);
                        }

                        action = getAction(input);
                        opts = { noout: true, text: true };


                        if (isPublic(input)) {
                            opts.pubin = true;
                        }

                        _context2.next = 6;
                        return openssl(action, input, opts);

                    case 6:
                        buf = _context2.sent;
                        exponentMatch = buf.toString().match(/xponent:.*\(0x(\d+)\)/);

                        if (exponentMatch) {
                            _context2.next = 10;
                            break;
                        }

                        throw new Error('No public exponent found');

                    case 10:
                        return _context2.abrupt('return', Buffer.from(hexpad(exponentMatch[1]), 'hex'));

                    case 11:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function (_x3) {
        return _ref2.apply(this, arguments);
    };
}();

/**
 * Read domains from a Certificate Signing Request
 *
 * @param {buffer|string} csr PEM encoded Certificate Signing Request
 * @returns {Promise<object>} {commonName, altNames}
 */

exports.readCsrDomains = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(csr) {
        var opts, buf;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        if (!Buffer.isBuffer(csr)) {
                            csr = Buffer.from(csr);
                        }

                        opts = { noout: true, text: true };
                        _context3.next = 4;
                        return openssl('req', csr, opts);

                    case 4:
                        buf = _context3.sent;
                        return _context3.abrupt('return', parseDomains(buf.toString()));

                    case 6:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function (_x4) {
        return _ref3.apply(this, arguments);
    };
}();

/**
 * Read information from a certificate
 *
 * @param {buffer|string} cert PEM encoded certificate
 * @returns {Promise<object>} Certificate info
 */

exports.readCertificateInfo = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(cert) {
        var opts, buf, bufString, result, notBeforeMatch, notAfterMatch;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!Buffer.isBuffer(cert)) {
                            cert = Buffer.from(cert);
                        }

                        opts = { noout: true, text: true };
                        _context4.next = 4;
                        return openssl('x509', cert, opts);

                    case 4:
                        buf = _context4.sent;
                        bufString = buf.toString();
                        result = {
                            domains: parseDomains(bufString),
                            notBefore: null,
                            notAfter: null
                        };
                        notBeforeMatch = bufString.match(/Not\sBefore\s?:\s+([^\n]*)\n/);
                        notAfterMatch = bufString.match(/Not\sAfter\s?:\s+([^\n]*)\n/);


                        if (notBeforeMatch) {
                            result.notBefore = new Date(notBeforeMatch[1]);
                        }

                        if (notAfterMatch) {
                            result.notAfter = new Date(notAfterMatch[1]);
                        }

                        return _context4.abrupt('return', result);

                    case 12:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function (_x5) {
        return _ref4.apply(this, arguments);
    };
}();function createCsrSubject(opts) {
    var data = {
        C: opts.country,
        ST: opts.state,
        L: opts.locality,
        O: opts.organization,
        OU: opts.organizationUnit,
        CN: opts.commonName || 'localhost',
        emailAddress: opts.emailAddress
    };

    return (0, _entries2.default)(data).map(function (_ref6) {
        var _ref7 = (0, _slicedToArray3.default)(_ref6, 2),
            key = _ref7[0],
            value = _ref7[1];

        value = (value || '').replace(/[^\w .*,@'-]+/g, ' ').trim();
        return value ? '/' + key + '=' + value : '';
    }).join('');
}

/**
 * Create a Certificate Signing Request
 *
 * @param {object} data
 * @param {number} [data.keySize] Size of newly created private key, default: `2048`
 * @param {string} [data.commonName] default: `localhost`
 * @param {array} [data.altNames] default: `[]`
 * @param {string} [data.country]
 * @param {string} [data.state]
 * @param {string} [data.locality]
 * @param {string} [data.organization]
 * @param {string} [data.organizationUnit]
 * @param {string} [data.emailAddress]
 * @param {buffer|string} [key] CSR private key
 * @returns {Promise<buffer[]>} [privateKey, certificateSigningRequest]
 */

exports.createCsr = function () {
    var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(data) {
        var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var opts, csrConfig, altNames, csr;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        if (key) {
                            _context6.next = 6;
                            break;
                        }

                        _context6.next = 3;
                        return createPrivateKey(data.keySize);

                    case 3:
                        key = _context6.sent;
                        _context6.next = 7;
                        break;

                    case 6:
                        if (!Buffer.isBuffer(key)) {
                            key = Buffer.from(key);
                        }

                    case 7:
                        /* Create CSR options */
                        opts = {
                            new: true,
                            sha256: true,
                            subj: createCsrSubject(data)
                        };

                        /* Create CSR config for SAN CSR */

                        csrConfig = null;


                        if (data.altNames && data.altNames.length) {
                            opts.extensions = 'v3_req';

                            altNames = (0, _entries2.default)(data.altNames).map(function (_ref9) {
                                var _ref10 = (0, _slicedToArray3.default)(_ref9, 2),
                                    k = _ref10[0],
                                    v = _ref10[1];

                                var i = parseInt(k, 10) + 1;
                                var prefix = net.isIP(v) ? 'IP' : 'DNS';
                                return prefix + '.' + i + '=' + v;
                            });


                            csrConfig = ['[req]', 'req_extensions = v3_req', 'distinguished_name = req_distinguished_name', '[v3_req]', 'subjectAltName = @alt_names', '[alt_names]', altNames.join('\n'), '[req_distinguished_name]', 'commonName = Common Name', 'commonName_max = 64'].join('\n');
                        }

                        /* Create CSR */
                        _context6.next = 12;
                        return generateCsr(opts, csrConfig, key);

                    case 12:
                        csr = _context6.sent;
                        return _context6.abrupt('return', [key, csr]);

                    case 14:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, _callee6, this);
    }));

    return function (_x10) {
        return _ref8.apply(this, arguments);
    };
}();

/**
 * Convert PEM to DER encoding
 * DEPRECATED - DO NOT USE
 *
 * @param {buffer|string} key PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} DER
 */

exports.pem2der = function (key) {
    if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    var action = getAction(key);
    var opts = { outform: 'der' };

    if (isPublic(key)) {
        opts.pubin = true;
    }

    return openssl(action, key, opts);
};

/**
 * Convert DER to PEM encoding
 * DEPRECATED - DO NOT USE
 *
 * @param {string} action Output action (x509, rsa, req)
 * @param {buffer|string} key DER encoded private key, certificate or CSR
 * @param {boolean} [pubIn] Result should be a public key, default: `false`
 * @returns {Promise<buffer>} PEM
 */

exports.der2pem = function (action, key) {
    var pubIn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    var opts = { inform: 'der' };

    if (pubIn) {
        opts.pubin = true;
    }

    return openssl(action, key, opts);
};