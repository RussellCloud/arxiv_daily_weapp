import Taro, { Component } from '@tarojs/taro'
import { CoverView, CoverImage, Navigator } from '@tarojs/components'
import BACK from '@/asserts/back@2x.png'
import './index.scss'

export default class Navbar extends Component {
  static defaultProps = {
    title: 'arXiv',
    showBack: false,
    backLabel: '',
    transparent: false,
    isBlack40: false
  }

  static options = {
    nbs: {
      height: 0
    },
    ncs: {
      height: 0
    }
  }

  componentWillMount() {
    const { statusBarHeight } = Taro.getSystemInfoSync()
    const { top, height, bottom } = Taro.getMenuButtonBoundingClientRect()
    const dh = top - statusBarHeight
    const nh = `${bottom + dh}px`
    const th = `${height + 2 * dh}px`
    Navbar.options.nbs.height = nh
    Navbar.options.ncs.height = th
  }

  render() {
    let nbc = 'navbar'
    if (this.props.transparent) {
      nbc += ' is-transparent'
    } else if (this.props.isBlack40) {
      nbc += ' is-black-40'
    }
    const hasBackLabel = this.props.backLabel ? ' has-label' : ''
    return (
      <CoverView className={nbc} style={Navbar.options.nbs}>
        <CoverView className="navbar-container" style={Navbar.options.ncs}>
          <CoverView className={`navbar-start${hasBackLabel}`}>
            {this.props.showBack ? (
              <CoverView className="back">
                <Navigator open-type="navigateBack">
                  <CoverImage className="icon-back" src={BACK} />
                  {this.props.backLabel ? (
                    <CoverView className="label">
                      {this.props.backLabel}
                    </CoverView>
                  ) : null}
                </Navigator>
              </CoverView>
            ) : (
              <CoverView className="back" />
            )}
          </CoverView>
          <CoverView className="navbar-title">{this.props.title}</CoverView>
          <CoverView className={`navbar-end${hasBackLabel}`} />
        </CoverView>
      </CoverView>
    )
  }
}
