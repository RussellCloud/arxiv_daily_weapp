import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './collection.scss'

export default class Collection extends Component {

  config = {
    navigationBarTitleText: '首页'
  }

  componentWillMount () { }

  componentDidMount () { }

  componentWillUnmount () { }

  componentDidShow () { }

  componentDidHide () { }

  render () {
    return (
      <View className='collection'>
        <Text>Hello world!</Text>
      </View>
    )
  }
}
