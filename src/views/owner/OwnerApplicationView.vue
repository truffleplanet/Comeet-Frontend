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
      <h1 class="text-lg font-bold text-textPrimary">가맹점주 신청</h1>
    </header>

    <!-- 메인 컨텐츠 영역 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      
      <!-- 1. 심사 대기 중 (PENDING) 화면 -->
      <template v-if="latestApplication?.status === 'PENDING'">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col items-center text-center space-y-6">
          <div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse">
            <span class="text-3xl">⏳</span>
          </div>

          <div>
            <h2 class="text-xl font-bold text-neutral-900">가맹점주 심사 중</h2>
            <p class="text-sm text-textSecondary mt-2">
              제출하신 사업자 정보 및 매장 세부 정보를<br>관리자가 꼼꼼히 확인하고 있습니다.
            </p>
          </div>

          <!-- 타임라인 진행 상태 -->
          <div class="w-full py-4 flex justify-between items-center relative px-6">
            <div class="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 z-0">
              <div class="h-full bg-amber-500 w-1/2"></div>
            </div>
            
            <div class="flex flex-col items-center z-10 space-y-1">
              <div class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">✓</div>
              <span class="text-xs font-bold text-amber-600">신청 완료</span>
            </div>
            <div class="flex flex-col items-center z-10 space-y-1">
              <div class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs animate-ping absolute opacity-30"></div>
              <div class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs relative">2</div>
              <span class="text-xs font-bold text-amber-600">정보 심사 중</span>
            </div>
            <div class="flex flex-col items-center z-10 space-y-1">
              <div class="w-8 h-8 rounded-full bg-neutral-200 text-textSecondary flex items-center justify-center font-bold text-xs">3</div>
              <span class="text-xs font-medium text-textSecondary">승인 완료</span>
            </div>
          </div>

          <div class="w-full text-left bg-neutral-50 rounded-xl p-4 space-y-3">
            <h3 class="text-sm font-bold text-textPrimary border-b border-neutral-200 pb-2">제출한 가맹점 정보</h3>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <span class="text-textSecondary">대표자명</span>
              <span class="col-span-2 text-textPrimary font-semibold">{{ latestApplication.representativeName }}</span>
              <span class="text-textSecondary">사업자번호</span>
              <span class="col-span-2 text-textPrimary font-semibold">{{ latestApplication.businessRegistrationNumber }}</span>
              <span class="text-textSecondary">매장 이름</span>
              <span class="col-span-2 text-textPrimary font-semibold">{{ latestApplication.name }}</span>
              <span class="text-textSecondary">매장 주소</span>
              <span class="col-span-2 text-textPrimary truncate">{{ latestApplication.address }}</span>
              <span class="text-textSecondary">영업 시간</span>
              <span class="col-span-2 text-textPrimary font-semibold">{{ latestApplication.openingHours }}</span>
            </div>
          </div>
          
          <p class="text-xs text-textSecondary">
            보통 영업일 기준 1~3일 이내에 승인 처리가 완료됩니다.<br>승인 즉시 점주 계정으로 전환되어 내 가게 관리를 시작하실 수 있습니다.
          </p>
        </div>
      </template>

      <!-- 2. 거절 상태 (REJECTED) 상단 피드백 및 신청 양식 -->
      <template v-else>
        
        <div v-if="latestApplication?.status === 'REJECTED'" class="bg-red-50 rounded-2xl p-4 border border-red-100 space-y-2">
          <div class="flex items-center gap-2 text-red-700 font-bold">
            <span>⚠️</span>
            <span class="text-sm">이전 가맹점 신청이 반려되었습니다</span>
          </div>
          <p class="text-xs text-red-600 bg-white rounded-lg p-3 border border-red-100 font-medium">
            <strong>반려 사유:</strong> {{ latestApplication.rejectReason || '제출하신 첨부 서류 또는 매장 정보의 식별이 불가능하거나 허위 정보가 포함되어 있습니다.' }}
          </p>
          <p class="text-[11px] text-textSecondary">
            사유를 보완하여 하단의 신청 양식을 다시 작성해 주시기 바랍니다.
          </p>
        </div>

        <!-- 가맹점주 등록 신청 폼 -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 space-y-6">
          
          <!-- 진행 단계 인디케이터 -->
          <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span class="text-sm font-bold text-textPrimary">가맹점 등록 신청서</span>
            <div class="flex items-center gap-2">
              <span
                class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                :class="currentStep === 1 ? 'bg-primary text-white' : 'bg-neutral-100 text-textSecondary'"
              >
                1
              </span>
              <span class="text-xs text-textSecondary">사업자정보</span>
              <span class="text-textSecondary text-xs">➔</span>
              <span
                class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                :class="currentStep === 2 ? 'bg-primary text-white' : 'bg-neutral-100 text-textSecondary'"
              >
                2
              </span>
              <span class="text-xs text-textSecondary">매장정보</span>
            </div>
          </div>

          <form @submit.prevent>
            <!-- 1단계: 사업자 정보 -->
            <div v-if="currentStep === 1" class="space-y-4">
              <div class="space-y-1">
                <h3 class="text-base font-bold text-textPrimary">사업자 인증</h3>
                <p class="text-xs text-textSecondary">가맹점 매장 등록을 위해 사업자등록증 정보 인증이 필요합니다.</p>
              </div>

              <!-- 대표자명 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  대표자명 <span class="text-error">*</span>
                </label>
                <BaseInput
                  v-model="form.representativeName"
                  placeholder="사업자등록증 상의 대표자명을 입력해 주세요"
                />
              </div>

              <!-- 사업자등록번호 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  사업자등록번호 <span class="text-error">*</span>
                </label>
                <BaseInput
                  v-model="form.businessRegistrationNumber"
                  placeholder="예: 123-45-67890"
                  :status="errors.businessRegistrationNumber ? 'error' : ''"
                  :helper-text="errors.businessRegistrationNumber"
                  @input="formatBusinessNumber"
                />
              </div>

              <!-- 사업자등록증 이미지 증빙 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  사업자등록증 첨부 <span class="text-error">*</span>
                </label>
                <OwnerImageUploader
                  v-model="form.businessLicenseUrl"
                  alt="사업자등록증 증빙"
                  helper-text="대표자명과 번호가 잘 보이도록 업로드해 주세요."
                  :allow-url-input="false"
                />
              </div>
            </div>

            <!-- 2단계: 매장 정보 -->
            <div v-else class="space-y-4">
              <div class="space-y-1">
                <h3 class="text-base font-bold text-textPrimary">매장 상세 정보</h3>
                <p class="text-xs text-textSecondary">서비스에 노출될 가맹점의 상세한 프로필을 작성합니다.</p>
              </div>

              <!-- 로스터리 선택 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  원두 공급 로스터리 <span class="text-error">*</span>
                </label>
                <div
                  class="w-full px-4 py-3 rounded-xl border border-border bg-white text-textPrimary flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
                  @click="openRoasterySelector"
                >
                  <span :class="form.roasteryId ? 'text-textPrimary font-medium' : 'text-textSecondary'">
                    {{ form.roasteryName || '공급받는 스페셜티 로스터리를 선택해 주세요' }}
                  </span>
                  <BaseIcon name="chevron-right" :size="20" class="text-textSecondary" />
                </div>
                <p class="text-[11px] text-textSecondary mt-1">우리 매장에 연동할 원두 목록을 구성하는 기준 로스터리입니다.</p>
              </div>

              <!-- 매장 이름 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  매장 이름 <span class="text-error">*</span>
                </label>
                <BaseInput
                  v-model="form.name"
                  placeholder="예: 코밋 카페 강남점"
                />
              </div>

              <!-- 매장 카테고리 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  매장 카테고리 <span class="text-error">*</span>
                </label>
                <select
                  v-model="form.category"
                  class="w-full px-4 py-3 rounded-xl border border-border bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="SPECIALTY_COFFEE">스페셜티 커피 전문점</option>
                  <option value="HAND_DRIP">브루잉/드립 전문점</option>
                  <option value="ESPRESSO">에스프레소 바</option>
                  <option value="ROASTERY">로스터리 카페</option>
                  <option value="DESSERT">디저트 카페</option>
                  <option value="NORMAL">일반 카페</option>
                </select>
              </div>

              <!-- 매장 전화번호 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">매장 전화번호</label>
                <BaseInput
                  v-model="form.phoneNumber"
                  placeholder="예: 02-1234-5678"
                />
              </div>

              <!-- 영업 시간 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  영업시간 <span class="text-error">*</span>
                </label>
                <BaseInput
                  v-model="form.openingHours"
                  placeholder="예: 09:00-22:00"
                  :status="errors.openingHours ? 'error' : ''"
                  :helper-text="errors.openingHours || 'HH:mm-HH:mm 형식으로 입력해 주세요'"
                  @input="validateOpeningHours"
                />
              </div>

              <!-- 매장 주소 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  매장 주소 <span class="text-error">*</span>
                </label>
                <BaseInput
                  v-model="form.address"
                  placeholder="예: 서울시 강남구 테헤란로 123"
                  @blur="mockCoordinates"
                />
              </div>

              <!-- 위도 / 경도 (숨김 또는 가이드) -->
              <div class="grid grid-cols-2 gap-3 text-xs text-textSecondary bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                <div>
                  <label class="block text-[11px] font-semibold text-textSecondary mb-1">위도 (Latitude)</label>
                  <input
                    v-model.number="form.latitude"
                    type="number"
                    step="0.000001"
                    class="w-full px-2 py-1 bg-white border border-border rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-textSecondary mb-1">경도 (Longitude)</label>
                  <input
                    v-model.number="form.longitude"
                    type="number"
                    step="0.000001"
                    class="w-full px-2 py-1 bg-white border border-border rounded focus:outline-none"
                  />
                </div>
              </div>

              <!-- 매장 설명 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">매장 설명</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="매장 및 공급 원두에 대한 상세한 매력 포인트를 적어주세요."
                  class="w-full px-4 py-3 rounded-xl border border-border bg-white text-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>

              <!-- 매장 대표 이미지 -->
              <div>
                <label class="block text-sm font-medium text-textPrimary mb-2">매장 대표 이미지 (썸네일)</label>
                <OwnerImageUploader
                  v-model="form.thumbnailUrl"
                  alt="매장 대표 이미지"
                  helper-text="노출될 매장 대표 전경 또는 음료 이미지를 업로드하세요."
                  :allow-url-input="false"
                />
              </div>
            </div>
          </form>

          <!-- 하단 버튼 영역 -->
          <div class="flex gap-3 pt-2">
            <BaseButton
              v-if="currentStep === 2"
              variant="secondary"
              size="large"
              class="flex-1"
              @click="prevStep"
            >
              이전
            </BaseButton>

            <BaseButton
              v-if="currentStep === 1"
              variant="primary"
              size="large"
              class="w-full"
              :disabled="!isStep1Valid"
              @click="nextStep"
            >
              다음 단계로
            </BaseButton>
            <BaseButton
              v-else
              variant="primary"
              size="large"
              class="flex-1"
              :disabled="!isStep2Valid || isSubmitting"
              :loading="isSubmitting"
              @click="handleSubmit"
            >
              가맹점주 신청서 제출
            </BaseButton>
          </div>

        </div>
      </template>

    </div>

    <!-- 로스터리 선택 모달 -->
    <OwnerRoasterySelector
      v-model="showRoasterySelector"
      :initial-roastery-id="form.roasteryId"
      @select="handleRoasterySelect"
      @select-pending="handleRoasterySelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyLatestApplication, applyForOwner } from '@/api/ownerApplication'
