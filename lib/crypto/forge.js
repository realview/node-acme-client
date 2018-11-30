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
 * Generate a private RSA key
 *
 * @param {number} [size] Size of the key, default: `2048`
 * @returns {Promise<buffer>} Private RSA key
 */

var createPrivateKey = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2048;
        var pemKey, result, keyPair;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        pemKey = void 0;

                        /* Native implementation */

                        if (!nativeGenKeyPair) {
                            _context.next = 8;
                            break;
                        }

                        _context.next = 4;
                        return nativeGenKeyPair('rsa', {
                            modulusLength: size,
                            publicKeyEncoding: { type: 'spki', format: 'pem' },
                            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
                        });

                    case 4:
                        result = _context.sent;


                        pemKey = result[1];
                        _context.next = 12;
                        break;

                    case 8:
                        _context.next = 10;
                        return forgeGenKeyPair({ bits: size });

                    case 10:
                        keyPair = _context.sent;

                        pemKey = forge.pki.privateKeyToPem(keyPair.privateKey);

                    case 12:
                        return _context.abrupt('return', Buffer.from(pemKey));

                    case 13:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function createPrivateKey() {
        return _ref.apply(this, arguments);
    };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * node-forge crypto engine
 *
 * @namespace forge
 */

var crypto = require('crypto');
var net = require('net');
var Promise = require('bluebird');
var forge = require('node-forge');

var nativeGenKeyPair = void 0;
var forgeGenKeyPair = Promise.promisify(forge.pki.rsa.generateKeyPair);

if (typeof crypto.generateKeyPair === 'function') {
    nativeGenKeyPair = Promise.promisify(crypto.generateKeyPair, { multiArgs: true });
}

/**
 * Attempt to parse forge object from PEM encoded string
 *
 * @private
 * @param {string} input PEM string
 * @return {object}
 */

function forgeObjectFromPem(input) {
    var msg = forge.pem.decode(input)[0];
    var key = void 0;

    switch (msg.type) {
        case 'PRIVATE KEY':
        case 'RSA PRIVATE KEY':
            key = forge.pki.privateKeyFromPem(input);
            break;

        case 'PUBLIC KEY':
        case 'RSA PUBLIC KEY':
            key = forge.pki.publicKeyFromPem(input);
            break;

        case 'CERTIFICATE':
        case 'X509 CERTIFICATE':
        case 'TRUSTED CERTIFICATE':
            key = forge.pki.certificateFromPem(input).publicKey;
            break;

        case 'CERTIFICATE REQUEST':
            key = forge.pki.certificationRequestFromPem(input).publicKey;
            break;

        default:
            throw new Error('Unable to detect forge message type');
    }

    return key;
}

/**
 * Parse domain names from a certificate or CSR
 *
 * @private
 * @param {object} obj Forge certificate or CSR
 * @returns {object} {commonName, altNames}
 */

function parseDomains(obj) {
    var commonName = null;
    var altNames = [];
    var altNamesDict = [];

    var commonNameObject = (obj.subject.attributes || []).find(function (a) {
        return a.name === 'commonName';
    });
    var rootAltNames = (obj.extensions || []).find(function (e) {
        return 'altNames' in e;
    });
    var rootExtensions = (obj.attributes || []).find(function (a) {
        return 'extensions' in a;
    });

    if (rootAltNames && rootAltNames.altNames && rootAltNames.altNames.length) {
        altNamesDict = rootAltNames.altNames;
    } else if (rootExtensions && rootExtensions.extensions && rootExtensions.extensions.length) {
        var extAltNames = rootExtensions.extensions.find(function (e) {
            return 'altNames' in e;
        });

        if (extAltNames && extAltNames.altNames && extAltNames.altNames.length) {
            altNamesDict = extAltNames.altNames;
        }
    }

    if (commonNameObject) {
        commonName = commonNameObject.value;
    }

    if (altNamesDict) {
        altNames = altNamesDict.map(function (a) {
            return a.value;
        });
    }

    return {
        commonName: commonName,
        altNames: altNames
    };
}

exports.createPrivateKey = createPrivateKey;

/**
 * Generate a public RSA key
 *
 * @param {buffer|string} key PEM encoded private key
 * @returns {Promise<buffer>} Public RSA key
 */

exports.createPublicKey = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(key) {
        var privateKey, publicKey, pemKey;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        privateKey = forge.pki.privateKeyFromPem(key);
                        publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
                        pemKey = forge.pki.publicKeyToPem(publicKey);
                        return _context2.abrupt('return', Buffer.from(pemKey));

                    case 4:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function (_x2) {
        return _ref2.apply(this, arguments);
    };
}();

/**
 * Get modulus
 *
 * @param {buffer|string} input PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} Modulus
 */

exports.getModulus = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(input) {
        var obj;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        if (!Buffer.isBuffer(input)) {
                            input = Buffer.from(input);
                        }

                        obj = forgeObjectFromPem(input);
                        return _context3.abrupt('return', Buffer.from(forge.util.hexToBytes(obj.n.toString(16)), 'binary'));

                    case 3:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function (_x3) {
        return _ref3.apply(this, arguments);
    };
}();

