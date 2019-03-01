// pages/drug-info/drug-info.js
import Protocol from "../../modules/network/protocol";
import HiNavigator from "../../navigator/hi-navigator";

Page({

    data: {
        ruler: {
            1: ['08:00'],
            2: ['08:00', '21:00'],
            3: ["08:00", "13:00", "21:00"],
            4: ["08:00", "13:00", "18:00", "21:00"],
            5: ["08:00", "12:00", "15:00", "18:00", "21:00"],
            6: ["08:00", "11:00", "14:00", "17:00", "19:00", "21:00"],
            7: ["08:00", "10:30", "13:00", "15:30", "17:00", "19:30", "21:00"],
            8: ["08:00", "10:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"],
            9: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "21:00"],
        }
    },

    onLoad: function (options) {
        // Protocol.getDrugCode({code: '6943118000248'}).then(data => {
        //     this.setData({
        //         data: data.result
        //     })
        // })

        let drugInfo = getApp().globalData.drugInfo;

        this.setData({
            data: drugInfo.result
        });

        console.log('addOrEditDrugObj=',getApp().globalData.addOrEditDrugObj);
    },

    drugRemind() {

        if(this.data.data.cycle != null){
            let times  = this.data.ruler[this.data.data.cycle];
            let value = [];
            for (let i = 0; i < times.length; i++){
                value[i] = {number:this.data.data.dosage,remind_time:times[i]}
            }

            getApp().globalData.addOrEditDrugObj.items = value;
        }


        HiNavigator.navigateToDrugNumberPage({drugName: this.data.data.drugName, step: 2, count: 3,code:this.data.data.code});
    }
})
