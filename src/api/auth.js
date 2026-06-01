/**
 * 인증 관련 API 호출 함수
 */
import api from '@/api/axios';
import { API_ENDPOINTS } from '@/constants';

/**
 * 사용자 정보 조회 (인증 필요)
 * GET /user
 * @returns {Promise<Object>} 사용자 정보
 */
export const getUserInfo = async () => {
  const response = await api.get(API_ENDPOINTS.USER.INFO);
  return response.data.data;
};

/**
 * 닉네임 중복 확인
 * GET /user/nickname/check?nickname={nickname}
 * @param {string} nickname - 확인할 닉네임
 * @returns {Promise<boolean>} 사용 가능 여부 (true: 사용 가능, false: 중복)
 */
export const checkNickname = async (nickname) => {
  const response = await api.get(API_ENDPOINTS.USER.NICKNAME_CHECK, {
    params: { nickname }
  });
  return !response.data.data.exists;
};

/**
 * 회원 가입 (이메일, 비밀번호, 이름, 닉네임)
 * POST /auth/signup
 * @param {Object} signupData - 회원 가입 정보
 * @param {string} signupData.name - 이름
 * @param {string} signupData.email - 이메일
 * @param {string} signupData.password - 비밀번호 (8자 이상)
 * @param {string} signupData.nickname - 닉네임 (1~12자)
 * @returns {Promise<Object>} 가입 완료 토큰 정보
 */
export const signup = async (signupData) => {
  const response = await api.post('/auth/signup', signupData);
  return response.data.data;
};

/**
 * 로그인 (이메일, 비밀번호)
 * POST /auth/login
 * @param {Object} loginData - 로그인 정보
 * @param {string} loginData.email - 이메일
 * @param {string} loginData.password - 비밀번호
 * @returns {Promise<Object>} 로그인 토큰 정보
 */
export const login = async (loginData) => {
  const response = await api.post('/auth/login', loginData);
  return response.data.data;
};

/**
 * 로그아웃
 * @returns {Promise<void>}
 */
export const logout = async () => {
  await api.post(API_ENDPOINTS.AUTH.LOGOUT);
};

/**
 * 토큰 재발급
 * @returns {Promise<void>}
 */
export const reissueToken = async () => {
  await api.post(API_ENDPOINTS.AUTH.REISSUE);
};

/**
 * 사용자 최종 등록 (소셜 로그인 후 닉네임 설정)
 * POST /user/register
 * @param {Object} registerData
 * @param {string} registerData.nickname - 설정할 닉네임
 * @param {string} registerData.role - 역할 (USER)
 * @returns {Promise<Object>} 등록된 사용자 정보
 */
export const registerUser = async (registerData) => {
  const response = await api.post(API_ENDPOINTS.USER.REGISTER, registerData);
  return response.data.data;
};

/**
 * 사용자 정보 수정
 * PUT /user
 * @param {Object} userData - 수정할 사용자 정보
 * @param {string} [userData.nickname] - 변경할 닉네임 (1~12자, 한글/영문만 허용)
 * @param {string} [userData.profileImageUrl] - 변경할 프로필 이미지 URL
 * @returns {Promise<Object>} 수정된 사용자 정보
 */
export const updateUser = async (userData) => {
  const response = await api.put(API_ENDPOINTS.USER.UPDATE, userData);
  return response.data.data;
};
