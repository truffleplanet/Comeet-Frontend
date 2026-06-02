<template>
  <div class="flex flex-col min-h-full h-full bg-background">
    <div class="flex-1 overflow-y-auto safe-bottom">
      <div v-if="isLoading" class="p-4 space-y-4">
        <div class="skeleton h-48 rounded-xl" />
        <div class="skeleton-card">
          <div class="skeleton h-6 w-3/4 mb-3" />
          <div class="skeleton h-4 w-1/3 mb-2" />
          <div class="skeleton h-4 w-full" />
        </div>
      </div>

      <div v-else-if="error" class="p-4">
        <div class="empty-state">
          <p>{{ error }}</p>
          <button class="retry-btn" @click="loadMenuDetail">다시 시도</button>
        </div>
      </div>

      <template v-else-if="menu">
        <div class="menu-image-container">
          <img
            v-if="hasValidImage"
            :src="menuImage"
            :alt="menuName"
            class="menu-image"
            @error="imageError = true"
          />
          <div v-else class="menu-image-placeholder">
            <BaseIcon name="coffee" :size="48" class="text-primary-300" />
          </div>
        </div>

        <div class="menu-info-card mx-4 -mt-6 relative z-10">
          <h1 class="menu-name">{{ menuName }}</h1>

          <div class="menu-price">
            {{ formatPrice(menu.price) }}
          </div>

          <p v-if="menuDescription" class="menu-description">
            {{ menuDescription }}
          </p>

          <RecommendationReason v-if="recommendationReason" :reason="recommendationReason" />
        </div>

        <section v-if="menuFlavors.length" class="px-4 py-4">
          <h2 class="section-title mb-3">
            <span class="section-icon">🎨</span>
            향미 프로필
          </h2>
          <div class="flavor-wheel-wrapper">
            <BeanFlavorWheel
              :size="280"
              :highlighted-flavors="menuFlavors"
              :show-legend="true"
              center-label="Flavor"
            />
          </div>
        </section>

        <section v-if="menuBeans.length" class="px-4 py-4">
          <h2 class="section-title mb-3">원두 선택</h2>

          <div v-if="showRecommendedBeanNotice" class="recommended-bean-notice">
            <span>
              이 메뉴는 <strong>{{ recommendedBean.beanName || recommendedBean.name }}</strong> 원두를
              기준으로 추천되었습니다
            </span>
          </div>

          <div class="beans-list">
            <div
              v-for="bean in menuBeans"
              :key="bean.beanId || bean.id"
              class="bean-item"
              :class="{ 'recommended': isRecommendedBean(bean) }"
              @click="goToBeanDetail(bean)"
            >
              <div class="bean-info">
                <div class="bean-name-row">
                  <span class="bean-name">{{ bean.beanName || bean.name }}</span>
                  <span v-if="isRecommendedBean(bean)" class="recommended-badge">
                    AI 추천
                  </span>
                </div>
                <span v-if="bean.origin || bean.country" class="bean-origin">
                  {{ bean.origin || bean.country }}
                </span>
              </div>
              <BaseIcon name="chevron-right" :size="16" class="text-gray-400" />
            </div>
          </div>
        </section>

        <section v-if="menu.storeId" class="px-4 py-4">
          <h2 class="section-title mb-3">판매 매장</h2>
          <div class="store-card" @click="goToStore">
            <div class="store-info">
              <span class="store-name">{{ menu.storeName || '매장' }}</span>
              <span v-if="menu.storeAddress" class="store-address">
                {{ menu.storeAddress }}
              </span>
            </div>
            <div class="store-map-btn">
              <BaseIcon name="map-marker" :size="14" />
              <span>지도</span>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { getMenuById } from '@/api/menu'
import { formatPrice } from '@/api/recommendation'

import BaseIcon from '@/components/common/BaseIcon.vue'
import BeanFlavorWheel from '@/components/bean/BeanFlavorWheel.vue'
import RecommendationReason from '@/components/recommendation/RecommendationReason.vue'

const logger = createLogger('MenuDetailView')
const route = useRoute()
const router = useRouter()

const menu = ref(null)
const isLoading = ref(false)
const error = ref(null)
const imageError = ref(false)
const recommendationReason = ref(null)
const recommendedBeanId = ref(null)
const recommendedFlavors = ref([])

const menuId = computed(() => route.params.menuId)

const menuName = computed(() => menu.value?.menuName || menu.value?.name || '')
const menuDescription = computed(() => menu.value?.menuDescription || menu.value?.description || '')
const menuImage = computed(() => menu.value?.menuImageUrl || menu.value?.imageUrl || '')
const menuBeans = computed(() => menu.value?.beans || menu.value?.beanBadges || [])
const menuFlavors = computed(() => menu.value?.flavors || [])

