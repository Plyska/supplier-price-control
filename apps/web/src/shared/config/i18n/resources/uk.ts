export const uk = {
  common: {
    common: {
      brand: 'Контроль цін',
    },
    navigation: {
      primaryAriaLabel: 'Основна навігація',
      dashboard: 'Огляд',
      suppliers: 'Постачальники',
    },
    languageSwitcher: {
      ariaLabel: 'Вибір мови інтерфейсу',
      label: 'Мова інтерфейсу',
      ukrainian: 'Українська',
      ukrainianShort: 'УКР',
      english: 'English',
      englishShort: 'EN',
    },
    dashboard: {
      eyebrow: 'Контроль цін постачальників',
      title:
        'Побачте зміни цін постачальників до того, як вони вплинуть на маржу.',
      description:
        'Завантажуйте прайси, зіставляйте товари постачальників і перевіряйте важливі зміни в одному робочому просторі.',
      stats: {
        suppliers: 'Постачальники',
        priceLists: 'Прайси',
        itemsChanged: 'Змінені позиції',
      },
    },
    notFound: {
      title: 'Сторінку не знайдено',
      description: 'Запитаної сторінки не існує.',
      backToDashboard: 'Повернутися до огляду',
    },
  },
  suppliers: {
    eyebrow: 'Налаштування каталогу',
    title: 'Постачальники',
    description:
      'Додайте постачальника та збережіть відповідність його колонок, щоб повторні імпорти прайсів займали менше часу.',
    empty: {
      title: 'Постачальників ще немає',
      description:
        'Додавання постачальників буде реалізовано на наступному етапі продукту.',
    },
  },
} as const
