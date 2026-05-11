import 'package:flutter/material.dart';
import '../l10n_gen/app_localizations.dart';

export '../l10n_gen/app_localizations.dart';

extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this)!;
}
