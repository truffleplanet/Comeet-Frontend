import api from './axios';
import { createLogger } from '@/utils/logger';

const logger = createLogger('API:Review');

/**
 * 리뷰 생성
 *
 * @param {Object} reviewData
 * @param {number|string} reviewData.storeId - 가맹점 ID (Required)
 * @param {string} reviewData.content - 리뷰 내용
 * @param {Array<number|string>} reviewData.flavorIds - 선택한 Flavor ID 목록
 * @param {number|string} [reviewData.visitId] - 방문 인증 ID (Required by API)
 * @param {number|string} [reviewData.menuId] - 메뉴 ID (Required by API)
 * @param {boolean} [reviewData.isPublic=true] - 공개 여부
 * @param {string} [reviewData.imageUrl] - 이미지 URL
 * @param {number} [reviewData.rating] - 별점 (0-5, 선택)
 *
 * @returns {Promise<Object>} API 응답
 */
export const createReview = async (reviewData) => {
  const payload = {
    storeId: reviewData.storeId,
    content: reviewData.content,
    isPublic: reviewData.isPublic ?? true,
    flavorIdList: reviewData.flavorIds || [],
    imageUrl: reviewData.imageUrl || null,
    visitId: reviewData.visitId || null,
    menuId: reviewData.menuId || null,
    rating: reviewData.rating ?? null
  };

  logger.debug('Creating review with payload:', payload);

  const response = await api.post('/reviews', payload);
  return response.data;
};

/**
 * 내 리뷰 목록 조회 (페이지네이션)
 *
 * @param {Object} params
 * @param {number} [params.page=1] - 페이지 번호 (1부터 시작)
 * @param {number} [params.size=10] - 페이지 크기
 * @returns {Promise<Object>} 페이지네이션된 리뷰 목록
 */
export const getMyReviews = async ({ page = 1, size = 10 } = {}) => {
  logger.debug('Fetching my reviews', { page, size });

  const response = await api.get('/reviews', {
    params: { page, size }
  });
  return response.data;
};

/**
 * 커핑 노트 작성
 *
 * @param {number} reviewId - 리뷰 ID
 * @param {Object} cuppingNote - 커핑 노트 데이터
 * @param {string} [cuppingNote.roastLevel] - 로스팅 레벨 (LIGHT, MEDIUM_LIGHT, MEDIUM, MEDIUM_DARK, DARK)
 * @param {number} [cuppingNote.fragranceScore] - 향기 점수 (0.00-15.00)
 * @param {number} [cuppingNote.aromaScore] - 아로마 점수 (0.00-15.00)
 * @param {number} [cuppingNote.flavorScore] - 풍미 점수 (0.00-15.00)
 * @param {number} [cuppingNote.aftertasteScore] - 여운 점수 (0.00-15.00)
 * @param {number} [cuppingNote.acidityScore] - 산미 점수 (0.00-15.00)
 * @param {number} [cuppingNote.sweetnessScore] - 단맛 점수 (0.00-15.00)
 * @param {number} [cuppingNote.mouthfeelScore] - 바디감 점수 (0.00-15.00)
 * @param {string} [cuppingNote.fragranceAromaDetail] - 향기/아로마 상세 노트
 * @param {string} [cuppingNote.flavorAftertasteDetail] - 맛/여운 상세 노트
 * @param {string} [cuppingNote.acidityNotes] - 산미 노트
 * @param {string} [cuppingNote.sweetnessNotes] - 단맛 노트
 * @param {string} [cuppingNote.mouthfeelNotes] - 바디감 노트
 * @param {string} [cuppingNote.overallNotes] - 종합 평가
 *
 * @returns {Promise<Object>} API 응답
 */
export const createCuppingNote = async (reviewId, cuppingNote) => {
  const payload = {
    roastLevel: cuppingNote.roastLevel ?? null,
    fragranceScore: cuppingNote.fragranceScore ?? null,
    aromaScore: cuppingNote.aromaScore ?? null,
    flavorScore: cuppingNote.flavorScore ?? null,
    aftertasteScore: cuppingNote.aftertasteScore ?? null,
    acidityScore: cuppingNote.acidityScore ?? null,
    sweetnessScore: cuppingNote.sweetnessScore ?? null,
    mouthfeelScore: cuppingNote.mouthfeelScore ?? null,
    fragranceAromaDetail: cuppingNote.fragranceAromaDetail ?? null,
    flavorAftertasteDetail: cuppingNote.flavorAftertasteDetail ?? null,
    acidityNotes: cuppingNote.acidityNotes ?? null,
    sweetnessNotes: cuppingNote.sweetnessNotes ?? null,
    mouthfeelNotes: cuppingNote.mouthfeelNotes ?? null,
    overallNotes: cuppingNote.overallNotes ?? null
  };

  logger.debug('Creating cupping note for review:', reviewId, payload);

  const response = await api.post(`/reviews/${reviewId}/cupping-note`, payload);
  return response.data;
};

