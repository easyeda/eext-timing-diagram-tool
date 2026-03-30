/**
 * 时序图扩展入口文件
 *
 * 基于WaveDrom的时序图绘制工具，支持在原理图中创建和放置时序图
 */
import * as extensionConfig from '../extension.json';

// IFrame窗口ID
const IFRAME_ID = 'timing-diagram-editor';

// 扩展激活
export async function activate(status?: 'onStartupFinished', arg?: string): Promise<void> {
	console.log('[Timing Diagram] Extension activated');

	// 导入多语言文件
	try {
		// 读取中文多语言文件
		const zhFile = await eda.sys_FileSystem.getExtensionFile('locales/zh-Hans.json');
		if (zhFile) {
			const zhContent = await zhFile.text();
			const zhData = JSON.parse(zhContent);
			eda.sys_I18n.importMultilingual('zh-Hans', zhData);
		}

		// 读取英文多语言文件
		const enFile = await eda.sys_FileSystem.getExtensionFile('locales/en.json');
		if (enFile) {
			const enContent = await enFile.text();
			const enData = JSON.parse(enContent);
			eda.sys_I18n.importMultilingual('en', enData);
		}

		console.log('[Timing Diagram] Multilingual files imported');
	} catch (error) {
		console.error('[Timing Diagram] Failed to import multilingual files:', error);
	}
}

/**
 * 打开时序图编辑器
 */
export async function openTimingDiagram(): Promise<void> {
	try {
		// 使用固定的窗口尺寸（因为window对象在主进程中不可用）
		const width = 1200;
		const height = 800;

		// 打开IFrame窗口
		eda.sys_IFrame.openIFrame(
			'/iframe/index.html',
			width,
			height,
			IFRAME_ID,
			{
				title: eda.sys_I18n.text('timing-diagram-title'),
				maximizeButton: true,
				minimizeButton: true,
				minimizeStyle: 'collapsed',
				grayscaleMask: true
			}
		);
	} catch (error) {
		console.error('[Timing Diagram] Error opening editor:', error);
		eda.sys_Message.showToastMessage(
			eda.sys_I18n.text('error-open-editor') || '打开编辑器失败: ' + (error as Error).message
		);
	}
}

/**
 * 显示关于对话框
 */
export function showAbout(): void {
	// 打开关于页面IFrame
	eda.sys_IFrame.openIFrame(
		'/iframe/about.html',
		500,
		500,
		'timing-diagram-about',
		{
			title: eda.sys_I18n.text('about-title'),
			maximizeButton: false,
			minimizeButton: false,
			grayscaleMask: true
		}
	);
}
