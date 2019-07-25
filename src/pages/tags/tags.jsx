import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Navbar from '@/components/navbar'
import './tags.scss'

export default class Tags extends Component {
  config = {
    navigationBarTitleText: '首页'
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return (
      <View className="section tags">
        <Navbar title="" transparent />
        <View className="columns section-header">
          <View className="column left">
            <Text className="title">标签设置</Text>
          </View>
          <View className="column right" />
        </View>
      </View>
    )
  }
}
