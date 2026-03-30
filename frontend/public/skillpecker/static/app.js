const views = ["home", "scan", "library"];

const state = {
  view: "home",
  language: "en",
  theme: "light",
  jobs: [],
  scanUploadMode: "archive",
  expandedSkillKey: null,
  resultModalJobId: null,
  jobDetails: {},
  skillDetails: {},
  libraryItems: [],
  libraryDetails: {},
  libraryLoadedOnce: false,
  libraryPage: 1,
  libraryPageSize: 20,
  libraryTotal: 0,
  libraryTotalPages: 0,
  libraryQuery: "",
  libraryDecisionLevels: [],
  libraryLoading: false,
  libraryLoadingKind: "",
  expandedLibraryId: null,
  scanSubmitting: false,
  modalSkillNavScrollTop: 0,
  modalFindingScrollTop: 0,
  modalScrollSkillKey: null,
};

const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures.
    }
  },
};

const archiveInput = document.getElementById("archiveInput");
const directoryInput = document.getElementById("directoryInput");
const packageSelectionList = document.getElementById("packageSelectionList");
const packagePickerValue = document.getElementById("packagePickerValue");
const packagePickerTrigger = document.getElementById("packagePickerTrigger");
const packageModeBadge = document.getElementById("packageModeBadge");
const packageUploadTitle = document.getElementById("packageUploadTitle");
const uploadModeHint = document.getElementById("uploadModeHint");
const selectedPackageCaption = document.getElementById("selectedPackageCaption");
const packageUploadTile = document.getElementById("packageUploadTile");
const archiveUploadIcon = document.getElementById("archiveUploadIcon");
const directoryUploadIcon = document.getElementById("directoryUploadIcon");
const scanForm = document.getElementById("scanForm");
const submitButton = document.getElementById("submitButton");
const healthMode = document.getElementById("healthMode");
const storageInfo = document.getElementById("storageInfo");
const queueRunningPill = document.getElementById("queueRunningPill");
const queueWaitingPill = document.getElementById("queueWaitingPill");
const queueDonePill = document.getElementById("queueDonePill");
const queueSummaryPill = document.getElementById("queueSummaryPill");
const scanTreeEmpty = document.getElementById("scanTreeEmpty");
const scanTreeList = document.getElementById("scanTreeList");
const topbarShell = document.querySelector(".topbar-shell");
const languageToggle = document.getElementById("languageToggle");
const themeToggle = document.getElementById("themeToggle");
const libraryCountPill = document.getElementById("libraryCountPill");
const libraryMaliciousPill = document.getElementById("libraryMaliciousPill");
const libraryRootInfo = document.getElementById("libraryRootInfo");
const libraryList = document.getElementById("libraryList");
const librarySearchForm = document.getElementById("librarySearchForm");
const librarySearchInput = document.getElementById("librarySearchInput");
const librarySearchButton = document.getElementById("librarySearchButton");
const libraryDecisionFilterLabel = document.getElementById("libraryDecisionFilterLabel");
const libraryDecisionFilterInputs = Array.from(document.querySelectorAll("[data-decision-filter]"));
const librarySearchMeta = document.getElementById("librarySearchMeta");
const libraryPageIndicator = document.getElementById("libraryPageIndicator");
  const libraryPaginationNumbers = document.getElementById("libraryPaginationNumbers");
const libraryPaginationPrev = document.getElementById("libraryPaginationPrev");
const libraryPaginationNext = document.getElementById("libraryPaginationNext");
const scanResultModal = document.getElementById("scanResultModal");
const scanResultModalBody = document.getElementById("scanResultModalBody");
const scanResultModalClose = document.getElementById("scanResultModalClose");
const scanStepFlow = document.getElementById("scanStepFlow");
const scanStepCards = Array.from(document.querySelectorAll("[data-step-card]"));
const homeResultsSection = document.getElementById("homeResultsSection");
const homeResultsTitle = document.getElementById("homeResultsTitle");
const homeResultsCopy = document.getElementById("homeResultsCopy");
const homeResultsPill = document.getElementById("homeResultsPill");
const homeResultsEmpty = document.getElementById("homeResultsEmpty");
const homeResultsList = document.getElementById("homeResultsList");
const homeScrollCueLabel = document.getElementById("homeScrollCueLabel");
const homeStageNavHero = document.getElementById("homeStageNavHero");
const homeStageNavAnalytics = document.getElementById("homeStageNavAnalytics");
const homeStageNavResults = document.getElementById("homeStageNavResults");
const appDialog = document.getElementById("appDialog");
const appDialogPanel = appDialog?.querySelector(".app-dialog-panel") || null;
const appDialogEyebrow = document.getElementById("appDialogEyebrow");
const appDialogTitle = document.getElementById("appDialogTitle");
const appDialogMessage = document.getElementById("appDialogMessage");
const appDialogActions = document.getElementById("appDialogActions");
const appDialogClose = document.getElementById("appDialogClose");
const uploadModeButtons = Array.from(document.querySelectorAll("[data-upload-mode]"));

let appDialogResolve = null;
let appDialogRestoreFocus = null;
let syncHomeStageState = () => {};

const verdictLabelMap = {
  malicious: "Malicious",
  unsafe: "Suspicious",
  mixed_risk: "Suspicious",
  description_unreliable: "Suspicious",
  insufficient_evidence: "Suspicious",
  clean_with_reservations: "Safe",
};

const verdictClassMap = {
  malicious: "verdict-malicious",
  unsafe: "verdict-suspicious",
  mixed_risk: "verdict-suspicious",
  description_unreliable: "verdict-suspicious",
  insufficient_evidence: "verdict-suspicious",
  clean_with_reservations: "verdict-safe",
};

const severityLabelMap = {
  critical: "Critical",
  high: "High",
  med: "Medium",
  low: "Low",
};

const toolbarIconMarkup = {
  language: `
    <span class="toolbar-toggle-glyph toolbar-toggle-glyph-language" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="8.5"></circle>
        <path d="M3.8 12h16.4"></path>
        <path d="M12 3.5c2.2 2.4 3.4 5.34 3.4 8.5S14.2 18.1 12 20.5"></path>
        <path d="M12 3.5c-2.2 2.4-3.4 5.34-3.4 8.5S9.8 18.1 12 20.5"></path>
      </svg>
    </span>
  `,
  themeDark: `
    <span class="toolbar-toggle-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a6.8 6.8 0 1 0 9.8 9.8z"></path>
      </svg>
    </span>
  `,
  themeLight: `
    <span class="toolbar-toggle-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.5v2.4"></path>
        <path d="M12 19.1v2.4"></path>
        <path d="m4.93 4.93 1.7 1.7"></path>
        <path d="m17.37 17.37 1.7 1.7"></path>
        <path d="M2.5 12h2.4"></path>
        <path d="M19.1 12h2.4"></path>
        <path d="m4.93 19.07 1.7-1.7"></path>
        <path d="m17.37 6.63 1.7-1.7"></path>
      </svg>
    </span>
  `,
};

const translations = {
  en: {
    "document.title": "SkillPecker | Agent Skill Trusted Security Detection",
    "nav.home": "Home",
    "nav.scan": "Skill Scan",
    "nav.library": "Malicious Skill Library",
    "toggle.language": "中文",
    "toggle.languageAria": "Switch to Chinese",
    "toggle.theme.light": "Light",
    "toggle.theme.dark": "Dark",
    "toggle.themeAria": "Switch color theme",
    "home.titleHtml": "SkillPecker",
    "home.subhead": "Security and trust detection suite for Agent Skills",
    "home.subtitleHtml": "Based on user-intent parsing and behavior analysis, precisely identify permission abuse, covert data access, and potential malicious paths",
    "home.descriptionHtml": "Upload a Skill package, run one-click scanning, and automatically generate reproducible security reports and samples",
    "home.actionPlaceholder": "Upload your Agent Skill and start a security check!",
    "home.libraryBtn": "Library",
    "home.scanBtn": "Open Console",
    "home.bento.queueTitle": "Async Job Queue",
    "home.bento.queueDesc": "Submit multiple Skill scanning jobs in batch, with automatic queueing and execution.",
    "home.bento.drillTitle": "Intent-Driven Detection",
    "home.bento.drillDesc": "Analyze Skill behavior against the user’s original intent to identify deviations.",
    "home.bento.libraryTitle": "Persistent Sample Repository",
    "home.bento.libraryDesc": "Support search, reproduction and security auditing.",
    "home.results.title": "Latest scan results",
    "home.results.emptyTitle": "No completed jobs yet",
    "home.results.emptyCopy": "Completed scan jobs will appear here automatically.",
    "home.results.count": "{count} Results",
    "home.scrollCue": "Scroll to analytics",
    "home.stage.nav.hero": "Home",
    "home.stage.nav.analytics": "Analytics",
    "home.stage.nav.results": "Results",
    "scan.title.1": "Scan",
    "scan.title.2": "skill",
    "scan.title.3": "packages",
    "scan.copy": "Upload a ZIP bundle or local folder",
    "scan.status.running": "Running",
    "scan.status.queued": "Queued",
    "scan.status.completed": "Completed",
    "scan.step.1.title": "Choose input",
    "scan.step.1.desc": "ZIP archive or local folder.",
    "scan.step.2.title": "Queue scan",
    "scan.step.2.desc": "Send the package into review.",
    "scan.step.3.title": "Inspect results",
    "scan.step.3.desc": "Open findings in the result module.",
    "scan.upload.eyebrow": "Upload Station",
    "scan.upload.title": "New scan job",
    "scan.upload.archive": "ZIP archive",
    "scan.upload.folder": "Folder",
    "scan.selectedPackage": "Selected package",
    "scan.start": "Start Scan",
    "scan.liveQueue": "Live Queue",
    "scan.jobQueue": "Job Queue",
    "scan.emptyTitle": "No jobs yet",
    "scan.emptyCopy": "Upload a ZIP bundle or folder above.",
    "scan.resultModal": "Scan Result",
    "common.close": "Close",
    "library.title": "Malicious Skill Library",
    "library.searchPlaceholder": "Search by skill name...",
    "library.search": "Search",
    "library.decisionFilter": "Decision Level",
    "library.previous": "Previous",
    "library.next": "Next",
    "library.matched": "Matched {count}",
    "library.range": "{start}-{end} / {total}",
    "library.noResults": "No results",
    "library.showing": "Showing {start}-{end} of {total}",
    "library.showingEmpty": "Showing 0-0 of 0",
    "library.searchingSkills": "Searching skills",
    "library.loading": "Loading library",
    "library.searchingFor": "Searching for \"{query}\"...",
    "library.loadingCopy": "Loading library...",
    "library.loadingScanDetails": "Loading scan details...",
    "library.loadingSkillDetails": "Loading skill details...",
    "library.loadFailed": "Failed to load library",
    "library.emptyTitle": "Library is empty",
    "library.emptyCopy": "The malicious skill library is empty.",
    "library.noMatchTitle": "No matches",
    "library.noMatchCopy": "No skills matched \"{query}\".",
    "library.scanResult": "Scan Result",
    "library.skillDoc": "SKILL.md",
    "library.noSkillDoc": "No SKILL.md content.",
    "library.noScanRecordsYet": "This skill has no scan records yet.",
    "library.hint.expand": "Click to view scan result and evidence",
    "library.hint.collapse": "Collapse to hide scan details",
    "library.action.expand": "View scan result",
    "library.action.collapse": "Collapse details",
    "library.skillLabel": "SKILL",
    "library.unclassified": "Unclassified",
    "library.unscanned": "Unscanned",
    "library.primaryClassification": "Primary Classification",
    "library.secondaryClassification": "Secondary Classification",
    "library.sourcePlatform": "Source Platform",
    "library.relatedFiles": "Related Files",
    "library.scanConclusion": "Problem Description",
    "library.riskTypes": "Risk Types",
    "library.triggeredFlags": "Triggered Flags",
    "library.unknownScan": "Unknown Scan",
    "library.noSummary": "No summary available.",
    "library.platform.marketplace": "Marketplace",
    "dialog.systemNotice": "System Notice",
    "dialog.title": "Scan station notice",
    "dialog.message": "Message",
    "dialog.acknowledge": "Acknowledge",
    "common.unknownError": "Unknown error",
    "dialog.understood": "Understood",
    "dialog.uploadRequired": "Upload Required",
    "dialog.chooseInput": "Choose an input package",
    "dialog.chooseInputMessage": "Upload a ZIP bundle or select a local skill folder before starting the scan.",
    "dialog.submissionFailed": "Submission Failed",
    "dialog.scanNotSubmitted": "Scan job was not submitted",
    "upload.archiveBadge": "Archive Input",
    "upload.folderBadge": "Directory Input",
    "upload.archiveTitle": "Upload ZIP bundle",
    "upload.folderTitle": "Upload skill folder",
    "upload.archiveHint": "Submit one ZIP archive for one or many skills.",
    "upload.folderHint": "Select one local skill folder and keep its structure.",
    "upload.archiveCaption": "ZIP archive",
    "upload.folderCaption": "Folder package",
    "upload.chooseZip": "Choose ZIP file",
    "upload.chooseFolder": "Choose folder",
    "upload.noPackage": "No package selected.",
    "upload.noFolder": "No folder selected",
    "upload.noFile": "No file selected",
    "upload.filesSelected": "{count} files selected",
    "upload.foldersSelected": "{count} folders selected",
    "upload.files": "{count} files",
    "upload.submitting": "Submitting...",
    "queue.jobs": "{count} Jobs",
    "queue.job": "Job",
    "queue.skill": "Skill",
    "queue.openResults": "Open results",
    "queue.skills": "Skills {count}",
    "queue.queuePosition": "Queue #{position}",
    "queue.noSkillResults": "This job does not have any skill results yet.",
    "queue.selected": "Selected",
    "queue.inspectFindings": "Inspect findings",
    "queue.loadingJobDetails": "Loading job details...",
    "queue.queuedMessage": "This job is queued and will start after the jobs ahead of it finish.",
    "queue.runningMessage": "The scan is running. Skill results will appear here automatically when they are ready.",
    "queue.failedPrefix": "The job failed: {error}",
    "queue.skillFailed": "Scan failed: {error}",
    "queue.selectSkill": "Select a skill to inspect its findings.",
    "queue.jobSummary": "Job Summary",
    "queue.skillsPanel": "Skills",
    "queue.scanResult": "Scan Result",
    "queue.scannedReady": "{count} scanned skills are ready in this job.",
    "summary.skillsInJob": "{count} skills in this job",
    "summary.malicious": "{count} malicious",
    "summary.safe": "{count} safe",
    "summary.suspicious": "{count} suspicious",
    "status.queued": "Queued",
    "status.running": "Running",
    "status.completed": "Completed",
    "status.failed": "Failed",
    "verdict.safe": "Safe",
    "verdict.suspicious": "Suspicious",
    "verdict.malicious": "Malicious",
    "finding.none": "No findings available.",
    "finding.loading": "Loading scan result...",
    "finding.noResult": "This skill has no scan result to display.",
    "finding.failedTitle": "Scan failed",
    "finding.failedCopy": "The backend could not produce a scan result for this skill.",
    "finding.skillFindings": "Skill Findings",
    "finding.availableCount": "{count} findings available for review.",
    "finding.noneForSkill": "No findings available for this skill.",
    "finding.impact": "Impact / Original Verdict",
    "finding.remediation": "Remediation",
    "finding.evidence": "Evidence",
    "finding.noNote": "No additional note",
    "finding.unnamed": "Unnamed finding",
    "finding.confidence": "Confidence",
    "finding.confidence.high": "High",
    "finding.confidence.medium": "Medium",
    "finding.confidence.low": "Low",
    "finding.meta.scan": "Scan",
    "finding.meta.group": "Group",
    "finding.meta.platform": "Platform",
    "finding.meta.source": "Source",
    "finding.meta.files": "Files",
    "finding.meta.category": "Category",
    "finding.meta.class": "Class",
    "finding.meta.risk": "Risk",
    "metric.maliciousness": "Maliciousness",
    "metric.safety": "Safety",
    "metric.description": "Description",
    "metric.coverage": "Coverage",
  },
  zh: {
    "document.title": "SkillPecker | 智能体Skill可信安全检测",
    "nav.home": "首页",
    "nav.scan": "技能扫描",
    "nav.library": "恶意技能库",
    "toggle.language": "EN",
    "toggle.languageAria": "切换到英文",
    "toggle.theme.light": "浅色",
    "toggle.theme.dark": "深色",
    "toggle.themeAria": "切换页面主题",
    "home.titleHtml": "SkillPecker",
    "home.subhead": "面向 Agent Skill 的安全可信检测套件",
    "home.subtitleHtml": "基于用户意图解析与行为分析，精准识别权限滥用、隐蔽数据访问与潜在恶意路径",
    "home.descriptionHtml": "上传 Skill 包，一键扫描，自动生成可复现的安全风险报告与样本",
    "home.actionPlaceholder": "上传你的 Agent Skill，开始一次安全体检吧！",
    "home.libraryBtn": "样本库",
    "home.scanBtn": "进入控制台",
    "home.bento.queueTitle": "异步任务队列",
    "home.bento.queueDesc": "支持批量提交 Skill 扫描任务，自动排队执行；后台持续处理，无需等待，结果实时返回",
    "home.bento.drillTitle": "意图驱动检测",
    "home.bento.drillDesc": "从用户原始意图出发，识别 Skill 的偏离行为；捕捉隐式执行、越权访问与异常调用路径",
    "home.bento.libraryTitle": "持久化样本库",
    "home.bento.libraryDesc": "自动沉淀检测结果与恶意样本；支持检索、复现与安全审计，构建专属威胁知识库",
    "home.results.title": "最新扫描结果",
    "home.results.emptyTitle": "暂无已完成任务",
    "home.results.emptyCopy": "完成的扫描任务会自动显示在这里。",
    "home.results.count": "{count} 条结果",
    "home.scrollCue": "下滑查看数据概览",
    "home.stage.nav.hero": "首页",
    "home.stage.nav.analytics": "数据",
    "home.stage.nav.results": "结果",
    "scan.title.1": "技能",
    "scan.title.2": "",
    "scan.title.3": "扫描",
    "scan.copy": "上传 ZIP 压缩包或本地文件夹",
    "scan.status.running": "运行中",
    "scan.status.queued": "队列中",
    "scan.status.completed": "已完成",
    "scan.step.1.title": "选择输入",
    "scan.step.1.desc": "ZIP 压缩包或本地文件夹。",
    "scan.step.2.title": "加入队列",
    "scan.step.2.desc": "将技能包发送到扫描流程。",
    "scan.step.3.title": "查看结果",
    "scan.step.3.desc": "在结果模块中打开扫描发现。",
    "scan.upload.eyebrow": "上传工作站",
    "scan.upload.title": "新建扫描任务",
    "scan.upload.archive": "ZIP 压缩包",
    "scan.upload.folder": "文件夹",
    "scan.selectedPackage": "已选包",
    "scan.start": "开始扫描",
    "scan.liveQueue": "实时队列",
    "scan.jobQueue": "任务队列",
    "scan.emptyTitle": "暂无任务",
    "scan.emptyCopy": "请先在上方上传 ZIP 包或文件夹。",
    "scan.resultModal": "扫描结果",
    "common.close": "关闭",
    "library.title": "恶意技能库",
    "library.searchPlaceholder": "按技能名称搜索...",
    "library.search": "搜索",
    "library.decisionFilter": "判定级别",
    "library.previous": "上一页",
    "library.next": "下一页",
    "library.matched": "匹配 {count}",
    "library.range": "{start}-{end} / {total}",
    "library.noResults": "暂无结果",
    "library.showing": "显示第 {start}-{end} 条，共 {total} 条",
    "library.showingEmpty": "显示第 0-0 条，共 0 条",
    "library.searchingSkills": "正在搜索技能",
    "library.loading": "正在加载恶意技能库",
    "library.searchingFor": "正在搜索“{query}”...",
    "library.loadingCopy": "正在加载恶意技能库...",
    "library.loadingScanDetails": "正在加载扫描详情...",
    "library.loadingSkillDetails": "正在加载技能详情...",
    "library.loadFailed": "加载恶意技能库失败",
    "library.emptyTitle": "恶意技能库为空",
    "library.emptyCopy": "当前恶意技能库中还没有任何技能。",
    "library.noMatchTitle": "未找到匹配项",
    "library.noMatchCopy": "没有匹配“{query}”的技能。",
    "library.scanResult": "扫描结果",
    "library.skillDoc": "技能文档",
    "library.noSkillDoc": "暂无 SKILL.md 内容。",
    "library.noScanRecordsYet": "该技能暂时还没有扫描记录。",
    "library.hint.expand": "点击查看扫描结果和依据",
    "library.hint.collapse": "收起以隐藏扫描详情",
    "library.action.expand": "查看扫描结果",
    "library.action.collapse": "收起详情",
    "library.skillLabel": "技能",
    "library.unclassified": "未分类",
    "library.unscanned": "未扫描",
    "library.primaryClassification": "主分类",
    "library.secondaryClassification": "次分类",
    "library.sourcePlatform": "来源平台",
    "library.relatedFiles": "关联文件",
    "library.scanConclusion": "问题描述",
    "library.riskTypes": "风险类型",
    "library.triggeredFlags": "触发标记",
    "library.unknownScan": "未知扫描",
    "library.noSummary": "暂无摘要。",
    "library.platform.marketplace": "应用市场",
    "dialog.systemNotice": "系统提示",
    "dialog.title": "扫描站通知",
    "dialog.message": "消息内容",
    "dialog.acknowledge": "知道了",
    "common.unknownError": "未知错误",
    "dialog.understood": "明白",
    "dialog.uploadRequired": "需要上传内容",
    "dialog.chooseInput": "请选择输入包",
    "dialog.chooseInputMessage": "请先上传 ZIP 包或选择本地技能文件夹，然后再开始扫描。",
    "dialog.submissionFailed": "提交失败",
    "dialog.scanNotSubmitted": "扫描任务未能提交",
    "upload.archiveBadge": "压缩包输入",
    "upload.folderBadge": "目录输入",
    "upload.archiveTitle": "上传 ZIP 包",
    "upload.folderTitle": "上传技能文件夹",
    "upload.archiveHint": "可提交一个 ZIP 压缩包，包含一个或多个技能。",
    "upload.folderHint": "选择一个本地技能文件夹，并保留其目录结构。",
    "upload.archiveCaption": "ZIP 压缩包",
    "upload.folderCaption": "文件夹包",
    "upload.chooseZip": "选择 ZIP 文件",
    "upload.chooseFolder": "选择文件夹",
    "upload.noPackage": "尚未选择任何包。",
    "upload.noFolder": "尚未选择文件夹",
    "upload.noFile": "尚未选择文件",
    "upload.filesSelected": "已选择 {count} 个文件",
    "upload.foldersSelected": "已选择 {count} 个文件夹",
    "upload.files": "{count} 个文件",
    "upload.submitting": "提交中...",
    "queue.jobs": "{count} 个任务",
    "queue.job": "任务",
    "queue.skill": "技能",
    "queue.openResults": "查看结果",
    "queue.skills": "技能 {count}",
    "queue.queuePosition": "队列 #{position}",
    "queue.noSkillResults": "该任务暂时还没有技能结果。",
    "queue.selected": "已选中",
    "queue.inspectFindings": "查看发现",
    "queue.loadingJobDetails": "正在加载任务详情...",
    "queue.queuedMessage": "该任务正在排队中，会在前面的任务完成后自动开始。",
    "queue.runningMessage": "扫描正在进行中，技能结果准备好后会自动出现在这里。",
    "queue.failedPrefix": "任务失败：{error}",
    "queue.skillFailed": "扫描失败：{error}",
    "queue.selectSkill": "请选择一个技能以查看它的扫描结果。",
    "queue.jobSummary": "任务摘要",
    "queue.skillsPanel": "技能列表",
    "queue.scanResult": "扫描结果",
    "queue.scannedReady": "该任务已有 {count} 个技能完成扫描。",
    "summary.skillsInJob": "该任务包含 {count} 个技能",
    "summary.malicious": "{count} 个恶意",
    "summary.safe": "{count} 个安全",
    "summary.suspicious": "{count} 个可疑",
    "status.queued": "排队中",
    "status.running": "运行中",
    "status.completed": "已完成",
    "status.failed": "失败",
    "verdict.safe": "安全",
    "verdict.suspicious": "可疑",
    "verdict.malicious": "恶意",
    "finding.none": "暂无扫描发现。",
    "finding.loading": "正在加载扫描结果...",
    "finding.noResult": "该技能暂无可展示的扫描结果。",
    "finding.failedTitle": "扫描失败",
    "finding.failedCopy": "后端未能为该技能生成扫描结果。",
    "finding.skillFindings": "技能发现",
    "finding.availableCount": "共有 {count} 条发现可供审查。",
    "finding.noneForSkill": "该技能暂无扫描发现。",
    "finding.impact": "影响 / 原始判定",
    "finding.remediation": "修复建议",
    "finding.evidence": "证据",
    "finding.noNote": "暂无补充说明",
    "finding.unnamed": "未命名发现",
    "finding.confidence": "置信度",
    "finding.confidence.high": "高",
    "finding.confidence.medium": "中",
    "finding.confidence.low": "低",
    "finding.meta.scan": "扫描",
    "finding.meta.group": "分组",
    "finding.meta.platform": "平台",
    "finding.meta.source": "来源",
    "finding.meta.files": "文件",
    "finding.meta.category": "类别",
    "finding.meta.class": "分类",
    "finding.meta.risk": "风险",
    "metric.maliciousness": "恶意度",
    "metric.safety": "安全度",
    "metric.description": "描述可靠性",
    "metric.coverage": "覆盖度",
  },
};

