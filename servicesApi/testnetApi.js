const request = require('./request');
const crypto = require('crypto');
const querystring = require('querystring');

const configTestnet = require('../config').testnetApi;
const prefixApiV3 = configTestnet.apiV3;

const typeOrder = {
    LIMIT_MAKER: 'LIMIT_MAKER',
};

const getHeader = () => {
    return {
        'X-MBX-APIKEY': configTestnet.apiKey,
        'Content-Type': 'application/json',
    };
};

const getSignature = (queryStr, apiSecret) => {
    return crypto
        .createHmac('sha256', apiSecret)
        .update(queryStr)
        .digest('hex');
};

module.exports.getExchangeInfo = async () => {
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/exchangeInfo`,
        method: 'GET',
    });
};

module.exports.getAccountSPOT = async () => {
    const queryString = `timestamp=${new Date().valueOf()}`;
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/account?${queryString}&signature=${getSignature(queryString, configTestnet.secretKey)}`,
        method: 'GET',
        headers: getHeader(),
    });
};

module.exports.createListenKey = async () => {
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/userDataStream`,
        method: 'POST',
        headers: getHeader(),
    });
};

module.exports.updateListenKey = async (listenKey) => {
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/userDataStream?listenKey=${listenKey}`,
        method: 'PUT',
        headers: getHeader(),
    });
};

module.exports.deleteListenKey = async (listenKey) => {
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/userDataStream?listenKey=${listenKey}`,
        method: 'DELETE',
        headers: getHeader(),
    });
};

module.exports.createOrderTest = async () => {
    const queryString = `symbol=BTCUSDT&side=buy&type=LIMIT_MAKER&price=18088.15000000&quantity=0.00471300&timestamp=${new Date().valueOf()}`;
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/order/test?${queryString}&signature=${getSignature(queryString, configTestnet.secretKey)}`,
        method: 'POST',
        headers: getHeader(),
    });
};

module.exports.createOrder = async ({symbol, side, type, price, quantity} = {}) => {
    let queryString = null;
    if (type === typeOrder.LIMIT_MAKER) {
        queryString = querystring.stringify({ symbol, side, type, price, quantity, timestamp : new Date().valueOf() });
    }
    if (!queryString) {
        return new Error('Invalid parameters');
    }
    return await request({
        hostname: configTestnet.hostname,
        path: `${prefixApiV3}/order?${queryString}&signature=${getSignature(queryString, configTestnet.secretKey)}`,
        method: 'POST',
        headers: getHeader(),
    });
};