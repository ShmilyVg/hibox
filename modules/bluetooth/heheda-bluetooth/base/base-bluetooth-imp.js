import AbstractBlueTooth from "./abstract-bluetooth";
import {CommonConnectState} from "heheda-bluetooth-state";
import {ErrorState} from "../utils/error-state";

/**
 * 蓝牙核心业务的封装
 */
export default class BaseBlueToothImp extends AbstractBlueTooth {

    constructor() {
        super();
        this._scanBLDListener = null;
        this._bleStateListener = null;
        this._bleSignPowerListener = null;
        this._errorTimeoutIndex = 0;
        let that = this;
        const action = function () {
            console.log('执行统一重连action', this.type, '是否处于升级状态', getApp().isOTAUpdate);
            clearTimeout(that._errorTimeoutIndex);
            if (!getApp().isOTAUpdate) {
                that._errorTimeoutIndex = setTimeout(() => {
                    if (!that._isActiveCloseBLE) {
                        that.closeAdapter().then(() => that.openAdapterAndStartBlueToothDeviceDiscovery())
                    } else {
                        that._bleStateListener(that.getState({connectState: this.type}));
                    }
                }, 500);
            }
        };
        this.errorType = {
            '-1': {
                errMsg: 'createBLEConnection:fail:already connect', type: CommonConnectState.CONNECTED,
            },
            '10000': {
                errMsg: 'closeBLEConnection:fail:not init', type: CommonConnectState.UNAVAILABLE,
                action
            },
            '10001': {
                errMsg: '', type: CommonConnectState.UNAVAILABLE,
            },
            '10003': {
                errMsg: '', type: CommonConnectState.DISCONNECT,
                action
            },
            '10005': {
                errMsg: '获取特征值失败:fail', type: CommonConnectState.DISCONNECT,
                action
            },
            '10006': {
                errMsg: 'closeBLEConnection:fail:no connection', type: CommonConnectState.DISCONNECT,
                action
            },
            '10009': {
                errMsg: 'Android System not support', type: CommonConnectState.NOT_SUPPORT
            },
            '10012': {
                errMsg: 'createBLEConnection:fail:operate time out',
                type: CommonConnectState.DISCONNECT,
                action
            }
        };
        this.errorType[ErrorState.DISCOVER_TIMEOUT.errorCode] = ErrorState.DISCOVER_TIMEOUT;
        this.deviceFindTimeoutIndex = 0;
        wx.onBluetoothAdapterStateChange((res) => {
            console.log('适配器状态changed, now is', res, '是否处于升级状态', getApp().isOTAUpdate);
            if (getApp().isOTAUpdate) {
                this._adapterStateListener && this._adapterStateListener(res);
                return;
            }
            if (!res.available) {
                this._isConnected = false;
                this.isBluetoothAdapterClose = true;
                super.closeAdapter().finally(() => this._bleStateListener(this.getState({connectState: CommonConnectState.UNAVAILABLE})));
            } else if (res.available) {
                !res.discovering && !this._isActiveCloseDiscovery && this.openAdapterAndStartBlueToothDeviceDiscovery();
                this.isBluetoothAdapterClose = false;
            }
        });

        wx.onBLEConnectionStateChange((res) => {
            // 该方法回调中可以用于处理连接意外断开等异常情况
            console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}, _isConnected: ${this._isConnected}, _isActiveCloseBLE: ${this._isActiveCloseBLE} 是否处于OTA升级：${getApp().isOTAUpdate}`);
            if (getApp().isOTAUpdate) {
                this._connectionStateListener && this._connectionStateListener(res);
                return;
            }
            this._isConnected = res.connected;
            if (!res.connected) {
                this._bleStateListener(this.getState({connectState: CommonConnectState.DISCONNECT}));
                if (!this._isActiveCloseBLE) {
                    this.openAdapterAndConnectLatestBLE();
                } else {
                    this._isActiveCloseBLE = false;
                }
            }
        });
        wx.onBluetoothDeviceFound((res) => {
            this.baseDeviceFindAction(res);
        });
    }

    baseDeviceFindAction(res) {
        console.log('开始扫描');
        if (!!this._scanBLDListener) {
            this._scanBLDListener(res);
        } else {
            clearTimeout(this.deviceFindTimeoutIndex);
            this.deviceFindTimeoutIndex = setTimeout(() => {
                super.getBlueToothDevices().then(res => {
                    const {devices} = res;
                    // console.log('发现新的蓝牙设备', devices);
                    if (devices.length > 0) {
                        if (!!this._deviceId) {
                            const deviceBind = devices.filter(item => this._deviceId === item.deviceId);
                            console.log('找到设备', this._deviceId, deviceBind);
                            if (!!deviceBind.length) {
                                this._updateFinalState({
                                    promise: this.createBLEConnection({deviceId: deviceBind[0].deviceId})
                                });
                            }
                        } else {
                            this._bleSignPowerListener && this._bleSignPowerListener(devices.filter(item => item.localName.toUpperCase().indexOf('PB1-') !== -1));
                            const device = devices.reduce((prev, cur) => prev.RSSI > cur.RSSI ? prev : cur);
                            // console.log('要连接的设备', device);
                            if (!this._deviceId && device.localName && device.localName.toUpperCase().indexOf('PB1-') !== -1) {
                                this._updateFinalState({
                                    promise: this.createBLEConnection({deviceId: device.deviceId})
                                });
                            }
                        }
                    }
                }).catch();
            }, 200);
        }
    }

    setBLEUpdateListener({scanBLEListener, connectionStateListener, adapterStateListener, receiveDataListener}) {
        this._scanBLDListener = scanBLEListener;
        this._connectionStateListener = connectionStateListener;
        this._adapterStateListener = adapterStateListener;
        this._receiveDataOutsideistener = receiveDataListener;
    }

    /**
     * 设置蓝牙行为的监听
     * @param receiveDataListener 必须设置
     * @param bleStateListener 必须设置
     * @param scanBLEListener 不必须设置 如果没有设置该监听，则在扫描蓝牙设备后，会自动连接距离手机最近的蓝牙设备；否则，会返回扫描到的所有设备
     */
    setBLEListener({receiveDataListener, bleStateListener, scanBLEListener, bleSignPowerListener}) {
        this._receiveDataListener = receiveDataListener;
        this._bleStateListener = bleStateListener;
        this._scanBLDListener = scanBLEListener;
        this._bleSignPowerListener = bleSignPowerListener;
    }

    /**
     * 打开蓝牙适配器并扫描蓝牙设备，或是试图连接上一次的蓝牙设备
     * 通过判断this._deviceId来确定是否为首次连接。
     * 如果是第一次连接，则需要开启蓝牙扫描，通过uuid过滤设备，来连接到对应的蓝牙设备，
     * 如果之前已经连接过了，则这次会按照持久化的deviceId直接连接
     * @returns {*}
     */
    openAdapterAndConnectLatestBLE({macId} = {}) {
        !!macId && this.setDeviceMacAddress({macId});
        console.log('deviceId', this._deviceId || 'undefined', '当前是否已连接', this._isConnected);

        if (this._isConnected) {
            return new Promise((resolve) => resolve);
        }
        return !this._bleStateListener(this.getState({connectState: CommonConnectState.CONNECTING}))
            && this._updateFinalState({
                promise: this.openAdapter().then(() =>
                    // !!this._deviceId && !this.isBluetoothAdapterClose ?
                    //     this.createBLEConnection({deviceId: this._deviceId}).catch((res) => {
                    //         console.log('连接失败', res);
                    //         return this.startBlueToothDevicesDiscovery();
                    //     }) :
                    this.startBlueToothDevicesDiscovery()
                )
            });
    }

    openAdapterAndStartBlueToothDeviceDiscovery() {
        return !this._bleStateListener(this.getState({connectState: CommonConnectState.CONNECTING}))
            && this._updateFinalState({
                promise: this.openAdapter().then(() => this.startBlueToothDevicesDiscovery())
            });
    }

    /**
     * 断开蓝牙连接
     * @returns {*}
     */
    closeBLEConnection() {
        return this._updateFinalState({promise: super.closeBLEConnection()});
    }

    updateBLEState({state}) {
        return this._bleStateListener({state});
    }

    getState({connectState, protocolState}) {
        return {state: {connectState, protocolState}};
    }

    /**
     * 更新蓝牙设备的连接状态，该函数私有
     * 更新状态意味着，最终会回调setBLEListener中传入的bleStateListener函数，
     * 并会在bleStateListener的参数state中接收到对应的状态值
     * 状态值均定义在BaseBlueToothImp中
     * @param promise
     * @returns {Promise<T | never>}
     * @private
     */
    _updateFinalState({promise}) {
        return promise.then(({isConnected = false} = {}) => {
            if (!isConnected) {
                return;
            }
            this._bleStateListener(this.getState({connectState: CommonConnectState.CONNECTED}));
        })
            .catch((res) => {
                console.log('蓝牙连接异常', res, '是否处于升级状态', getApp().isOTAUpdate);
                if (!getApp().isOTAUpdate) {
                    const errorFun = this.errorType[res.errCode];
                    if (!!errorFun) {
                        if (!!errorFun.action) {
                            errorFun.action();
                        } else {
                            this._bleStateListener(this.getState({connectState: errorFun.type}));
                        }
                    } else {
                        this._bleStateListener(this.getState({connectState: CommonConnectState.DISCONNECT}));
                    }
                }
            });
    }
}