/**
 * Get public exponent
 *
 * @param {buffer|string} input PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} Exponent
 */

exports.getPublicExponent = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(input) {
        var obj;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!Buffer.isBuffer(input)) {
                            input = Buffer.from(input);
                        }

                        obj = forgeObjectFromPem(input);
                        return _context4.abrupt('return', Buffer.from(forge.util.hexToBytes(obj.e.toString(16)), 'binary'));

                    case 3:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function (_x4) {
        return _ref4.apply(this, arguments);
    };
}();

/**
 * Read domains from a Certificate Signing Request
 *
 * @param {buffer|string} csr PEM encoded Certificate Signing Request
 * @returns {Promise<object>} {commonName, altNames}
 */

exports.readCsrDomains = function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(csr) {
        var obj;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        if (!Buffer.isBuffer(csr)) {
                            csr = Buffer.from(csr);
                        }

                        obj = forge.pki.certificationRequestFromPem(csr);
                        return _context5.abrupt('return', parseDomains(obj));

                    case 3:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, this);
    }));

    return function (_x5) {
        return _ref5.apply(this, arguments);
    };
}();

/**
 * Read information from a certificate
 *
 * @param {buffer|string} cert PEM encoded certificate
 * @returns {Promise<object>} Certificate info
 */

exports.readCertificateInfo = function () {
    var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(cert) {
        var obj;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        if (!Buffer.isBuffer(cert)) {
                            cert = Buffer.from(cert);
                        }

                        obj = forge.pki.certificateFromPem(cert);
                        return _context6.abrupt('return', {
                            domains: parseDomains(obj),
                            notAfter: obj.validity.notAfter,
                            notBefore: obj.validity.notBefore
                        });

                    case 3:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, _callee6, this);
    }));

    return function (_x6) {
        return _ref6.apply(this, arguments);
    };
}();

/**
 * Create array of short names and values for Certificate Signing Request subjects
 *
 * @private
 * @param {object} subjectObj Key-value of short names and values
 * @returns {object[]} Certificate Signing Request subject array
 */

function createCsrSubject(subjectObj) {
    return (0, _entries2.default)(subjectObj).reduce(function (result, _ref7) {
        var _ref8 = (0, _slicedToArray3.default)(_ref7, 2),
            shortName = _ref8[0],
            value = _ref8[1];

        if (value) {
            result.push({ shortName: shortName, value: value });
        }

        return result;
    }, []);
}

/**
 * Create array of alt names for Certificate Signing Requests
 * Note: https://github.com/digitalbazaar/forge/blob/dfdde475677a8a25c851e33e8f81dca60d90cfb9/lib/x509.js#L1444-L1454
 *
 * @private
 * @param {string[]} altNames Alt names
 * @returns {object[]} Certificate Signing Request alt names array
 */

function formatCsrAltNames(altNames) {
    return altNames.map(function (value) {
        var type = net.isIP(value) ? 7 : 2;
        return { type: type, value: value };
    });
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
    var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(data) {
        var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var csr, privateKey, publicKey, subject, pemCsr;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
            while (1) {
                switch (_context7.prev = _context7.next) {
                    case 0:
                        if (key) {
                            _context7.next = 6;
                            break;
                        }

                        _context7.next = 3;
                        return createPrivateKey(data.keySize);

                    case 3:
                        key = _context7.sent;
                        _context7.next = 7;
                        break;

                    case 6:
                        if (!Buffer.isBuffer(key)) {
                            key = Buffer.from(key);
                        }

                    case 7:
                        csr = forge.pki.createCertificationRequest();

                        /* Public key */

                        privateKey = forge.pki.privateKeyFromPem(key);
                        publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);

                        csr.publicKey = publicKey;

                        /* Subject */
                        subject = createCsrSubject({
                            CN: data.commonName || 'localhost',
                            C: data.country,
                            ST: data.state,
                            L: data.locality,
                            O: data.organization,
                            OU: data.organizationUnit,
                            E: data.emailAddress
                        });


                        csr.setSubject(subject);

                        /* SAN extension */
                        if (data.altNames && data.altNames.length) {
                            csr.setAttributes([{
                                name: 'extensionRequest',
                                extensions: [{
                                    name: 'subjectAltName',
                                    altNames: formatCsrAltNames(data.altNames)
                                }]
                            }]);
                        }

                        /* Sign CSR */
                        csr.sign(privateKey);

                        /* Done */
                        pemCsr = forge.pki.certificationRequestToPem(csr);
                        return _context7.abrupt('return', [key, Buffer.from(pemCsr)]);

                    case 17:
                    case 'end':
                        return _context7.stop();
                }
            }
        }, _callee7, this);
    }));

    return function (_x8) {
        return _ref9.apply(this, arguments);
    };
}();