import { createLogger } from '@/utils/logger'
import { showSuccess, showError } from '@/utils/toast'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import OwnerImageUploader from '@/components/owner/OwnerImageUploader.vue'
import OwnerRoasterySelector from '@/components/owner/OwnerRoasterySelector.vue'

const logger = createLogger('OwnerApplicationView')
const router = useRouter()

const latestApplication = ref(null)
const currentStep = ref(1)
const isSubmitting = ref(false)
const showRoasterySelector = ref(false)

const form = ref({
  roasteryId: null,
  roasteryName: '',
  name: '',
  description: '',
  address: '',
  latitude: 37.5012, // 역삼역 중심지 기본 위도
  longitude: 127.0396, // 역삼역 중심지 기본 경도
  businessRegistrationNumber: '',
  representativeName: '',
  businessLicenseUrl: '',
  openingHours: '09:00-22:00',
  category: 'SPECIALTY_COFFEE',
  phoneNumber: '',
  thumbnailUrl: ''
})

const errors = ref({
  businessRegistrationNumber: '',
  openingHours: ''
})

// 가입 신청서 조회
const fetchApplication = async () => {
  try {
    const data = await getMyLatestApplication()
    if (data && data.status) {
      latestApplication.value = data
      logger.info('최근 점주 가입 신청 정보 조회 성공', data)
    }
  } catch (err) {
    logger.warn('이전 점주 가입 신청 정보가 없거나 에러 발생', err)
  }
}

