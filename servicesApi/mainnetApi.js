const request = require('./request');
const configMainnet = require('../config').mainnetApi;

const prefixApiV3 = configMainnet.apiV3;


module.exports.ticker24hr = async () => {
    return await request({
        hostname: configMainnet.hostname,
        path: `${prefixApiV3}/ticker/24hr`,
        method: 'GET',
    });
};

module.exports.tickerPrice = async () => {
    return await request({
        hostname: 'api.binance.com',
        path: `/api/v3/ticker/price`,
        method: 'GET',
    });
};

module.exports.tickerBookTicker = async () => {
    return await request({
        hostname: 'api.binance.com',
        path: `/api/v3/ticker/bookTicker`,
        method: 'GET',
    });
};