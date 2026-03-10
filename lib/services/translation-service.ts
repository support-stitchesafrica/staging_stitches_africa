import { loadFirebaseModule } from "@/lib/utils/module-helpers";
import { getFirebaseApp } from "@/lib/firebase";

/**
 * Model representing the response from Google Cloud Translation API
 * Based on: GoogleCloudTranslationModel from Dart project
 */
export interface GoogleCloudTranslationModel {
  translatedText: string;
}

/**
 * Service for translating text using Google Cloud Translation via Firebase Functions
 * Based on: TranslationService from Dart project
 */
export class TranslationService {
  /**
   * Translate text to a target language
   * @param text The text to translate
   * @param targetLanguage The target language code (e.g., 'en', 'fr')
   * @param sourceLanguage Optional source language code
   * @returns Promise resolving to a GoogleCloudTranslationModel
   */
  static async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<GoogleCloudTranslationModel> {
    try {
      // Load Firebase Functions module dynamically
      const functionsModule = await loadFirebaseModule(
        "firebase/functions",
        "translate_text"
      );
      
      const firebaseModule = await import("@/lib/firebase");
      const app = await firebaseModule.getFirebaseApp();
      const { getFunctions } = functionsModule;
      
      // Initialize functions
      // translateText is deployed in us-central1 (default)
      const functions = getFunctions(app, "us-central1");
      
      // Create callable
      const translateCallable = functionsModule.httpsCallable(
        functions,
        "translateText",
        { timeout: 30000 } // 30 seconds timeout matching Dart implementation
      );

      // Prepare payload
      const payload: any = {
        text,
        targetLanguage,
      };

      if (sourceLanguage) {
        payload.sourceLanguage = sourceLanguage;
      }

      // Call function
      const result = await translateCallable(payload);
      const data = result.data as any;

      // Parse result matching Dart's fromJson logic:
      // json["data"]["translations"][0]["translatedText"]
      // Note: result.data usually typically contains the return value of the function.
      // If the function returns { data: { translations: [...] } }, then we access it as such.
      // The Dart code parses `result.data`.
      
      // We'll assume the structure matches the Dart implementation's expectation
      const translatedText = data?.data?.translations?.[0]?.translatedText;

      if (!translatedText) {
        // Fallback or check if the structure is slightly different (e.g. direct return)
        // Adjust based on actual response if needed, but strict adherence to Dart model:
        if (data?.translations?.[0]?.translatedText) {
           return { translatedText: data.translations[0].translatedText };
        }
        throw new Error("Invalid response format from translation service");
      }

      return { translatedText };
      
    } catch (error: any) {
      if (error?.code) {
        // FirebaseFunctionsException equivalent
        throw new Error(`Translation failed: ${error.message}`);
      }
      throw new Error(`Unexpected error: ${error.message || error}`);
    }
  }
}