const verdictTextKeyMap = {
  malicious: "verdict.malicious",
  unsafe: "verdict.suspicious",
  mixed_risk: "verdict.suspicious",
  description_unreliable: "verdict.suspicious",
  insufficient_evidence: "verdict.suspicious",
  clean_with_reservations: "verdict.safe",
};

const localizedCategoryMap = {
  academic: { zh: "学术" },
  ai_engineering: { zh: "AI 工程" },
  architecture_patterns: { zh: "架构模式" },
  astronomy_physics: { zh: "天文物理" },
  automation_tools: { zh: "自动化工具" },
  backend: { zh: "后端" },
  bioinformatics: { zh: "生物信息" },
  blockchain: { zh: "区块链" },
  business: { zh: "商业" },
  business_apps: { zh: "商业应用" },
  cicd: { zh: "CI/CD" },
  cli_tools: { zh: "CLI 工具" },
  cms_platforms: { zh: "CMS 平台" },
  code_quality: { zh: "代码质量" },
  computational_chemistry: { zh: "计算化学" },
  content_media: { zh: "内容媒体" },
  data_ai: { zh: "数据智能" },
  databases: { zh: "数据库" },
  debugging: { zh: "调试" },
  design: { zh: "设计" },
  development: { zh: "开发" },
  devops: { zh: "运维" },
  documentation: { zh: "文档" },
  documents: { zh: "文档处理" },
  domain_utilities: { zh: "域名工具" },
  ecommerce: { zh: "电商" },
  ecommerce_development: { zh: "电商开发" },
  education: { zh: "教育" },
  examples: { zh: "示例" },
  finance_investment: { zh: "金融投资" },
  fixtures: { zh: "样例数据" },
  framework_internals: { zh: "框架内部" },
  frontend: { zh: "前端" },
  gaming: { zh: "游戏" },
  health_fitness: { zh: "健康健身" },
  ide_plugins: { zh: "IDE 插件" },
  knowledge_base: { zh: "知识库" },
  lab_tools: { zh: "实验工具" },
  lifestyle: { zh: "生活方式" },
  literature_writing: { zh: "文学写作" },
  llm_ai: { zh: "大模型/AI" },
  media: { zh: "媒体" },
  mobile: { zh: "移动端" },
  monitoring: { zh: "监控" },
  other: { zh: "其他" },
  package_distribution: { zh: "包分发" },
  productivity_tools: { zh: "生产力工具" },
  project_management: { zh: "项目管理" },
  research: { zh: "研究" },
  sales_marketing: { zh: "销售营销" },
  scientific_computing: { zh: "科学计算" },
  scripting: { zh: "脚本" },
  shelby: { zh: "Shelby" },
  skills: { zh: "技能" },
  skills_index: { zh: "技能索引" },
  smart_contracts: { zh: "智能合约" },
  stack_evaluation: { zh: "技术栈评估" },
  technical_docs: { zh: "技术文档" },
  test_fixtures: { zh: "测试样例" },
  testing: { zh: "测试" },
  testing_security: { zh: "测试安全" },
  tools: { zh: "工具" },
  news: { zh: "新闻" },
  unknown: { zh: "未知" },
  malicious: { zh: "恶意" },
  unsafe: { zh: "不安全" },
  description: { zh: "描述不可靠" },
  active_malice: { zh: "明确恶意行为" },
  collection_of_web_shells: { zh: "Web Shell 收集" },
  installation: { zh: "安装" },
  authentication: { zh: "认证" },
  permission: { zh: "权限" },
  privacy: { zh: "隐私" },
  network: { zh: "网络" },
  execution: { zh: "执行" },
  shell: { zh: "Shell 执行" },
  marketplace: { zh: "应用市场" },
  clawhub: { zh: "Clawhub 平台" },
  permission_overreach: { zh: "权限越界" },
  wellness_health: { zh: "健康" },
  permission_overreach_action: { zh: "权限越界操作" },
  architecture_patterns: { zh: "架构模式" },
  access_boundary_risk: { zh: "访问边界风险" },
  data_exfiltration: { zh: "数据外传" },
  security_risk: { zh: "安全风险" },
  privilege_escalation: { zh: "权限提升" },
  execution_system_risk: { zh: "执行系统风险" },
  data_over_collection: { zh: "数据过度收集" },
  data_governance_risk: { zh: "数据治理风险" },
  privacy_violation: { zh: "隐私违规" },
  trojan_downloader: { zh: "木马下载/投毒" },
  reverse_shell: { zh: "反连/远控" },
  evasion_technique: { zh: "规避与混淆" },
  capability_gap: { zh: "能力缺口" },
  credential_handling: { zh: "凭证处理" },
  credential_theft: { zh: "凭证窃取" },
  input_validation: { zh: "输入校验" },
  insecure_credential_storage: { zh: "不安全凭证存储" },
  insecure_installation: { zh: "不安全安装" },
  misleading_authentication: { zh: "误导性认证" },
  missing_executable_code: { zh: "缺少可执行实现" },
  subprocess: { zh: "子进程执行" },
  supply_chain: { zh: "供应链" },
  supply_chain_attack: { zh: "供应链攻击" },
};

const localizedFlagMap = {
  permission_overreach: { zh: "权限越界" },
  data_over_collection: { zh: "数据过度收集" },
  privilege_escalation: { zh: "权限提升" },
  privacy_violation: { zh: "隐私违规" },
  data_exfiltration: { zh: "数据外传" },
  trojan_downloader: { zh: "木马下载/投毒" },
  reverse_shell: { zh: "反连/远控" },
  evasion_technique: { zh: "规避与混淆" },
  supply_chain_attack: { zh: "供应链攻击" },
  browser_session_or_credentials: { zh: "浏览器会话或凭证" },
  filesystem_access: { zh: "文件系统访问" },
  credential_request: { zh: "凭证请求" },
  api_key: { zh: "API 密钥" },
  autonomous_execution: { zh: "自主执行" },
  driver_or_installer: { zh: "驱动或安装器" },
  external_server: { zh: "外部服务器" },
  obfuscation_or_evasion: { zh: "混淆或规避" },
  persistence_or_external_storage: { zh: "持久化或外部存储" },
};

localizedFlagMap.shell_or_command_execution = { zh: "Shell \u6216\u547d\u4ee4\u6267\u884c" };

const localizedScanLevelMap = {
  script_scan: { zh: "\u811a\u672c\u626b\u63cf" },
  description_scan: { zh: "\u63cf\u8ff0\u626b\u63cf" },
};

const localizedDecisionLevelMap = {
  SAFE: { en: "SAFE", zh: "安全" },
  SUSPICIOUS: { en: "SUSPICIOUS", zh: "可疑型" },
  MALICIOUS: { en: "MALICIOUS", zh: "恶意型" },
  OVERREACH: { en: "OVERREACH", zh: "越界型" },
  UNKNOWN: { en: "UNKNOWN", zh: "未知" },
};

const localizedMarkdownFieldMap = {
  name: { zh: "名称" },
  description: { zh: "描述" },
  category: { zh: "分类" },
  tags: { zh: "标签" },
  version: { zh: "版本" },
  author: { zh: "作者" },
};

function t(key, variables = {}) {
  const table = translations[state.language] || translations.en;
  const fallback = translations.en[key] || key;
  const template = table[key] || fallback;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? ""));
}

function normalizeLookupKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[()/]/g, " ")
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function localizeCategoryLabel(value) {
  const key = normalizeLookupKey(value);
  if (!key) {
    return t("library.unclassified");
  }
  const localized = localizedCategoryMap[key]?.[state.language];
  return localized || humanizeCategory(value);
}

function localizeDecisionLevel(level) {
  const key = String(level || "UNKNOWN").trim().toUpperCase();
  return localizedDecisionLevelMap[key]?.[state.language] || key;
}

function normalizeDecisionLevels(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim().toUpperCase()).filter(Boolean))].sort();
}

function areDecisionLevelsEqual(left, right) {
  const a = normalizeDecisionLevels(left);
  const b = normalizeDecisionLevels(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function localizeScanLevel(value) {
  const key = normalizeLookupKey(value);
  return localizedScanLevelMap[key]?.[state.language] || value;
}

function localizeSeverity(value) {
  const key = normalizeLookupKey(value);
  const normalized = {
    critical: "critical",
    high: "high",
    med: "medium",
    medium: "medium",
    low: "low",
  }[key];
  if (!normalized) {
    return value;
  }
  if (state.language === "zh") {
    return {
      critical: "严重",
      high: "高",
      medium: "中",
      low: "低",
    }[normalized];
  }
  return {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  }[normalized];
}

function localizeConfidence(value) {
  const key = normalizeLookupKey(value);
  return (
    {
      high: t("finding.confidence.high"),
      med: t("finding.confidence.medium"),
      medium: t("finding.confidence.medium"),
      low: t("finding.confidence.low"),
    }[key] || value
  );
}

function formatSkillStats(artifactCount, ruleHitCount) {
  if (state.language === "zh") {
    return `${artifactCount ?? 0} 个制品 · ${ruleHitCount ?? 0} 条规则命中`;
  }
  return `${artifactCount ?? 0} artifacts · ${ruleHitCount ?? 0} rules matched`;
}

function getSkillWord(count, { capitalize = false } = {}) {
  if (state.language === "zh") {
    return "技能";
  }
  const word = Number(count) === 1 ? "skill" : "skills";
  return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function formatSkillCount(count, { capitalize = true } = {}) {
  if (state.language === "zh") {
    return `技能 ${count ?? 0}`;
  }
  return `${getSkillWord(count, { capitalize })} ${count ?? 0}`;
}

function formatSkillsPanelTitle(count) {
  if (state.language === "zh") {
    return t("queue.skillsPanel");
  }
  return getSkillWord(count, { capitalize: true });
}

function formatScannedReady(count) {
  if (state.language === "zh") {
    return t("queue.scannedReady", { count });
  }
  return `${count} scanned ${getSkillWord(count)} ${Number(count) === 1 ? "is" : "are"} ready in this job.`;
}

function formatSkillsInJob(count) {
  if (state.language === "zh") {
    return t("summary.skillsInJob", { count });
  }
  return `${count} ${getSkillWord(count)} in this job`;
}

function localizeMarkdownFieldLabel(key) {
  const normalized = String(key || "").trim().toLowerCase();
  return localizedMarkdownFieldMap[normalized]?.[state.language] || key;
}

function localizeMarkdownFieldValue(key, value) {
  const normalized = String(key || "").trim().toLowerCase();
  if (normalized === "category") {
    return localizeCategoryLabel(value);
  }
  if (normalized === "tags") {
    return String(value || "")
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => localizeCategoryLabel(item))
      .join(" / ");
  }
  return value;
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setToolbarToggleContent(button, { icon, label, stateValue }) {
  if (!button) {
    return;
  }

  button.dataset.icon = icon;
  if (stateValue) {
    button.dataset.state = stateValue;
  } else {
    delete button.dataset.state;
  }
  button.innerHTML = `${toolbarIconMarkup[stateValue] || toolbarIconMarkup[icon] || ""}<span class="sr-only">${escapeHtml(label)}</span>`;
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

function syncToolbarToggles() {
  setToolbarToggleContent(languageToggle, {
    icon: "language",
    label: t("toggle.languageAria"),
    stateValue: "language",
  });

  setToolbarToggleContent(themeToggle, {
    icon: "theme",
    label: state.theme === "dark" ? t("toggle.theme.light") : t("toggle.theme.dark"),
    stateValue: state.theme === "dark" ? "themeLight" : "themeDark",
  });
}

function setHidden(element, hidden) {
  if (element) {
    element.hidden = hidden;
  }
}

function syncBodyModalState() {
  const hasScanModal = Boolean(state.resultModalJobId);
  const hasAppDialog = Boolean(appDialog && !appDialog.hidden);
  document.body.classList.toggle("modal-open", hasScanModal || hasAppDialog);

  if (isEmbeddedModule && window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: "skillpecker:modal-state",
        open: hasScanModal || hasAppDialog,
      },
      window.location.origin
    );
  }
}

function closeAppDialog(reason = "dismiss") {
  if (!appDialog || appDialog.hidden) {
    return;
  }

  appDialog.hidden = true;
  appDialog.removeAttribute("data-variant");
  appDialogPanel?.removeAttribute("data-variant");
  if (appDialogActions) {
    appDialogActions.innerHTML = "";
  }
  syncBodyModalState();

  if (typeof appDialogResolve === "function") {
    const resolve = appDialogResolve;
    appDialogResolve = null;
    resolve(reason);
  }

  if (appDialogRestoreFocus instanceof HTMLElement) {
    appDialogRestoreFocus.focus({ preventScroll: true });
  }
  appDialogRestoreFocus = null;
}

function showAppDialog(options = {}) {
  if (!appDialog || !appDialogTitle || !appDialogMessage || !appDialogActions) {
    return Promise.resolve("unavailable");
  }

  const config = typeof options === "string" ? { message: options } : options;
  const variant = config.variant || "info";
  const labels = {
    info: t("dialog.systemNotice"),
    success: t("dialog.systemNotice"),
    warning: t("dialog.uploadRequired"),
    danger: t("dialog.submissionFailed"),
  };

  if (typeof appDialogResolve === "function") {
    appDialogResolve("replaced");
    appDialogResolve = null;
  }

  appDialogRestoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  appDialog.dataset.variant = variant;
  if (appDialogPanel) {
    appDialogPanel.dataset.variant = variant;
  }
  setText(appDialogEyebrow, config.eyebrow || labels[variant] || labels.info);
  setText(appDialogTitle, config.title || t("dialog.title"));
  setText(appDialogMessage, config.message || "");
  appDialogActions.innerHTML = "";

  if (config.secondaryLabel) {
    const secondaryButton = document.createElement("button");
    secondaryButton.type = "button";
    secondaryButton.className = "secondary-button glass-btn app-dialog-action-button secondary";
    secondaryButton.textContent = config.secondaryLabel;
    secondaryButton.addEventListener("click", () => closeAppDialog("secondary"));
    appDialogActions.appendChild(secondaryButton);
  }

  const primaryButton = document.createElement("button");
  primaryButton.type = "button";
  primaryButton.className = "primary-button app-dialog-action-button";
  primaryButton.textContent = config.confirmLabel || t("dialog.acknowledge");
  primaryButton.addEventListener("click", () => closeAppDialog("confirm"));
  appDialogActions.appendChild(primaryButton);

  appDialog.hidden = false;
  syncBodyModalState();
  window.requestAnimationFrame(() => primaryButton.focus({ preventScroll: true }));

  return new Promise((resolve) => {
    appDialogResolve = resolve;
  });
}

function getSelectedArchiveCount() {
  return archiveInput?.files?.length || 0;
}

function getSelectedDirectoryCount() {
  return normalizeDirectoryFiles(directoryInput?.files).length;
}

function getCurrentScanJourneyStep() {
  const hasSelection = Boolean(getSelectedArchiveCount() || getSelectedDirectoryCount());
  const hasQueuedOrRunning = state.jobs.some((job) => job.status === "queued" || job.status === "running");
  const hasCompleted = state.jobs.some((job) => job.status === "completed");

  if (state.scanSubmitting || hasQueuedOrRunning) {
    return 1;
  }
  if (hasSelection) {
    return 0;
  }
  if (hasCompleted) {
    return 2;
  }
  return 0;
}

function syncScanJourneyState() {
  if (!scanStepFlow || !scanStepCards.length) {
    return;
  }

  const currentStep = getCurrentScanJourneyStep();
  const progressStops = ["18%", "52%", "86%"];
  scanStepFlow.dataset.currentStep = String(currentStep);
  scanStepFlow.style.setProperty("--journey-progress", progressStops[currentStep] || progressStops[0]);

  scanStepCards.forEach((card, index) => {
    card.classList.toggle("is-complete", index < currentStep);
    card.classList.toggle("is-current", index === currentStep);
    card.classList.toggle("is-upcoming", index > currentStep);
  });
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
  syncToolbarToggles();
}

function applyHomeTranslations() {
  const homeTitle = document.getElementById("homeTitle");
  const homeSubhead = document.getElementById("homeSubhead");
  const homeSubtitle = document.getElementById("homeSubtitle");
  const homeDescription = document.getElementById("homeDescription");
  const homeActionPlaceholder = document.getElementById("homeActionPlaceholder");
  const homeToLibrary = document.getElementById("homeToLibrary");
  const homeToScan = document.getElementById("homeToScan");
  const homeBentoQueueTitle = document.getElementById("homeBentoQueueTitle");
  const homeBentoQueueDesc = document.getElementById("homeBentoQueueDesc");
  const homeBentoDrillTitle = document.getElementById("homeBentoDrillTitle");
  const homeBentoDrillDesc = document.getElementById("homeBentoDrillDesc");
  const homeBentoLibraryTitle = document.getElementById("homeBentoLibraryTitle");
  const homeBentoLibraryDesc = document.getElementById("homeBentoLibraryDesc");

  if (homeTitle) {
    homeTitle.innerHTML = t("home.titleHtml");
    homeTitle.dataset.text = homeTitle.textContent?.replace(/\s+/g, " ").trim() || "";
  }
  setText(homeSubhead, t("home.subhead"));
  if (homeSubtitle) {
    homeSubtitle.innerHTML = t("home.subtitleHtml");
  }
  if (homeDescription) {
    homeDescription.innerHTML = t("home.descriptionHtml");
  }
  setText(homeActionPlaceholder, t("home.actionPlaceholder"));
  setText(homeToLibrary, t("home.libraryBtn"));
  setText(homeToScan, t("home.scanBtn"));
  setText(homeBentoQueueTitle, t("home.bento.queueTitle"));
  setText(homeBentoQueueDesc, t("home.bento.queueDesc"));
  setText(homeBentoDrillTitle, t("home.bento.drillTitle"));
  setText(homeBentoDrillDesc, t("home.bento.drillDesc"));
  setText(homeBentoLibraryTitle, t("home.bento.libraryTitle"));
  setText(homeBentoLibraryDesc, t("home.bento.libraryDesc"));
  setText(homeScrollCueLabel, t("home.scrollCue"));
  setText(homeStageNavHero, t("home.stage.nav.hero"));
  setText(homeStageNavAnalytics, t("home.stage.nav.analytics"));
  setText(homeStageNavResults, t("home.stage.nav.results"));
  setText(homeResultsTitle, t("home.results.title"));
  setText(homeResultsCopy, t("home.results.copy"));
}

function applyTranslations() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.body.dataset.locale = state.language;
  document.title = t("document.title");

  setText(document.querySelector('.main-nav [data-view-target="home"]'), t("nav.home"));
  setText(document.querySelector('.main-nav [data-view-target="scan"]'), t("nav.scan"));
  setText(document.querySelector('.main-nav [data-view-target="library"]'), t("nav.library"));

  syncToolbarToggles();
  applyHomeTranslations();
  renderHomeResults();

  const scanTitleParts = Array.from(document.querySelectorAll(".scan-title > span"));
  if (scanTitleParts[0]) {
    setText(scanTitleParts[0], t("scan.title.1"));
  }
  if (scanTitleParts[1]) {
    setText(scanTitleParts[1], t("scan.title.2"));
  }
  if (scanTitleParts[2]) {
    setText(scanTitleParts[2], t("scan.title.3"));
  }
  setText(document.querySelector(".scan-launchpad-copy .section-copy"), t("scan.copy"));

  const statusTiles = Array.from(document.querySelectorAll(".scan-status-label"));
  if (statusTiles[0]) {
    setText(statusTiles[0], t("scan.status.running"));
  }
  if (statusTiles[1]) {
    setText(statusTiles[1], t("scan.status.queued"));
  }
  if (statusTiles[2]) {
    setText(statusTiles[2], t("scan.status.completed"));
  }

  const stepCards = Array.from(document.querySelectorAll(".scan-step-card"));
  if (stepCards[0]) {
    setText(stepCards[0].querySelector("strong"), t("scan.step.1.title"));
    setText(stepCards[0].querySelector("p"), t("scan.step.1.desc"));
  }
  if (stepCards[1]) {
    setText(stepCards[1].querySelector("strong"), t("scan.step.2.title"));
    setText(stepCards[1].querySelector("p"), t("scan.step.2.desc"));
  }
  if (stepCards[2]) {
    setText(stepCards[2].querySelector("strong"), t("scan.step.3.title"));
    setText(stepCards[2].querySelector("p"), t("scan.step.3.desc"));
  }

  setText(document.querySelector(".scan-upload-head .panel-eyebrow"), t("scan.upload.eyebrow"));
  setText(document.querySelector(".scan-upload-head h3"), t("scan.upload.title"));
  if (uploadModeButtons[0]) {
    setText(uploadModeButtons[0], t("scan.upload.archive"));
  }
  if (uploadModeButtons[1]) {
    setText(uploadModeButtons[1], t("scan.upload.folder"));
  }
  setText(document.querySelector(".selection-label"), t("scan.selectedPackage"));
  setText(submitButton, state.scanSubmitting ? t("upload.submitting") : t("scan.start"));
  setText(document.querySelector(".panel-head-queue .panel-eyebrow"), t("scan.liveQueue"));
  setText(document.querySelector(".panel-head-queue h3"), t("scan.jobQueue"));
  setText(document.querySelector("#scanTreeEmpty h4"), t("scan.emptyTitle"));
  setText(document.querySelector("#scanTreeEmpty p"), t("scan.emptyCopy"));
  setText(document.querySelector("#scanResultModal .panel-eyebrow"), t("scan.resultModal"));
  setText(scanResultModalClose, t("common.close"));

  setText(document.querySelector("#view-library h2"), t("library.title"));
  if (librarySearchInput) {
    librarySearchInput.placeholder = t("library.searchPlaceholder");
  }
  setText(libraryDecisionFilterLabel, t("library.decisionFilter"));
  document.querySelectorAll("[data-decision-filter-label]").forEach((node) => {
    const level = node.getAttribute("data-decision-filter-label");
    setText(node, localizeDecisionLevel(level));
  });
  setText(librarySearchButton, state.libraryLoading ? (state.libraryLoadingKind === "search" ? `${t("library.search")}...` : `${t("library.search")}...`) : t("library.search"));
  setText(libraryPaginationPrev, t("library.previous"));
  setText(libraryPaginationNext, t("library.next"));
  const startItem = state.libraryTotal ? (state.libraryPage - 1) * state.libraryPageSize + 1 : 0;
  const endItem = state.libraryTotal ? Math.min(startItem + state.libraryItems.length - 1, state.libraryTotal) : 0;
  setText(libraryCountPill, t("library.matched", { count: state.libraryTotal || 0 }));
  setText(
    libraryMaliciousPill,
    state.libraryTotal ? t("library.range", { start: startItem, end: endItem, total: state.libraryTotal }) : t("library.noResults"),
  );
  setText(
    libraryPageIndicator,
    state.libraryTotal
      ? t("library.showing", { start: startItem, end: endItem, total: state.libraryTotal })
      : t("library.showingEmpty"),
  );

  setText(appDialogEyebrow, t("dialog.systemNotice"));
  if (!appDialog || appDialog.hidden) {
    setText(appDialogTitle, t("dialog.title"));
    setText(appDialogMessage, t("dialog.message"));
  }

  applyTheme();
}

function setLanguage(language) {
  state.language = language === "zh" ? "zh" : "en";
  storage.set("skill-scan-language", state.language);
  applyTranslations();
  setUploadMode(state.scanUploadMode);
  renderScanTree();
  renderScanResultModal();
  renderLibraryList(state.libraryItems);
  renderLibraryPagination();
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  storage.set("skill-scan-theme", state.theme);
  applyTheme();
}

function initializePreferences() {
  const storedLanguage = storage.get("skill-scan-language");
  const storedTheme = storage.get("skill-scan-theme");
  state.language = storedLanguage === "zh" ? "zh" : "en";
  if (storedTheme === "dark" || storedTheme === "light") {
    state.theme = storedTheme;
  } else {
    state.theme = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }
  applyTranslations();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdownInline(value) {
  let html = escapeHtml(value ?? "");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return html;
}

function splitMarkdownFrontmatter(source) {
  const text = String(source || "").replace(/\r\n?/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: [], body: text };
  }

  const frontmatter = match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) {
        return null;
      }
      return {
        key: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
      };
    })
    .filter(Boolean);

  return {
    frontmatter,
    body: text.slice(match[0].length),
  };
}

