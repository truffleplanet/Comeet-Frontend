<template>
  <div class="flex flex-col min-h-full h-full bg-background">
    
    <div class="flex-1 overflow-y-auto safe-bottom">
      
      <div v-if="isLoadingBean" class="p-4 space-y-4">
        <div class="skeleton-card">
          <div class="skeleton h-6 w-3/4 mb-3" />
          <div class="skeleton h-4 w-1/2 mb-2" />
          <div class="skeleton h-4 w-2/3" />
        </div>
        <div class="skeleton h-64 rounded-xl" />
      </div>

      
      <div v-else-if="beanError" class="p-4">
        <div class="empty-state">
          <p>{{ beanError }}</p>
          <button class="retry-btn" @click="loadBeanDetail">다시 시도</button>
        </div>
      </div>

      
      <template v-else-if="bean">
        
        <div class="bean-detail-card mx-4 mt-4">
          <h1 class="bean-name">{{ bean.name }}</h1>

          
          <div class="bean-info-grid">
            <div v-if="displayCountry" class="info-item">
              <span class="info-label">원산지</span>
              <span class="info-value">{{ displayCountry }}</span>
            </div>
            <div v-if="displayFarm" class="info-item">
              <span class="info-label">농장</span>
              <span class="info-value">{{ displayFarm }}</span>
            </div>
            <div v-if="displayVariety" class="info-item">
              <span class="info-label">품종</span>
              <span class="info-value">{{ displayVariety }}</span>
            </div>
            <div v-if="displayProcessingMethod" class="info-item">
              <span class="info-label">가공방식</span>
              <span class="info-value">{{ displayProcessingMethod }}</span>
            </div>
            <div v-if="bean.roastingLevel" class="info-item">
              <span class="info-label">로스팅</span>
              <span class="info-value">{{ formatRoastingLevel(bean.roastingLevel) }}</span>
            </div>
          </div>

          
          <p v-if="bean.description" class="bean-description">
            {{ bean.description }}
          </p>

          
          <RecommendationReason v-if="recommendationReason" :reason="recommendationReason" />
        </div>

        
        <section v-if="bean.flavors?.length" class="px-4 py-4">
          <h2 class="section-title mb-3">
            <span class="section-icon">🎨</span>
            향미 프로필
          </h2>
          <div class="flavor-wheel-wrapper">
            <BeanFlavorWheel
              :size="280"
              :highlighted-flavors="bean.flavors"
              :show-legend="true"
              center-label="Flavor"
            />
          </div>
        </section>

        
        <section class="px-4 py-4">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">🍵</span>
              이 원두를 사용하는 메뉴
            </h2>
            <LocationModeToggle v-model="menuLocationMode" @update:model-value="onLocationModeChange" />
          </div>

          
          <div v-if="isLoadingMenus" class="space-y-3">
            <RecommendationSkeleton v-for="i in 3" :key="i" type="menu" />
          </div>

          
          <div v-else-if="menuError" class="empty-state">
            <p>{{ menuError }}</p>
            <button class="retry-btn" @click="loadMenus">다시 시도</button>
          </div>

          
          <div v-else-if="!menus.length" class="empty-state">
            <p>이 원두를 사용하는 메뉴가 없습니다</p>
            <p v-if="menuLocationMode === 'nearby'" class="text-sm mt-1">
              검색 반경 내에 메뉴가 없습니다. 전체 보기를 이용해주세요.
            </p>
          </div>

          
          <div v-else class="space-y-3">
            <MenuRecommendationCard
              v-for="menu in menus"
              :key="menu.menuId"
              :menu="menu"
              :show-rank="false"
              :show-reason="false"
              @click="goToStore"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGeolocation } from '@/composables/useGeolocation'
import { createLogger } from '@/utils/logger'
import { showWarning } from '@/utils/toast'
import { getBeanById } from '@/api/bean'
import {
  getMenusByBean,
  getNearbyMenusByBean,
  formatRoastingLevel
} from '@/api/recommendation'

import BeanFlavorWheel from '@/components/bean/BeanFlavorWheel.vue'
import RecommendationReason from '@/components/recommendation/RecommendationReason.vue'
import LocationModeToggle from '@/components/recommendation/LocationModeToggle.vue'
import MenuRecommendationCard from '@/components/recommendation/MenuRecommendationCard.vue'
import RecommendationSkeleton from '@/components/recommendation/RecommendationSkeleton.vue'

