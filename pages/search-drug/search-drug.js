import Protocol from "../../modules/network/protocol";

// pages/search-drug/search-drug.js
Page({
    data: {
        drugNames: [],
        inputName: "",
    },

    onLoad: function (options) {
        let name = getApp().globalData.addOrEditDrugObj.drugName;
        if (name && name.length && name.length > 0) {
            this.setData({
                inputName: name
            });
            this.postDrugName(name);
        }
    },

    postDrugName(name) {
        if (name && name.length && name.length > 0) {
            Protocol.getDrugSearch({
                name: name
            }).then(data => {
                let drugNames = [];
                data.result.map(item => {
                    drugNames.push(item.name)
                });
                this.setData({
                    drugNames: drugNames,
                })
            })
        } else {
            this.setData({
                drugNames: []
            })
        }
    },

    inputDrug(e) {
        let content = e.detail.value;
        this.postDrugName(content);
        this.setData({
            inputContent: content
        })
    },

    finishInput(e) {
        console.log('e=', e);
        getApp().globalData.addOrEditDrugObj.drugName = e.detail.value;
        wx.navigateBack({
            delta: 1
        });
    },

    clickConfirm() {
        this.backPage(this.data.inputContent);
    },

    clickCell(e) {
        let index = e.currentTarget.dataset.index;
        let name = this.data.drugNames[index];
        this.backPage(name);
    },

    backPage(name) {
        console.log(name);
        getApp().globalData.addOrEditDrugObj.drugName = name;
        wx.navigateBack({
            delta: 1
        });
    }
})