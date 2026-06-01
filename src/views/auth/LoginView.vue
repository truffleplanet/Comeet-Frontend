<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4 py-8">
    <div class="w-full max-w-[360px] flex flex-col items-center">
      <!-- 로고 -->
      <div class="mb-10 text-center">
        <img :src="logoUrl" alt="Comeet" class="w-36 h-36 mx-auto" />
        <h1 class="text-2xl font-black text-primary-800 tracking-wider mt-2">Comeet</h1>
        <p class="text-xs text-textSecondary mt-1">스페셜티 카페와 특별한 원두의 만남</p>
      </div>

      <!-- 로그인 카드 -->
      <div class="w-full bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
        <!-- 이메일 입력 -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary mb-1.5 px-1">이메일 주소</label>
          <BaseInput
            v-model="email"
            type="email"
            placeholder="user@example.com"
            :clearable="true"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- 비밀번호 입력 -->
        <div>
          <div class="flex justify-between items-center mb-1.5 px-1">
            <label class="text-xs font-semibold text-textSecondary">비밀번호</label>
          </div>
          <div class="relative">
            <BaseInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="비밀번호를 입력하세요"
              @keyup.enter="handleLogin"
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

        <!-- 로그인 에러 피드백 -->
        <p v-if="loginError" class="text-xs text-error font-medium px-1">{{ loginError }}</p>

        <!-- 로그인 버튼 -->
        <div class="pt-2">
          <BaseButton
            variant="primary"
            size="large"
            class="w-full"
            :disabled="!isFormValid || isLoading"
            :loading="isLoading"
            @click="handleLogin"
          >
            로그인
          </BaseButton>
        </div>
      </div>

      <!-- 하단 옵션 링크 -->
      <div class="w-full mt-6 flex justify-between items-center px-2 text-xs text-textSecondary">
        <button
          type="button"
          class="hover:underline hover:text-primary font-medium"
          @click="goToSignup"
        >
          계정이 없으신가요? <strong>회원가입</strong>
        </button>
        
        <span class="text-neutral-300">|</span>

        <button
          type="button"
          class="hover:underline hover:text-primary font-medium"
          @click="handleBrowseWithoutLogin"
        >
          로그인 없이 둘러보기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import logoUrl from '@/assets/logo.svg?url';
import { createLogger } from '@/utils/logger';

const logger = createLogger('LoginView');
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const loginError = ref('');

const isFormValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value.trim()) && password.value.length > 0;
});

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  if (!isFormValid.value || isLoading.value) return;

  isLoading.value = true;
  loginError.value = '';

  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value
    });
    
    // 로그인 성공 시 메인 지도로 이동
    router.push('/map');
  } catch (error) {
    logger.error('로그인 버튼 실패', error);
    const message = error.response?.data?.error?.message;
    loginError.value = message || '이메일 또는 비밀번호가 올바르지 않습니다.';
  } finally {
    isLoading.value = false;
  }
};

const goToSignup = () => {
  router.push('/signup');
};

const handleBrowseWithoutLogin = () => {
  router.push('/');
};
</script>

<style scoped>
</style>
