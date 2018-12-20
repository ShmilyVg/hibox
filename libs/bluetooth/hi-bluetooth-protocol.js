import {CommonProtocolState} from "./base/state";
import {HexTools, ProtocolBody} from "./utils/tools";

const commandIndex = 2, dataStartIndex = 3;

export default class HiBlueToothProtocol {

    constructor({blueToothManager, deviceIndexNum}) {
        this.setFilter(true);//过滤
        this._blueToothManager = blueToothManager;
        this.protocolBody = new ProtocolBody({commandIndex, dataStartIndex, deviceIndexNum, blueToothManager});
        this.action = {
            //由手机发出的连接请求
            '0x01': () => {
                this.sendData({command: '0x01'});
            },
            //由设备发出的连接反馈 1接受 2不接受 后面的是
            '0x02': ({dataArray}) => {
                const isConnected = HexTools.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(1));
                console.log('绑定结果', dataArray, deviceId, isConnected);
                //由手机回复的连接成功
                isConnected && this.startCommunication();
                return {
                    state: CommonProtocolState.GET_CONNECTED_RESULT_SUCCESS,
                    dataAfterProtocol: {isConnected, deviceId}
                };
            },
            //App发送绑定成功，并隔一段时间发送同步数据
            '0x03': () => {
                this.sendData({command: '0x03'});
                this.sendQueryDataRequiredProtocol();
            },
            //由设备发出的时间戳请求
            '0x04': ({dataArray}) => {
                const battery = HexTools.hexArrayToNum(dataArray.slice(0, 1));
                const version = HexTools.hexArrayToNum(dataArray.slice(1, 3));
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(3));
                const now = Date.now() / 1000;
                this.sendData({command: '0x05', data: [now]});
                return {state: CommonProtocolState.TIMESTAMP, dataAfterProtocol: {battery, version, deviceId}};
            },
            '0x06': () => {
                this.sendData({command: '0x07'});
                return {state: CommonProtocolState.DORMANT};
            },
            //由手机发出的查找设备请求
            '0x08': () => {
                this.sendData({command: '0x08'});
            },
            //设备反馈的查找设备结果，找到了设备
            '0x09': () => {
                return {state: CommonProtocolState.NORMAL_PROTOCOL};
            },
            //App请求同步数据
            '0x0a': () => {
                this.sendData({command: '0x0a'});
                blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_START}));
            },
            //App传给设备同步数据的结果
            '0x0b': () => {
                this.sendData({command: '0x0b'});
                blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_FINISH}));
            },
        }
    }

    requireDeviceBind() {
        !this.getDeviceIsBind() && this.action['0x01']();
    }

    sendQueryDataRequiredProtocol() {
        if (this.getDeviceIsBind()) {
            setTimeout(() => {
                this.action['0x0a']();
            }, 4000);
        }
    }

    sendData({command, data}) {
        this._blueToothManager.sendData({buffer: this.createBuffer({command, data})});
    }

    sendQueryDataSuccessProtocol() {
        if (this.getDeviceIsBind()) {
            this.action['0x0b']();
        }
    }

    startCommunication() {
        this.action['0x03']();
    }

    setFilter(filter) {
        this._filter = filter;
    }

    getDeviceIsBind() {
        const isBind = !!wx.getStorageSync('isBindDevice');
        console.log('获取设备是否被绑定', isBind);
        return isBind;
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

    createBuffer({command, data}) {
        return this.protocolBody.createBuffer({command, data});
    }
}
