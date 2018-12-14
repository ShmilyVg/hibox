const listener = {
    appReceiveDataListener: null,
    appBLEStateListener: null,
    setBLEListener({receiveDataListener, bleStateListener}) {
        this.appReceiveDataListener = receiveDataListener;
        this.appBLEStateListener = bleStateListener;
    },
};

export {listener};
