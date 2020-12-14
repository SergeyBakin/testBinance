const testnetApi = require('./servicesApi/testnetApi');
const tasks = require('./services/tasks');

const timeInterval = 60 * 1000;
const objInterval = {
    startListenKeyDate: new Date().getTime(),
    startWSDate: new Date().getTime(),
    startWSMainnetDate: new Date().getTime(),
    listenKeyDate: null,
    wsDate: null,
    wsMainnetDate: null,
    timerId: null,
};
const time1Hour = 60 * 60 * 1000;
const time1Minute = 60 * 1000;

// check errors not catching rejection
let possiblyUnHandledRejections = new Map();


(async () => {
    try {
        const balancesUser = await tasks.taskNoZeroBalance();
        console.log('Current balances', balancesUser);

        let { listenKey, ws } = await tasks.taskSingleWSUpdateBalance();

        await tasks.taskOpenTradesFor10Pairs();

        const checkAliveTokensTestnet = async () => {
            objInterval.listenKeyDate = new Date().getTime();
            objInterval.wsDate = new Date().getTime();
            const is30MinDiff = Math.floor((objInterval.listenKeyDate - objInterval.startListenKeyDate) / time1Minute);
            // update listenKey every 30 min
            if (is30MinDiff >= 30) {
                await testnetApi.updateListenKey(listenKey);
                objInterval.startListenKeyDate = new Date().getTime();
            }
            // update single websocket
            const is24HoursDiff = Math.floor((objInterval.wsDate - objInterval.startWSDate) / time1Hour);
            if (is24HoursDiff >= 23) {
                tasks.terminateWS(ws);
                ({ listenKey, ws } = await tasks.taskSingleWSUpdateBalance());
                objInterval.startWSDate = new Date().getTime();
            }
        };

        const calculateTimeMinAvgMaxAndClear = () => {
            // calculate time latency
            const timeL = tasks.calculateTimeMinAvgMax(tasks.getTimeLatency());
            console.log('Measure event time => client receive time latency', timeL);
            // clear timeLatency
            objInterval.wsMainnetDate = new Date().getTime();
            const is1HoursDiff = Math.floor((objInterval.wsMainnetDate - objInterval.startWSMainnetDate) / time1Hour);
            if (is1HoursDiff >= 1) {
                tasks.clearTimeLatency();
                objInterval.startWSMainnetDate = new Date().getTime();
            } else {
                tasks.setProccessClear(false);
            }
        };

        objInterval.timerId = setInterval(async () => {
            await checkAliveTokensTestnet();

            calculateTimeMinAvgMaxAndClear();

            // check errors not catching rejection
            handleRejection();
        }, timeInterval);


    } catch (error) {
        console.log('error', error);
    }

})();





const exit = (error) => {
	if (error) {
		console.error('error', error);
	}
	process.exit(0);
};

process.on('SIGINT', () => {
    console.log('SIGINT');
    tasks.terminateAllWS();
    clearInterval(objInterval.timerId);
	exit();
});
process.on('SIGTSTP', () => {
    console.log('SIGTSTP');
    tasks.terminateAllWS();
    clearInterval(objInterval.timerId);
	exit();
});

process.on("uncaughtException", (err) => {
	console.error('uncaughtException: ', err.message);
	console.error('err.stack',err.stack);
	exit();
});

// check errors not catching rejection
process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandledRejection', reason, promise);
	possiblyUnHandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
    console.log('rejectionHandled', promise);
	possiblyUnHandledRejections.delete(promise);
});
const handleRejection = () => {
    // show and clean error
	possiblyUnHandledRejections.forEach( (reason, promise) => {
        // show some error
        console.log('reason', reason);
        console.log('promise', promise);
	});
	possiblyUnHandledRejections.clear();
};