import Toast from "../../../view/toast";
import HiNavigator from "../../../navigator/hi-navigator";
import Protocol from "../../../modules/network/protocol";

Page({

    data: {
        drugTypes: []
    },

    onLoad(options) {
        Protocol.getDrugClassify().then(data => {
            console.log(data);
            let {result: drugTypes} = data;
            this.setData({drugTypes});
        });
    },

    typeChooseEvent(e) {
        const {index} = e.currentTarget.dataset;
        const obj = {};
        this.data.drugTypes.forEach((item, index) => {
            item.selected && (obj[`drugTypes[${index}].selected`] = false);
        });
        obj[`drugTypes[${index}].selected`] = true;
        this.setData(obj);
    },

    nextStep() {
        const drugTypes = this.data.drugTypes;
        const selectedItem = drugTypes.filter(item => item.selected);
        if (selectedItem.length) {
            HiNavigator.navigateToEditDrugPage({
                ...getApp().globalData.addOrEditDrugObj,
                classify: selectedItem[0].name,
                step: 2,
                count: 3
            });
        } else {
            Toast.warn('请选择种类');
        }
    }
});
