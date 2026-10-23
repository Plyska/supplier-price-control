export const en = {
  auth: {
    title: 'Sign in', description: 'Pilot access is available for approved accounts. Enter your email to receive a sign-in link.',
    email: 'Email', send: 'Send sign-in link', working: 'Please wait…',
    sent: 'If this email has pilot access, a sign-in link is on its way. Check your inbox and spam folder. The link is valid for 10 minutes.',
    confirmTitle: 'Confirm sign-in', confirmDescription: 'Continue to open your workspace on this device.', confirm: 'Continue',
    requestAnother: 'Request another link', invalidLink: 'This link is invalid, expired or already used. Request another link.',
    unavailable: 'The service is unavailable. Check your connection and try again.', rateLimited: 'Too many attempts. Please wait a minute and try again.',
    loading: 'Checking access…', retry: 'Try again', logout: 'Sign out',
    expiredSession: 'Your session has ended. Sign in again to continue.',
    organizations: 'Organizations', createOrganization: 'Create organization', name: 'Name', timeZone: 'Time zone (optional)',
    save: 'Save', settings: 'Organization settings', noAccess: 'You have no accessible organizations. Create one or contact your organization owner.',
    choose: 'Choose an organization', invalidOrganization: 'Check the name and IANA time zone, for example Europe/Prague.',
    forbidden: 'This organization is unavailable or you no longer have permission. Return to your organization list.', back: 'Back to organizations',
  },
  common: {
    common: {
      brand: 'Price Control',
    },
    navigation: {
      primaryAriaLabel: 'Primary navigation',
      dashboard: 'Dashboard',
      suppliers: 'Suppliers',
    },
    languageSwitcher: {
      ariaLabel: 'Select interface language',
      label: 'Interface language',
      ukrainian: 'Українська',
      ukrainianShort: 'УКР',
      english: 'English',
      englishShort: 'EN',
    },
    dashboard: {
      eyebrow: 'Supplier price control',
      title: 'See supplier price changes before they affect your margin.',
      description:
        'Upload price lists, map supplier products, and review every important change from one workspace.',
      stats: {
        suppliers: 'Suppliers',
        priceLists: 'Price lists',
        itemsChanged: 'Items changed',
      },
    },
    notFound: {
      title: 'Page not found',
      description: 'The page you requested does not exist.',
      backToDashboard: 'Back to dashboard',
    },
  },
  suppliers: {
    eyebrow: 'Catalog setup',
    title: 'Suppliers',
    description:
      'Add a supplier and save its column mapping to make future price-list imports repeatable.',
    empty: {
      title: 'No suppliers yet',
      description:
        'Supplier onboarding will be implemented in the next product stage.',
    },
    loading: {
      ariaLabel: 'Loading suppliers',
    },
    error: {
      title: 'Could not load suppliers',
      description:
        'Check your connection and try to retrieve the list again.',
      retry: 'Try again',
    },
    populated: {
      summary: 'Suppliers shown: {{count}}',
      syntheticBadge: 'Synthetic data',
    },
    card: {
      subtitle: 'Supplier profile',
      priceLists: 'Price lists',
      products: 'Catalog products',
      latestPriceList: 'Latest effective price list',
      noPriceList: 'No price lists yet',
    },
  },
  validation: {
    invalid: 'Check this field value.',
    invalidDate: 'Enter a valid date.',
    invalidEmail: 'Enter a valid email address.',
    required: 'This field is required.',
    tooLong: 'This value is too long.',
    tooShort: 'This value is too short.',
  },
} as const
