import BaseBlueToothImp from "../../libs/bluetooth/base/base-bluetooth-imp";

export default class BlueToothState {
    static UNBIND = 'unbind';
    static UNAVAILABLE = BaseBlueToothImp.UNAVAILABLE;
    static DISCONNECT = BaseBlueToothImp.DISCONNECT;
    static CONNECTING = BaseBlueToothImp.CONNECTING;
    static CONNECTED = BaseBlueToothImp.CONNECTED;
    static SEND_FIND_DEVICE = 'send_find_device';//手机发送寻找设备
    static SEND_ALERT_TIME_RESULT = 'send_alert_time_result';//手机发送定时闹钟,设备反馈处理结果
    static QUERY_EAT_DRUG_STATE = 'query_eat_drug_state';//与设备同步吃药状态
    static CONNECTED_AND_BIND = 'connected_and_bind';
    static TIMESTAMP = 'timestamp';//开始预热状态
    static GET_CONNECTED_RESULT_SUCCESS = 'get_connected_result_success';//设备返回连接结果
    static SEND_CONNECTED_REQUIRED = 'send_connected_required';//手机发送连接请求
    static NORMAL_PROTOCOL = 'normal_protocol';
    static UNKNOWN = 'unknown';//未知状态
}
