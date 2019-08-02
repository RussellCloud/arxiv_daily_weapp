import { getStorage, request } from '@tarojs/taro'

const API_URL = 'https://arxiv.russellcloud.com/v1'

const requestBuilder = opts =>
  request(opts).then(({ statusCode, data: { code, data } }) => {
    if (statusCode === 200 && code === 200) {
      return data
    }
    const error = new Error(data)
    error.code = code
    throw error
  })

export default {
  getStorage: key =>
    getStorage({ key })
      .then(({ data }) => data)
      .catch(() => []),
  search: data =>
    requestBuilder({
      url: `${API_URL}/search`,
      method: 'POST',
      data
    }),
  send: data =>
    requestBuilder({
      url: `${API_URL}/send`,
      method: 'POST',
      data
    }),
  specific: id =>
    requestBuilder({
      url: `${API_URL}/detail/${id}`
    })
}
