//index.js
import Protocol from "../../modules/network/protocol";
import * as config from "../../utils/config";
import toast from "../../view/toast";
import HiNavigator from "../../navigator/hi-navigator";
import {ConnectState} from "../../modules/bluetooth/bluetooth-state";

Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        popupShow: false,
        isConnect: false,
        animationData: {},
        animationData1: {},
        connectState: {'text': '正在连接...', color: '#65FF0A'},
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
        this.pointAnimation();
    },

    onShow() {
        let that = this;
        getApp().setBLEListener({
            bleStateListener: function ({state}) {
                let data = that.setConnectState(state);
                that.setData({
                    connectState: data,
                    isConnect: data.isConnect
                })
            }
        });

        if (getApp().globalData.refreshIndexPage) {
            this.getBaseInfo();
            getApp().globalData.refreshIndexPage = false
        }
    },

    hiddenTopTip() {
        const animation = wx.createAnimation({
            duration: 2000,
            timingFunction: 'ease',
        });

        this.animation = animation;
        setTimeout(function () {
            animation.translateY(-100).step();
            this.setData({
                animationData: animation.export()
            })
        }.bind(this), 3000);
    },

    setConnectState(state) {
        switch (state.connectState) {
            case ConnectState.UNBIND:
                clearInterval(this.data.pointTimer);
                return {text: '未绑定', isConnect: false};
            case ConnectState.UNAVAILABLE:
                clearInterval(this.data.pointTimer);
                return {text: '请开启手机蓝牙', isConnect: false};
            case ConnectState.DISCONNECT:
                clearInterval(this.data.pointTimer);
                return {text: '连接失败', isConnect: false};
            case ConnectState.CONNECTING:
                this.pointAnimation();
                return {text: '正在连接...', isConnect: false};
            case ConnectState.CONNECTED:
                clearInterval(this.data.pointTimer);
                this.hiddenTopTip();
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
        let that = this;
        let listText = ['now', 'future'];
        let item = that.data.list[listText[index[0]]][index[1]];
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
        // this.hiddenTopTip();
        // this.pointAnimation();
        HiNavigator.navigateSearchDevicePage();

    },

    getIndexNum(e) {
        return e.currentTarget.dataset.index
    },

    pointAnimation() {
        const animation1 = wx.createAnimation({
            duration: 1000,
            timingFunction: 'ease',
        });
        let that = this;


        let num = 0;
        this.data.pointTimer = setInterval(function () {
            this.animation1 = animation1;
            animation1.opacity(num % 2).step();
            that.setData({
                animationData1: animation1.export()
            });
            num++;
        }, 1000)
    },

    hidePopupView() {
        this.setData({
            popupShow: false,
        })
    },

    popupHideClick() {
        this.hidePopupView();
    },

    reviseBtnClick() {
        this.hidePopupView();
        let item = this.data.box[this.data.choseIndex];
        HiNavigator.navigateToEditDrugPage({
            deviceId: item.device_id,
            compartment: item.compartment,
            classify: item.drug_classify,
            drugName: item.drug_name,
            items: item.items,
            step: 1,
            count: 2
        });
    },

    noTakeBtnClick() {
        this.hidePopupView();
        let compartment = this.data.box[this.data.choseIndex].compartment;
        Protocol.medicalRemindRemove({compartment}).then(data => {
            this.getBaseInfo();
        })
    },
})
