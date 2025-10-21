export const translations = {
  en: {
    // Page titles and headers
    activationKeys: "Activation Keys",
    manageActivationKeys: "Manage activation keys for product variants",
    
    // Table headers
    key: "Key",
    product: "Product",
    variant: "Variant",
    sku: "SKU",
    status: "Status",
    created: "Created",
    
    // Status values
    used: "Used",
    available: "Available",
    
    // Actions
    bulkImport: "Bulk Import",
    addKey: "Add Key",
    cancel: "Cancel",
    delete: "Delete",
    
    // Drawers
    addActivationKey: "Add Activation Key",
    bulkImportActivationKeys: "Bulk Import Activation Keys",
    
    // Form labels
    productVariant: "Product Variant",
    activationKey: "Activation Key",
    
    // Placeholders
    searchProductVariant: "Search for a product variant...",
    enterActivationKey: "Enter activation key",
    searchProductsAndVariants: "Search products and variants...",
    
    // Messages
    loadingActivationKeys: "Loading activation keys...",
    noActivationKeysFound: "No activation keys found. Add your first key to get started.",
    activationKeyDeletedSuccessfully: "Activation key deleted successfully",
    activationKeyAddedSuccessfully: "Activation key added successfully",
    pleaseSelectVariantAndEnterKey: "Please select a variant and enter a key",
    adding: "Adding...",
    searchingVariants: "Searching variants...",
    noVariantsFound: "No variants found.",
    
    // Confirmations
    confirmDeleteActivationKey: "Are you sure you want to delete this activation key?",
    
    // Error messages
    failedToLoadActivationKeys: "Failed to load activation keys",
    failedToDeleteActivationKey: "Failed to delete activation key",
    failedToAddActivationKey: "Failed to add activation key",
    
    // Fallback values
    unknownProduct: "Unknown Product",
    defaultVariant: "Default",
  },
  ru: {
    // Page titles and headers
    activationKeys: "Ключи активации",
    manageActivationKeys: "Управление ключами активации для вариантов товаров",
    
    // Table headers
    key: "Ключ",
    product: "Товар",
    variant: "Вариант",
    sku: "Артикул",
    status: "Статус",
    created: "Создан",
    
    // Status values
    used: "Использован",
    available: "Доступен",
    
    // Actions
    bulkImport: "Массовый импорт",
    addKey: "Добавить ключ",
    cancel: "Отмена",
    delete: "Удалить",
    
    // Drawers
    addActivationKey: "Добавить ключ активации",
    bulkImportActivationKeys: "Массовый импорт ключей активации",
    
    // Form labels
    productVariant: "Вариант товара",
    activationKey: "Ключ активации",
    
    // Placeholders
    searchProductVariant: "Поиск варианта товара...",
    enterActivationKey: "Введите ключ активации",
    searchProductsAndVariants: "Поиск товаров и вариантов...",
    
    // Messages
    loadingActivationKeys: "Загрузка ключей активации...",
    noActivationKeysFound: "Ключи активации не найдены. Добавьте первый ключ для начала работы.",
    activationKeyDeletedSuccessfully: "Ключ активации успешно удален",
    activationKeyAddedSuccessfully: "Ключ активации успешно добавлен",
    pleaseSelectVariantAndEnterKey: "Пожалуйста, выберите вариант и введите ключ",
    adding: "Добавление...",
    searchingVariants: "Поиск вариантов...",
    noVariantsFound: "Варианты не найдены.",
    
    // Confirmations
    confirmDeleteActivationKey: "Вы уверены, что хотите удалить этот ключ активации?",
    
    // Error messages
    failedToLoadActivationKeys: "Не удалось загрузить ключи активации",
    failedToDeleteActivationKey: "Не удалось удалить ключ активации",
    failedToAddActivationKey: "Не удалось добавить ключ активации",
    
    // Fallback values
    unknownProduct: "Неизвестный товар",
    defaultVariant: "По умолчанию",
  }
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Language = keyof typeof translations;

// Simple translation hook
export const useTranslation = (language: Language = 'en') => {
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key];
  };

  return { t };
};

// Get browser language preference
export const getBrowserLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ru')) {
      return 'ru';
    }
  }
  return 'en';
};