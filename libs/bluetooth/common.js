import Login from "../../modules/network/login";
import UserInfo from "../../modules/network/userInfo";
import HiBlueToothManager from "../../modules/bluetooth/hi-bluetooth-manager";
import Protocol from "../../modules/network/protocol";

const obj = {
    commonOnLaunch(options) {
        this.doLogin();
        this.bLEManager = new HiBlueToothManager();
        this.bLEManager.setBLEListener({
            receiveDataListener: ({finalResult, state}) => {
                if (BlueToothState.GET_CONNECTED_RESULT_SUCCESS === state.protocolState) {
                    const {isConnected, deviceId} = finalResult;
                    if (isConnected) {
                        !this.bLEManager.getBindMarkStorage() && Protocol.postDeviceBind({deviceId}).then(() => {
                            console.log('绑定协议发送成功');
                            this.bLEManager.setBindMarkStorage();
                            this.commonAppReceiveDataListener && this.commonAppReceiveDataListener({finalResult, state});
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

    commonOnHide() {
        this.bLEManager.closeAll();
    },

    onGetUserInfo: null,

    getBLEManager() {
        return this.bLEManager;
    },

    setCommonBLEListener({appReceiveDataListener, appBLEStateListener}) {
        this.commonAppReceiveDataListener = appReceiveDataListener;
        this.commonAppBLEStateListener = appBLEStateListener;
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

export {obj as common};
