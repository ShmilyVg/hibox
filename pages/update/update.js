// pages/update/update.js
import HiNavigator from "../../navigator/hi-navigator";

const app = getApp();

function inArray(arr, key, val) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
            return i;
        }
    }
    return -1;
}

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
        isUpDate: true
    },
    dataPointCharacteristicId: "8EC90002-F315-4F60-9FB8-838830DAEA50",
    controlPointCharacteristicId: "8EC90001-F315-4F60-9FB8-838830DAEA50",
    writeEnableOTACharacteristicId: "8EC90003-F315-4F60-9FB8-838830DAEA50",
    writeEnableOTAServiceId: "0000FE59-0000-1000-8000-00805F9B34FB",
    openBluetoothAdapter() {
        wx.openBluetoothAdapter({
            success: (res) => {
                console.log('openBluetoothAdapter success', res)
                this.startBluetoothDevicesDiscovery()
            },
            fail: (res) => {
                if (res.errCode === 10001) {
                    wx.onBluetoothAdapterStateChange(function (res) {
                        console.log('onBluetoothAdapterStateChange', res)
                        if (res.available) {
                            this.startBluetoothDevicesDiscovery()
                        }
                    })
                }
            }
        })
    },

    startBluetoothDevicesDiscovery() {
        if (this._discoveryStarted) {
            return
        }
        this._discoveryStarted = true;
        wx.startBluetoothDevicesDiscovery({
            // allowDuplicatesKey: true,
            services: ['fe59', '0000180A-0000-1000-8000-00805F9B34FB'],
            success: (res) => {
                console.log('startBluetoothDevicesDiscovery success', res)
                this.onBluetoothDeviceFound();
            },
        })
    },
    stopBluetoothDevicesDiscovery() {
        wx.stopBluetoothDevicesDiscovery()
    },
    onBluetoothDeviceFound() {
        const deviceId = app.getBLEManager().getDeviceMacAddress();
        wx.onBluetoothDeviceFound((res) => {
            res.devices.forEach(device => {
                // console.log('扫描到的设备', foundDevices);
                if (deviceId === device.deviceId) {//这是第一阶段
                    console.log('要连接的设备名字', device.localName);
                    this.createBLEConnection({deviceId: device.deviceId, stopDiscovery: false}).then(()=>{
                        this.getBLEDeviceServices(device.deviceId);
                        setTimeout(() => {
                            this.send01OTACommand();
                        }, 1000);
                    });
                }
            })
        })
    },
    createBLEConnection({deviceId, stopDiscovery = true}) {
        return new Promise((resolve, reject) => {
            wx.createBLEConnection({
                deviceId,
                success: () => {
                    stopDiscovery && this.stopBluetoothDevicesDiscovery();
                    resolve();
                },
                fail: reject
            })
        });

    },
    closeBLEConnection() {
        wx.closeBLEConnection({
            deviceId: this.data.deviceId
        })
        this.setData({
            connected: false,
            chs: [],
            canWrite: false,
        })
    },
    getBLEDeviceServices(deviceId) {
        wx.getBLEDeviceServices({
            deviceId,
            success: (res) => {
                console.log('服务', res);
                for (let i = 0; i < res.services.length; i++) {
                    if (res.services[i].isPrimary) {
                        this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
                        return
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
                        this.setData({
                            canWrite: true
                        })
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
            const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
            const data = {}

            const value = ab2hex(characteristic.value);
            if (idx === -1) {
                data[`chs[${this.data.chs.length}]`] = {
                    uuid: characteristic.characteristicId,
                    value: value
                }

            } else {
                data[`chs[${idx}]`] = {
                    uuid: characteristic.characteristicId,
                    value: value
                }
            }
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
                                let buffer = new ArrayBuffer(6);
                                let dataView = new DataView(buffer);
                                dataView.setUint8(0, 1);
                                dataView.setUint8(1, 1);
                                dataView.setUint8(2, 135);
                                dataView.setUint8(3, 0);
                                dataView.setUint8(4, 0);
                                dataView.setUint8(5, 0);
                                this.sendDataToControlPoint(buffer).then(() => console.log("发送包0601的大小成功"));
                            });

                        } else if (this.step === 2) {
                            console.log('预备开始发送第二阶段的0102');
                            setTimeout(() => {
                                this.sendBinCreateObjCommand(this.binDataArrayBufferObj.arrayBuffer.byteLength);
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
                        // this.autoJudgeCommand({
                        //     datFun: () => ,
                        //     binFun:
                        // });
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
                                    this.sendBinCreateObjCommand(this.binDataArrayBufferObj.arrayBuffer.byteLength);
                                } else {
                                    console.log('第二阶段全部完成');
                                }
                            }

                        }
                        // this.autoJudgeCommand({binFun: () => this.sendBinStartCommand()});
                    }, 50);
                }
            }
            this.setData(data);
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

    sendBinCreateObjCommand(byteLength) {
        let buffer = new ArrayBuffer(6);
        let dataView = new DataView(buffer);
        const high = byteLength / 256;
        const low = byteLength % 256;
        dataView.setUint8(0, 1);
        dataView.setUint8(1, 2);
        dataView.setUint8(2, low);
        dataView.setUint8(3, high);
        dataView.setUint8(4, 0);
        dataView.setUint8(5, 0);
        this.sendDataToControlPoint(buffer).then(() => {
            console.log("发送包0102的大小成功,发送的数据：", ab2hex(buffer), '第二阶段第几次发包：', this.step - 1);
        });
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
        return this.sendDataToPoint(buffer, this.writeEnableOTACharacteristicId);
    },
    send04Command() {
        let buffer = new ArrayBuffer(1);
        let dataView = new DataView(buffer);
        dataView.setUint8(0, 4);
        return this.sendDataToControlPoint(buffer);
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
                url: 'https://backend.stage.hipee.cn/hipee-resource/public/f1a07a5d2d8c43b49d59711e4439c35b.bin',//green.bin
                // url: 'https://backend.stage.hipee.cn/hipee-resource/public/5ca3d519a93040568b2126a7cf6932b7.bin',//2.bin
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
                                url: 'https://backend.stage.hipee.cn/hipee-resource/public/cf7cb6959fe641119317ee030dcc8edd.dat',//green.dat
                                // url: 'https://backend.stage.hipee.cn/hipee-resource/public/7fc5db3402c548bfae8e1de9b39e8c46.dat',//2.dat
                                success: (res) => {
                                    const filePath = res.tempFilePath;
                                    console.log('文件dat下载成功', res);
                                    this.fileSystemManager.readFile({
                                        filePath,
                                        success: res => {
                                            this.datDataArrayBufferObj.arrayBuffer = res.data;
                                            this.datDataArrayBufferObj.index = 0;

                                            console.log('读取dat设备固件成功', this.datDataArrayBufferObj);

                                            this.openBluetoothAdapter();
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
        return new Promise((resolve, reject) => wx.writeBLECharacteristicValue({
            deviceId: this._deviceId,
            serviceId: this._serviceId,
            characteristicId,
            value: buffer,
            success: resolve,
            fail: reject
        }));
    },

    toUse() {
        HiNavigator.switchToIndexPage({});
    }
})
