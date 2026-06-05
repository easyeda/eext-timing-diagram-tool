// 时序图编辑器主逻辑

// 自定义弹窗：输入框（替代prompt）
function showPromptDialog(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-dialog-overlay');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const inputEl = document.getElementById('dialog-input');
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        inputEl.style.display = 'block';
        inputEl.value = defaultValue;
        cancelBtn.style.display = 'inline-block';
        overlay.style.display = 'flex';
        inputEl.focus();
        inputEl.select();

        function cleanup() {
            overlay.style.display = 'none';
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            inputEl.removeEventListener('keydown', onKeydown);
        }
        function onConfirm() { cleanup(); resolve(inputEl.value.trim() || null); }
        function onCancel() { cleanup(); resolve(null); }
        function onKeydown(e) {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        }
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        inputEl.addEventListener('keydown', onKeydown);
    });
}

// 自定义弹窗：确认框（替代confirm）
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-dialog-overlay');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const inputEl = document.getElementById('dialog-input');
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        inputEl.style.display = 'none';
        cancelBtn.style.display = 'inline-block';
        overlay.style.display = 'flex';

        function cleanup() {
            overlay.style.display = 'none';
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        }
        function onConfirm() { cleanup(); resolve(true); }
        function onCancel() { cleanup(); resolve(false); }
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// 示例WaveJSON配置
const EXAMPLE_WAVEJSON = `{ "signal": [
  { "name": "clk",  "wave": "p.....|..." },
  { "name": "dat",  "wave": "x.345x|=.x", "data": ["head", "body", "tail", "data"] },
  { "name": "req",  "wave": "0.1..0|1.0" },
  {},
  { "name": "ack",  "wave": "1.....|01." }
]}`;

const XOR_GATE_WAVEJSON = `{ assign:[
  ["out",
    ["|",
      ["&", ["~", "a"], "b"],
      ["&", ["~", "b"], "a"]
    ]
  ]
]}`;

// 全局状态
let configs = [];
let currentConfigId = null;
let renderTimeout = null;
let i18nData = {};

// 语言代码映射
function normalizeLanguageCode(lang) {
    // 将各种可能的语言代码统一映射
    const langMap = {
        'zh': 'zh-Hans',
        'zh-CN': 'zh-Hans',
        'zh-Hans': 'zh-Hans',
        'zh-cn': 'zh-Hans',
        'en': 'en',
        'en-US': 'en',
        'en-us': 'en'
    };
    return langMap[lang] || 'zh-Hans';
}

// 加载多语言
async function loadI18n() {
    try {
        const lang = await eda.sys_I18n.getCurrentLanguage();
        console.log('[Timing Diagram] Current language:', lang);

        // 规范化语言代码
        const normalizedLang = normalizeLanguageCode(lang);
        console.log('[Timing Diagram] Normalized language:', normalizedLang);

        // 从内联的多语言数据中获取
        i18nData = LOCALES[normalizedLang] || LOCALES['zh-Hans'];
        applyI18n();
    } catch (error) {
        console.error('[Timing Diagram] Load i18n error:', error);
        // 如果加载失败，使用默认的中文
        i18nData = LOCALES['zh-Hans'] || {
            'timing-diagram-title': '时序图编辑器',
            'config-list': '配置列表',
            'new-config': '新建配置',
            'save-config': '保存配置',
            'delete-config': '删除配置',
            'rename-config': '重命名',
            'export': '导出',
            'apply': '应用',
            'help': '教程1',
            'help2': '教程2'
        };
        applyI18n();
    }
}

// 应用多语言
function applyI18n() {
    try {
        // 更新文本内容
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });

        // 更新title属性
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });

        // 更新placeholder属性
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
        });

        // 更新页面标题
        if (i18nData['timing-diagram-title']) {
            document.title = i18nData['timing-diagram-title'];
        }

        // 更新自定义对话框按钮文本
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');
        if (confirmBtn && i18nData['dialog-confirm-btn']) {
            confirmBtn.textContent = i18nData['dialog-confirm-btn'];
        }
        if (cancelBtn && i18nData['dialog-cancel-btn']) {
            cancelBtn.textContent = i18nData['dialog-cancel-btn'];
        }
    } catch (error) {
        console.error('[Timing Diagram] Apply i18n error:', error);
    }
}

// 获取多语言文本
function t(key) {
    if (i18nData[key]) return i18nData[key];
    try {
        if (eda && eda.sys_I18n) return eda.sys_I18n.text(key);
    } catch (e) {}
    return key;
}

