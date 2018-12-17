import Login from "../../modules/network/login";
import UserInfo from "../../modules/network/userInfo";
import Protocol from "../../modules/network/protocol";
import BlueToothState from "../../modules/bluetooth/state-const";
import {listener} from "./listener";

const obj = {
    commonOnLaunch({options, bLEManager}) {
        this.doLogin();
        this.bLEManager = bLEManager;
        this.bLEManager.setBLEListener({
            receiveDataListener: ({finalResult, state}) => {
                if (BlueToothState.GET_CONNECTED_RESULT_SUCCESS === state.protocolState) {
                    const {isConnected, deviceId} = finalResult;
                    if (isConnected) {
                        !this.bLEManager.getBindMarkStorage() && Protocol.postDeviceBind({deviceId}).then(() => {
                            console.log('绑定协议发送成功');
                            this.bLEManager.setBindMarkStorage();
                            this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({
                                finalResult,
                                state
                            });
                        }).catch((res) => {
                            console.log('绑定协议报错', res);
                            this._updateBLEState({state: {connectState: BlueToothState.UNBIND}});
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
                    case BlueToothState.CONNECTED:
                        this.bLEManager.startProtocol();
                        break;
                    case BlueToothState.UNBIND:
                    case BlueToothState.DISCONNECT:
                    case BlueToothState.UNAVAILABLE:
                        this.bLEManager.setFilter(true);
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
