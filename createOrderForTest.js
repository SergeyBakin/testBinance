// test update UserData
const testnetApi = require('./servicesApi/testnetApi');

(async () => {
    const testOrder = await testnetApi.createOrder({symbol: 'BTCUSDT', side: 'buy', type: 'LIMIT_MAKER', price: '18088.15000000', quantity: '0.00471300'});
    console.log('testOrder', testOrder);
})();

