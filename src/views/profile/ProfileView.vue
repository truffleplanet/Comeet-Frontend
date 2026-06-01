<template>
  <div class="flex flex-col min-h-full h-full bg-background">
    <div class="flex-1 p-4 overflow-y-auto">
      
      <div class="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            <img
              v-if="authStore.userProfileImage"
              :src="authStore.userProfileImage"
              alt="프로필"
              class="w-full h-full rounded-full object-cover"
            />
            <BaseIcon v-else name="user-line" :size="32" class="text-primary-600" />
          </div>
          <div>
            <p class="text-textPrimary text-lg font-bold">{{ authStore.userNickname }}</p>
            <p class="text-textSecondary text-sm">{{ authStore.userEmail }}</p>
            <p class="text-xs text-primary mt-1">
              {{ roleText }}
            </p>
          </div>
        </div>
      </div>

      
      <div v-if="authStore.isOwner" class="bg-white rounded-lg shadow-sm mb-4">
        <button
          class="w-full flex items-center justify-between p-4 hover:bg-primary-50 transition-colors"
          @click="goToOwnerStores"
        >
          <span class="text-textPrimary font-medium">내 가게 관리</span>
          <span class="text-textSecondary">›</span>
        </button>
      </div>

      
      <div v-if="authStore.isAdmin" class="bg-white rounded-lg shadow-sm mb-4">
        <button
          class="w-full flex items-center justify-between p-4 hover:bg-primary-50 transition-colors"
          @click="goToAdminApplications"
        >
          <span class="text-textPrimary font-medium">점주 신청 관리 (운영자)</span>
          <span class="text-textSecondary">›</span>
        </button>
      </div>

      
      <div v-if="!authStore.isOwner && !authStore.isAdmin" class="bg-white rounded-lg shadow-sm mb-4">
        <button
          class="w-full flex flex-col p-4 hover:bg-primary-50 transition-colors text-left"
          @click="goToOwnerApply"
        >
          <div class="w-full flex items-center justify-between">
            <span class="text-textPrimary font-medium">가맹점주 신청</span>
            <div class="flex items-center gap-1.5">
              <span v-if="latestApplication?.status === 'PENDING'" class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">심사 중</span>
              <span v-else-if="latestApplication?.status === 'REJECTED'" class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">거절됨</span>
              <span class="text-textSecondary">›</span>
            </div>
          </div>
          <p class="text-xs text-textSecondary mt-1">
            {{ latestApplication?.status === 'PENDING'
                ? '제출하신 매장 정보와 사업자 정보를 심사 중입니다.'
                : latestApplication?.status === 'REJECTED'
                  ? '서류 심사에서 거절되었습니다. 사유를 확인하고 재신청하세요.'
                  : '내 카페를 등록하고 커피 메뉴와 원두를 관리해보세요.' }}
          </p>
        </button>
      </div>

      
      <div class="bg-white rounded-lg shadow-sm">
        <button
          class="w-full flex items-center justify-between p-4 border-b border-primary-200 hover:bg-primary-50 transition-colors"
          @click="goToMyPreference"
        >
          <span class="text-textPrimary">내 취향</span>
          <span class="text-textSecondary">›</span>
        </button>
        <button
          class="w-full flex items-center justify-between p-4 border-b border-primary-200 hover:bg-primary-50 transition-colors"
          @click="goToMyReviews"
        >
          <span class="text-textPrimary">내 리뷰</span>
          <span class="text-textSecondary">›</span>
        </button>
        <button
          class="w-full flex items-center justify-between p-4 border-b border-primary-200 hover:bg-primary-50 transition-colors"
          @click="goToProfileEdit"
        >
          <span class="text-textPrimary">내 정보 수정</span>
          <span class="text-textSecondary">›</span>
        </button>
        <button
          class="w-full flex items-center justify-between p-4 text-error hover:bg-error-light hover:bg-opacity-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoggingOut"
          @click="confirmLogout"
        >
          <span>{{ isLoggingOut ? '로그아웃 중...' : '로그아웃' }}</span>
        </button>
      </div>
    </div>

    
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showLogoutModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          @click.self="cancelLogout"
        >
          <div class="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">로그아웃</h3>
            <p class="text-textSecondary mb-6">정말 로그아웃 하시겠습니까?</p>
            <div class="flex gap-3">
              <BaseButton
                variant="secondary"
                size="medium"
                class="flex-1"
                @click="cancelLogout"
              >
                취소
              </BaseButton>
              <BaseButton
                variant="primary"
                size="medium"
                class="flex-1"
                :loading="isLoggingOut"
                @click="handleLogout"
              >
                로그아웃
              </BaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { getMyLatestApplication } from '@/api/ownerApplication'
import { createLogger } from '@/utils/logger'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const logger = createLogger('ProfileView')

const router = useRouter()
const authStore = useAuthStore()

const showLogoutModal = ref(false)
const isLoggingOut = ref(false)
const latestApplication = ref(null)

const roleText = computed(() => {
  if (authStore.isAdmin) return '운영자'
  if (authStore.isOwner) return '가맹점주'
  return '일반 사용자'
})

const fetchApplicationStatus = async () => {
  if (!authStore.isOwner && !authStore.isAdmin && authStore.isAuthenticated) {
    try {
      latestApplication.value = await getMyLatestApplication()
    } catch (err) {
      logger.error('최근 가맹점주 신청 조회 실패', err)
    }
  }
}

onMounted(() => {
  fetchApplicationStatus()
})

/**
 * 로그아웃 확인 모달 표시
 */
const confirmLogout = () => {
  showLogoutModal.value = true
}

/**
 * 로그아웃 취소
 */
const cancelLogout = () => {
  showLogoutModal.value = false
}

/**
 * 내 취향 페이지로 이동
 */
const goToMyPreference = () => {
  router.push('/my-preference')
}

/**
 * 내 리뷰 페이지로 이동
 */
const goToMyReviews = () => {
  router.push('/my-reviews')
}

/**
 * 내 가게 관리 페이지로 이동 (점주 전용)
 */
const goToOwnerStores = () => {
  router.push('/owner/stores')
}

/**
 * 점주 신청 페이지로 이동
 */
const goToOwnerApply = () => {
  router.push('/owner/apply')
}

/**
 * 관리자 점주 신청 목록 페이지로 이동
 */
const goToAdminApplications = () => {
  router.push('/admin/applications')
}

/**
 * 내 정보 수정 페이지로 이동
 */
const goToProfileEdit = () => {
  router.push('/my-profile/edit')
}

/**
 * 로그아웃 처리
 */
const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.logout()
    showLogoutModal.value = false
    router.push('/login')
  } catch (error) {
    logger.error('로그아웃 실패', error)
    router.push('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<style scoped>
/* 모달 페이드 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
