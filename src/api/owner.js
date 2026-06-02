import api from './axios'
import { createLogger } from '@/utils/logger'

const logger = createLogger('API:Owner')

/**
 * 내 가맹점 목록 조회
 * @returns {Promise<Array>} 가맹점 목록
 */
export const getMyStores = async () => {
  logger.debug('내 가맹점 목록 조회')
  const response = await api.get('/stores/my')
  return response.data
}

/**
 * 가맹점 등록
 * @param {Object} storeData - 가맹점 정보
 * @returns {Promise<Object>} 생성된 가맹점 정보
 */
export const createStore = async (storeData) => {
  const payload = {
    roasteryId: storeData.roasteryId,
    name: storeData.name,
    description: storeData.description || null,
    address: storeData.address,
    latitude: Number(storeData.latitude),
    longitude: Number(storeData.longitude),
    openingHours: storeData.openingHours || null,
    category: storeData.category || null,
    phoneNumber: storeData.phoneNumber || null,
    thumbnailUrl: storeData.thumbnailUrl || null
  }
  logger.debug('가맹점 등록', payload)
  const response = await api.post('/stores', payload)
  return response.data
}

/**
 * 가맹점 수정
 * @param {number|string} storeId - 가맹점 ID
 * @param {Object} storeData - 수정할 정보 (부분 업데이트 지원)
 * @returns {Promise<Object>} 수정된 가맹점 정보
 */
export const updateStore = async (storeId, storeData) => {
  const payload = {}

  if (storeData.name !== undefined) payload.name = storeData.name
  if (storeData.description !== undefined) payload.description = storeData.description
  if (storeData.address !== undefined) payload.address = storeData.address
  if (storeData.latitude !== undefined) payload.latitude = Number(storeData.latitude)
  if (storeData.longitude !== undefined) payload.longitude = Number(storeData.longitude)
  if (storeData.openingHours !== undefined) payload.openingHours = storeData.openingHours
  if (storeData.category !== undefined) payload.category = storeData.category
  if (storeData.phoneNumber !== undefined) payload.phoneNumber = storeData.phoneNumber
  if (storeData.thumbnailUrl !== undefined) payload.thumbnailUrl = storeData.thumbnailUrl
  if (storeData.isClosed !== undefined) payload.isClosed = storeData.isClosed

  logger.debug('가맹점 수정', { storeId, payload })
  const response = await api.put(`/stores/${storeId}`, payload)
  return response.data
}

/**
 * 가맹점 삭제
 * @param {number|string} storeId - 가맹점 ID
 */
export const deleteStore = async (storeId) => {
  logger.debug('가맹점 삭제', { storeId })
  await api.delete(`/stores/${storeId}`)
}

/**
 * 메뉴 추가
 * @param {number|string} storeId - 가맹점 ID
 * @param {Object} menuData - 메뉴 정보
 * @returns {Promise<Object>} 생성된 메뉴 정보
 */
export const createMenu = async (storeId, menuData) => {
  const payload = {
    name: menuData.name,
    description: menuData.description || null,
    price: Number(menuData.price),
    category: menuData.category,
    imageUrl: menuData.imageUrl || null
  }
  logger.debug('메뉴 추가', { storeId, payload })
  const response = await api.post(`/stores/${storeId}/menus`, payload)
  return response.data
}

/**
 * 메뉴 수정
 * @param {number|string} menuId - 메뉴 ID
 * @param {Object} menuData - 수정할 정보 (부분 업데이트 지원)
 * @returns {Promise<Object>} 수정된 메뉴 정보
 */
export const updateMenu = async (menuId, menuData) => {
  const payload = {}

  if (menuData.name !== undefined) payload.name = menuData.name
  if (menuData.description !== undefined) payload.description = menuData.description
  if (menuData.price !== undefined) payload.price = Number(menuData.price)
  if (menuData.category !== undefined) payload.category = menuData.category
  if (menuData.imageUrl !== undefined) payload.imageUrl = menuData.imageUrl

  logger.debug('메뉴 수정', { menuId, payload })
  const response = await api.put(`/menus/${menuId}`, payload)
  return response.data
}

/**
 * 메뉴 삭제
 * @param {number|string} menuId - 메뉴 ID
 */
export const deleteMenu = async (menuId) => {
  logger.debug('메뉴 삭제', { menuId })
  await api.delete(`/menus/${menuId}`)
}

/**
 * 메뉴에 원두 연결
 * @param {number|string} menuId - 메뉴 ID
 * @param {Object} beanData - 원두 연결 정보
 * @returns {Promise<Object>} 연결 결과
 */
export const linkBeanToMenu = async (menuId, beanData) => {
  const payload = {
    beanId: beanData.beanId,
    isBlended: beanData.isBlended ?? false
  }
  logger.debug('원두 연결', { menuId, payload })
  const response = await api.post(`/menus/${menuId}/beans`, payload)
  return response.data
}

/**
 * 메뉴에서 원두 연결 해제
 * @param {number|string} menuId - 메뉴 ID
 * @param {number|string} beanId - 원두 ID
 */
export const unlinkBeanFromMenu = async (menuId, beanId) => {
  logger.debug('원두 연결 해제', { menuId, beanId })
  await api.delete(`/menus/${menuId}/beans/${beanId}`)
}

