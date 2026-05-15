# 时序图工具

基于 WaveDrom 的时序图绘制工具，支持在 EasyEDA Pro 原理图中创建和放置专业的数字时序图。

支持时序图：

![](./images/preview1.jpg)

支持门电路：

![](./images/preview2.jpg)

在图中效果：

![](./images/preview3.jpg)

## 功能特性

- ✨ **实时预览** - 编辑 WaveJSON 语法时实时生成时序图预览
- 📝 **配置管理** - 保存、加载、重命名和删除多个时序图配置
- 💾 **导入导出** - 导入和导出配置文件，方便备份和分享
- 🎨 **主题切换** - 支持浅色/深色编辑器主题
- 📏 **行号显示** - 代码编辑器带行号，方便定位
- 🌐 **多语言支持** - 支持中文和英文界面
- 📤 **SVG 导出** - 导出时序图为 SVG 文件
- 🔧 **可调整布局** - 拖拽分隔线调整编辑器和预览区高度

## 已知问题

- 文本插入有一点偏移，待后续API修复后修正

## 安装

1. 打开 **嘉立创EDA** ，或下载最新版本的 `.eext` 文件
2. 在 **嘉立创EDA** 中，点击 **高级** → **扩展管理器** → **扩展列表**
3. 查找 **时序图工具** 点击安装，或者点击 **导入扩展** 按钮
4. 选择下载的 `.eext` 文件
5. 确认安装

## 使用方法

### 打开编辑器

1. 在原理图编辑器中，点击顶部菜单 **时序图工具** → **绘制时序图...**
2. 编辑器窗口将打开

### 编辑时序图

1. 在左侧选择或创建配置
2. 在中间编辑器中输入 WaveJSON 语法
3. 预览区会实时显示生成的时序图
4. 点击 **保存配置** 保存当前配置

### WaveJSON 语法

示例 1 - 基础时序图:

```json
{
	"signal": [
		{ "name": "clk", "wave": "p.....|..." },
		{ "name": "dat", "wave": "x.345x|=.x", "data": ["head", "body", "tail", "data"] },
		{ "name": "req", "wave": "0.1..0|1.0" },
		{},
		{ "name": "ack", "wave": "1.....|01." }
	]
}
```

示例 2 - 逻辑门:

```json
{
	"assign": [
		["out", ["|", ["&", ["~", "a"], "b"], ["&", ["~", "b"], "a"]]]
	]
}
```

更多语法请参考 WaveDrom 官方教程：
- [教程 1](https://wavedrom.com/tutorial.html)
- [教程 2](https://wavedrom.com/tutorial2.html)

### 配置导入导出

- **导出配置** - 点击 ⬆ 按钮导出所有配置到 JSON 文件，文件名格式：`timing-configs_{日期}.json`
- **导入配置** - 点击 ⬇ 按钮从 JSON 文件导入配置（会覆盖当前所有配置）

配置文件格式:
```json
{
	"version": "1.0.0",
	"exportDate": "2026-03-28T00:00:00.000Z",
	"appName": "Timing Diagram Tool",
	"configs": [
		{
			"id": "...",
			"name": "配置名称",
			"wavejson": "{ signal: [...] }",
			"createdAt": 1234567890,
			"updatedAt": 1234567890
		}
	]
}
```

### 导出和应用

- **导出 SVG** - 将时序图导出为 SVG 文件，文件名格式：`Timing_{原理图名}_{日期}.svg`
- **应用** - 将时序图转换为线条和文本放置到原理图中，所有元素会自动选中，可使用 Ctrl+G 组合

## 快捷操作

- **主题切换** - 点击 🌓 按钮切换编辑器浅色/深色主题
- **拖拽调整** - 拖拽编辑器和预览区之间的分隔线调整高度
- **配置管理** - 使用左侧工具栏的 +、✎、✕ 按钮管理配置

## 技术栈

- **WaveDrom** - 时序图渲染引擎
- **EasyEDA Pro API** - 扩展开发接口
- **Vanilla JavaScript** - 无框架依赖

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 构建扩展包
npm run build
```

构建后的 `.eext` 文件位于 `build/dist/` 目录。

## 许可证

Apache-2.0 license

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [EasyEDA Pro](https://pro.easyeda.com/)
- [WaveDrom](https://wavedrom.com/)
- [EasyEDA Pro 扩展开发文档](https://prodocs.easyeda.com/)
