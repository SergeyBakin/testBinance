const aliasFieldsByEvents = require('../config').aliasFieldsByEvents;

module.exports.convertPrecisionFromStringToNumber = (str) => {
    try {
        const arrOfNumber = str.split('.');
        if (
            !arrOfNumber || !arrOfNumber.length || arrOfNumber.length > 2 ||
            ( !Number(arrOfNumber[0]) && Number(arrOfNumber[0]) !== 0 ) ||
            ( arrOfNumber[1] && !Number(arrOfNumber[1]) && Number(arrOfNumber[1]) !== 0)
        ) {
            return { error: new Error('Invalid parameters') };
        }
        return {
            error: null,
            amountPrecision: arrOfNumber[1] ? arrOfNumber[1].length : 0,
            result: arrOfNumber[1] ? Number(arrOfNumber[0] + arrOfNumber[1]) : Number(arrOfNumber[0]),
            source: str,
        };
    } catch (error) {
        return { error: new Error('Invalid parameters') };
    }
};

const isObject = (arg) => Object.prototype.toString.call(arg).indexOf('Object') !== -1;
module.exports.isObject = isObject;

module.exports.transformReceivedMessage = (objData, type) => {
    const localAlias = isObject(type) ? type : aliasFieldsByEvents[type];
    if (!localAlias) {
        return objData;
    }
    const newItem = {};
    Object.keys(objData).forEach( (key) => {
        const value = objData[key];
        const newKey = localAlias[key] || key;
        if ( Array.isArray(value) ) {
            if ( Array.isArray(aliasFieldsByEvents[newKey]) ) {
                newItem[newKey] = value.map( arrayValue => this.transformReceivedMessage(arrayValue, aliasFieldsByEvents[newKey][0] ) );
            } else {
                newItem[newKey] = Object.keys(value).map( (arrayKey) => this.transformReceivedMessage(value, localAlias[arrayKey] ) );
            }
        } else if ( isObject(value) ) {
            newItem[newKey] = this.transformReceivedMessage(value, localAlias[key]);
        } else {
            newItem[newKey] = value;
        }
    });
    return newItem;
};