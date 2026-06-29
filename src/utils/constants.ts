import { BASE_URL } from '@env';

export const API = {
  auth: {
    login: 'api/auth/login-user',
    signup: 'api/auth/register',
    verifyEmail: 'api/v1/user/verify-email',
    logout: '',
    forgotPassword: 'api/auth/forgot-password',
    forgotPasswordVerifyOtp: 'api/auth/forgot-password-verify-otp',
    resetPassword: 'api/auth/reset-password',
    registerResendPassword: 'api/auth/register-resend-otp',
    socialLogin: 'api/auth/register-login-social',
    refreshToken: 'api/auth/refresh-token',
  },
  user: {
    fetchProfile: 'api/auth/profile-details',
    cityList: 'api/v1/region/CA/cities',
    editProfile: 'api/v1/user/profile-update',
    deleteAccount: 'api/v1/user/delete-account',
    categoryList: 'api/v1/user/category/getall',
    addService: 'api/v1/user/service',
    changePassword: 'api/auth/change-password',
  },
  service: {
    allService: 'api/v1/user/service/getall',
    service: 'api/v1/user/service/',
  },
  availability: {
    updateAvailability: 'api/v1/user/service-provider/save-availability',
    getAvailability: 'api/v1/user/service-provider/availability/',
  },
  helpCenter: {
    faq: 'api/v1/admin/faq/getall',
    faqCategory: 'api/v1/admin/faq/getall-category',
    contactUs: 'api/v1/admin/contact-us',
  },
  tncPrivacyPolicy: {
    privacyPolicy: 'api/v1/admin/privacy-policy',
    termsCondition: 'api/v1/admin/terms-conditions',
  },
  chat: {
    chatList: 'api/v1/user/chat/conversation-list',
    chatRoomList: 'api/v1/user/chat',
    chatImageUpload: 'api/v1/user/chat/image-upload',
  },
};

export const IMAGES_BUCKET_URL = {
  category: `${BASE_URL}uploads/category/`,
  service: `${BASE_URL}uploads/service/`,
  profile: `${BASE_URL}uploads/users/`,
  chat: `${BASE_URL}uploads/chat/`,
};
