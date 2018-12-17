import BaseBlueToothImp from "./base/base-bluetooth-imp";

export class ConnectState {
    static UNBIND = 'unbind';
    static UNAVAILABLE = BaseBlueToothImp.UNAVAILABLE;
    static DISCONNECT = BaseBlueToothImp.DISCONNECT;
    static CONNECTING = BaseBlueToothImp.CONNECTING;
    static CONNECTED = BaseBlueToothImp.CONNECTED;

}

export class ProtocolState {
    static UNKNOWN = 'unknown';//未知协议
    static NORMAL_PROTOCOL = 'normal_protocol';//无需处理的协议

    static SEND_ALERT_TIME_RESULT = 'send_alert_time_result';//手机发送定时闹钟,设备反馈处理结果

    static QUERY_DATA_START = 'query_data_start';//开始与设备同步吃药
    static QUERY_DATA_ING = 'query_data_ing';//与设备同步吃药状态中
    static QUERY_DATA_FINISH = 'query_data_finish';//完成与设备同步吃药的状态
    static CONNECTED_AND_BIND = 'connected_and_bind';
    static GET_CONNECTED_RESULT_SUCCESS = 'get_connected_result_success';//设备返回连接结果
    static SEND_CONNECTED_REQUIRED = 'send_connected_required';//手机发送连接请求

    static TIMESTAMP = 'timestamp';//开始预热状态
}
