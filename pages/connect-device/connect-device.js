// pages/connect-device/connect-device.js
import HiNavigator from "../../navigator/hi-navigator";

const app = getApp();

Page({

    data: {
        backgroundColor: '#3E3E3E',
        isFlicker: false,
        index: 1,
        showContent: [
            {
                title: '将药盒靠近手机',
                content: '正在努力的寻找药盒…',
                backgroundColor: '#3E3E3E',
                navigationColor: '#3E3E3E'
            },
            {
                title: '药盒找到啦！',
                content: '短按药盒按钮',
                backgroundColor: 'linear-gradient(#66DABF, #008290)',
                navigationColor: '#66DABF'
            }
        ]
    },

    onLoad: function (options) {
        wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: this.data.showContent[this.data.index].navigationColor,
        });
        this.flickerHandle();
        app.getBLEManager().connect();
        app.setBLEListener({
            bleStateListener: ({state}) => {
                this.showResult({state: state.connectState});
            },
            receiveDataListener: ({finalResult, state}) => {
                if (BlueToothState.GET_CONNECTED_RESULT_SUCCESS === state) {
                    this.isBind = true;
                    const {isConnected} = finalResult;
                    app.getBLEManager().updateBLEStateImmediately({state: BlueToothState.CONNECTED_AND_BIND});
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
                    color: '#979797',
                    text: '正在寻找您的设备\n请将设备开机并靠近手机',
                    picPath: '../../images/device-bind/connecting.png'
                };
            case BlueToothState.UNAVAILABLE:
            case BlueToothState.DISCONNECT:
            case BlueToothState.UNBIND:
                this.isBind = false;
                app.getBLEManager().clearConnectedBLE();
                return {
                    color: '#979797',
                    text: '绑定失败，请检查后重试',
                    picPath: '../../images/device-bind/fail.png'
                };
            default:
                return {
                    color: '#FE5E01',
                    text: '已找到您的设备\n短按设备上的按键确认绑定',
                    picPath: '../../images/device-bind/connected.png'
                };
        }
    },

    showResult({state}) {
        this.setData({
            result: this.getResultState({state}),
            showReConnected: state === BlueToothState.DISCONNECT || state === BlueToothState.UNAVAILABLE
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
