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
    isGreen: false,

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
    onBluetoothDeviceFound() {
        const localDeviceId = app.getBLEManager().getDeviceMacAddress();
        const localOTADeviceId = (parseInt(localDeviceId.split(':').join(''), 16) + 1).toString(16).toUpperCase();
        app.getBLEManager().setDeviceFindAction((res) => {
            res.devices.forEach(device => {
                const {deviceId, localName} = device;
                console.log('扫描到的设备', deviceId, localName);
                if (!this.stepIntoOTA && deviceId === localDeviceId) {//这是第一阶段
                    console.log('使能阶段要连接的设备名字', localName);
                    this.createBLEConnection({deviceId, stopDiscovery: true}).then(() => {
                        this.getBLEDeviceServices(deviceId);
                        setTimeout(() => {
                            this.send01OTACommand();
                        }, 500);
                    }).catch(res => {
                        console.log('使能阶段要连接的设备失败', res);
                    });
                } else if (deviceId.toUpperCase().split(':').join('') === localOTADeviceId) {
                    console.log('ota阶段要连接的设备名字', localName);
                    this.createBLEConnection({deviceId, stopDiscovery: true}).then(() => {
                        this.getBLEDeviceServices(deviceId);
                        setTimeout(() => {
                            this.sendDatStartCommand();
                        }, 500);
                    }).catch(res => {
                        console.log('ota阶段要连接的设备失败', res);
                    });
                }
            })
        });
    },
    deviceIds: [],
    createBLEConnection({deviceId, stopDiscovery = true}) {
        return new Promise((resolve, reject) => {
            wx.createBLEConnection({
                deviceId,
                success: () => {
                    this.deviceIds.push(deviceId);
                    stopDiscovery && this.stopBluetoothDevicesDiscovery();
                    resolve();
                },
                fail: reject
            })
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
        wx.getBLEDeviceServices({
            deviceId,
            success: (res) => {
                console.log('服务', res);
                for (let i = 0; i < res.services.length; i++) {
                    if (res.services[i].isPrimary) {
                        // if (this.stepIntoOTA) {
                        //     this.getBLEDeviceCharacteristics(deviceId, this.writeEnableAndOTAServiceId);
                        //     return;
                        // }else{
                        this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid);
                        return
                        // }
                    }
                }
            }
        })
    },

    getBLEDeviceCharacteristics(deviceId, serviceId) {
        wx.getBLEDeviceCharacteristics({
            deviceId,
            serviceId,
            success: (res) => {
                console.log('getBLEDeviceCharacteristics success', res.characteristics)
                for (let i = 0; i < res.characteristics.length; i++) {
                    let item = res.characteristics[i]
                    if (item.properties.read) {
                        wx.readBLECharacteristicValue({
                            deviceId,
                            serviceId,
                            characteristicId: item.uuid,
                        })
                    }
                    if (item.properties.write) {
                        this._deviceId = deviceId
                        this._serviceId = serviceId
                        this._characteristicId = item.uuid
                        console.log('写次数', this._characteristicId);
                        // this.writeBLECharacteristicValue()
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
            },
            fail(res) {
                console.error('getBLEDeviceCharacteristics', res)
            }
        })
        // 操作之前先监听，保证第一时间获取数据
        wx.onBLECharacteristicValueChange((characteristic) => {
            // const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
            const value = ab2hex(characteristic.value);
            console.log('收到数据的信息', value, this.datDataArrayBufferObj.index, this.binDataArrayBufferObj.index);

            if (value) {
                const valueLower = value.toLowerCase();
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
                                this.sendDfuCreateObjCommand(1, this.datDataArrayBufferObj.arrayBuffer.byteLength).then(() => {
                                    console.log("发送包0601的大小成功");
                                });
                            });

                        } else if (this.step === 2) {
                            console.log('预备开始发送第二阶段的0102');
                            setTimeout(() => {
                                this.sendDfuCreateObjCommand(2, this.binDataArrayBufferObj.arrayBuffer.byteLength).then(() => {
                                    console.log("发送包0102的大小成功,发送的数据：", ab2hex(buffer), '第二阶段第几次发包：', this.step - 1);
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
                                    this.sendDfuCreateObjCommand(2, this.binDataArrayBufferObj.arrayBuffer.byteLength).then(() => {
                                        console.log("发送包0102的大小成功,发送的数据：", ab2hex(buffer), '第二阶段第几次发包：', this.step - 1);
                                    });
                                } else {
                                    console.log('第二阶段全部完成');
                                    app.updateFinished = true;
                                    this.closeBLEConnection().finally(() => {
                                        this.closeBluetoothAdapter().finally(() => {
                                            console.log('蓝牙连接关闭，可以进入正常使用阶段');
                                        })
                                    });
                                    this.setData({isUpdate: false});
                                }
                            }

                        }
                    }, 50);
                } else if (valueLower.indexOf('200101') !== -1) {
                    this.stepIntoOTA = true;
                    this.closeBLEConnection().finally(() => {
                        this.closeBluetoothAdapter().finally(() => {
                            this.openBluetoothAdapter(['fe59']);
                        })
                    });
                } else if (valueLower.indexOf('60030187000000') !== -1) {//第一完成阶段
                    this.send04Command();
                }
            }
        })
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

        console.log(ab2hex(buffer),'dat包');
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
            wx.setKeepScreenOn({
                keepScreenOn: true
            });
            this.fileSystemManager = wx.getFileSystemManager();

            wx.downloadFile({
                // 示例 url，并非真实存在
                url: this.isGreen ? 'https://backend.stage.hipee.cn/hipee-resource/public/f1a07a5d2d8c43b49d59711e4439c35b.bin' ://green.bin
                    'https://backend.stage.hipee.cn/hipee-resource/public/b6830a279b4d434aae2474a4219172eb.bin',//yellow.bin
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
                                url: this.isGreen ? 'https://backend.stage.hipee.cn/hipee-resource/public/cf7cb6959fe641119317ee030dcc8edd.dat' ://green.dat
                                    'https://backend.stage.hipee.cn/hipee-resource/public/629cf2aa3860471a8a896c142a401c92.dat',//yellow.dat
                                success: (res) => {
                                    const filePath = res.tempFilePath;
                                    console.log('文件dat下载成功', res);
                                    this.fileSystemManager.readFile({
                                        filePath,
                                        success: res => {
                                            this.datDataArrayBufferObj.arrayBuffer = res.data;
                                            this.datDataArrayBufferObj.index = 0;

                                            console.log('读取dat设备固件成功', this.datDataArrayBufferObj);
                                            this.sendDfuCreateObjCommand(1, this.datDataArrayBufferObj.arrayBuffer.byteLength).then(() => {
                                                console.log("发送包0601的大小成功");
                                            });
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
                success: resolve,
                fail: reject
            })
        }, 3));
    },

    toUse() {
        Toast.showLoading('正在应用...');
        app.isOTAUpdate = false;
        const bleManager = app.getBLEManager();
        bleManager.setDeviceFindAction(null);
        bleManager.closeAll().finally(() => {
            bleManager.connect();
        });
        setTimeout(() => {
            Toast.hiddenLoading();
            HiNavigator.switchToIndexPage({});
        }, 4000);

    },

    onUnload() {
        wx.setKeepScreenOn({
            keepScreenOn: false
        });
    }
});