onMounted(() => {
  fetchApplication()
})

const goBack = () => {
  router.push('/profile')
}

// 1단계 입력 폼 검증
const isStep1Valid = computed(() => {
  const bizNum = form.value.businessRegistrationNumber.trim()
  const bizNumRegex = /^\d{3}-\d{2}-\d{5}$/
  return form.value.representativeName.trim() &&
    bizNumRegex.test(bizNum) &&
    form.value.businessLicenseUrl.trim()
})

// 2단계 입력 폼 검증
const isStep2Valid = computed(() => {
  const hours = form.value.openingHours.trim()
  const hoursRegex = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/
  return form.value.roasteryId != null &&
    form.value.name.trim() &&
    form.value.address.trim() &&
    hoursRegex.test(hours) &&
    form.value.latitude != null &&
    form.value.longitude != null
})

// 사업자번호 입력 시 자동 하이픈 및 유효성 검증
const formatBusinessNumber = () => {
  let value = form.value.businessRegistrationNumber.replace(/[^0-9]/g, '')
  if (value.length > 10) value = value.substring(0, 10)
  
  if (value.length > 5) {
    form.value.businessRegistrationNumber = `${value.substring(0, 3)}-${value.substring(3, 5)}-${value.substring(5)}`
  } else if (value.length > 3) {
    form.value.businessRegistrationNumber = `${value.substring(0, 3)}-${value.substring(3)}`
  } else {
    form.value.businessRegistrationNumber = value
  }

  const bizRegex = /^\d{3}-\d{2}-\d{5}$/
  if (form.value.businessRegistrationNumber.length === 12 && !bizRegex.test(form.value.businessRegistrationNumber)) {
    errors.value.businessRegistrationNumber = '사업자번호 형식이 올바르지 않습니다.'
  } else {
    errors.value.businessRegistrationNumber = ''
  }
}

