// 云函数入口文件
const cloud = require('wx-server-sdk')
const got = require('got')
cloud.init({
  env: 'release-5gt6h0dtd3a72b90'
})
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  //TODO! 2.发送模板提醒 3.定时触发器
  var d = new Date()
  var remindTime = d.getHours() + 1
  //获取所有需要提醒的内容
  const temp = await db.collection('examRemindList').where({}).get()
  const examRemindList = temp.data
  for (let e in examRemindList) {
    let exam=examRemindList[e]
    //判断时间
    if (exam.examtime.split(':')[0] == remindTime) {
      console.log("TODO:发送提醒消息")
      //用完就删
      await db.collection("examRemindList").where({
        _id:exam._id
      }).remove()
    }
  }
  // await got.post('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN',{
  //   json:{
  //     //TODO 公众号的openid
  //     "touser": "",
  //     //TODO 模板id
  //     "template_id": "",
  //     //TODO 跳转页面
  //     "url": "",
  //     "topcolor": "#FF0000",
  //     //TODO 数据，event中或者数据库中提供
  //     "data": {
  //       "first": {
  //         "value": "tuip123",
  //         "color": "#173177"
  //       },
  //       "keyword1": {
  //         "value": "tuip123-kw1",
  //         "color": "#173177"
  //       },
  //       "keyword2": {
  //         "value": "tuip123-kw2",
  //         "color": "#173177"
  //       },
  //       "keyword3": {
  //         "value": "tuip123-kw3",
  //         "color": "#173177"
  //       },
  //       "remark": {
  //         "value": "tuipcain",
  //         "color": "#173177"
  //       }
  //     }
  //   },
  //   responseType:'json'
  // })
}