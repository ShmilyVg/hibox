//index.js
import Protocol from "../../modules/network/protocol";
import * as config from "../../utils/config";
import toast from "../../view/toast";
import HiNavigator from "../../navigator/hi-navigator";
import BlueToothState from "../../modules/bluetooth/state-const";

Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        popupShow: false,
        listText: ['now', 'future'],
        isConnect: false,
    },
    onLoad: function () {
        let that = this;
        wx.getStorage({
            key: 'userInfo',
            success(res) {
                that.setData({
                    userInfo: res.data
                })
            }
        });
        this.getBaseInfo();
    },

    onShow() {
        let that = this;
        getApp().setBLEListener({
            bleStateListener: function ({state}) {
                let data = that.setConnectState(state);
                that.setData({
                    connectState: data.text,
                    isConnect: data.isConnect
                })
            }
        });

        if (getApp().globalData.refreshIndexPage) {
            this.getBaseInfo();
            getApp().globalData.refreshIndexPage = false
        }
    },

    setConnectState(state) {
        switch (state.connectState) {
            case BlueToothState.UNBIND:
                return {text: '未绑定', isConnect: false};
            case BlueToothState.UNAVAILABLE:
                return {text: '请开启手机蓝牙', isConnect: false};
            case BlueToothState.DISCONNECT:
                return {text: '连接失败', isConnect: false};
            case BlueToothState.CONNECTING:
                return {text: '正在连接', isConnect: false};
            case BlueToothState.CONNECTED:
                return {text: '已连接', isConnect: true}
        }
    },

    getBaseInfo() {
        Protocol.getMedicalRemindInfo().then(data => {
            this.setData({
                box: data.result
            })
        });

        Protocol.getMedicalRemindList().then(data => {
            this.setData({
                list: data.result
            })
        })
    },

    clickTopAdd(e) {
        let index = this.getIndexNum(e);
        if (this.data.box[index]) {
            this.setData({
                choseIndex: index,
                popupShow: true,
            });
        } else {
            HiNavigator.navigateToAddDrug({compartment: index + 1});
        }
    },

    clickPhoto(e) {
        let index = this.getIndexNum(e);
        console.log(index);
        let that = this;
        let item = that.data.list[that.data.listText[index[0]]][index[1]];
        let image = item.image_url;
        if (typeof (image) == "undefined") {
            that.chooseImage(that, item);
        } else {
            wx.showActionSheet({
                itemList: ['查看', '修改'],
                success(res) {
                    switch (res.tapIndex) {
                        case 0:
                            wx.previewImage({
                                urls: [image] // 需要预览的图片http链接列表
                            });
                            break;
                        case 1:
                            that.chooseImage(that, item);
                            break;
                    }
                },
                fail(res) {
                    console.log(res.errMsg)
                }
            })
        }
    },

    chooseImage(that, item) {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                toast.showLoading();
                let path = res.tempFilePaths[0];
                wx.uploadFile({
                    url: config.UploadUrl,
                    filePath: path,
                    name: path,
                    success: function (res) {
                        let data = res.data;
                        let image = JSON.parse(data).result.path;
                        Protocol.getMedicalRemindImage({
                            id: item.id, image_url: image
                        }).then(data => {
                            that.getBaseInfo();
                            toast.hiddenLoading();
                        })
                    },
                    fail: function (e) {
                    },
                    complete: function (e) {
                    }
                })
            }
        })
    },

    toSet() {
        HiNavigator.navigateSearchDevicePage();
    },

    getIndexNum(e) {
        return e.currentTarget.dataset.index
    },

    popupHideClick() {
        this.setData({
            popupShow: false,
        })
    },

    reviseBtnClick() {
        this.setData({
            popupShow: false,
        })
    },

    notakeBtnClick() {
        this.setData({
            popupShow: false,
        })
        Protocol.medicalRemindRemove({compartment}).then(data => {
            let compartment = data.compartment;
            console.log(compartment);

        })
    },

})
