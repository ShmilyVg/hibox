import {CommonProtocolState} from "./base/state";
import {HexTools, ProtocolBody} from "./utils/tools";

const commandIndex = 4, dataStartIndex = 5;

export default class HiBlueToothProtocol {

    constructor({blueToothManager, deviceIndexNum}) {
        this.setFilter(true);//过滤
        this.protocolBody = new ProtocolBody({commandIndex, dataStartIndex, deviceIndexNum, blueToothManager});
        this.action = {
            //由设备发出的时间戳请求
            '0x70': ({dataArray}) => {
                const battery = HexTools.hexArrayToNum(dataArray.slice(0, 1));
                const version = HexTools.hexArrayToNum(dataArray.slice(1, 3));
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(3));
                const now = Date.now() / 1000;
                blueToothManager.sendData({buffer: this.protocolBody.createBuffer({command: '0x71', data: [now]})});
                return {state: CommonProtocolState.TIMESTAMP, dataAfterProtocol: {battery, version, deviceId}};
            },
            //App请求同步数据
            '0x77': () => {
                blueToothManager.sendData({buffer: this.protocolBody.createBuffer({command: '0x77'})});
                blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_START}));
            },
            //设备返回要同步的数据
            '0x75': ({dataArray}) => {
                const length = HexTools.hexArrayToNum(dataArray.slice(0, 1));
                const isEat = HexTools.hexArrayToNum(dataArray.slice(1, 2)) === 1;
                const timestamp = HexTools.hexArrayToNum(dataArray.slice(2));
                return {state: CommonProtocolState.QUERY_DATA_ING, dataAfterProtocol: {length, isEat, timestamp}};
            },
            //App传给设备同步数据的结果
            '0x78': () => {
                blueToothManager.sendData({buffer: this.protocolBody.createBuffer({command: '0x78'})});
                blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_FINISH}));
            },
            //由手机发出的连接请求
            '0x7a': () => {
                blueToothManager.sendData({buffer: this.protocolBody.createBuffer({command: '0x7a'})});
            },
            //由设备发出的连接反馈 1接受 0不接受 后面的是
            '0x7b': ({dataArray}) => {
                const isConnected = HexTools.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(1));
                //由手机回复的连接成功
                isConnected && this.startCommunication();
                return {
                    state: CommonProtocolState.GET_CONNECTED_RESULT_SUCCESS,
                    dataAfterProtocol: {isConnected, deviceId}
                };
            },
            //App发送同步数据
            '0x7c': () => {
                blueToothManager.sendData({buffer: this.protocolBody.createBuffer({command: '0x7c'})});
                this.sendQueryDataRequiredProtocol();
            },
        }
    }

    requireDeviceBind() {
        !this.getDeviceIsBind() && this.action['0x7a']();
    }

    sendQueryDataRequiredProtocol() {
        if (this.getDeviceIsBind()) {
            setTimeout(() => {
                this.action['0x77']();
            }, 4000);
        }
    }

    sendQueryDataSuccessProtocol() {
        if (this.getDeviceIsBind()) {
            this.action['0x78']();
        }
    }

    startCommunication() {
        this.action['0x7c']();
    }

    setFilter(filter) {
        this._filter = filter;
    }

    getDeviceIsBind() {
        console.log('获取设备是否被绑定', !!wx.getStorageSync('isBindDevice'));
        return !!wx.getStorageSync('isBindDevice');
    }

    setBindMarkStorage() {
        wx.setStorageSync('isBindDevice', 1);
    }

    clearBindMarkStorage() {
        wx.removeStorageSync('isBindDevice');
    }

    receive({receiveBuffer}) {
        return this.protocolBody.receive({action: this.action, receiveBuffer, filter: this._filter});
    }

}
