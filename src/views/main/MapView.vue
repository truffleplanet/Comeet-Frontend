<template>
  <div class="relative w-full h-full">
    
    <div ref="mapContainer" class="w-full h-full"></div>

    
    <div v-if="isLoading" class="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-textSecondary">지도 로딩 중...</p>
      </div>
    </div>

    
    <div class="top-search-area">
      <div class="top-search-bar">
        <BaseIcon name="search" :size="18" class="search-icon" />
        <input
type="text" :value="searchKeyword" placeholder="카페명 또는 주소 검색" class="search-input"
          @input="searchKeyword = $event.target.value" @keydown.enter="handleTopSearch"
          @focus="handleSearchInputFocus" />
        <button v-if="searchKeyword" class="clear-btn" @click="searchKeyword = ''">
          <BaseIcon name="x" :size="14" />
        </button>
      </div>
    </div>

    
    <button v-if="showSearchButton" class="search-area-button" :disabled="isSearching" @click="handleSearchThisArea">
      <BaseIcon v-if="isSearching" name="spinner" :size="16" class="animate-spin" />
      <BaseIcon v-else name="search" :size="16" />
      <span>{{ isSearching ? '검색 중...' : '이 지역 검색' }}</span>
    </button>

    
    <div v-if="currentSheetState !== 'full'" class="map-controls" :style="controlsBottomStyle">
      <button class="control-button" aria-label="확대" @click="handleZoomIn">
        <BaseIcon name="plus" :size="20" />
      </button>
      <button class="control-button" aria-label="축소" @click="handleZoomOut">
        <BaseIcon name="minus" :size="20" />
      </button>
      <button class="control-button" aria-label="내 위치" :disabled="isLocating" @click="handleMyLocation">
        <BaseIcon v-if="isLocating" name="spinner" :size="20" class="animate-spin" />
        <BaseIcon v-else name="target" :size="20" />
      </button>
    </div>

    
    <button
v-if="currentSheetState === 'collapsed'" class="list-view-button" :style="controlsBottomStyle"
      @click="expandBottomSheet">
      <BaseIcon name="list" :size="16" />
      <span>목록보기</span>
    </button>

    
    <StoreListSheet
:stores="stores" :is-searching="isSearching" :initial-keyword="searchKeyword"
      :initial-categories="searchCategories" :initial-global-search="isGlobalSearch" :force-state="forceSheetState"
      @select-store="handleStoreSelect" @state-change="handleSheetStateChange" @search="handleSearch"
      @search-area="handleSearchThisArea" />

    
    <MarkerPopup :store="popupStore" :position="popupPosition" @close="closePopup" @detail="handlePopupDetail" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNaverMap } from '@/composables/useNaverMap'
import { useGeolocation } from '@/composables/useGeolocation'
import { useMapMarkers } from '@/composables/useMapMarkers'
import { useMapPopup } from '@/composables/useMapPopup'
import { useMapControls } from '@/composables/useMapControls'
import { showInfo, showError } from '@/utils/toast'
import { useSavedStore } from '@/store/saved'
import { getStoresByLocation, getStoreById } from '@/api/cafe'
import { calculateDistance, formatDistance } from '@/utils/geo'
import { createLogger } from '@/utils/logger'
import MarkerPopup from "@/components/map/MarkerPopup.vue"
import StoreListSheet from "@/components/map/StoreListSheet.vue"
import BaseIcon from '@/components/common/BaseIcon.vue'

const logger = createLogger('MapView')
const router = useRouter()
const route = useRoute()
const savedStore = useSavedStore()

const pendingStoreNavigation = ref(null)

const mapContainer = ref(null)
const isLoading = ref(true)
const isSearching = ref(false)
const isLocating = ref(false)
const showSearchButton = ref(false)
const stores = ref([])
const userLocation = ref(null)
const lastSearchCenter = ref(null)
const forceSheetState = ref(null)
const currentSheetState = ref('half')

const handleSheetStateChange = (state) => {
  currentSheetState.value = state
  setSheetState(state)

  if (state === 'full') {
    closePopup()
  }
}

const expandBottomSheet = () => {
  forceSheetState.value = 'half'
  setTimeout(() => {
    forceSheetState.value = null
  }, 100)
}

const isGlobalSearch = ref(true)
const searchKeyword = ref('')
const searchCategories = ref([])
const searchLocation = ref(null)

const selectedTopCategory = ref(null)

