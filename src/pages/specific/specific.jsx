import Taro, { Component } from '@tarojs/taro'
import {
  View,
  Text,
  Button,
  Image,
  ScrollView
  // WebView
} from '@tarojs/components'
import Navbar from '@/components/navbar'
import DOC from '@/asserts/doc@2x.png'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import SHARE from '@/asserts/share@2x.png'
import api from '@/api'
import './specific.scss'

// const IS_IOS = /ios/.test(Taro.getSystemInfoSync().system.toLowerCase())

const formatData = item => {
  if (item.recommend_by > 40) {
    item.recommend_by = item.recommend_by.substr(0, 37) + '...'
  }
  if (item.title.length > 100) {
    item.title = item.title.substr(0, 97) + '...'
  }
  if (item.info.length > 130) {
    item.info = item.info.substr(0, 127) + '...'
  }
  if (item.author.length > 50) {
    item.author = item.author.substr(0, 47) + '...'
  }
  return item
}

export default class Specific extends Component {
  config = {
    navigationBarTitleText: '',
    disableScroll: true,
    navigationStyle: 'custom'
  }

  state = {
    specific: {},
    collection: [],
    index: -1,
    type: '',
    url: ''
  }

  componentDidShow() {
    const { id, type, url } = this.$router.params
    Promise.all([api.getStorage('collection'), api.specific(id)]).then(
      ([collection, specific]) => {
        const index = collection.findIndex(c => c._id === specific._id)
        specific.collected = index > -1
        this.setState({
          specific,
          collection,
          index,
          type,
          url
        })
      }
    )
  }

  collect = () => {
    this.setState(({ specific, collection, index }) => {
      specific.collected = !specific.collected
      if (specific.collected && index === -1) {
        collection.push(
          formatData({
            ...specific
          })
        )
        index = collection.length - 1
      } else if (!specific.collected && index !== -1) {
        collection.splice(index, 1)
        index = -1
      }
      Taro.setStorageSync('collection', collection)
      return {
        collection,
        specific,
        index
      }
    })
  }

  openDocument = () => {
    // if (IS_IOS) {
    //   this.setState({
    //     url: this.state.specific.pdf_url
    //   })
    // } else {
    Taro.showLoading({
      title: '文件下载中',
      mask: true
    })
    Taro.downloadFile({
      url: this.state.specific.pdf_url
    })
      .then(({ tempFilePath }) =>
        // this.setState({
        //   url: tempFilePath
        // })
        Taro.openDocument({
          filePath: tempFilePath
        })
      )
      .then(Taro.hideLoading)
      .catch(Taro.hideLoading)
    // }
  }

  copyPDFUrl = () => {
    Taro.setClipboardData({
      data: this.state.specific.pdf_url
    })
  }

  onMessage = e => {
    this.setState({
      url: ''
    })
  }

  onShareAppMessage() {
    const { _id } = this.state.specific
    return {
      path: `/pages/specific/specific?id=${_id}&type=redirectTo&url=/pages/index/index`
    }
  }

  render() {
    return (
      <View className='container specific'>
        <Navbar
          title=''
          backLabel='返回首页'
          type={this.state.type}
          url={this.state.url}
          transparent
          showBack
        />
        <View className='section'>
          <ScrollView className='main' scrollY>
            <View className='header'>
              <View className='title'>
                <Text>{this.state.specific.title}</Text>
              </View>
              <View className='author'>
                <Text>{this.state.specific.author}</Text>
              </View>
              {this.state.specific.comment ? (
                <View className='comment'>
                  <Text>Comments: {this.state.specific.comment}</Text>
                </View>
              ) : null}
            </View>
            <View className='body'>
              <View className='body-header'>
                <View className='left'>
                  <Text>Abstract</Text>
                </View>
                <View
                  className='right'
                  // onClick={this.openDocument}
                  onClick={this.copyPDFUrl}
                >
                  <Image className='icon icon-doc' mode='widthFix' src={DOC} />
                  <Text>复制PDF地址</Text>
                </View>
              </View>
              <View className='content'>
                <Text>{this.state.specific.info}</Text>
              </View>
            </View>
          </ScrollView>
          <View className='columns actions'>
            <Button className='column button collect' onClick={this.collect}>
              {this.state.specific.collected === true ? (
                <Image
                  mode='widthFix'
                  className='icon icon-heart'
                  src={HEART_SOLID}
                />
              ) : (
                <Image
                  mode='widthFix'
                  className='icon icon-heart'
                  src={HEART}
                />
              )}

              {this.state.specific.collected === true ? (
                <Text>取消收藏</Text>
              ) : (
                <Text>收藏本文</Text>
              )}
            </Button>
            <Button className='column button primary share' openType='share'>
              <Image className='icon icon-share' mode='widthFix' src={SHARE} />
              <Text>分享给好友</Text>
            </Button>
          </View>
        </View>
        {/* {this.state.url === '' ? null : (
          <WebView src={this.state.url} onMessage={this.onMessage} />
        )} */}
      </View>
    )
  }
}
