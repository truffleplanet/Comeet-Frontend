<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4 py-8">
    <div class="w-full max-w-[360px] flex flex-col items-center">
      <!-- 헤더 -->
      <div class="w-full relative mb-8 text-center flex items-center justify-between">
        <button
          type="button"
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
          @click="goBack"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1 class="text-lg font-bold text-textPrimary pr-10">회원가입</h1>
        <div></div>
      </div>

      <!-- 회원가입 카드 -->
      <div class="w-full bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
        <!-- 이름 입력 -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary mb-1.5 px-1">이름 <span class="text-error">*</span></label>
          <BaseInput
            v-model="name"
            placeholder="이름을 입력하세요"
            :clearable="true"
          />
        </div>

        <!-- 이메일 입력 -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary mb-1.5 px-1">이메일 주소 <span class="text-error">*</span></label>
          <BaseInput
            v-model="email"
            type="email"
            placeholder="user@example.com"
            :clearable="true"
            :status="emailStatus"
            :helper-text="emailError"
            @input="validateEmail"
          />
        </div>

        <!-- 비밀번호 입력 -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary mb-1.5 px-1">비밀번호 <span class="text-error">*</span></label>
          <div class="relative">
            <BaseInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="8자 이상의 비밀번호"
              :status="passwordStatus"
              :helper-text="passwordError"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-textSecondary hover:text-textPrimary"
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '숨기기' : '보기' }}
            </button>
          </div>
        </div>

        <!-- 닉네임 입력 (실시간 중복 검사 지원) -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary mb-1.5 px-1">닉네임 <span class="text-error">*</span></label>
          <BaseInput
            v-model="nickname"
            placeholder="닉네임을 입력해 주세요 (12자 이내)"
            :clearable="true"
            :status="nicknameStatus"
            :helper-text="nicknameHelperMessage"
            @update:model-value="validateNickname"
            @clear="handleNicknameClear"
          />
        </div>

        <!-- 회원가입 에러 피드백 -->
        <p v-if="signupError" class="text-xs text-error font-medium px-1">{{ signupError }}</p>

        <!-- 회원가입 버튼 -->
        <div class="pt-2">
          <BaseButton
            variant="primary"
            size="large"
            class="w-full"
            :disabled="!isFormValid || isLoading"
            :loading="isLoading"
            @click="handleSignup"
          >
            가입 및 회원 등록 완료
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { checkNickname } from '@/api/auth';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import { DEFAULTS, VALIDATION } from '@/constants';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SignupView');
const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const nickname = ref('');

const showPassword = ref(false);
const isLoading = ref(false);
const signupError = ref('');

// 입력값 검증 에러 피드백
const emailError = ref('');
const passwordError = ref('');
const nicknameHelperMessage = ref('');
const nicknameValidationState = ref('idle');
let nicknameTimer = null;

const emailStatus = computed(() => {
  if (!email.value) return '';
  return emailError.value ? 'error' : 'success';
});

const passwordStatus = computed(() => {
  if (!password.value) return '';
  return password.value.length < 8 ? 'error' : 'success';
});

const nicknameStatus = computed(() => {
  if (nicknameValidationState.value === 'success') return 'success';
  if (nicknameValidationState.value === 'error' || nicknameValidationState.value === 'duplicate') return 'error';
  return '';
});

const validateEmail = () => {
  if (!email.value) {
    emailError.value = '';
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    emailError.value = '이메일 형식이 올바르지 않습니다.';
  } else {
    emailError.value = '';
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 닉네임 유효성 검사 (실시간 디바운싱 중복체크)
const validateNickname = async () => {
  if (nickname.value.length === 0) {
    nicknameValidationState.value = 'idle';
    nicknameHelperMessage.value = '';
    clearTimeout(nicknameTimer);
    return;
  }

  if (/\s/.test(nickname.value)) {
    nicknameValidationState.value = 'error';
    nicknameHelperMessage.value = '공백은 사용할 수 없습니다';
    clearTimeout(nicknameTimer);
    return;
  }

  if (!VALIDATION.NICKNAME.PATTERN.test(nickname.value)) {
    nicknameValidationState.value = 'error';
    nicknameHelperMessage.value = '한글과 영문만 사용할 수 있습니다';
    clearTimeout(nicknameTimer);
    return;
  }

  clearTimeout(nicknameTimer);
  nicknameTimer = setTimeout(async () => {
    try {
      nicknameValidationState.value = 'checking';
      nicknameHelperMessage.value = '확인 중...';

      const trimmedNickname = nickname.value.trim();
      const isAvailable = await checkNickname(trimmedNickname);

      if (isAvailable) {
        nicknameValidationState.value = 'success';
        nicknameHelperMessage.value = '사용할 수 있는 닉네임이에요';
      } else {
        nicknameValidationState.value = 'duplicate';
        nicknameHelperMessage.value = '이미 사용 중인 닉네임입니다';
      }
    } catch (error) {
      logger.error('닉네임 중복 확인 실패', error);
      nicknameValidationState.value = 'error';
      nicknameHelperMessage.value = '중복 확인에 실패했습니다. 다시 시도해 주세요.';
    }
  }, DEFAULTS.DEBOUNCE_DELAY);
};

const handleNicknameClear = () => {
  nickname.value = '';
  nicknameValidationState.value = 'idle';
  nicknameHelperMessage.value = '';
  clearTimeout(nicknameTimer);
};

const isFormValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return name.value.trim().length > 0 &&
    emailRegex.test(email.value.trim()) &&
    !emailError.value &&
    password.value.length >= 8 &&
    nickname.value.trim().length > 0 &&
    nicknameValidationState.value === 'success';
});

const goBack = () => {
  router.push('/login');
};

const handleSignup = async () => {
  if (!isFormValid.value || isLoading.value) return;

  isLoading.value = true;
  signupError.value = '';

  try {
    await authStore.signup({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      nickname: nickname.value.trim()
    });

    // 가입 및 로그인 완료 시 온보딩 페이지로 직접 이동!
    router.push('/preference-onboarding');
  } catch (error) {
    logger.error('회원가입 실패', error);
    const message = error.response?.data?.error?.message;
    const errorCode = error.response?.data?.error?.code;
    
    if (errorCode === 'NICKNAME_DUPLICATED') {
      nicknameValidationState.value = 'duplicate';
      nicknameHelperMessage.value = '이미 사용 중인 닉네임입니다';
    } else {
      signupError.value = message || '회원가입 처리 도중 오류가 발생했습니다.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
</style>
