export default class WXDialog {
    static showDialog({title='', content, showCancel = false, cancelText = '取消', confirmText = '确定', confirmEvent, cancelEvent}) {
        wx.showModal({
            title,
            content,
            showCancel,
            cancelText,
            confirmText,
            success: res => {
                if (res.confirm) {
                    confirmEvent && confirmEvent();
                } else {
                    cancelEvent && cancelEvent();
                }
            },
            fail:res=>{
                console.log(res);
            },
            confirmColor: '#D16730',
        })
    }
}
