import Taro, { Component } from '@tarojs/taro'
import {
  View,
  Text,
  ScrollView,
  Button,
  Image,
  Input
} from '@tarojs/components'
import Navbar from '@/components/navbar'
import CLOSE from '@/asserts/close@2x.png'
import X from '@/asserts/x@2x.png'
import api from '@/api'
import ARXIV from '@/arxiv'
import './settings.scss'
import { timingSafeEqual } from 'crypto'

const SUBJECTS = Object.keys(ARXIV)

export default class Settings extends Component {
  config = {
    navigationBarTitleText: '设置',
    navigationStyle: 'custom'
  }

  options = {
    addGlobalClass: true
  }

  state = {
    status: 0,
    goHome: false,
    disabled: true,
    showBack: false,
    dialogType: 0,
    dialogValue: '',
    dialogOpened: false,
    dialogDisabled: true,
    subjectsIndex: [],
    subjects: [],
    domains: [],
    authors: [],
    keys: []
  }

  componentWillMount() {
    Promise.all([
      api.getStorage('subjects'),
      api.getStorage('domains'),
      api.getStorage('authors'),
      api.getStorage('keys')
    ]).then(([subjects, domains, authors, keys]) => {
      const subjectsIndex = []
      const values = {
        subjectsIndex
      }
      values.showBack = domains.length > 0
      values.subjects = SUBJECTS.map((name, index) => {
        const selected = subjects.includes(name)
        if (selected) {
          subjectsIndex.push(index)
        }
        return {
          name,
          selected
        }
      })

      values.domains = subjects
        .map(s => ARXIV[s])
        .sort((a, b) => a.length - b.length)
        .reduce((a, b) => a.concat(b), [])
        .map(name => ({
          name,
          selected: domains.includes(name)
        }))

      if (authors.length) {
        values.authors = authors
      }
      if (keys.length) {
        values.keys = keys
      }
      console.log(values)
      this.setState(values)
      this.next()
    })
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  toggleSubject = index => {
    this.setState(({ subjectsIndex, subjects, domains }) => {
      const selected = !subjects[index].selected
      subjects[index].selected = selected
      if (selected) {
        subjectsIndex.push(index)
      } else {
        subjectsIndex.splice(subjectsIndex.indexOf(index), 1)
      }
      const count = subjectsIndex.length
      if (count > 3) {
        subjects[subjectsIndex.shift()].selected = false
      }
      return {
        subjects,
        subjectsIndex,
        disabled: count === 0,
        domains: subjectsIndex
          .map(i => SUBJECTS[i])
          .map(s => ARXIV[s])
          .sort((a, b) => a.length - b.length)
          .reduce((a, b) => a.concat(b), [])
          .map(name => {
            const e = domains.find(d => d.name === name)
            return {
              name,
              selected: Boolean(e && e.selected)
            }
          })
      }
    })
  }

  toggleDomain = index => {
    this.setState(({ domains }) => {
      domains[index].selected = !domains[index].selected
      return {
        domains,
        disabled: domains.filter(d => d.selected).length === 0
      }
    })
  }

  toggleDialog = t =>
    this.setState({
      dialogOpened: t > 0,
      dialogType: t
    })

  onDialogInput = ({ detail: { value } }) => {
    const dialogDisabled = !value
    const values = {
      dialogDisabled
    }
    if (!dialogDisabled) {
      values.dialogValue = value
    }
    this.setState(values)
  }

  save = () => {
    this.setState(({ dialogType, dialogValue, authors, keys }) => {
      const values = {
        dialogOpened: false,
        dialogValue: ''
      }
      if (dialogType === 1) {
        if (authors.includes(dialogValue)) {
          return values
        }
        authors.push(dialogValue)
        values.authors = authors
      } else {
        if (keys.includes(dialogValue)) {
          return values
        }
        keys.push(dialogValue)
        values.keys = keys
      }

      return values
    })
  }

  delete = (type, index) => {
    this.setState(({ authors, keys }) => {
      if (type === 1) {
        authors.splice(index, 1)
        return {
          authors
        }
      }
      if (type === 2) {
        keys.splice(index, 1)
        return {
          keys
        }
      }
    })
  }

  next = () => {
    this.setState(
      ({ status, subjects, domains, authors, keys }) => {
        status += 1
        let disabled = status < 4
        if (disabled) {
          switch (status) {
            case 1:
              disabled = subjects.filter(s => s.selected).length === 0
              break
            case 2:
              disabled = domains.filter(s => s.selected).length === 0
              break
            case 3:
              disabled = false
              break
          }
          console.log(status, disabled)
          return {
            status,
            disabled
          }
        }
        Taro.setStorageSync(
          'subjects',
          subjects.filter(s => s.selected).map(s => s.name)
        )
        Taro.setStorageSync(
          'domains',
          domains.filter(s => s.selected).map(s => s.name)
        )
        Taro.setStorageSync('authors', authors)
        Taro.setStorageSync('keys', keys)
        console.log(233)
        return {
          goHome: true
        }
      },
      () => {
        if (this.state.goHome === true) {
          Taro.redirectTo({
            url: '/pages/index/index'
          })
        }
      }
    )
  }

  render() {
    console.log(this.state.subjects)
    return (
      <View className='container settings'>
        <Navbar
          title=''
          backLabel='返回首页'
          transparent
          showBack={this.state.showBack}
        />
        <View className='section'>
          <View className='columns section-header'>
            <View className='column left'>
              <Text className='title'>
                {this.state.status === 3 ? '高级设置' : '标签设置'}
              </Text>
            </View>
            <View className='column right' />
          </View>

          <View className='section-body'>
            {this.state.status === 1 ? (
              <View className='catalog subjects'>
                <View className='catalog-header'>
                  <Text>请选择您关注的学科</Text>
                  <Text className='subtitle'>（最多三个）</Text>
                </View>
                <View className='catalog-body'>
                  <ScrollView scrollY className='scroll-view'>
                    <View className='buttons'>
                      {this.state.subjects.map((s, i) => (
                        <Button
                          key={i}
                          className={`button${
                            s.selected === true ? ' selected' : ''
                          }`}
                          onClick={() => this.toggleSubject(i)}
                        >
                          {s.name}
                        </Button>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            ) : null}

            {this.state.status === 2 ? (
              <View className='catalog domains'>
                <View className='catalog-header'>
                  <Text>请选择您关注的领域</Text>
                </View>
                <View className='catalog-body'>
                  <ScrollView scrollY className='scroll-view'>
                    <View className='buttons'>
                      {this.state.domains.map((s, i) => {
                        return (
                          <Button
                            key={i}
                            className={`button${
                              s.selected === true ? ' selected' : ''
                            }`}
                            onClick={() => this.toggleDomain(i)}
                          >
                            {s.name}
                          </Button>
                        )
                      })}
                    </View>
                  </ScrollView>
                </View>
              </View>
            ) : null}

            {this.state.status === 3 ? (
              <View className='catalog authors'>
                <View className='catalog-header'>
                  <Text>请设置您关注的作者</Text>
                  <Text className='subtitle'>（可选，最多五个）</Text>
                </View>
                <View className='catalog-body'>
                  <ScrollView scrollY className='scroll-view'>
                    <View className='buttons'>
                      {this.state.authors.map((k, i) => {
                        return (
                          <View key={i} className='button has-addons'>
                            <View class='left'>
                              <Text>{k}</Text>
                            </View>
                            <View
                              className='right'
                              aria-role='button'
                              onClick={() => this.delete(1, i)}
                            >
                              <Image
                                className='icon-x'
                                mode='widthFix'
                                src={X}
                              />
                            </View>
                          </View>
                        )
                      })}
                    </View>
                    <View className='actions'>
                      <Button
                        key='add'
                        className='button'
                        onClick={() => this.toggleDialog(1)}
                      >
                        + 点击增加作者
                      </Button>
                    </View>
                  </ScrollView>
                </View>
                <View className='catalog-header'>
                  <Text>请设置您关注的标题关键词</Text>
                  <Text className='subtitle'>（可选，最多五个）</Text>
                </View>
                <View className='catalog-body'>
                  <ScrollView scrollY className='scroll-view'>
                    <View className='buttons'>
                      {this.state.keys.map((k, i) => {
                        return (
                          <View key={i} className='button has-addons'>
                            <View class='left'>
                              <Text>{k}</Text>
                            </View>
                            <View
                              className='right'
                              aria-role='button'
                              onClick={() => this.delete(2, i)}
                            >
                              <Image
                                className='icon-x'
                                mode='widthFix'
                                src={X}
                              />
                            </View>
                          </View>
                        )
                      })}
                    </View>
                    <View className='actions'>
                      <Button
                        key='add'
                        className='button'
                        onClick={() => this.toggleDialog(2)}
                      >
                        + 点击增加关键词
                      </Button>
                    </View>
                  </ScrollView>
                </View>
              </View>
            ) : null}
          </View>
          <View className='section-footer'>
            {this.state.status === 3 ? (
              <View className='tips'>
                <Text>您的设置仅保存在本地，不会上传到云端</Text>
              </View>
            ) : null}
            <Button
              disabled={this.state.disabled}
              className='button big primary'
              onClick={this.next}
            >
              {this.state.status === 3 ? '保存' : '继续'}
            </Button>
          </View>
        </View>
        {this.state.dialogOpened === true ? (
          <View className='dialog open'>
            <View className='card'>
              <View className='card-wrap'>
                <View className='card-header'>
                  <Text>
                    添加{this.state.dialogType === 1 ? '作者' : '关键词'}
                  </Text>
                </View>
                <View className='card-body'>
                  <View className='input-wrap'>
                    <Input
                      focus
                      className='input'
                      placeholder={`请输入${
                        this.state.dialogType === 1 ? '作者' : '关键词'
                      }`}
                      onInput={this.onDialogInput}
                    />
                  </View>
                  <View className='tip'>模糊查询，填写关键词即可</View>
                </View>
                <View className='card-footer'>
                  <Button
                    className='button mid primary'
                    disabled={this.state.dialogDisabled}
                    onClick={this.save}
                  >
                    确认
                  </Button>
                </View>
              </View>
            </View>
            <Image
              aria-role='button'
              className='icon-close'
              mode='widthFix'
              src={CLOSE}
              onClick={() => this.toggleDialog(0)}
            />
          </View>
        ) : null}
      </View>
    )
  }
}
