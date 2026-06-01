import { defineStore } from 'pinia'
import { getUserInfo, logout as logoutApi, login as loginApi, signup as signupApi } from '@/api/auth'
import { safeStorage, removeAccessToken } from '@/utils/storage'
import { createLogger } from '@/utils/logger'
import { showSuccess } from '@/utils/toast'

const logger = createLogger('Auth')

/**
 * 인증 상태 관리 Store
 * 사용자 로그인 상태와 정보를 관리하고 LocalStorage에 자동 persist
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** 현재 로그인한 사용자 정보 */
    user: null,
    /** 로그인 상태 */
    isAuthenticated: false,
    /** 로딩 상태 */
    isLoading: false,
  }),

  getters: {
    /** 사용자 ID */
    userId: (state) => state.user?.userId || null,
    /** 사용자 이름 */
    userName: (state) => state.user?.name || '',
    /** 사용자 닉네임 (없으면 'Guest') */
    userNickname: (state) => state.user?.nickname || 'Guest',
    /** 게스트 상태 여부 */
    isGuest: (state) => !state.isAuthenticated,
    /** 사용자 이메일 */
    userEmail: (state) => state.user?.email || '',
    /** 사용자 프로필 이미지 URL */
    userProfileImage: (state) => state.user?.profileImageUrl || null,
    /** 사용자 Role */
    userRole: (state) => state.user?.role || null,
    /** 점주(OWNER) 여부 */
    isOwner: (state) => state.user?.role === 'OWNER',
    /** 관리자(ADMIN) 여부 */
    isAdmin: (state) => state.user?.role === 'ADMIN',
    /** 서비스 등록 완료 여부 */
    isRegistered: (state) => state.user?.role && state.user.role !== 'GUEST',
    /** 닉네임 등록 여부 */
    hasNickname: (state) => Boolean(state.user?.nickname),
  },

  actions: {
    /**
     * 사용자 정보 조회
     * 로그인 후 또는 페이지 새로고침 시 호출
     */
    async fetchUser() {
      this.isLoading = true
      try {
        const userData = await getUserInfo()
        this.user = userData
        this.isAuthenticated = true
        logger.info('사용자 인증 성공', { userId: userData.userId, role: userData.role })
        return userData
      } catch (error) {
        logger.warn('사용자 인증 실패')
        this.clearUser()
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 이메일/비밀번호 로그인
     * @param {Object} credentials - 이메일, 비밀번호
     */
    async login(credentials) {
      this.isLoading = true
      try {
        await loginApi(credentials)
        // AccessToken은 axios 응답 인터셉터가 자동으로 localStorage에 저장합니다.
        const userData = await this.fetchUser()
        logger.info('로그인 성공', { email: credentials.email })
        showSuccess('성공적으로 로그인되었습니다.')
        return userData
      } catch (error) {
        logger.error('로그인 실패', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 이메일/비밀번호 회원가입
     * @param {Object} signupData - 회원가입 양식 데이터
     */
    async signup(signupData) {
      this.isLoading = true
      try {
        await signupApi(signupData)
        // AccessToken은 axios 응답 인터셉터가 자동으로 localStorage에 저장합니다.
        const userData = await this.fetchUser()
        logger.info('회원가입 성공', { email: signupData.email })
        showSuccess('성공적으로 가입 및 로그인되었습니다.')
        return userData
      } catch (error) {
        logger.error('회원가입 실패', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 로그아웃
     * 서버 로그아웃 요청 후 로컬 상태 초기화
     */
    async logout() {
      try {
        await logoutApi()
        logger.info('로그아웃 성공')
        showSuccess('로그아웃 되었습니다.')
      } catch (error) {
        logger.error('로그아웃 API 실패', error)

        showSuccess('로그아웃 되었습니다.')
      } finally {
        this.clearUser()
      }
    },

    /**
     * 사용자 상태 초기화
     * 로그아웃 또는 인증 실패 시 호출
     */
    clearUser() {
      this.user = null
      this.isAuthenticated = false
      try {
        removeAccessToken()
      } catch {
        logger.warn('토큰 삭제 실패')
      }
    },

    /**
     * 사용자 정보 업데이트
     * @param {Object} userData - 업데이트할 사용자 정보
     */
    updateUser(userData) {
      if (this.user) {
        this.user = { ...this.user, ...userData }
        logger.debug('사용자 정보 업데이트', userData)
      }
    },
  },

  persist: {
    key: 'comeet-auth',
    storage: safeStorage,
    paths: ['user', 'isAuthenticated'],
  },
})
