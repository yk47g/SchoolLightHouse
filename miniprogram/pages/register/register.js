import {
    showErrorModal
} from '../../utils/index.js';

let app = getApp();
let db = wx.cloud.database({
    env: 'release-5gt6h0dtd3a72b90'
});

Page({
    data: {
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        registerPage: 1,
        items: [{
            name: 'gzcsxy',
            value: '华南理工大学广州学院',
            checked: 'true'
        },],
        schoolCode: 'gzcsxy',
        stuID: "",
        stuPassword: ""
    },
    onLoad() {
        // 已注册就跳到绑定页面
        if (!app.globalData.firstlogin) {
            this.setData({
                registerPage: 2
            });
        }
    },
    async tapBindButton() {
        wx.showLoading({
            title: '绑定中',
        });
        try {
            //判断是不是23点后绑定
            var now = new Date();
            const hour = now.getHours();
            if (hour == 23 || hour <= 7) {
                throw '23:00～07:00因教务系统关闭，请换个时间再来绑定！';
            }
            const {
                stuID,
                stuPassword
            } = this.data;
            //验证输入的内容
            if (!(stuID || stuPassword)) {
                //是否为空
                throw "内容不能为空";
            }

            const bindStudyDataResp = await wx.cloud.callFunction({
                name: 'bindStudy',
                data: {
                    stuID: stuID,
                    stuPassword: stuPassword,
                },
            });
            const bindStudyData = bindStudyDataResp.result;
            if (bindStudyData.status === 'error') {
                throw bindStudyData.msg + bindStudyData.data;
            }
            app.globalData.isNoBind = false;
            wx.removeStorageSync('studyData');
            wx.hideLoading();
            wx.reLaunch({
                url: '/pages/index/index',
            });
        } catch (e) {
            showErrorModal('绑定失败', e);
        }
        wx.hideLoading();
    },
    tapLaterButton() {
        wx.navigateBack();
    },
    radioChange(e) {
        // console.log('radio发生change事件，携带value值为：', e.detail.value)
        this.setData({
            schoolCode: e.detail.value
        });
    },
    stuIDKeyInput(e) {
        this.setData({
            stuID: e.detail.value
        });
    },
    stuPasswordKeyInput(e) {
        this.setData({
            stuPassword: e.detail.value
        });
    },
    async bindGetUserInfo(e) {
        wx.showLoading({
            title: '注册中',
        });
        try {
            // 存不存在
            const userInfoResp = await db.collection('user').where({
                _openid: app.globalData._openid
            }).get();
            let userInfo = userInfoResp.data;
            if (userInfo.length !== 0) {
                // 已经注册
                throw "你已经注册，请不要重复注册！";
            }
            //数据库插入user
            const {
                avatarUrl,
                gender,
                nickName
            } = e.detail.userInfo;
            const {
                rawData
            } = e.detail;
            //获取unionid
            const unionidResp = await wx.cloud.callFunction({
                name: 'getUnionid'
            })
            let _unionid = unionidResp.result
            const _openidGZHResp = await db.collection('userGZH').where({
                _unionid
            }).get()
            let _openidGZH=null
            if(_openidGZHResp.data.length===0){
                //无法获取GZH的openid判断为没关注公众号
                // wx.showModal({
                //     title: '提示',
                //     content:'您还未关注公众号',
                //     showCancel: false
                // });
            }
            else{
                //已经关注公众号的用户
                _openidGZH = _openidGZHResp.data[0]._openid
            }

            let userdata={
                avatarUrl: avatarUrl,
                gender: gender,
                name: nickName,
                rawData: rawData,
                registerTime: new Date(),
                schoolCode: this.data.schoolCode,
                _openidGZH,
                _unionid
            }
            console.log(userdata);
            await db.collection('user').add({
                data:userdata
            });
            //切换显示成绑定页面
            this.setData({
                registerPage: 2
            });
            // 修改全局数据
            app.getUserInfo();
        } catch (e) {
            showErrorModal('注册失败', e);
        }
        wx.hideLoading();
    },
    tapMoreSchool() {
        wx.showModal({
            title: '提示',
            content: '暂时只支持华广，未来将支持其他学校，可联系客服了解详情',
            showCancel: false
        });
    }
});