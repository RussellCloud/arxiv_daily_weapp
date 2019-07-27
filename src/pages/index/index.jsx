import Taro, { Component } from '@tarojs/taro'
import { View, Text, ScrollView, Image, Navigator } from '@tarojs/components'
import Navbar from '@/components/navbar'
import api from '@/api'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import COLLECT from '@/asserts/collect@2x.png'
import ARXIV_EMPTY from '@/asserts/arxiv-empty@2x.png'
import './index.scss'

const getDate = () => {
  return '2019-07-26'
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`
}

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

export default class Index extends Component {
  config = {
    navigationBarTitleText: '首页',
    navigationStyle: 'custom',
    enablePullDownRefresh: true
  }

  options = {
    addGlobalClass: true
  }

  state = {
    loading: false,
    cleanup: false,
    scrollTop: 0,
    status: 0,
    date: '',
    domains: [],
    authors: [],
    keys: [],
    collection: [],
    list: [],
    page: 1,
    pre_page: 10,
    total: 0,
    direction: 0
  }

  onPullDownRefresh() {
    this.setState(
      {
        loading: false,
        page: 1,
        direction: 0
      },
      this.fetch
    )
  }

  collect = (item, index) => {
    this.setState(({ list, collection }) => {
      collection = [...collection]
      list = [...list]
      item.collected = !item.collected
      list.splice(index, 1, item)
      const ci = collection.findIndex(c => c._id === item._id)
      if (ci === -1) {
        collection.push(item)
      } else {
        collection.splice(ci, 1)
      }
      Taro.setStorageSync('collection', collection)
      return {
        list,
        collection
      }
    })
  }

  componentWillMount() {
    console.log('will mount')
  }

  fetch = () => {
    console.log(this.state.status, this.state.pullUp)
    if (this.state.status === 1) {
      if (this.state.direction === 0) {
        this.setState({
          cleanup: true,
          loading: true
        })
      }
      const start = Date.now()

      return api
        .search({
          subject: this.state.domains,
          author: this.state.authors,
          title: this.state.keys,
          date: this.state.date,
          page: this.state.page,
          pre_page: this.state.pre_page
        })
        .catch(err => {
          console.log('fetch error', err)
          return {
            list: [],
            total: 0
          }
        })
        .then(res => {
          return new Promise(resolve => {
            const end = Date.now()
            setTimeout(() => {
              Taro.stopPullDownRefresh()
              this.setState(
                ({ list, cleanup, collection }) => {
                  if (cleanup) {
                    list = []
                  }
                  const { total, list: nl } = res
                  list = [...list].concat(
                    nl.map(item => {
                      formatData(item)
                      item.collected = Boolean(
                        collection.find(c => c._id === item._id)
                      )
                      return item
                    })
                  )

                  // list.forEach(p => console.log(p._id, p.collected))
                  return {
                    total,
                    list,
                    cleanup: false,
                    loading: false
                  }
                },
                () => resolve(res)
              )
            }, 1000 - (end - start))
          })
        })
    }
  }

  sync() {
    return Promise.all([
      api.getStorage('subjects'),
      api.getStorage('domains'),
      api.getStorage('authors'),
      api.getStorage('keys'),
      api.getStorage('collection'),
      api.getStorage('date')
    ]).then(([subjects, domains, authors, keys, collection, date]) => {
      const values = {}
      let can = false
      if (subjects.length) {
        values.subjects = subjects
      }
      if (domains.length) {
        values.domains = domains
        can = true
      }
      if (authors.length) {
        values.authors = authors
        can = true
      }
      if (keys.length) {
        values.keys = keys
        can = true
      }

      const today = getDate()
      if (date && date !== today) {
        Taro.removeStorageSync('collection')
        values.collection = []
      } else {
        values.collection = collection
      }
      values.date = today
      Taro.setStorageSync('date', today)

      return {
        values,
        can
      }
    })
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {
    console.log('show')
    this.sync().then(({ can, values }) => {
      if (!can) {
        Taro.navigateTo({
          url: '/pages/settings/settings?start=1'
        })
        return
      }

      values.status = 1
      this.setState(values, this.fetch)
    })
  }

  componentDidHide() {}

  onScrollToUpper = e => {
    console.log(e)
    Taro.startPullDownRefresh()
  }

  onScrollToLower = () => {
    if (this.state.direction === 0 && this.state.page < this.state.total) {
      this.setState(
        {
          direction: 1,
          page: this.state.page + 1
        },
        () => {
          this.fetch()
            .then(({ list, total }) => {
              this.setState({
                direction:
                  this.state.page === total || list.length === 0 ? 2 : 0
              })
            })
            .catch(() => {
              this.setState({
                direction: 0
              })
            })
        }
      )
    }
  }

  render() {
    return (
      <View className='container index'>
        <Navbar title='' transparent />
        <View className='section explore'>
          <View className='columns section-header'>
            <View className='column left'>
              <Text className='title'>arXiv日报</Text>
              <Text className='subtitle'>{this.state.date.substr(5)}期</Text>
            </View>
            <View className='column right'>
              <View className='tags'>
                <Navigator url='/pages/settings/settings'>
                  <Text className='btn' aria-role='button'>
                    标签设置
                  </Text>
                </Navigator>
              </View>
            </View>
          </View>

          {this.state.status === 1 ? (
            <View className='section-body read-list'>
              {this.state.list.length > 0 ? (
                <ScrollView
                  scrollY
                  enableFlex
                  // enableBackToTop
                  className='scroll-view'
                  // scrollTop={this.state.scrollTop}
                  onScrollToUpper={this.onScrollToUpper}
                  onScrollToLower={this.onScrollToLower}
                >
                  <View className='list'>
                    {this.state.list.map((a, i) => (
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
                          <View
                            className='column right'
                            aria-role='button'
                            onClick={() => this.collect(a, i)}
                          >
                            {a.collected ? (
                              <Image
                                className='column icon-heart'
                                src={HEART_SOLID}
                              />
                            ) : (
                              <Image
                                aria-role='button'
                                className='column icon-heart'
                                src={HEART}
                              />
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
              {this.state.loading === false && this.state.list.length === 0 ? (
                <View className='empty'>
                  <Image
                    mode='widthFix'
                    className='icon-collection-empty'
                    src={ARXIV_EMPTY}
                  />
                  <View className='tips'>
                    <View>
                      <Text>很遗憾</Text>
                    </View>
                    <View>
                      <Text>今天没有你关注的新玩意</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className='section-footer loading'>
            {this.state.direction === 1 ? <Text>正在加载后续部分…</Text> : null}
            {this.state.direction === 2 ? (
              <Text>以上就是今日所有新鲜玩意</Text>
            ) : null}
          </View>

          <View className='affix'>
            <Navigator url='/pages/collection/collection'>
              <Image
                aria-role='button'
                className='collect'
                mode='widthFix'
                src={COLLECT}
              />
            </Navigator>
          </View>
        </View>

        {this.state.loading === true ? (
          <View className='dialog open'>
            <View className='card loading'>
              <View class='coffee-mug'>
                <View className='coffee-container'>
                  <View className='coffee' />
                </View>
              </View>
              <View class='tips'>
                <Text>正在更新今日新番</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    )
  }
}
