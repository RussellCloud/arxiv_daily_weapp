import Taro, { Component } from '@tarojs/taro'
import {
  View,
  Text,
  Button,
  ScrollView,
  Image,
  Navigator
} from '@tarojs/components'
import Navbar from '@/components/navbar'
import api from '@/api'
import ARXIV from './arxiv'
import HEART from '@/asserts/heart@2x.png'
import HEART_SOLID from '@/asserts/heart-solid@2x.png'
import COLLECT from '@/asserts/collect@2x.png'
import './index.scss'
import { clearLine } from 'readline'

const SUBJECTS = Object.keys(ARXIV)

const getDate = () => {
  const today = new Date()
  return `${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`
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
    navigationStyle: 'custom'
  }

  options = {
    addGlobalClass: true
  }

  state = {
    prevDate: '',
    date: '',
    status: 0,
    disabled: true,
    subjects: [],
    domains: [],
    authors: [],
    keys: [],
    data: [],
    collection: []
  }

  selectSubject = (s, i) => {
    this.setState(({ subjects }) => {
      if (i === -1) {
        subjects.push(s)
        if (subjects.length > 3) {
          subjects.shift()
        }
      } else {
        subjects.splice(i, 1)
      }
      return {
        subjects,
        disabled: subjects.length === 0
      }
    })
  }

  selectDomain = (d, i) => {
    this.setState(({ domains }) => {
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
    this.setState(({ status, subjects, domains, authors }) => {
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
        }
        console.log(1, status, disabled)
        return {
          status,
          disabled
        }
      }
      Taro.setStorageSync('subjects', subjects)
      Taro.setStorageSync('domains', domains)
      Taro.setStorageSync('authors', authors)
      return {
        status: 0
      }
    }, this.fetch)
  }

  collect = (item, index) => {
    this.setState(({ data, collection }) => {
      item.collected = !item.collected
      data.splice(index, 1, item)
      const ci = collection.findIndex(c => c._id === item._id)
      if (ci === -1) {
        collection.push(item)
      } else {
        collection.splice(ci, 1)
      }
      Taro.setStorageSync('collection', collection)
      return {
        data,
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
      const { collection } = this.state
      this.setState(({ data }) => {
        data = new Array(10)
          .fill(0)
          .map((a, i) => a + i)
          .map(a => {
            if (ITEM.recommend_by > 40) {
              ITEM.recommend_by = ITEM.recommend_by.substr(0, 37) + '...'
            }
            if (ITEM.title.length > 100) {
              ITEM.title = ITEM.title.substr(0, 97) + '...'
            }
            if (ITEM.info.length > 130) {
              ITEM.info = ITEM.info.substr(0, 127) + '...'
            }
            if (ITEM.author.length > 50) {
              ITEM.author = ITEM.author.substr(0, 47) + '...'
            }
            const _id = a
            return {
              ...ITEM,
              _id,
              collected: collection.findIndex(c => c._id === _id) > -1
            }
          })
        return {
          data
        }
      })
      // api.search({
      //   subjects: this.state.domains.join(','),
      //   author: [].join(',')
      // })
    }
  }

  componentDidMount() {
    this.fetch()
  }

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  renderStep() {
    const { status, subjects, domains } = this.state
    console.log('status', status, 'subjects', subjects, 'domains', domains)

    if (status === 1) {
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
                  const i = subjects.indexOf(s)
                  return (
                    <Button
                      key={s}
                      className={`button${i !== -1 ? ' selected' : ''}`}
                      onClick={() => this.selectSubject(s, i)}
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
    if (status === 2) {
      const DOMAINS = subjects
        .map(s => ARXIV[s])
        .sort((a, b) => a.length - b.length)
        .reduce((a, b) => a.concat(b))
      return (
        <View className="catalog domains">
          <View className="catalog-header">
            <Text>请选择您关注的领域</Text>
          </View>
          <View className="catalog-body">
            <ScrollView scrollY className="scroll-view">
              <View className="buttons">
                {DOMAINS.map(d => {
                  const i = domains.indexOf(d)
                  return (
                    <Button
                      key={d}
                      className={`button${i !== -1 ? ' selected' : ''}`}
                      onClick={() => this.selectDomain(d, i)}
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

    return (
      <View className="catalog authors">
        <View className="catalog-header">
          <Text>请设置您关注的作者</Text>
          <Text className="subtitle">（可选，最多五个）</Text>
        </View>
        <View className="catalog-body">
          <ScrollView scrollY className="scroll-view">
            <View className="buttons" />
            <View className="actions">
              <Button key="add" className="button" onClick={() => {}}>
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
            <View className="buttons" />
            <View className="actions">
              <Button key="add" className="button" onClick={() => {}}>
                + 点击增加关键词
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    )
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
                {this.state.status === 2 ? '保存' : '继续'}
              </Button>
            </View>
          </View>
        ) : (
          <View className="section explore">
            <View className="columns section-header">
              <View className="column left">
                <Text className="title">arXiv日报</Text>
                <Text className="subtitle">{this.state.date}期</Text>
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
              <ScrollView scrollY className="scroll-view">
                <View className="list">
                  {this.state.data.map((a, i) => (
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

            {/* <View className="section-footer" /> */}
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
      </View>
    )
  }
}
