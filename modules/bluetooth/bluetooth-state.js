import {CommonConnectState, CommonProtocolState} from "heheda-bluetooth-state";

const ConnectState = {...CommonConnectState};

const ProtocolState = {
    SEND_ALERT_TIME_RESULT: 'send_alert_time_result',//手机发送定时闹钟,设备反馈处理结果
    ...CommonProtocolState
};

export {
    ConnectState, ProtocolState
}