// 영업시간 포맷 검증 (HH:mm-HH:mm)
const validateOpeningHours = () => {
  const hours = form.value.openingHours.trim()
  const regex = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/
  if (hours && !regex.test(hours)) {
    errors.value.openingHours = 'HH:mm-HH:mm 형식에 맞지 않습니다.'
  } else {
    errors.value.openingHours = ''
  }
}

// 주소 포커스 아웃 시 임시로 서울 근교 좌표 제공
const mockCoordinates = () => {
  if (form.value.address.trim() && (form.value.latitude === 37.5012 && form.value.longitude === 127.0396)) {
    // 서울역 혹은 강남역 인근 좌표 난수 추가하여 살짝 분산
    form.value.latitude = Number((37.50 + Math.random() * 0.02).toFixed(6))
    form.value.longitude = Number((127.02 + Math.random() * 0.03).toFixed(6))
  }
}

// 로스터리 선택 모달 제어
const openRoasterySelector = () => {
  showRoasterySelector.value = true
}

const handleRoasterySelect = (roastery) => {
  form.value.roasteryId = roastery.id || 1 // 신규 생성 등으로 ID가 없을 시 기본 ID 맵핑
  form.value.roasteryName = roastery.name
  logger.info('로스터리 선택 완료', roastery)
}

const nextStep = () => {
  if (isStep1Valid.value) {
    currentStep.value = 2
  }
}

const prevStep = () => {
  currentStep.value = 1
}

// 폼 최종 제출
const handleSubmit = async () => {
  if (!isStep2Valid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await applyForOwner(form.value)
    logger.info('가맹점 등록 신청 성공', response)
    showSuccess('가맹점주 가입 신청서가 성공적으로 제출되었습니다.')
    await fetchApplication() // 제출 완료된 PENDING 정보 반영
  } catch (err) {
    logger.error('가맹점 등록 신청 실패', err)
    showError(err.response?.data?.error?.message || '신청서 제출에 실패했습니다. 입력 양식을 확인해 주세요.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.pb-safe {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}
</style>