const handleTopSearch = () => {
  if (!map.value || !searchKeyword.value.trim()) return

  handleSearch({
    keyword: searchKeyword.value.trim(),
    categories: selectedTopCategory.value || undefined,
    isGlobalSearch: true,
    searchType: 'keyword'
  })
}

const handleSearchInputFocus = () => {
  if (currentSheetState.value === 'collapsed') {
    forceSheetState.value = 'half'
    setTimeout(() => {
      forceSheetState.value = null
    }, 100)
  }
}

const { location, requestLocation } = useGeolocation()
const { map, markers, initMap, clearMarkers } = useNaverMap()

const {
  updateMyLocationMarker,
  updateMarkerSizes,
  renderMarkers: renderMarkersBase,
  cleanup: cleanupMarkers
} = useMapMarkers(map, markers, clearMarkers)

const {
  popupStore,
  popupPosition,
  updatePopupPosition,
  throttledUpdatePopupPosition,
  showPopupOnly,
  closePopup,
  cleanup: cleanupPopup
} = useMapPopup(map)

const {
  controlsBottomStyle,
  getRadiusFromBounds,
  panToWithOffset,
  handleZoomIn,
  handleZoomOut,
  setFocusedLocation,
  clearFocusedLocation,
  setSheetState
} = useMapControls(map)

const fetchStores = async (latitude, longitude, radius = 1000, options = {}) => {
  try {
    const params = { latitude, longitude, radius }

    if (options.keyword) {
      params.keyword = options.keyword
    }
    if (options.categories) {
      params.categories = options.categories
    }

    const response = await getStoresByLocation(params)
    if (response.data && response.data.stores) {
      const storeList = response.data.stores.map(store => {
        const distance = Number(store.distance)
        return {
          ...store,
          distanceText: Number.isFinite(distance) ? formatDistance(distance) : undefined
        }
      })

      stores.value = storeList
      return storeList
    }
    return []
  } catch (error) {
    logger.error('가게 목록 조회 실패', error)
    return []
  }
}

const renderMarkers = (cafes = [], moveToFirst = false) => {
  renderMarkersBase(cafes, handleMarkerClick)

  if (moveToFirst && cafes.length > 0 && map.value) {
    const firstCafe = cafes[0]
    const lat = firstCafe.lat || firstCafe.latitude
    const lng = firstCafe.lng || firstCafe.longitude
    map.value.setZoom(13)
    setTimeout(() => {
      panToWithOffset(lat, lng, { offsetRatio: 0.4 })
    }, 50)
  }
}

const showStorePopup = (store) => {
  if (!map.value) return

  const lat = store.lat || store.latitude
  const lng = store.lng || store.longitude

  panToWithOffset(lat, lng, { offsetRatio: 0.4 })

  setTimeout(() => {
    popupStore.value = store
    updatePopupPosition()
  }, 150)
}

const handleMarkerClick = (cafe) => {
  const lat = cafe.lat || cafe.latitude
  const lng = cafe.lng || cafe.longitude
  setFocusedLocation(lat, lng)
  showPopupOnly(cafe)
}

const handlePopupDetail = (store) => {
  if (store) {
    const storeId = store.storeId || store.id
    router.push({
      name: 'store-detail',
      params: { storeId }
    })
  }
  popupStore.value = null
}

const handleStoreSelect = (store) => {
  if (store) {
    const lat = store.lat || store.latitude
    const lng = store.lng || store.longitude
    setFocusedLocation(lat, lng)

    forceSheetState.value = 'half'
    setTimeout(() => {
      forceSheetState.value = null
    }, 100)

    showStorePopup(store)
  }
}

const handleSearch = async (searchParams) => {
  if (!map.value) return

  isSearching.value = true
  showSearchButton.value = false

  try {
    let lat, lng, radius
    const isKeywordSearch = searchParams.searchType !== 'category'

    if (searchParams.searchType === 'category' && searchLocation.value) {
      lat = searchLocation.value.lat
      lng = searchLocation.value.lng
      radius = searchLocation.value.radius
    } else if (searchParams.isGlobalSearch) {

      if (userLocation.value) {
        lat = userLocation.value.lat
        lng = userLocation.value.lng
      } else {
        const center = map.value.getCenter()
        lat = center.lat()
        lng = center.lng()
      }
      radius = 500000

      if (isKeywordSearch) {
        searchLocation.value = { lat, lng, radius }
      }
    } else {

      const center = map.value.getCenter()
      lat = center.lat()
      lng = center.lng()
      radius = getRadiusFromBounds()

      if (isKeywordSearch) {
        searchLocation.value = { lat, lng, radius }
      }
    }

    const storeList = await fetchStores(lat, lng, radius, {
      keyword: searchParams.keyword,
      categories: searchParams.categories
    })

    renderMarkers(storeList, false)

    searchKeyword.value = searchParams.keyword || ''
    searchCategories.value = typeof searchParams.categories === 'string' ? searchParams.categories.split(',') : []
    isGlobalSearch.value = searchParams.isGlobalSearch

    lastSearchCenter.value = { lat, lng }

    forceSheetState.value = 'full'
    setTimeout(() => {
      forceSheetState.value = null
    }, 100)

    if (storeList.length === 0) {
      showInfo('검색 결과가 없습니다.')
    }
  } finally {
    isSearching.value = false
  }
}

