import Taro, { Component } from '@tarojs/taro'
import {
  View,
  Text,
  Button,
  ScrollView,
  Image,
  Navigator,
  Input
} from '@tarojs/components'
import Navbar from '@/components/navbar'
import api from '@/api'
import ARXIV from './arxiv'
import CLOSE from '@/asserts/close@2x.png'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import COLLECT from '@/asserts/collect@2x.png'
import ARXIV_EMPTY from '@/asserts/arxiv-empty@2x.png'
import './index.scss'

const SUBJECTS = Object.keys(ARXIV)

const getDate = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`
}

const ITEM = {
  _id: 3459,
  arxiv_id: '1907.10589',
  author: 'Tobechukwu Agbele, Bing Xu, Richard Jiang',
  comment: '',
  date: '2019-07-25',
  info:
    'Blockchain has been emerging as a promising technology that could totally change the landscape of data security in the coming years, particularly for data access over Internet-of-Things and cloud servers. However, blockchain itself, though secured by its protocol, does not identify who owns the data and who uses the data. Other than simply encrypting data into keys, in this paper, we proposed a protocol called Biometric Blockchain (BBC) that explicitly incorporate the biometric cues of individuals to unambiguously identify the creators and users in a blockchain-based system, particularly to address the increasing needs to secure the food logistics, following the recently widely reported incident on wrongly labelled foods that caused the death of a customer on a flight. The advantage of using BBC in the food logistics is clear: it can not only identify if the data or labels are authentic, but also clearly record who is responsible for the secured data or labels. As a result, such a BBC-based solution can great ease the difficulty to control the risks accompanying the food logistics, such as faked foods or wrong gradient labels.',
  pdf_url: 'https://arxiv.org/pdf/1907.10589',
  recommend_by: 'Cryptography',
  subject:
    'Cryptography and Security (cs.CR); Computer Vision and Pattern Recognition (cs.CV); Distributed, Parallel, and Cluster Computing (cs.DC)',
  title:
    'Biometric Blockchain: A Better Solution for the Security and Trust of Food Logistics'
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
    prevDate: '',
    date: '',
    status: 0,
    disabled: true,
    subjects: [],
    domains: [],
    authors: [],
    keys: [],
    collection: [],
    inputValue: '',
    showInputDialog: 0,
    disabledInput: true,
    list: [],
    page: 1,
    pre_page: 10,
    total: 0,
    pullUp: 0
  }

  onPullDownRefresh(params) {
    this.setState(
      {
        status: 0,
        loading: false,
        page: 1,
        list: [],
        pullUp: 0
      },
      () => {
        this.fetch()
      }
    )
  }

  selectSubject = (s, i) => {
    this.setState(({ subjects, domains }) => {
      subjects = [...subjects]
      if (i === -1) {
        subjects.push(s)
        if (subjects.length > 3) {
          subjects.shift()
        }
      } else {
        subjects.splice(i, 1)
      }
      const allDomains = subjects
        .map(s => ARXIV[s])
        .reduce((a, b) => a.concat(b), [])
      return {
        subjects,
        domains: domains.filter(d => allDomains.includes(d)),
        disabled: subjects.length === 0
      }
    })
  }

  selectDomain = (d, i) => {
    this.setState(({ domains }) => {
      domains = [...domains]
      if (i === -1) {
        domains.push(d)
      } else {
        domains.splice(i, 1)
      }
      return {
        domains,
        disabled: domains.length === 0
      }
    })
  }

  next = () => {
    this.setState(({ status, subjects, domains, authors, keys }) => {
      status += 1
      let disabled = status < 4
      console.log(0, status, disabled)
      if (disabled) {
        switch (status) {
          case 1:
            disabled = subjects.length === 0
            break
          case 2:
            disabled = domains.length === 0
            break
          case 3:
            disabled = false
            break
        }
        console.log(1, status, disabled)
        return {
          status,
          disabled
        }
      }
      const date = getDate()
      Taro.setStorageSync('subjects', subjects)
      Taro.setStorageSync('domains', domains)
      Taro.setStorageSync('authors', authors)
      Taro.setStorageSync('keys', keys)
      Taro.setStorageSync('date', date)
      return {
        status: 0,
        date
      }
    }, this.fetch)
  }

  collect = (item, index) => {
    this.setState(({ list, collection }) => {
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
    const subjects = Taro.getStorageSync('subjects') || []
    const domains = Taro.getStorageSync('domains') || []
    const authors = Taro.getStorageSync('authors') || []
    const keys = Taro.getStorageSync('keys') || []
    const prevDate = Taro.getStorageSync('date') || ''
    const date = getDate()
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

    if (prevDate && prevDate !== date) {
      Taro.removeStorageSync('date')
      Taro.removeStorageSync('collection')
      values.collection = []
    } else {
      values.collection = Taro.getStorageSync('collection') || []
    }
    values.date = date

    if (can) {
      Taro.setStorageSync('date', date)
      this.setState(values)
    } else {
      Taro.removeStorageSync('subjects')
      Taro.removeStorageSync('domains')
      Taro.removeStorageSync('authors')
      Taro.removeStorageSync('date')
      Taro.removeStorageSync('collection')
      this.next()
    }
  }

  fetch = () => {
    if (this.state.status === 0) {
      this.setState({
        loading: true
      })

      return api
        .search({
          subject: this.state.domains,
          author: this.state.authors,
          title: this.state.keys,
          date: this.state.date,
          page: this.state.page,
          pre_page: this.state.pre_page
        })
        .then(res => {
          Taro.stopPullDownRefresh()
          this.setState(({ list }) => {
            list = [...list].concat(
              res.list.map(item => {
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
              })
            )

            return {
              list,
              total: res.total,
              loading: false
            }
          })
          return res
        })
        .catch(err => {
          Taro.stopPullDownRefresh()
          this.setState({
            loading: false
          })
        })
    }
  }

  componentDidMount() {
    this.fetch()
  }

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  renderStep() {
    const { status, subjects, domains, authors, keys } = this.state
    console.log('status', status, 'subjects', subjects, 'domains', domains)

    if (status === 3) {
      console.log(3, status === 3)
      return (
        <View className="catalog authors">
          <View className="catalog-header">
            <Text>请设置您关注的作者</Text>
            <Text className="subtitle">（可选，最多五个）</Text>
          </View>
          <View className="catalog-body">
            <ScrollView scrollY className="scroll-view">
              <View className="buttons">
                {authors.map((k, i) => {
                  return (
                    <View key={k} className="button has-addons">
                      <Button className="button">{k}</Button>
                      <Button
                        className="button close"
                        onClick={() => this.deleteAuthor(i)}
                      >
                        X
                      </Button>
                    </View>
                  )
                })}
              </View>
              <View className="actions">
                <Button
                  key="add"
                  className="button"
                  onClick={() => this.toggleInputDialog(1)}
                >
                  + 点击增加作者
                </Button>
              </View>
            </ScrollView>
          </View>
          <View className="catalog-header">
            <Text>请设置您关注的标题关键词</Text>
            <Text className="subtitle">（可选，最多五个）</Text>
          </View>
          <View className="catalog-body">
            <ScrollView scrollY className="scroll-view">
              <View className="buttons">
                {keys.map((k, i) => {
                  return (
                    <View key={k} className="button has-addons">
                      <Button className="button">{k}</Button>
                      <Button
                        className="button close"
                        onClick={() => this.deleteKey(i)}
                      >
                        X
                      </Button>
                    </View>
                  )
                })}
              </View>
              <View className="actions">
                <Button
                  key="add"
                  className="button"
                  onClick={() => this.toggleInputDialog(2)}
                >
                  + 点击增加关键词
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      )
    } else if (status === 2) {
      console.log(2, status === 2)
      const DOMAINS = subjects
        .map(s => ARXIV[s])
        .sort((a, b) => a.length - b.length)
        .reduce((a, b) => a.concat(b), [])
      return (
        <View className="catalog domains">
          <View className="catalog-header">
            <Text>请选择您关注的领域</Text>
          </View>
          <View className="catalog-body">
            <ScrollView scrollY className="scroll-view">
              <View className="buttons">
                {DOMAINS.map(d => {
                  return (
                    <Button
                      key={d}
                      className={`button${
                        domains.indexOf(d) !== -1 ? ' selected' : ''
                      }`}
                      onClick={() => this.selectDomain(d, domains.indexOf(d))}
                    >
                      {d}
                    </Button>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )
    }
    console.log(1, status === 1)

    return (
      <View className="catalog subjects">
        <View className="catalog-header">
          <Text>请选择您关注的学科</Text>
          <Text className="subtitle">（最多三个）</Text>
        </View>
        <View className="catalog-body">
          <ScrollView scrollY className="scroll-view">
            <View className="buttons">
              {SUBJECTS.map(s => {
                return (
                  <Button
                    key={s}
                    className={`button${
                      subjects.indexOf(s) === -1 ? '' : ' selected'
                    }`}
                    onClick={() => this.selectSubject(s, subjects.indexOf(s))}
                  >
                    {s}
                  </Button>
                )
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    )
  }

  onInput = ({ detail: { value } }) => {
    const disabledInput = !value
    const values = {
      disabledInput
    }
    if (!disabledInput) {
      values.inputValue = value
    }
    this.setState(values)
  }

  toggleInputDialog = s =>
    this.setState({
      showInputDialog: s
    })

  send = () => {
    if (this.state.showInputDialog === 1) {
      if (this.state.authors.includes(this.state.inputValue)) {
        return
      }
      this.setState(({ authors }) => {
        authors = [...authors]
        authors.push(this.state.inputValue)
        this.refs.input.value = ''
        return {
          authors,
          inputValue: '',
          showInputDialog: 0,
          disabledInput: authors.length === 5
        }
      })
    } else if (this.state.showInputDialog === 2) {
      if (this.state.keys.includes(this.state.inputValue)) {
        return
      }
      this.setState(({ keys }) => {
        keys = [...keys]
        keys.push(this.state.inputValue)
        this.refs.input.value = ''
        return {
          keys,
          inputValue: '',
          showInputDialog: 0,
          disabledInput: keys.length === 5
        }
      })
    }
  }

  deleteAuthor = index => {
    this.setState(({ authors }) => {
      authors = [...authors]
      authors.splice(index, 1)
      return {
        authors
      }
    })
  }

  deleteKey = index => {
    this.setState(({ keys }) => {
      keys = [...keys]
      keys.splice(index, 1)
      return {
        keys
      }
    })
  }

  onScrollToUpper = e => {
    console.log(e)
    Taro.startPullDownRefresh()
  }

  onScrollToLower = e => {
    console.log(233, this.state.pullUp, this.state.page, this.state.total)
    if (this.state.pullUp === 0 && this.state.page < this.state.total) {
      this.setState(
        {
          pullUp: 1,
          page: this.state.page + 1
        },
        () => {
          this.fetch()
            .then(res => {
              this.setState({
                pullUp:
                  this.state.page === this.state.total || res.list.length === 0
                    ? 2
                    : 0
              })
            })
            .catch(() => {
              this.setState({
                pullUp: 0
              })
            })
        }
      )
    }
  }

  render() {
    console.log(this.state.status)
    return (
      <View className="container index">
        <Navbar title="" transparent />
        {this.state.status ? (
          <View className="section tags">
            <View className="columns section-header">
              <View className="column left">
                <Text className="title">
                  {this.state.status === 3 ? '高级设置' : '标签设置'}
                </Text>
              </View>
              <View className="column right" />
            </View>

            <View className="section-body">{this.renderStep()}</View>

            <View className="section-footer">
              <Button
                disabled={this.state.disabled}
                className="button big primary"
                onClick={this.next}
              >
                {this.state.status === 3 ? '保存' : '继续'}
              </Button>
            </View>
          </View>
        ) : (
          <View className="section explore">
            <View className="columns section-header">
              <View className="column left">
                <Text className="title">arXiv日报</Text>
                <Text className="subtitle">{this.state.date.substr(5)}期</Text>
              </View>
              <View className="column right">
                <View className="tags">
                  <Text className="btn" aria-role="button" onClick={this.next}>
                    标签设置
                  </Text>
                </View>
              </View>
            </View>

            <View className="section-body read-list">
              {this.state.list.length ? (
                <ScrollView
                  scrollY
                  className="scroll-view"
                  onScrollToUpper={this.onScrollToUpper}
                  onScrollToLower={this.onScrollToLower}
                >
                  <View className="list">
                    {this.state.list.map((a, i) => (
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
              ) : this.state.loading ? null : (
                <View className="empty">
                  <Image
                    mode="widthFix"
                    className="icon-collection-empty"
                    src={ARXIV_EMPTY}
                  />
                  <View className="tips">
                    <View>
                      <Text>很遗憾</Text>
                    </View>
                    <View>
                      <Text>今天没有你关注的新玩意</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View className="section-footer loading">
              {this.state.pullUp === 1 ? <Text>正在加载后续部分…</Text> : null}
              {this.state.pullUp === 2 ? (
                <Text>以上就是今日所有新鲜玩意</Text>
              ) : null}
            </View>
            <View className="affix">
              <Navigator url="/pages/collection/collection">
                <Image
                  aria-role="button"
                  className="collect"
                  mode="widthFix"
                  src={COLLECT}
                />
              </Navigator>
            </View>
          </View>
        )}
        <View
          className={`dialog${
            this.state.loading && this.state.pullUp === 0 ? ' open' : ''
          }`}
        >
          <View className="card loading">
            <View class="coffee-mug">
              <View className="coffee-container">
                <View className="coffee" />
              </View>
            </View>
            <View class="tips">
              <Text>正在更新今日新番</Text>
            </View>
          </View>
        </View>

        <View className={`dialog${this.state.showInputDialog ? ' open' : ''}`}>
          <View className="card">
            <View className="card-wrap">
              <View className="card-header">
                <Text>
                  添加{this.state.showInputDialog === 1 ? '作者' : '关键词'}
                </Text>
              </View>
              <View className="card-body">
                <View className="input-wrap">
                  <Input
                    ref="input"
                    focus
                    value={this.state.inputValue}
                    className="input"
                    placeholder={`请输入${
                      this.state.showInputDialog === 1 ? '作者' : '关键词'
                    }`}
                    onInput={this.onInput}
                  />
                </View>
                <View className="tip">模糊查询，填写关键词即可</View>
              </View>
              <View className="card-footer">
                <Button
                  className="button mid primary"
                  disabled={this.state.disabledInput}
                  onClick={() => this.send()}
                >
                  确认
                </Button>
              </View>
            </View>
          </View>
          <Image
            aria-role="button"
            className="icon-close"
            mode="widthFix"
            src={CLOSE}
            onClick={() => this.toggleInputDialog(0)}
          />
        </View>
      </View>
    )
  }
}
