import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n_gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('zh'),
    Locale('en'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In zh, this message translates to:
  /// **'mcoding'**
  String get appTitle;

  /// No description provided for @loginTitle.
  ///
  /// In zh, this message translates to:
  /// **'手机号验证码登录'**
  String get loginTitle;

  /// No description provided for @phoneLabel.
  ///
  /// In zh, this message translates to:
  /// **'手机号'**
  String get phoneLabel;

  /// No description provided for @phoneHint.
  ///
  /// In zh, this message translates to:
  /// **'请输入手机号'**
  String get phoneHint;

  /// No description provided for @codeLabel.
  ///
  /// In zh, this message translates to:
  /// **'验证码'**
  String get codeLabel;

  /// No description provided for @codeHint.
  ///
  /// In zh, this message translates to:
  /// **'请输入验证码'**
  String get codeHint;

  /// No description provided for @sendCode.
  ///
  /// In zh, this message translates to:
  /// **'获取验证码'**
  String get sendCode;

  /// No description provided for @loginButton.
  ///
  /// In zh, this message translates to:
  /// **'登录 / 注册'**
  String get loginButton;

  /// No description provided for @otherLoginMethods.
  ///
  /// In zh, this message translates to:
  /// **'其他登录方式'**
  String get otherLoginMethods;

  /// No description provided for @codeSent.
  ///
  /// In zh, this message translates to:
  /// **'验证码已发送'**
  String get codeSent;

  /// No description provided for @networkError.
  ///
  /// In zh, this message translates to:
  /// **'网络错误，请稍后重试'**
  String get networkError;

  /// No description provided for @loginFailed.
  ///
  /// In zh, this message translates to:
  /// **'登录失败，请检查网络'**
  String get loginFailed;

  /// No description provided for @legalConsentTitle.
  ///
  /// In zh, this message translates to:
  /// **'用户协议与隐私政策'**
  String get legalConsentTitle;

  /// No description provided for @legalConsentBody.
  ///
  /// In zh, this message translates to:
  /// **'欢迎使用 mcoding 开源版。继续前，请先阅读当前部署已配置的隐私政策和条款链接。'**
  String get legalConsentBody;

  /// No description provided for @legalConsentRequired.
  ///
  /// In zh, this message translates to:
  /// **'如不同意，请停止使用当前部署。'**
  String get legalConsentRequired;

  /// No description provided for @privacyPolicy.
  ///
  /// In zh, this message translates to:
  /// **'隐私政策'**
  String get privacyPolicy;

  /// No description provided for @termsOfUse.
  ///
  /// In zh, this message translates to:
  /// **'用户协议'**
  String get termsOfUse;

  /// No description provided for @agreeAndContinue.
  ///
  /// In zh, this message translates to:
  /// **'同意并继续'**
  String get agreeAndContinue;

  /// No description provided for @disagreeAndExit.
  ///
  /// In zh, this message translates to:
  /// **'不同意并退出'**
  String get disagreeAndExit;

  /// No description provided for @viewLegalAgreements.
  ///
  /// In zh, this message translates to:
  /// **'查看隐私政策与用户协议'**
  String get viewLegalAgreements;

  /// No description provided for @connectionSuccess.
  ///
  /// In zh, this message translates to:
  /// **'连接成功'**
  String get connectionSuccess;

  /// No description provided for @connectionSuccessMsg.
  ///
  /// In zh, this message translates to:
  /// **'已连接到 {serverId}'**
  String connectionSuccessMsg(Object serverId);

  /// No description provided for @enter.
  ///
  /// In zh, this message translates to:
  /// **'进入'**
  String get enter;

  /// No description provided for @connectionFailed.
  ///
  /// In zh, this message translates to:
  /// **'连接失败'**
  String get connectionFailed;

  /// No description provided for @rescan.
  ///
  /// In zh, this message translates to:
  /// **'重新扫码'**
  String get rescan;

  /// No description provided for @connectionTimeout.
  ///
  /// In zh, this message translates to:
  /// **'连接超时：请确认 relay-service 已启动，手机和电脑在同一网络，并且二维码里的 relay 地址可访问。'**
  String get connectionTimeout;

  /// No description provided for @cameraPermissionDenied.
  ///
  /// In zh, this message translates to:
  /// **'请在系统设置里允许 mcoding 使用相机后再扫码。'**
  String get cameraPermissionDenied;

  /// No description provided for @cameraUnsupported.
  ///
  /// In zh, this message translates to:
  /// **'当前设备没有可用相机，请换真机或粘贴配对链接。'**
  String get cameraUnsupported;

  /// No description provided for @scanQRCode.
  ///
  /// In zh, this message translates to:
  /// **'扫码添加设备'**
  String get scanQRCode;

  /// No description provided for @sessions.
  ///
  /// In zh, this message translates to:
  /// **'会话'**
  String get sessions;

  /// No description provided for @archived.
  ///
  /// In zh, this message translates to:
  /// **'归档'**
  String get archived;

  /// No description provided for @noArchivedSessions.
  ///
  /// In zh, this message translates to:
  /// **'没有归档的会话'**
  String get noArchivedSessions;

  /// No description provided for @hostOffline.
  ///
  /// In zh, this message translates to:
  /// **'主机离线'**
  String get hostOffline;

  /// No description provided for @retry.
  ///
  /// In zh, this message translates to:
  /// **'重试'**
  String get retry;

  /// No description provided for @noSessions.
  ///
  /// In zh, this message translates to:
  /// **'还没有会话'**
  String get noSessions;

  /// No description provided for @createFirstAgent.
  ///
  /// In zh, this message translates to:
  /// **'创建你的第一个智能体来开始'**
  String get createFirstAgent;

  /// No description provided for @newAgent.
  ///
  /// In zh, this message translates to:
  /// **'新建智能体'**
  String get newAgent;

  /// No description provided for @initialPrompt.
  ///
  /// In zh, this message translates to:
  /// **'初始提示词'**
  String get initialPrompt;

  /// No description provided for @provider.
  ///
  /// In zh, this message translates to:
  /// **'提供商'**
  String get provider;

  /// No description provided for @workingDirectory.
  ///
  /// In zh, this message translates to:
  /// **'工作目录'**
  String get workingDirectory;

  /// No description provided for @mode.
  ///
  /// In zh, this message translates to:
  /// **'模式'**
  String get mode;

  /// No description provided for @modeCode.
  ///
  /// In zh, this message translates to:
  /// **'编码'**
  String get modeCode;

  /// No description provided for @modePlan.
  ///
  /// In zh, this message translates to:
  /// **'规划'**
  String get modePlan;

  /// No description provided for @modeAsk.
  ///
  /// In zh, this message translates to:
  /// **'问答'**
  String get modeAsk;

  /// No description provided for @thinkingMode.
  ///
  /// In zh, this message translates to:
  /// **'思考模式'**
  String get thinkingMode;

  /// No description provided for @create.
  ///
  /// In zh, this message translates to:
  /// **'创建'**
  String get create;

  /// No description provided for @cancel.
  ///
  /// In zh, this message translates to:
  /// **'取消'**
  String get cancel;

  /// No description provided for @archive.
  ///
  /// In zh, this message translates to:
  /// **'归档'**
  String get archive;

  /// No description provided for @sessionArchived.
  ///
  /// In zh, this message translates to:
  /// **'会话已归档'**
  String get sessionArchived;

  /// No description provided for @settings.
  ///
  /// In zh, this message translates to:
  /// **'设置'**
  String get settings;

  /// No description provided for @linkNotConfigured.
  ///
  /// In zh, this message translates to:
  /// **'当前开源版未配置这个链接'**
  String get linkNotConfigured;

  /// No description provided for @appearance.
  ///
  /// In zh, this message translates to:
  /// **'外观'**
  String get appearance;

  /// No description provided for @systemDefault.
  ///
  /// In zh, this message translates to:
  /// **'跟随系统'**
  String get systemDefault;

  /// No description provided for @light.
  ///
  /// In zh, this message translates to:
  /// **'浅色'**
  String get light;

  /// No description provided for @dark.
  ///
  /// In zh, this message translates to:
  /// **'深色'**
  String get dark;

  /// No description provided for @host.
  ///
  /// In zh, this message translates to:
  /// **'主机'**
  String get host;

  /// No description provided for @connection.
  ///
  /// In zh, this message translates to:
  /// **'连接'**
  String get connection;

  /// No description provided for @online.
  ///
  /// In zh, this message translates to:
  /// **'在线'**
  String get online;

  /// No description provided for @offline.
  ///
  /// In zh, this message translates to:
  /// **'离线'**
  String get offline;

  /// No description provided for @use.
  ///
  /// In zh, this message translates to:
  /// **'使用'**
  String get use;

  /// No description provided for @providers.
  ///
  /// In zh, this message translates to:
  /// **'提供商'**
  String get providers;

  /// No description provided for @noProviders.
  ///
  /// In zh, this message translates to:
  /// **'未检测到提供商'**
  String get noProviders;

  /// No description provided for @available.
  ///
  /// In zh, this message translates to:
  /// **'可用'**
  String get available;

  /// No description provided for @diagnostics.
  ///
  /// In zh, this message translates to:
  /// **'诊断'**
  String get diagnostics;

  /// No description provided for @version.
  ///
  /// In zh, this message translates to:
  /// **'版本'**
  String get version;

  /// No description provided for @serverId.
  ///
  /// In zh, this message translates to:
  /// **'服务器 ID'**
  String get serverId;

  /// No description provided for @connectionState.
  ///
  /// In zh, this message translates to:
  /// **'连接状态'**
  String get connectionState;

  /// No description provided for @agentsCount.
  ///
  /// In zh, this message translates to:
  /// **'智能体数量'**
  String get agentsCount;

  /// No description provided for @removeHost.
  ///
  /// In zh, this message translates to:
  /// **'移除主机'**
  String get removeHost;

  /// No description provided for @remove.
  ///
  /// In zh, this message translates to:
  /// **'移除'**
  String get remove;

  /// No description provided for @terminal.
  ///
  /// In zh, this message translates to:
  /// **'终端'**
  String get terminal;

  /// No description provided for @newTerminal.
  ///
  /// In zh, this message translates to:
  /// **'新建'**
  String get newTerminal;

  /// No description provided for @selectTerminal.
  ///
  /// In zh, this message translates to:
  /// **'选择一个终端开始'**
  String get selectTerminal;

  /// No description provided for @files.
  ///
  /// In zh, this message translates to:
  /// **'文件'**
  String get files;

  /// No description provided for @name.
  ///
  /// In zh, this message translates to:
  /// **'名称'**
  String get name;

  /// No description provided for @size.
  ///
  /// In zh, this message translates to:
  /// **'大小'**
  String get size;

  /// No description provided for @modified.
  ///
  /// In zh, this message translates to:
  /// **'修改时间'**
  String get modified;

  /// No description provided for @noFiles.
  ///
  /// In zh, this message translates to:
  /// **'没有文件'**
  String get noFiles;

  /// No description provided for @directory.
  ///
  /// In zh, this message translates to:
  /// **'目录'**
  String get directory;

  /// No description provided for @history.
  ///
  /// In zh, this message translates to:
  /// **'历史'**
  String get history;

  /// No description provided for @active.
  ///
  /// In zh, this message translates to:
  /// **'活跃'**
  String get active;

  /// No description provided for @noActiveSessions.
  ///
  /// In zh, this message translates to:
  /// **'暂无历史会话'**
  String get noActiveSessions;

  /// No description provided for @pastePairingLink.
  ///
  /// In zh, this message translates to:
  /// **'粘贴配对链接'**
  String get pastePairingLink;

  /// No description provided for @pairHost.
  ///
  /// In zh, this message translates to:
  /// **'配对主机'**
  String get pairHost;

  /// No description provided for @pair.
  ///
  /// In zh, this message translates to:
  /// **'配对'**
  String get pair;

  /// No description provided for @filePickerUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'当前平台不支持文件选择器'**
  String get filePickerUnavailable;

  /// No description provided for @openFolder.
  ///
  /// In zh, this message translates to:
  /// **'打开文件夹'**
  String get openFolder;

  /// No description provided for @recentProjects.
  ///
  /// In zh, this message translates to:
  /// **'最近项目'**
  String get recentProjects;

  /// No description provided for @welcomeTitle.
  ///
  /// In zh, this message translates to:
  /// **'欢迎使用 mcoding'**
  String get welcomeTitle;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'监控和控制你的本地 AI 编程助手'**
  String get welcomeSubtitle;

  /// No description provided for @onlineHosts.
  ///
  /// In zh, this message translates to:
  /// **'我的设备'**
  String get onlineHosts;

  /// No description provided for @noHostsConfigured.
  ///
  /// In zh, this message translates to:
  /// **'还没有配置主机'**
  String get noHostsConfigured;

  /// No description provided for @delete.
  ///
  /// In zh, this message translates to:
  /// **'删除'**
  String get delete;

  /// No description provided for @allow.
  ///
  /// In zh, this message translates to:
  /// **'允许'**
  String get allow;

  /// No description provided for @deny.
  ///
  /// In zh, this message translates to:
  /// **'拒绝'**
  String get deny;

  /// No description provided for @implement.
  ///
  /// In zh, this message translates to:
  /// **'执行'**
  String get implement;

  /// No description provided for @permissionRequest.
  ///
  /// In zh, this message translates to:
  /// **'权限请求'**
  String get permissionRequest;

  /// No description provided for @plan.
  ///
  /// In zh, this message translates to:
  /// **'规划'**
  String get plan;

  /// No description provided for @smsSendFailed.
  ///
  /// In zh, this message translates to:
  /// **'验证码发送失败'**
  String get smsSendFailed;

  /// No description provided for @tokenExpired.
  ///
  /// In zh, this message translates to:
  /// **'Token 已失效'**
  String get tokenExpired;

  /// No description provided for @refreshTokenFailed.
  ///
  /// In zh, this message translates to:
  /// **'刷新 Token 失败'**
  String get refreshTokenFailed;

  /// No description provided for @editLabel.
  ///
  /// In zh, this message translates to:
  /// **'编辑名称'**
  String get editLabel;

  /// No description provided for @deleteDevice.
  ///
  /// In zh, this message translates to:
  /// **'删除设备'**
  String get deleteDevice;

  /// No description provided for @confirmDeleteDevice.
  ///
  /// In zh, this message translates to:
  /// **'确定要删除 \"{label}\" 吗？'**
  String confirmDeleteDevice(Object label);

  /// No description provided for @labelUpdated.
  ///
  /// In zh, this message translates to:
  /// **'名称已更新'**
  String get labelUpdated;

  /// No description provided for @deviceDeleted.
  ///
  /// In zh, this message translates to:
  /// **'设备已删除'**
  String get deviceDeleted;

  /// No description provided for @enterDeviceName.
  ///
  /// In zh, this message translates to:
  /// **'输入设备名称'**
  String get enterDeviceName;

  /// No description provided for @deleteFailed.
  ///
  /// In zh, this message translates to:
  /// **'删除失败：{error}'**
  String deleteFailed(Object error);

  /// No description provided for @deviceName.
  ///
  /// In zh, this message translates to:
  /// **'设备名称'**
  String get deviceName;

  /// No description provided for @enterDeviceNameHint.
  ///
  /// In zh, this message translates to:
  /// **'请输入设备名称'**
  String get enterDeviceNameHint;

  /// No description provided for @save.
  ///
  /// In zh, this message translates to:
  /// **'保存'**
  String get save;

  /// No description provided for @updateFailed.
  ///
  /// In zh, this message translates to:
  /// **'更新失败：{error}'**
  String updateFailed(Object error);

  /// No description provided for @stop.
  ///
  /// In zh, this message translates to:
  /// **'停止'**
  String get stop;

  /// No description provided for @projects.
  ///
  /// In zh, this message translates to:
  /// **'工程列表'**
  String get projects;

  /// No description provided for @menu.
  ///
  /// In zh, this message translates to:
  /// **'菜单'**
  String get menu;

  /// No description provided for @thinking.
  ///
  /// In zh, this message translates to:
  /// **'思考中'**
  String get thinking;

  /// No description provided for @collapse.
  ///
  /// In zh, this message translates to:
  /// **'收起'**
  String get collapse;

  /// No description provided for @expandFullText.
  ///
  /// In zh, this message translates to:
  /// **'展开全文'**
  String get expandFullText;

  /// No description provided for @startConversation.
  ///
  /// In zh, this message translates to:
  /// **'开始对话'**
  String get startConversation;

  /// No description provided for @enterYourQuestion.
  ///
  /// In zh, this message translates to:
  /// **'输入你的问题'**
  String get enterYourQuestion;

  /// No description provided for @subscription.
  ///
  /// In zh, this message translates to:
  /// **'订阅'**
  String get subscription;

  /// No description provided for @subscriptionCenter.
  ///
  /// In zh, this message translates to:
  /// **'订阅中心'**
  String get subscriptionCenter;

  /// No description provided for @currentMembership.
  ///
  /// In zh, this message translates to:
  /// **'当前会员'**
  String get currentMembership;

  /// No description provided for @freeUser.
  ///
  /// In zh, this message translates to:
  /// **'免费用户'**
  String get freeUser;

  /// No description provided for @memberUser.
  ///
  /// In zh, this message translates to:
  /// **'会员用户'**
  String get memberUser;

  /// No description provided for @subscriptionSource.
  ///
  /// In zh, this message translates to:
  /// **'订阅来源'**
  String get subscriptionSource;

  /// No description provided for @notSubscribed.
  ///
  /// In zh, this message translates to:
  /// **'未订阅'**
  String get notSubscribed;

  /// No description provided for @appleSubscription.
  ///
  /// In zh, this message translates to:
  /// **'苹果订阅'**
  String get appleSubscription;

  /// No description provided for @wechatSubscription.
  ///
  /// In zh, this message translates to:
  /// **'微信支付订阅'**
  String get wechatSubscription;

  /// No description provided for @alipaySubscription.
  ///
  /// In zh, this message translates to:
  /// **'支付宝订阅'**
  String get alipaySubscription;

  /// No description provided for @subscriptionDescription.
  ///
  /// In zh, this message translates to:
  /// **'先接入苹果订阅，后续会继续补充微信、支付宝等第三方支付订阅。'**
  String get subscriptionDescription;

  /// No description provided for @subscriptionOnlyOnApple.
  ///
  /// In zh, this message translates to:
  /// **'当前只支持在 iPhone / iPad / Mac App Store 环境开通苹果订阅。'**
  String get subscriptionOnlyOnApple;

  /// No description provided for @appStoreUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'当前无法连接 App Store，请稍后再试。'**
  String get appStoreUnavailable;

  /// No description provided for @subscriptionProductsUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'暂时没有可售的订阅商品，请检查商品 ID 和 App Store Connect 配置。'**
  String get subscriptionProductsUnavailable;

  /// No description provided for @activateSubscription.
  ///
  /// In zh, this message translates to:
  /// **'开通订阅'**
  String get activateSubscription;

  /// No description provided for @manageSubscription.
  ///
  /// In zh, this message translates to:
  /// **'管理订阅'**
  String get manageSubscription;

  /// No description provided for @renewSubscription.
  ///
  /// In zh, this message translates to:
  /// **'续费订阅'**
  String get renewSubscription;

  /// No description provided for @subscriptionEntryHint.
  ///
  /// In zh, this message translates to:
  /// **'查看会员状态、开通苹果订阅或恢复已购买项目'**
  String get subscriptionEntryHint;

  /// No description provided for @feedback.
  ///
  /// In zh, this message translates to:
  /// **'意见反馈'**
  String get feedback;

  /// No description provided for @feedbackEntryHint.
  ///
  /// In zh, this message translates to:
  /// **'提交问题、建议或体验反馈，可附带截图'**
  String get feedbackEntryHint;

  /// No description provided for @feedbackContentLabel.
  ///
  /// In zh, this message translates to:
  /// **'反馈内容'**
  String get feedbackContentLabel;

  /// No description provided for @feedbackContentHint.
  ///
  /// In zh, this message translates to:
  /// **'请描述你遇到的问题、期望的改进，或复现步骤。'**
  String get feedbackContentHint;

  /// No description provided for @feedbackContactLabel.
  ///
  /// In zh, this message translates to:
  /// **'联系方式'**
  String get feedbackContactLabel;

  /// No description provided for @feedbackContactHint.
  ///
  /// In zh, this message translates to:
  /// **'选填：手机号、微信号、邮箱等，方便我们联系你'**
  String get feedbackContactHint;

  /// No description provided for @feedbackScreenshots.
  ///
  /// In zh, this message translates to:
  /// **'截图'**
  String get feedbackScreenshots;

  /// No description provided for @feedbackAddScreenshots.
  ///
  /// In zh, this message translates to:
  /// **'添加截图'**
  String get feedbackAddScreenshots;

  /// No description provided for @feedbackImageLimit.
  ///
  /// In zh, this message translates to:
  /// **'最多上传 {count} 张截图'**
  String feedbackImageLimit(int count);

  /// No description provided for @feedbackEmptyContent.
  ///
  /// In zh, this message translates to:
  /// **'请先填写反馈内容'**
  String get feedbackEmptyContent;

  /// No description provided for @feedbackSubmitting.
  ///
  /// In zh, this message translates to:
  /// **'提交中...'**
  String get feedbackSubmitting;

  /// No description provided for @submitFeedback.
  ///
  /// In zh, this message translates to:
  /// **'提交反馈'**
  String get submitFeedback;

  /// No description provided for @feedbackSubmitSuccess.
  ///
  /// In zh, this message translates to:
  /// **'反馈已提交，感谢你的建议'**
  String get feedbackSubmitSuccess;

  /// No description provided for @feedbackSubmitFailed.
  ///
  /// In zh, this message translates to:
  /// **'提交反馈失败：{error}'**
  String feedbackSubmitFailed(String error);

  /// No description provided for @restorePurchases.
  ///
  /// In zh, this message translates to:
  /// **'恢复购买'**
  String get restorePurchases;

  /// No description provided for @restoringPurchases.
  ///
  /// In zh, this message translates to:
  /// **'正在恢复已购买项目…'**
  String get restoringPurchases;

  /// No description provided for @subscriptionProcessing.
  ///
  /// In zh, this message translates to:
  /// **'正在处理订阅结果，请稍候…'**
  String get subscriptionProcessing;

  /// No description provided for @subscriptionActivated.
  ///
  /// In zh, this message translates to:
  /// **'订阅已开通，会员状态已更新'**
  String get subscriptionActivated;

  /// No description provided for @subscriptionVerifyFailed.
  ///
  /// In zh, this message translates to:
  /// **'订阅校验失败，请稍后重试'**
  String get subscriptionVerifyFailed;

  /// No description provided for @subscriptionStartFailed.
  ///
  /// In zh, this message translates to:
  /// **'无法发起订阅购买，请稍后重试'**
  String get subscriptionStartFailed;

  /// No description provided for @purchaseFailed.
  ///
  /// In zh, this message translates to:
  /// **'购买失败，请稍后重试'**
  String get purchaseFailed;

  /// No description provided for @purchaseCanceled.
  ///
  /// In zh, this message translates to:
  /// **'已取消购买'**
  String get purchaseCanceled;

  /// No description provided for @subscriptionExpiresAt.
  ///
  /// In zh, this message translates to:
  /// **'到期时间'**
  String get subscriptionExpiresAt;

  /// No description provided for @subscriptionLegalNotice.
  ///
  /// In zh, this message translates to:
  /// **'订阅将通过 Apple ID 付款，并按 App Store 规则自动续订；可在系统 Apple ID 订阅管理中取消。购买或恢复购买即表示你同意隐私政策和用户协议。'**
  String get subscriptionLegalNotice;

  /// No description provided for @weeklyPlan.
  ///
  /// In zh, this message translates to:
  /// **'周卡'**
  String get weeklyPlan;

  /// No description provided for @monthlyPlan.
  ///
  /// In zh, this message translates to:
  /// **'月卡'**
  String get monthlyPlan;

  /// No description provided for @quarterlyPlan.
  ///
  /// In zh, this message translates to:
  /// **'季卡'**
  String get quarterlyPlan;

  /// No description provided for @yearlyPlan.
  ///
  /// In zh, this message translates to:
  /// **'年卡'**
  String get yearlyPlan;

  /// No description provided for @customPlan.
  ///
  /// In zh, this message translates to:
  /// **'自定义'**
  String get customPlan;

  /// No description provided for @recommendedPlan.
  ///
  /// In zh, this message translates to:
  /// **'推荐'**
  String get recommendedPlan;

  /// No description provided for @currentPlan.
  ///
  /// In zh, this message translates to:
  /// **'当前套餐'**
  String get currentPlan;

  /// No description provided for @unlimitedDevices.
  ///
  /// In zh, this message translates to:
  /// **'无限设备'**
  String get unlimitedDevices;

  /// No description provided for @unlimitedVoice.
  ///
  /// In zh, this message translates to:
  /// **'无限语音'**
  String get unlimitedVoice;

  /// No description provided for @androidPaymentComingSoon.
  ///
  /// In zh, this message translates to:
  /// **'Android 支付即将上线，敬请期待'**
  String get androidPaymentComingSoon;

  /// No description provided for @refresh.
  ///
  /// In zh, this message translates to:
  /// **'刷新'**
  String get refresh;

  /// No description provided for @selectDirectory.
  ///
  /// In zh, this message translates to:
  /// **'选择目录'**
  String get selectDirectory;

  /// No description provided for @noMatchingFolders.
  ///
  /// In zh, this message translates to:
  /// **'没有匹配的文件夹'**
  String get noMatchingFolders;

  /// No description provided for @noSelectableSubdirectories.
  ///
  /// In zh, this message translates to:
  /// **'没有可选择的子目录'**
  String get noSelectableSubdirectories;

  /// No description provided for @backToRootDirectory.
  ///
  /// In zh, this message translates to:
  /// **'回到最上级目录'**
  String get backToRootDirectory;

  /// No description provided for @backToParentDirectory.
  ///
  /// In zh, this message translates to:
  /// **'返回上一级目录'**
  String get backToParentDirectory;

  /// No description provided for @searchFolders.
  ///
  /// In zh, this message translates to:
  /// **'搜索文件夹'**
  String get searchFolders;

  /// No description provided for @clearSearch.
  ///
  /// In zh, this message translates to:
  /// **'清除搜索'**
  String get clearSearch;

  /// No description provided for @adding.
  ///
  /// In zh, this message translates to:
  /// **'添加中'**
  String get adding;

  /// No description provided for @confirm.
  ///
  /// In zh, this message translates to:
  /// **'确定'**
  String get confirm;

  /// No description provided for @projectAdded.
  ///
  /// In zh, this message translates to:
  /// **'已添加工程：{name}'**
  String projectAdded(Object name);

  /// No description provided for @addProjectFailed.
  ///
  /// In zh, this message translates to:
  /// **'添加工程失败：{error}'**
  String addProjectFailed(Object error);

  /// No description provided for @disconnectAndRemove.
  ///
  /// In zh, this message translates to:
  /// **'断开连接并移除 \"{label}\" 吗？'**
  String disconnectAndRemove(String label);

  /// No description provided for @completionSound.
  ///
  /// In zh, this message translates to:
  /// **'完成提醒'**
  String get completionSound;

  /// No description provided for @completionSoundDesc.
  ///
  /// In zh, this message translates to:
  /// **'任务完成时播放提示音'**
  String get completionSoundDesc;

  /// No description provided for @updateFound.
  ///
  /// In zh, this message translates to:
  /// **'发现新版本 v{version}'**
  String updateFound(String version);

  /// No description provided for @updateContent.
  ///
  /// In zh, this message translates to:
  /// **'更新内容：'**
  String get updateContent;

  /// No description provided for @packageSize.
  ///
  /// In zh, this message translates to:
  /// **'安装包大小：{size}'**
  String packageSize(String size);

  /// No description provided for @downloadFailed.
  ///
  /// In zh, this message translates to:
  /// **'下载失败：{error}'**
  String downloadFailed(String error);

  /// No description provided for @downloadingProgress.
  ///
  /// In zh, this message translates to:
  /// **'正在下载... {progress}'**
  String downloadingProgress(String progress);

  /// No description provided for @downloadComplete.
  ///
  /// In zh, this message translates to:
  /// **'下载完成，点击安装'**
  String get downloadComplete;

  /// No description provided for @fileNotFound.
  ///
  /// In zh, this message translates to:
  /// **'APK文件未找到，请重新下载'**
  String get fileNotFound;

  /// No description provided for @installFailed.
  ///
  /// In zh, this message translates to:
  /// **'安装失败：{error}'**
  String installFailed(Object error);

  /// No description provided for @installLater.
  ///
  /// In zh, this message translates to:
  /// **'稍后安装'**
  String get installLater;

  /// No description provided for @installNow.
  ///
  /// In zh, this message translates to:
  /// **'立即安装'**
  String get installNow;

  /// No description provided for @retryDownload.
  ///
  /// In zh, this message translates to:
  /// **'重试下载'**
  String get retryDownload;

  /// No description provided for @later.
  ///
  /// In zh, this message translates to:
  /// **'稍后再说'**
  String get later;

  /// No description provided for @updateNow.
  ///
  /// In zh, this message translates to:
  /// **'立即更新'**
  String get updateNow;

  /// No description provided for @unknown.
  ///
  /// In zh, this message translates to:
  /// **'未知'**
  String get unknown;

  /// No description provided for @holdToTalk.
  ///
  /// In zh, this message translates to:
  /// **'按住说话'**
  String get holdToTalk;

  /// No description provided for @holdToTalkCount.
  ///
  /// In zh, this message translates to:
  /// **'按住说话 ({count}次)'**
  String holdToTalkCount(int count);

  /// No description provided for @replyInProgress.
  ///
  /// In zh, this message translates to:
  /// **'回复中，暂不可用'**
  String get replyInProgress;

  /// No description provided for @releaseToCancel.
  ///
  /// In zh, this message translates to:
  /// **'松开取消'**
  String get releaseToCancel;

  /// No description provided for @releaseToSendSwipeCancel.
  ///
  /// In zh, this message translates to:
  /// **'松开发送，上滑取消'**
  String get releaseToSendSwipeCancel;

  /// No description provided for @listening.
  ///
  /// In zh, this message translates to:
  /// **'正在聆听...'**
  String get listening;

  /// No description provided for @releaseFingerCancel.
  ///
  /// In zh, this message translates to:
  /// **'松开手指取消'**
  String get releaseFingerCancel;

  /// No description provided for @releaseFingerSendSwipeCancel.
  ///
  /// In zh, this message translates to:
  /// **'松开手指发送，上滑取消'**
  String get releaseFingerSendSwipeCancel;

  /// No description provided for @justNow.
  ///
  /// In zh, this message translates to:
  /// **'刚刚'**
  String get justNow;

  /// No description provided for @minutesAgo.
  ///
  /// In zh, this message translates to:
  /// **'{count} 分钟前'**
  String minutesAgo(int count);

  /// No description provided for @hoursAgo.
  ///
  /// In zh, this message translates to:
  /// **'{count} 小时前'**
  String hoursAgo(int count);

  /// No description provided for @daysAgo.
  ///
  /// In zh, this message translates to:
  /// **'{count}天前'**
  String daysAgo(int count);

  /// No description provided for @copy.
  ///
  /// In zh, this message translates to:
  /// **'复制'**
  String get copy;

  /// No description provided for @quote.
  ///
  /// In zh, this message translates to:
  /// **'引用'**
  String get quote;

  /// No description provided for @copied.
  ///
  /// In zh, this message translates to:
  /// **'已复制'**
  String get copied;

  /// No description provided for @noProviderAvailable.
  ///
  /// In zh, this message translates to:
  /// **'当前主机没有可用的 provider，请先安装或配置 Claude、Codex 或 OpenCode。'**
  String get noProviderAvailable;

  /// No description provided for @createFailed.
  ///
  /// In zh, this message translates to:
  /// **'创建对话失败：{error}'**
  String createFailed(String error);

  /// No description provided for @sendFailed.
  ///
  /// In zh, this message translates to:
  /// **'发送消息失败：{error}'**
  String sendFailed(String error);

  /// No description provided for @changeModeFailed.
  ///
  /// In zh, this message translates to:
  /// **'修改 mode 失败：{error}'**
  String changeModeFailed(String error);

  /// No description provided for @changeModelFailed.
  ///
  /// In zh, this message translates to:
  /// **'修改 model 失败：{error}'**
  String changeModelFailed(String error);

  /// No description provided for @changeThinkingFailed.
  ///
  /// In zh, this message translates to:
  /// **'修改 thinking 失败：{error}'**
  String changeThinkingFailed(String error);

  /// No description provided for @providerLockedWarning.
  ///
  /// In zh, this message translates to:
  /// **'会话创建后无法修改 provider，请新建一个会话再选择 provider。'**
  String get providerLockedWarning;

  /// No description provided for @newConversation.
  ///
  /// In zh, this message translates to:
  /// **'新对话'**
  String get newConversation;

  /// No description provided for @workspace.
  ///
  /// In zh, this message translates to:
  /// **'工作区'**
  String get workspace;

  /// No description provided for @voiceLimitReached.
  ///
  /// In zh, this message translates to:
  /// **'今日语音使用次数已达上限，升级会员可无限使用'**
  String get voiceLimitReached;

  /// No description provided for @voiceTranscriptionApiKey.
  ///
  /// In zh, this message translates to:
  /// **'语音转文字 Key'**
  String get voiceTranscriptionApiKey;

  /// No description provided for @voiceTranscriptionApiKeyHint.
  ///
  /// In zh, this message translates to:
  /// **'在这里填写你的 DashScope/Qwen ASR API Key。未配置前，语音转文字不可用。'**
  String get voiceTranscriptionApiKeyHint;

  /// No description provided for @voiceTranscriptionApiKeyMissing.
  ///
  /// In zh, this message translates to:
  /// **'请先在设置里填写语音转文字 Key'**
  String get voiceTranscriptionApiKeyMissing;

  /// No description provided for @voiceTranscriptionApiKeySaved.
  ///
  /// In zh, this message translates to:
  /// **'语音转文字 Key 已保存'**
  String get voiceTranscriptionApiKeySaved;

  /// No description provided for @voiceTranscriptionApiKeyCleared.
  ///
  /// In zh, this message translates to:
  /// **'语音转文字 Key 已清除'**
  String get voiceTranscriptionApiKeyCleared;

  /// No description provided for @notConfigured.
  ///
  /// In zh, this message translates to:
  /// **'未配置'**
  String get notConfigured;

  /// No description provided for @configure.
  ///
  /// In zh, this message translates to:
  /// **'去配置'**
  String get configure;

  /// No description provided for @edit.
  ///
  /// In zh, this message translates to:
  /// **'编辑'**
  String get edit;

  /// No description provided for @clear.
  ///
  /// In zh, this message translates to:
  /// **'清除'**
  String get clear;

  /// No description provided for @inputMessage.
  ///
  /// In zh, this message translates to:
  /// **'输入消息...'**
  String get inputMessage;

  /// No description provided for @addImage.
  ///
  /// In zh, this message translates to:
  /// **'添加图片'**
  String get addImage;

  /// No description provided for @stopReply.
  ///
  /// In zh, this message translates to:
  /// **'停止回复'**
  String get stopReply;

  /// No description provided for @send.
  ///
  /// In zh, this message translates to:
  /// **'发送'**
  String get send;

  /// No description provided for @connecting.
  ///
  /// In zh, this message translates to:
  /// **'连接中'**
  String get connecting;

  /// No description provided for @disconnected.
  ///
  /// In zh, this message translates to:
  /// **'已断开'**
  String get disconnected;

  /// No description provided for @deleteProjectTitle.
  ///
  /// In zh, this message translates to:
  /// **'删除项目？'**
  String get deleteProjectTitle;

  /// No description provided for @confirmDeleteProjectContent.
  ///
  /// In zh, this message translates to:
  /// **'确定从我的项目中删除\"{name}\"？\n\n磁盘上的文件不会被删除。'**
  String confirmDeleteProjectContent(String name);

  /// No description provided for @projectDeleted.
  ///
  /// In zh, this message translates to:
  /// **'已删除项目：{name}'**
  String projectDeleted(String name);

  /// No description provided for @deleteProjectFailed.
  ///
  /// In zh, this message translates to:
  /// **'删除项目失败：{error}'**
  String deleteProjectFailed(String error);

  /// No description provided for @myProjects.
  ///
  /// In zh, this message translates to:
  /// **'我的项目'**
  String get myProjects;

  /// No description provided for @addProject.
  ///
  /// In zh, this message translates to:
  /// **'添加项目'**
  String get addProject;

  /// No description provided for @logout.
  ///
  /// In zh, this message translates to:
  /// **'退出登录'**
  String get logout;

  /// No description provided for @deleteAccount.
  ///
  /// In zh, this message translates to:
  /// **'注销账号'**
  String get deleteAccount;

  /// No description provided for @deleteAccountConfirm.
  ///
  /// In zh, this message translates to:
  /// **'注销后将删除你的账号、已绑定设备、会员状态和使用记录。此操作不可恢复；如仍有 Apple 订阅，请先在系统 Apple ID 订阅管理中取消续订。'**
  String get deleteAccountConfirm;

  /// No description provided for @confirmDeleteAccount.
  ///
  /// In zh, this message translates to:
  /// **'确认注销'**
  String get confirmDeleteAccount;

  /// No description provided for @deleteAccountFailed.
  ///
  /// In zh, this message translates to:
  /// **'账号注销失败：{error}'**
  String deleteAccountFailed(String error);

  /// No description provided for @confirmLogout.
  ///
  /// In zh, this message translates to:
  /// **'确定要退出登录吗？'**
  String get confirmLogout;

  /// No description provided for @checkUpdate.
  ///
  /// In zh, this message translates to:
  /// **'检查更新'**
  String get checkUpdate;

  /// No description provided for @alreadyLatestVersion.
  ///
  /// In zh, this message translates to:
  /// **'当前已是最新版本'**
  String get alreadyLatestVersion;

  /// No description provided for @checkUpdateFailed.
  ///
  /// In zh, this message translates to:
  /// **'检查更新失败: {error}'**
  String checkUpdateFailed(String error);

  /// No description provided for @deviceAdded.
  ///
  /// In zh, this message translates to:
  /// **'设备添加成功'**
  String get deviceAdded;

  /// No description provided for @deviceLimitTitle.
  ///
  /// In zh, this message translates to:
  /// **'设备数量已达上限'**
  String get deviceLimitTitle;

  /// No description provided for @freeUserDeviceLimit.
  ///
  /// In zh, this message translates to:
  /// **'免费用户最多只能添加 1 台设备，升级会员可无限制添加'**
  String get freeUserDeviceLimit;

  /// No description provided for @gotIt.
  ///
  /// In zh, this message translates to:
  /// **'知道了'**
  String get gotIt;

  /// No description provided for @projectList.
  ///
  /// In zh, this message translates to:
  /// **'项目列表'**
  String get projectList;

  /// No description provided for @noProjects.
  ///
  /// In zh, this message translates to:
  /// **'还没有工程'**
  String get noProjects;

  /// No description provided for @viewAllProjects.
  ///
  /// In zh, this message translates to:
  /// **'查看全部工程'**
  String get viewAllProjects;

  /// No description provided for @newSession.
  ///
  /// In zh, this message translates to:
  /// **'新的会话'**
  String get newSession;

  /// No description provided for @notifications.
  ///
  /// In zh, this message translates to:
  /// **'通知消息'**
  String get notifications;

  /// No description provided for @notificationDetail.
  ///
  /// In zh, this message translates to:
  /// **'通知详情'**
  String get notificationDetail;

  /// No description provided for @noNotifications.
  ///
  /// In zh, this message translates to:
  /// **'暂无通知'**
  String get noNotifications;

  /// No description provided for @markAllRead.
  ///
  /// In zh, this message translates to:
  /// **'全部已读'**
  String get markAllRead;

  /// No description provided for @allNotificationsRead.
  ///
  /// In zh, this message translates to:
  /// **'已全部标记为已读'**
  String get allNotificationsRead;

  /// No description provided for @notificationTypeSystem.
  ///
  /// In zh, this message translates to:
  /// **'系统通知'**
  String get notificationTypeSystem;

  /// No description provided for @notificationTypeUpdate.
  ///
  /// In zh, this message translates to:
  /// **'更新通知'**
  String get notificationTypeUpdate;

  /// No description provided for @notificationTypePromotion.
  ///
  /// In zh, this message translates to:
  /// **'活动通知'**
  String get notificationTypePromotion;

  /// No description provided for @notificationTypeAccount.
  ///
  /// In zh, this message translates to:
  /// **'账户通知'**
  String get notificationTypeAccount;

  /// No description provided for @yesterday.
  ///
  /// In zh, this message translates to:
  /// **'昨天'**
  String get yesterday;

  /// No description provided for @shareToWechat.
  ///
  /// In zh, this message translates to:
  /// **'分享给好友'**
  String get shareToWechat;

  /// No description provided for @shareWebPageDesc.
  ///
  /// In zh, this message translates to:
  /// **'MCoding - 远程 AI 编程助手，随时随地掌控你的代码'**
  String get shareWebPageDesc;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
