const utils = require('./utils');
const testnetApi = require('../servicesApi/testnetApi');
const mainnetApi = require('../servicesApi/mainnetApi');
const handleWS = require('../servicesApi/websocket');
const models = require('./models');
const configTestnet = require('../config').testnetApi;
const configMainnet = require('../config').mainnetApi;

let balancesUser = [];
const availableCurrencies = {};
let timeLatency = [];
let copyTimeLatency = [];
let proccessClear = false; // field is needed for saving data when do to clean timeLatency


const outboundAccountInfo = (message) => {
    const { balances } = utils.transformReceivedMessage(message, message.e);
    return balances;
};

const outboundAccountPosition = (message, balancesUser) => {
    const { balances } = utils.transformReceivedMessage(message, message.e);
    console.log('Balances is changed:', balances);
    return updateLocalBalances(balancesUser, balances);
};

const updateLocalBalances = (localBalances, newBalances) => {
    return newBalances.reduce( (acc, currentNewB) => {
        const existCurrency = acc.find((taskItem) => taskItem.asset === currentNewB.asset);
        if (!existCurrency) {
            acc = [{ asset: currentNewB.asset, free: currentNewB.free, locked: currentNewB.locked }, ...acc ];
        } else {
            acc = acc.map((task) => {
                if (currentNewB.asset === task.asset) {
                    return { asset: currentNewB.asset, free: currentNewB.free, locked: currentNewB.locked };
                }
                return task;
            });
        }
        return acc;
    }, [...localBalances]);
};

const getTop10PairsByVolume = async () => {
    const statistics24hrTicker = await mainnetApi.ticker24hr();
    statistics24hrTicker.sort( (a, b) => {
        return parseFloat(b.volume) - parseFloat(a.volume);
    });
    return statistics24hrTicker.slice(0, 10);
};


module.exports.taskNoZeroBalance = async () => {
    try {
        const { balances } = await testnetApi.getAccountSPOT();
        if (!balances || !balances.length) {
            return new Error('Invalid parameters');
        }
        balancesUser = balances;
        // filter for excluding balances is equal 0
        return balances.filter( el => {
            availableCurrencies[el.asset] = true;
            const objWithBalanceNumber = utils.convertPrecisionFromStringToNumber(el.free);
            if (objWithBalanceNumber && !objWithBalanceNumber.error && objWithBalanceNumber.result > 0) {
                return el;
            }
            return false;
        });
    } catch (error) {
        return new Error(error);
    }
};

module.exports.taskSingleWSUpdateBalance = async () => {
    try {
        const { listenKey } = await testnetApi.createListenKey();
        await testnetApi.updateListenKey(listenKey);
        const endpoint = `${configTestnet.ws}/${listenKey}`;
        const ws = await handleWS.createWebSocket(endpoint);

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            switch (message.e) {
                case 'outboundAccountPosition':
                    balancesUser = outboundAccountPosition(message, balancesUser);
                    break;
                case 'outboundAccountInfo':
                    balancesUser = outboundAccountInfo(message);
                    break;
                case 'executionReport':
                    break;
                default:
                    console.log('Unknown type message', message);
                    break;
            }
        });

        ws.on('close', () => {
            console.log('end');
        });

        return { listenKey, ws };
    } catch (error) {
        return new Error(error);
    }
};

module.exports.taskOpenTradesFor10Pairs = async () => {
    const top10Pairs = await getTop10PairsByVolume();
    const symbolArr = top10Pairs.map( el => el.symbol );
    const streams = handleWS.getStreamObj(models.methodStreams.SUBSCRIBE, models.typeStreams.TRADE, symbolArr);
    const endpoint = `${configMainnet.ws}`;
    const ws = await handleWS.createWebSocket(endpoint);

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        switch (message.e) {
            case 'trade':
                const result = utils.transformReceivedMessage(message, message.e);
                const timeChange = new Date().getTime() - result.eventTime;
                if (proccessClear) {
                    copyTimeLatency.push(timeChange);
                } else {
                    if (copyTimeLatency.length) {
                        timeLatency = [...copyTimeLatency, ...timeLatency];
                        copyTimeLatency = [];
                    }
                    timeLatency.push(timeChange);
                }
                break;
            default:
                if (!message.id) {
                    console.log('Unknown type message', message);
                }
                break;
        }
    });

    ws.send(JSON.stringify(streams));
    return { ws };
};

module.exports.getTimeLatency = () => {
    this.setProccessClear(true);
    return timeLatency;
};

module.exports.clearTimeLatency = () => {
    timeLatency = [];
    this.setProccessClear(false);
};

module.exports.setProccessClear = (value) => proccessClear = value;

module.exports.calculateTimeMinAvgMax = (timeLatency) => {
    this.setProccessClear(true);
    if (!timeLatency || !timeLatency.length) {
        return new Error('Invalid parameters');
    }
    let min = timeLatency[0];
    let max = min;
    let avg = min;
    for (i = 1; i < timeLatency.length; ++i) {
        if (timeLatency[i] > max) {
            max = timeLatency[i] || 0;
        }
        if (timeLatency[i] < min) {
            min = timeLatency[i] || 0;
        }
        avg += timeLatency[i];
    }

    avg = parseInt(avg/timeLatency.length) || 0;
    return { min, avg, max };
};

module.exports.terminateAllWS = async () => {
    return handleWS.terminateAll();
};

module.exports.terminateWS = async (ws) => {
    return handleWS.terminate(ws);
};