// 初始化
async function init() {
    // 先绑定事件，确保UI可交互
    bindEvents();

    try {
        // 加载多语言
        await loadI18n();

        // 加载主题
        await loadTheme();

        // 加载配置
        await loadConfigs();

        // 加载当前配置或示例
        if (currentConfigId && configs.find(c => c.id === currentConfigId)) {
            loadConfig(currentConfigId);
        } else if (configs.length > 0) {
            loadConfig(configs[0].id);
        } else {
            // 创建示例配置
            const exampleConfig1 = {
                id: generateId(),
                name: t('example-config') || '示例配置',
                wavejson: EXAMPLE_WAVEJSON,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            const exampleConfig2 = {
                id: generateId(),
                name: t('example-config') + '2' || '示例配置2',
                wavejson: XOR_GATE_WAVEJSON,
                createdAt: Date.now() + 1,
                updatedAt: Date.now() + 1
            };
            configs.push(exampleConfig1, exampleConfig2);
            await saveConfigs();
            loadConfig(exampleConfig1.id);
        }

        // 初始化行号
        updateLineNumbers();
    } catch (error) {
        console.error('[Timing Diagram] Init error:', error);
        showError(t('error-init-failed') + ': ' + error.message);
    }
}

// 加载配置
async function loadConfigs() {
    try {
        const savedConfigs = await eda.sys_Storage.getExtensionUserConfig('configs');
        if (savedConfigs && Array.isArray(savedConfigs)) {
            configs = savedConfigs;
        }

        const savedCurrentId = await eda.sys_Storage.getExtensionUserConfig('currentConfig');
        if (savedCurrentId) {
            currentConfigId = savedCurrentId;
        }

        renderConfigList();
    } catch (error) {
        console.error('[Timing Diagram] Load configs error:', error);
    }
}

// 保存配置
async function saveConfigs() {
    try {
        await eda.sys_Storage.setExtensionUserConfig('configs', configs);
        await eda.sys_Storage.setExtensionUserConfig('currentConfig', currentConfigId);
    } catch (error) {
        console.error('[Timing Diagram] Save configs error:', error);
        throw error;
    }
}

// 渲染配置列表
function renderConfigList() {
    const listEl = document.getElementById('config-list');
    listEl.innerHTML = '';

    configs.forEach(config => {
        const item = document.createElement('div');
        item.className = 'config-item';
        if (config.id === currentConfigId) {
            item.classList.add('active');
        }
        item.textContent = config.name;
        item.dataset.id = config.id;
        item.onclick = () => loadConfig(config.id);
        listEl.appendChild(item);
    });
}

// 加载配置
function loadConfig(configId) {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    currentConfigId = configId;
    document.getElementById('wavejson-editor').value = config.wavejson;
    renderConfigList();
    renderWaveform(config.wavejson);
    saveConfigs();
}

// 渲染波形图
function renderWaveform(wavejson) {
    // 清除之前的超时
    if (renderTimeout) {
        clearTimeout(renderTimeout);
    }

    // 延迟渲染，避免频繁更新
    renderTimeout = setTimeout(() => {
        try {
            const data = Function('return (' + wavejson + ')')();
            const previewEl = document.getElementById('waveform-preview');
            previewEl.innerHTML = '';

            // 创建临时容器
            const container = document.createElement('div');
            container.id = 'wave-container0';
            previewEl.appendChild(container);

            // 渲染波形
            WaveDrom.RenderWaveForm(0, data, 'wave-container');

            // 调整SVG显示，移除外层留白
            setTimeout(() => {
                const svg = previewEl.querySelector('svg');
                if (svg) {
                    try {
                        // 获取SVG内部实际内容的边界框
                        const bbox = svg.getBBox();
                        if (bbox && bbox.width > 0 && bbox.height > 0) {
                            // 设置viewBox为实际内容区域，添加小边距
                            const padding = 10;
                            svg.setAttribute('viewBox',
                                `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
                            );

                            // 计算合适的显示尺寸
                            const contentWidth = bbox.width + padding * 2;
                            const contentHeight = bbox.height + padding * 2;
                            const targetHeight = 300; // 目标高度

                            // 如果内容高度小于目标高度，按比例放大
                            if (contentHeight < targetHeight) {
                                const scale = targetHeight / contentHeight;
                                const displayWidth = contentWidth * scale;
                                svg.style.width = displayWidth + 'px';
                                svg.style.height = targetHeight + 'px';
                            } else {
                                // 内容高度足够，使用自适应
                                svg.style.width = '100%';
                                svg.style.height = 'auto';
                            }

                            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                        }
                    } catch (e) {
                        console.warn('[Timing Diagram] Failed to adjust SVG viewBox:', e);
                    }
                }
            }, 50);
        } catch (error) {
            console.error('[Timing Diagram] Render error:', error);
            showError(t('error-render-failed') + ': ' + error.message);
        }
    }, 300);
}

// 生成唯一ID
function generateId() {
    return 'config_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示错误消息
function showError(message) {
    eda.sys_Message.showToastMessage(message);
}

// 显示成功消息
function showSuccess(message) {
    eda.sys_Message.showToastMessage(message);
}

// 更新行号
function updateLineNumbers() {
    const editor = document.getElementById('wavejson-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const lines = editor.value.split('\n');
    const lineCount = lines.length;

    let lineNumbersHtml = '';
    for (let i = 1; i <= lineCount; i++) {
        lineNumbersHtml += i + '\n';
    }
    lineNumbers.textContent = lineNumbersHtml;
}

// 调整SVG显示尺寸
function adjustSVGSize() {
    const previewEl = document.getElementById('waveform-preview');
    const svg = previewEl.querySelector('svg');
    if (!svg) return;

    try {
        // 获取预览区的实际高度
        const previewHeight = previewEl.clientHeight;

        // 获取SVG内部实际内容的边界框
        const bbox = svg.getBBox();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
            // 计算合适的显示尺寸
            const contentWidth = bbox.width + 20; // padding
            const contentHeight = bbox.height + 20;

            // 根据预览区高度动态调整目标高度（留出一些边距）
            const targetHeight = Math.max(200, previewHeight - 40);

            // 如果内容高度小于目标高度，按比例放大
            if (contentHeight < targetHeight) {
                const scale = targetHeight / contentHeight;
                const displayWidth = contentWidth * scale;
                svg.style.width = displayWidth + 'px';
                svg.style.height = targetHeight + 'px';
            } else {
                // 内容高度足够，使用自适应
                svg.style.width = '100%';
                svg.style.height = 'auto';
                svg.style.maxHeight = targetHeight + 'px';
            }
        }
    } catch (e) {
        console.warn('[Timing Diagram] Failed to adjust SVG size:', e);
    }
}

// 同步行号滚动
function syncLineNumbersScroll() {
    const editor = document.getElementById('wavejson-editor');
    const lineNumbers = document.getElementById('line-numbers');
    lineNumbers.scrollTop = editor.scrollTop;
}

// 加载主题
async function loadTheme() {
    try {
        const savedTheme = await eda.sys_Storage.getExtensionUserConfig('theme');
        if (savedTheme === 'dark') {
            document.querySelector('.editor-wrapper').classList.add('dark-theme');
        }
    } catch (error) {
        console.error('[Timing Diagram] Load theme error:', error);
    }
}

// 切换主题
async function toggleTheme() {
    const editorWrapper = document.querySelector('.editor-wrapper');
    const isDark = editorWrapper.classList.toggle('dark-theme');
    try {
        await eda.sys_Storage.setExtensionUserConfig('theme', isDark ? 'dark' : 'light');
    } catch (error) {
        console.error('[Timing Diagram] Save theme error:', error);
    }
}

// 绑定事件
function bindEvents() {
    // 编辑器输入事件
    const editor = document.getElementById('wavejson-editor');
    editor.addEventListener('input', (e) => {
        renderWaveform(e.target.value);
        updateLineNumbers();
    });

    // 编辑器滚动事件
    editor.addEventListener('scroll', syncLineNumbersScroll);

    // 主题切换按钮
    document.getElementById('theme-toggle-btn').onclick = toggleTheme;

    // 拖拽调整编辑区/预览区高度
    const handle = document.getElementById('resize-handle');
    const editorSection = document.querySelector('.editor-section');
    const mainContent = document.querySelector('.main-content');
    let startY = 0;
    let startHeight = 0;
    handle.addEventListener('pointerdown', (e) => {
        handle.setPointerCapture(e.pointerId);
        startY = e.clientY;
        startHeight = editorSection.offsetHeight;
        handle.classList.add('dragging');
        e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
        if (!handle.hasPointerCapture(e.pointerId)) return;
        const delta = e.clientY - startY;
        const mainHeight = mainContent.offsetHeight;
        const newHeight = Math.max(80, Math.min(mainHeight - 80, startHeight + delta));
        editorSection.style.height = newHeight + 'px';
        // 拖拽时实时调整SVG尺寸
        adjustSVGSize();
    });
    handle.addEventListener('pointerup', (e) => {
        if (handle.hasPointerCapture(e.pointerId)) {
            handle.releasePointerCapture(e.pointerId);
            handle.classList.remove('dragging');
            // 拖拽结束后再次调整SVG尺寸
            adjustSVGSize();
        }
    });

    // 新建配置
    document.getElementById('new-config-btn').onclick = async () => {
        const name = await showPromptDialog(t('dialog-new-config-title'), t('dialog-new-config-message'), t('dialog-new-config-default'));
        if (!name) return;

        const newConfig = {
            id: generateId(),
            name: name,
            wavejson: EXAMPLE_WAVEJSON,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        configs.push(newConfig);
        await saveConfigs();
        renderConfigList();
        loadConfig(newConfig.id);
        showSuccess(t('success-created'));
    };

    // 保存配置
    document.getElementById('save-config-btn').onclick = async () => {
        if (!currentConfigId) return;

        const config = configs.find(c => c.id === currentConfigId);
        if (!config) return;

        const wavejson = editor.value;

        // 验证WaveJSON（支持JS对象语法）
        try {
            Function('return (' + wavejson + ')')();
        } catch (error) {
            showError(t('error-save-syntax'));
            return;
        }

        config.wavejson = wavejson;
        config.updatedAt = Date.now();

        await saveConfigs();
        showSuccess(t('success-saved'));
    };

    // 重命名配置
    document.getElementById('rename-config-btn').onclick = async () => {
        if (!currentConfigId) return;

        const config = configs.find(c => c.id === currentConfigId);
        if (!config) return;

        const newName = await showPromptDialog(t('dialog-rename-title'), t('dialog-rename-message'), config.name);
        if (!newName || newName === config.name) return;

        config.name = newName;
        config.updatedAt = Date.now();

        await saveConfigs();
        renderConfigList();
        showSuccess(t('success-renamed'));
    };

    // 删除配置
    document.getElementById('delete-config-btn').onclick = async () => {
        if (!currentConfigId) return;

        const config = configs.find(c => c.id === currentConfigId);
        if (!config) return;

        if (!await showConfirmDialog(t('delete-config'), `${t('confirm-delete').replace('${1}', config.name)}`)) return;

        configs = configs.filter(c => c.id !== currentConfigId);

        // 切换到第一个配置或创建新配置
        if (configs.length > 0) {
            currentConfigId = configs[0].id;
            loadConfig(currentConfigId);
        } else {
            currentConfigId = null;
            editor.value = '';
            document.getElementById('waveform-preview').innerHTML = '';
        }

        await saveConfigs();
        renderConfigList();
        showSuccess(t('success-deleted'));
    };

    // 导出配置
    document.getElementById('export-config-btn').onclick = async () => {
        try {
            // 创建配置文件对象
            const configFile = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                appName: 'Timing Diagram Tool',
                configs: configs
            };

            // 转换为JSON字符串
            const jsonStr = JSON.stringify(configFile, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });

            // 生成文件名
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const filename = `timing-diagram-configs_${dateStr}.json`;

            // 下载文件
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showSuccess(t('success-config-exported'));
        } catch (error) {
            console.error('[Timing Diagram] Export config error:', error);
            showError(t('error-save-failed') + ': ' + error.message);
        }
    };

    // 导入配置
    document.getElementById('import-config-btn').onclick = async () => {
        try {
            // 确认导入操作
            if (!await showConfirmDialog(t('import-config'), t('confirm-import'))) return;

            // 创建文件选择器
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (e) => {
                try {
                    const file = e.target.files[0];
                    if (!file) return;

                    // 读取文件内容
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const configFile = JSON.parse(event.target.result);

                            // 验证配置文件格式
                            if (!configFile.version || !configFile.configs || !Array.isArray(configFile.configs)) {
                                showError(t('error-import-failed') + ': ' + t('error-import-format-error'));
                                return;
                            }

                            // 覆盖当前配置
                            configs = configFile.configs;

                            // 保存并刷新
                            await saveConfigs();
                            renderConfigList();

                            // 加载第一个配置
                            if (configs.length > 0) {
                                loadConfig(configs[0].id);
                            } else {
                                currentConfigId = null;
                                editor.value = '';
                                document.getElementById('waveform-preview').innerHTML = '';
                            }

                            showSuccess(t('success-config-imported'));
                        } catch (error) {
                            console.error('[Timing Diagram] Parse config error:', error);
                            showError(t('error-import-failed') + ': ' + error.message);
                        }
                    };

                    reader.readAsText(file);
                } catch (error) {
                    console.error('[Timing Diagram] Import config error:', error);
                    showError(t('error-import-failed') + ': ' + error.message);
                }
            };

            // 触发文件选择
            input.click();
        } catch (error) {
            console.error('[Timing Diagram] Import config error:', error);
            showError(t('error-import-failed') + ': ' + error.message);
        }
    };

    // 导出SVG
    document.getElementById('export-btn').onclick = () => {
        exportSVG();
    };

    // 应用到原理图
    document.getElementById('apply-btn').onclick = () => {
        applyToSchematic();
    };

    // 帮助
    document.getElementById('help-btn').onclick = () => {
        eda.sys_Window.open('https://wavedrom.com/tutorial.html');
    };

    // 帮助2
    document.getElementById('help2-btn').onclick = () => {
        eda.sys_Window.open('https://wavedrom.com/tutorial2.html');
    };

    // 取消
    document.getElementById('cancel-btn').onclick = () => {
        eda.sys_IFrame.closeIFrame('timing-diagram-editor');
    };
}

// 导出SVG
async function exportSVG() {
    try {
        const svg = document.querySelector('#waveform-preview svg');
        if (!svg) {
            showError(t('error-no-svg'));
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

        // 获取文件名
        const schematicInfo = await eda.dmt_Schematic.getCurrentSchematicInfo();
        const schematicName = schematicInfo ? schematicInfo.name : 'Schematic';
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const filename = `Timing_${schematicName}_${dateStr}.svg`;

        // 下载
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess(t('success-exported'));
    } catch (error) {
        console.error('[Timing Diagram] Export error:', error);
        showError(t('error-export-failed') + ': ' + error.message);
    }
}

// 应用到原理图
async function applyToSchematic() {
    console.log('[Timing Diagram] applyToSchematic called');
    try {
        const svg = document.querySelector('#waveform-preview svg');
        console.log('[Timing Diagram] SVG element:', svg);
        if (!svg) {
            showError(t('error-no-svg'));
            return;
        }

        // 显示处理中的提示
        showSuccess(t('processing'));

        console.log('[Timing Diagram] About to call extractLinesFromSVG');
        // 从 SVG 提取线条和文本（必须在关闭 iframe 之前完成）
        const { lines, texts } = extractLinesFromSVG(svg);
        console.log('[Timing Diagram] extractLinesFromSVG returned:', lines.length, 'lines,', texts.length, 'texts');

        if (lines.length === 0 && texts.length === 0) {
            showError(t('error-no-lines'));
            return;
        }

        // 在原理图中创建线条和文本
        const createdIds = await createLinesInSchematic(lines, texts);

        // 关闭当前弹窗
        eda.sys_IFrame.closeIFrame('timing-diagram-editor');

        showSuccess(t('success-applied'));
    } catch (error) {
        console.error('[Timing Diagram] Apply error:', error);
        showError(t('error-apply-failed') + ': ' + error.message);
    }
}

// 从 SVG 提取线条和文本
function extractLinesFromSVG(svg) {
    console.log('[Timing Diagram] extractLinesFromSVG called');
    const lines = [];
    const texts = [];
    const scale = 1.0;

    // 获取 SVG 的 viewBox 偏移
    const viewBox = svg.getAttribute('viewBox');
    let viewBoxOffsetX = 0, viewBoxOffsetY = 0;
    if (viewBox) {
        const values = viewBox.split(/\s+/).map(parseFloat);
        viewBoxOffsetX = values[0] || 0;
        viewBoxOffsetY = values[1] || 0;
    }

    // 方法1: 提取所有 class="wire" 的 path 元素
    const wirePaths = svg.querySelectorAll('path.wire');
    console.log(`[Timing Diagram] Found ${wirePaths.length} wire paths`);
    wirePaths.forEach(path => {
        const d = path.getAttribute('d');
        if (!d) return;

        // 获取父元素的 transform
        let offsetX = 0, offsetY = 0;
        let parent = path.parentElement;
        while (parent && parent !== svg) {
            const transform = parent.getAttribute('transform');
            if (transform) {
                const match = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
                if (match) {
                    offsetX += parseFloat(match[1]) || 0;
                    offsetY += parseFloat(match[2]) || 0;
                }
            }
            parent = parent.parentElement;
        }

        const result = parsePathData(d, scale, offsetX - viewBoxOffsetX, offsetY - viewBoxOffsetY);
        console.log(`[Timing Diagram] Wire Path offset=(${offsetX}, ${offsetY}), polylines=${result.polylines.length}`);
        result.polylines.forEach(pts => {
            if (pts.length >= 4) {
                lines.push({ points: pts, strokeColor: '#000000', fillColor: 'none' });
            }
        });
    });

    // 方法2: 处理 <use> 元素（排除 defs 内的）
    const useElements = svg.querySelectorAll('use');
    const processedUseElements = new Set();
    const topUseElements = Array.from(useElements).filter(use => {
        let parent = use.parentElement;
        while (parent) {
            if (parent.tagName === 'defs') return false;
            parent = parent.parentElement;
        }
        return true;
    });

    console.log(`[Timing Diagram] Found ${topUseElements.length} use elements (excluding defs)`);
    console.log(`[Timing Diagram] Starting line extraction...`);

    topUseElements.forEach(use => {
        const href = use.getAttribute('xlink:href') || use.getAttribute('href');
        if (!href) return;

        const refId = href.replace('#', '');

        // 累积所有父元素的 transform
        let offsetX = 0, offsetY = 0;
        let parent = use;
        while (parent && parent !== svg) {
            const transform = parent.getAttribute('transform');
            if (transform) {
                const match = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
                if (match) {
                    offsetX += parseFloat(match[1]) || 0;
                    offsetY += parseFloat(match[2]) || 0;
                }
            }
            parent = parent.parentElement;
        }

        // 使用位置信息作为唯一标识，避免重复处理
        const useKey = `${refId}_${offsetX}_${offsetY}`;
        if (processedUseElements.has(useKey)) {
            return;
        }
        processedUseElements.add(useKey);

        const refElement = svg.ownerDocument.getElementById(refId) || svg.querySelector(`[id="${refId}"]`);
        if (!refElement) {
            console.log(`[Timing Diagram] Reference not found: ${refId}`);
            return;
        }

        extractFromElement(refElement, offsetX, offsetY, lines, scale, viewBoxOffsetX, viewBoxOffsetY, svg);
    });

    // 方法3: 直接提取所有非defs内的path元素（用于处理不使用use的SVG）
    const allPaths = svg.querySelectorAll('path');
    const topPaths = Array.from(allPaths).filter(path => {
        // 跳过已处理的wire路径
        if (path.classList.contains('wire')) return false;

        // 跳过defs内的path
        let parent = path.parentElement;
        while (parent) {
            if (parent.tagName === 'defs') return false;
            parent = parent.parentElement;
        }
        return true;
    });

    console.log(`[Timing Diagram] Found ${topPaths.length} non-wire paths to process`);

    topPaths.forEach(path => {
        const d = path.getAttribute('d');
        if (!d) return;

        // 累积所有父元素的 transform
        let offsetX = 0, offsetY = 0;
        let parent = path.parentElement;
        while (parent && parent !== svg) {
            const transform = parent.getAttribute('transform');
            if (transform) {
                const match = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
                if (match) {
                    offsetX += parseFloat(match[1]) || 0;
                    offsetY += parseFloat(match[2]) || 0;
                }
            }
            parent = parent.parentElement;
        }

        // 获取填充和描边颜色
        let fillColor = 'none';
        let strokeColor = '#000000';
        try {
            const computedStyle = window.getComputedStyle(path);
            const fill = computedStyle.fill;
            const stroke = computedStyle.stroke;

            if (fill && fill !== 'none') {
                fillColor = fill;
            }
            if (stroke && stroke !== 'none') {
                strokeColor = stroke;
            }
        } catch (e) {}

        const result = parsePathData(d, scale, offsetX - viewBoxOffsetX, offsetY - viewBoxOffsetY);

        result.polylines.forEach(pts => {
            if (pts.length >= 4) {
                lines.push({ points: pts, strokeColor, fillColor });
            }
        });
    });

    console.log(`[Timing Diagram] Extraction complete. Total lines: ${lines.length}, Total texts: ${texts.length}`);

    // 提取所有文本元素
    const textElements = svg.querySelectorAll('text');
    textElements.forEach(text => {
        const content = text.textContent.trim();
        if (!content) return;

        let x = parseFloat(text.getAttribute('x') || 0);
        let y = parseFloat(text.getAttribute('y') || 0);

        // 累积父元素的 transform
        let parent = text.parentElement;
        while (parent && parent !== svg) {
            const transform = parent.getAttribute('transform');
            if (transform) {
                const match = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
                if (match) {
                    x += parseFloat(match[1]) || 0;
                    y += parseFloat(match[2]) || 0;
                }
            }
            parent = parent.parentElement;
        }

        texts.push({
            text: content,
            x: (x - viewBoxOffsetX) * scale,
            y: -(y - viewBoxOffsetY) * scale
        });
    });

    // 计算所有坐标的边界，将图形移到第一象限
    let minX = Infinity, minY = Infinity;

    // 检查线条坐标
    lines.forEach(line => {
        for (let i = 0; i < line.points.length; i += 2) {
            minX = Math.min(minX, line.points[i]);
            minY = Math.min(minY, line.points[i + 1]);
        }
    });

    // 检查文本坐标
    texts.forEach(text => {
        minX = Math.min(minX, text.x);
        minY = Math.min(minY, text.y);
    });

    // 平移到正坐标区域，并向上偏移1英寸（100单位）
    const offsetX = minX < 0 ? -minX : 0;
    const offsetY = (minY < 0 ? -minY : 0) + 100;  // 向上偏移1英寸

    lines.forEach(line => {
        for (let i = 0; i < line.points.length; i += 2) {
            line.points[i] += offsetX;
            line.points[i + 1] += offsetY;
        }
    });

    texts.forEach(text => {
        text.x += offsetX;
        text.y += offsetY;
    });

    return { lines, texts };
}

// 从元素中提取图形（递归处理所有嵌套的 use 元素）
function extractFromElement(element, offsetX, offsetY, lines, scale, viewBoxOffsetX, viewBoxOffsetY, svg) {
    const initialLineCount = lines.length;
    const elementId = element.id || element.tagName;
    console.log(`[Timing Diagram] Processing element: ${elementId}, children: ${element.children.length}`);

    Array.from(element.children).forEach(child => {
        if (child.tagName === 'path') {
            const d = child.getAttribute('d');
            if (!d) return;

            // 获取样式信息
            const className = child.getAttribute('class');
            let fillColor = 'none';
            let strokeColor = '#000000';

            // WaveDrom 特定：s5-s16 是填充样式，跳过
            if (className && className.match(/^s([5-9]|1[0-6])$/)) {
                return;
            }

            // 获取填充和描边颜色
            try {
                const computedStyle = window.getComputedStyle(child);
                const fill = computedStyle.fill;
                const stroke = computedStyle.stroke;

                if (fill && fill !== 'none') {
                    fillColor = fill;
                }
                if (stroke && stroke !== 'none') {
                    strokeColor = stroke;
                }
            } catch (e) {}

            const result = parsePathData(d, scale, offsetX - viewBoxOffsetX, offsetY - viewBoxOffsetY);

            result.polylines.forEach(pts => {
                if (pts.length >= 4) {
                    lines.push({ points: pts, strokeColor, fillColor });
                }
            });
        } else if (child.tagName === 'line') {
            const x1 = parseFloat(child.getAttribute('x1') || 0) + offsetX - viewBoxOffsetX;
            const y1 = parseFloat(child.getAttribute('y1') || 0) + offsetY - viewBoxOffsetY;
            const x2 = parseFloat(child.getAttribute('x2') || 0) + offsetX - viewBoxOffsetX;
            const y2 = parseFloat(child.getAttribute('y2') || 0) + offsetY - viewBoxOffsetY;
            lines.push({
                points: [x1 * scale, -y1 * scale, x2 * scale, -y2 * scale],  // Y 轴翻转
                strokeColor: '#000000',
                fillColor: 'none'
            });
        } else if (child.tagName === 'use') {
            // 递归处理嵌套的 <use> 元素
            const href = child.getAttribute('xlink:href') || child.getAttribute('href');
            if (!href) return;

            const refId = href.replace('#', '');
            const refElement = svg.ownerDocument.getElementById(refId) || svg.querySelector(`[id="${refId}"]`);
            if (!refElement) return;

            // 累积 use 元素的 transform
            const transform = child.getAttribute('transform');
            let nestedOffsetX = offsetX;
            let nestedOffsetY = offsetY;
            if (transform) {
                const match = transform.match(/translate\(([^,]+),?\s*([^)]*)\)/);
                if (match) {
                    nestedOffsetX += parseFloat(match[1]) || 0;
                    nestedOffsetY += parseFloat(match[2]) || 0;
                }
            }

            extractFromElement(refElement, nestedOffsetX, nestedOffsetY, lines, scale, viewBoxOffsetX, viewBoxOffsetY, svg);
        }
    });
    const extractedCount = lines.length - initialLineCount;
    if (extractedCount > 0) {
        console.log(`[Timing Diagram] Extracted ${extractedCount} lines from element:`, element.id || element.tagName);
    }
}

// 三次贝塞尔曲线插值（不含起点，含终点）
function cubicBezierPoints(x0, y0, x1, y1, x2, y2, x3, y3, steps) {
    const pts = [];
    for (let i = 1; i <= steps; i++) {
        const t = i / steps, mt = 1 - t;
        pts.push([
            mt*mt*mt*x0 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x3,
            mt*mt*mt*y0 + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y3
        ]);
    }
    return pts;
}

// 二次贝塞尔曲线插值（不含起点，含终点）
function quadraticBezierPoints(x0, y0, x1, y1, x2, y2, steps) {
    const pts = [];
    for (let i = 1; i <= steps; i++) {
        const t = i / steps, mt = 1 - t;
        pts.push([
            mt*mt*x0 + 2*mt*t*x1 + t*t*x2,
            mt*mt*y0 + 2*mt*t*y1 + t*t*y2
        ]);
    }
    return pts;
}

// 将 SVG 圆弧端点参数转换为折线点（W3C endpoint → center 参数化）
function arcToPolylinePoints(x1, y1, rx, ry, phiDeg, largeArcFlag, sweepFlag, x2, y2) {
    if (rx === 0 || ry === 0) return [[x2, y2]];

    const phi = phiDeg * Math.PI / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // Step 1: 转换到旋转坐标系
    const dx2 = (x1 - x2) / 2;
    const dy2 = (y1 - y2) / 2;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;

    // Step 2: 确保半径足够大
    let rx2 = rx * rx, ry2 = ry * ry;
    const x1p2 = x1p * x1p, y1p2 = y1p * y1p;
    const radiiCheck = x1p2 / rx2 + y1p2 / ry2;
    if (radiiCheck > 1) {
        const s = Math.sqrt(radiiCheck);
        rx *= s; ry *= s;
        rx2 = rx * rx; ry2 = ry * ry;
    }

    // Step 3: 计算旋转坐标系中的圆心
    const sign = (largeArcFlag !== sweepFlag) ? 1 : -1;
    const sq = Math.max(0, (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2));
    const coeff = sign * Math.sqrt(sq);
    const cxp = coeff * rx * y1p / ry;
    const cyp = coeff * -ry * x1p / rx;

    // Step 4: 转回原始坐标系
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    // Step 5: 计算起始角度和扫过角度
    function vecAngle(ux, uy, vx, vy) {
        const dot = ux * vx + uy * vy;
        const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
        let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
        if (ux * vy - uy * vx < 0) a = -a;
        return a;
    }
    const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
    const theta1 = vecAngle(1, 0, ux, uy);
    let dtheta = vecAngle(ux, uy, vx, vy);
    if (!sweepFlag && dtheta > 0) dtheta -= 2 * Math.PI;
    if (sweepFlag && dtheta < 0) dtheta += 2 * Math.PI;

    // Step 6: 按角度步长生成折线点
    const steps = Math.max(32, Math.ceil(Math.abs(dtheta) / (Math.PI / 64)));
    const pts = [];
    for (let j = 1; j <= steps; j++) {
        const angle = theta1 + dtheta * (j / steps);
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const x = cosPhi * rx * cosA - sinPhi * ry * sinA + cx;
        const y = sinPhi * rx * cosA + cosPhi * ry * sinA + cy;
        pts.push([x, y]);
    }
    return pts;
}

// 解析 SVG path 数据，多段子路径拆分为独立折线，圆弧转折线点
// currentX/Y 始终为不含 offset 的 SVG 本地坐标
function parsePathData(d, scale, offsetX = 0, offsetY = 0) {
    const polylines = [];       // 最终输出：多段折线
    let currentPoints = [];     // 当前子路径的点列表
    let currentX = 0, currentY = 0;
    let subpathStartX = 0, subpathStartY = 0;
    let lastCPX = 0, lastCPY = 0;  // 上一个控制点，用于 S/s/T/t
    let lastCmdType = '';           // 上一个命令类型

    function pushPoint(x, y) {
        currentPoints.push((x + offsetX) * scale, -(y + offsetY) * scale);
    }

    function finishPolyline() {
        if (currentPoints.length >= 4) {
            polylines.push([...currentPoints]);
        }
        currentPoints = [];
    }

    const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
    if (!commands) return { polylines };

    commands.forEach(cmd => {
        const type = cmd[0];
        const values = cmd.slice(1).trim().split(/[\s,]+/).filter(v => v).map(parseFloat);

        switch (type) {
            case 'M':
                finishPolyline();
                currentX = values[0]; currentY = values[1];
                subpathStartX = currentX; subpathStartY = currentY;
                pushPoint(currentX, currentY);
                for (let i = 2; i < values.length; i += 2) {
                    currentX = values[i]; currentY = values[i + 1];
                    pushPoint(currentX, currentY);
                }
                break;
            case 'm':
                finishPolyline();
                currentX += values[0]; currentY += values[1];
                subpathStartX = currentX; subpathStartY = currentY;
                pushPoint(currentX, currentY);
                for (let i = 2; i < values.length; i += 2) {
                    currentX += values[i]; currentY += values[i + 1];
                    pushPoint(currentX, currentY);
                }
                break;
            case 'L':
                for (let i = 0; i < values.length; i += 2) {
                    currentX = values[i]; currentY = values[i + 1];
                    pushPoint(currentX, currentY);
                }
                break;
            case 'l':
                for (let i = 0; i < values.length; i += 2) {
                    currentX += values[i]; currentY += values[i + 1];
                    pushPoint(currentX, currentY);
                }
                break;
            case 'H':
                currentX = values[0];
                pushPoint(currentX, currentY);
                break;
            case 'h':
                currentX += values[0];
                pushPoint(currentX, currentY);
                break;
            case 'V':
                currentY = values[0];
                pushPoint(currentX, currentY);
                break;
            case 'v':
                currentY += values[0];
                pushPoint(currentX, currentY);
                break;
            case 'C':
                for (let i = 0; i < values.length; i += 6) {
                    const cp1x = values[i], cp1y = values[i+1];
                    const cp2x = values[i+2], cp2y = values[i+3];
                    const ex = values[i+4], ey = values[i+5];
                    cubicBezierPoints(currentX, currentY, cp1x, cp1y, cp2x, cp2y, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cp2x; lastCPY = cp2y;
                    currentX = ex; currentY = ey;
                }
                break;
            case 'c':
                for (let i = 0; i < values.length; i += 6) {
                    const cp1x = currentX + values[i], cp1y = currentY + values[i+1];
                    const cp2x = currentX + values[i+2], cp2y = currentY + values[i+3];
                    const ex = currentX + values[i+4], ey = currentY + values[i+5];
                    cubicBezierPoints(currentX, currentY, cp1x, cp1y, cp2x, cp2y, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cp2x; lastCPY = cp2y;
                    currentX = ex; currentY = ey;
                }
                break;
            case 'S': {
                for (let i = 0; i < values.length; i += 4) {
                    const cp1x = /[CS]/.test(lastCmdType) ? 2*currentX - lastCPX : currentX;
                    const cp1y = /[CS]/.test(lastCmdType) ? 2*currentY - lastCPY : currentY;
                    const cp2x = values[i], cp2y = values[i+1];
                    const ex = values[i+2], ey = values[i+3];
                    cubicBezierPoints(currentX, currentY, cp1x, cp1y, cp2x, cp2y, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cp2x; lastCPY = cp2y;
                    currentX = ex; currentY = ey;
                }
                break;
            }
            case 's': {
                for (let i = 0; i < values.length; i += 4) {
                    const cp1x = /[cs]/.test(lastCmdType) ? 2*currentX - lastCPX : currentX;
                    const cp1y = /[cs]/.test(lastCmdType) ? 2*currentY - lastCPY : currentY;
                    const cp2x = currentX + values[i], cp2y = currentY + values[i+1];
                    const ex = currentX + values[i+2], ey = currentY + values[i+3];
                    cubicBezierPoints(currentX, currentY, cp1x, cp1y, cp2x, cp2y, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cp2x; lastCPY = cp2y;
                    currentX = ex; currentY = ey;
                }
                break;
            }
            case 'Q':
                for (let i = 0; i < values.length; i += 4) {
                    const cpx = values[i], cpy = values[i+1];
                    const ex = values[i+2], ey = values[i+3];
                    quadraticBezierPoints(currentX, currentY, cpx, cpy, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cpx; lastCPY = cpy;
                    currentX = ex; currentY = ey;
                }
                break;
            case 'q':
                for (let i = 0; i < values.length; i += 4) {
                    const cpx = currentX + values[i], cpy = currentY + values[i+1];
                    const ex = currentX + values[i+2], ey = currentY + values[i+3];
                    quadraticBezierPoints(currentX, currentY, cpx, cpy, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cpx; lastCPY = cpy;
                    currentX = ex; currentY = ey;
                }
                break;
            case 'T':
                for (let i = 0; i < values.length; i += 2) {
                    const cpx = /[QT]/.test(lastCmdType) ? 2*currentX - lastCPX : currentX;
                    const cpy = /[QT]/.test(lastCmdType) ? 2*currentY - lastCPY : currentY;
                    const ex = values[i], ey = values[i+1];
                    quadraticBezierPoints(currentX, currentY, cpx, cpy, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cpx; lastCPY = cpy;
                    currentX = ex; currentY = ey;
                }
                break;
            case 't':
                for (let i = 0; i < values.length; i += 2) {
                    const cpx = /[qt]/.test(lastCmdType) ? 2*currentX - lastCPX : currentX;
                    const cpy = /[qt]/.test(lastCmdType) ? 2*currentY - lastCPY : currentY;
                    const ex = currentX + values[i], ey = currentY + values[i+1];
                    quadraticBezierPoints(currentX, currentY, cpx, cpy, ex, ey, 16)
                        .forEach(([px, py]) => pushPoint(px, py));
                    lastCPX = cpx; lastCPY = cpy;
                    currentX = ex; currentY = ey;
                }
                break;
            case 'A':
                for (let i = 0; i < values.length; i += 7) {
                    const rx = values[i], ry = values[i + 1];
                    const phi = values[i + 2];
                    const largeArcFlag = values[i + 3] !== 0;
                    const sweepFlag = values[i + 4] !== 0;
                    const ex = values[i + 5], ey = values[i + 6];
                    const pts = arcToPolylinePoints(
                        currentX + offsetX, currentY + offsetY,
                        rx, ry, phi, largeArcFlag, sweepFlag,
                        ex + offsetX, ey + offsetY
                    );
                    pts.forEach(([px, py]) => currentPoints.push(px * scale, -py * scale));
                    currentX = ex; currentY = ey;
                }
                break;
            case 'a':
                for (let i = 0; i < values.length; i += 7) {
                    const rx = values[i], ry = values[i + 1];
                    const phi = values[i + 2];
                    const largeArcFlag = values[i + 3] !== 0;
                    const sweepFlag = values[i + 4] !== 0;
                    const ex = currentX + values[i + 5], ey = currentY + values[i + 6];
                    const pts = arcToPolylinePoints(
                        currentX + offsetX, currentY + offsetY,
                        rx, ry, phi, largeArcFlag, sweepFlag,
                        ex + offsetX, ey + offsetY
                    );
                    pts.forEach(([px, py]) => currentPoints.push(px * scale, -py * scale));
                    currentX = ex; currentY = ey;
                }
                break;
            case 'Z':
            case 'z':
                pushPoint(subpathStartX, subpathStartY);
                finishPolyline();
                currentX = subpathStartX; currentY = subpathStartY;
                break;
        }
        lastCmdType = type;
    });

    finishPolyline();
    return { polylines };
}

// 在原理图中创建线条
async function createLinesInSchematic(lines, texts) {
    const createdIds = [];

    // 创建线条
    for (const line of lines) {
        try {
            const result = await eda.sch_PrimitivePolygon.create(
                line.points,
                line.strokeColor || '#000000',
                line.fillColor || 'none',
                1,
                null
            );

            if (result && result.primitiveId) {
                createdIds.push(result.primitiveId);
            }
        } catch (error) {
            console.error('[Timing Diagram] Failed to create line:', error);
        }
    }

    for (const textItem of texts) {
        try {
            const result = await eda.sch_PrimitiveText.create(
                textItem.x,
                textItem.y,
                textItem.text,
                0,           // rotation
                null,        // textColor
                null,        // fontName
                null,        // fontSize
                false,       // bold
                false,       // italic
                false,       // underLine
                9            // alignMode: 6 = CENTER_BOTTOM（中下对齐）
            );

            if (result && result.primitiveId) {
                createdIds.push(result.primitiveId);
            }
        } catch (error) {
            console.error('[Timing Diagram] Failed to create text:', error);
        }
    }

    console.log(`[Timing Diagram] Created ${createdIds.length} primitives in schematic`);

    // 选中所有创建的元素
    if (createdIds.length > 0) {
        try {
            await eda.sch_SelectControl.doSelectPrimitives(createdIds);
            console.log(`[Timing Diagram] Selected ${createdIds.length} primitives`);
        } catch (error) {
            console.error('[Timing Diagram] Failed to select primitives:', error);
        }
    }

    return createdIds;
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
