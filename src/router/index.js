import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/main/HomeView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import { getAccessToken, removeAccessToken } from '@/utils/storage';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Router');

const routes = [
  {
    path: '/',
    redirect: '/map',
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/main/MapView.vue'),
  },
  {
    path: '/saved',
    name: 'saved',
    component: () => import('@/views/main/SavedView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/profile/ProfileView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/auth/SignupView.vue')
  },

  {
    path: '/test-components',
    name: 'test-components',
    component: () => import('@/views/dev/ComponentTestView.vue')
  },
  {
    path: '/oauth/callback',
    name: 'oauth-callback',
    component: () => import('@/views/auth/OAuthCallbackView.vue')
  },
  {
    path: '/review/write',
    name: 'review-write',
    component: () => import('@/views/review/ReviewWriteView.vue')
  },
  {
    path: '/my-reviews',
    name: 'my-reviews',
    component: () => import('@/views/review/MyReviewsView.vue')
  },
  {
    path: '/reviews/:reviewId',
    name: 'review-detail',
    component: () => import('@/views/review/ReviewDetailView.vue')
  },
  {
    path: '/reviews/:reviewId/edit',
    name: 'review-edit',
    component: () => import('@/views/review/ReviewEditView.vue')
  },
  {
    path: '/my-preference',
    name: 'my-preference',
    component: () => import('@/views/profile/MyPreferenceView.vue')
  },
  {
    path: '/my-profile/edit',
    name: 'my-profile-edit',
    component: () => import('@/views/profile/MyProfileEditView.vue')
  },
  {
    path: '/store/:storeId',
    name: 'store-detail',
    component: () => import('@/views/store/StoreDetailView.vue')
  },
  {
    path: '/passport',
    name: 'passport',
    component: () => import('@/views/passport/PassportView.vue')
  },
  {
    path: '/recommendation',
    name: 'recommendation',
    component: () => import('@/views/main/RecommendationView.vue')
  },
  {
    path: '/preference-onboarding',
    name: 'preference-onboarding',
    component: () => import('@/views/profile/PreferenceOnboardingView.vue')
  },
  {
    path: '/bean/:beanId',
    name: 'bean-detail',
    component: () => import('@/views/bean/BeanDetailView.vue')
  },
  {
    path: '/menus/:menuId',
    name: 'menu-detail',
    component: () => import('@/views/store/MenuDetailView.vue')
  },
  {
    path: '/passport/:passportId',
    name: 'passport-detail',
    component: () => import('@/views/passport/PassportDetailView.vue')
  },
  {
    path: '/owner/stores',
    name: 'owner-stores',
    component: () => import('@/views/owner/OwnerStoreListView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/stores/new',
    name: 'owner-store-new',
    component: () => import('@/views/owner/OwnerStoreFormView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/stores/:storeId/edit',
    name: 'owner-store-edit',
    component: () => import('@/views/owner/OwnerStoreFormView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/stores/:storeId/menus',
    name: 'owner-menus',
    component: () => import('@/views/owner/OwnerMenuManageView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/stores/:storeId/menus/new',
    name: 'owner-menu-new',
    component: () => import('@/views/owner/OwnerMenuFormView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/menus/:menuId/edit',
    name: 'owner-menu-edit',
    component: () => import('@/views/owner/OwnerMenuFormView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/stores/:storeId/beans/new',
    name: 'owner-bean-new',
    component: () => import('@/views/owner/OwnerBeanFormView.vue'),
    meta: { requiresOwner: true }
  },
  {
    path: '/owner/apply',
    name: 'owner-apply',
    component: () => import('@/views/owner/OwnerApplicationView.vue')
  },
  {
    path: '/admin/applications',
    name: 'admin-applications',
    component: () => import('@/views/admin/AdminApplicationListView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/applications/:id',
    name: 'admin-application-detail',
    component: () => import('@/views/admin/AdminApplicationDetailView.vue'),
    meta: { requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

const PUBLIC_PAGES = new Set(['/login', '/signup', '/oauth/callback', '/test-components', '/map', '/saved', '/passport']);

const PUBLIC_PATH_PATTERNS = [
  /^\/store\/\d+$/,
  /^\/menus\/\d+$/,
  /^\/bean\/\d+$/,
  /^\/reviews\/\d+$/
];

/**
 * 토큰으로 사용자 인증 시도
 */
const tryAuthWithToken = async (authStore) => {
  let accessToken = null;

  try {
    accessToken = getAccessToken();
  } catch {
    return { success: false, redirect: '/login' };
  }

  if (!accessToken) {
    return { success: false, redirect: '/login' };
  }

  try {
    await authStore.fetchUser();
    return { success: true };
  } catch {
    try {
      removeAccessToken();
    } catch { /* empty */ }
    return { success: false, redirect: '/login' };
  }
};



/**
 * 공개 페이지 여부 확인
 */
const isPublicPage = (path) => {
  if (PUBLIC_PAGES.has(path)) return true;
  return PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(path));
};

/**
 * 비인증 사용자 라우팅 처리
 */
const handleUnauthenticatedUser = async (authStore, _targetPath) => {
  const result = await tryAuthWithToken(authStore);
  return result.redirect ?? null;
};

const handleAuthenticatedUser = (authStore, targetPath) => {
  if (!authStore.isAuthenticated) {
    return null;
  }

  if (targetPath === '/login' || targetPath === '/signup') {
    return '/';
  }
  return null;
};

/**
 * 네비게이션 가드 설정
 */
router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('@/store/auth');
  const authStore = useAuthStore();

  logger.debug(`네비게이션: ${from.path} → ${to.path}`);

  if (isPublicPage(to.path)) {
    if (authStore.isAuthenticated) {
      const redirect = handleAuthenticatedUser(authStore, to.path);
      if (redirect) {
        logger.info(`인증된 사용자 공개 페이지 리다이렉트 → ${redirect}`);
        next(redirect);
        return;
      }
    }

    next();
    return;
  }

  if (!authStore.isAuthenticated) {
    const redirect = await handleUnauthenticatedUser(authStore, to.path);
    if (redirect) {
      logger.info(`비인증 사용자 비공개 페이지 접근 → ${redirect}로 리다이렉트`);
      next(redirect);
      return;
    }
  }

  const redirect = handleAuthenticatedUser(authStore, to.path);
  if (redirect) {
    logger.info(`인증된 사용자 추가 검증 → ${redirect}로 리다이렉트`);
    next(redirect);
    return;
  }

  if (to.meta?.requiresOwner && !authStore.isOwner) {
    logger.warn('점주 권한 없음 - 접근 거부', { path: to.path })
    next('/')
    return
  }

  if (to.meta?.requiresAdmin && !authStore.isAdmin) {
    logger.warn('관리자 권한 없음 - 접근 거부', { path: to.path })
    next('/')
    return
  }

  next();
});

export default router;