/**
 * 커핑 노트 수정
 *
 * @param {number} reviewId - 리뷰 ID
 * @param {Object} cuppingNote - 커핑 노트 데이터 (createCuppingNote와 동일한 구조)
 * @returns {Promise<Object>} API 응답
 */
export const updateCuppingNote = async (reviewId, cuppingNote) => {
  const payload = {
    roastLevel: cuppingNote.roastLevel ?? null,
    fragranceScore: cuppingNote.fragranceScore ?? null,
    aromaScore: cuppingNote.aromaScore ?? null,
    flavorScore: cuppingNote.flavorScore ?? null,
    aftertasteScore: cuppingNote.aftertasteScore ?? null,
    acidityScore: cuppingNote.acidityScore ?? null,
    sweetnessScore: cuppingNote.sweetnessScore ?? null,
    mouthfeelScore: cuppingNote.mouthfeelScore ?? null,
    fragranceAromaDetail: cuppingNote.fragranceAromaDetail ?? null,
    flavorAftertasteDetail: cuppingNote.flavorAftertasteDetail ?? null,
    acidityNotes: cuppingNote.acidityNotes ?? null,
    sweetnessNotes: cuppingNote.sweetnessNotes ?? null,
    mouthfeelNotes: cuppingNote.mouthfeelNotes ?? null,
    overallNotes: cuppingNote.overallNotes ?? null
  };

  logger.debug('Updating cupping note for review:', reviewId, payload);

  const response = await api.patch(`/reviews/${reviewId}/cupping-note`, payload);
  return response.data;
};

/**
 * 커핑 노트 상세 조회
 *
 * @param {number} reviewId - 리뷰 ID
 * @returns {Promise<Object>} 커핑 노트 데이터
 */
export const getCuppingNote = async (reviewId) => {
  logger.debug('Fetching cupping note for review:', reviewId);

  const response = await api.get(`/reviews/${reviewId}/cupping-note`);
  return response.data;
};

/**
 * 리뷰 상세 조회
 *
 * @param {number} reviewId - 리뷰 ID
 * @returns {Promise<Object>} 리뷰 상세 데이터 (ReviewedResDto)
 */
export const getReviewDetail = async (reviewId) => {
  logger.debug('Fetching review detail:', reviewId);

  const response = await api.get(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * 리뷰 수정
 *
 * @param {number} reviewId - 리뷰 ID
 * @param {Object} reviewData - 수정할 리뷰 데이터
 * @param {string} [reviewData.content] - 리뷰 내용
 * @param {Array<number|string>} [reviewData.flavorIds] - 선택한 Flavor ID 목록
 * @param {boolean} [reviewData.isPublic] - 공개 여부
 * @param {string} [reviewData.imageUrl] - 이미지 URL
 * @param {number} [reviewData.rating] - 별점 (0-5)
 * @returns {Promise<Object>} API 응답
 */
export const updateReview = async (reviewId, reviewData) => {
  const payload = {
    content: reviewData.content,
    flavorIdList: reviewData.flavorIds || [],
    isPublic: reviewData.isPublic,
    imageUrl: reviewData.imageUrl || null,
    rating: reviewData.rating ?? null
  };

  logger.debug('Updating review:', reviewId, payload);

  const response = await api.patch(`/reviews/${reviewId}`, payload);
  return response.data;
};

/**
 * 리뷰 삭제
 *
 * @param {number} reviewId - 리뷰 ID
 * @returns {Promise<Object>} API 응답
 */
export const deleteReview = async (reviewId) => {
  logger.debug('Deleting review:', reviewId);

  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * 커핑 노트 존재 여부 확인
 * 404 에러가 발생하면 커핑 노트가 없는 것으로 판단
 *
 * @param {number} reviewId - 리뷰 ID
 * @returns {Promise<boolean>} 커핑 노트 존재 여부
 */
export const checkCuppingNoteExists = async (reviewId) => {
  try {
    await api.get(`/reviews/${reviewId}/cupping-note`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};
