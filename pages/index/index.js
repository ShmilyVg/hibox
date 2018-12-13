//index.js
import Protocol from "../../modules/network/protocol";
import * as config from "../../utils/config";
import toast from "../../view/toast";
import HiNavigator from "../../navigator/hi-navigator";

Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
        popupShow: false,
        listText: ['now', 'future']
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
                    console.log(res.tapIndex)
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
                        console.log(res);
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
        console.log('toSet');
    },

    getIndexNum(e) {
        return e.currentTarget.dataset.index
    }

})
