import Login from "../../../modules/network/login";
import UserInfo from "../../../modules/network/userInfo";
import Protocol from "../../../modules/network/protocol";
import {ConnectState, ProtocolState} from "../../../modules/bluetooth/bluetooth-state";
import {listener} from "./listener";

const obj = {
    commonOnLaunch({options, bLEManager}) {
        this.doLogin();
        this.bLEManager = bLEManager;
        let isConnected = false;
        this.bLEManager.setBLEListener({
            receiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.GET_CONNECTED_RESULT_SUCCESS === state.protocolState) {
                    const {isConnected, deviceId} = finalResult;
                    if (isConnected) {
                        !this.bLEManager.getBindMarkStorage() && Protocol.postDeviceBind({
                            deviceId,
                            mac: this.bLEManager.getDeviceMacAddress()
                        }).then(() => {
                            console.log('绑定协议发送成功');
                            this.bLEManager.setBindMarkStorage();
                            this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({
                                finalResult,
                                state
                            });
                        }).catch((res) => {
                            console.log('绑定协议报错', res);
                            this._updateBLEState({state: {connectState: ConnectState.UNBIND}});
                        });
                    } else {
                        this.bLEManager.clearConnectedBLE();
                    }
                } else {
                    this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({finalResult, state});
                }
            }, bleStateListener: ({state}) => {
                this.bLEManager.latestState = state;
                console.log('状态更新', state);
                switch (state.connectState) {
                    case ConnectState.CONNECTED:
                        if (!isConnected) {
                            this.bLEManager.startProtocol();
                            isConnected = true;
                        }
                        break;
                    case ConnectState.UNBIND:
                    case ConnectState.DISCONNECT:
                    case ConnectState.UNAVAILABLE:
                        this.bLEManager.setFilter(true);
                        isConnected = false;
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
        setTimeout(() => Login.doLogin().then(() => UserInfo.get()).then(({userInfo}) => {
            this.onGetUserInfo && this.onGetUserInfo({userInfo});
        }));
    },
};

const common = {...obj, ...listener};

export {common};
