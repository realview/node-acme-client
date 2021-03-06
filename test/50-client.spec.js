/**
 * ACME tests
 */

const assert = require('chai').assert;
const Promise = require('bluebird');
const acme = require('./../src');


describe('client', () => {
    let testPrivateKey;
    let testSecondaryPrivateKey;
    let testClient;
    let testAccount;
    let testAccountUrl;
    let testOrder;
    let testOrderWildcard;
    let testAuthz;
    let testAuthzWildcard;
    let testChallenge;
    let testChallengeWildcard;

    const testDomain = 'example.com';
    const testDomainWildcard = `*.${testDomain}`;
    const testChallengeType = 'http-01';
    const testChallengeTypeWildcard = 'dns-01';


    /**
     * Fixtures
     */

    it('should generate a private key', async () => {
        testPrivateKey = await acme.forge.createPrivateKey();
        assert.strictEqual(Buffer.isBuffer(testPrivateKey), true);
    });

    it('should create a second private key', async () => {
        testSecondaryPrivateKey = await acme.forge.createPrivateKey(2048);
        assert.strictEqual(Buffer.isBuffer(testSecondaryPrivateKey), true);
    });


    /**
     * Initialize clients
     */

    it('should initialize client', () => {
        testClient = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey
        });
    });

    it('should produce a valid JWK', async () => {
        const jwk = await testClient.http.getJwk();
        assert.isObject(jwk);
        assert.strictEqual(jwk.e, 'AQAB');
        assert.strictEqual(jwk.kty, 'RSA');
    });


    /**
     * Create account
     */

    it('should get Terms of Service URL', async () => {
        const tos = await testClient.getTermsOfServiceUrl();
        assert.isString(tos);
    });

    it('should refuse account creation without ToS', async () => {
        await assert.isRejected(testClient.createAccount());
    });

    it('should create an account', async () => {
        testAccount = await testClient.createAccount({
            termsOfServiceAgreed: true
        });

        assert.isObject(testAccount);
        assert.strictEqual(testAccount.status, 'valid');
    });

    it('should produce an account URL', () => {
        testAccountUrl = testClient.getAccountUrl();
        assert.isString(testAccountUrl);
    });


    /**
     * Find existing account using secondary client
     */

    it('should find existing account using account key', async () => {
        const client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey
        });

        const account = await client.createAccount({
            termsOfServiceAgreed: true
        });

        assert.isObject(account);
        assert.strictEqual(account.status, 'valid');
        assert.strictEqual(testAccount.id, account.id);
    });


    /**
     * Account URL
     */

    it('should refuse invalid account URL', async () => {
        const client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey,
            accountUrl: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/1'
        });

        await assert.isRejected(client.updateAccount());
    });

    it('should find existing account using account URL', async () => {
        const client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey,
            accountUrl: testAccountUrl
        });

        const account = await client.createAccount({});

        assert.isObject(account);
        assert.strictEqual(account.status, 'valid');
        assert.strictEqual(testAccount.id, account.id);
    });


    /**
     * Update account contact info
     */

    it('should update account contact info', async () => {
        const account = await testClient.updateAccount({});

        assert.isObject(account);
        assert.strictEqual(account.status, 'valid');
        assert.strictEqual(testAccount.id, account.id);
    });


    /**
     * Change account private key
     */

    it('should change account private key', async () => {
        const account = await testClient.updateAccountKey(testSecondaryPrivateKey);
        assert.isObject(account);
        assert.strictEqual(account.status, 'valid');
    });


    /**
     * Create new certificate order
     */

    it('should create new order', async () => {
        const data1 = { identifiers: [{ type: 'dns', value: testDomain }] };
        const data2 = { identifiers: [{ type: 'dns', value: testDomainWildcard }] };

        testOrder = await testClient.createOrder(data1);
        testOrderWildcard = await testClient.createOrder(data2);

        [testOrder, testOrderWildcard].forEach((item) => {
            assert.isObject(item);
            assert.strictEqual(item.status, 'pending');

            assert.isArray(item.identifiers);
            assert.isArray(item.authorizations);

            assert.isString(item.url);
            assert.isString(item.finalize);
        });
    });


    /**
     * Get identifier authorization
     */

    it('should get identifier authorization', async () => {
        const authzArr1 = await testClient.getAuthorizations(testOrder);
        const authzArr2 = await testClient.getAuthorizations(testOrderWildcard);

        [authzArr1, authzArr2].forEach((item) => {
            assert.isArray(item);
            assert.isNotEmpty(item);
        });

        testAuthz = authzArr1.pop();
        testAuthzWildcard = authzArr2.pop();

        [testAuthz, testAuthzWildcard].forEach((item) => {
            assert.isObject(item);
            assert.strictEqual(item.status, 'pending');

            assert.isString(item.url);
            assert.isArray(item.challenges);
        });

        testChallenge = testAuthz.challenges.filter(c => c.type === testChallengeType).pop();
        testChallengeWildcard = testAuthzWildcard.challenges.filter(c => c.type === testChallengeTypeWildcard).pop();

        [testChallenge, testChallengeWildcard].forEach((item) => {
            assert.isObject(item);
            assert.strictEqual(item.status, 'pending');
            assert.isString(item.url);
        });
    });


    /**
     * Generate challenge key authorization
     */

    it('should get challenge key authorization', async () => {
        await Promise.map([testChallenge, testChallengeWildcard], async (item) => {
            const keyAuth = await testClient.getChallengeKeyAuthorization(item);
            assert.isString(keyAuth);
        });
    });


    /**
     * Deactivate identifier authorization
     */

    it('should deactivate identifier authorization', async () => {
        await Promise.map([testAuthz, testAuthzWildcard], async (item) => {
            const authz = await testClient.deactivateAuthorization(item);
            assert.strictEqual(authz.status, 'deactivated');
        });
    });


    /**
     * Deactivate account
     */

    it('should deactivate the test account', async () => {
        const data = { status: 'deactivated' };
        const account = await testClient.updateAccount(data);

        assert.isObject(account);
        assert.strictEqual(account.status, 'deactivated');
    });


    /**
     * Verify that no new orders can be made
     */

    it('should not allow new orders', async () => {
        const data = {
            identifiers: [{ type: 'dns', value: 'nope.com' }]
        };

        await assert.isRejected(testClient.createOrder(data));
    });
});
