/**
 * UI chrome translations only (nav, headers, footers, auth forms) - course
 * and lesson content stays English. Twi and Nigerian Pidgin strings are
 * best-effort drafts, not verified by a native speaker; treat this as a
 * first pass that should get a native-speaker review before shipping as a
 * finished, production-quality translation.
 */

export const translations = {
  en: {
    tagline: 'AI-Powered Education & Career Ecosystem',
    loading: 'Loading...',
    needAccountRegister: 'Need an account? Register',
    alreadyHaveAccountLogin: 'Already have an account? Login',
    changeCountry: 'Change country',
    copyright: '© 2026 Pathway AI',
    student: 'Student',
    admin: 'Admin',
    logout: 'Logout',

    // Nav
    navHome: 'Home',
    navLearn: 'Learn',
    navExplore: 'Explore',
    navPractice: 'Practice',
    navPlan: 'Plan',
    navProfile: 'Profile',
    navCommunity: 'Community',
    navAdmin: 'Admin',
    navSchoolAdmin: 'School Admin',
    navImpact: 'Impact',

    // Login
    welcomeBack: 'Welcome Back',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    loginFailed: 'Login failed',
    loginFailedRetry: 'Login failed. Please try again.',

    // Register
    createAccount: 'Create Account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your Full Name',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: '•••••••• (min 6 characters)',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    register: 'Register',
    creatingAccount: 'Creating account...',
    goToLoginNow: 'Go to Login Now',
    registrationSuccessful: '✅ Registration Successful!',
    registrationSuccessfulBody: 'Your account has been created. Redirecting to login...',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    selectCountryFirst: 'Please select your country first.',
    registrationFailed: 'Registration failed',
    registrationFailedRetry: 'Registration failed. Please try again.',
    consentStatementBeforeLink: "I confirm I am at least 13 years old, and if I am under 18, I have my parent or guardian's permission to create this account. I agree to the",
    privacyPolicyLinkText: 'Privacy Policy',
    consentStatementAfterLink: '.',
    consentRequired: 'You must confirm the age/consent statement to continue',
    guardianEmailLabel: 'Parent/Guardian email',
    guardianEmailPlaceholder: 'parent@email.com',
    guardianEmailRequired: 'Please enter a parent or guardian email - we send a code there to confirm consent',
    guardianEmailMustDiffer: 'Guardian email must be different from your own email',
    consentBannerMessage: 'We sent a code to {email} to confirm parental consent.',
    consentBannerEnterCode: 'Enter code',
    consentBannerCodePlaceholder: '6-digit code',
    consentBannerVerify: 'Verify',
    consentBannerResend: 'Resend code',
    consentBannerVerified: 'Guardian email verified',
    consentBannerCodeSent: 'A new code has been sent.',

    // Country selector
    whereLearningFrom: 'Where are you learning from?',
    countrySelectorDescription: "We'll show you courses, careers, and universities relevant to your country.",
    moreCountriesComingSoon: 'More African countries coming soon.',

    // Language switcher
    language: 'Language',

    // Footer
    footerPrivacyPolicy: 'Privacy Policy',
  },
  tw: {
    tagline: 'AI a ɛboa Adesua ne Adwuma Ho Nhyehyɛe',
    loading: 'Ɛrekɔ so...',
    needAccountRegister: 'Wonni akontaabu? Kyerɛw wo din',
    alreadyHaveAccountLogin: 'Wowɔ akontaabu dedaw? Hyɛn mu',
    changeCountry: 'Sesa ɔman',
    copyright: '© 2026 Pathway AI',
    student: 'Osuani',
    admin: 'Sohwɛfoɔ',
    logout: 'Fi mu',

    // Nav
    navHome: 'Fie',
    navLearn: 'Sua',
    navExplore: 'Hwehwɛ mu',
    navPractice: 'Sɔ hwɛ',
    navPlan: 'Nhyehyɛe',
    navProfile: 'Wo ho nsɛm',
    navCommunity: 'Mpɔtam',
    navAdmin: 'Sohwɛfoɔ',
    navSchoolAdmin: 'Sukuu Sohwɛfoɔ',
    navImpact: 'Nkɛntɛnso',

    // Login
    welcomeBack: 'Akwaaba Bio',
    email: 'Email',
    password: 'Ahintasɛm',
    login: 'Hyɛn mu',
    loggingIn: 'Ɛrehyɛn mu...',
    loginFailed: 'Mu hyɛn anyɛ yie',
    loginFailedRetry: 'Mu hyɛn anyɛ yie. Yɛsrɛ wo sɔ hwɛ bio.',

    // Register
    createAccount: 'Yɛ Akontaabu',
    fullName: 'Din a Ɛkyerɛ Wo Nyinaa',
    fullNamePlaceholder: 'Wo Din Nyinaa',
    emailPlaceholder: 'wo@email.com',
    passwordPlaceholder: '•••••••• (nsusuwii 6 nea ɛkyɛn)',
    confirmPassword: 'Ti Mu Ahintasɛm',
    confirmPasswordPlaceholder: 'Ti mu wo ahintasɛm',
    register: 'Kyerɛw wo din',
    creatingAccount: 'Ɛreyɛ akontaabu...',
    goToLoginNow: 'Kɔ Hyɛn Mu Seesei',
    registrationSuccessful: '✅ Wɔ Kyerɛw Wo Din Yiye!',
    registrationSuccessfulBody: 'Wɔayɛ wo akontaabu. Yɛrekɔ wo hyɛn mu kwan so...',
    passwordsDoNotMatch: 'Ahintasɛm no nhyia',
    passwordTooShort: 'Ahintasɛm ho hia sɛ ɛyɛ nsusuwii 6 anaa nea ɛkyɛn',
    selectCountryFirst: 'Yɛsrɛ wo, paw wo ɔman kan.',
    registrationFailed: 'Wɔ kyerɛw din no anyɛ yie',
    registrationFailedRetry: 'Wɔ kyerɛw din no anyɛ yie. Yɛsrɛ wo sɔ hwɛ bio.',
    consentStatementBeforeLink: "Migye di sɛ madi mfeɛ 13 anaa ɛboro saa, na sɛ me mfeɛ nnu 18 a, m'awofo anaa me hwɛfoɔ apene sɛ menyɛ saa akontaabu yi. Migye",
    privacyPolicyLinkText: 'Privacy Policy',
    consentStatementAfterLink: ' no tom.',
    consentRequired: 'Ɛsɛ sɛ wugye saa asɛm yi tom ansa na woatoa so',
    guardianEmailLabel: "W'awofo anaa Hwɛfo Email",
    guardianEmailPlaceholder: 'awofo@email.com',
    guardianEmailRequired: "Yɛsrɛ sɛ fa w'awofo anaa hwɛfo email - yɛde koodu bɛkɔ hɔ akyerɛ sɛ wɔapene so",
    guardianEmailMustDiffer: "W'awofo email nsɛ sɛ ɛyɛ wo ara wo email",
    consentBannerMessage: 'Yɛde koodu kɔɔ {email} sɛ yɛnhwɛ sɛ awofo apene so.',
    consentBannerEnterCode: 'Fa koodu no hyɛ mu',
    consentBannerCodePlaceholder: 'Koodu a ɛyɛ nɔma 6',
    consentBannerVerify: 'Hwɛ sɛ ɛyɛ nokware',
    consentBannerResend: 'San soma koodu no bio',
    consentBannerVerified: "Wɔahwɛ w'awofo email sɛ ɛyɛ nokware",
    consentBannerCodeSent: 'Yɛasan de koodu foforo akɔ.',

    // Country selector
    whereLearningFrom: 'Ɛhe wo suasua fi?',
    countrySelectorDescription: 'Yɛbɛkyerɛ wo nsuadesua, adwuma, ne sukuu a ɛfata wo ɔman.',
    moreCountriesComingSoon: 'Aman foforo a ɛwɔ Afrika reba nnansa yi ara.',

    // Language switcher
    language: 'Kasa',

    // Footer
    footerPrivacyPolicy: 'Privacy Policy',
  },
  pcm: {
    tagline: 'AI Wey Dey Help Education and Career',
    loading: 'E Dey Load...',
    needAccountRegister: 'You no get account? Register',
    alreadyHaveAccountLogin: 'You don get account already? Login',
    changeCountry: 'Change country',
    copyright: '© 2026 Pathway AI',
    student: 'Student',
    admin: 'Admin',
    logout: 'Comot',

    // Nav
    navHome: 'Home',
    navLearn: 'Learn',
    navExplore: 'Explore',
    navPractice: 'Practice',
    navPlan: 'Plan',
    navProfile: 'Profile',
    navCommunity: 'Community',
    navAdmin: 'Admin',
    navSchoolAdmin: 'School Admin',
    navImpact: 'Impact',

    // Login
    welcomeBack: 'Welcome Back',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loggingIn: 'E Dey Login...',
    loginFailed: 'Login no work',
    loginFailedRetry: 'Login no work. Abeg try again.',

    // Register
    createAccount: 'Create Account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your Full Name',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: '•••••••• (no less pass 6 letters)',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    register: 'Register',
    creatingAccount: 'E Dey Create Account...',
    goToLoginNow: 'Go Login Now',
    registrationSuccessful: '✅ Registration Don Successful!',
    registrationSuccessfulBody: 'Dem don create your account. We dey take you go login...',
    passwordsDoNotMatch: 'Password no match',
    passwordTooShort: 'Password suppose reach 6 letters',
    selectCountryFirst: 'Abeg select your country first.',
    registrationFailed: 'Registration no work',
    registrationFailedRetry: 'Registration no work. Abeg try again.',
    consentStatementBeforeLink: 'I confirm say I don reach 13 years, and if I no reach 18, my parent or guardian don gree make I create this account. I agree to di',
    privacyPolicyLinkText: 'Privacy Policy',
    consentStatementAfterLink: '.',
    consentRequired: 'You must confirm di age/consent statement before you fit continue',
    guardianEmailLabel: 'Parent/Guardian email',
    guardianEmailPlaceholder: 'parent@email.com',
    guardianEmailRequired: 'Abeg enter parent or guardian email - we go send code go there to confirm consent',
    guardianEmailMustDiffer: 'Guardian email must different from your own email',
    consentBannerMessage: 'We don send code go {email} to confirm parental consent.',
    consentBannerEnterCode: 'Enter code',
    consentBannerCodePlaceholder: '6-digit code',
    consentBannerVerify: 'Verify',
    consentBannerResend: 'Resend code',
    consentBannerVerified: 'Guardian email don verify',
    consentBannerCodeSent: 'New code don send.',

    // Country selector
    whereLearningFrom: 'Where you dey learn from?',
    countrySelectorDescription: 'We go show you courses, career, and universities wey fit your country.',
    moreCountriesComingSoon: 'More African countries dey come soon.',

    // Language switcher
    language: 'Language',

    // Footer
    footerPrivacyPolicy: 'Privacy Policy',
  },
};

export const LANGUAGE_NAMES = {
  en: 'English',
  tw: 'Twi',
  pcm: 'Pidgin',
};

export function translate(language, key) {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}
