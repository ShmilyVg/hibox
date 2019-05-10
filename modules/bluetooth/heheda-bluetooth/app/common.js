import "heheda-update";
import "heheda-adapter";

import {Login, UserInfo, Protocol} from "heheda-network";
import {CommonConnectState, CommonProtocolState} from "heheda-bluetooth-state";
import {listener} from "./listener";


const obj = {
    NOT_REGISTER: 'not_register',
    commonOnLaunch({options, bLEManager, needNetwork = true}) {
        needNetwork && this.doLogin();
        this.bLEManager = bLEManager;
        this.appIsConnected = false;
        this.bLEManager.setBLEListener({
            bleSignPowerListener: (hiDevices) => {
                const {localName, RSSI} = hiDevices[0];


            },
            receiveDataListener: ({finalResult, state}) => {
                if (CommonProtocolState.GET_CONNECTED_RESULT_SUCCESS === state.protocolState) {
                    const {isConnected, deviceId} = finalResult;
                    if (isConnected) {
                        if (needNetwork) {
                            !this.bLEManager.getBindMarkStorage() && Protocol.postDeviceBind({
                                deviceId,
                                mac: this.bLEManager.getDeviceMacAddress()
                            }).then(() => {
                                console.log('绑定协议发送成功');
                                this.bLEManager.setBindMarkStorage();
                                this.bLEManager.sendQueryDataRequiredProtocol();
                                this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({
                                    finalResult,
                                    state
                                });
                            }).catch((res) => {
                                console.log('绑定协议报错', res);
                                this._updateBLEState({state: {connectState: CommonConnectState.UNBIND}});
                            });
                        } else {
                            console.log('绑定成功，不需发送协议情况下');
                            this.bLEManager.setBindMarkStorage();
                            this.bLEManager.sendQueryDataRequiredProtocol();
                            this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({
                                finalResult,
                                state
                            });
                        }
                    } else {
                        this.bLEManager.clearConnectedBLE();
                    }
                } else {
                    this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({finalResult, state});
                }
            }, bleStateListener: ({state}) => {
                this.bLEManager.latestState = state;
                console.log('状态更新', state, 'isConnected:', this.appIsConnected);
                switch (state.connectState) {
                    case CommonConnectState.CONNECTED:
                        if (!this.appIsConnected) {
                            this.bLEManager.startProtocol();
                            this.appIsConnected = true;
                        }
                        break;
                    case CommonConnectState.CONNECTING:
                    case CommonConnectState.UNBIND:
                    case CommonConnectState.DISCONNECT:
                    case CommonConnectState.UNAVAILABLE:
                        this.appIsConnected = false;
                        break;

                }
                this._updateBLEState({state});
            }
        })
    },
    commonOnShow({options}) {
        setTimeout(() => {
            this.bLEManager.getBindMarkStorage() && this.bLEManager.connect();
        }, 800);
    },
    commonOnHide() {
        this.bLEManager.closeAll();
    },

    onGetUserInfo: null,

    getBLEManager() {
        return this.bLEManager;
    },

    setCommonBLEListener({commonAppReceiveDataListener, commonAppBLEStateListener}) {
        this.commonAppReceiveDataListener = commonAppReceiveDataListener;
        this.commonAppBLEStateListener = commonAppBLEStateListener;
    },

    getLatestBLEState() {
        return this.bLEManager.getLatestState();
    },

    _updateBLEState({state}) {
        this.commonAppBLEStateListener && this.commonAppBLEStateListener({state});
    },

    doLogin() {
        setTimeout(() =>
            Login.doLogin()
                .catch((res) => {
                    if (!!res.data && res.data.code === 2) {
                        this.appLoginListener && this.appLoginListener({loginState: this.NOT_REGISTER});
                    }
                })
                .then(() => UserInfo.get())
                .then(({userInfo}) => {
                    this.onGetUserInfo && this.onGetUserInfo({userInfo});
                }));
    },
};

const common = {...obj, ...listener};

export {common};
