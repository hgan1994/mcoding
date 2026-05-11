import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/subscription_plan.dart';
import 'auth_provider.dart';

const _appleCatalogPlans = [
  SubscriptionPlan(
    id: 'free',
    name: '免费用户',
    planType: 'custom',
    durationDays: 0,
    price: 0,
    currency: 'CNY',
    description: '适合轻度使用',
    features: ['限 1 台主机', '每天 5 次语音'],
    sortOrder: 0,
    status: 'active',
    maxDevices: 1,
    dailyVoiceLimit: 5,
    highlighted: false,
  ),
  SubscriptionPlan(
    id: 'monthly',
    name: '月度会员',
    planType: 'monthly',
    durationDays: 30,
    price: 0,
    currency: 'CNY',
    appleProductId: 'month',
    description: '按月续费',
    features: ['无限主机设备', '每天 100 次语音'],
    sortOrder: 1,
    status: 'active',
    maxDevices: -1,
    dailyVoiceLimit: 100,
    highlighted: false,
  ),
  SubscriptionPlan(
    id: 'yearly',
    name: '年度会员',
    planType: 'yearly',
    durationDays: 365,
    price: 0,
    currency: 'CNY',
    appleProductId: 'year',
    description: '按年续费，更划算',
    features: ['无限主机设备', '每天 100 次语音'],
    sortOrder: 2,
    status: 'active',
    maxDevices: -1,
    dailyVoiceLimit: 100,
    highlighted: true,
  ),
];

const _fallbackPlans = [
  SubscriptionPlan(
    id: 'free',
    name: '免费会员',
    planType: 'custom',
    durationDays: 0,
    price: 0,
    currency: 'CNY',
    description: '基础功能，适合轻度使用',
    features: ['限 1 台主机', '每天 5 次语音'],
    sortOrder: 0,
    status: 'active',
    maxDevices: 1,
    dailyVoiceLimit: 5,
    highlighted: false,
  ),
  SubscriptionPlan(
    id: 'monthly',
    name: '月度会员',
    planType: 'monthly',
    durationDays: 30,
    price: 6,
    currency: 'CNY',
    appleProductId: 'month',
    description: '按月续费',
    features: ['无限主机设备', '每天 100 次语音'],
    sortOrder: 1,
    status: 'active',
    maxDevices: -1,
    dailyVoiceLimit: 100,
    highlighted: false,
  ),
  SubscriptionPlan(
    id: 'yearly',
    name: '年度会员',
    planType: 'yearly',
    durationDays: 365,
    price: 55,
    currency: 'CNY',
    appleProductId: 'year',
    description: '按年续费，更划算',
    features: ['无限主机设备', '每天 100 次语音'],
    sortOrder: 2,
    status: 'active',
    maxDevices: -1,
    dailyVoiceLimit: 100,
    highlighted: true,
  ),
];

final subscriptionPlansProvider =
    AsyncNotifierProvider<SubscriptionPlansNotifier, List<SubscriptionPlan>>(
  SubscriptionPlansNotifier.new,
);

class SubscriptionPlansNotifier extends AsyncNotifier<List<SubscriptionPlan>> {
  bool get _usesStoreKitCatalog =>
      !kIsWeb && (Platform.isIOS || Platform.isMacOS);

  @override
  Future<List<SubscriptionPlan>> build() async {
    if (_usesStoreKitCatalog) return _appleCatalogPlans;
    try {
      final authService = ref.watch(authServiceProvider);
      final plans = await authService.fetchSubscriptionPlans();
      if (plans.isNotEmpty) return plans;
    } catch (_) {}
    return _fallbackPlans;
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      if (_usesStoreKitCatalog) return _appleCatalogPlans;
      try {
        final authService = ref.read(authServiceProvider);
        final plans = await authService.fetchSubscriptionPlans();
        if (plans.isNotEmpty) return plans;
      } catch (_) {}
      return _fallbackPlans;
    });
  }
}
