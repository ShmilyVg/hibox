import {CommonProtocolState} from "heheda-bluetooth-state";
import {HexTools} from "./utils/tools";
import {ProtocolBody} from "./utils/protocol";
import UpdateTool from "./utils/update";
import {BlueToothUpdate} from "heheda-network";

const commandIndex = 2, dataStartIndex = 3;

export default class HiBlueToothProtocol {

    constructor({blueToothManager, deviceIndexNum}) {
        this._blueToothManager = blueToothManager;
        this._protocolQueue = [];
        this.updateDeviceSoftwareManager = new BlueToothUpdate();
        this.protocolBody = new ProtocolBody({commandIndex, dataStartIndex, deviceIndexNum, blueToothManager});
        this._updatingTimeoutIndex = 0;
        // this._queryTimeoutIndex = -1;
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
            //App发送绑定成功
            '0x03': () => {
                this.sendData({command: '0x03'});
            },
            //由设备发出的时间戳请求，并隔一段时间发送同步数据
            '0x04': ({dataArray}) => {
                const battery = HexTools.hexArrayToNum(dataArray.slice(0, 1));
                const version = HexTools.hexArrayToNum(dataArray.slice(1, 3));
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(3, 11));
                this._syncCount = HexTools.hexArrayToNum(dataArray.slice(11, 13)) || 0;
                const now = Date.now() / 1000;
                this.updateDeviceSoftwareManager.execute({deviceId, version}).then(arrayBuffer => {
                    this._updateTool = new UpdateTool({arrayBuffer});
                    this.sendData({command: '0x05', data: [now, 1, ...this._updateTool.countArray]});
                }).catch(() => {
                    this.sendData({command: '0x05', data: [now, 2]});
                }).finally(() => this.sendQueryDataRequiredProtocol());

                return {state: CommonProtocolState.TIMESTAMP, dataAfterProtocol: {battery, version, deviceId}};
            },
            //设备发出待机状态通知
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
                return {state: CommonProtocolState.FIND_DEVICE};
            },
            //App请求同步数据
            '0x0a': () => {
                this.sendData({command: '0x0a'}).then(() => blueToothManager.updateBLEStateImmediately(
                    this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_START})
                ));
            },
            //App传给设备同步数据的结果
            '0x0b': ({isSuccess}) => {
                this.sendData({
                    command: '0x0b',
                    data: [isSuccess ? 1 : 2]
                });
                //     .finally(() => {
                //     if (isSuccess) {
                //         clearTimeout(this._queryTimeoutIndex);
                //         this._queryTimeoutIndex = setTimeout(() => {
                //             blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_FINISH}));
                //         }, 2000);
                //     } else {
                //         blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.QUERY_DATA_FINISH}));
                //     }
                // });
            },
            '0xab': ({dataArray}) => {
                if (!!this._updateTool) {
                    const index = HexTools.hexArrayToNum(dataArray.slice(0, 2));
                    const data = this._updateTool.getDataByIndex({index});
                    this._blueToothManager.sendData({
                        buffer: this.protocolBody.createUpdateBuffer({
                            index,
                            data
                        })
                    }).then(() => {
                        if (index < this._updateTool.count - 1) {
                            clearTimeout(this._updatingTimeoutIndex);
                            this._updatingTimeoutIndex = setTimeout(() => {
                                blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.UPDATING}));
                            }, 1500);
                        } else {
                            setTimeout(() => {
                                blueToothManager.updateBLEStateImmediately(this.protocolBody.getOtherStateAndResultWithConnectedState({protocolState: CommonProtocolState.UPDATE_FINISH}));
                            }, 500);
                        }
                    });

                }
            }
        }
    }

    requireDeviceBind() {
        !this.getDeviceIsBind() && this.action['0x01']();
    }

    sendQueryDataRequiredProtocol() {
        if (this.getDeviceIsBind()) {
            const queryDataTimeoutIndex = setTimeout(() => {
                this.action['0x0a']();
            }, 200);
            this._protocolQueue.push(queryDataTimeoutIndex);
        }
    }

    sendData({command, data}) {
        return this._blueToothManager.sendData({buffer: this.createBuffer({command, data})});
    }

    sendQueryDataSuccessProtocol({isSuccess}) {
        if (this.getDeviceIsBind()) {
            this.action['0x0b']({isSuccess});
        }
    }

    startCommunication() {
        this.action['0x03']();
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

    clearSendProtocol() {
        let temp;
        while (temp = this._protocolQueue.pop()) {
            clearTimeout(temp);
        }
    }

    receive({receiveBuffer}) {
        return this.protocolBody.receive({action: this.action, receiveBuffer});
    }

    createBuffer({command, data}) {
        return this.protocolBody.createBuffer({command, data});
    }
}
