// miniprogram/pages/secondHand/detail/detail.js
const db = wx.cloud.database()
Page({
  data: {
    _id: '',
    fileID: [],
    info: '',
    admin: false,
    changemode: false,
  },
  async change() {
    this.setData({
      changemode: true
    })
  },
  textareaInput(e) {
    let info = e.detail.value
    let infolength = info.length
    this.setData({
      info,
      infolength
    })
  },
  async changePhoto() {
    await wx.chooseImage({
      count: 5,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    }).then(async res => {
      wx.showLoading({
        title: '上传中',
      })
      let newFileID = []
      for (let i = 0; i < res.tempFilePaths.length; i++) {
        let filePath = res.tempFilePaths[i]
        let cloudPath = `secondHand/image-${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}${filePath.match(/\.[^.]+?$/)[0]}`
        await wx.cloud.uploadFile({
          cloudPath,
          filePath,
        }).then(res => {
          //记录新的照片fileID
          newFileID.push(res.fileID)
        }).catch(e => {
          newFileID = []
          console.error(e);
        })
      }
      wx.hideLoading()
      wx.showLoading({
        title: '正在更新',
      })
      //更新数据库
      if(newFileID.length>0){
        console.log('保存数据库');
        await db.collection('secondHand').where({
          _id:this.data._id
        }).update({
          data:{
            fileID:newFileID
          }
        }).then(async res=>{
          //删除原有的fileID的文件
          await wx.cloud.deleteFile({
            fileList:this.data.fileID
          })
          //修改fileID指示的文件
          this.setData({
            fileID:newFileID
          })
        }).catch(e=>{console.error(e);})
      }
    }).catch(e => {
      console.error('[上传文件] 失败：', e)
      wx.showToast({
        icon: 'none',
        title: '上传失败',
      })
    })
    wx.hideLoading()
  },
  async changeInfo() {
    let {
      _id
    } = this.data
    await db.collection('secondHand').where({
      _id
    }).update({
      data: {
        info: this.data.info
      }
    }).then(res => {}).catch(e => {
      console.error(e);
    })
  },
  back() {
    wx.navigateBack({
      delta: 0,
    })
  },
  async onLoad(options) {
    wx.showLoading({
      title: '正在加载',
    })
    let {
      _id
    } = options
    await db.collection('secondHand').where({
        _id
      }).get()
      .then(res => {
        let {
          fileID,
          info
        } = res.data[0]
        this.setData({
          fileID,
          info,
          _id
        })
      })
      .catch(e => {
        console.error(e);
      })
    //TODO 根据用户数据设置管理员权限
    this.setData({
      admin: true
    })
    wx.hideLoading({})
  },
})