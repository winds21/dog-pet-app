<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>🐶 狗狗养成乐园</h1>
        <p>创建你的账号</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="至少3个字符"
            required
            minlength="3"
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="至少6个字符"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="再次输入密码"
            required
          />
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <button type="submit" class="auth-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        
        <p class="switch-link">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../api/auth';
import { auth } from '../stores/auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (!username.value.trim() || !password.value) {
    error.value = '请填写所有字段';
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }
  
  error.value = '';
  loading.value = true;
  
  try {
    const { data } = await register(username.value.trim(), password.value);
    auth.setAuth(data.token, data.user);
    router.push('/pet');
  } catch (err) {
    error.value = err.response?.data?.error || '注册失败，请重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  padding: 20px;
}

.auth-container {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h1 {
  font-size: 28px;
  color: #5a3e2b;
  margin: 0 0 8px;
}

.auth-header p {
  color: #9c7a5b;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #5a3e2b;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e8d8c0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  background: #f0faf5;
}

.form-group input:focus {
  border-color: #11998e;
}

.error-message {
  background: #fee;
  color: #c0392b;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.auth-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
  margin-top: 10px;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(17, 153, 142, 0.4);
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-link {
  text-align: center;
  color: #9c7a5b;
  font-size: 14px;
  margin: 0;
}

.switch-link a {
  color: #11998e;
  text-decoration: none;
  font-weight: 600;
}

.switch-link a:hover {
  text-decoration: underline;
}
</style>
