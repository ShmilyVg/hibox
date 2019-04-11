import {CommonConnectState, CommonProtocolState} from "heheda-bluetooth-state";
import {HexTools} from "./tools";

export class ProtocolBody {

    constructor({commandIndex, dataStartIndex, deviceIndexNum, blueToothManager}) {
        this.commandIndex = commandIndex;
        this.dataStartIndex = dataStartIndex;
        this.deviceIndexNum = deviceIndexNum;
        this.blueToothManager = blueToothManager;
    }

    receive({action, receiveBuffer}) {
        const receiveArray = [...new Uint8Array(receiveBuffer)];
        let command = receiveArray[this.commandIndex];
        let commandHex = `0x${HexTools.numToHex(command)}`;
        console.log('命令字', commandHex);
        let dataLength = receiveArray[1] - 1;
        let dataArray;
        if (dataLength > 0) {
            const endIndex = this.dataStartIndex + dataLength;
            dataArray = receiveArray.slice(this.dataStartIndex, endIndex);
        }
        const doAction = action[commandHex];
        if (doAction) {
            const {state: protocolState, dataAfterProtocol} = doAction({dataArray});
            return this.getOtherStateAndResultWithConnectedState({protocolState, dataAfterProtocol});
        } else {
            console.log('协议中包含了unknown状态');
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

    createUpdateBuffer({index, data}) {
        const dataBody = this._createUpdateDataBody({index, data});
        return new Uint8Array(dataBody).buffer;
    }

    _createUpdateDataBody({index, data = []}) {
        const dataPart = [];
        data.map(item => HexTools.numToHexArray(item)).forEach(item => dataPart.push(...item));
        let indexArray = HexTools.numToHexArray(index);
        indexArray.length === 1 && indexArray.unshift(0);
        return [170, ...indexArray, ...dataPart];
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