const logger = createLogger('BeanDetailView')
const route = useRoute()
const router = useRouter()
const { location, requestLocation } = useGeolocation()

const bean = ref(null)
const menus = ref([])
const isLoadingBean = ref(false)
const isLoadingMenus = ref(false)
const beanError = ref(null)
const menuError = ref(null)
const menuLocationMode = ref('nearby')
const recommendationReason = ref(null)

const beanId = computed(() => route.params.beanId)

const formatMultiValue = (value) => {
  if (!value) return null
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ')
  }
  return value
}

const displayCountry = computed(() => formatMultiValue(bean.value?.country))
const displayFarm = computed(() => formatMultiValue(bean.value?.farm))
const displayVariety = computed(() => formatMultiValue(bean.value?.variety))
const displayProcessingMethod = computed(() => formatMultiValue(bean.value?.processingMethod))

const loadBeanDetail = async () => {
  isLoadingBean.value = true
  beanError.value = null

  try {
    if (route.query.reason) {
      try {
        recommendationReason.value = route.query.reason
      } catch { /* empty */ }
    }

    if (route.query.bean) {
      try {
        const queryBean = JSON.parse(route.query.bean)
        bean.value = normalizeBean(queryBean)
      } catch { /* empty */ }
    }

    const apiBean = await getBeanById(beanId.value)
    bean.value = normalizeBean(apiBean)

    logger.info('Bean detail loaded', { beanId: beanId.value, name: bean.value?.name })

    await loadMenus()
  } catch (error) {
    logger.error('Failed to load bean detail', error)
    if (!bean.value) {
      beanError.value = '원두 정보를 불러올 수 없습니다'
    }
  } finally {
    isLoadingBean.value = false
  }
}

const normalizeBean = (data) => {
  if (!data) return null
  return {
    id: data.id || data.beanId,
    roasteryId: data.roasteryId,
    name: data.name || data.beanName,
    country: data.country || data.origin,
    farm: data.farm,
    variety: data.variety,
    processingMethod: data.processingMethod,
    roastingLevel: data.roastingLevel || data.roastLevel,
    description: data.description,
    flavors: data.flavors || []
  }
}

const loadMenus = async () => {
  isLoadingMenus.value = true
  menuError.value = null

  try {
    if (menuLocationMode.value === 'nearby') {
      let loc = location.value
      if (!loc) {
        try {
          loc = await requestLocation({ showToast: true })
        } catch {
          menuLocationMode.value = 'global'
          showWarning('위치 정보를 가져올 수 없어 전체 메뉴를 표시합니다')
          const data = await getMenusByBean(beanId.value)
          menus.value = data || []
          return
        }
      }

      const data = await getNearbyMenusByBean(beanId.value, loc.lat, loc.lng, 10)
      menus.value = data || []
    } else {
      const data = await getMenusByBean(beanId.value)
      menus.value = data || []
    }

    logger.info('Menus loaded', {
      beanId: beanId.value,
      mode: menuLocationMode.value,
      count: menus.value.length
    })
  } catch (error) {
    logger.error('Failed to load menus', error)
    menuError.value = '메뉴를 불러올 수 없습니다'
  } finally {
    isLoadingMenus.value = false
  }
}

const onLocationModeChange = () => {
  loadMenus()
}

const goToStore = (menu) => {
  router.push(`/store/${menu.storeId}`)
}

watch(() => route.params.beanId, () => {
  if (route.params.beanId) {
    bean.value = null
    menus.value = []
    recommendationReason.value = null
    loadBeanDetail()
  }
})

onMounted(() => {
  loadBeanDetail()
})
</script>

<style scoped>
.bean-detail-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
}

.bean-name {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-textPrimary);
  margin: 0 0 1rem 0;
}

.bean-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--color-textSecondary);
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-textPrimary);
  font-weight: 600;
}

.bean-description {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-textSecondary);
  margin: 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-textPrimary);
}

.section-icon {
  font-size: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.flavor-wheel-wrapper {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-textSecondary);
}

.retry-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-primary-600);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: var(--color-primary-700);
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Skeleton styles */
.skeleton-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
}

.skeleton {
  background: linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.375rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
