import Taro, { Component } from '@tarojs/taro'
import {
  Button,
  View,
  Text,
  Image,
  Input,
  ScrollView
} from '@tarojs/components'
import api from '@/api'
import Navbar from '@/components/navbar'
import CLOSE from '@/asserts/close@2x.png'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import COLLECTION_EMPTY from '@/asserts/collection-empty@2x.png'
import EMAIL_SENDING from '@/asserts/email-sending@2x.png'
import EMAIL_SUCCESS from '@/asserts/email-success@2x.png'
import EMAIL_FAIL from '@/asserts/email-fail@2x.png'
import './collection.scss'

const EMAIL_REGEX = /^[^\.\s@:](?:[^\s@:]*[^\s@:\.])?@[^\.\s@]+(?:\.[^\.\s@]+)*$/

export default class Collection extends Component {
  config = {
    navigationBarTitleText: '收藏',
    navigationStyle: 'custom'
  }

  state = {
    status: 0,
    count: 0,
    email: '',
    disabled: true,
    collection: [],
    selectedIndex: -1
  }

  componentWillMount() {
    const email = Taro.getStorageSync('email') || ''
    const collection = Taro.getStorageSync('collection') || []
    const count = collection.length
    this.setState({
      email,
      count,
      collection,
      disabled: count === 0
    })
  }

  collect = () => {
    this.setState(({ collection, selectedIndex: index }) => {
      collection = [...collection]
      collection.splice(index, 1, {
        ...collection[index],
        collected: false
      })
      const nc = collection.filter(c => c.collected)
      const count = nc.length
      Taro.setStorageSync('collection', nc)
      return {
        count,
        collection,
        selectedIndex: -1,
        disabled: count === 0
      }
    })
  }

  toggleDialog = () => {
    this.setState(
      ({ status }) => ({
        status: status === 0 ? 1 : 0
      }),
      () => {
        console.log(this.state.status)
        if (this.state.status === 1) {
          const value = this.state.email
          this.setState({
            disabledSend: !value || !EMAIL_REGEX.test(value)
          })
        }
      }
    )
  }

  toggleDeleteDialog = selectedIndex =>
    this.setState({
      selectedIndex
    })

  onInput = ({ detail: { value } }) => {
    const disabledSend = !value || !EMAIL_REGEX.test(value)
    const values = {
      disabledSend
    }
    if (!disabledSend) {
      values.email = value
    }
    this.setState(values)
  }

  send = () => {
    this.setState(
      {
        status: 2
      },
      () => {
        Taro.setStorageSync('email', this.state.email)
        api
          .send({
            email: this.state.email,
            collection: this.state.collection.map(c => c._id)
          })
          .then(res => {
            console.log('res', res)
            this.setState({
              status: 3
            })
          })
          .catch(err => {
            console.log('err', err)
            this.setState({
              status: 4
            })
          })
      }
    )
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  renderStep() {
    const { status } = this.state
    if (status === 1) {
      return (
        <View className='card-wrap'>
          <View className='card-header'>
            <Text>邮箱确认</Text>
          </View>
          <View className='card-body'>
            <View className='input-wrap'>
              <Input
                focus
                value={this.state.email}
                className='input'
                placeholder='请输入邮箱地址'
                onInput={this.onInput}
              />
            </View>
            <View className='tip'>
              本次操作将发送当前收藏论文列表至上面的邮箱
            </View>
          </View>
          <View className='card-footer'>
            <Button
              className='button mid primary'
              disabled={this.state.disabledSend}
              onClick={this.send}
            >
              发送
            </Button>
          </View>
        </View>
      )
    }

    if (status === 2) {
      return (
        <View className='card-wrap'>
          <View className='card-header'>
            <Text>提交发送中</Text>
          </View>
          <View className='card-body'>
            <Image
              className='icon-email-sending'
              mode='widthFix'
              src={EMAIL_SENDING}
            />
          </View>
        </View>
      )
    }

    return (
      <View className='card-wrap'>
        <View className='card-header'>
          <Text>发送{status === 3 ? '成功' : '失败'}</Text>
        </View>
        <View className='card-body'>
          <Image
            className='icon-email-status'
            mode='widthFix'
            src={status === 3 ? EMAIL_SUCCESS : EMAIL_FAIL}
          />
        </View>
      </View>
    )
  }

  render() {
    return (
      <View className='container collection'>
        <Navbar title='' backLabel='返回首页' transparent showBack />
        <View className='section tags'>
          <View className='columns section-header'>
            <View className='column left'>
              <Text className='title'>今日收藏</Text>
              <Text className='subtitle is-50'>（{this.state.count}）</Text>
            </View>
            <View className='column right' />
          </View>

          <View className='section-body'>
            <View className='catalog subjects'>
              <View className='catalog-header'>
                <Text>每日结束时会清空当前收藏夹</Text>
              </View>
              <View className='catalog-body'>
                {this.state.count === 0 ? (
                  <View className='empty'>
                    <Image
                      mode='widthFix'
                      className='icon-collection-empty'
                      src={COLLECTION_EMPTY}
                    />
                    <View className='tips'>
                      <View>
                        <Text>如你所见</Text>
                      </View>
                      <View>
                        <Text>空空如也</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <ScrollView scrollY className='scroll-view'>
                    <View className='list'>
                      {this.state.collection.map((a, i) => (
                        <View key={a._id} className='item'>
                          <View className='item-recommend'>
                            <Text>根据 {a.recommend_by} 推荐</Text>
                          </View>
                          <View className='item-title'>
                            <Text>{a.title}</Text>
                          </View>
                          <View className='item-description'>
                            <Text>{a.info}</Text>
                          </View>
                          <View className='columns item-author'>
                            <View className='column left'>
                              <Text>{a.author}</Text>
                            </View>
                            <View className='column right'>
                              <Image
                                aria-role='button'
                                className='column icon-heart'
                                src={a.collected === true ? HEART_SOLID : HEART}
                                onClick={() => this.toggleDeleteDialog(i)}
                              />
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </View>

          <View className='section-footer'>
            <Button
              disabled={this.state.disabled}
              className='button big primary'
              onClick={this.toggleDialog}
            >
              发送到邮箱
            </Button>
          </View>
        </View>
        <View className={`dialog${this.state.status > 0 ? ' open' : ''}`}>
          <View className='card email'>{this.renderStep()}</View>
          <Image
            aria-role='button'
            className='icon-close'
            mode='widthFix'
            src={CLOSE}
            onClick={this.toggleDialog}
          />
        </View>
        <View
          className={`dialog${this.state.selectedIndex > -1 ? ' open' : ''}`}
        >
          <View className='card email'>
            <View className='card-wrap'>
              <View className='card-header'>
                <Text>取消收藏</Text>
              </View>
              <View className='card-body'>
                <View className='content'>
                  取消后将从收藏列表中删除，您可以在首页重新收藏
                </View>
              </View>
              <View className='card-footer'>
                <Button className='button mid primary' onClick={this.collect}>
                  删除
                </Button>
              </View>
            </View>
          </View>
          <Image
            aria-role='button'
            className='icon-close'
            mode='widthFix'
            src={CLOSE}
            onClick={() => this.toggleDeleteDialog(-1)}
          />
        </View>
      </View>
    )
  }
}
