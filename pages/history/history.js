// pages/history/history.js
import Protocol from "../../modules/network/protocol";
Page({

  /**
   * 页面的初始数据
   */
  data: {
      boxColor: ['#68D5B8', '#8FC25E', '#9F92D6', '#8CA5DC'],
      listText: ['now', 'future'],
      allList: [],
      page: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
      this.getMedicalRecordList({});
  },
   getMedicalRecordList({page = 1}) {
        Protocol.MedicalRecordList({page}).then(data => {
          console.log(data.result);
            let list = data.result;
            if (list.length) {
                this.setData({
                    allList: this.data.allList.concat(list),
                })
            } else {
                this.data.page--;
            }
        }).finally(() => wx.stopPullDownRefresh());
    },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  }
})