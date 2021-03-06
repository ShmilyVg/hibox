let _divideNumber = 10;
export default class DrugRuler {

    static getConvertToServerData({deviceId, compartment, classify, drugName, list, code, pieceArray}) {

        return {
            compartment: parseInt(compartment) || 1, drugName: drugName,
            drugClassify: classify, deviceId: deviceId, code: code,
            items: [...list.sort((item1, item2) =>
                item1.timestamp - item2.timestamp
            ).map((item) =>
                ({remind_time: item.time, number: pieceArray[item.piece - 1].value})
            )]
        };
    }

    static getConvertToBLEList({compartment, list}) {
        const {length} = list;
        return list.sort(this.sortFun).map((item, timeIndex) =>
            ({compartment: parseInt(compartment) || 1, length, timeIndex, timestamp: item.timestamp,})
        ).map(item =>
            [item.compartment, item.length, item.timeIndex + 1, ...this._getTimestampMayAddZero(item.timestamp)]
        ).reverse().concat([DrugRuler.getConvertToBLEEmptyList({compartment})]);
    }

    static sendAlertTimeDataToBLE({singleAlertData}) {
        return getApp().getBLEManager().sendAlertTimeOperationProtocol({singleAlertData});
    }

    static getConvertToBLEEmptyList({compartment}) {
        return [compartment, 0, 1, ...this._getTimestampMayAddZero(this.getFinalItemExpectPiece('08:00').timestamp)];
    }

    static _getTimestampMayAddZero(timestamp) {
        const array = [];
        if (!(timestamp >> 8)) {
            array.push(0, 0);
        } else if (!(timestamp >> 16)) {
            array.push(0);
        }
        array.push(timestamp);
        return array;
    }

    static convertServerListToLocalList({items}) {
        return items.map(item => ({...this.getFinalItemExpectPiece(item.remind_time), piece: item.number * 2}));//result = 0.5*index
    }

    static getDayPart(hour) {
        let part = 'night';
        if (hour < 12) {
            part = 'morning';
        } else if (hour < 18) {
            part = 'afternoon';
        }
        return part;
    }

    static getList({ruler, number, piece}) {
        return ruler[number].map(item => ({...this.getFinalItemExpectPiece(item), piece}));
    }

    static sortFun(item1, item2) {
        return item1.timestamp - item2.timestamp;
    }

    static setDiviceNumber(divideNumber) {
        _divideNumber = divideNumber;
    }

    static getFinalItemExpectPiece(hourAndMinute) {
        const hour = parseInt(hourAndMinute.slice(0, 2));
        const minute = parseInt(hourAndMinute.slice(-2));

        return {
            timestamp: hour * 3600 + minute * 60,
            time: hourAndMinute,
            dayPart: this.getDayPart(hour),
            hourAndMinuteIndex: [hour, minute / _divideNumber]
        };
    }
}


