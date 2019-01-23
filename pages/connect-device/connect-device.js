// pages/connect-device/connect-device.js
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState, ProtocolState} from "../../modules/bluetooth/bluetooth-state";

const app = getApp();

Page({

    data: {
        isFlicker: false,
        state: {
            title: '将药盒靠近手机',
            content: '正在努力的寻找药盒…',
            backgroundColor: '#3E3E3E',
            navigationColor: '#3E3E3E',
            connectErr: false
        },
        content: [
            '手机未开启蓝牙',
            '手机未授权微信获取定位权限',
            '药盒离手机太远',
            '未在药盒上短按按键确认'
        ]
    },

    isBind: false,

    onLoad: function (options) {
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: this.data.state.navigationColor,
        });
        this.flickerHandle();
        app.getBLEManager().connect();
        app.setBLEListener({
            bleStateListener: ({state}) => {
                this.showResult({state: state.connectState});
            },
            receiveDataListener: ({finalResult, state}) => {
                if (ProtocolState.GET_CONNECTED_RESULT_SUCCESS === state.protocolState) {
                    this.isBind = true;
                    const {isConnected} = finalResult;
                    const manager = app.getBLEManager();
                    manager.updateBLEStateImmediately(manager.getState({
                        protocolState: ProtocolState.CONNECTED_AND_BIND,
                        connectState: ConnectState.CONNECTED
                    }));
                    setTimeout(() => isConnected && HiNavigator.switchToIndexPage({refresh: true}));
                }
            }
        });
    },

    onUnload() {
        !this.isBind && app.getBLEManager().clearConnectedBLE();
    },

    reConnectEvent() {
        app.getBLEManager().connect();
    },

    getResultState({state}) {
        switch (state) {
            case ConnectState.CONNECTING:
                return {
                    title: '将药盒靠近手机',
                    content: '正在努力的寻找药盒…',
                    backgroundColor: '#3E3E3E',
                    navigationColor: '#3E3E3E',
                    connectErr: false,
                    findBox: false
                };
            case ConnectState.UNAVAILABLE:
            case ConnectState.DISCONNECT:
            case ConnectState.UNBIND:
                this.isBind = false;
                app.getBLEManager().clearConnectedBLE();
                return {
                    connectErr: true,
                    navigationColor: '#66DABF',
                    backgroundColor: 'linear-gradient(#66DABF, #008290)',
                };
            default:
                return {
                    title: '药盒找到啦！',
                    content: '短按药盒按钮，绑定设备',
                    backgroundColor: 'linear-gradient(#66DABF, #008290)',
                    navigationColor: '#66DABF',
                    connectErr: false,
                    findBox: true,
                    delayTime: 2000
                };
        }
    },

    showResult({state}) {
        const resultState = this.getResultState({state});
        setTimeout(() => {
            this.setData({
                state: resultState,
                showReConnected: state === ConnectState.DISCONNECT || state === ConnectState.UNAVAILABLE
            });
            wx.setNavigationBarColor({
                frontColor: '#ffffff',
                backgroundColor: this.data.state.navigationColor,
            });
        }, resultState.delayTime || 0);

    },

    flickerHandle() {
        let num = 0;
        let timer = setInterval(() => {
            this.setData({
                isFlicker: !this.data.isFlicker
            });
            ++num;
            if (num === 6) {
                clearTimeout(timer);
            }
        }, 1000);
    }
})
