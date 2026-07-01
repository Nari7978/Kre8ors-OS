import { create } from 'zustand';
import { OnboardingStep, CreatorOnboardingPayload } from '@/types/onboarding';

interface OnboardingState {
  currentStep: OnboardingStep;
  formData: CreatorOnboardingPayload;
  
  // Navigation actions
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Form persistence actions
  updateFormData: (data: Partial<CreatorOnboardingPayload>) => void;
  resetWizard: () => void;
  
  // Checking states
  connectionTested: boolean;
  setConnectionTested: (tested: boolean) => void;
  connectionSuccess: boolean;
  setConnectionSuccess: (success: boolean) => void;
}

const initialFormData: CreatorOnboardingPayload = {
  displayName: '',
  username: '',
  authId: '',
  sessCookie: '',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  xBcHeader: '',
  proxyHost: '',
  proxyPort: '',
  proxyUser: '',
  proxyPass: '',
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 'CREDENTIALS',
  formData: initialFormData,
  connectionTested: false,
  connectionSuccess: false,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep === 'CREDENTIALS') {
      set({ currentStep: 'PROXY' });
    } else if (currentStep === 'PROXY') {
      set({ currentStep: 'TEST_CONNECTION' });
    } else if (currentStep === 'TEST_CONNECTION') {
      set({ currentStep: 'CONFIRMATION' });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep === 'PROXY') {
      set({ currentStep: 'CREDENTIALS' });
    } else if (currentStep === 'TEST_CONNECTION') {
      set({ currentStep: 'PROXY' });
    }
  },

  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data },
  })),

  resetWizard: () => set({
    currentStep: 'CREDENTIALS',
    formData: initialFormData,
    connectionTested: false,
    connectionSuccess: false,
  }),

  setConnectionTested: (tested) => set({ connectionTested: tested }),
  setConnectionSuccess: (success) => set({ connectionSuccess: success }),
}));
