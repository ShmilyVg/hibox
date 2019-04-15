import {Toast as Toast1} from "heheda-common-view";

export default class Toast extends Toast1 {
    static none(title) {
        wx.showToast({
            title: title,
            icon: 'none',
            duration: 2000
        })
    }
}