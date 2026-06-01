import api from './axios'

/**
 * 원두 상세 조회
 * @param {number} beanId - 원두 ID
 * @returns {Promise<Object>} 원두 상세 정보 (향미, 원산지 등)
 */
export const getBeanById = async (beanId) => {
  const response = await api.get(`/beans/${beanId}`)
  return response.data?.data || response.data
}

/**
 * 로스터리의 원두 목록 조회
 * @param {number} roasteryId - 로스터리 ID
 * @returns {Promise<Array>} 원두 목록
 */
export const getBeansByRoastery = async (roasteryId) => {
  const response = await api.get(`/beans/roastery/${roasteryId}`)
  return response.data?.data || response.data || []
}

/**
 * 원두 생성
 * @param {Object} beanData - 원두 정보
 * @returns {Promise<Object>} 생성된 원두 정보
 */
export const createBean = async (beanData) => {
  const response = await api.post('/beans', beanData)
  return response.data?.data || response.data
}

/**
 * 원두 수정
 * @param {number} beanId - 원두 ID
 * @param {Object} beanData - 수정할 원두 정보
 * @returns {Promise<Object>} 수정된 원두 정보
 */
export const updateBean = async (beanId, beanData) => {
  const response = await api.patch(`/beans/${beanId}`, beanData)
  return response.data?.data || response.data
}

/**
 * 원두 삭제
 * @param {number} beanId - 원두 ID
 * @returns {Promise<void>}
 */
export const deleteBean = async (beanId) => {
  await api.delete(`/beans/${beanId}`)
}

/**
 * 원두 플레이버 매핑 전체 교체 (PUT)
 * 기존 매핑을 모두 삭제하고 새로운 매핑으로 교체
 * @param {number} beanId - 원두 ID
 * @param {number[]} flavorIds - 플레이버 ID 목록
 * @returns {Promise<Object>} 매핑된 플레이버 정보
 */
export const updateBeanFlavors = async (beanId, flavorIds) => {
  const response = await api.put(`/beans/${beanId}/flavors`, { flavorIds })
  return response.data?.data || response.data
}

/**
 * 원두 플레이버 매핑 전체 삭제
 * @param {number} beanId - 원두 ID
 * @returns {Promise<void>}
 */
export const deleteBeanFlavors = async (beanId) => {
  await api.delete(`/beans/${beanId}/flavors`)
}
