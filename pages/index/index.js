//index.js
import Protocol from "../../modules/network/protocol";

Page({
    data: {
        boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC']
    },
    onLoad: function () {
        Protocol.medicalRecordList({device_id: '123456'}).then(data => {
            console.log(data);
        })

    },

    clickTopAdd(e) {
        let index = this.getIndexNum(e);
        console.log(index);
    },

    clickPhoto(e) {
        let index = this.getIndexNum(e);
        console.log(index);
        if (false) {
            wx.chooseImage({
                count: 1, // 默认9
                sizeType: ['compressed'],
                sourceType: ['album', 'camera'],
                success: function (res) {
                    // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                    let tempFilePaths = res.tempFilePaths;
                    let member = that.data.member;
                    member.head_url = tempFilePaths;
                    console.log('当前头像URL:', tempFilePaths[0]);
                    // 上传图片
                    // wx.uploadFile({
                    //     success: function (res) {
                    //     },
                    //     fail: function (e) {
                    //     },
                    //     complete: function (e) {
                    //     }
                    // })
                }
            })
        } else {
            wx.showActionSheet({
                itemList: ['查看', '修改'],
                success(res) {
                    console.log(res.tapIndex)
                },
                fail(res) {
                    console.log(res.errMsg)
                }
            })
        }
    },

    toSet() {
        console.log('toSet');
    },

    getIndexNum(e) {
        return e.currentTarget.dataset.index
    }

})
