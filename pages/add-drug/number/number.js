Page({

    data: {
        number: 3,
        piece: 1
    },
    onLoad(options) {
        this.setData({...options});


    },
    lostFocusNumberInputEvent(e) {
        const {detail: {value}} = e;
        this.setData({number: parseInt(value) || 1});
    },
    lostFocusPieceInputEvent(e) {

    },
    onUnload() {

    }
});