/**
 * 로스터리 목록 조회
 * @param {Object} params - 조회 파라미터
 * @param {number} params.page - 페이지 번호 (1부터 시작)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<Object>} 페이지네이션된 로스터리 목록
 */
export const getRoasteries = async ({ page = 1, size = 10 } = {}) => {
  logger.debug('로스터리 목록 조회', { page, size })
  const response = await api.get('/roasteries', { params: { page, size } })
  return response.data
}

/**
 * 로스터리 검색
 * @param {string} keyword - 검색 키워드
 * @param {Object} params - 조회 파라미터
 * @returns {Promise<Object>} 페이지네이션된 검색 결과
 */
export const searchRoasteries = async (keyword, { page = 1, size = 10 } = {}) => {
  logger.debug('로스터리 검색', { keyword, page, size })
  const response = await api.get('/roasteries/search', { params: { keyword, page, size } })
  return response.data
}

/**
 * 로스터리 상세 조회
 * @param {number|string} roasteryId - 로스터리 ID
 * @returns {Promise<Object>} 로스터리 정보
 */
export const getRoasteryById = async (roasteryId) => {
  logger.debug('로스터리 상세 조회', { roasteryId })
  const response = await api.get(`/roasteries/${roasteryId}`)
  return response.data
}

/**
 * 로스터리 생성
 * @param {Object} roasteryData - 로스터리 정보
 * @param {string} roasteryData.name - 로스터리 이름
 * @param {string} roasteryData.logoUrl - 로고 URL (선택)
 * @param {string} roasteryData.websiteUrl - 웹사이트 URL (선택)
 * @returns {Promise<Object>} 생성된 로스터리 정보
 */
export const createRoastery = async (roasteryData) => {
  const payload = {
    name: roasteryData.name,
    logoUrl: roasteryData.logoUrl || null,
    websiteUrl: roasteryData.websiteUrl || null
  }
  logger.debug('로스터리 생성', payload)
  const response = await api.post('/roasteries', payload)
  return response.data
}

/**
 * 원두 목록 조회
 * @param {Object} params - 조회 파라미터
 * @returns {Promise<Object>} 페이지네이션된 원두 목록
 */
export const getBeans = async ({ page = 1, size = 10 } = {}) => {
  logger.debug('원두 목록 조회', { page, size })
  const response = await api.get('/beans', { params: { page, size } })
  return response.data
}

/**
 * 특정 로스터리의 원두 목록 조회
 * @param {number|string} roasteryId - 로스터리 ID
 * @param {Object} params - 조회 파라미터
 * @returns {Promise<Object>} 페이지네이션된 원두 목록
 */
export const getBeansByRoastery = async (roasteryId, { page = 1, size = 10 } = {}) => {
  logger.debug('로스터리별 원두 조회', { roasteryId, page, size })
  const response = await api.get(`/beans/roastery/${roasteryId}`, { params: { page, size } })
  return response.data?.data || response.data
}

/**
 * 원두 검색 (생산 국가 기준)
 * @param {string} keyword - 검색 키워드 (국가명)
 * @param {Object} params - 조회 파라미터
 * @returns {Promise<Object>} 페이지네이션된 검색 결과
 */
export const searchBeans = async (keyword, { page = 1, size = 10 } = {}) => {
  logger.debug('원두 검색', { keyword, page, size })
  const response = await api.get('/beans/search', { params: { keyword, page, size } })
  return response.data
}

/**
 * 원두 상세 조회
 * @param {number|string} beanId - 원두 ID
 * @returns {Promise<Object>} 원두 정보
 */
export const getBeanById = async (beanId) => {
  logger.debug('원두 상세 조회', { beanId })
  const response = await api.get(`/beans/${beanId}`)
  return response.data
}

/**
 * 원두 생성
 * @param {Object} beanData - 원두 정보
 * @param {number|string} beanData.roasteryId - 로스터리 ID (필수)
 * @param {string} beanData.country - 생산 국가
 * @param {string} beanData.farm - 농장명 (선택)
 * @param {string} beanData.variety - 품종 (선택)
 * @param {string} beanData.processingMethod - 가공 방식 (선택)
 * @param {string} beanData.roastingLevel - 로스팅 레벨 (LIGHT, MEDIUM, DARK)
 * @returns {Promise<Object>} 생성된 원두 정보
 */
export const createBean = async (beanData) => {
  const name = beanData.name || (
    beanData.farm
      ? `${beanData.country} ${beanData.farm}`
      : beanData.country
  )

  const payload = {
    roasteryId: beanData.roasteryId,
    name,
    country: beanData.country,
    farm: beanData.farm || null,
    variety: beanData.variety || null,
    processingMethod: beanData.processingMethod || null,
    roastingLevel: beanData.roastingLevel || null
  }
  logger.debug('원두 생성', payload)
  const response = await api.post('/beans', payload)
  return response.data?.data || response.data
}

/**
 * 이미지 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @returns {Promise<string>} 업로드된 이미지 URL
 */
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)

  logger.debug('이미지 업로드', { fileName: file.name, fileSize: file.size })

  const response = await api.post('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data?.data?.url || response.data?.url || response.data
}
