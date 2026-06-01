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
      <h1 class="text-lg font-bold text-textPrimary">점주 신청 관리</h1>
    </header>

    <!-- 탭 내비게이션 -->
    <div class="bg-white border-b border-border flex-shrink-0">
      <div class="flex w-full">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors"
          :class="activeTab === tab.value
            ? 'border-primary text-primary'
            : 'border-transparent text-textSecondary hover:text-textPrimary'"
          @click="handleTabChange(tab.value)"
        >
          {{ tab.label }}
          <span
            v-if="getCount(tab.value) > 0"
            class="ml-1 text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-bold"
          >
            {{ getCount(tab.value) }}
          </span>
        </button>
      </div>
    </div>

    <!-- 검색 바 -->
    <div class="p-4 bg-white border-b border-border flex-shrink-0">
      <div class="relative">
        <BaseInput
          v-model="searchKeyword"
          placeholder="가맹점 이름 또는 대표자명 검색"
          :clearable="true"
        />
      </div>
    </div>

    <!-- 리스트 영역 -->
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredApplications.length === 0" class="text-center py-12 bg-white rounded-2xl border border-neutral-100 p-6">
        <span class="text-4xl block mb-3">📂</span>
        <p class="text-sm text-textSecondary font-medium">신청 내역이 존재하지 않습니다.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="app in filteredApplications"
          :key="app.id"
          class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer flex flex-col space-y-3"
          @click="goToDetail(app.id)"
        >
          <!-- 카드 헤더 -->
          <div class="flex justify-between items-start">
            <div class="space-y-0.5">
              <span class="text-xs text-textSecondary">{{ formatDate(app.createdAt) }} 신청</span>
              <h2 class="text-base font-bold text-neutral-900 truncate max-w-[200px]">{{ app.name }}</h2>
            </div>
            
            <span
              class="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
              :class="getStatusBadgeClass(app.status)"
            >
              {{ getStatusLabel(app.status) }}
            </span>
          </div>

          <!-- 카드 요약 정보 -->
          <div class="grid grid-cols-3 gap-y-1.5 text-xs bg-neutral-50 rounded-xl p-3 border border-neutral-100">
            <span class="text-textSecondary">대표자명</span>
            <span class="col-span-2 text-textPrimary font-semibold">{{ app.representativeName }}</span>
            <span class="text-textSecondary">사업자번호</span>
            <span class="col-span-2 text-textPrimary font-semibold">{{ app.businessRegistrationNumber }}</span>
            <span class="text-textSecondary">매장 주소</span>
            <span class="col-span-2 text-textPrimary truncate">{{ app.address }}</span>
          </div>

          <!-- 카드 푸터 -->
          <div class="flex justify-between items-center text-[11px] text-textSecondary pt-1">
            <span>신청 유저 ID: {{ app.userId }}</span>
            <span class="text-primary font-semibold hover:underline flex items-center gap-0.5">
              상세 검토하기 <span class="text-[8px]">➔</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminGetApplications } from '@/api/ownerApplication'
import { createLogger } from '@/utils/logger'
import { formatDate } from '@/utils/date'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const logger = createLogger('AdminApplicationListView')
const router = useRouter()

const isLoading = ref(false)
const applications = ref([])
const activeTab = ref('ALL')
const searchKeyword = ref('')

const tabs = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기 중' },
  { value: 'APPROVED', label: '승인 완료' },
  { value: 'REJECTED', label: '거절됨' }
]

const loadApplications = async () => {
  isLoading.value = true
  try {
    // 백엔드는 status를 생략하면 전체 조회를 실행함
    const data = await adminGetApplications()
    applications.value = data
    logger.info('전체 가입 신청 목록 로드 완료', data)
  } catch (err) {
    logger.error('점주 신청 목록 로드 실패', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadApplications()
})

const goBack = () => {
  router.push('/profile')
}

// 탭 카운팅
const getCount = (tabValue) => {
  if (tabValue === 'ALL') return applications.value.length
  return applications.value.filter(app => app.status === tabValue).length
}

const handleTabChange = (tabValue) => {
  activeTab.value = tabValue
}

// 탭 필터링 및 키워드 검색
const filteredApplications = computed(() => {
  let list = applications.value

  if (activeTab.value !== 'ALL') {
    list = list.filter(app => app.status === activeTab.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    list = list.filter(app =>
      app.name.toLowerCase().includes(keyword) ||
      app.representativeName.toLowerCase().includes(keyword) ||
      app.businessRegistrationNumber.includes(keyword)
    )
  }

  return list
})

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

const goToDetail = (id) => {
  router.push(`/admin/applications/${id}`)
}
</script>

<style scoped>
.pb-safe {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}
</style>
