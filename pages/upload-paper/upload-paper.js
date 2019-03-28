// pages/upload-paper/upload-paper.js
import * as config from "../../utils/config";
import Protocol from "../../modules/network/protocol";
import toast from "../../view/toast";

Page({
    data: {
        picArr: []
    },
    onLoad(options) {

    },

    clickPic() {
        let that = this;
        let num = 6 - this.data.picArr.length;
        wx.chooseImage({
            count: num,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                toast.showLoading();
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
                                toast.hiddenLoading();
                            }
                        },
                        fail: function (e) {
                            toast.hiddenLoading();
                            toast.warn(`第${i}个图片上传失败`);
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
        toast.success('已收到您的反馈');
    }
})