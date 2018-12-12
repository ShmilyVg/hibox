import WXDialog from "../../view/dialog";

const updateManager = wx.getUpdateManager();

updateManager.onCheckForUpdate(function (res) {
    // 请求完新版本信息的回调
    console.log('检测是否有更新', res.hasUpdate)
});

updateManager.onUpdateReady(function () {
    WXDialog.showDialog({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        confirmEvent: () => updateManager.applyUpdate()
    });
});

updateManager.onUpdateFailed(function (res) {
    // 新版本下载失败
    console.log('更新失败', res);
});
