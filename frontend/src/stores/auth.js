// 认证状态管理
import { reactive, computed } from 'vue';

const state = reactive({
  user: null,
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null
});

// 初始化用户信息
if (state.token && state.username) {
  state.user = { username: state.username };
}

export const auth = {
  isAuthenticated: computed(() => !!state.token),
  user: computed(() => state.user),
  token: computed(() => state.token),
  
  setAuth(token, user) {
    state.token = token;
    state.user = user;
    state.username = user.username;
    localStorage.setItem('token', token);
    localStorage.setItem('username', user.username);
  },
  
  clearAuth() {
    state.token = null;
    state.user = null;
    state.username = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  },
  
  getToken() {
    return state.token;
  }
};
