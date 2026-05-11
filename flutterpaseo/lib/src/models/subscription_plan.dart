class SubscriptionPlan {
  final String id;
  final String name;
  final String planType;
  final int durationDays;
  final double price;
  final String currency;
  final String? appleProductId;
  final String? description;
  final List<String>? features;
  final int sortOrder;
  final String status;
  final int maxDevices;
  final int dailyVoiceLimit;
  final bool highlighted;
  final String? createdAt;
  final String? updatedAt;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.planType,
    required this.durationDays,
    required this.price,
    required this.currency,
    this.appleProductId,
    this.description,
    this.features,
    required this.sortOrder,
    required this.status,
    required this.maxDevices,
    required this.dailyVoiceLimit,
    required this.highlighted,
    this.createdAt,
    this.updatedAt,
  });

  bool get isActive => status == 'active';
  bool get isUnlimitedDevices => maxDevices == -1;
  bool get isUnlimitedVoice => dailyVoiceLimit == -1;

  String get durationLabel {
    if (durationDays >= 365 && durationDays % 365 == 0) {
      return '${durationDays ~/ 365}年';
    }
    if (durationDays >= 30 && durationDays % 30 == 0) {
      return '${durationDays ~/ 30}个月';
    }
    if (durationDays >= 7 && durationDays % 7 == 0) {
      return '${durationDays ~/ 7}周';
    }
    return '$durationDays天';
  }

  String get priceLabel {
    if (currency == 'CNY') return '¥${price.toStringAsFixed(price == price.roundToDouble() ? 0 : 2)}';
    return '$currency ${price.toStringAsFixed(2)}';
  }

  String get planTypeLabel {
    switch (planType) {
      case 'weekly':
        return '周卡';
      case 'monthly':
        return '月卡';
      case 'quarterly':
        return '季卡';
      case 'yearly':
        return '年卡';
      case 'custom':
        return '自定义';
      default:
        return planType;
    }
  }

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => SubscriptionPlan(
    id: json['id'] as String,
    name: json['name'] as String,
    planType: json['planType'] as String,
    durationDays: json['durationDays'] as int,
    price: (json['price'] as num).toDouble(),
    currency: (json['currency'] as String?) ?? 'CNY',
    appleProductId: json['appleProductId'] as String?,
    description: json['description'] as String?,
    features: (json['features'] as List<dynamic>?)?.cast<String>(),
    sortOrder: json['sortOrder'] as int? ?? 0,
    status: json['status'] as String? ?? 'active',
    maxDevices: json['maxDevices'] as int? ?? 1,
    dailyVoiceLimit: json['dailyVoiceLimit'] as int? ?? -1,
    highlighted: json['highlighted'] as bool? ?? false,
    createdAt: json['createdAt'] as String?,
    updatedAt: json['updatedAt'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'planType': planType,
    'durationDays': durationDays,
    'price': price,
    'currency': currency,
    'appleProductId': appleProductId,
    'description': description,
    'features': features,
    'sortOrder': sortOrder,
    'status': status,
    'maxDevices': maxDevices,
    'dailyVoiceLimit': dailyVoiceLimit,
    'highlighted': highlighted,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };
}
