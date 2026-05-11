import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:intl/intl.dart';

import '../l10n_ext.dart';
import '../models/subscription_plan.dart';
import '../providers/auth_provider.dart';
import '../providers/subscription_plan_provider.dart';
import '../services/auth_service.dart';
import '../services/legal_service.dart';
import '../theme.dart';
import '../widgets/app_snack_bar.dart';

const _appleSubscriptionProductIds = String.fromEnvironment(
  'APPLE_SUBSCRIPTION_PRODUCT_IDS',
  defaultValue: 'month,year',
);

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  final InAppPurchase _inAppPurchase = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSubscription;

  bool _purchasePending = false;
  bool _restorePending = false;
  bool _productsLoading = false;
  String? _pendingPlanId;
  String? _error;
  List<ProductDetails> _products = const [];

  List<String> get _productIds => _appleSubscriptionProductIds
      .split(',')
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList();

  bool get _supportsAppleSubscription =>
      !kIsWeb && (Platform.isIOS || Platform.isMacOS);

  bool get _isAndroid => !kIsWeb && Platform.isAndroid;

  @override
  void initState() {
    super.initState();
    _purchaseSubscription = _inAppPurchase.purchaseStream.listen(
      _handlePurchaseUpdates,
      onError: (Object error) {
        if (!mounted) return;
        setState(() {
          _purchasePending = false;
          _restorePending = false;
          _pendingPlanId = null;
          _error = error.toString();
        });
      },
    );
    unawaited(_loadProducts());
  }

  @override
  void dispose() {
    _purchaseSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    if (!_supportsAppleSubscription) return;

    try {
      if (mounted) {
        setState(() {
          _productsLoading = true;
          _error = null;
        });
      }
      final available = await _inAppPurchase.isAvailable();
      if (!mounted) return;
      if (!available) {
        setState(() {
          _productsLoading = false;
          _products = const [];
        });
        return;
      }

      final plansAsync = ref.read(subscriptionPlansProvider);
      final plans = plansAsync.valueOrNull ?? [];
      final appleIds = plans
          .where(
            (p) => p.appleProductId != null && p.appleProductId!.isNotEmpty,
          )
          .map((p) => p.appleProductId!)
          .toSet();

      final idsToQuery = appleIds.isNotEmpty ? appleIds : _productIds.toSet();

      final response = await _inAppPurchase.queryProductDetails(idsToQuery);
      if (!mounted) return;
      setState(() {
        _productsLoading = false;
        _products = response.productDetails.toList()
          ..sort((a, b) => a.rawPrice.compareTo(b.rawPrice));
        _error = response.error?.message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _productsLoading = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _buyAppleProduct(ProductDetails product) async {
    final purchaseParam = PurchaseParam(productDetails: product);
    setState(() {
      _purchasePending = true;
      _error = null;
    });
    try {
      final started = await _inAppPurchase.buyNonConsumable(
        purchaseParam: purchaseParam,
      );
      if (!started && mounted) {
        setState(() {
          _purchasePending = false;
          _pendingPlanId = null;
        });
        AppSnackBar.showError(context, context.l10n.subscriptionStartFailed);
      }
    } on PlatformException catch (error) {
      if (error.code == 'storekit_duplicate_product_object') {
        if (mounted) {
          setState(() {
            _purchasePending = false;
            _pendingPlanId = null;
          });
          AppSnackBar.showWarning(context, '检测到未完成购买，正在恢复购买');
        }
        await _restorePurchases();
        return;
      }

      if (mounted) {
        setState(() {
          _purchasePending = false;
          _pendingPlanId = null;
          _error = error.message ?? context.l10n.subscriptionStartFailed;
        });
        AppSnackBar.showError(
          context,
          error.message ?? context.l10n.subscriptionStartFailed,
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _purchasePending = false;
          _pendingPlanId = null;
        });
        AppSnackBar.showError(context, context.l10n.subscriptionStartFailed);
      }
    }
  }

  Future<void> _buyPlan(SubscriptionPlan plan) async {
    setState(() {
      _pendingPlanId = plan.id;
      _error = null;
    });

    if (_supportsAppleSubscription && plan.appleProductId != null) {
      final product = _products
          .where((p) => p.id == plan.appleProductId)
          .firstOrNull;
      if (product != null) {
        await _buyAppleProduct(product);
        return;
      }
    }

    if (_isAndroid) {
      setState(() {
        _purchasePending = true;
        _error = null;
      });
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return;
      setState(() {
        _purchasePending = false;
        _pendingPlanId = null;
      });
      AppSnackBar.showWarning(context, 'Android 支付即将上线，敬请期待');
      return;
    }

    if (mounted) {
      setState(() => _pendingPlanId = null);
    }
    AppSnackBar.showWarning(context, context.l10n.subscriptionOnlyOnApple);
  }

  Future<void> _restorePurchases() async {
    setState(() {
      _restorePending = true;
      _error = null;
    });
    await _inAppPurchase.restorePurchases();
  }

  Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      switch (purchase.status) {
        case PurchaseStatus.pending:
          if (mounted) setState(() => _purchasePending = true);
          break;
        case PurchaseStatus.error:
          if (mounted) {
            final message =
                purchase.error?.message ?? context.l10n.purchaseFailed;
            setState(() {
              _purchasePending = false;
              _restorePending = false;
              _pendingPlanId = null;
              _error = message;
            });
            AppSnackBar.showError(context, message);
          }
          if (purchase.pendingCompletePurchase) {
            await _inAppPurchase.completePurchase(purchase);
          }
          break;
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          await _verifyPurchase(purchase);
          break;
        case PurchaseStatus.canceled:
          if (mounted) {
            setState(() {
              _purchasePending = false;
              _restorePending = false;
              _pendingPlanId = null;
            });
            AppSnackBar.showWarning(context, context.l10n.purchaseCanceled);
          }
          if (purchase.pendingCompletePurchase) {
            await _inAppPurchase.completePurchase(purchase);
          }
          break;
      }
    }
  }

  Future<void> _verifyPurchase(PurchaseDetails purchase) async {
    final token = ref.read(authProvider).token;
    if (token == null) {
      if (purchase.pendingCompletePurchase) {
        await _inAppPurchase.completePurchase(purchase);
      }
      return;
    }

    try {
      final user = await ref
          .read(authServiceProvider)
          .verifyAppleSubscription(
            token: token,
            productId: purchase.productID,
            receiptData: purchase.verificationData.serverVerificationData,
            transactionId: purchase.purchaseID,
          );
      await ref.read(authProvider.notifier).updateUser(user);
      if (!mounted) return;
      setState(() {
        _purchasePending = false;
        _restorePending = false;
        _pendingPlanId = null;
      });
      AppSnackBar.showSuccess(context, context.l10n.subscriptionActivated);
    } catch (_) {
      if (mounted) {
        setState(() {
          _purchasePending = false;
          _restorePending = false;
          _pendingPlanId = null;
          _error = context.l10n.subscriptionVerifyFailed;
        });
        AppSnackBar.showError(context, context.l10n.subscriptionVerifyFailed);
      }
    } finally {
      if (purchase.pendingCompletePurchase) {
        await _inAppPurchase.completePurchase(purchase);
      }
    }
  }

  String _membershipLabel(AuthUser? user, BuildContext context) {
    if (user?.isMember == true) return context.l10n.memberUser;
    return context.l10n.freeUser;
  }

  String? _expiryLabel(AuthUser? user) {
    final expiresAt = user?.subscriptionExpiresAt;
    if (expiresAt == null || expiresAt.isEmpty) return null;
    final parsed = DateTime.tryParse(expiresAt);
    if (parsed == null) return expiresAt;
    return DateFormat('yyyy-MM-dd HH:mm').format(parsed.toLocal());
  }

  ProductDetails? _productForPlan(SubscriptionPlan plan) {
    if (plan.appleProductId == null) return null;
    return _products.where((p) => p.id == plan.appleProductId).firstOrNull;
  }

  List<String> _currentBenefits(AuthUser? user) {
    if (user?.isMember == true) {
      return const ['无限主机设备', '每天 100 次语音'];
    }
    return const ['限 1 台主机', '每天 5 次语音'];
  }

  String _planTypeFromProductId(String productId) {
    final normalized = productId.toLowerCase();
    if (normalized.contains('week')) return 'weekly';
    if (normalized.contains('month')) return 'monthly';
    if (normalized.contains('quarter')) return 'quarterly';
    if (normalized.contains('year') || normalized.contains('annual')) {
      return 'yearly';
    }
    return 'custom';
  }

  int _durationDaysForPlanType(String planType) {
    switch (planType) {
      case 'weekly':
        return 7;
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'yearly':
        return 365;
      default:
        return 30;
    }
  }

  SubscriptionPlan _planFromProduct(
    ProductDetails product, {
    SubscriptionPlan? template,
  }) {
    final planType = template?.planType ?? _planTypeFromProductId(product.id);
    return SubscriptionPlan(
      id: template?.id ?? product.id,
      name: template?.name ?? product.title,
      planType: planType,
      durationDays:
          template?.durationDays ?? _durationDaysForPlanType(planType),
      price: product.rawPrice,
      currency: product.currencyCode,
      appleProductId: product.id,
      description: template?.description,
      features: template?.features,
      sortOrder: template?.sortOrder ?? 0,
      status: template?.status ?? 'active',
      maxDevices: template?.maxDevices ?? -1,
      dailyVoiceLimit: template?.dailyVoiceLimit ?? -1,
      highlighted: template?.highlighted ?? false,
      createdAt: template?.createdAt,
      updatedAt: template?.updatedAt,
    );
  }

  List<SubscriptionPlan> _plansForDisplay(List<SubscriptionPlan> plans) {
    if (!_supportsAppleSubscription) return plans;
    if (_products.isEmpty) return const [];

    final nonApplePlans = plans
        .where(
          (plan) => plan.appleProductId == null || plan.appleProductId!.isEmpty,
        )
        .toList();
    final planByProductId = <String, SubscriptionPlan>{
      for (final plan in plans)
        if (plan.appleProductId != null && plan.appleProductId!.isNotEmpty)
          plan.appleProductId!: plan,
    };

    return [
      ...nonApplePlans,
      ..._products.map(
        (product) =>
            _planFromProduct(product, template: planByProductId[product.id]),
      ),
    ];
  }

  bool _isCurrentPlan(SubscriptionPlan plan, AuthUser? user) {
    if (plan.id == 'free') return user?.isMember != true;
    if (user?.isMember != true) return false;
    if (user?.subscriptionProductId != null &&
        plan.appleProductId == user?.subscriptionProductId) {
      return true;
    }
    return false;
  }

  Widget _buildPlanCard(
    SubscriptionPlan plan,
    ThemeData theme,
    AuthUser? user,
  ) {
    final isCurrent = _isCurrentPlan(plan, user);
    final appleProduct = _productForPlan(plan);
    final displayPrice = appleProduct?.price ?? plan.priceLabel;
    final displayTitle = appleProduct?.title ?? plan.name;
    final displayDescription =
        appleProduct?.description ?? plan.description ?? plan.planTypeLabel;
    final isFreePlan = plan.id == 'free';
    final canTapPlan = !isCurrent && !isFreePlan && !_purchasePending;
    final isPlanPending = _purchasePending && _pendingPlanId == plan.id;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isCurrent
                ? theme.colorScheme.primary
                : plan.highlighted
                ? theme.colorScheme.primary.withValues(alpha: 0.5)
                : theme.colorScheme.outline.withValues(alpha: 0.22),
            width: isCurrent
                ? 2
                : plan.highlighted
                ? 1.5
                : 1,
          ),
          color: plan.highlighted && !isCurrent
              ? theme.colorScheme.primaryContainer.withValues(alpha: 0.08)
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    displayTitle,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (plan.highlighted && !isCurrent) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '推荐',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                ],
                if (isCurrent) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '当前套餐',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 6),
            Text(
              displayDescription,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (plan.features != null && plan.features!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: plan.features!.map((feat) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer.withValues(
                        alpha: 0.3,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      feat,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  displayPrice,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '/ ${plan.durationLabel}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                if (isCurrent || isFreePlan)
                  const SizedBox.shrink()
                else
                  FilledButton(
                    onPressed: canTapPlan ? () => _buyPlan(plan) : null,
                    child: isPlanPending
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            user?.isMember == true
                                ? context.l10n.renewSubscription
                                : context.l10n.activateSubscription,
                          ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = ref.watch(authProvider).user;
    final plansAsync = ref.watch(subscriptionPlansProvider);
    final expiresLabel = _expiryLabel(user);

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.subscriptionCenter)),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(subscriptionPlansProvider.notifier).refresh();
          await _loadProducts();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.12)),
              ),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.currentMembership,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(
                          user?.isMember == true
                              ? Icons.workspace_premium
                              : Icons.person_outline,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _membershipLabel(user, context),
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _currentBenefits(user).map((benefit) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer
                                .withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            benefit,
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    if (expiresLabel != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        '${context.l10n.subscriptionExpiresAt}: $expiresLabel',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ],
                ),
            ),
            const SizedBox(height: 16),
            plansAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        '加载套餐失败: $error',
                        style: TextStyle(color: theme.colorScheme.error),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () => ref
                            .read(subscriptionPlansProvider.notifier)
                            .refresh(),
                        child: Text(context.l10n.retry),
                      ),
                    ],
                  ),
                ),
              ),
              data: (plans) {
                final displayPlans = _plansForDisplay(plans);

                if (_supportsAppleSubscription && _productsLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (displayPlans.isEmpty) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        context.l10n.subscriptionProductsUnavailable,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ...displayPlans.map(
                      (plan) => _buildPlanCard(plan, theme, user),
                    ),
                    if (_supportsAppleSubscription) ...[
                      const SizedBox(height: 8),
                      Text(
                        context.l10n.subscriptionLegalNotice,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          OutlinedButton(
                            onPressed: _restorePending
                                ? null
                                : _restorePurchases,
                            child: Text(context.l10n.restorePurchases),
                          ),
                          const SizedBox(width: 12),
                          TextButton(
                            onPressed: _loadProducts,
                            child: Text(context.l10n.refresh),
                          ),
                        ],
                      ),
                      Wrap(
                        spacing: 8,
                        children: [
                          TextButton(
                            onPressed: LegalService.openPrivacyPolicy,
                            child: Text(context.l10n.privacyPolicy),
                          ),
                          TextButton(
                            onPressed: LegalService.openTermsOfUse,
                            child: Text(context.l10n.termsOfUse),
                          ),
                        ],
                      ),
                    ],
                  ],
                );
              },
            ),
            if (_purchasePending || _restorePending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _restorePending
                          ? context.l10n.restoringPurchases
                          : context.l10n.subscriptionProcessing,
                    ),
                  ),
                ],
              ),
            ],
            if (_error != null && _error!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
          ],
        ),
      ),
    );
  }
}