function isMarkdownTableSeparator(line) {
  const normalized = String(line || "").trim();
  return /^[:\-\|\s]+$/.test(normalized) && normalized.includes("-");
}

function splitMarkdownTableRow(line) {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderMarkdownBlocks(source) {
  const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listType = "";
  let listItems = [];
  let quoteLines = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }
    html.push(`<p>${renderMarkdownInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length || !listType) {
      listItems = [];
      listType = "";
      return;
    }
    html.push(`<${listType}>${listItems.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</${listType}>`);
    listItems = [];
    listType = "";
  };

  const flushQuote = () => {
    if (!quoteLines.length) {
      return;
    }
    html.push(`<blockquote><p>${renderMarkdownInline(quoteLines.join(" "))}</p></blockquote>`);
    quoteLines = [];
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) {
      return;
    }
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : "";
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    inCodeBlock = false;
    codeLanguage = "";
    codeLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine ?? "";
    const trimmed = line.trim();

    if (inCodeBlock) {
      if (trimmed.startsWith("```")) {
        flushCodeBlock();
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushAll();
      inCodeBlock = true;
      codeLanguage = trimmed.slice(3).trim();
      codeLines = [];
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (trimmed.includes("|") && index + 1 < lines.length && isMarkdownTableSeparator(lines[index + 1])) {
      flushAll();
      const headers = splitMarkdownTableRow(trimmed);
      const rows = [];
      index += 2;
      while (index < lines.length) {
        const rowLine = String(lines[index] ?? "").trim();
        if (!rowLine || !rowLine.includes("|")) {
          index -= 1;
          break;
        }
        rows.push(splitMarkdownTableRow(rowLine));
        index += 1;
      }
      html.push(`
        <div class="markdown-table-wrap">
          <table class="markdown-table">
            <thead>
              <tr>${headers.map((cell) => `<th>${renderMarkdownInline(cell)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${headers
                      .map((_, cellIndex) => `<td>${renderMarkdownInline(row[cellIndex] || "")}</td>`)
                      .join("")}</tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `);
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushAll();
      html.push("<hr>");
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderMarkdownInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushAll();
  flushCodeBlock();

  return html.join("");
}

function renderMarkdownDocument(source) {
  const { frontmatter, body } = splitMarkdownFrontmatter(source);
  const sections = [];

  if (frontmatter.length) {
    sections.push(`
      <section class="markdown-frontmatter">
        ${frontmatter
          .map(
            (entry) => `
              <div class="markdown-frontmatter-row">
                <span>${escapeHtml(localizeMarkdownFieldLabel(entry.key))}</span>
                <strong>${renderMarkdownInline(localizeMarkdownFieldValue(entry.key, entry.value))}</strong>
              </div>
            `,
          )
          .join("")}
      </section>
    `);
  }

  sections.push(`<div class="markdown-body">${renderMarkdownBlocks(body)}</div>`);
  return sections.join("");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

function humanizeStatus(status) {
  return {
    queued: t("status.queued"),
    running: t("status.running"),
    completed: t("status.completed"),
    failed: t("status.failed"),
  }[status] || status || "-";
}

function getRiskTag(verdict) {
  const label = verdict?.label || "";
  return {
    text: t(verdictTextKeyMap[label] || "verdict.suspicious"),
    className: verdictClassMap[label] || "verdict-suspicious",
  };
}

function getSeverityClass(severity) {
  return {
    critical: "severity-critical",
    high: "severity-high",
    med: "severity-med",
    low: "severity-low",
  }[severity] || "severity-med";
}

function normalizeDirectoryFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) {
    return [];
  }

  return files.map((file) => {
    const rawPath = (file.webkitRelativePath || file.name).replaceAll("\\", "/");
    const parts = rawPath.split("/").filter(Boolean);
    return {
      file,
      relativePath: parts.join("/"),
    };
  });
}

function renderSimpleList(element, items) {
  if (!element) {
    return;
  }
  if (!items.length) {
    element.innerHTML = `<li>${escapeHtml(t("upload.noPackage"))}</li>`;
    return;
  }
  element.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function clearFileInput(input) {
  if (input) {
    input.value = "";
  }
}

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      detail: text,
      rawText: text,
    };
  }
}

function setUploadMode(mode) {
  state.scanUploadMode = mode === "directory" ? "directory" : "archive";

  uploadModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.uploadMode === state.scanUploadMode);
  });

  const isDirectoryMode = state.scanUploadMode === "directory";
  setText(packageModeBadge, isDirectoryMode ? t("upload.folderBadge") : t("upload.archiveBadge"));
  setText(packageUploadTitle, isDirectoryMode ? t("upload.folderTitle") : t("upload.archiveTitle"));
  setText(uploadModeHint, isDirectoryMode ? t("upload.folderHint") : t("upload.archiveHint"));
  setText(selectedPackageCaption, isDirectoryMode ? t("upload.folderCaption") : t("upload.archiveCaption"));
  setText(packagePickerTrigger, isDirectoryMode ? t("upload.chooseFolder") : t("upload.chooseZip"));

  if (packageUploadTile) {
    packageUploadTile.classList.toggle("upload-tile-dir", isDirectoryMode);
    packageUploadTile.classList.toggle("upload-tile-zip", !isDirectoryMode);
  }
  if (archiveUploadIcon) {
    archiveUploadIcon.classList.toggle("is-hidden-icon", isDirectoryMode);
  }
  if (directoryUploadIcon) {
    directoryUploadIcon.classList.toggle("is-hidden-icon", !isDirectoryMode);
  }

  updateSelectionViews();
}

function updateSelectionViews() {
  const archives = Array.from(archiveInput?.files || []).map((file) => `${file.name} · ${Math.ceil(file.size / 1024)} KB`);
  const directoryFiles = normalizeDirectoryFiles(directoryInput?.files);
  const folders = [...new Set(directoryFiles.map((item) => item.relativePath.split("/")[0]).filter(Boolean))];
  const directorySummary = [];
  if (directoryFiles.length) {
    directorySummary.push(t("upload.files", { count: directoryFiles.length }));
  }
  if (folders.length) {
    directorySummary.push(...folders.slice(0, 5));
  }

  const activeItems = state.scanUploadMode === "directory" ? directorySummary : archives;
  renderSimpleList(packageSelectionList, activeItems.length ? activeItems.slice(0, 3) : [t("upload.noPackage")]);

  if (state.scanUploadMode === "directory") {
    setText(
      packagePickerValue,
      folders.length ? (folders.length === 1 ? folders[0] : t("upload.foldersSelected", { count: folders.length })) : t("upload.noFolder"),
    );
  } else {
    setText(
      packagePickerValue,
      archives.length ? (archives.length === 1 ? archiveInput.files[0].name : t("upload.filesSelected", { count: archives.length })) : t("upload.noFile"),
    );
  }

  syncScanJourneyState();
}

function setView(view) {
  const previousView = state.view;
  state.view = views.includes(view) ? view : "home";
  document.body.dataset.view = state.view;
  if (state.view !== "scan" && state.resultModalJobId) {
    closeScanResultModal();
  }
  views.forEach((name) => {
    const panel = document.getElementById(`view-${name}`);
    if (panel) {
      panel.classList.toggle("is-hidden", name !== state.view);
    }
  });
  document.querySelectorAll(".main-nav [data-view-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === state.view);
  });
  window.location.hash = state.view;
  if (state.view === "library" && !state.libraryLoadedOnce) {
    loadLibrary();
  }
  if (state.view === "home") {
    if (previousView !== "home") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    window.requestAnimationFrame(syncHomeStageState);
  }
}

function getJobSummaryText(job) {
  if (job.status !== "completed" || !job.summaryExcerpt) {
    return formatSkillsInJob(job.skillCount || 0);
  }

  const counts = job.summaryExcerpt.labelCounts || {};
  const malicious = counts.malicious || 0;
  const safe = counts.clean_with_reservations || 0;
  const suspicious =
    (counts.unsafe || 0) +
    (counts.mixed_risk || 0) +
    (counts.description_unreliable || 0) +
    (counts.insufficient_evidence || 0);

  const parts = [];
  if (malicious) {
    parts.push(t("summary.malicious", { count: malicious }));
  }
  if (safe) {
    parts.push(t("summary.safe", { count: safe }));
  }
  if (suspicious) {
    parts.push(t("summary.suspicious", { count: suspicious }));
  }
  return parts.length ? parts.join(" · ") : formatSkillsInJob(job.skillCount || 0);
}

function humanizeFlag(value) {
  const key = normalizeLookupKey(value);
  const localized = localizedFlagMap[key]?.[state.language];
  if (localized) {
    return localized;
  }
  return String(value || "")
    .replaceAll(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getDecisionLevelClass(level) {
  return {
    MALICIOUS: "decision-malicious",
    SUSPICIOUS: "decision-suspicious",
    OVERREACH: "decision-overreach",
    SAFE: "decision-safe",
  }[String(level || "").toUpperCase()] || "decision-neutral";
}

function renderVerdictMetrics(verdict) {
  if (!verdict) {
    return "";
  }

  const metrics = [
    [t("metric.maliciousness"), verdict.maliciousness],
    [t("metric.safety"), verdict.safety],
    [t("metric.description"), verdict.description_reliability],
    [t("metric.coverage"), verdict.coverage],
  ].filter(([, value]) => Number.isFinite(value));

  if (!metrics.length) {
    return "";
  }

  return metrics
    .map(([label, value]) => `<span class="metric-chip">${escapeHtml(label)} ${escapeHtml(value)}/10</span>`)
    .join("");
}

function renderDetailPills(values, className = "detail-chip") {
  const items = values.filter(Boolean);
  if (!items.length) {
    return "";
  }
  return items.map((value) => `<span class="${className}">${escapeHtml(value)}</span>`).join("");
}

function renderFlagList(flags) {
  const enabled = Object.entries(flags || {})
    .filter(([, value]) => value)
    .map(([key]) => humanizeFlag(key));
  return renderDetailPills(enabled, "detail-chip detail-chip-warn");
}

function stripVerdictPrefix(value) {
  const text = String(value || "").trim();
  const match = text.match(/^[A-Z_]+:\s*[^-]+-\s*(.*)$/);
  return match ? match[1].trim() : text;
}

function isDuplicateScanText(primary, secondary) {
  const left = String(primary || "").trim();
  const right = String(secondary || "").trim();
  if (!left || !right) {
    return false;
  }

  const leftVariants = new Set([left.toLowerCase(), stripVerdictPrefix(left).toLowerCase()]);
  const rightVariants = new Set([right.toLowerCase(), stripVerdictPrefix(right).toLowerCase()]);
  return [...leftVariants].some((value) => rightVariants.has(value));
}

function renderScanRecords(records) {
  if (!records.length) {
    return `<div class="tree-empty-line">${escapeHtml(t("library.noScanRecordsYet"))}</div>`;
  }

  return records
    .map((record) => {
      const info = record.classification || {};
      const displaySummary = info.problem_summary || info.cleaned_description || info.raw_verdict || t("library.noSummary");
      const decisionLevel = info.decision_level || "UNKNOWN";
      const primaryGroup = info.primary_group || "-";
      const scanLevel = info.scan_level ? localizeScanLevel(info.scan_level) : t("library.unknownScan");
      const flagPills = renderFlagList(info.flags);
      const riskTypePills = renderDetailPills((info.risk_types || []).map((item) => localizeCategoryLabel(item)), "detail-chip");

      return `
        <article class="scan-record-card audit-record-card glass-panel">
          <div class="scan-record-head">
            <div class="scan-record-copy">
              <h5>${escapeHtml(scanLevel)}</h5>
            </div>
            <span class="detail-chip ${getDecisionLevelClass(decisionLevel)}">${escapeHtml(localizeDecisionLevel(decisionLevel))}</span>
          </div>

          <div class="audit-record-grid">
            <div class="audit-record-item">
              <span>${escapeHtml(t("library.primaryClassification"))}</span>
              <strong>${escapeHtml(localizeDecisionLevel(decisionLevel))}</strong>
            </div>
            <div class="audit-record-item">
              <span>${escapeHtml(t("library.secondaryClassification"))}</span>
              <strong>${escapeHtml(localizeCategoryLabel(primaryGroup))}</strong>
            </div>
            <div class="audit-record-item">
              <span>${escapeHtml(t("library.sourcePlatform"))}</span>
              <strong>${escapeHtml(info.platform ? localizeCategoryLabel(info.platform) : "-")}</strong>
            </div>
            <div class="audit-record-item">
              <span>${escapeHtml(t("library.relatedFiles"))}</span>
              <strong>${escapeHtml(info.related_file_count || "-")}</strong>
            </div>
          </div>

          <div class="audit-record-section scan-conclusion-block">
            <span class="finding-detail-label">${escapeHtml(t("library.scanConclusion"))}</span>
            <div class="scan-conclusion-markdown markdown-viewer">${renderMarkdownDocument(displaySummary)}</div>
          </div>

          ${
            riskTypePills
              ? `
                <div class="audit-record-section">
                  <span class="finding-detail-label">${escapeHtml(t("library.riskTypes"))}</span>
                  <div class="finding-chip-row">${riskTypePills}</div>
                </div>
              `
              : ""
          }
          ${
            flagPills
              ? `
                <div class="audit-record-section">
                  <span class="finding-detail-label">${escapeHtml(t("library.triggeredFlags"))}</span>
                  <div class="finding-chip-row">${flagPills}</div>
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderFindingCards(findings) {
  if (!findings?.length) {
    return `<div class="tree-empty-line">${escapeHtml(t("finding.none"))}</div>`;
  }

  return findings
    .map((finding, index) => {
      const evidenceItems = (finding.spans || []).filter((span) => span.path || span.why);
      const evidence = evidenceItems
        .map(
          (span) => `
            <div class="finding-evidence-row">
              <span class="finding-evidence-path">${escapeHtml(span.path)}:${escapeHtml(span.s)}-${escapeHtml(span.e)}</span>
              <p class="finding-evidence-why">${escapeHtml(span.why || t("finding.noNote"))}</p>
            </div>
          `,
        )
        .join("");
      const decisionLevel = finding.decision_level || "";
      const severity = finding.severity || "";
      const confidence = finding.conf || "";
      const metaPills = renderDetailPills(
        [
          finding.scan_level ? `${t("finding.meta.scan")} ${localizeScanLevel(finding.scan_level)}` : "",
          finding.primary_group ? `${t("finding.meta.group")} ${localizeCategoryLabel(finding.primary_group)}` : "",
          finding.source_platform ? `${t("finding.meta.platform")} ${localizeCategoryLabel(finding.source_platform)}` : "",
          finding.source_file ? `${t("finding.meta.source")} ${finding.source_file}` : "",
          finding.related_file_count ? `${t("finding.meta.files")} ${finding.related_file_count}` : "",
        ],
        "detail-chip",
      );
      const riskTypePills = renderDetailPills(
        (finding.risk_types || []).map((item) => `${t("finding.meta.risk")} ${localizeCategoryLabel(item)}`),
        "detail-chip",
      );
      const flagPills = renderFlagList(finding.flags);
      const impactText = isDuplicateScanText(finding.impact, finding.summary) ? "" : finding.impact;

      return `
        <article class="finding-card-modern" style="--stagger:${index}">
          <div class="finding-card-head">
            <div class="finding-card-copy">
              ${finding.id ? `<p class="finding-card-kicker">${escapeHtml(finding.id)}</p>` : ""}
              <h5>${escapeHtml(finding.summary || t("finding.unnamed"))}</h5>
            </div>
            <div class="finding-card-badges">
              ${decisionLevel ? `<span class="detail-chip ${getDecisionLevelClass(decisionLevel)}">${escapeHtml(localizeDecisionLevel(decisionLevel))}</span>` : ""}
              ${severity ? `<span class="severity-chip ${getSeverityClass(severity)}">${escapeHtml(localizeSeverity(severityLabelMap[severity] || severity))}</span>` : ""}
              ${confidence ? `<span class="detail-chip detail-chip-neutral">${escapeHtml(t("finding.confidence"))} ${escapeHtml(localizeConfidence(confidence))}</span>` : ""}
            </div>
          </div>
          <div class="finding-chip-row">
            ${metaPills}
            ${renderDetailPills(
              [
                finding.cat ? `${t("finding.meta.category")} ${localizeCategoryLabel(finding.cat)}` : "",
                finding.class ? `${t("finding.meta.class")} ${localizeCategoryLabel(finding.class)}` : "",
              ],
              "detail-chip",
            )}
          </div>
          ${riskTypePills ? `<div class="finding-chip-row">${riskTypePills}</div>` : ""}
          ${flagPills ? `<div class="finding-chip-row">${flagPills}</div>` : ""}
          ${
            impactText
              ? `
                <div class="finding-detail-group">
                  <span class="finding-detail-label">${escapeHtml(t("finding.impact"))}</span>
                  <p class="finding-detail-copy">${escapeHtml(impactText)}</p>
                </div>
              `
              : ""
          }
          ${
            finding.fix
              ? `
                <div class="finding-detail-group">
                  <span class="finding-detail-label">${escapeHtml(t("finding.remediation"))}</span>
                  <p class="finding-detail-copy">${escapeHtml(finding.fix)}</p>
                </div>
              `
              : ""
          }
          ${
            evidenceItems.length
              ? `
                <div class="finding-detail-group">
                  <span class="finding-detail-label">${escapeHtml(t("finding.evidence"))}</span>
                  <div class="finding-evidence-list">${evidence}</div>
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function getSkillErrorMessage(payload) {
  const error = payload?.error;
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  if (error && typeof error === "object") {
    if (typeof error.error === "string" && error.error.trim()) {
      return error.error.trim();
    }
    if (typeof error.detail === "string" && error.detail.trim()) {
      return error.detail.trim();
    }
  }
  return t("common.unknownError");
}

function renderExpandedSkill(jobId, skillName) {
  const payload = state.skillDetails[`${jobId}:${skillName}`];
  if (!payload) {
    return `<div class="tree-empty-line">${escapeHtml(t("finding.loading"))}</div>`;
  }

  if (payload.status !== "ok") {
    return `
      <div class="skill-detail-card glass-panel">
        <div class="skill-detail-top">
          <div class="skill-detail-copy">
            <p class="tree-node-kicker">${escapeHtml(t("finding.failedTitle"))}</p>
            <h5>${escapeHtml(skillName)}</h5>
            <p class="tree-node-subtitle">${escapeHtml(t("finding.failedCopy"))}</p>
          </div>
          <div class="skill-detail-side">
            <span class="status-chip status-failed">${escapeHtml(t("status.failed"))}</span>
          </div>
        </div>
        <div class="finding-list">
          <article class="finding-card-modern">
            <div class="finding-detail-group">
              <span class="finding-detail-label">${escapeHtml(t("finding.evidence"))}</span>
              <p class="finding-detail-copy">${escapeHtml(getSkillErrorMessage(payload))}</p>
            </div>
          </article>
        </div>
      </div>
    `;
  }

  if (!payload.result) {
    return `<div class="tree-empty-line">${escapeHtml(t("finding.noResult"))}</div>`;
  }

  const result = payload.result;
  const verdict = result.judge?.verdict || null;
  const findings = result.judge?.top_findings || result.security?.findings || [];
  const riskTag = getRiskTag(verdict);
  const metrics = renderVerdictMetrics(verdict);

  return `
    <div class="skill-detail-card glass-panel">
      <div class="skill-detail-top">
        <div class="skill-detail-copy">
          <p class="tree-node-kicker">${escapeHtml(t("finding.skillFindings"))}</p>
          <h5>${escapeHtml(skillName)}</h5>
          <p class="tree-node-subtitle">${escapeHtml(findings.length ? t("finding.availableCount", { count: findings.length }) : t("finding.noneForSkill"))}</p>
        </div>
        <div class="skill-detail-side">
          <span class="tree-pill ${riskTag.className}">${riskTag.text}</span>
          <div class="skill-score-line">${metrics}</div>
        </div>
      </div>
      <div class="finding-list">
        ${findings.length ? renderFindingCards(findings) : `<div class="tree-empty-line">${escapeHtml(t("finding.none"))}</div>`}
      </div>
    </div>
  `;
}

function renderSkillList(job, summary) {
  const skills = summary?.skills || [];
  if (!skills.length) {
    return `<div class="tree-empty-line">${escapeHtml(t("queue.noSkillResults"))}</div>`;
  }

  const validKeys = new Set(skills.map((skill) => `${job.id}:${skill.name}`));
  if (!state.expandedSkillKey || !validKeys.has(state.expandedSkillKey)) {
    state.expandedSkillKey = `${job.id}:${skills[0].name}`;
  }

  return skills
    .map((skill, index) => {
      const skillKey = `${job.id}:${skill.name}`;
      const isExpanded = state.expandedSkillKey === skillKey;
      const riskTag = getRiskTag(skill.verdict);
      const subtitle =
        skill.status === "error"
          ? t("queue.skillFailed", { error: skill.error || t("common.unknownError") })
          : formatSkillStats(skill.artifact_count, skill.rule_hit_count);
      const badgeMarkup =
        skill.status === "error"
          ? `<span class="status-chip status-failed">${escapeHtml(t("status.failed"))}</span>`
          : `<span class="tree-pill ${riskTag.className}">${riskTag.text}</span>`;
      return `
        <div class="skill-accordion" style="--stagger:${index}">
          <button
            class="skill-item ${isExpanded ? "is-active" : ""}"
            type="button"
            data-skill-key="${escapeHtml(skillKey)}"
            data-job-id="${escapeHtml(job.id)}"
            data-skill-name="${escapeHtml(skill.name)}"
          >
            <div class="skill-item-main">
              <p class="tree-node-kicker">${escapeHtml(t("queue.skill"))}</p>
              <div class="tree-node-title-row">
                <p class="tree-node-title">${escapeHtml(skill.name)}</p>
              </div>
              <p class="tree-node-subtitle">${escapeHtml(subtitle)}</p>
            </div>
            <div class="skill-item-side">
              <div class="tree-node-badges">
                ${badgeMarkup}
              </div>
              <span class="expand-indicator ${isExpanded ? "is-expanded" : ""}">
                <span>${escapeHtml(isExpanded ? t("queue.selected") : t("queue.inspectFindings"))}</span>
                <span class="expand-chevron" aria-hidden="true">&#8964;</span>
              </span>
            </div>
          </button>
        </div>
      `;
    })
    .join("");
}

function resetScanResultModalScroll() {
  state.modalSkillNavScrollTop = 0;
  state.modalFindingScrollTop = 0;
  state.modalScrollSkillKey = null;
}

function captureScanResultModalScroll({ preserveFindingScroll = true } = {}) {
  if (!scanResultModalBody) {
    return;
  }

  const skillNav = scanResultModalBody.querySelector(".job-skill-nav");
  const findingScroll = scanResultModalBody.querySelector(".job-finding-scroll");
  if (skillNav) {
    state.modalSkillNavScrollTop = skillNav.scrollTop;
  }

  state.modalScrollSkillKey = state.expandedSkillKey;
  state.modalFindingScrollTop = preserveFindingScroll && findingScroll ? findingScroll.scrollTop : 0;
}

function restoreScanResultModalScroll() {
  if (!scanResultModalBody) {
    return;
  }

  const skillNav = scanResultModalBody.querySelector(".job-skill-nav");
  const findingScroll = scanResultModalBody.querySelector(".job-finding-scroll");
  if (skillNav) {
    skillNav.scrollTop = state.modalSkillNavScrollTop || 0;
  }

  if (findingScroll) {
    const shouldRestoreFindingScroll = state.modalScrollSkillKey && state.modalScrollSkillKey === state.expandedSkillKey;
    findingScroll.scrollTop = shouldRestoreFindingScroll ? state.modalFindingScrollTop || 0 : 0;
  }
}

function renderJobResultModal(job) {
  const detail = state.jobDetails[job.id];
  if (!detail) {
    return `<div class="tree-empty-line">${escapeHtml(t("queue.loadingJobDetails"))}</div>`;
  }

  if (job.status === "queued") {
    return `<div class="tree-empty-line">${escapeHtml(t("queue.queuedMessage"))}</div>`;
  }

  if (job.status === "running" && !detail.summary) {
    return `<div class="tree-empty-line">${escapeHtml(t("queue.runningMessage"))}</div>`;
  }

  if (job.status === "failed") {
    return `<div class="tree-empty-line">${escapeHtml(t("queue.failedPrefix", { error: job.error || "Unknown error" }))}</div>`;
  }

  const totalSkillCount = detail.summary?.skills?.length ?? job.skillCount ?? 0;
  const selectedSkillName = state.expandedSkillKey?.startsWith(`${job.id}:`) ? state.expandedSkillKey.slice(job.id.length + 1) : "";
  const skillPanel = selectedSkillName
    ? renderExpandedSkill(job.id, selectedSkillName)
    : `<div class="tree-empty-line">${escapeHtml(t("queue.selectSkill"))}</div>`;

  return `
    <div class="job-expanded-shell job-modal-shell">
      <div class="job-modal-grid">
        <section class="job-skill-stack">
          <div class="subpanel-head">
            <h4>${escapeHtml(formatSkillsPanelTitle(totalSkillCount))}</h4>
            <span class="ghost-pill glass-pill">${escapeHtml(formatSkillCount(totalSkillCount))}</span>
          </div>
          <div class="job-skill-nav">
            ${renderSkillList(job, detail.summary)}
          </div>
        </section>
        <section class="job-finding-workspace">
          <div class="subpanel-head">
            <h4>${escapeHtml(t("queue.scanResult"))}</h4>
            ${selectedSkillName ? `<span class="ghost-pill glass-pill">${escapeHtml(selectedSkillName)}</span>` : ""}
          </div>
          <div class="job-finding-scroll">
            ${skillPanel}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderScanResultModal({ preserveFindingScroll = true } = {}) {
  if (!scanResultModal || !scanResultModalBody) {
    return;
  }

  if (!state.resultModalJobId) {
    resetScanResultModalScroll();
    scanResultModal.hidden = true;
    scanResultModalBody.innerHTML = "";
    syncBodyModalState();
    return;
  }

  const job = state.jobs.find((item) => item.id === state.resultModalJobId);
  if (!job) {
    state.resultModalJobId = null;
    resetScanResultModalScroll();
    scanResultModal.hidden = true;
    scanResultModalBody.innerHTML = "";
    syncBodyModalState();
    return;
  }

  captureScanResultModalScroll({ preserveFindingScroll });
  scanResultModal.hidden = false;
  syncBodyModalState();
  const modalTitle = document.getElementById("scanResultModalTitle");
  setText(modalTitle, job.id);
  scanResultModalBody.innerHTML = renderJobResultModal(job);
  restoreScanResultModalScroll();
  bindTreeEvents();
}

async function openScanResultModal(jobId) {
  if (!jobId) {
    return;
  }

  state.resultModalJobId = jobId;
  state.expandedSkillKey = null;
  resetScanResultModalScroll();
  renderScanResultModal();
  await loadJobDetail(jobId);
}

function closeScanResultModal() {
  state.resultModalJobId = null;
  renderScanResultModal();
}

function bindTreeEvents() {
  [scanTreeList, homeResultsList].forEach((container) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    container.querySelectorAll("[data-open-job-results]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        await openScanResultModal(button.dataset.openJobResults);
      });
    });
  });

  if (scanResultModalBody) {
    scanResultModalBody.querySelectorAll("[data-skill-key]").forEach((button) => {
      button.addEventListener("click", async () => {
        const skillKey = button.dataset.skillKey;
        const { jobId, skillName } = button.dataset;
        if (skillKey === state.expandedSkillKey) {
          return;
        }
        state.expandedSkillKey = skillKey;
        renderScanResultModal({ preserveFindingScroll: false });
        if (!state.skillDetails[skillKey]) {
          await loadSkillDetail(jobId, skillName);
        }
      });
    });
  }
}

function renderScanTree() {
  const runningCount = state.jobs.filter((job) => job.status === "running").length;
  const queuedCount = state.jobs.filter((job) => job.status === "queued").length;
  const completedCount = state.jobs.filter((job) => job.status === "completed").length;

  setText(queueRunningPill, String(runningCount));
  setText(queueWaitingPill, String(queuedCount));
  setText(queueDonePill, String(completedCount));
  setText(queueSummaryPill, t("queue.jobs", { count: state.jobs.length }));
  syncScanJourneyState();

  if (!state.jobs.length) {
    setHidden(scanTreeEmpty, false);
    setHidden(scanTreeList, true);
    if (scanTreeList) {
      scanTreeList.innerHTML = "";
    }
    renderScanResultModal();
    return;
  }

  setHidden(scanTreeEmpty, true);
  setHidden(scanTreeList, false);
  if (!scanTreeList) {
    return;
  }

  scanTreeList.innerHTML = `
    <div class="scan-queue-grid">
      ${state.jobs
        .map((job, index) => {
          return `
            <article class="job-item job-queue-card" style="--stagger:${index}">
              <div class="job-item-main">
                <div class="job-item-topline">
                  <p class="tree-node-kicker">${escapeHtml(t("queue.job"))}</p>
                  <span class="job-created-at">${escapeHtml(formatDate(job.createdAt))}</span>
                </div>
                <div class="tree-node-title-row">
                  <p class="tree-node-title job-title">${escapeHtml(job.id)}</p>
                </div>
                <p class="job-summary-copy">${escapeHtml(getJobSummaryText(job))}</p>
                <div class="job-meta-row">
                  <span class="metric-chip">${escapeHtml(formatSkillCount(job.skillCount ?? 0))}</span>
                  ${job.queuePosition ? `<span class="metric-chip">${escapeHtml(t("queue.queuePosition", { position: job.queuePosition }))}</span>` : ""}
                </div>
              </div>
              <div class="job-item-side">
                <span class="status-chip status-${escapeHtml(job.status)}">${escapeHtml(humanizeStatus(job.status))}</span>
                ${job.status === "completed" ? `<button class="secondary-button glass-btn queue-action-button" type="button" data-open-job-results="${escapeHtml(job.id)}">${escapeHtml(t("queue.openResults"))}</button>` : ""}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  bindTreeEvents();
  renderScanResultModal();
}

function renderHomeResults() {
  if (!homeResultsSection) {
    return;
  }

  const completedJobs = state.jobs.filter((job) => job.status === "completed").slice(0, 8);
  setText(homeResultsPill, t("home.results.count", { count: completedJobs.length }));

  if (!completedJobs.length) {
    setHidden(homeResultsEmpty, false);
    setHidden(homeResultsList, true);
    if (homeResultsEmpty) {
      homeResultsEmpty.innerHTML = `
        <h4>${escapeHtml(t("home.results.emptyTitle"))}</h4>
        <p>${escapeHtml(t("home.results.emptyCopy"))}</p>
      `;
    }
    if (homeResultsList) {
      homeResultsList.innerHTML = "";
    }
    return;
  }

  setHidden(homeResultsEmpty, true);
  setHidden(homeResultsList, false);
  if (!homeResultsList) {
    return;
  }

  homeResultsList.innerHTML = `
    <div class="scan-queue-grid">
      ${completedJobs
        .map(
          (job, index) => `
            <article class="job-item job-queue-card" style="--stagger:${index}">
              <div class="job-item-main">
                <div class="job-item-topline">
                  <p class="tree-node-kicker">${escapeHtml(t("queue.job"))}</p>
                  <span class="job-created-at">${escapeHtml(formatDate(job.createdAt))}</span>
                </div>
                <div class="tree-node-title-row">
                  <p class="tree-node-title job-title">${escapeHtml(job.id)}</p>
                </div>
                <p class="job-summary-copy">${escapeHtml(getJobSummaryText(job))}</p>
                <div class="job-meta-row">
                  <span class="metric-chip">${escapeHtml(formatSkillCount(job.skillCount ?? 0))}</span>
                </div>
              </div>
              <div class="job-item-side">
                <span class="status-chip status-${escapeHtml(job.status)}">${escapeHtml(humanizeStatus(job.status))}</span>
                <button class="secondary-button glass-btn queue-action-button" type="button" data-open-job-results="${escapeHtml(job.id)}">
                  ${escapeHtml(t("queue.openResults"))}
                </button>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;

  bindTreeEvents();
}

async function loadJobDetail(jobId) {
  if (!jobId) {
    return;
  }
  const response = await fetch(`/api/skillpecker/scans/${encodeURIComponent(jobId)}`);
  if (!response.ok) {
    return;
  }
  state.jobDetails[jobId] = await response.json();
  const skills = state.jobDetails[jobId]?.summary?.skills || [];
  if (skills.length && (!state.expandedSkillKey || !state.expandedSkillKey.startsWith(`${jobId}:`))) {
    state.expandedSkillKey = `${jobId}:${skills[0].name}`;
    if (!state.skillDetails[state.expandedSkillKey]) {
      await loadSkillDetail(jobId, skills[0].name);
      return;
    }
  }
  if (state.resultModalJobId === jobId) {
    renderScanResultModal();
  }
}

async function loadSkillDetail(jobId, skillName) {
  if (!jobId || !skillName) {
    return;
  }
  const key = `${jobId}:${skillName}`;
  const response = await fetch(`/api/skillpecker/scans/${encodeURIComponent(jobId)}/skills/${encodeURIComponent(skillName)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    state.skillDetails[key] = {
      status: "error",
      error: {
        detail: payload?.detail || t("common.unknownError"),
      },
    };
    renderScanResultModal();
    return;
  }
  state.skillDetails[key] = payload;
  renderScanResultModal();
}

async function loadQueue() {
  const response = await fetch("/api/skillpecker/scans");
  if (!response.ok) {
    return;
  }
  const payload = await response.json();
  state.jobs = payload.jobs || [];
  renderScanTree();
  renderHomeResults();
  if (state.resultModalJobId) {
    await loadJobDetail(state.resultModalJobId);
  }
}

function renderFindingsToContainer(findings, container, countNode) {
  const items = findings || [];
  setText(countNode, `${items.length}`);
  if (!container) {
    return;
  }
  if (!items.length) {
    container.innerHTML = `<div class="tree-empty-line">${escapeHtml(t("finding.none"))}</div>`;
    return;
  }
  container.innerHTML = renderFindingCards(items);
}

function formatPublishedAt(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric > 1_000_000_000_000) {
      return formatDate(numeric);
    }
    if (numeric > 1_000_000_000) {
      return formatDate(numeric * 1000);
    }
  }

  return formatDate(value);
}

function humanizeCategory(value) {
  if (!value) {
    return t("library.unclassified");
  }
  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function normalizeBusinessCategory(value) {
  const text = String(value || "").trim();
  return text;
}

function getBusinessCategory(item, records = []) {
  const explicitCategory = normalizeBusinessCategory(item?.businessCategory);
  if (explicitCategory) {
    return explicitCategory;
  }

  const recordCategory = records.find((record) => record?.classification?.business_category)?.classification?.business_category;
  if (recordCategory) {
    return normalizeBusinessCategory(recordCategory);
  }

  const skillId = item?.id || "";
  if (skillId.includes("__")) {
    return normalizeBusinessCategory(skillId.split("__")[0]);
  }

  return "";
}

function formatSkillDisplayName(item) {
  const rawName = String(item?.name || item?.id || "").trim();
  return rawName.replace(/^unknown__+/i, "") || rawName;
}

function hasMeaningfulText(value) {
  const text = String(value || "").trim();
  return Boolean(text && text !== "-" && text.toLowerCase() !== "no description available");
}

function syncLibraryDocPanels() {
  document.querySelectorAll(".library-expanded-grid").forEach((grid) => {
    const main = grid.querySelector(".library-expanded-main");
    const panel = grid.querySelector(".library-doc-panel");
    if (!main || !panel) {
      return;
    }

    if (window.innerWidth <= 900) {
      panel.style.height = "auto";
      return;
    }

    panel.style.height = `${Math.ceil(main.getBoundingClientRect().height)}px`;
  });
}

function getLibraryPrimaryDecisionLevel(item, records = []) {
  const rank = { MALICIOUS: 0, SUSPICIOUS: 1, OVERREACH: 2, SAFE: 3 };
  const recordLevels = [...new Set(records.map((record) => record?.classification?.decision_level).filter(Boolean))];
  if (recordLevels.length) {
    return recordLevels.sort((left, right) => {
      const leftKey = String(left || "").toUpperCase();
      const rightKey = String(right || "").toUpperCase();
      return (rank[leftKey] ?? 99) - (rank[rightKey] ?? 99);
    })[0];
  }
  if (item?.primaryDecisionLevel) {
    return item.primaryDecisionLevel;
  }
  if (Array.isArray(item?.decisionLevels) && item.decisionLevels.length) {
    return item.decisionLevels[0];
  }
  return "UNKNOWN";
}

function getLibraryDecisionTag(item, records = []) {
  const level = getLibraryPrimaryDecisionLevel(item, records);
  return {
    text: localizeDecisionLevel(level || "UNKNOWN"),
    className: getDecisionLevelClass(level),
  };
}

function renderCategoryChips(categories) {
  const items = Array.isArray(categories) ? categories.slice(0, 4) : [];
  if (!items.length) {
    return `<span class="category-chip category-chip-muted">${escapeHtml(t("library.unscanned"))}</span>`;
  }
  return items
    .map((category) => `<span class="category-chip">${escapeHtml(localizeCategoryLabel(category))}</span>`)
    .join("");
}

function renderLibraryLoadingState() {
  if (!libraryList) {
    return;
  }
  const loadingCopy =
    state.libraryLoadingKind === "search"
      ? t("library.searchingFor", { query: state.libraryQuery })
      : t("library.loadingCopy");
  libraryList.innerHTML = `
    <div class="empty-state compact glass-panel loading-state-card">
      <div class="loading-spinner" aria-hidden="true"></div>
      <h4>${state.libraryLoadingKind === "search" ? t("library.searchingSkills") : t("library.loading")}</h4>
      <p>${loadingCopy}</p>
    </div>
  `;
}

function renderLibraryExpanded(item) {
  const payload = state.libraryDetails[item.id];
  if (!payload || payload.loading) {
    return `<div class="tree-empty-line">${escapeHtml(t("library.loadingScanDetails"))}</div>`;
  }

  if (payload.error) {
    return `<div class="tree-empty-line">${escapeHtml(payload.error)}</div>`;
  }

  const detailItem = payload.item || item;
  const result = payload.scanResult;
  const judge = payload.judge || result?.judge || null;
  const findings = judge?.top_findings || result?.security?.findings || [];
  const classificationRecords = result?.excel_import?.records || [];
  const docPreview = detailItem.docPreview || t("library.noSkillDoc");
  const docContentHtml = renderMarkdownDocument(docPreview);
  const hasSkillDoc = detailItem.hasSkillDoc && hasMeaningfulText(docPreview);

  return `
    <div class="library-expanded-grid ${hasSkillDoc ? "" : "is-single-column"}">
      <section class="library-expanded-main">
        <section class="library-detail-block glass-panel">
          <div class="subpanel-head">
            <h4>${escapeHtml(t("library.scanResult"))}</h4>
          </div>
          <div class="scan-record-list">
            ${
              classificationRecords.length
                ? renderScanRecords(classificationRecords)
                : findings.length
                  ? renderFindingCards(findings)
                  : `<div class="tree-empty-line">${escapeHtml(t("library.noScanRecordsYet"))}</div>`
            }
          </div>
        </section>
      </section>

      ${
        hasSkillDoc
          ? `
            <aside class="library-expanded-side">
              <section class="library-detail-block library-doc-panel glass-panel">
                <div class="subpanel-head">
                  <h4>${escapeHtml(t("library.skillDoc"))}</h4>
                </div>
                <div class="markdown-viewer glass-panel">${docContentHtml}</div>
              </section>
            </aside>
          `
          : ""
      }
    </div>
  `;
}

function bindLibraryEvents() {
  if (!libraryList) {
    return;
  }

  libraryList.querySelectorAll("[data-library-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.libraryId;
      const shouldExpand = state.expandedLibraryId !== id;
      state.expandedLibraryId = shouldExpand ? id : null;
      renderLibraryList(state.libraryItems);

      if (!shouldExpand) {
        return;
      }

      if (!state.libraryDetails[id]) {
        state.libraryDetails[id] = { loading: true };
        renderLibraryList(state.libraryItems);
        await loadLibraryDetail(id);
      }
    });
  });
}

function getVisiblePaginationPages(currentPage, totalPages) {
  if (!totalPages) {
    return [];
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter((page) => page >= 1 && page <= totalPages));
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((left, right) => left - right);
  const visible = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    const previous = sorted[index - 1];
    if (previous && page - previous > 1) {
      visible.push("ellipsis");
    }
    visible.push(page);
  }
  return visible;
}

function setLibraryLoading(isLoading, kind = "page", query = state.libraryQuery) {
  state.libraryLoading = isLoading;
  state.libraryLoadingKind = isLoading ? kind : "";

  if (librarySearchForm) {
    librarySearchForm.classList.toggle("is-loading", isLoading);
  }

  if (librarySearchButton) {
    librarySearchButton.disabled = isLoading;
    librarySearchButton.innerHTML = isLoading
      ? `<span class="loading-spinner button-spinner" aria-hidden="true"></span><span>${kind === "search" ? `${t("library.search")}...` : `${t("library.search")}...`}</span>`
      : t("library.search");
  }

  if (libraryPaginationPrev) {
    libraryPaginationPrev.disabled = isLoading || state.libraryPage <= 1;
  }
  if (libraryPaginationNext) {
    libraryPaginationNext.disabled = isLoading || !state.libraryTotalPages || state.libraryPage >= state.libraryTotalPages;
  }

  if (libraryPaginationNumbers) {
    libraryPaginationNumbers.classList.toggle("is-loading", isLoading);
  }

  libraryDecisionFilterInputs.forEach((input) => {
    input.disabled = isLoading;
  });

}

function renderLibraryPagination() {
  if (!libraryPaginationNumbers) {
    return;
  }

  if (!state.libraryTotalPages) {
    libraryPaginationNumbers.innerHTML = "";
    return;
  }

  libraryPaginationNumbers.innerHTML = getVisiblePaginationPages(state.libraryPage, state.libraryTotalPages)
    .map((page) => {
      if (page === "ellipsis") {
        return `<span class="pagination-ellipsis">...</span>`;
      }
      const isActive = page === state.libraryPage;
      return `
        <button
          class="pagination-number ${isActive ? "is-active" : ""}"
          type="button"
          data-page-number="${page}"
          aria-current="${isActive ? "page" : "false"}"
        >
          ${page}
        </button>
      `;
    })
    .join("");

  libraryPaginationNumbers.querySelectorAll("[data-page-number]").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextPage = Number(button.dataset.pageNumber || 0);
      if (!nextPage || nextPage === state.libraryPage) {
        return;
      }
      state.expandedLibraryId = null;
      await loadLibrary({ page: nextPage });
      libraryList?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderLibraryList(items) {
  if (!libraryList) {
    return;
  }

  if (!items.length) {
    const emptyMessage = state.libraryQuery
      ? t("library.noMatchCopy", { query: state.libraryQuery })
      : t("library.emptyCopy");
    libraryList.innerHTML = `
      <div class="empty-state compact glass-panel">
        <h4>${state.libraryQuery ? t("library.noMatchTitle") : t("library.emptyTitle")}</h4>
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }

  libraryList.innerHTML = items
    .map((item, index) => {
      const decisionTag = getLibraryDecisionTag(item);
      const isExpanded = state.expandedLibraryId === item.id;
      const businessCategory = getBusinessCategory(item);
      const displayName = formatSkillDisplayName(item);
      const hasDescription = hasMeaningfulText(item.description);
      const businessCategoryMarkup = businessCategory
        ? `<span class="category-chip library-business-chip">${escapeHtml(localizeCategoryLabel(businessCategory))}</span>`
        : "";
      const headerPills = [
        `<span class="detail-chip ${decisionTag.className}">${escapeHtml(decisionTag.text)}</span>`,
        renderCategoryChips(item.categories),
      ]
        .filter(Boolean)
        .join("");
      return `
        <article class="library-card ${isExpanded ? "is-active" : ""}" style="--stagger:${index}">
          <button class="library-card-trigger" type="button" data-library-id="${escapeHtml(item.id)}">
            <div class="library-card-main">
              <p class="tree-node-kicker">${escapeHtml(t("library.skillLabel"))}</p>
              <div class="tree-node-title-row">
                <p class="tree-node-title">${escapeHtml(displayName)}</p>
                ${businessCategoryMarkup}
              </div>
              ${hasDescription ? `<p class="artifact-meta">${escapeHtml(item.description)}</p>` : ""}
              <div class="library-card-hint">${escapeHtml(isExpanded ? t("library.hint.collapse") : t("library.hint.expand"))}</div>
            </div>
            <div class="library-card-side">
              <div class="library-card-pill-cloud">
                ${headerPills}
              </div>
              <span class="expand-indicator ${isExpanded ? "is-expanded" : ""}">
                <span>${escapeHtml(isExpanded ? t("library.action.collapse") : t("library.action.expand"))}</span>
                <span class="expand-chevron" aria-hidden="true">⌄</span>
              </span>
            </div>
          </button>
          ${isExpanded ? `<div class="library-card-body">${renderLibraryExpanded(item)}</div>` : ""}
        </article>
      `;
    })
    .join("");

  bindLibraryEvents();
  window.requestAnimationFrame(() => {
    syncLibraryDocPanels();
    window.requestAnimationFrame(syncLibraryDocPanels);
  });
}

async function loadLibraryDetail(id) {
  if (!id) {
    return;
  }

  try {
    const response = await fetch(`/api/skillpecker/library/${encodeURIComponent(id)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || t("library.loadingSkillDetails"));
    }
    state.libraryDetails[id] = payload;
  } catch (error) {
    state.libraryDetails[id] = {
      error: error.message || t("library.loadingSkillDetails"),
    };
  }

  renderLibraryList(state.libraryItems);
}

let libraryRequestToken = 0;

async function loadLibrary(options = {}) {
  const nextPage = options.page || state.libraryPage || 1;
  const nextQuery = Object.prototype.hasOwnProperty.call(options, "query")
    ? options.query.trim()
    : state.libraryQuery;
  const nextDecisionLevels = Object.prototype.hasOwnProperty.call(options, "decisionLevels")
    ? normalizeDecisionLevels(options.decisionLevels)
    : state.libraryDecisionLevels;
  const loadingKind = Object.prototype.hasOwnProperty.call(options, "query") ? "search" : "page";

  const params = new URLSearchParams({
    page: String(nextPage),
    page_size: String(state.libraryPageSize),
  });
  if (nextQuery) {
    params.set("query", nextQuery);
  }
  if (nextDecisionLevels.length) {
    params.set("decision_levels", nextDecisionLevels.join(","));
  }

  const requestToken = ++libraryRequestToken;
  state.libraryLoadedOnce = true;
  setLibraryLoading(true, loadingKind, nextQuery);
  if (!state.libraryItems.length) {
    renderLibraryLoadingState();
  } else {
    renderLibraryList(state.libraryItems);
    renderLibraryPagination();
  }

  try {
    const response = await fetch(`/api/skillpecker/library?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || t("library.loading"));
    }
    if (requestToken !== libraryRequestToken) {
      return;
    }

    state.libraryItems = payload.items || [];
    state.libraryPage = payload.page || nextPage;
    state.libraryTotal = payload.count || 0;
    state.libraryTotalPages = payload.totalPages || 0;
    state.libraryQuery = payload.query || "";
    state.libraryDecisionLevels = normalizeDecisionLevels(payload.decisionLevels || nextDecisionLevels);
    if (state.expandedLibraryId && !state.libraryItems.some((item) => item.id === state.expandedLibraryId)) {
      state.expandedLibraryId = null;
    }

    if (librarySearchInput && document.activeElement !== librarySearchInput && librarySearchInput.value !== state.libraryQuery) {
      librarySearchInput.value = state.libraryQuery;
    }
    libraryDecisionFilterInputs.forEach((input) => {
      input.checked = state.libraryDecisionLevels.includes(String(input.value || "").toUpperCase());
      input.closest("[data-decision-filter-chip]")?.classList.toggle("is-active", input.checked);
    });
    const startItem = state.libraryTotal ? (state.libraryPage - 1) * state.libraryPageSize + 1 : 0;
    const endItem = state.libraryTotal ? startItem + state.libraryItems.length - 1 : 0;
    setText(libraryRootInfo, payload.root || "Library Root");
    setText(libraryCountPill, t("library.matched", { count: state.libraryTotal }));
    setText(
      libraryMaliciousPill,
      state.libraryTotal ? t("library.range", { start: startItem, end: endItem, total: state.libraryTotal }) : t("library.noResults"),
    );
    setText(
      libraryPageIndicator,
      state.libraryTotal
        ? t("library.showing", { start: startItem, end: endItem, total: state.libraryTotal })
        : t("library.showingEmpty"),
    );
    if (libraryPaginationPrev) {
      libraryPaginationPrev.disabled = state.libraryPage <= 1;
    }
    if (libraryPaginationNext) {
      libraryPaginationNext.disabled = !state.libraryTotalPages || state.libraryPage >= state.libraryTotalPages;
    }

    renderLibraryList(state.libraryItems);
    renderLibraryPagination();
  } catch (error) {
    if (libraryList) {
      libraryList.innerHTML = `
        <div class="empty-state compact glass-panel">
          <h4>${escapeHtml(t("library.loadFailed"))}</h4>
          <p>${escapeHtml(error.message || t("common.unknownError"))}</p>
        </div>
      `;
    }
    if (libraryPaginationNumbers) {
      libraryPaginationNumbers.innerHTML = "";
    }
  } finally {
    setLibraryLoading(false);
  }
}

async function loadHealth() {
  const response = await fetch("/api/skillpecker/health");
  if (!response.ok) {
    return;
  }
  const payload = await response.json();
  setText(healthMode, `Scan Mode · ${payload.scanMode === "full-scan" ? "Full Scan" : "Preprocess"}`);
}

async function submitScan(event) {
  event.preventDefault();

  const archives = Array.from(archiveInput?.files || []);
  const directoryFiles = normalizeDirectoryFiles(directoryInput?.files);
  if (!archives.length && !directoryFiles.length) {
    showAppDialog({
      variant: "warning",
      eyebrow: t("dialog.uploadRequired"),
      title: t("dialog.chooseInput"),
      message: t("dialog.chooseInputMessage"),
      confirmLabel: t("dialog.understood"),
    });
    return;
  }

  state.scanSubmitting = true;
  syncScanJourneyState();

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = t("upload.submitting");
  }

  const formData = new FormData();
  archives.forEach((file) => formData.append("archives", file, file.name));
  directoryFiles.forEach(({ file, relativePath }) => {
    formData.append("files", file, file.name);
    formData.append("relative_paths", relativePath);
  });

  try {
    const response = await fetch("/api/skillpecker/scans", { method: "POST", body: formData });
    const payload = await readResponsePayload(response);
    if (!response.ok) {
      throw new Error(payload?.detail || payload?.rawText || "Failed to submit the scan job.");
    }

    state.expandedSkillKey = null;
    state.resultModalJobId = null;
    state.jobDetails = {};
    state.skillDetails = {};
    clearFileInput(archiveInput);
    clearFileInput(directoryInput);
    setUploadMode("archive");
    setView("scan");
    await loadQueue();
  } catch (error) {
    showAppDialog({
      variant: "danger",
      eyebrow: t("dialog.submissionFailed"),
      title: t("dialog.scanNotSubmitted"),
      message: error.message || "Failed to submit the scan job.",
      confirmLabel: t("common.close"),
    });
  } finally {
    state.scanSubmitting = false;
    syncScanJourneyState();
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = t("scan.start");
    }
  }
}

function bindNavigation() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-view-target]") : null;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.dataset.viewTarget === "home" && state.view === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.requestAnimationFrame(syncHomeStageState);
      return;
    }
    setView(target.dataset.viewTarget);
  });
}

