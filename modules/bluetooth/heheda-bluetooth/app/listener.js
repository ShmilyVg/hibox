const listener = {
    appReceiveDataListener: null,
    appBLEStateListener: null,
    appLoginListener: null,

    setBLEListener({receiveDataListener, bleStateListener, bleSignPowerListener}) {
        this.appReceiveDataListener = receiveDataListener;
        this.appBLEStateListener = bleStateListener;
        this.appBLESignPowerListener = bleSignPowerListener;
    },
};

export {listener};