const handleSearchThisArea = async () => {
  if (!map.value || isSearching.value) return

  isSearching.value = true
  showSearchButton.value = false

  try {
    const center = map.value.getCenter()
    const radius = getRadiusFromBounds()
    const lat = center.lat()
    const lng = center.lng()

    searchLocation.value = { lat, lng, radius }

    searchKeyword.value = ''
    searchCategories.value = []

    const storeList = await fetchStores(lat, lng, radius)
    renderMarkers(storeList, false)

    lastSearchCenter.value = { lat, lng }

    if (storeList.length === 0) {
      showInfo('이 지역에 등록된 카페가 없습니다.')
    }
  } finally {
    isSearching.value = false
  }
}

const handleMyLocation = async () => {
  if (isLocating.value) return

  isLocating.value = true

  try {
    await requestLocation()

    if (location.value && map.value) {
      panToWithOffset(location.value.lat, location.value.lng, { offsetRatio: 0.4 })
      updateMyLocationMarker(location.value.lat, location.value.lng)
      userLocation.value = { lat: location.value.lat, lng: location.value.lng }
      setFocusedLocation(location.value.lat, location.value.lng)
      showSearchButton.value = true
    }
  } catch {
    showError('현재 위치를 가져올 수 없습니다.')
  } finally {
    isLocating.value = false
  }
}

const checkShowSearchButton = () => {
  if (!map.value || !lastSearchCenter.value) {
    showSearchButton.value = true
    return
  }

  const center = map.value.getCenter()
  const distance = calculateDistance(
    lastSearchCenter.value.lat, lastSearchCenter.value.lng,
    center.lat(), center.lng()
  )

  showSearchButton.value = distance > 100
}

