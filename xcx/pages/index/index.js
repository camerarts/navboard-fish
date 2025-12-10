import { INITIAL_CATEGORIES, INITIAL_BOOKMARKS, SEARCH_ENGINES } from '../../utils/constants';

const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    categories: [],
    engines: SEARCH_ENGINES,
    engineIndex: 0,
    searchQuery: '',
    weather: null,
    currentDate: {
      month: '',
      day: '',
      weekday: '',
      time: ''
    }
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight });

    this.initData();
    this.initClock();
    this.fetchWeather();
  },

  initData() {
    // Process data to nest bookmarks into categories for easier rendering
    const bookmarks = wx.getStorageSync('bookmarks') || INITIAL_BOOKMARKS;
    const rawCategories = wx.getStorageSync('categories') || INITIAL_CATEGORIES;

    const categories = rawCategories.map(cat => {
      return {
        ...cat,
        bookmarks: bookmarks.filter(b => b.categoryId === cat.id).map(b => ({
          ...b,
          initial: b.title.charAt(0).toUpperCase()
        }))
      };
    });

    this.setData({ categories });
  },

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      this.setData({
        currentDate: {
          month: now.getMonth() + 1,
          day: now.getDate(),
          weekday: weekdays[now.getDay()],
          time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        }
      });
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  fetchWeather() {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        const { latitude, longitude } = res;
        wx.request({
          url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
          success: (apiRes) => {
            const data = apiRes.data;
            if (data.current) {
              this.setData({
                weather: {
                  temp: Math.round(data.current.temperature_2m),
                  city: '本地', // OpenMeteo doesn't provide city name easily, use Geocoding API in prod
                  max: Math.round(data.daily.temperature_2m_max[0]),
                  min: Math.round(data.daily.temperature_2m_min[0])
                }
              });
            }
          }
        });
      },
      fail: (err) => {
        console.log("Location denied or failed", err);
      }
    });
  },

  bindEngineChange(e) {
    this.setData({ engineIndex: e.detail.value });
  },

  onSearch() {
    const query = this.data.searchQuery.trim();
    if (!query) return;

    const engine = this.data.engines[this.data.engineIndex];
    const url = engine.urlTemplate + encodeURIComponent(query);
    
    // WMP cannot open arbitrary external links directly.
    // We copy to clipboard or prompt user.
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '搜索链接已复制',
          icon: 'success'
        });
      }
    });
  },

  onBookmarkTap(e) {
    const { url, title } = e.currentTarget.dataset;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'none'
        });
      }
    });
  },

  showSettings() {
    wx.showActionSheet({
      itemList: ['重置数据'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.clearStorageSync();
          this.initData();
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  }
});
