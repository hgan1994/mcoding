// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'mcoding';

  @override
  String get loginTitle => 'Phone Login';

  @override
  String get phoneLabel => 'Phone';

  @override
  String get phoneHint => 'Enter phone number';

  @override
  String get codeLabel => 'Code';

  @override
  String get codeHint => 'Enter verification code';

  @override
  String get sendCode => 'Get Code';

  @override
  String get loginButton => 'Login / Register';

  @override
  String get otherLoginMethods => 'Other login methods';

  @override
  String get codeSent => 'Verification code sent';

  @override
  String get networkError => 'Network error, please try again later';

  @override
  String get loginFailed => 'Login failed, please check your network';

  @override
  String get legalConsentTitle => 'Terms and Privacy Policy';

  @override
  String get legalConsentBody =>
      'Welcome to mcoding Open Source. Before continuing, please review the configured privacy policy and terms links for this deployment.';

  @override
  String get legalConsentRequired =>
      'If you do not agree, you should stop using this deployment.';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get termsOfUse => 'Terms of Use';

  @override
  String get agreeAndContinue => 'Agree and Continue';

  @override
  String get disagreeAndExit => 'Disagree and Exit';

  @override
  String get viewLegalAgreements => 'View Privacy Policy and Terms';

  @override
  String get connectionSuccess => 'Connected';

  @override
  String connectionSuccessMsg(Object serverId) {
    return 'Connected to $serverId';
  }

  @override
  String get enter => 'Enter';

  @override
  String get connectionFailed => 'Connection failed';

  @override
  String get rescan => 'Rescan';

  @override
  String get connectionTimeout =>
      'Connection timeout: please make sure relay-service is running, your phone and computer are on the same network, and the relay address in the QR code is accessible.';

  @override
  String get cameraPermissionDenied =>
      'Please allow camera access in system settings before scanning.';

  @override
  String get cameraUnsupported =>
      'No camera available on this device, please use a real device or paste the pairing link.';

  @override
  String get scanQRCode => 'Scan to Add Device';

  @override
  String get sessions => 'Sessions';

  @override
  String get archived => 'Archived';

  @override
  String get noArchivedSessions => 'No archived sessions';

  @override
  String get hostOffline => 'Host offline';

  @override
  String get retry => 'Retry';

  @override
  String get noSessions => 'No sessions yet';

  @override
  String get createFirstAgent => 'Create your first agent to get started';

  @override
  String get newAgent => 'New Agent';

  @override
  String get initialPrompt => 'Initial prompt';

  @override
  String get provider => 'Provider';

  @override
  String get workingDirectory => 'Working directory';

  @override
  String get mode => 'Mode';

  @override
  String get modeCode => 'Code';

  @override
  String get modePlan => 'Plan';

  @override
  String get modeAsk => 'Ask';

  @override
  String get thinkingMode => 'Thinking Mode';

  @override
  String get create => 'Create';

  @override
  String get cancel => 'Cancel';

  @override
  String get archive => 'Archive';

  @override
  String get sessionArchived => 'Session archived';

  @override
  String get settings => 'Settings';

  @override
  String get linkNotConfigured =>
      'This link is not configured in the open-source build';

  @override
  String get appearance => 'Appearance';

  @override
  String get systemDefault => 'System default';

  @override
  String get light => 'Light';

  @override
  String get dark => 'Dark';

  @override
  String get host => 'Host';

  @override
  String get connection => 'Connection';

  @override
  String get online => 'Online';

  @override
  String get offline => 'Offline';

  @override
  String get use => 'Use';

  @override
  String get providers => 'Providers';

  @override
  String get noProviders => 'No providers detected';

  @override
  String get available => 'Available';

  @override
  String get diagnostics => 'Diagnostics';

  @override
  String get version => 'Version';

  @override
  String get serverId => 'Server ID';

  @override
  String get connectionState => 'Connection State';

  @override
  String get agentsCount => 'Agents Count';

  @override
  String get removeHost => 'Remove Host';

  @override
  String get remove => 'Remove';

  @override
  String get terminal => 'Terminal';

  @override
  String get newTerminal => 'New';

  @override
  String get selectTerminal => 'Select a terminal to begin';

  @override
  String get files => 'Files';

  @override
  String get name => 'Name';

  @override
  String get size => 'Size';

  @override
  String get modified => 'Modified';

  @override
  String get noFiles => 'No files';

  @override
  String get directory => 'Directory';

  @override
  String get history => 'History';

  @override
  String get active => 'Active';

  @override
  String get noActiveSessions => 'No active sessions';

  @override
  String get pastePairingLink => 'Paste Pairing Link';

  @override
  String get pairHost => 'Pair Host';

  @override
  String get pair => 'Pair';

  @override
  String get filePickerUnavailable =>
      'File picker not available on this platform';

  @override
  String get openFolder => 'Open Folder';

  @override
  String get recentProjects => 'Recent Projects';

  @override
  String get welcomeTitle => 'Welcome to mcoding';

  @override
  String get welcomeSubtitle =>
      'Monitor and control your local AI coding agents';

  @override
  String get onlineHosts => 'My Devices';

  @override
  String get noHostsConfigured => 'No hosts configured yet';

  @override
  String get delete => 'Delete';

  @override
  String get allow => 'Allow';

  @override
  String get deny => 'Deny';

  @override
  String get implement => 'Implement';

  @override
  String get permissionRequest => 'Permission Request';

  @override
  String get plan => 'Plan';

  @override
  String get smsSendFailed => 'Failed to send verification code';

  @override
  String get tokenExpired => 'Token expired';

  @override
  String get refreshTokenFailed => 'Failed to refresh token';

  @override
  String get editLabel => 'Edit Label';

  @override
  String get deleteDevice => 'Delete Device';

  @override
  String confirmDeleteDevice(Object label) {
    return 'Are you sure you want to delete \"$label\"?';
  }

  @override
  String get labelUpdated => 'Label updated';

  @override
  String get deviceDeleted => 'Device deleted';

  @override
  String get enterDeviceName => 'Enter device name';

  @override
  String deleteFailed(Object error) {
    return 'Delete failed: $error';
  }

  @override
  String get deviceName => 'Device Name';

  @override
  String get enterDeviceNameHint => 'Please enter device name';

  @override
  String get save => 'Save';

  @override
  String updateFailed(Object error) {
    return 'Update failed: $error';
  }

  @override
  String get stop => 'Stop';

  @override
  String get projects => 'Projects';

  @override
  String get menu => 'Menu';

  @override
  String get thinking => 'Thinking';

  @override
  String get collapse => 'Collapse';

  @override
  String get expandFullText => 'Expand full text';

  @override
  String get startConversation => 'Start conversation';

  @override
  String get enterYourQuestion => 'Enter your question';

  @override
  String get subscription => 'Subscription';

  @override
  String get subscriptionCenter => 'Subscription Center';

  @override
  String get currentMembership => 'Current Membership';

  @override
  String get freeUser => 'Free User';

  @override
  String get memberUser => 'Member User';

  @override
  String get subscriptionSource => 'Subscription Source';

  @override
  String get notSubscribed => 'Not subscribed';

  @override
  String get appleSubscription => 'Apple Subscription';

  @override
  String get wechatSubscription => 'WeChat Pay Subscription';

  @override
  String get alipaySubscription => 'Alipay Subscription';

  @override
  String get subscriptionDescription =>
      'Apple subscriptions are enabled first. We will add WeChat Pay and Alipay subscriptions next.';

  @override
  String get subscriptionOnlyOnApple =>
      'Apple subscriptions are only available on iPhone, iPad, or Mac App Store builds.';

  @override
  String get appStoreUnavailable =>
      'The App Store is unavailable right now. Please try again later.';

  @override
  String get subscriptionProductsUnavailable =>
      'No subscription products are available. Check your product IDs and App Store Connect setup.';

  @override
  String get activateSubscription => 'Activate Subscription';

  @override
  String get manageSubscription => 'Manage Subscription';

  @override
  String get renewSubscription => 'Renew Subscription';

  @override
  String get subscriptionEntryHint =>
      'View membership, activate Apple subscription, or restore purchases';

  @override
  String get feedback => 'Feedback';

  @override
  String get feedbackEntryHint =>
      'Report issues, suggestions, or product feedback with screenshots';

  @override
  String get feedbackContentLabel => 'Feedback';

  @override
  String get feedbackContentHint =>
      'Describe the issue, improvement idea, or steps to reproduce.';

  @override
  String get feedbackContactLabel => 'Contact';

  @override
  String get feedbackContactHint =>
      'Optional: phone, WeChat, email, or other contact info';

  @override
  String get feedbackScreenshots => 'Screenshots';

  @override
  String get feedbackAddScreenshots => 'Add screenshots';

  @override
  String feedbackImageLimit(int count) {
    return 'Upload up to $count screenshots';
  }

  @override
  String get feedbackEmptyContent => 'Please enter your feedback first';

  @override
  String get feedbackSubmitting => 'Submitting...';

  @override
  String get submitFeedback => 'Submit feedback';

  @override
  String get feedbackSubmitSuccess => 'Feedback submitted. Thank you.';

  @override
  String feedbackSubmitFailed(String error) {
    return 'Failed to submit feedback: $error';
  }

  @override
  String get restorePurchases => 'Restore Purchases';

  @override
  String get restoringPurchases => 'Restoring previous purchases...';

  @override
  String get subscriptionProcessing => 'Processing your subscription result...';

  @override
  String get subscriptionActivated =>
      'Subscription activated and membership updated';

  @override
  String get subscriptionVerifyFailed =>
      'Subscription verification failed. Please try again.';

  @override
  String get subscriptionStartFailed =>
      'Unable to start the subscription purchase. Please try again.';

  @override
  String get purchaseFailed => 'Purchase failed. Please try again.';

  @override
  String get purchaseCanceled => 'Purchase canceled';

  @override
  String get subscriptionExpiresAt => 'Expires At';

  @override
  String get subscriptionLegalNotice =>
      'Subscriptions are charged to your Apple ID and renew automatically under App Store rules. You can cancel in Apple ID subscription settings. Purchasing or restoring purchases means you agree to the Privacy Policy and Terms of Use.';

  @override
  String get weeklyPlan => 'Weekly';

  @override
  String get monthlyPlan => 'Monthly';

  @override
  String get quarterlyPlan => 'Quarterly';

  @override
  String get yearlyPlan => 'Yearly';

  @override
  String get customPlan => 'Custom';

  @override
  String get recommendedPlan => 'Recommended';

  @override
  String get currentPlan => 'Current Plan';

  @override
  String get unlimitedDevices => 'Unlimited Devices';

  @override
  String get unlimitedVoice => 'Unlimited Voice';

  @override
  String get androidPaymentComingSoon => 'Android payment coming soon';

  @override
  String get refresh => 'Refresh';

  @override
  String get selectDirectory => 'Select Directory';

  @override
  String get noMatchingFolders => 'No matching folders';

  @override
  String get noSelectableSubdirectories => 'No selectable subdirectories';

  @override
  String get backToRootDirectory => 'Back to root directory';

  @override
  String get backToParentDirectory => 'Back to parent directory';

  @override
  String get searchFolders => 'Search folders';

  @override
  String get clearSearch => 'Clear search';

  @override
  String get adding => 'Adding';

  @override
  String get confirm => 'Confirm';

  @override
  String projectAdded(Object name) {
    return 'Project added: $name';
  }

  @override
  String addProjectFailed(Object error) {
    return 'Failed to add project: $error';
  }

  @override
  String disconnectAndRemove(String label) {
    return 'Disconnect from \"$label\" and remove it?';
  }

  @override
  String get completionSound => 'Task Completion Sound';

  @override
  String get completionSoundDesc => 'Play a sound when a task is completed';

  @override
  String updateFound(String version) {
    return 'New version available v$version';
  }

  @override
  String get updateContent => 'Release notes:';

  @override
  String packageSize(String size) {
    return 'Package size: $size';
  }

  @override
  String downloadFailed(String error) {
    return 'Download failed: $error';
  }

  @override
  String downloadingProgress(String progress) {
    return 'Downloading... $progress';
  }

  @override
  String get downloadComplete => 'Download complete, tap to install';

  @override
  String get fileNotFound => 'APK file not found, please retry download';

  @override
  String installFailed(Object error) {
    return 'Install failed: $error';
  }

  @override
  String get installLater => 'Install later';

  @override
  String get installNow => 'Install now';

  @override
  String get retryDownload => 'Retry download';

  @override
  String get later => 'Later';

  @override
  String get updateNow => 'Update now';

  @override
  String get unknown => 'Unknown';

  @override
  String get holdToTalk => 'Hold to talk';

  @override
  String holdToTalkCount(int count) {
    return 'Hold to talk (${count}x)';
  }

  @override
  String get replyInProgress => 'Replying, unavailable';

  @override
  String get releaseToCancel => 'Release to cancel';

  @override
  String get releaseToSendSwipeCancel => 'Release to send, swipe up to cancel';

  @override
  String get listening => 'Listening...';

  @override
  String get releaseFingerCancel => 'Release finger to cancel';

  @override
  String get releaseFingerSendSwipeCancel =>
      'Release to send, swipe up to cancel';

  @override
  String get justNow => 'Just now';

  @override
  String minutesAgo(int count) {
    return '$count min ago';
  }

  @override
  String hoursAgo(int count) {
    return '$count hr ago';
  }

  @override
  String daysAgo(int count) {
    return '$count days ago';
  }

  @override
  String get copy => 'Copy';

  @override
  String get quote => 'Quote';

  @override
  String get copied => 'Copied';

  @override
  String get noProviderAvailable =>
      'No provider available on this host. Please install or configure Claude, Codex, or OpenCode first.';

  @override
  String createFailed(String error) {
    return 'Failed to create conversation: $error';
  }

  @override
  String sendFailed(String error) {
    return 'Failed to send message: $error';
  }

  @override
  String changeModeFailed(String error) {
    return 'Failed to change mode: $error';
  }

  @override
  String changeModelFailed(String error) {
    return 'Failed to change model: $error';
  }

  @override
  String changeThinkingFailed(String error) {
    return 'Failed to change thinking: $error';
  }

  @override
  String get providerLockedWarning =>
      'Provider cannot be changed after session creation. Create a new session to select a different provider.';

  @override
  String get newConversation => 'New conversation';

  @override
  String get workspace => 'Workspace';

  @override
  String get voiceLimitReached =>
      'Daily voice limit reached. Upgrade to member for unlimited use';

  @override
  String get voiceTranscriptionApiKey => 'Voice transcription API key';

  @override
  String get voiceTranscriptionApiKeyHint =>
      'Enter your DashScope/Qwen ASR API key here. Voice-to-text stays unavailable until this key is configured.';

  @override
  String get voiceTranscriptionApiKeyMissing =>
      'Please enter a voice transcription API key in Settings first';

  @override
  String get voiceTranscriptionApiKeySaved =>
      'Voice transcription API key saved';

  @override
  String get voiceTranscriptionApiKeyCleared =>
      'Voice transcription API key cleared';

  @override
  String get notConfigured => 'Not configured';

  @override
  String get configure => 'Configure';

  @override
  String get edit => 'Edit';

  @override
  String get clear => 'Clear';

  @override
  String get inputMessage => 'Type a message...';

  @override
  String get addImage => 'Add image';

  @override
  String get stopReply => 'Stop';

  @override
  String get send => 'Send';

  @override
  String get connecting => 'Connecting';

  @override
  String get disconnected => 'Disconnected';

  @override
  String get deleteProjectTitle => 'Delete project?';

  @override
  String confirmDeleteProjectContent(String name) {
    return 'Remove \"$name\" from your projects?\n\nFiles on disk will not be deleted.';
  }

  @override
  String projectDeleted(String name) {
    return 'Project removed: $name';
  }

  @override
  String deleteProjectFailed(String error) {
    return 'Failed to remove project: $error';
  }

  @override
  String get myProjects => 'My Projects';

  @override
  String get addProject => 'Add Project';

  @override
  String get logout => 'Log out';

  @override
  String get deleteAccount => 'Delete Account';

  @override
  String get deleteAccountConfirm =>
      'Deleting your account removes your account, paired devices, membership state, and usage records. This cannot be undone. If you still have an Apple subscription, cancel renewal in Apple ID subscription settings first.';

  @override
  String get confirmDeleteAccount => 'Delete Account';

  @override
  String deleteAccountFailed(String error) {
    return 'Failed to delete account: $error';
  }

  @override
  String get confirmLogout => 'Are you sure you want to log out?';

  @override
  String get checkUpdate => 'Check for updates';

  @override
  String get alreadyLatestVersion => 'Already on the latest version';

  @override
  String checkUpdateFailed(String error) {
    return 'Update check failed: $error';
  }

  @override
  String get deviceAdded => 'Device added successfully';

  @override
  String get deviceLimitTitle => 'Device limit reached';

  @override
  String get freeUserDeviceLimit =>
      'Free users can add up to 1 device. Upgrade to member for unlimited devices';

  @override
  String get gotIt => 'Got it';

  @override
  String get projectList => 'Projects';

  @override
  String get noProjects => 'No projects yet';

  @override
  String get viewAllProjects => 'View all projects';

  @override
  String get newSession => 'New session';

  @override
  String get notifications => 'Notifications';

  @override
  String get notificationDetail => 'Notification Detail';

  @override
  String get noNotifications => 'No notifications';

  @override
  String get markAllRead => 'Mark all read';

  @override
  String get allNotificationsRead => 'All notifications marked as read';

  @override
  String get notificationTypeSystem => 'System';

  @override
  String get notificationTypeUpdate => 'Update';

  @override
  String get notificationTypePromotion => 'Promotion';

  @override
  String get notificationTypeAccount => 'Account';

  @override
  String get yesterday => 'Yesterday';

  @override
  String get shareToWechat => 'Share to Friends';

  @override
  String get shareWebPageDesc =>
      'MCoding - Remote AI coding assistant, control your code from anywhere';
}
