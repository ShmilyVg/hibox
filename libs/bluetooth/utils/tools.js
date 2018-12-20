import {CommonConnectState, CommonProtocolState} from "../base/state";

export class HexTools {
    static hexToNum(str = '') {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        return parseInt(`0x${str}`);
    }

    static numToHex(num = 0) {
        return ('00' + num.toString(16)).slice(-2);
    }

    /**
     *
     * @param num
     * @returns {*} 一个字节代表16位
     */
    static numToHexArray(num) {
        if (num === void 0) {
            return [];
        }
        num = parseInt(num);
        if (num === 0) {
            return [0];
        }
        let str = num.toString(16);
        console.log(str);
        str.length % 2 && (str = '0' + str);
        const array = [];
        for (let i = 0, len = str.length; i < len; i += 2) {
            array.push(parseInt(`0x${str.substr(i, 2)}`));
        }
        return array;
    }

    /**
     * hex数组转为num
     * @param array 按高低八位来排列的数组
     */
    static hexArrayToNum(array) {
        let count = 0, divideNum = array.length - 1;
        array.forEach((item, index) => count += item << (divideNum - index) * 8);
        return count;
    }
}


export class ProtocolBody {

    constructor({commandIndex, dataStartIndex, deviceIndexNum, blueToothManager}) {
        this.commandIndex = commandIndex;
        this.dataStartIndex = dataStartIndex;
        this.deviceIndexNum = deviceIndexNum;
        this.blueToothManager = blueToothManager;
    }

    receive({action, receiveBuffer, filter}) {
        const receiveArray = [...new Uint8Array(receiveBuffer)];
        let command = receiveArray[this.commandIndex];
        let commandHex = `0x${HexTools.numToHex(command)}`;
        console.log('命令字', commandHex, '是否过滤', filter);
        let dataLength = receiveArray[1] - 1;
        let dataArray;
        if (dataLength > 0) {
            const endIndex = this.dataStartIndex + dataLength;
            dataArray = receiveArray.slice(this.dataStartIndex, endIndex + 1);
        }
        const doAction = action[commandHex];
        if (!filter && doAction) {
            const {state: protocolState, dataAfterProtocol} = doAction({dataArray});
            return this.getOtherStateAndResultWithConnectedState({protocolState, dataAfterProtocol});
        } else {
            console.log('协议中包含了unknown状态或过滤信息');
            return this.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.UNKNOWN});
        }
    }

    getOtherStateAndResultWithConnectedState({protocolState, dataAfterProtocol}) {
        return {
            ...this.blueToothManager.getState({connectState: CommonConnectState.CONNECTED, protocolState}),
            dataAfterProtocol
        };
    }

    createBuffer({command, data}) {
        const dataBody = this._createDataBody({command, data});
        return new Uint8Array(dataBody).buffer;
    }

    _createDataBody({command = '', data = []}) {
        const dataPart = [];
        data.map(item => HexTools.numToHexArray(item)).forEach(item => dataPart.push(...item));
        const lowLength = HexTools.hexToNum((dataPart.length + 1).toString(16));
        const array = [this.deviceIndexNum, lowLength, HexTools.hexToNum(command), ...dataPart];
        let count = 0;
        array.forEach(item => count += item);
        count = ~count + 1;
        array.push(count);
        return array;
    }

}
