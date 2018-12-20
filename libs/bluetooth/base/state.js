export class CommonConnectState {
    //蓝牙的常见状态值
    static UNAVAILABLE = 'unavailable';//蓝牙适配器不可用，通常是没有在手机设置中开启蓝牙，或是没有直接或间接调用父类中的openAdapter()
    static DISCONNECT = 'disconnect';//蓝牙连接已断开
    static CONNECTING = 'connecting';//正在连接蓝牙设备
    static CONNECTED = 'connected';//已经正常连接到蓝牙设备
    static NOT_SUPPORT = 'not_support';//当前Android系统版本小于4.3
}

export class CommonProtocolState {
    static UNKNOWN = 'unknown';//未知状态
    static NORMAL_PROTOCOL = 'normal_protocol';//无需处理的协议
    static CONNECTED_AND_BIND = 'connected_and_bind';
    static QUERY_DATA_START = 'query_data_start';//开始与设备同步数据
    static QUERY_DATA_ING = 'query_data_ing';//与设备同步数据状态中
    static QUERY_DATA_FINISH = 'query_data_finish';//完成与设备同步数据的状态
    static GET_CONNECTED_RESULT_SUCCESS = 'get_connected_result_success';//设备返回连接结果
    static SEND_CONNECTED_REQUIRED = 'send_connected_required';//手机发送连接请求
    static TIMESTAMP = 'timestamp';//设备获取时间戳
    static DORMANT = 'dormant';//设备休眠
}
