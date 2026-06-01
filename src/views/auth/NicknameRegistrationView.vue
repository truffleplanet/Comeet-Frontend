<template>
  <div class="min-h-screen bg-white p-4 relative">
    <button
      class="absolute top-4 left-4 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity z-10"
      aria-label="뒤로 가기"
      @click="handleBack"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="max-w-[360px] mx-auto pt-16 flex flex-col min-h-[calc(100vh-2rem)]">
      <div class="flex-1 flex flex-col">
        <div class="mb-10">
          <h1 class="text-2xl font-bold leading-relaxed text-neutral-900">
            Comeet에서 사용할<br>닉네임을 등록해 주세요
          </h1>
        </div>

        <div class="mb-auto">
          <BaseInput
            v-model="nickname"
            type="text"
            variant="border"
            :status="inputStatus"
            placeholder="닉네임을 입력해 주세요 (12자 이내)"
            :clearable="true"
            @update:model-value="validateNickname"
            @clear="handleClear"
          />
          <div class="flex justify-between items-center mt-2 px-1">
            <span :class="helperTextClass">{{ helperMessage || '\u00A0' }}</span>
            <span class="text-sm text-textSecondary">{{ nickname.length }}/{{ VALIDATION.NICKNAME.MAX_LENGTH }}</span>
          </div>
        </div>

        <div class="pb-8">
          <BaseButton
            variant="primary"
            size="large"
            :disabled="!isNicknameValid || isSubmitting"
            :loading="isSubmitting"
            class="w-full"
            @click="handleSubmit"
          >
            시작하기
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { checkNickname, registerUser } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { DEFAULTS, VALIDATION } from '@/constants';
import { showSuccess } from '@/utils/toast';
import { createLogger } from '@/utils/logger';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseButton from '@/components/common/BaseButton.vue';

const logger = createLogger('NicknameRegistrationView');
const router = useRouter();
const authStore = useAuthStore();

const nickname = ref('');
const validationState = ref('idle');
const helperMessage = ref('');
const isSubmitting = ref(false);
let debounceTimer = null;

/** BaseInput status prop에 맞는 상태 변환 */
const inputStatus = computed(() => {
  if (validationState.value === 'success') return 'success';
  if (validationState.value === 'error' || validationState.value === 'duplicate') return 'error';
  return '';
});

/** Helper text 색상 클래스 */
const helperTextClass = computed(() => {
  if (validationState.value === 'success') return 'text-sm text-success';
  if (validationState.value === 'error' || validationState.value === 'duplicate') return 'text-sm text-error';
  return 'text-sm text-textSecondary';
});

/** 닉네임 유효성 (등록 진행 가능 여부) */
const isNicknameValid = computed(() => {
  return nickname.value.trim().length > 0 && validationState.value === 'success';
});

/** 닉네임 유효성 검사 */
const validateNickname = async () => {
  if (nickname.value.length === 0) {
    validationState.value = 'idle';
    helperMessage.value = '';
    clearTimeout(debounceTimer);
    return;
  }

  if (/\s/.test(nickname.value)) {
    validationState.value = 'error';
    helperMessage.value = '공백은 사용할 수 없습니다';
    clearTimeout(debounceTimer);
    return;
  }

  if (!VALIDATION.NICKNAME.PATTERN.test(nickname.value)) {
    validationState.value = 'error';
    helperMessage.value = '한글과 영문만 사용할 수 있습니다';
    clearTimeout(debounceTimer);
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      validationState.value = 'checking';
      helperMessage.value = '확인 중...';

      const trimmedNickname = nickname.value.trim();
      const isAvailable = await checkNickname(trimmedNickname);

      if (isAvailable) {
        validationState.value = 'success';
        helperMessage.value = '사용할 수 있는 닉네임이에요';
      } else {
        validationState.value = 'duplicate';
        helperMessage.value = '이미 사용 중인 닉네임입니다';
      }
    } catch (error) {
      logger.error('닉네임 중복 확인 실패', error);
      validationState.value = 'error';
      helperMessage.value = '중복 확인에 실패했습니다. 다시 시도해 주세요.';
    }
  }, DEFAULTS.DEBOUNCE_DELAY);
};

/** 입력 초기화 핸들러 */
const handleClear = () => {
  nickname.value = '';
  validationState.value = 'idle';
  helperMessage.value = '';
  clearTimeout(debounceTimer);
};

/** 뒤로 가기 */
const handleBack = () => {
  router.back();
};

/** 사용자 등록 완료 */
const handleSubmit = async () => {
  if (!isNicknameValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    await registerUser({
      nickname: nickname.value.trim(),
      role: 'USER'
    });

    await authStore.fetchUser();
    showSuccess(`환영합니다, ${nickname.value.trim()}님!`);
    router.push('/preference-onboarding');
  } catch (error) {
    const errorCode = error.response?.data?.error?.code;
    const errorMessage = error.response?.data?.error?.message;

    if (errorCode === 'U-002') {
      helperMessage.value = '닉네임을 입력해 주세요';
    } else if (errorCode === 'U-003') {
      helperMessage.value = '닉네임 형식이 올바르지 않습니다';
    } else {
      helperMessage.value = errorMessage || '등록에 실패했습니다. 다시 시도해 주세요.';
    }

    validationState.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
</style>
