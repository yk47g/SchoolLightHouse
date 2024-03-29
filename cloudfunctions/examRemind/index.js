// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'release-5gt6h0dtd3a72b90'
})
const db = cloud.database()
const log = cloud.logger()
const got = require('got');
const appidMiniprogram = 'wxf203d0e6cfbed41a'
const appidGZH = 'wx3df92dead7bcd174'
const MAX_LIMIT = 100
// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取当前事件
    const date = new Date()
    //+8解决时区问题
    const remindTime = (date.getHours() + 1 +8)%24
    console.log('提醒时间：' + remindTime+'到'+(remindTime+1));
    //获取access_token
    const configGZHResp = await db.collection('configGZH').where({
      key: 'access_token'
    }).get();
    const access_token = configGZHResp.data[0].value;
    // 获取所有需要提醒的内容
    const countResult = await db.collection('examRemindList').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组 
    const examRemindListRespArr = []
    // 获取所有数据
    for (let i = 0; i < batchTimes; i++) {
      const promise = await db.collection('examRemindList').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      examRemindListRespArr.push(promise)
    }
    // 遍历promise数组
    for (let i in examRemindListRespArr) {
      // 对于每一个promise，它data里面有MAX_LIMIT个对象
      const promise = examRemindListRespArr[i];
      // 遍历promise的data，有MAX_LIMIT个考试信息对象
      for (let e in promise.data) {
        // 对于每一个对象，就是考试提醒信息了
        const exam = promise.data[e]
        const timetemp = exam.examtime.split(':')
        // hourtemp 开始的小时
        // minutetemp 开始的分钟+60
        const hourtemp = parseInt(timetemp[0])
        const minutetemp = parseInt(timetemp[1].split('-')[0]) + 60
        // 判断时间
        if (hourtemp === remindTime) {
          let url = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + access_token
          let datajson = {
            "touser": exam._openidGZH,
            "template_id": 'vaiyMl11zeD9l-nhBXPhxrZ2sbv9aD4Hb6ePed59ZT8',
            "url": '',
            "data": {
              "first": {
                "value": "考试将在" + minutetemp + "分钟后开始",
                "color": "#173177"
              },
              "keyword1": {
                "value": exam.examName,
                "color": "#173177"
              },
              "keyword2": {
                "value": exam.examtime,
                "color": "#173177"
              },
              "remark": {
                "value": "教室："+exam.location+"座位号："+exam.sit_id,
                "color": "#173177"
              }
            },
            miniprogram: {
                    appid: appidMiniprogram,
                    page: 'pages/index/index'
                  }
          }
         let httpResp= await got.post(url, {
            json: datajson,
            responseType: 'json'
          })
          console.log(httpResp.body);
          // 用完就删
          await db.collection("examRemindList").doc(exam._id).remove()
        }
      }
    }
  } catch (e) {
    log.error({
      message: '发送考试提醒失败：',
      data: e.toString()
    });
    return false;
  }
  return true;
}