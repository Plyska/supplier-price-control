export const en = {
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
