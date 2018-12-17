import {CommonConnectState, CommonProtocolState} from "../../libs/bluetooth/base/state";

export class ConnectState extends CommonConnectState {
    static UNBIND = 'unbind';
}

export class ProtocolState extends CommonProtocolState {
    static SEND_ALERT_TIME_RESULT = 'send_alert_time_result';//手机发送定时闹钟,设备反馈处理结果
}