function bindTopbarControls() {
  if (languageToggle) {
    languageToggle.addEventListener("click", () => {
      setLanguage(state.language === "en" ? "zh" : "en");
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      setTheme(state.theme === "dark" ? "light" : "dark");
    });
  }
}

function initTopbarBehavior() {
  if (!(topbarShell instanceof HTMLElement)) {
    return;
  }

  let hideTimer = 0;
  let latestYForHide = 0;
  let latestMinYForHide = 0;

  // 记录每个滚动源的 last 值：既支持 window，也支持内部容器（overflow-y: auto）滚动
  const lastYBySource = new Map();
  const ignoredScrollSources = [homeResultsList].filter((element) => element instanceof HTMLElement);

  /** 向下滚动一段距离后再收起顶栏；向上滚动立即显示 */
  const hideDelayMs = 320;
  const scrollDeltaThreshold = 4;

  const showTopbar = () => {
    topbarShell.classList.remove("is-hidden");
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
    }
  };

  const scheduleHide = (currentY, minYForHide) => {
    if (currentY < minYForHide) {
      return;
    }
    latestYForHide = currentY;
    latestMinYForHide = minYForHide;

    if (hideTimer) {
      window.clearTimeout(hideTimer);
    }
    hideTimer = window.setTimeout(() => {
      hideTimer = 0;
      if (latestYForHide >= latestMinYForHide) {
        topbarShell.classList.add("is-hidden");
      }
    }, hideDelayMs);
  };

  const updateFrom = (sourceKey, currentY, minYForHide) => {
    const lastY = lastYBySource.get(sourceKey);
    const delta = typeof lastY === "number" ? currentY - lastY : 0;
    lastYBySource.set(sourceKey, currentY);

    topbarShell.classList.toggle("is-scrolled", currentY > 8);

    if (currentY <= 20) {
      showTopbar();
      return;
    }

    // 向上滚动：立刻显示
    if (delta < -scrollDeltaThreshold) {
      showTopbar();
      return;
    }

    // 向下滚动：延迟后隐藏
    if (delta > scrollDeltaThreshold) {
      scheduleHide(currentY, minYForHide);
    }
  };

  const onWindowScroll = () => updateFrom("window", window.scrollY, 64);
  window.addEventListener("scroll", onWindowScroll, { passive: true });

  // 监听内部滚动容器的 scroll（scroll 不冒泡，但 capture 方式可捕获）
  document.addEventListener(
    "scroll",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target === document.documentElement || target === document.body) {
        return;
      }
      if (ignoredScrollSources.some((element) => target === element || element.contains(target))) {
        return;
      }

      // 只处理真正可滚动的容器
      if (target.scrollHeight <= target.clientHeight) {
        return;
      }

      updateFrom(target, target.scrollTop, 24);
    },
    { passive: true, capture: true },
  );

  window.addEventListener(
    "pointermove",
    (event) => {
      if (
        document.body?.dataset?.view === "home" &&
        ["analytics", "results"].includes(document.body?.dataset?.homeStage || "")
      ) {
        return;
      }
      if (event.clientY <= 96) {
        showTopbar();
      }
    },
    { passive: true },
  );

  onWindowScroll();
}

