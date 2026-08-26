// 路由配置
import { createRouter, createWebHashHistory } from 'vue-router';
import { auth } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/pet'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/pet',
    name: 'PetHome',
    component: () => import('../views/PetHome.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated.value) {
    next('/pet');
  } else {
    next();
  }
});

export default router;