const hasValidImage = computed(() => {
  return menuImage.value &&
         !menuImage.value.includes('example.com') &&
         !imageError.value
})

const isFromRecommendation = computed(() => {
  return !!recommendationReason.value || !!recommendedBeanId.value
})

const isRecommendedBean = (bean) => {
  if (!recommendedBeanId.value) return false
  const beanId = bean.beanId || bean.id
  return String(beanId) === String(recommendedBeanId.value)
}

const recommendedBean = computed(() => {
  if (!recommendedBeanId.value || !menuBeans.value.length) return null
  return menuBeans.value.find(b => isRecommendedBean(b))
})

const showRecommendedBeanNotice = computed(() => {
  return isFromRecommendation.value && menuBeans.value.length > 1 && recommendedBean.value
})

const loadMenuDetail = async () => {
  isLoading.value = true
  error.value = null
  imageError.value = false

  try {
    if (route.query.reason) {
      recommendationReason.value = route.query.reason
    }
    if (route.query.recommendedBeanId) {
      recommendedBeanId.value = route.query.recommendedBeanId
    }
    if (route.query.recommendedFlavors) {
      try {
        recommendedFlavors.value = JSON.parse(route.query.recommendedFlavors)
      } catch { /* empty */ }
    }

    const prefilledMenu = {}
    if (route.query.storeId) {
      prefilledMenu.storeId = route.query.storeId
    }
    if (route.query.storeName) {
      prefilledMenu.storeName = route.query.storeName
    }
    if (route.query.storeAddress) {
      prefilledMenu.storeAddress = route.query.storeAddress
    }
    if (Object.keys(prefilledMenu).length > 0) {
      menu.value = prefilledMenu
    }

    if (route.query.menu) {
      try {
        menu.value = { ...menu.value, ...JSON.parse(route.query.menu) }
      } catch { /* empty */ }
    }

    const response = await getMenuById(menuId.value)
    const apiMenu = response?.data || response

    menu.value = {
      ...menu.value,
      ...apiMenu,
      storeId: apiMenu?.storeId || menu.value?.storeId,
      storeName: apiMenu?.storeName || menu.value?.storeName,
      storeAddress: apiMenu?.storeAddress || menu.value?.storeAddress
    }

    logger.info('Menu detail loaded', { menuId: menuId.value, name: menuName.value })
  } catch (err) {
    logger.error('Failed to load menu detail', err)
    if (!menu.value) {
      error.value = '메뉴 정보를 불러올 수 없습니다'
    }
  } finally {
    isLoading.value = false
  }
}

const goToBeanDetail = (bean) => {
  const beanId = bean.beanId || bean.id
  router.push(`/bean/${beanId}`)
}

const goToStore = () => {
  if (menu.value?.storeId) {
    router.push({
      name: 'map',
      query: { storeId: menu.value.storeId }
    })
  }
}

watch(() => route.params.menuId, () => {
  if (route.params.menuId) {
    menu.value = null
    recommendationReason.value = null
    recommendedBeanId.value = null
    recommendedFlavors.value = []
    loadMenuDetail()
  }
})

onMounted(() => {
  loadMenuDetail()
})
</script>

<style scoped>
.menu-image-container {
  width: 100%;
  height: 200px;
  background-color: var(--color-primary-100);
}

.menu-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-100);
}

.menu-info-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.menu-name {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-textPrimary);
  margin: 0 0 0.5rem 0;
}

.menu-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary-600);
  margin-bottom: 0.75rem;
}

.menu-description {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-textSecondary);
  margin: 0;
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

.flavor-wheel-wrapper {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.beans-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bean-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.bean-item:hover {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
}

.bean-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.bean-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bean-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-textPrimary);
}

.bean-origin {
  font-size: 0.8125rem;
  color: var(--color-textSecondary);
}

.recommended-bean-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100));
  border: 1px solid var(--color-primary-200);
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-primary-800);
  line-height: 1.5;
}

.recommended-bean-notice .notice-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.recommended-bean-notice strong {
  font-weight: 700;
  color: var(--color-primary-700);
}

.bean-item.recommended {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
  box-shadow: 0 0 0 1px var(--color-primary-200);
}

.recommended-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9999px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.store-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.store-card:hover {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
}

.store-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.store-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-textPrimary);
}

.store-address {
  font-size: 0.8125rem;
  color: var(--color-textSecondary);
}

.store-map-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-primary-50);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.5rem;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.store-card:hover .store-map-btn {
  background-color: var(--color-primary-100);
}

.store-distance {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary-600);
  margin-top: 0.25rem;
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
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
