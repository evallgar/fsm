import i18next from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDateFnsLocale } from './date-fns-config';

/**
 * Initialize i18n and date-fns locale
 * This should be called during app initialization
 */
export const initializeI18nAndDateFns = async (): Promise<void> => {
  try {
    // Get stored language from AsyncStorage
    const storedLanguage = await AsyncStorage.getItem('language');
    
    // If there's a stored language preference, use it
    if (storedLanguage) {
      // Set i18n language
      await i18next.changeLanguage(storedLanguage);
      console.log(`Initialized i18n with stored language: ${storedLanguage}`);
      
      // Sync date-fns locale with i18n
      updateDateFnsLocale(storedLanguage);
    } else {
      // Otherwise use the current i18n language
      const currentLang = i18next.language;
      console.log(`No stored language found, using current i18n language: ${currentLang}`);
      
      // Sync date-fns locale with i18n
      updateDateFnsLocale(currentLang);
    }
  } catch (error) {
    console.error('Error initializing i18n and date-fns:', error);
    // Fallback to default language
    updateDateFnsLocale('en');
  }
};
