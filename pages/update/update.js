// pages/update/update.js
import HiNavigator from "../../navigator/hi-navigator";
import {Toast} from "heheda-common-view";

const app = getApp();

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
    const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2)
        }
    );
    return hexArr.join('');
}

Page({
    data: {
        isUpdate: true
    },
    platform: '',
    dfuDeviceLocalName: 'HiBoxDfuTarg',
    stepIntoOTA: false,
    writeEnableAndOTAServiceId: "0000FE95-0000-1000-8000-00805F9B34FB",
    writeEnableOTACharacteristicId: "8EC90003-F315-4F60-9FB8-838830DAEA50",
    dataPointCharacteristicId: "8EC90002-F315-4F60-9FB8-838830DAEA50",
    controlPointCharacteristicId: "8EC90001-F315-4F60-9FB8-838830DAEA50",
    openBluetoothAdapter(uuidArray) {
        wx.openBluetoothAdapter({
            success: (res) => {
                console.log('openBluetoothAdapter success', res)
                this.startBluetoothDevicesDiscovery(uuidArray)
            },
            fail: (res) => {
                if (res.errCode === 10001) {
                    wx.onBluetoothAdapterStateChange(function (res) {
                        console.log('onBluetoothAdapterStateChange', res)
                        if (res.available) {
                            this.startBluetoothDevicesDiscovery(uuidArray)
                        }
                    })
                }
            }
        })
    },

    closeBluetoothAdapter() {
        return new Promise((resolve, reject) => {
            wx.closeBluetoothAdapter({success: resolve, fail: reject});
        })
    },
    startBluetoothDevicesDiscovery(uuidArray) {
        if (this._discoveryStarted) {
            return
        }
        this._discoveryStarted = true;
        wx.startBluetoothDevicesDiscovery({
            // allowDuplicatesKey: true,
            services: uuidArray,
            success: (res) => {
                console.log('startBluetoothDevicesDiscovery success', res)
                this.onBluetoothDeviceFound();
            },
        })
    },
    stopBluetoothDevicesDiscovery() {
        return new Promise((resolve, reject) => {
            wx.stopBluetoothDevicesDiscovery({
                success: () => {
                    console.log('关闭扫描，wx.stopBluetoothDevicesDiscovery()');
                    this._discoveryStarted = false;
                    resolve();
                }, fail: reject
            });
        })
    },

    getDfuDeviceFoundTag({deviceId, localOTADeviceId, localName}) {
        if (this.platform === 'android') {
            return deviceId.toUpperCase().split(':').join('') === localOTADeviceId;
        } else {
            return localName === this.dfuDeviceLocalName;
        }
    },

    onBluetoothDeviceFound() {
        const localDeviceId = app.getBLEManager().getDeviceMacAddress();
        const localOTADeviceId = (parseInt(localDeviceId.split(':').join(''), 16) + 1).toString(16).toUpperCase();
        console.log('平台是否是Android：', this.platform);
        app.getBLEManager().setBLEUpdateListener({
            scanBLEListener: (res) => {
                res.devices.forEach(device => {
                    const {deviceId, localName} = device;
                    console.log('扫描到的设备', deviceId, localName);
                    if (!this.stepIntoOTA && deviceId === localDeviceId) {//这是第一阶段
                        console.log('使能阶段要连接的设备名字', localName);
                        this.createBLEConnection({deviceId, stopDiscovery: true}).then(() => {
                            return this.getBLEDeviceServices(deviceId).then(this.send01OTACommand);
                        }).catch(res => {
                            console.log('使能阶段要连接的设备失败', res);
                            this.updateFailAction();
                        });
                    } else if (this.getDfuDeviceFoundTag({deviceId, localOTADeviceId, localName})) {
                        console.log('ota阶段要连接的设备名字', localName);
                        this.createBLEConnection({deviceId, stopDiscovery: true}).then(() => {
                            return this.getBLEDeviceServices(deviceId).then(this.sendDatStartCommand);
                        }).catch(res => {
                            console.log('ota阶段要连接的设备失败', res);
                            this.updateFailAction();
                        });
                    }
                });
            },
            receiveDataListener: (characteristic) => {
                // const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
                const value = ab2hex(characteristic.value);
                console.log('收到数据的信息', value, this.datDataArrayBufferObj.index, this.binDataArrayBufferObj.index);

                if (value) {
                    const valueLower = value.toLowerCase();
                    if (valueLower.slice(4, 6) !== '01') {//第三组不是01的话，意为升级失败
                        this.updateFailAction();
                        return;
                    }
                    if (valueLower.indexOf('600601') !== -1) {//接收到数据回复
                        setTimeout(() => {
                            if (this.step === 1) {
                                let buffer02 = new ArrayBuffer(3);
                                let dataView02 = new DataView(buffer02);
                                dataView02.setUint8(0, 2);
                                dataView02.setUint8(1, 7);
                                dataView02.setUint8(2, 0);
                                this.sendDataToControlPoint(buffer02).then(() => {
                                    console.log("发送包020100成功");
                                    this.sendDfuCreateObjCommand(1, this.datDataArrayBufferObj.arrayBuffer.byteLength).then(({buffer}) => {
                                        console.log("发送包0601的大小成功，发送的数据", ab2hex(buffer));
                                    });
                                });

                            } else if (this.step === 2) {
                                console.log('预备开始发送第二阶段的0102');
                                setTimeout(() => {
                                    this.sendDfuCreateObjCommand(2, this.binDataArrayBufferObj.arrayBuffer.byteLength).then(({buffer}) => {
                                        console.log("发送包0102的大小成功，发送的数据：", ab2hex(buffer), '第二阶段第几次发包：', this.step - 1);
                                    });
                                }, 50);
                            }
                        }, 50);
                    } else if (valueLower.indexOf('600101') !== -1) {
                        setTimeout(() => {
                            if (this.step === 1) {
                                this.sendUpdateData(this.datDataArrayBufferObj)
                            } else if (this.step >= 2) {
                                this.sendUpdateData(this.binDataArrayBufferObj, true);
                            }
                        }, 50);

                    } else if (valueLower.indexOf('600401') !== -1) {//开始传输固件
                        setTimeout(() => {
                            this.step++;
                            if (this.step >= 2) {
                                if (this.step === 2) {
                                    this.sendBinStartCommand();
                                } else {
                                    this.putNewSendBinData(this.binDataArrayBufferObj);
                                    if (this.binDataArrayBufferObj.arrayBuffer && this.binDataArrayBufferObj.arrayBuffer.byteLength) {
                                        this.sendDfuCreateObjCommand(2, this.binDataArrayBufferObj.arrayBuffer.byteLength).then(({buffer}) => {
                                            console.log("发送包0102的大小成功，发送的数据：", ab2hex(buffer), '第二阶段第几次发包：', this.step - 1);
                                        });
                                    } else {
                                        console.log('第二阶段全部完成');
                                        this.whenUpdateFinished().then(() => this.updateSuccessAction());
                                    }
                                }

                            }
                        }, 50);
                    } else if (valueLower.indexOf('200101') !== -1) {
                        this.stepIntoOTA = true;
                        setTimeout(() => {
                            this.closeBLEConnection().finally(() => {
                                this.closeBluetoothAdapter().finally(() => {
                                    this.openBluetoothAdapter(['fe59']);
                                })
                            });
                        }, 500);
                    } else if (valueLower.indexOf('60030187000000') !== -1) {//第一完成阶段
                        this.send04Command();
                    }
                }
            }
        });
    },
    deviceIds: [],
    createBLEConnection({deviceId, stopDiscovery = true}) {
        return new Promise((resolve, reject) => {
            wx.createBLEConnection({
                deviceId,
                timeout: 30000,
                success: () => {
                    this.deviceIds.push(deviceId);
                    stopDiscovery && this.stopBluetoothDevicesDiscovery();
                    resolve();
                },
                fail: reject
            });
        });
    },
    closeBLEConnection() {
        return new Promise((resolve, reject) => {
            wx.closeBLEConnection({
                deviceId: this.deviceIds.shift(),
                success: resolve,
                fail: reject
            });
        })
    },
    getBLEDeviceServices(deviceId) {
        return new Promise((resolve, reject) => {
            wx.getBLEDeviceServices({
                deviceId,
                success: (res) => {
                    console.log('getBLEDeviceServices success', res);
                    for (let i = 0; i < res.services.length; i++) {
                        const service = res.services[i];
                        if (service.isPrimary && service.uuid.toLowerCase().indexOf('0000fe59') !== -1) {
                            return this.getBLEDeviceCharacteristics(deviceId, service.uuid).then(resolve).catch(reject);
                        }
                    }
                }, fail: (res) => {
                    console.log('getBLEDeviceServices fail', res, deviceId);
                    reject(res);
                }
            })
        });
    },

    getBLEDeviceCharacteristics(deviceId, serviceId) {
        return new Promise((resolve, reject) => {
            wx.getBLEDeviceCharacteristics({
                deviceId,
                serviceId,
                success: (res) => {
                    console.log('getBLEDeviceCharacteristics success', res.characteristics);
                    for (let i = 0; i < res.characteristics.length; i++) {
                        let item = res.characteristics[i];
                        if (item.properties.read) {
                            wx.readBLECharacteristicValue({
                                deviceId,
                                serviceId,
                                characteristicId: item.uuid,
                            });
                        }
                        if (item.properties.write) {
                            this._deviceId = deviceId;
                            this._serviceId = serviceId;
                        }
                        if (item.properties.notify || item.properties.indicate) {
                            wx.notifyBLECharacteristicValueChange({
                                deviceId,
                                serviceId,
                                characteristicId: item.uuid,
                                state: true,
                            })
                        }
                    }
                    resolve();
                },
                fail(res) {
                    console.error('getBLEDeviceCharacteristics fail', res, deviceId, serviceId);
                    reject();
                }
            });
        });
    },

    sendDatStartCommand() {
        this.sendStartCommand({command: 1});
    },

    sendBinStartCommand() {
        let buffer = new ArrayBuffer(3);
        let dataView = new DataView(buffer);
        const high = parseInt(this.binDataArrayBufferObj.count / 16);
        const low = parseInt(this.binDataArrayBufferObj.count % 16);
        dataView.setUint8(0, 2);
        dataView.setUint8(1, low);
        dataView.setUint8(2, high);
        this.sendDataToControlPoint(buffer).then(() => {
            console.log('第二阶段前发送02成功 本次发送数据：', ab2hex(buffer));
            this.sendStartCommand({command: 2});
        });
    },

    sendDfuCreateObjCommand(command, byteLength) {
        let buffer = new ArrayBuffer(6);
        let dataView = new DataView(buffer);
        const high = byteLength / 256;
        const low = byteLength % 256;
        dataView.setUint8(0, 1);
        dataView.setUint8(1, command);
        dataView.setUint8(2, low);
        dataView.setUint8(3, high);
        dataView.setUint8(4, 0);
        dataView.setUint8(5, 0);
        return this.sendDataToControlPoint(buffer);
    },
    sendStartCommand({command}) {
        let buffer = new ArrayBuffer(2);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 6);
        dataView.setUint8(1, command);
        this.sendDataToControlPoint(buffer);
    },

    send01OTACommand() {
        let buffer = new ArrayBuffer(1);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 1);
        return this.sendDataToPoint(buffer, this.writeEnableOTACharacteristicId).then(() => {
            console.log('使能成功');
        }).catch(() => this.send01OTACommand());
    },
    send04Command() {
        let buffer = new ArrayBuffer(1);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 4);
        return this.sendDataToControlPoint(buffer).catch(() => this.send04Command());
    },

    sendUpdateData(dataArrayBufferObj, isContinue) {
        const {arrayBuffer: updateArrayBuffer, arrayBuffer: {byteLength}, index} = dataArrayBufferObj;
        if (updateArrayBuffer && byteLength > index) {
            const currentBuffer = updateArrayBuffer.slice(index, index + 20);
            this.sendDataToDataPoint(currentBuffer).then(() => {
                dataArrayBufferObj.index += currentBuffer.byteLength;
                this.sendUpdateData(dataArrayBufferObj, isContinue);
            }).catch((res) => {
                console.log('升级发生错误 index=', index, res);
                this.sendUpdateData(dataArrayBufferObj, isContinue);
            });
        } else {
            console.log('升级包发送完成 index=', index);
            if (isContinue) {
                this.send04Command().catch((res) => console.log('发送04指令出错', res));
            }
        }
    },

    sendDataToDataPoint(buffer) {
        return this.sendDataToPoint(buffer, this.dataPointCharacteristicId);
    },
    sendDataToControlPoint(buffer) {
        return this.sendDataToPoint(buffer, this.controlPointCharacteristicId);
    },
    putNewSendBinData(obj) {
        obj.arrayBuffer = obj.array.shift();
        obj.index = 0;
    },
    step: 1,
    binDataArrayBufferObj: {arrayBuffer: null, index: 0, array: [], count: 0},
    datDataArrayBufferObj: {arrayBuffer: null, index: 0},
    onLoad() {
        !app.isOTAUpdate && app.getBLEManager().closeAll().finally(() => {
            app.isOTAUpdate = true;
            app.appIsConnected = false;
            wx.setKeepScreenOn({
                keepScreenOn: true
            });
            this.fileSystemManager = wx.getFileSystemManager();
            const {binUrl, datUrl} = getApp().otaUrl;
            wx.getSystemInfo({
                success: (res) => {
                    this.platform = res.platform.toLowerCase();
                }
            });
            wx.downloadFile({
                // 示例 url，并非真实存在
                url: binUrl,
                success: (res) => {
                    const filePath = res.tempFilePath;
                    console.log('文件bin下载成功', res);
                    this.fileSystemManager.readFile({
                        filePath,
                        success: res => {
                            const arrayBuffer = res.data;
                            this.binDataArrayBufferObj.array = [];
                            this.binDataArrayBufferObj.count = Math.ceil(arrayBuffer.byteLength / 4096);
                            for (let i = 0, len = this.binDataArrayBufferObj.count; i < len; i++) {
                                this.binDataArrayBufferObj.array.push(arrayBuffer.slice(4096 * i, 4096 * (i + 1)));
                            }

                            this.putNewSendBinData(this.binDataArrayBufferObj);
                            console.log('读取bin设备固件成功', this.binDataArrayBufferObj);

                            wx.downloadFile({
                                // 示例 url，并非真实存在
                                url: datUrl,
                                success: (res) => {
                                    const filePath = res.tempFilePath;
                                    console.log('文件dat下载成功', res);
                                    this.fileSystemManager.readFile({
                                        filePath,
                                        success: res => {
                                            this.datDataArrayBufferObj.arrayBuffer = res.data;
                                            this.datDataArrayBufferObj.index = 0;

                                            console.log('读取dat设备固件成功', this.datDataArrayBufferObj);
                                            this.openBluetoothAdapter(['0000180A-0000-1000-8000-00805F9B34FB']);

                                        }, fail: res => {
                                            console.log('读取dat设备固件失败', res);
                                        }
                                    });
                                }
                            })
                        }, fail: res => {
                            console.log('读取bin设备固件失败', res);
                        }
                    });
                }
            });


        });

    },

    sendDataToPoint(buffer, characteristicId) {
        return new Promise((resolve, reject) => setTimeout(() => {
            wx.writeBLECharacteristicValue({
                deviceId: this._deviceId,
                serviceId: this._serviceId,
                characteristicId,
                value: buffer,
                success: () => {
                    resolve({buffer});
                },
                fail: (res) => {
                    if (res.errCode === 10008) {
                        reject();
                    } else {
                        this.updateFailAction();
                    }
                }
            })
        }, 3));
    },

    toUse() {
        this.backToIndexPage('正在应用...');
    },
    updateSuccessAction() {
        this.setData({isUpdate: false});
    },
    whenUpdateFinished() {
        return new Promise((resolve) => {
            this.closeBLEConnection().finally(() => {
                this.closeBluetoothAdapter().finally(() => {
                    console.log('蓝牙连接关闭，可以进入正常使用阶段');
                    resolve();
                })
            })
        });
    },
    updateFailAction() {
        this.data.isUpdate && this.backToIndexPage('升级失败，回退');
    },
    backToIndexPage(text) {
        Toast.showLoading(text);
        app.isOTAUpdate = false;
        const bleManager = app.getBLEManager();
        bleManager.setBLEUpdateListener({scanBLEListener: null, receiveDataListener: null});
        bleManager.closeAll().finally(() => {
            bleManager.connect();
        });
        setTimeout(() => {
            Toast.hiddenLoading();
            HiNavigator.switchToIndexPage({refresh: true});
        }, 3000);
    },
    onHide() {
        this.isWhenUpdateHidden = true;
        this.whenUpdateFinished();
    },

    onShow() {
        if (this.isWhenUpdateHidden) {
            this.updateFailAction();
        }
    },
    onUnload() {
        this.isWhenUpdateHidden = false;
        wx.setKeepScreenOn({
            keepScreenOn: false
        });
    }
});
