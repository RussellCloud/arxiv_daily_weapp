import Taro from '@tarojs/taro'
const API_URL = 'https://arxiv.russellcloud.com/v1'

export default {
  search(data) {
    return Taro.request({
      url: `${API_URL}/search`,
      // method: 'POST',
      data
    })
  }
}
