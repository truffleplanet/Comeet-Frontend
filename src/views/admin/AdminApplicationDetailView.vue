<template>
  <div class="flex flex-col min-h-full bg-background pb-safe">
    <!-- 헤더 -->
    <header class="relative w-full h-14 bg-white flex items-center justify-center px-5 border-b border-border flex-shrink-0">
      <div class="absolute left-5 flex items-center">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-50 transition-colors"
          aria-label="뒤로가기"
          @click="goBack"
        >
          <BaseIcon name="chevron-left" :size="24" class="text-neutral-900" />
        </button>
      </div>
      <h1 class="text-lg font-bold text-textPrimary">점주 신청 서류 심사</h1>
    </header>

    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
    </div>

    <!-- 심사 내용 컨텐츠 -->
    <div v-else-if="application" class="flex-1 overflow-y-auto p-4 space-y-4">
      
      <!-- 상단 신청 정보 카드 -->
      <div class="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm space-y-3">
        <div class="flex justify-between items-center border-b border-neutral-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-neutral-900 font-bold">신청서 ID: {{ application.id }}</span>
            <span class="text-xs text-textSecondary">(유저 ID: {{ application.userId }})</span>
          </div>
          <span
            class="text-xs px-2.5 py-0.5 rounded-full font-bold"
            :class="getStatusBadgeClass(application.status)"
          >
            {{ getStatusLabel(application.status) }}
          </span>
        </div>

        <div class="text-xs space-y-2">
          <div class="flex justify-between">
            <span class="text-textSecondary">제출 일시</span>
            <span class="text-textPrimary font-semibold">{{ formatDateTime(application.createdAt) }}</span>
          </div>
          <div v-if="application.reviewedAt" class="flex justify-between">
            <span class="text-textSecondary">심사 일시</span>
            <span class="text-textPrimary font-semibold">{{ formatDateTime(application.reviewedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 1. 사업자 서류 심사 파트 -->
      <div class="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-textPrimary border-b border-neutral-100 pb-2 flex items-center gap-1.5">
          <span>📁</span> 사업자 등록 정보 및 증빙 서류
        </h2>

        <div class="grid grid-cols-3 gap-y-2.5 text-xs">
          <span class="text-textSecondary">대표자명</span>
          <span class="col-span-2 text-textPrimary font-bold text-sm">{{ application.representativeName }}</span>
          <span class="text-textSecondary">사업자등록번호</span>
          <span class="col-span-2 text-textPrimary font-bold text-sm">{{ application.businessRegistrationNumber }}</span>
        </div>

        <!-- 사업자등록증 이미지 파일 뷰어 -->
        <div class="space-y-1.5">
          <span class="text-xs text-textSecondary block">사업자등록증 증빙 파일</span>
          <div
            class="relative w-full h-48 bg-neutral-100 rounded-xl overflow-hidden border border-border flex items-center justify-center cursor-pointer group"
            @click="openLicensePreview"
          >
            <img
              v-if="application.businessLicenseUrl"
              :src="application.businessLicenseUrl"
              alt="사업자등록증"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <span class="text-xs text-white font-bold bg-black bg-opacity-60 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">크게 보기</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 매장 정보 파트 -->
      <div class="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-textPrimary border-b border-neutral-100 pb-2 flex items-center gap-1.5">
          <span>🏠</span> 신규 가맹점 정보
        </h2>

        <div class="grid grid-cols-3 gap-y-2.5 text-xs">
          <span class="text-textSecondary">매장 이름</span>
          <span class="col-span-2 text-textPrimary font-bold">{{ application.name }}</span>
          <span class="text-textSecondary">로스터리 ID</span>
          <span class="col-span-2 text-textPrimary font-bold">{{ application.roasteryId }}</span>
          <span class="text-textSecondary">카테고리</span>
          <span class="col-span-2 text-textPrimary">{{ application.category }}</span>
          <span class="text-textSecondary">전화번호</span>
          <span class="col-span-2 text-textPrimary">{{ application.phoneNumber || '-' }}</span>
          <span class="text-textSecondary">영업 시간</span>
          <span class="col-span-2 text-textPrimary font-semibold">{{ application.openingHours || '-' }}</span>
          <span class="text-textSecondary">매장 주소</span>
          <span class="col-span-2 text-textPrimary font-semibold">{{ application.address }}</span>
          <span class="text-textSecondary">매장 위치</span>
          <span class="col-span-2 text-textSecondary text-[11px]">위도: {{ application.latitude }}, 경도: {{ application.longitude }}</span>
          
          <span v-if="application.description" class="text-textSecondary">매장 설명</span>
          <span v-if="application.description" class="col-span-2 text-textPrimary bg-neutral-50 rounded-lg p-2.5 text-[11px] leading-relaxed">{{ application.description }}</span>
        </div>

        <!-- 매장 썸네일 이미지 -->
        <div v-if="application.thumbnailUrl" class="space-y-1.5">
          <span class="text-xs text-textSecondary block">매장 대표 이미지 (썸네일)</span>
          <div class="w-full h-36 bg-neutral-100 rounded-xl overflow-hidden border border-border">
            <img
              :src="application.thumbnailUrl"
              alt="매장 전경"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- 3. 검토 및 승인 반려 이력 -->
      <div v-if="histories.length > 0" class="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-textPrimary border-b border-neutral-100 pb-2 flex items-center gap-1.5">
          <span>📜</span> 심사 진행 이력
        </h2>
        
        <div class="relative pl-4 border-l border-primary-200 space-y-4 py-2">
          <div
            v-for="hist in histories"
            :key="hist.id"
            class="relative space-y-1 text-xs"
          >
            <!-- 타임라인 아이콘 -->
            <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-white" :class="hist.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'"></div>
            
            <div class="flex justify-between items-center">
              <span class="font-bold text-neutral-900" :class="hist.status === 'APPROVED' ? 'text-green-700' : 'text-red-700'">
                {{ hist.status === 'APPROVED' ? '승인됨' : '거절됨' }}
              </span>
              <span class="text-[10px] text-textSecondary">{{ formatDateTime(hist.createdAt) }}</span>
            </div>
            <p class="text-textPrimary bg-neutral-50 rounded-lg p-2.5 leading-relaxed text-[11px]">
              {{ hist.status === 'APPROVED' ? (hist.reviewComment || '특별한 코멘트 없이 승인되었습니다.') : hist.rejectReason }}
            </p>
            <span class="text-[10px] text-textSecondary block text-right">검토 관리자 ID: {{ hist.reviewedBy }}</span>
          </div>
        </div>
      </div>

      <!-- 심사 대기 중(PENDING)일 때만 하단 승인/거절 액션 영역 노출 -->
      <div v-if="application.status === 'PENDING'" class="flex gap-3 pt-4 border-t border-neutral-200">
        <BaseButton
          variant="secondary"
          size="large"
          class="flex-1"
          @click="openRejectModal"
        >
          반려 (거절)
        </BaseButton>
        <BaseButton
          variant="primary"
          size="large"
          class="flex-1"
          @click="openApproveModal"
        >
          최종 승인
        </BaseButton>
      </div>

    </div>

    <!-- 이미지 크게 보기 모달 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showLicensePreviewModal"
          class="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50 p-4"
          @click="closeLicensePreview"
        >
          <div class="w-full max-w-lg h-[70vh] flex items-center justify-center">
            <img
              :src="application?.businessLicenseUrl"
              alt="사업자등록증 원본 크기"
              class="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            class="mt-6 px-6 py-2 bg-white text-neutral-900 rounded-full font-bold shadow-lg hover:bg-neutral-100 transition-colors"
            @click="closeLicensePreview"
          >
            닫기
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- 승인 모달 다이얼로그 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showApproveModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click.self="closeApproveModal"
        >
          <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 class="text-lg font-bold text-neutral-900">가맹점 등록 승인</h3>
            <p class="text-xs text-textSecondary leading-relaxed">
              본 신청을 승인하면 가맹점 카페 데이터베이스가 생성되며, 신청자의 사용자 역할(Role)이 즉시 <strong>가맹점주(OWNER)</strong>로 승격됩니다.
            </p>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-textPrimary">검토 메모 (선택)</label>
              <textarea
                v-model="reviewComment"
                rows="3"
                placeholder="승인 검토 시 남길 코멘트 입력"
                class="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>

            <div class="flex gap-3">
              <BaseButton
                variant="secondary"
                size="medium"
                class="flex-1"
                @click="closeApproveModal"
              >
                취소
              </BaseButton>
              <BaseButton
                variant="primary"
                size="medium"
                class="flex-1 bg-green-600 hover:bg-green-700 border-none text-white"
                :loading="isSubmitting"
                @click="handleApprove"
              >
                승인 확정
              </BaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 반려(거절) 모달 다이얼로그 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showRejectModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click.self="closeRejectModal"
        >
          <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 class="text-lg font-bold text-neutral-900 text-red-600">가맹점 등록 반려</h3>
            <p class="text-xs text-textSecondary leading-relaxed">
              서류 및 매장 정보 식별 불가 등의 사유로 신청을 반려합니다. <strong>반려 사유는 가입 대기 유저에게 직접 전송 및 노출되므로 구체적으로 입력해 주세요.</strong>
            </p>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-textPrimary">반려 사유 <span class="text-error">*</span></label>
              <textarea
                v-model="rejectReason"
                rows="3"
                placeholder="예: 첨부하신 사업자등록증 이미지가 흐려 식별이 어렵습니다. 재촬영하여 신청해주세요."
                class="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
              <p v-if="rejectError" class="text-[10px] text-error font-medium">{{ rejectError }}</p>
            </div>

            <div class="flex gap-3">
              <BaseButton
                variant="secondary"
                size="medium"
                class="flex-1"
                @click="closeRejectModal"
              >
                취소
              </BaseButton>
              <BaseButton
                variant="primary"
                size="medium"
                class="flex-1 bg-red-600 hover:bg-red-700 border-none text-white"
                :disabled="!rejectReason.trim()"
                :loading="isSubmitting"
                @click="handleReject"
              >
                반려 확정
              </BaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  adminGetApplicationById,
  adminGetApplicationHistories,
  adminApproveApplication,
  adminRejectApplication
} from '@/api/ownerApplication'
import { createLogger } from '@/utils/logger'
import { showSuccess, showError } from '@/utils/toast'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const logger = createLogger('AdminApplicationDetailView')
const route = useRoute()
const router = useRouter()

const applicationId = route.params.id
const isLoading = ref(true)
const isSubmitting = ref(false)
const application = ref(null)
const histories = ref([])

// 모달 제어
const showLicensePreviewModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)

const reviewComment = ref('')
const rejectReason = ref('')
const rejectError = ref('')

const loadDetailData = async () => {
  isLoading.value = true
  try {
    const detail = await adminGetApplicationById(applicationId)
    application.value = detail
    
    const logs = await adminGetApplicationHistories(applicationId)
    histories.value = logs
    
    logger.info('심사할 신청서 상세 로드 완료', { detail, logs })
  } catch (err) {
    logger.error('신청서 상세 정보 및 이력 조회 실패', err)
    showError('상세 데이터를 불러오는 데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDetailData()
})

const goBack = () => {
  router.push('/admin/applications')
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING': return '대기 중'
    case 'APPROVED': return '승인 완료'
    case 'REJECTED': return '거절됨'
    default: return status
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700'
    case 'APPROVED': return 'bg-green-100 text-green-700'
    case 'REJECTED': return 'bg-red-100 text-red-700'
    default: return 'bg-neutral-100 text-textSecondary'
  }
}

const formatDateTime = (dateInput) => {
  if (!dateInput) return '-'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '-'
  
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`
}

// 라이선스 파일 팝업 프리뷰
const openLicensePreview = () => {
  showLicensePreviewModal.value = true
}

const closeLicensePreview = () => {
  showLicensePreviewModal.value = false
}

// 승인 다이얼로그 제어
const openApproveModal = () => {
  reviewComment.value = ''
  showApproveModal.value = true
}

const closeApproveModal = () => {
  showApproveModal.value = false
}

const handleApprove = async () => {
  isSubmitting.value = true
  try {
    await adminApproveApplication(applicationId, reviewComment.value)
    showSuccess('해당 가맹점 신청을 승인하였습니다.')
    showApproveModal.value = false
    await loadDetailData() // 화면 정보 갱신
  } catch (err) {
    logger.error('가맹점 신청 승인 실패', err)
    showError(err.response?.data?.error?.message || '승인 처리 도중 문제가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 반려 다이얼로그 제어
const openRejectModal = () => {
  rejectReason.value = ''
  rejectError.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
}

const handleReject = async () => {
  if (!rejectReason.value.trim()) {
    rejectError.value = '반려 사유를 반드시 입력해 주세요.'
    return
  }
  rejectError.value = ''
  isSubmitting.value = true
  try {
    await adminRejectApplication(applicationId, rejectReason.value)
    showSuccess('해당 가맹점 신청을 반려 처리하였습니다.')
    showRejectModal.value = false
    await loadDetailData() // 화면 정보 갱신
  } catch (err) {
    logger.error('가맹점 신청 반려 실패', err)
    showError(err.response?.data?.error?.message || '반려 처리 도중 문제가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pb-safe {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}
</style>
