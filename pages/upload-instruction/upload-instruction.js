// pages/upload-instruction/upload-instruction.js
import * as config from "../../utils/config";
import Protocol from "../../modules/network/protocol";
import Toast from "../../view/toast";

Page({
    data: {
        picArr: []
    },
    onLoad(options) {
        this.data.code = options.code;
    },

    clickPic() {
        let that = this;
        wx.chooseImage({
            count: 6 - this.data.picArr.length,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                Toast.showLoading();
                let paths = res.tempFilePaths, arr = that.data.picArr, count = 0;
                for (let i in paths) {
                    let path = paths[i];
                    wx.uploadFile({
                        url: config.UploadUrl,
                        filePath: path,
                        name: path,
                        success: function (res) {
                            arr.push(JSON.parse(res.data).result.img_url);
                            count++;
                            if (count === paths.length) {
                                that.setData({
                                    picArr: arr
                                });
                                Toast.hiddenLoading();
                            }
                        },
                        fail: function (e) {
                            Toast.hiddenLoading();
                            Toast.warn(`第${i}个图片上传失败`);
                        },
                        complete: function (e) {
                        }
                    })
                }
            }
        })
    },

    deletePic(e) {
        this.data.picArr.splice(e.currentTarget.dataset.index, 1);
        this.setData({
            picArr: this.data.picArr
        })
    },

    toSend() {
        if (this.data.picArr.length) {
            Protocol.getDrugCreateDrugInstruction({
                code: this.data.code,
                imageArr: this.data.picArr
            }).then(data => {
                if (data.code === 1) {
                    Toast.success('已收到您的反馈');
                    setTimeout(() => {
                        wx.navigateBack({
                            delta: 1
                        })
                    }, 2222);
                }
            });
        }
    },
})