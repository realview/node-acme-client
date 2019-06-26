/**
 * ACME challenge verification
 */

const Promise = require('bluebird');
const dns = Promise.promisifyAll(require('dns'));

dns.setServers(['8.8.8.8']);
const axios = require('axios');
const debug = require('debug')('acme-client');
const eventLog = require('./eventlog');

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

async function verifyHttpChallenge(authz, challenge, keyAuthorization, suffix = `/.well-known/acme-challenge/${challenge.token}`) {
    debug(`Sending HTTP query to ${authz.identifier.value}, suffix: ${suffix}`);
    const challengeUrl = `http://${authz.identifier.value}${suffix}`;

    const resp = await axios.get(challengeUrl);

    debug(`Query successful, HTTP status code: ${resp.status}`);

    if (!resp.data || (resp.data !== keyAuthorization)) {
        throw new Error(`Authorization not found in HTTP response from ${authz.identifier.value}`);
    }

    debug(`Key authorization match for ${challenge.type}/${authz.identifier.value}, ACME challenge verified`);
    return true;
}


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

async function verifyDnsChallenge(authz, challenge, keyAuthorization, prefix = '_acme-challenge.', authClientId) {
    debug(`Resolving DNS TXT records for ${authz.identifier.value}, prefix: ${prefix}`);
    eventLog.emit(`Resolving DNS TXT records for ${authz.identifier.value}, prefix: ${prefix}`, authClientId);
    const challengeRecord = `${prefix}${authz.identifier.value}`;
    const result = await dns.resolveCnameAsync(challengeRecord)
        .then(r => dns.resolveTxtAsync(r[0]));
    const records = [].concat(...result);

    debug(`Query successful, found ${records.length} DNS TXT records`);

    if (records.indexOf(keyAuthorization) === -1) {
        throw new Error(`Authorization not found in DNS TXT records for ${authz.identifier.value}`);
    }
    debug(`Key authorization match for ${challenge.type}/${authz.identifier.value}, ACME challenge verified`);
    eventLog.emit(`Key authorization match for ${challenge.type}/${authz.identifier.value}`, authClientId);

    return true;
}


/**
 * Export API
 */

module.exports = {
    'http-01': verifyHttpChallenge,
    'dns-01': verifyDnsChallenge
};
