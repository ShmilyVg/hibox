// pages/connect-device/connect-device.js
import HiNavigator from "../../navigator/hi-navigator";
import BlueToothProtocol from "../../modules/bluetooth/base/bluetooth-protocol";
import BlueToothState from "../../modules/bluetooth/state-const";

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
                if (BlueToothProtocol.GET_CONNECTED_RESULT_SUCCESS === state.protocolState) {
                    this.isBind = true;
                    const {isConnected} = finalResult;
                    app.getBLEManager().updateBLEStateImmediately({state: BlueToothProtocol.getState({protocolState: BlueToothProtocol.CONNECTED_AND_BIND})});
                    isConnected && HiNavigator.switchToIndexPage({refresh: false});
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

    isBind: false,

    getResultState({state}) {
        switch (state) {
            case BlueToothState.CONNECTING:
                return {
                    title: '将药盒靠近手机',
                    content: '正在努力的寻找药盒…',
                    backgroundColor: '#3E3E3E',
                    navigationColor: '#3E3E3E',
                    connectErr: false
                };
            case BlueToothState.UNAVAILABLE:
            case BlueToothState.DISCONNECT:
            case BlueToothState.UNBIND:
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
                    content: '短按药盒按钮',
                    backgroundColor: 'linear-gradient(#66DABF, #008290)',
                    navigationColor: '#66DABF',
                    connectErr: false
                };
        }
    },

    showResult({state}) {
        this.setData({
            state: this.getResultState({state}),
            showReConnected: state === BlueToothState.DISCONNECT || state === BlueToothState.UNAVAILABLE
        });
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: this.data.state.navigationColor,
        });
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