let librarySearchTimer = null;
let librarySearchComposing = false;

function bindLibraryControls() {
  if (librarySearchForm) {
    librarySearchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      state.expandedLibraryId = null;
      await loadLibrary({
        page: 1,
        query: librarySearchInput?.value || "",
        decisionLevels: libraryDecisionFilterInputs.filter((input) => input.checked).map((input) => input.value),
      });
    });
  }

  if (librarySearchInput) {
    librarySearchInput.addEventListener("compositionstart", () => {
      librarySearchComposing = true;
      window.clearTimeout(librarySearchTimer);
    });

    librarySearchInput.addEventListener("compositionend", async () => {
      librarySearchComposing = false;
      const nextQuery = librarySearchInput.value.trim();
      const nextDecisionLevels = libraryDecisionFilterInputs.filter((input) => input.checked).map((input) => input.value);
      if (nextQuery === state.libraryQuery && areDecisionLevelsEqual(nextDecisionLevels, state.libraryDecisionLevels)) {
        return;
      }
      state.expandedLibraryId = null;
      await loadLibrary({ page: 1, query: nextQuery, decisionLevels: nextDecisionLevels });
    });

    librarySearchInput.addEventListener("input", () => {
      if (librarySearchComposing) {
        return;
      }
      window.clearTimeout(librarySearchTimer);
      librarySearchTimer = window.setTimeout(async () => {
        const nextQuery = librarySearchInput.value.trim();
        const nextDecisionLevels = libraryDecisionFilterInputs.filter((input) => input.checked).map((input) => input.value);
        if (nextQuery === state.libraryQuery && areDecisionLevelsEqual(nextDecisionLevels, state.libraryDecisionLevels)) {
          return;
        }
        state.expandedLibraryId = null;
        await loadLibrary({ page: 1, query: nextQuery, decisionLevels: nextDecisionLevels });
      }, 250);
    });
  }

  libraryDecisionFilterInputs.forEach((input) => {
    const syncState = () => {
      input.closest("[data-decision-filter-chip]")?.classList.toggle("is-active", input.checked);
    };
    syncState();
    input.addEventListener("change", async () => {
      syncState();
      const nextDecisionLevels = libraryDecisionFilterInputs.filter((item) => item.checked).map((item) => item.value);
      if (areDecisionLevelsEqual(nextDecisionLevels, state.libraryDecisionLevels)) {
        return;
      }
      state.expandedLibraryId = null;
      await loadLibrary({
        page: 1,
        query: librarySearchInput?.value || "",
        decisionLevels: nextDecisionLevels,
      });
    });
  });

  if (libraryPaginationPrev) {
    libraryPaginationPrev.addEventListener("click", async () => {
      if (state.libraryPage <= 1) {
        return;
      }
      state.expandedLibraryId = null;
      await loadLibrary({ page: state.libraryPage - 1 });
      libraryList?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (libraryPaginationNext) {
    libraryPaginationNext.addEventListener("click", async () => {
      if (!state.libraryTotalPages || state.libraryPage >= state.libraryTotalPages) {
        return;
      }
      state.expandedLibraryId = null;
      await loadLibrary({ page: state.libraryPage + 1 });
      libraryList?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function restoreRoute() {
  const hash = window.location.hash.replace("#", "");
  setView(views.includes(hash) ? hash : "home");
}

uploadModeButtons.forEach((button) => {
  button.addEventListener("click", () => setUploadMode(button.dataset.uploadMode));
});
if (packagePickerTrigger) {
  packagePickerTrigger.addEventListener("click", () => {
    if (state.scanUploadMode === "directory") {
      directoryInput?.click();
    } else {
      archiveInput?.click();
    }
  });
}
if (archiveInput) {
  archiveInput.addEventListener("change", () => {
    if (archiveInput.files?.length) {
      setUploadMode("archive");
      clearFileInput(directoryInput);
    }
    updateSelectionViews();
  });
}
if (directoryInput) {
  directoryInput.addEventListener("change", () => {
    if (directoryInput.files?.length) {
      setUploadMode("directory");
      clearFileInput(archiveInput);
    }
    updateSelectionViews();
  });
}
if (scanForm) {
  scanForm.addEventListener("submit", submitScan);
}
if (scanResultModalClose) {
  scanResultModalClose.addEventListener("click", closeScanResultModal);
}
if (scanResultModal) {
  scanResultModal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.modalClose === "true") {
      closeScanResultModal();
    }
  });
}
if (appDialogClose) {
  appDialogClose.addEventListener("click", () => closeAppDialog("dismiss"));
}
if (appDialog) {
  appDialog.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.appDialogClose === "true") {
      closeAppDialog("dismiss");
    }
  });
}
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (appDialog && !appDialog.hidden) {
    closeAppDialog("dismiss");
    return;
  }
  if (state.resultModalJobId) {
    closeScanResultModal();
  }
});
window.addEventListener("hashchange", restoreRoute);

