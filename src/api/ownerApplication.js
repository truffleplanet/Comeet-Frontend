import api from './axios'
import { createLogger } from '@/utils/logger'

const logger = createLogger('API:OwnerApplication')

/**
 * 가맹점주 신청 등록
 * @param {Object} applicationData - 신청 및 가맹점 등록 정보
 * @returns {Promise<Object>} 생성된 신청 정보
 */
export const applyForOwner = async (applicationData) => {
  const payload = {
    roasteryId: Number(applicationData.roasteryId),
    name: applicationData.name,
    description: applicationData.description || null,
    address: applicationData.address,
    latitude: Number(applicationData.latitude),
    longitude: Number(applicationData.longitude),
    businessRegistrationNumber: applicationData.businessRegistrationNumber,
    representativeName: applicationData.representativeName,
    businessLicenseUrl: applicationData.businessLicenseUrl,
    openingHours: applicationData.openingHours || null,
    category: applicationData.category || null,
    phoneNumber: applicationData.phoneNumber || null,
    thumbnailUrl: applicationData.thumbnailUrl || null
  }
  logger.debug('가맹점주 신청 등록', payload)
  const response = await api.post('/owner-applications', payload)
  return response.data?.data || response.data
}

/**
 * 내 최근 가맹점주 신청 및 검토 결과 조회
 * @returns {Promise<Object>} 최근 신청 정보
 */
export const getMyLatestApplication = async () => {
  logger.debug('내 최근 가맹점주 신청 조회')
  const response = await api.get('/owner-applications/me/latest')
  return response.data?.data || response.data
}

/**
 * [관리자] 가맹점주 신청 목록 조회
 * @param {string} [status] - 신청 상태 필터 (PENDING | APPROVED | REJECTED)
 * @returns {Promise<Array>} 신청 목록
 */
export const adminGetApplications = async (status = null) => {
  logger.debug('관리자 가맹점주 신청 목록 조회', { status })
  const params = {}
  if (status) {
    params.status = status
  }
  const response = await api.get('/admin/owner-applications', { params })
  return response.data?.data || response.data || []
}

/**
 * [관리자] 가맹점주 신청 상세 조회
 * @param {number|string} applicationId - 신청 ID
 * @returns {Promise<Object>} 신청 상세 정보
 */
export const adminGetApplicationById = async (applicationId) => {
  logger.debug('관리자 가맹점주 신청 상세 조회', { applicationId })
  const response = await api.get(`/admin/owner-applications/${applicationId}`)
  return response.data?.data || response.data
}

/**
 * [관리자] 특정 가맹점주 신청의 승인/거절 검토 이력 조회
 * @param {number|string} applicationId - 신청 ID
 * @returns {Promise<Array>} 검토 이력 목록
 */
export const adminGetApplicationHistories = async (applicationId) => {
  logger.debug('관리자 가맹점주 신청 검토 이력 조회', { applicationId })
  const response = await api.get(`/admin/owner-applications/${applicationId}/histories`)
  return response.data?.data || response.data || []
}

/**
 * [관리자] 가맹점주 신청 승인
 * @param {number|string} applicationId - 신청 ID
 * @param {string} [reviewComment] - 관리자 검토 메모
 * @returns {Promise<Object>} 승인 결과 신청 정보
 */
export const adminApproveApplication = async (applicationId, reviewComment = '') => {
  logger.debug('관리자 가맹점주 신청 승인', { applicationId, reviewComment })
  const response = await api.post(`/admin/owner-applications/${applicationId}/approve`, {
    reviewComment: reviewComment || null
  })
  return response.data?.data || response.data
}

/**
 * [관리자] 가맹점주 신청 거절
 * @param {number|string} applicationId - 신청 ID
 * @param {string} rejectReason - 거절 사유 (필수)
 * @returns {Promise<Object>} 거절 결과 신청 정보
 */
export const adminRejectApplication = async (applicationId, rejectReason) => {
  logger.debug('관리자 가맹점주 신청 거절', { applicationId, rejectReason })
  if (!rejectReason || !rejectReason.trim()) {
    throw new Error('거절 사유는 필수 입력값입니다.')
  }
  const response = await api.post(`/admin/owner-applications/${applicationId}/reject`, {
    rejectReason: rejectReason.trim()
  })
  return response.data?.data || response.data
}
