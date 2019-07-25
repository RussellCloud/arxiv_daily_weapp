import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Navbar from '@/components/navbar'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import './collection.scss'

export default class Collection extends Component {
  config = {
    navigationBarTitleText: '收藏',
    navigationStyle: 'custom'
  }

  state = {
    count: 0,
    disabled: true,
    collection: []
  }

  componentWillMount() {
    const collection = Taro.getStorageSync('collection') || []
    const count = collection.length
    this.setState({
      count,
      collection,
      disabled: count === 0
    })
  }

  collect = (item, index) => {
    this.setState(({ collection }) => {
      item.collected = !item.collected
      collection.splice(index, 1, item)
      const nc = collection.filter(c => c.collected)
      const count = nc.length
      Taro.setStorageSync('collection', nc)
      return {
        count,
        collection,
        disabled: count === 0
      }
    })
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return (
      <View className="container collection">
        <Navbar title="" backLabel="返回首页" transparent showBack />
        <View className="section tags">
          <View className="columns section-header">
            <View className="column left">
              <Text className="title">今日收藏</Text>
              <Text className="subtitle is-50">（{count}）</Text>
            </View>
            <View className="column right" />
          </View>

          <View className="section-body">
            <View className="catalog subjects">
              <View className="catalog-header">
                <Text>每日结束时会清空当前收藏夹</Text>
              </View>
              <View className="catalog-body">
                <ScrollView scrollY className="scroll-view">
                  <View className="list">
                    {this.state.collection.map((a, i) => (
                      <View key={a._id} className="item">
                        <View className="item-recommend">
                          <Text>根据 {a.recommend_by} 推荐</Text>
                        </View>
                        <View className="item-title">
                          <Text>{a.title}</Text>
                        </View>
                        <View className="item-description">
                          <Text>{a.info}</Text>
                        </View>
                        <View className="columns item-author">
                          <View className="column left">
                            <Text>{a.author}</Text>
                          </View>
                          <View className="column right">
                            <Image
                              aria-role="button"
                              // mode="widthFix"
                              className="column icon-heart"
                              src={a.collected ? HEART_SOLID : HEART}
                              onClick={() => this.collect(a, i)}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          <View className="section-footer">
            <Button
              disabled={this.state.disabled}
              className="button big primary"
              // onClick={this.next}
            >
              发送到邮箱
            </Button>
          </View>
        </View>
      </View>
    )
  }
}