onMounted(async () => {
  try {
    const defaultCenter = { lat: 37.5665, lng: 126.978 }

    await initMap(mapContainer.value, {
      center: defaultCenter,
      zoom: 15,
    })

    const hasSelectedFolder = savedStore.selectedFolder && savedStore.selectedFolderCafes.length > 0

    if (hasSelectedFolder) {
      renderMarkers(savedStore.selectedFolderCafes, true)
      savedStore.clearSelectedFolder()
    } else {
      let centerLat = defaultCenter.lat
      let centerLng = defaultCenter.lng

      try {
        await requestLocation()
        if (location.value && map.value) {
          centerLat = location.value.lat
          centerLng = location.value.lng
          panToWithOffset(centerLat, centerLng, { offsetRatio: 0.4 })
          updateMyLocationMarker(centerLat, centerLng)
          userLocation.value = { lat: centerLat, lng: centerLng }
          setFocusedLocation(centerLat, centerLng)
        }
      } catch {
        logger.warn('현재 위치를 가져올 수 없어 기본 위치를 사용합니다.')
      }

      const radius = getRadiusFromBounds()
      const storeList = await fetchStores(centerLat, centerLng, radius)
      renderMarkers(storeList, false)

      lastSearchCenter.value = { lat: centerLat, lng: centerLng }

      searchLocation.value = { lat: centerLat, lng: centerLng, radius }
    }

    if (map.value) {
      naver.maps.Event.addListener(map.value, 'idle', () => {
        checkShowSearchButton()
        updatePopupPosition()
      })

      naver.maps.Event.addListener(map.value, 'zoom_changed', () => {
        throttledUpdatePopupPosition()
        updateMarkerSizes()
      })
      naver.maps.Event.addListener(map.value, 'center_changed', throttledUpdatePopupPosition)
      naver.maps.Event.addListener(map.value, 'drag', () => {
        throttledUpdatePopupPosition()
        clearFocusedLocation()
      })
      naver.maps.Event.addListener(map.value, 'zooming', throttledUpdatePopupPosition)

      naver.maps.Event.addListener(map.value, 'click', closePopup)
    }
  } catch (error) {
    logger.error('초기화 실패', error)
    showError('지도를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  cleanupPopup()
  cleanupMarkers()
})

const navigateToStore = async (storeId) => {
  if (!map.value || !storeId) return

  try {
    logger.info('Navigating to store', { storeId })

    const response = await getStoreById(storeId)
    const store = response.data?.data || response.data

    if (!store) {
      logger.warn('Store not found', { storeId })
      return
    }

    const lat = store.lat || store.latitude
    const lng = store.lng || store.longitude

    if (!lat || !lng) {
      logger.warn('Store has no coordinates', { storeId, store })
      return
    }

    renderMarkers([store], false)

    map.value.setZoom(16)
    setTimeout(() => {
      panToWithOffset(lat, lng, { offsetRatio: 0.4 })
      setFocusedLocation(lat, lng)

      forceSheetState.value = 'half'
      setTimeout(() => {
        forceSheetState.value = null
      }, 100)

      setTimeout(() => {
        popupStore.value = store
        updatePopupPosition()
      }, 200)
    }, 100)

  } catch (error) {
    logger.error('Failed to navigate to store', { storeId, error })
  }
}

onActivated(() => {
  logger.debug('MapView activated', { query: route.query })

  const storeId = route.query.storeId
  if (storeId) {

    router.replace({ query: {} })

    if (map.value) {
      navigateToStore(storeId)
    } else {

      pendingStoreNavigation.value = storeId
    }
  }
})

watch(() => map.value, (newMap) => {
  if (newMap && pendingStoreNavigation.value) {
    navigateToStore(pendingStoreNavigation.value)
    pendingStoreNavigation.value = null
  }
})
</script>

<style scoped>
/* 이 지역 검색 버튼 (검색바 아래 플로팅) */
.search-area-button {
  position: absolute;
  /* 검색 영역 높이(약 4.25rem) + 간격(0.5rem) = 4.75rem */
  top: 4.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(132, 97, 72, 0.3);
  transition: all 200ms ease;
}

.search-area-button:hover:not(:disabled) {
  background-color: var(--color-primary-700);
  box-shadow: 0 6px 16px rgba(132, 97, 72, 0.4);
}

.search-area-button:active:not(:disabled) {
  transform: translateX(-50%) scale(0.97);
}

.search-area-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 지도 컨트롤 버튼들 */
.map-controls {
  position: absolute;
  right: 1rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-button {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: none;
  border-radius: 0.625rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease;
  color: var(--color-neutral-700);
}

.control-button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: var(--color-primary-600);
}

.control-button:active:not(:disabled) {
  transform: scale(0.95);
}

.control-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 모바일에서 Safe Area 대응 */
@media (max-width: 640px) {
  .search-area-button {
    /* 검색바 높이(4.25rem) + safe-area + 간격 */
    top: calc(max(0.75rem, env(safe-area-inset-top)) + 4rem);
  }

  .map-controls {
    right: max(1rem, env(safe-area-inset-right));
  }
}

/* 상단 검색 영역 (네이버/카카오 스타일) */
.top-search-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.75rem;
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

.top-search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 2.75rem;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.top-search-bar .search-icon {
  flex-shrink: 0;
  color: var(--color-textSecondary);
}

.top-search-bar .search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  color: var(--color-neutral-900);
  outline: none;
}

.top-search-bar .search-input::placeholder {
  color: var(--color-neutral-400);
}

.top-search-bar .clear-btn {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-neutral-300);
  color: white;
}

/* 카테고리 칩 행 */
.category-chips-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 0.25rem;
}

.category-chips-row::-webkit-scrollbar {
  display: none;
}

.category-chips-row .category-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-neutral-700);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.category-chips-row .category-chip:hover {
  border-color: var(--color-primary-300);
  background: var(--color-primary-50);
}

.category-chips-row .category-chip.selected {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: white;
}

.category-chips-row .chip-icon {
  font-size: 0.875rem;
}

/* 목록보기 버튼 (하단 중앙 플로팅) */
.list-view-button {
  position: absolute;
  /* bottom은 :style="controlsBottomStyle"로 동적 적용 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-neutral-800);
  transition: all 200ms ease;
}

.list-view-button:hover {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-300);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.list-view-button:active {
  transform: translateX(-50%) scale(0.97);
}
</style>