initializePreferences();
bindNavigation();
bindTopbarControls();
initTopbarBehavior();
bindLibraryControls();
setUploadMode(state.scanUploadMode);
restoreRoute();
loadHealth();
loadQueue();
setInterval(loadQueue, 4000);
window.alert = (message) => {
  showAppDialog({
    variant: "info",
    title: t("dialog.systemNotice"),
    message: String(message || ""),
    confirmLabel: t("dialog.acknowledge"),
  });
};
window.showAppDialog = showAppDialog;

// 监听视图切换，只有在首页时背景才全亮，进入控制台后背景变淡
const ambientBg = document.getElementById('ambientBg');
const embedParams = new URLSearchParams(window.location.search);
const isEmbeddedModule = embedParams.get("embed") === "1";
const embeddedSection = embedParams.get("section");

// 重写原有的 bindNavigation 中对 Hash 或 View 的监听，添加背景淡化效果
const originalSetView = setView; // 保存原有函数引用
setView = function(view) {
  originalSetView(view); // 执行你原来的逻辑
  
  if(ambientBg) {
    if (view === 'home') {
      ambientBg.style.opacity = '1';
    } else {
      // 进入扫描页或库页，让背景渐变变淡，避免干扰数据可读性
      ambientBg.style.opacity = '0.3'; 
    }
  }
};

// 页面加载完毕触发一次检查
document.addEventListener("DOMContentLoaded", () => {
    const hash = window.location.hash.replace("#", "") || 'home';
    if(ambientBg && hash !== 'home') {
        ambientBg.style.opacity = '0.3';
    }
});

function scrollToEmbeddedSection() {
  if (!isEmbeddedModule || !embeddedSection) {
    return;
  }

  const targetMap = {
    console: "skillpeckerScanConsole",
    queue: "skillpeckerTaskQueue",
  };

  const targetId = targetMap[embeddedSection];
  if (!targetId) {
    return;
  }

  window.requestAnimationFrame(() => {
    const element = document.getElementById(targetId);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: "start", behavior: "auto" });
    }
  });
}

const originalRestoreRoute = restoreRoute;
restoreRoute = function () {
  originalRestoreRoute();
  scrollToEmbeddedSection();
};
window.addEventListener("hashchange", scrollToEmbeddedSection);
scrollToEmbeddedSection();

// ================= 轻量 3D 视差（仅 scan 视图启用） =================
function initScanParallax() {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const finePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? true;
  if (prefersReducedMotion || !finePointer) {
    return;
  }

  const target = document.querySelector(".scan-launchpad");
  if (!(target instanceof HTMLElement)) {
    return;
  }

  let rafId = 0;
  let pendingX = 0;
  let pendingY = 0;

  const apply = () => {
    rafId = 0;
    const isActive = document.body?.dataset?.view === "scan";
    if (!isActive) {
      target.style.setProperty("--px", "0");
      target.style.setProperty("--py", "0");
      return;
    }
    target.style.setProperty("--px", pendingX.toFixed(4));
    target.style.setProperty("--py", pendingY.toFixed(4));
  };

  const schedule = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(apply);
  };

  const onPointerMove = (event) => {
    const isActive = document.body?.dataset?.view === "scan";
    if (!isActive) {
      return;
    }
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    pendingX = (x - 0.5) * 2;
    pendingY = (y - 0.5) * 2;
    schedule();
  };

  const onPointerLeave = () => {
    pendingX = 0;
    pendingY = 0;
    schedule();
  };

  target.addEventListener("pointermove", onPointerMove, { passive: true });
  target.addEventListener("pointerleave", onPointerLeave, { passive: true });
}

function initHomeInteractiveFx() {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const finePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? true;
  const homeView = document.getElementById("view-home");
  if (!(homeView instanceof HTMLElement)) {
    return;
  }

  const resetPointer = () => {
    homeView.style.setProperty("--home-vx", "50vw");
    homeView.style.setProperty("--home-vy", "34vh");
    homeView.style.setProperty("--home-tilt-x", "0deg");
    homeView.style.setProperty("--home-tilt-y", "0deg");
  };

  resetPointer();

  if (!prefersReducedMotion && finePointer) {
    let rafId = 0;
    let nextX = window.innerWidth * 0.5;
    let nextY = window.innerHeight * 0.34;
    let tiltX = 0;
    let tiltY = 0;

    const apply = () => {
      rafId = 0;
      const isActive = document.body?.dataset?.view === "home";
      if (!isActive) {
        resetPointer();
        return;
      }
      homeView.style.setProperty("--home-vx", `${nextX.toFixed(1)}px`);
      homeView.style.setProperty("--home-vy", `${nextY.toFixed(1)}px`);
      homeView.style.setProperty("--home-tilt-x", `${tiltX.toFixed(2)}deg`);
      homeView.style.setProperty("--home-tilt-y", `${tiltY.toFixed(2)}deg`);
    };

    const schedule = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(apply);
      }
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        if (document.body?.dataset?.view !== "home") {
          return;
        }
        const x = Math.max(0, Math.min(event.clientX, window.innerWidth));
        const y = Math.max(0, Math.min(event.clientY, window.innerHeight));
        nextX = x;
        nextY = y;
        const nx = x / Math.max(window.innerWidth, 1);
        const ny = y / Math.max(window.innerHeight, 1);
        tiltX = (0.5 - ny) * 4.4;
        tiltY = (nx - 0.5) * 6.2;
        schedule();
      },
      { passive: true },
    );

    window.addEventListener(
      "pointerleave",
      () => {
        nextX = window.innerWidth * 0.5;
        nextY = window.innerHeight * 0.34;
        tiltX = 0;
        tiltY = 0;
        schedule();
      },
      { passive: true },
    );
  }

  if (!prefersReducedMotion) {
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (document.body?.dataset?.view !== "home") {
          return;
        }
        const homePanel = event.target instanceof Element ? event.target.closest("#view-home") : null;
        if (!homePanel) {
          return;
        }
        const ripple = document.createElement("span");
        ripple.className = "home-click-ripple";
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.body.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      },
      { passive: true },
    );
  }
}

