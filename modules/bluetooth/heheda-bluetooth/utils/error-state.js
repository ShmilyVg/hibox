import {CommonConnectState} from "heheda-bluetooth-state";

const ErrorState = {
    DISCOVER_TIMEOUT: {
        errorCode: 100, errMsg: '扫描设备超时', type: CommonConnectState.DISCONNECT
    }
};


export {
    ErrorState
}
