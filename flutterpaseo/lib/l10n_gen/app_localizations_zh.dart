// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'mcoding';

  @override
  String get loginTitle => '手机号验证码登录';

  @override
  String get phoneLabel => '手机号';

  @override
  String get phoneHint => '请输入手机号';

  @override
  String get codeLabel => '验证码';

  @override
  String get codeHint => '请输入验证码';

  @override
  String get sendCode => '获取验证码';

  @override
  String get loginButton => '登录 / 注册';

  @override
  String get otherLoginMethods => '其他登录方式';

  @override
  String get codeSent => '验证码已发送';

  @override
  String get networkError => '网络错误，请稍后重试';

  @override
  String get loginFailed => '登录失败，请检查网络';

  @override
  String get legalConsentTitle => '用户协议与隐私政策';

  @override
  String get legalConsentBody => '欢迎使用 mcoding 开源版。继续前，请先阅读当前部署已配置的隐私政策和条款链接。';

  @override
  String get legalConsentRequired => '如不同意，请停止使用当前部署。';

  @override
  String get privacyPolicy => '隐私政策';

  @override
  String get termsOfUse => '用户协议';

  @override
  String get agreeAndContinue => '同意并继续';

  @override
  String get disagreeAndExit => '不同意并退出';

  @override
  String get viewLegalAgreements => '查看隐私政策与用户协议';

  @override
  String get connectionSuccess => '连接成功';

  @override
  String connectionSuccessMsg(Object serverId) {
    return '已连接到 $serverId';
  }

  @override
  String get enter => '进入';

  @override
  String get connectionFailed => '连接失败';

  @override
  String get rescan => '重新扫码';

  @override
  String get connectionTimeout =>
      '连接超时：请确认 relay-service 已启动，手机和电脑在同一网络，并且二维码里的 relay 地址可访问。';

  @override
  String get cameraPermissionDenied => '请在系统设置里允许 mcoding 使用相机后再扫码。';

  @override
  String get cameraUnsupported => '当前设备没有可用相机，请换真机或粘贴配对链接。';

  @override
  String get scanQRCode => '扫码添加设备';

  @override
  String get sessions => '会话';

  @override
  String get archived => '归档';

  @override
  String get noArchivedSessions => '没有归档的会话';

  @override
  String get hostOffline => '主机离线';

  @override
  String get retry => '重试';

  @override
  String get noSessions => '还没有会话';

  @override
  String get createFirstAgent => '创建你的第一个智能体来开始';

  @override
  String get newAgent => '新建智能体';

  @override
  String get initialPrompt => '初始提示词';

  @override
  String get provider => '提供商';

  @override
  String get workingDirectory => '工作目录';

  @override
  String get mode => '模式';

  @override
  String get modeCode => '编码';

  @override
  String get modePlan => '规划';

  @override
  String get modeAsk => '问答';

  @override
  String get thinkingMode => '思考模式';

  @override
  String get create => '创建';

  @override
  String get cancel => '取消';

  @override
  String get archive => '归档';

  @override
  String get sessionArchived => '会话已归档';

  @override
  String get settings => '设置';

  @override
  String get linkNotConfigured => '当前开源版未配置这个链接';

  @override
  String get appearance => '外观';

  @override
  String get systemDefault => '跟随系统';

  @override
  String get light => '浅色';

  @override
  String get dark => '深色';

  @override
  String get host => '主机';

  @override
  String get connection => '连接';

  @override
  String get online => '在线';

  @override
  String get offline => '离线';

  @override
  String get use => '使用';

  @override
  String get providers => '提供商';

  @override
  String get noProviders => '未检测到提供商';

  @override
  String get available => '可用';

  @override
  String get diagnostics => '诊断';

  @override
  String get version => '版本';

  @override
  String get serverId => '服务器 ID';

  @override
  String get connectionState => '连接状态';

  @override
  String get agentsCount => '智能体数量';

  @override
  String get removeHost => '移除主机';

  @override
  String get remove => '移除';

  @override
  String get terminal => '终端';

  @override
  String get newTerminal => '新建';

  @override
  String get selectTerminal => '选择一个终端开始';

  @override
  String get files => '文件';

  @override
  String get name => '名称';

  @override
  String get size => '大小';

  @override
  String get modified => '修改时间';

  @override
  String get noFiles => '没有文件';

  @override
  String get directory => '目录';

  @override
  String get history => '历史';

  @override
  String get active => '活跃';

  @override
  String get noActiveSessions => '暂无历史会话';

  @override
  String get pastePairingLink => '粘贴配对链接';

  @override
  String get pairHost => '配对主机';

  @override
  String get pair => '配对';

  @override
  String get filePickerUnavailable => '当前平台不支持文件选择器';

  @override
  String get openFolder => '打开文件夹';

  @override
  String get recentProjects => '最近项目';

  @override
  String get welcomeTitle => '欢迎使用 mcoding';

  @override
  String get welcomeSubtitle => '监控和控制你的本地 AI 编程助手';

  @override
  String get onlineHosts => '我的设备';

  @override
  String get noHostsConfigured => '还没有配置主机';

  @override
  String get delete => '删除';

  @override
  String get allow => '允许';

  @override
  String get deny => '拒绝';

  @override
  String get implement => '执行';

  @override
  String get permissionRequest => '权限请求';

  @override
  String get plan => '规划';

  @override
  String get smsSendFailed => '验证码发送失败';

  @override
  String get tokenExpired => 'Token 已失效';

  @override
  String get refreshTokenFailed => '刷新 Token 失败';

  @override
  String get editLabel => '编辑名称';

  @override
  String get deleteDevice => '删除设备';

  @override
  String confirmDeleteDevice(Object label) {
    return '确定要删除 \"$label\" 吗？';
  }

  @override
  String get labelUpdated => '名称已更新';

  @override
  String get deviceDeleted => '设备已删除';

  @override
  String get enterDeviceName => '输入设备名称';

  @override
  String deleteFailed(Object error) {
    return '删除失败：$error';
  }

  @override
  String get deviceName => '设备名称';

  @override
  String get enterDeviceNameHint => '请输入设备名称';

  @override
  String get save => '保存';

  @override
  String updateFailed(Object error) {
    return '更新失败：$error';
  }

  @override
  String get stop => '停止';

  @override
  String get projects => '工程列表';

  @override
  String get menu => '菜单';

  @override
  String get thinking => '思考中';

  @override
  String get collapse => '收起';

  @override
  String get expandFullText => '展开全文';

  @override
  String get startConversation => '开始对话';

  @override
  String get enterYourQuestion => '输入你的问题';

  @override
  String get subscription => '订阅';

  @override
  String get subscriptionCenter => '订阅中心';

  @override
  String get currentMembership => '当前会员';

  @override
  String get freeUser => '免费用户';

  @override
  String get memberUser => '会员用户';

  @override
  String get subscriptionSource => '订阅来源';

  @override
  String get notSubscribed => '未订阅';

  @override
  String get appleSubscription => '苹果订阅';

  @override
  String get wechatSubscription => '微信支付订阅';

  @override
  String get alipaySubscription => '支付宝订阅';

  @override
  String get subscriptionDescription => '先接入苹果订阅，后续会继续补充微信、支付宝等第三方支付订阅。';

  @override
  String get subscriptionOnlyOnApple =>
      '当前只支持在 iPhone / iPad / Mac App Store 环境开通苹果订阅。';

  @override
  String get appStoreUnavailable => '当前无法连接 App Store，请稍后再试。';

  @override
  String get subscriptionProductsUnavailable =>
      '暂时没有可售的订阅商品，请检查商品 ID 和 App Store Connect 配置。';

  @override
  String get activateSubscription => '开通订阅';

  @override
  String get manageSubscription => '管理订阅';

  @override
  String get renewSubscription => '续费订阅';

  @override
  String get subscriptionEntryHint => '查看会员状态、开通苹果订阅或恢复已购买项目';

  @override
  String get feedback => '意见反馈';

  @override
  String get feedbackEntryHint => '提交问题、建议或体验反馈，可附带截图';

  @override
  String get feedbackContentLabel => '反馈内容';

  @override
  String get feedbackContentHint => '请描述你遇到的问题、期望的改进，或复现步骤。';

  @override
  String get feedbackContactLabel => '联系方式';

  @override
  String get feedbackContactHint => '选填：手机号、微信号、邮箱等，方便我们联系你';

  @override
  String get feedbackScreenshots => '截图';

  @override
  String get feedbackAddScreenshots => '添加截图';

  @override
  String feedbackImageLimit(int count) {
    return '最多上传 $count 张截图';
  }

  @override
  String get feedbackEmptyContent => '请先填写反馈内容';

  @override
  String get feedbackSubmitting => '提交中...';

  @override
  String get submitFeedback => '提交反馈';

  @override
  String get feedbackSubmitSuccess => '反馈已提交，感谢你的建议';

  @override
  String feedbackSubmitFailed(String error) {
    return '提交反馈失败：$error';
  }

  @override
  String get restorePurchases => '恢复购买';

  @override
  String get restoringPurchases => '正在恢复已购买项目…';

  @override
  String get subscriptionProcessing => '正在处理订阅结果，请稍候…';

  @override
  String get subscriptionActivated => '订阅已开通，会员状态已更新';

  @override
  String get subscriptionVerifyFailed => '订阅校验失败，请稍后重试';

  @override
  String get subscriptionStartFailed => '无法发起订阅购买，请稍后重试';

  @override
  String get purchaseFailed => '购买失败，请稍后重试';

  @override
  String get purchaseCanceled => '已取消购买';

  @override
  String get subscriptionExpiresAt => '到期时间';

  @override
  String get subscriptionLegalNotice =>
      '订阅将通过 Apple ID 付款，并按 App Store 规则自动续订；可在系统 Apple ID 订阅管理中取消。购买或恢复购买即表示你同意隐私政策和用户协议。';

  @override
  String get weeklyPlan => '周卡';

  @override
  String get monthlyPlan => '月卡';

  @override
  String get quarterlyPlan => '季卡';

  @override
  String get yearlyPlan => '年卡';

  @override
  String get customPlan => '自定义';

  @override
  String get recommendedPlan => '推荐';

  @override
  String get currentPlan => '当前套餐';

  @override
  String get unlimitedDevices => '无限设备';

  @override
  String get unlimitedVoice => '无限语音';

  @override
  String get androidPaymentComingSoon => 'Android 支付即将上线，敬请期待';

  @override
  String get refresh => '刷新';

  @override
  String get selectDirectory => '选择目录';

  @override
  String get noMatchingFolders => '没有匹配的文件夹';

  @override
  String get noSelectableSubdirectories => '没有可选择的子目录';

  @override
  String get backToRootDirectory => '回到最上级目录';

  @override
  String get backToParentDirectory => '返回上一级目录';

  @override
  String get searchFolders => '搜索文件夹';

  @override
  String get clearSearch => '清除搜索';

  @override
  String get adding => '添加中';

  @override
  String get confirm => '确定';

  @override
  String projectAdded(Object name) {
    return '已添加工程：$name';
  }

  @override
  String addProjectFailed(Object error) {
    return '添加工程失败：$error';
  }

  @override
  String disconnectAndRemove(String label) {
    return '断开连接并移除 \"$label\" 吗？';
  }

  @override
  String get completionSound => '完成提醒';

  @override
  String get completionSoundDesc => '任务完成时播放提示音';

  @override
  String updateFound(String version) {
    return '发现新版本 v$version';
  }

  @override
  String get updateContent => '更新内容：';

  @override
  String packageSize(String size) {
    return '安装包大小：$size';
  }

  @override
  String downloadFailed(String error) {
    return '下载失败：$error';
  }

  @override
  String downloadingProgress(String progress) {
    return '正在下载... $progress';
  }

  @override
  String get downloadComplete => '下载完成，点击安装';

  @override
  String get fileNotFound => 'APK文件未找到，请重新下载';

  @override
  String installFailed(Object error) {
    return '安装失败：$error';
  }

  @override
  String get installLater => '稍后安装';

  @override
  String get installNow => '立即安装';

  @override
  String get retryDownload => '重试下载';

  @override
  String get later => '稍后再说';

  @override
  String get updateNow => '立即更新';

  @override
  String get unknown => '未知';

  @override
  String get holdToTalk => '按住说话';

  @override
  String holdToTalkCount(int count) {
    return '按住说话 ($count次)';
  }

  @override
  String get replyInProgress => '回复中，暂不可用';

  @override
  String get releaseToCancel => '松开取消';

  @override
  String get releaseToSendSwipeCancel => '松开发送，上滑取消';

  @override
  String get listening => '正在聆听...';

  @override
  String get releaseFingerCancel => '松开手指取消';

  @override
  String get releaseFingerSendSwipeCancel => '松开手指发送，上滑取消';

  @override
  String get justNow => '刚刚';

  @override
  String minutesAgo(int count) {
    return '$count 分钟前';
  }

  @override
  String hoursAgo(int count) {
    return '$count 小时前';
  }

  @override
  String daysAgo(int count) {
    return '$count天前';
  }

  @override
  String get copy => '复制';

  @override
  String get quote => '引用';

  @override
  String get copied => '已复制';

  @override
  String get noProviderAvailable =>
      '当前主机没有可用的 provider，请先安装或配置 Claude、Codex 或 OpenCode。';

  @override
  String createFailed(String error) {
    return '创建对话失败：$error';
  }

  @override
  String sendFailed(String error) {
    return '发送消息失败：$error';
  }

  @override
  String changeModeFailed(String error) {
    return '修改 mode 失败：$error';
  }

  @override
  String changeModelFailed(String error) {
    return '修改 model 失败：$error';
  }

  @override
  String changeThinkingFailed(String error) {
    return '修改 thinking 失败：$error';
  }

  @override
  String get providerLockedWarning => '会话创建后无法修改 provider，请新建一个会话再选择 provider。';

  @override
  String get newConversation => '新对话';

  @override
  String get workspace => '工作区';

  @override
  String get voiceLimitReached => '今日语音使用次数已达上限，升级会员可无限使用';

  @override
  String get voiceTranscriptionApiKey => '语音转文字 Key';

  @override
  String get voiceTranscriptionApiKeyHint =>
      '在这里填写你的 DashScope/Qwen ASR API Key。未配置前，语音转文字不可用。';

  @override
  String get voiceTranscriptionApiKeyMissing => '请先在设置里填写语音转文字 Key';

  @override
  String get voiceTranscriptionApiKeySaved => '语音转文字 Key 已保存';

  @override
  String get voiceTranscriptionApiKeyCleared => '语音转文字 Key 已清除';

  @override
  String get notConfigured => '未配置';

  @override
  String get configure => '去配置';

  @override
  String get edit => '编辑';

  @override
  String get clear => '清除';

  @override
  String get inputMessage => '输入消息...';

  @override
  String get addImage => '添加图片';

  @override
  String get stopReply => '停止回复';

  @override
  String get send => '发送';

  @override
  String get connecting => '连接中';

  @override
  String get disconnected => '已断开';

  @override
  String get deleteProjectTitle => '删除项目？';

  @override
  String confirmDeleteProjectContent(String name) {
    return '确定从我的项目中删除\"$name\"？\n\n磁盘上的文件不会被删除。';
  }

  @override
  String projectDeleted(String name) {
    return '已删除项目：$name';
  }

  @override
  String deleteProjectFailed(String error) {
    return '删除项目失败：$error';
  }

  @override
  String get myProjects => '我的项目';

  @override
  String get addProject => '添加项目';

  @override
  String get logout => '退出登录';

  @override
  String get deleteAccount => '注销账号';

  @override
  String get deleteAccountConfirm =>
      '注销后将删除你的账号、已绑定设备、会员状态和使用记录。此操作不可恢复；如仍有 Apple 订阅，请先在系统 Apple ID 订阅管理中取消续订。';

  @override
  String get confirmDeleteAccount => '确认注销';

  @override
  String deleteAccountFailed(String error) {
    return '账号注销失败：$error';
  }

  @override
  String get confirmLogout => '确定要退出登录吗？';

  @override
  String get checkUpdate => '检查更新';

  @override
  String get alreadyLatestVersion => '当前已是最新版本';

  @override
  String checkUpdateFailed(String error) {
    return '检查更新失败: $error';
  }

  @override
  String get deviceAdded => '设备添加成功';

  @override
  String get deviceLimitTitle => '设备数量已达上限';

  @override
  String get freeUserDeviceLimit => '免费用户最多只能添加 1 台设备，升级会员可无限制添加';

  @override
  String get gotIt => '知道了';

  @override
  String get projectList => '项目列表';

  @override
  String get noProjects => '还没有工程';

  @override
  String get viewAllProjects => '查看全部工程';

  @override
  String get newSession => '新的会话';

  @override
  String get notifications => '通知消息';

  @override
  String get notificationDetail => '通知详情';

  @override
  String get noNotifications => '暂无通知';

  @override
  String get markAllRead => '全部已读';

  @override
  String get allNotificationsRead => '已全部标记为已读';

  @override
  String get notificationTypeSystem => '系统通知';

  @override
  String get notificationTypeUpdate => '更新通知';

  @override
  String get notificationTypePromotion => '活动通知';

  @override
  String get notificationTypeAccount => '账户通知';

  @override
  String get yesterday => '昨天';

  @override
  String get shareToWechat => '分享给好友';

  @override
  String get shareWebPageDesc => 'MCoding - 远程 AI 编程助手，随时随地掌控你的代码';
}
