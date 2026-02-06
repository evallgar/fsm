import { Locale, format, formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import i18next from 'i18next';

// Type for our locale map
type LocaleMap = {
  [key: string]: Locale;
};

// Map of language codes to date-fns locales
const localeMap: LocaleMap = {
  en: enUS,
  es: es,
  // Add more locales as needed
};

// Current locale instance that will be used throughout the app
let currentLocale: Locale = localeMap.en;

/**
 * Normalizes a language code by removing country suffix
 * e.g., 'en-US' -> 'en', 'es-MX' -> 'es'
 */
const normalizeLanguageCode = (code: string): string => {
  // If the code contains a hyphen, take only the first part
  return code.split('-')[0];
};

/**
 * Updates the current date-fns locale based on i18n language
 * This should be called whenever the i18n language changes
 */
export const updateDateFnsLocale = (languageCode?: string): void => {
  // Use provided language or get from i18next
  const fullLocaleCode = languageCode || i18next.language || 'en';
  
  // Normalize the locale code to remove country suffix
  const normalizedCode = normalizeLanguageCode(fullLocaleCode);
  
  // Get the locale from our map or fall back to English
  const selectedLocale = localeMap[normalizedCode];
  
  if (selectedLocale) {
    currentLocale = selectedLocale;
    console.log(`Locale updated: ${fullLocaleCode} → ${normalizedCode} (Found in map)`);
  } else {
    currentLocale = localeMap.en;
    console.log(`Locale updated: ${fullLocaleCode} → ${normalizedCode} (Not found, using English)`);
  }
  
  // Debug info
  console.log('Available locales:', Object.keys(localeMap));
  console.log('Selected locale code:', normalizedCode);
  console.log('Is locale in map?', normalizedCode in localeMap);
};

/**
 * Gets the current date-fns locale
 * This should be used in all date-fns formatting functions
 */
export const getDateFnsLocale = (): Locale => {
  return currentLocale;
};

// Export available locales for reference
export const availableLocales = Object.keys(localeMap);

// Initialize with i18n language if available
if (i18next.language) {
  updateDateFnsLocale(i18next.language);
} else {
  // Default to 'en' if no language is set
  updateDateFnsLocale('en');
}

/**
 * Typed format function that automatically uses the current locale
 * with proper error handling
 */
export const formatDate = (date: Date | number, formatStr: string): string => {
  try {
    // Use the locale directly - date-fns knows how to handle it
    return format(date, formatStr, { locale: currentLocale });
  } catch (error) {
    console.warn('Error formatting date with locale, falling back to default:', error);
    // Fall back to default formatting without locale
    console.log('current locale: ', currentLocale, 'i18n language: ', i18next.language);
    return format(date, formatStr);
  }
};

export const formatDistanceToNowMethod = (date: Date | number): string => {
  try {
    // Use the locale directly - date-fns knows how to handle it
    return formatDistanceToNow(date, { locale: currentLocale });
  } catch (error) {
    console.warn('Error formatting date with locale, falling back to default:', error);
    // Fall back to default formatting without locale
    console.log('current locale: ', currentLocale, 'i18n language: ', i18next.language);
    return formatDistanceToNow(date);
  }
};