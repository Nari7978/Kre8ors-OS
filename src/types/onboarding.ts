export type OnboardingStep = 'CREDENTIALS' | 'PROXY' | 'TEST_CONNECTION' | 'CONFIRMATION';

export interface CreatorOnboardingPayload {
  displayName: string;
  username: string;
  authId: string;
  sessCookie: string;
  userAgent: string;
  xBcHeader?: string;
  
  // Proxy configuration settings
  proxyHost?: string;
  proxyPort?: string;
  proxyUser?: string;
  proxyPass?: string;
}

export interface OnboardingStepState {
  step: OnboardingStep;
  title: string;
  description: string;
  isValid: boolean;
}

export const ONBOARDING_WIZARD_STEPS: OnboardingStepState[] = [
  {
    step: 'CREDENTIALS',
    title: 'OnlyFans Credentials',
    description: 'Provide auth details and session cookies from your browser session.',
    isValid: false,
  },
  {
    step: 'PROXY',
    title: 'Dedicated Proxy Configuration',
    description: 'Configure clean proxy tunnels to ensure account safety during operator shifts.',
    isValid: true, // Optional step
  },
  {
    step: 'TEST_CONNECTION',
    title: 'Verify Integration Connectivity',
    description: 'Execute mock handshakes and connection diagnostics for authentication checks.',
    isValid: false,
  },
  {
    step: 'CONFIRMATION',
    title: 'Onboarding Complete',
    description: 'Creator account successfully integrated into your agency directory.',
    isValid: true,
  },
];