function initHomeStageScroll() {
  const homeView = document.getElementById("view-home");
  if (!(homeView instanceof HTMLElement)) {
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const desktopViewport = window.matchMedia?.("(min-width: 981px)");
  const stages = Array.from(homeView.querySelectorAll("[data-home-stage]"));
  const stageButtons = Array.from(homeView.querySelectorAll("[data-home-stage-target]"));
  const railButtons = Array.from(homeView.querySelectorAll(".home-stage-rail-link"));

  if (!stages.length) {
    return;
  }

  let rafId = 0;
  let activeStageIndex = 0;
  let wheelDelta = 0;
  let wheelResetTimer = 0;
  let stageLockTimer = 0;
  let stageScrollLocked = false;

  const clearStageLock = () => {
    stageScrollLocked = false;
    if (stageLockTimer) {
      window.clearTimeout(stageLockTimer);
      stageLockTimer = 0;
    }
  };

  const lockStageScroll = () => {
    stageScrollLocked = true;
    if (stageLockTimer) {
      window.clearTimeout(stageLockTimer);
    }
    stageLockTimer = window.setTimeout(clearStageLock, prefersReducedMotion ? 120 : 760);
  };

  const getStageIndex = (key) => stages.findIndex((stage) => stage instanceof HTMLElement && stage.dataset.homeStage === key);

  const getStageTop = (index) => {
    const stage = stages[index];
    if (!(stage instanceof HTMLElement)) {
      return 0;
    }
    return Math.max(0, window.scrollY + stage.getBoundingClientRect().top);
  };

  const goToStage = (index) => {
    const nextIndex = Math.max(0, Math.min(index, stages.length - 1));
    const targetTop = nextIndex === 0 ? 0 : getStageTop(nextIndex);
    activeStageIndex = nextIndex;
    wheelDelta = 0;
    lockStageScroll();
    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const getScrollableParent = (target) => {
    let node = target instanceof HTMLElement ? target : null;
    while (node && node !== homeView) {
      const style = window.getComputedStyle(node);
      const isScrollable = node.scrollHeight > node.clientHeight + 1 && /(auto|scroll|overlay)/.test(style.overflowY || "");
      if (isScrollable) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  const canScrollWithin = (element, deltaY) => {
    if (!(element instanceof HTMLElement) || deltaY === 0) {
      return false;
    }
    if (deltaY < 0) {
      return element.scrollTop > 0;
    }
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  };

  const update = () => {
    rafId = 0;
    const viewportHeight = Math.max(window.innerHeight, 1);
    const viewportCenter = viewportHeight * 0.5;
    let activeStage = stages[0]?.dataset.homeStage || "hero";
    let activeDistance = Number.POSITIVE_INFINITY;
    let nextStageIndex = 0;

    stages.forEach((stage, index) => {
      if (!(stage instanceof HTMLElement)) {
        return;
      }
      const rect = stage.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      if (distance < activeDistance) {
        activeDistance = distance;
        activeStage = stage.dataset.homeStage || activeStage;
        nextStageIndex = index;
      }
    });

    activeStageIndex = nextStageIndex;
    document.body.dataset.homeStage = activeStage;
    railButtons.forEach((button) => {
      const isActive = button.dataset.homeStageTarget === activeStage;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const schedule = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(update);
    }
  };

  stageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetKey = button.dataset.homeStageTarget;
      const targetIndex = targetKey ? getStageIndex(targetKey) : -1;
      if (targetIndex !== -1) {
        goToStage(targetIndex);
      }
    });
  });

  window.addEventListener(
    "wheel",
    (event) => {
      if (document.body?.dataset?.view !== "home") {
        return;
      }
      if (desktopViewport && !desktopViewport.matches) {
        return;
      }
      if (Math.abs(event.deltaY) < 4) {
        return;
      }

      const scrollableParent = getScrollableParent(event.target);
      if (canScrollWithin(scrollableParent, event.deltaY)) {
        return;
      }

      event.preventDefault();

      if (stageScrollLocked) {
        return;
      }

      wheelDelta += event.deltaY;
      if (wheelResetTimer) {
        window.clearTimeout(wheelResetTimer);
      }
      wheelResetTimer = window.setTimeout(() => {
        wheelDelta = 0;
        wheelResetTimer = 0;
      }, 180);

      if (Math.abs(wheelDelta) < 44) {
        return;
      }

      const direction = wheelDelta > 0 ? 1 : -1;
      wheelDelta = 0;
      const nextIndex = Math.max(0, Math.min(activeStageIndex + direction, stages.length - 1));
      if (nextIndex !== activeStageIndex) {
        goToStage(nextIndex);
      }
    },
    { passive: false },
  );

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  syncHomeStageState = schedule;
  schedule();
}

function initHomeCharts() {
  if (typeof window.echarts !== "object" || !window.echarts) {
    return;
  }

  const getCssVar = (name, fallback) => {
    const v = getComputedStyle(document.body).getPropertyValue(name)?.trim();
    return v || fallback;
  };

  const metricScanTotal = document.getElementById("homeMetricScanTotal");
  const metricIssueCount = document.getElementById("homeMetricProblemCount");
  const metricOverreachRatio = document.getElementById("homeMetricOverreachRatio");
  const metricScanTotalLabel = document.getElementById("homeMetricScanTotalLabel");
  const metricIssueCountLabel = document.getElementById("homeMetricProblemCountLabel");
  const metricOverreachRatioLabel = document.getElementById("homeMetricOverreachRatioLabel");

  const homeChartProblemTypeTitle = document.getElementById("homeChartProblemTypeTitle");
  const homeChartMainRiskTitle = document.getElementById("homeChartMainRiskTitle");
  const homeChartBusinessTop10Title = document.getElementById("homeChartBusinessTop10Title");

  const containers = {
    problemType: document.getElementById("homeChartProblemType"),
    mainRisk: document.getElementById("homeChartMainRisk"),
    businessTop10: document.getElementById("homeChartBusinessTop10"),
  };

  if (
    !containers.problemType ||
    !containers.mainRisk ||
    !containers.businessTop10
  ) {
    return;
  }

  const instances = new Map();

  const ensure = (key, el) => {
    if (!instances.has(key)) {
      instances.set(key, window.echarts.init(el, null, { renderer: "canvas" }));
    }
  };

  const renderMetrics = () => {
    if (metricScanTotal) metricScanTotal.textContent = "~100,000";
    if (metricIssueCount) metricIssueCount.textContent = "1,350";
    if (metricOverreachRatio) metricOverreachRatio.textContent = "88.7%";

    const labels =
      state.language === "zh"
        ? {
            scanTotal: "扫描 Skill 总量",
            issueCount: "问题 Skill 数量",
            overreachRatio: "越界型占比",
            problemTypeTitle: "问题类型分布",
            mainRiskTitle: "主风险类别",
            businessTop10Title: "问题 Skill 业务分类 TOP 10",
          }
        : {
            scanTotal: "Total scanned skills",
            issueCount: "Problematic skill count",
            overreachRatio: "Overreach ratio",
            problemTypeTitle: "Issue type distribution",
            mainRiskTitle: "Primary risk categories",
            businessTop10Title: "Problem skill business categories (TOP 10)",
          };

    if (metricScanTotalLabel) metricScanTotalLabel.textContent = labels.scanTotal;
    if (metricIssueCountLabel) metricIssueCountLabel.textContent = labels.issueCount;
    if (metricOverreachRatioLabel) metricOverreachRatioLabel.textContent = labels.overreachRatio;
    if (homeChartProblemTypeTitle) homeChartProblemTypeTitle.textContent = labels.problemTypeTitle;
    if (homeChartMainRiskTitle) homeChartMainRiskTitle.textContent = labels.mainRiskTitle;
    if (homeChartBusinessTop10Title) homeChartBusinessTop10Title.textContent = labels.businessTop10Title;
  };

  const renderCharts = () => {
    const isDark = state.theme === "dark";
    const text = getCssVar("--text", isDark ? "#f1f5f9" : "#0f172a");
    const muted = getCssVar("--muted", isDark ? "#b6c4d6" : "#475569");

    ensure("problemType", containers.problemType);
    ensure("mainRisk", containers.mainRisk);
    ensure("businessTop10", containers.businessTop10);

    const problemTypeData = [
      // Color severity: MALICIOUS (deepest) -> SUSPICIOUS -> OVERREACH (lightest)
      { name: state.language === "zh" ? "恶意型" : "Malicious ", value: 36, percent: 2.7, color: "#4c1d95" },
      { name: state.language === "zh" ? "可疑型" : "Suspicious ", value: 117, percent: 8.6, color: "#f97316" },
      { name: state.language === "zh" ? "越界型" : "Overreach ", value: 1201, percent: 88.7, color: "#fb7185" },
    ];

    instances.get("problemType").setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        tooltip: {
          trigger: "item",
          formatter: (p) => {
            if (!p?.data) return "";
            const d = p.data;
            if (state.language === "zh") {
              return `${d.name}<br/>数量：${d.value}<br/>占比：${d.percent}%`;
            }
            return `${d.name}<br/>Count: ${d.value}<br/>Ratio: ${d.percent}%`;
          },
        },
        series: [
          {
            type: "pie",
            radius: ["42%", "64%"],
            center: ["46%", "56%"],
            avoidLabelOverlap: true,
            labelLayout: { hideOverlap: true },
            itemStyle: {
              borderColor: isDark ? "rgba(148, 163, 184, 0.22)" : "rgba(15, 23, 42, 0.06)",
              borderWidth: 1,
            },
            label: {
              show: true,
              color: text,
              fontWeight: 900,
              fontSize: 14,
              lineHeight: 18,
              edgeDistance: 10,
              bleedMargin: 4,
              formatter: (p) => {
                const d = p?.data;
                if (!d) return "";
                return `${d.name}\n${d.value} (${d.percent}%)`;
              },
            },
            labelLine: { length: 10, length2: 8, smooth: false },
            data: problemTypeData.map((d) => ({
              name: d.name,
              value: d.value,
              percent: d.percent,
              itemStyle: { color: d.color },
            })),
          },
        ],
      },
      true,
    );

    const mainRiskData = [
      {
        key: "access_boundary",
        zh: "访问边界风险",
        en: "Access Boundary Risk",
        value: 832,
        color: "#ef4444",
      },
      { key: "data_governance", zh: "数据治理风险", en: "Data Governance Risk", value: 291, color: "#f59e0b" },
      {
        key: "execution_system",
        zh: "执行/系统风险",
        en: "Execution/System Risk",
        value: 185,
        color: "#60a5fa",
      },
      {
        key: "explicit_malicious",
        zh: "明确恶意运行行为",
        en: "Explicit Malicious Activity",
        value: 36,
        color: "#a78bfa",
      },
      { key: "other", zh: "其他", en: "Other", value: 10, color: "#94a3b8" },
    ];

    const maxMainRisk = Math.max(...mainRiskData.map((d) => d.value)) * 1.12;

    instances.get("mainRisk").setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { left: 72, right: 18, top: 8, bottom: 8, containLabel: true },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            const p = params?.[0];
            if (!p) return "";
            const d = mainRiskData[p.dataIndex];
            if (!d) return "";
            const label = state.language === "zh" ? d.zh : d.en;
            return state.language === "zh" ? `${label}<br/>数量：${d.value}` : `${label}<br/>Count: ${d.value}`;
          },
        },
        xAxis: { type: "value", show: false, max: maxMainRisk },
        yAxis: {
          type: "category",
          data: mainRiskData.map((d) => (state.language === "zh" ? d.zh : d.en)),
          axisLabel: { color: muted, fontSize: 14, fontWeight: 800, lineHeight: 18 },
          axisTick: { show: false },
        },
        series: [
          {
            type: "bar",
            barWidth: 20,
            barCategoryGap: "26%",
            data: mainRiskData.map((d) => ({
              value: d.value,
              itemStyle: { color: d.color, borderRadius: [10, 10, 10, 10] },
            })),
            label: {
              show: true,
              position: "right",
              color: text,
              fontWeight: 900,
              fontSize: 14,
              formatter: (p) => `${mainRiskData[p.dataIndex].value}`,
            },
          },
        ],
      },
      true,
    );

    const businessTop10Data = [
      { key: "tools", zh: "通用工具", en: "Tools", value: 286, color: "#dc2626" },
      { key: "productivity-tools", zh: "办公生产力", en: "Productivity Tools", value: 204, color: "#f97316" },
      { key: "llm-ai", zh: "大模型/AI", en: "LLM / AI", value: 93, color: "#f59e0b" },
      { key: "data-ai", zh: "数据智能", en: "Data Intelligence", value: 46, color: "#0ea5e9" },
      { key: "devops", zh: "运维", en: "DevOps", value: 45, color: "#2563eb" },
      { key: "cicd", zh: "CI/CD", en: "CI/CD", value: 42, color: "#8b5cf6" },
      { key: "testing-security", zh: "测试安全", en: "Testing & Security", value: 38, color: "#14b8a6" },
      { key: "finance-investment", zh: "金融投资", en: "Finance & Investment", value: 37, color: "#38bdf8" },
      { key: "project-management", zh: "项目管理", en: "Project Management", value: 36, color: "#065f46" },
      { key: "other", zh: "其他", en: "Other", value: 166, color: "#94a3b8" },
    ];

    const maxBusinessTop10 = Math.max(...businessTop10Data.map((d) => d.value)) * 1.12;

    instances.get("businessTop10").setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { left: 78, right: 18, top: 8, bottom: 8, containLabel: true },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            const p = params?.[0];
            if (!p) return "";
            const d = businessTop10Data[p.dataIndex];
            const label = state.language === "zh" ? d.zh : d.en;
            return state.language === "zh" ? `${label}<br/>数量：${d.value}` : `${label}<br/>Count: ${d.value}`;
          },
        },
        xAxis: { type: "value", show: false, max: maxBusinessTop10 },
        yAxis: {
          type: "category",
          data: businessTop10Data.map((d) => (state.language === "zh" ? d.zh : d.en)),
          axisLabel: { color: muted, fontSize: 14, fontWeight: 800, lineHeight: 18 },
          axisTick: { show: false },
        },
        series: [
          {
            type: "bar",
            data: businessTop10Data.map((d) => ({
              value: d.value,
              itemStyle: { color: d.color, borderRadius: [10, 10, 10, 10] },
            })),
            barWidth: 18,
            barCategoryGap: "24%",
            label: {
              show: true,
              position: "right",
              color: text,
              fontWeight: 900,
              fontSize: 14,
              formatter: (p) => `${businessTop10Data[p.dataIndex].value}`,
            },
          },
        ],
      },
      true,
    );
  };

  const resizeAll = () => {
    instances.forEach((chart) => chart.resize());
  };

  // Initial render
  renderMetrics();
  renderCharts();
  resizeAll();

  // Re-render when theme/language/view changes (home charts are only meaningful on the home page).
  const obs = new MutationObserver(() => {
    const view = document.body?.dataset?.view;
    if (view !== "home") return;
    renderMetrics();
    renderCharts();
    resizeAll();
  });
  obs.observe(document.body, { attributes: true, attributeFilter: ["data-theme", "data-locale", "data-view"] });

  window.addEventListener(
    "resize",
    () => {
      const view = document.body?.dataset?.view;
      if (view !== "home") return;
      resizeAll();
    },
    { passive: true },
  );
}

window.addEventListener("resize", () => {
  window.requestAnimationFrame(syncLibraryDocPanels);
});

initScanParallax();
initHomeInteractiveFx();
initHomeStageScroll();
initHomeCharts();



