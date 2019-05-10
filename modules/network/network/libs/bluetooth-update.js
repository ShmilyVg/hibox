import CommonProtocol from "./protocol";
const md5 = require('./js-md5');

export default class BlueToothUpdate {
    constructor() {
        this._clear();
        this.fileSystemManager = wx.getFileSystemManager();
    }

    execute({deviceId, version}) {
        this._deviceId = deviceId;
        this._version = version;


        return new Promise((resolve,reject) => {
            this._first()
                .then(({localUpdateFilePath}) => {
                    if (!!localUpdateFilePath) {
                        return {savedFilePath: localUpdateFilePath};
                    } else {
                        this._updateFileFromServer();
                        throw new Error(this._dontUpdate());
                    }
                })
                .then(({savedFilePath}) =>
                    this._readFile({filePath: savedFilePath})
                )
                .then(({arrayBuffer}) =>
                    this._fileMD5Test({arrayBuffer})
                )
                .then(({isPass, arrayBuffer}) => {
                    if (isPass) {
                        console.log('文件校验通过');
                        resolve(arrayBuffer);
                    } else {
                        throw new Error(this._dontUpdate());
                    }

                })
                .catch((res) => {
                    console.log('升级固件中出错', res);
                    this._deleteUpdateFile();
                    reject();
                })
                .finally(() => this._clear());
        });

    }

    _first() {
        return new Promise((resolve) => {
            resolve({localUpdateFilePath: this._getUpdateFilePath()});
        })
    }

    resetAll() {
        this._clear();
        this._deleteUpdateFile();
    }

    isUpdate() {
        return !!this._getUpdateFilePath();
    }

    _saveUpdateFilePath({filePath, hash}) {
        !!filePath && wx.setStorageSync('deviceUpdateFileInfo', {filePath, hash});
    }

    _getUpdateFilePath() {
        return wx.getStorageSync('deviceUpdateFileInfo').filePath;
    }

    _getUpdateFileHash() {
        return wx.getStorageSync('deviceUpdateFileInfo').hash;
    }

    _deleteUpdateFile() {
        const filePath = this._getUpdateFilePath();
        !!filePath && this.fileSystemManager.removeSavedFile({filePath});
        wx.removeStorageSync('deviceUpdateFileInfo');
    }

    _updateFileFromServer() {
        CommonProtocol.postBlueToothUpdate({deviceId: this._deviceId, version: this._version})
            .then(data => {
                const {update: isUpdate, url: fileUrl, hash, version: newVersion} = data.result;
                if (isUpdate) {
                    return this._downloadAndSaveNewFile({
                        fileUrl,
                        hash
                    });
                } else {
                    throw new Error(this._dontUpdate());
                }
            })
            .then(({savedFilePath}) =>
                this._readFile({filePath: savedFilePath})
            )
            .then(({arrayBuffer}) =>
                this._fileMD5Test({arrayBuffer})
            )
            .then(({isPass}) => {
                if (!isPass) {
                    throw new Error('file hash error');
                } else {
                    console.log('下载时校验通过');
                }
            })
            .catch((res) => {
                console.log('下载固件中出错', res);
                this._deleteUpdateFile();
            })
            .finally(() => this._clear());
    }


    _downloadAndSaveNewFile({fileUrl: url, hash}) {
        return new Promise((resolve, reject) => {
            const updateFilePath = this._getUpdateFilePath();
            if (!!updateFilePath) {
                resolve({savedFilePath: updateFilePath});
                return;
            }
            wx.downloadFile({
                url, // 仅为示例，并非真实的资源
                success: (res) => {
                    // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                    if (res.statusCode === 200) {
                        this.fileSystemManager.saveFile({
                                tempFilePath: res.tempFilePath,
                                success: res => {
                                    console.log('存储设备固件成功', res);
                                    const {savedFilePath} = res;
                                    this._saveUpdateFilePath({filePath: savedFilePath, hash});
                                    resolve({savedFilePath});
                                }, fail: res => {
                                    console.log('存储设备固件失败', res);
                                    reject();
                                }
                            }
                        )

                    }
                }
            });
        });
    }

    _readFile({filePath}) {
        return new Promise((resolve, reject) => {
            this.fileSystemManager.readFile({
                filePath,
                success: res => {
                    console.log('读取设备固件成功', res);
                    resolve({arrayBuffer: res.data});
                }, fail: res => {
                    console.log('读取设备固件失败', res);
                    reject();
                }
            });
        });
    }

    _fileMD5Test({arrayBuffer}) {
        return {isPass: md5(new Uint8Array(arrayBuffer)) === this._getUpdateFileHash(), arrayBuffer};
    }

    _dontUpdate() {
        return 'don\'t need to update device version at this moment';
    }

    _clear() {
        this._deviceId = null;
        this._version = null;
    }

};
