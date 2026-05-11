import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void dismissSoftKeyboard(BuildContext context) {
  FocusManager.instance.primaryFocus?.unfocus();
  FocusScope.of(context).unfocus();
  SystemChannels.textInput.invokeMethod<void>('TextInput.hide');
}
