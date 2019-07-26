import Taro from '@tarojs/taro'
const API_URL = 'https://arxiv.russellcloud.com/v1'

export default {
  search(data) {
    return Taro.request({
      url: `${API_URL}/search`,
      method: 'POST',
      data
    }).then(({ statusCode, data }) => {
      if (statusCode === 200 && data.code === 200) {
        return data.data
      }
      const error = new Error(data.data)
      error.code = data.code
      throw error
    })
  },
  send(data) {
    return Taro.request({
      url: `${API_URL}/send`,
      method: 'POST',
      data
    }).then(({ statusCode, data }) => {
      if (statusCode === 200 && data.code === 200) {
        return data.data
      }
      const error = new Error(data.data)
      error.code = data.code
      throw error
    })
  }
}
