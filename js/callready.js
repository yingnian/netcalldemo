
var hasLogined1 = false;
var beCalledInfo;
var sessionConfig;
var beCalling = false;

var acceptDiv;
var hangupBtnCalled;
var hangupbtnaccepted;
var calleeBtn;
var callerIcon;
var callerID;
var callerInfoDiv;
var targetAccid;


window.onload = function () {
    
    var inputAccid = document.getElementById("j-secret");
    var startCallBtn = document.getElementById("j-loginBtn");
    var logoutBtn = document.getElementById("j-logoutBtn");

    acceptDiv = document.getElementById("mainwrapper1");
    hangupBtnCalled = document.getElementById("hangupbtncalled");
    hangupbtnaccepted = document.getElementById("hangupbtnaccepted");
    calleeBtn = document.getElementById("calleeBtn");
    callerIcon = document.getElementById("callerIcon");
    callerID = document.getElementById("callerID");
    callerInfoDiv = document.getElementById("callerInfoDiv");

    /**
     * 开始通话按钮
     */
    startCallBtn.onclick = function () {
        targetAccid = inputAccid.value;
        if (targetAccid != null && hasLogined1){
            //jump to call page, start calling
            setCookie("targetaccid",targetAccid);
            showAcceptUI(null,targetAccid);
            startCalling();

        }
    };

    /**
     * 登出按钮
     */
    logoutBtn.onclick = function () {
      if (hasLogined1){
          nim.disconnect();
          window.location.href = './login.html';
      }
    };
    /**
     * 收到通话请求时挂断按钮
     */
    hangupBtnCalled.onclick = function () {
        netcall.control({
            channelId: beCalledInfo.channelId,
            command: WebRTC.NETCALL_CONTROL_COMMAND_BUSY
        });
        netcall.response({
            accepted: false,
            beCalledInfo: this.beCalledInfo
        });
        beCalledInfo = null;
        beCalling = false;
        clearAcceptUI();    //UI清理
    };

    /**
     * 通话过程中的挂断按钮
     */
    hangupbtnaccepted.onclick = function () {
        netcall.hangup();
        clearAcceptUI();
    };
    /**
     * 被叫接听按钮
     */
    calleeBtn.onclick = function () {
        // 接听
        beCalling = false;

        netcall.response({
                accepted: true,
                beCalledInfo: beCalledInfo,
                sessionConfig: sessionConfig
            })
            .catch(function(err) {
                console.log('接听失败', err);
            });
    };
};

/**
 * 初始化NIM
 * @type {*|c.NRTCAdapter|c.WebRTC}
 */
var nim = NIM.getInstance({

    debug:true,
    appKey: '45c6af3c98409b18a84451215d0bdd6e',
    account: readCookie("accid"),
    token: readCookie("token"),

    onconnect: onConnect,
    onwillreconnect: onWillReconnect,
    ondisconnect: onDisconnect,
    onerror: onError
});


function onConnect() {
    console.log("SDK Connected");
    hasLogined1 = true;
    initNetCall();
}
function onWillReconnect(obj) {
    console.log('SDK is reconnecting');
    console.log(obj.retryCount);
    console.log(obj.duration);
}
function onDisconnect(error) {
    console.log('Lost Connection');
    console.log(error);
    if (error) {
        switch (error.code) {
            case 302: alert("Password or account not matched"); break;
            case 417: break;
            case 'kicked': break;
            default: break;
        }
    }
    window.location.href = './login.html';
    delCookie("accid");
    delCookie("token");
}
function onError(error) {
    console.log(error);
    alert("Login error:" + error);
    window.location.href = './login.html';
    delCookie("accid");
    delCookie("token");
}

const Netcall = WebRTC;
var netcall;

function initNetCall() {

    NIM.use(WebRTC);
    netcall = Netcall.getInstance({
        nim: nim,
        container: document.getElementById('container'),
        remoteContainer: document.getElementById('remoteContainer'),
        // chromeId: '',
        // 是否开启日志打印
        debug: true
    });

    netcall.on('beCalling',function (obj) {
        showAcceptUI(obj,null);
        beCalledInfo = obj;
    });

    // 被叫接受的通知
    netcall.on('callAccepted', function(obj) {
        console.log('on callAccepted', obj);
        startConnect();
    });

}

/**
 * 展示接听界面的UI
 * @param obj 收到呼叫请求之后回调的obj
 */
function showAcceptUI(obj,accid) {
    beCalling = true;
    //展示接听的div
    acceptDiv.style.display = 'block';
    //展示用户信息的界面
    callerInfoDiv.style.display = 'block';
    getUserInfoAndDisp(obj,accid);
    //展示挂断按钮
    calleeBtn.style.display = 'block';
    hangupBtnCalled.style.display = 'block';
}

/**
 * 用于接听界面点击挂断后的UI处理
 */
function clearAcceptUI() {
    beCalling = false;

    //隐藏接听的div
    acceptDiv.style.display = 'none';
    //隐藏用户信息的界面
    callerInfoDiv.style.display = 'none';
    //隐藏挂断按钮
    calleeBtn.style.display = 'none';
    hangupBtnCalled.style.display = 'none';
    hangupbtnaccepted.style.display = 'none';

}

