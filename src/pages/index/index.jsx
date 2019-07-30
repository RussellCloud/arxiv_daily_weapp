import Taro, { Component } from '@tarojs/taro'
import { View, Text, ScrollView, Image, Navigator } from '@tarojs/components'
import Navbar from '@/components/navbar'
import api from '@/api'
import config from '@/config'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import COLLECT from '@/asserts/collect@2x.png'
import ARXIV_EMPTY from '@/asserts/arxiv-empty@2x.png'
import './index.scss'

const { TIPS } = config

const formatDate = today => {
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
    // scrollTop: 0,
    status: 0,
    date: '',
    weekend: false,
    tipIndex: 0,
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

  componentWillMount() {}

  fetch = () => {
    const {
      state: { status, direction, domains, authors, keys, date, page, pre_page }
    } = this
    if (status === 1) {
      if (direction === 0) {
        this.setState({
          cleanup: true,
          loading: true
        })
      }
      const start = Date.now()

      return api
        .search({
          subject: domains,
          author: authors,
          title: keys,
          date: date,
          page: page,
          pre_page: pre_page
        })
        .catch(() => {
          return {
            list: [],
            total: 0
          }
        })
        .then(res => {
          return new Promise(resolve => {
            const end = Date.now()
            setTimeout(
              () => {
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
              },
              direction === 0 ? 1000 - (end - start) : 0
            )
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

      const today = new Date()
      const now = formatDate(today)
      if (date && date !== now) {
        // 清除前一天数据
        Taro.removeStorageSync('collection')
        values.collection = []
      } else {
        values.collection = collection
      }
      const weekend = today.getDay() % 6 === 0
      values.date = now
      values.weekend = weekend
      values.tipIndex = weekend ? Math.ceil(Math.random() * 2) : 0
      Taro.setStorageSync('date', now)

      return {
        values,
        can
      }
    })
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {
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

  onScrollToUpper = () => {
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

  renderTag(p, s) {
    if (p === true || s === true) {
      const t = p === true ? 'published' : 'submitted'
      return <Text className={`tag is-${t}`}>{t}</Text>
    }
    return null
  }

  render() {
    return (
      <View className='container index'>
        <Navbar title='' transparent />
        <View className='section explore'>
          <View className='columns section-header'>
            <View className='column left'>
              <Text className='title'>arXiv日报</Text>
              {this.state.weekend === true ? (
                <Text className='subtitle'>今日不营业</Text>
              ) : (
                <Text className='subtitle'>{this.state.date.substr(5)}期</Text>
              )}
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
                  className='scroll-view'
                  // enableBackToTop
                  // scrollTop={this.state.scrollTop}
                  onScrollToUpper={this.onScrollToUpper}
                  onScrollToLower={this.onScrollToLower}
                >
                  <View className='list'>
                    {this.state.list.map((a, i) => (
                      <View key={a._id} className='item'>
                        <View className='item-recommend'>
                          <Text>根据 {a.recommend_by} 推荐</Text>
                          {this.renderTag(a.is_published, a.is_submitted)}
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
                            {a.collected === true ? (
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
                      <Text>{TIPS[this.state.tipIndex].t}</Text>
                    </View>
                    <View>
                      <Text>{TIPS[this.state.tipIndex].st}</Text>
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
