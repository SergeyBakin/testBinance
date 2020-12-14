const WebSocket = require('ws');

const listWS = [];

const streams = {
    trade: symbol => `${symbol.toLowerCase()}@trade`,
};

let counterId = 0;
const getNextCount = () => ++counterId;


module.exports.testPingPong = async (ws) => {
    return new Promise( (resolve, reject) => {
        if (!ws) {
            return reject(new Error('Invalid parameters'));
        }
        ws.ping( () => {});
        ws.on('pong', () => {
            resolve(true);
        });
    });
};

module.exports.terminate = async (ws) => {
    ws.terminate();
};

module.exports.terminateAll = async () => {
    for (let index = 0; index < listWS.length; index++) {
        listWS[index].terminate();
    }
};

module.exports.createWebSocket = async (endpoint) => {
    return new Promise( (resolve) => {
        const ws = new WebSocket(endpoint);
        ws.on('open', async () => {
            listWS.push(ws);
            resolve(ws);
        });
        ws.on('error', (error) => {
            console.log('errorWS', error);
        });
    });
};

module.exports.getStreamString = (type, symbol) => streams[type](symbol) || '';

module.exports.getStreamObj = (method, type, symbolArr) => {
    return {
        method,
        params: symbolArr.map( el => this.getStreamString(type, el)),
        id: getNextCount(),
    };
};