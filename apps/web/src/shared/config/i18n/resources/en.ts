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
      apiStatus: {
        title: 'API connection',
        loading: 'Checking server availability…',
        online: 'The server is available and ready for requests.',
        error: 'Could not connect to the server.',
        retry: 'Try again',
        retrying: 'Checking again…',
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
  },
} as const
