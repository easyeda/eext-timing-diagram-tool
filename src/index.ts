/**
 * 时序图扩展入口文件
 *
 * 基于WaveDrom的时序图绘制工具，支持在原理图中创建和放置时序图
 */
import * as extensionConfig from '../extension.json';
import zhHansLocale from '../locales/zh-Hans.json';
import enLocale from '../locales/en.json';

// IFrame窗口ID
const IFRAME_ID = 'timing-diagram-editor';

// 扩展激活
export async function activate(status?: 'onStartupFinished', arg?: string): Promise<void> {
	console.log('[Timing Diagram] Extension activated');

	// 导入多语言文件
	try {
		// 导入中文多语言
		eda.sys_I18n.importMultilingual('zh-Hans', zhHansLocale);

		// 导入英文多语言
		eda.sys_I18n.importMultilingual('en', enLocale);

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
