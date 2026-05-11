import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

const kPrivacyPolicyUrl = String.fromEnvironment(
  'PASEO_PRIVACY_POLICY_URL',
  defaultValue: '',
);
const kTermsOfUseUrl = String.fromEnvironment(
  'PASEO_TERMS_OF_USE_URL',
  defaultValue: '',
);

const _legacyLegalConsentKey = 'mcoding_legal_consent_v1';
const _legalConsentKey = 'paseo_legal_consent_v1';

class LegalService {
  static Future<bool> hasAcceptedLatestTerms() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_legalConsentKey) ?? false) {
      return true;
    }
    final legacyAccepted = prefs.getBool(_legacyLegalConsentKey) ?? false;
    if (legacyAccepted) {
      await prefs.setBool(_legalConsentKey, true);
      await prefs.remove(_legacyLegalConsentKey);
      return true;
    }
    return false;
  }

  static Future<void> acceptLatestTerms() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_legalConsentKey, true);
  }

  static Future<bool> openPrivacyPolicy() => _openUrl(kPrivacyPolicyUrl);

  static Future<bool> openTermsOfUse() => _openUrl(kTermsOfUseUrl);

  static Future<bool> _openUrl(String value) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return false;
    }
    final uri = Uri.parse(trimmed);
    if (await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      return true;
    }
    return launchUrl(uri, mode: LaunchMode.platformDefault);
  }
}