function showConnectedUI() {
    beCalling = false;

    //隐藏用户信息的界面
    callerInfoDiv.style.display = 'none';
    //隐藏挂断按钮
    calleeBtn.style.display = 'none';
    hangupBtnCalled.style.display = 'none';
    //显示通话中挂断按钮
    hangupbtnaccepted.style.display = 'block';
}

/**
 * 获取用户资料并展示
 * @param obj
 */
function getUserInfoAndDisp(obj,accid) {

    if (obj){
        nim.getUser({
            account: obj.account,
            sync:true,
            done: getUserDone
        });
    }else if (accid){
        nim.getUser({
            account: accid,
            sync:true,
            done: getUserDone
        });
    }
    function getUserDone(error, user) {
        console.log(error);
        console.log(user);
        console.log('获取用户资料' + (!error?'成功':'失败'));
        if (!error) {
            var avatar = user.avatar;
            var id = user.nick;
            callerIcon.src = avatar;
            callerID.value = id;
        }
    }
}

function startCalling() {
    const pushConfig = {
        enable: true,
        needBadge: true,
        needPushNick: true,
        pushContent: '',
        custom: '测试自定义数据',
        pushPayload: '',
        sound: '',
        forceKeepCalling: 0
    };

    const sessionConfig = {
        videoQuality: Netcall.CHAT_VIDEO_QUALITY_HIGH,
        videoFrameRate: Netcall.CHAT_VIDEO_FRAME_RATE_15,
        videoBitrate: 0,
        recordVideo: false,
        recordAudio: false,
        highAudio: false,
        bypassRtmp: false,
        rtmpUrl: '',
        rtmpRecord: false,
        splitMode: Netcall.LAYOUT_SPLITLATTICETILE
    };

    netcall.call({
        type: Netcall.NETCALL_TYPE_VIDEO,
        account: targetAccid,
        pushConfig: pushConfig,
        sessionConfig: sessionConfig,
        webrtcEnable: true
    }).then(function(obj) {
            // 成功发起呼叫
            console.log('call success', obj);
            remoteContainer1.style.display = 'block';
            hangupbtn.style.display = 'block';
            isCalling = true;

        }).catch(function(err) {
            // 被叫不在线
            if (err.event.code === 11001) {
                console.log('callee offline', err);
                alert("对方不在线");
                clearAcceptUI();
            }
        });
    netcall.on('callRejected',function (obj) {
        netcall.hangup();
        clearAcceptUI();
    });

    // 被叫接受的通知
    netcall.on('callAccepted', function(obj) {
        // 缓存呼叫类型，后面开启音视频连接需要用到
        console.log('on callAccepted', obj);
        // 取消呼叫倒计时
        startConnect();
    });

    netcall.on('hangup',function (obj) {
        console.log('on hangup', obj);
        // 判断需要挂断的通话是否是当前正在进行中的通话
        if (netcall.channelId === obj.channelId) {
            // 清理工作，这是调用一系列接口实现的
            netcall.stopDevice(Netcall.DEVICE_TYPE_VIDEO).then(function() {
                console.log('摄像头关闭成功')
            });
            // 也可以直接调用hangup接口实现各种清除工作
            netcall.hangup();
            clearAcceptUI();
        }
    })
}

function startConnect() {

    showConnectedUI();

    const netcall = this.netcall;
// 连接媒体网关
    netcall.startRtc().then(function() {
        // 开启麦克风
        return netcall.startDevice({
            type: Netcall.DEVICE_TYPE_AUDIO_IN
        }).catch(function(err) {
            console.log('启动麦克风失败');
            console.error(err)
        })
    })
        .then(function() {
            // 设置采集音量
            netcall.setCaptureVolume(255);
            // 开启摄像头
            return netcall.startDevice({
                type: Netcall.DEVICE_TYPE_VIDEO
            })
                .catch(function(err) {
                    console.log('启动摄像头失败');
                    console.error(err)
                })
        })
        .then(function() {
            //预览本地画面
            netcall.startLocalStream(
                document.getElementById('containerLocal')
            );

            // 设置本地预览画面大小
            netcall.setVideoViewSize({
                width: 90,
                height: 180,
                cut:true
            })
        })
        .catch(function(err) {
            console.log('发生错误');
            console.log(err);
            netcall.hangup();
            window.location.href = './callready.html';
        });

// 在回调里监听对方加入通话，并显示对方的视频画面
    netcall.on('remoteTrack', function(obj) {
        console.log('user join', obj);
        // 播放对方声音
        netcall.startDevice({
            type: Netcall.DEVICE_TYPE_AUDIO_OUT_CHAT
        }).catch(function(err) {
            console.log('播放对方的声音失败');
            console.error(err)
        });
        // 预览对方视频画面
        netcall.startRemoteStream({
            account: obj.account,
            node: document.getElementById('containerRemote')
        });
        // 设置对方预览画面大小
        netcall.setVideoViewRemoteSize({
            account: 'testAccount',
            width: 360,
            height: 640,
            cut:true
        })
    })

}

