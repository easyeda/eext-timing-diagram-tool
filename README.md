# 时序图工具 / Timing Diagram Tool

基于 WaveDrom 的时序图绘制工具，支持在 EasyEDA Pro 原理图中创建和放置专业的数字时序图。

A timing diagram tool based on WaveDrom, supporting creation and placement of professional digital timing diagrams in EasyEDA Pro schematics.

支持时序图：

![](./images/preview1.jpg)

支持门电路：

![](./images/preview2.jpg)

在图中效果：

![](./images/preview3.jpg)

## 功能特性 / Features

- ✨ **实时预览** - 编辑 WaveJSON 语法时实时生成时序图预览
- 📝 **配置管理** - 保存、加载、重命名和删除多个时序图配置
- 💾 **导入导出** - 导入和导出配置文件，方便备份和分享
- 🎨 **主题切换** - 支持浅色/深色编辑器主题
- 📏 **行号显示** - 代码编辑器带行号，方便定位
- 🌐 **多语言支持** - 支持中文和英文界面
- 📤 **SVG 导出** - 导出时序图为 SVG 文件
- 🔧 **可调整布局** - 拖拽分隔线调整编辑器和预览区高度

---

- ✨ **Real-time Preview** - Generate timing diagram preview in real-time while editing WaveJSON syntax
- 📝 **Configuration Management** - Save, load, rename, and delete multiple timing diagram configurations
- 💾 **Import/Export** - Import and export configuration files for backup and sharing
- 🎨 **Theme Toggle** - Support light/dark editor themes
- 📏 **Line Numbers** - Code editor with line numbers for easy navigation
- 🌐 **Multi-language** - Support Chinese and English interfaces
- 📤 **SVG Export** - Export timing diagrams as SVG files
- 🔧 **Adjustable Layout** - Drag separator to adjust editor and preview area heights

## 已知问题 / Known Issue

- 文本插入有一点偏移，待后续API修复后修正

- The text insertion has a slight offset, which will be corrected after the subsequent API is fixed

## 安装 / Installation

1. 打开 **嘉立创EDA** ，或下载最新版本的 `.eext` 文件
2. 在 **嘉立创EDA** 中，点击 **高级** → **扩展管理器** → **扩展列表**
3. 查找 **时序图工具** 点击安装，或者点击 **导入扩展** 按钮
4. 选择下载的 `.eext` 文件
5. 确认安装

---

1. Open EasyEDA Pro or Download the latest `.eext` file
2. In EasyEDA Pro, click **Advanced** → **Extension Manager** → **Extension List**
3. Find **Timing Diagram Tool** Click install button, or click **Import Extension** button
4. Select the downloaded `.eext` file
5. Confirm installation

## 使用方法 / Usage

### 打开编辑器 / Open Editor

1. 在原理图编辑器中，点击顶部菜单 **时序图工具** → **绘制时序图...**
2. 编辑器窗口将打开

---

1. In schematic editor, click top menu **Timing Diagram Tool** → **Open Timing Diagram...**
2. Editor window will open

### 编辑时序图 / Edit Timing Diagram

1. 在左侧选择或创建配置
2. 在中间编辑器中输入 WaveJSON 语法
3. 预览区会实时显示生成的时序图
4. 点击 **保存配置** 保存当前配置

---

1. Select or create a configuration on the left
2. Enter WaveJSON syntax in the middle editor
3. Preview area will show the generated timing diagram in real-time
4. Click **Save Config** to save current configuration

### WaveJSON 语法 / WaveJSON Syntax

示例 1 - 基础时序图 / Example 1 - Basic Timing Diagram:

```json
{ "signal": [
  { "name": "clk",  "wave": "p.....|..." },
  { "name": "dat",  "wave": "x.345x|=.x", "data": ["head", "body", "tail", "data"] },
  { "name": "req",  "wave": "0.1..0|1.0" },
  {},
  { "name": "ack",  "wave": "1.....|01." }
]}
```

示例 2 - 逻辑门 / Example 2 - Logic Gate:

```json
{ assign:[
  ["out",
    ["|",
      ["&", ["~", "a"], "b"],
      ["&", ["~", "b"], "a"]
    ]
  ]
]}
```

更多语法请参考 WaveDrom 官方教程：
- [教程 1](https://wavedrom.com/tutorial.html)
- [教程 2](https://wavedrom.com/tutorial2.html)

---

For more syntax, refer to WaveDrom official tutorials:
- [Tutorial 1](https://wavedrom.com/tutorial.html)
- [Tutorial 2](https://wavedrom.com/tutorial2.html)

### 配置导入导出 / Configuration Import/Export

- **导出配置** - 点击 ⬆ 按钮导出所有配置到 JSON 文件，文件名格式：`timing-configs_{日期}.json`
- **导入配置** - 点击 ⬇ 按钮从 JSON 文件导入配置（会覆盖当前所有配置）

配置文件格式 / Configuration file format:
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

---

- **Export Config** - Click ⬆ button to export all configurations to JSON file, filename format: `timing-configs_{date}.json`
- **Import Config** - Click ⬇ button to import configurations from JSON file (will overwrite all current configurations)

### 导出和应用 / Export and Apply

- **导出 SVG** - 将时序图导出为 SVG 文件，文件名格式：`Timing_{原理图名}_{日期}.svg`
- **应用** - 将时序图转换为线条和文本放置到原理图中，所有元素会自动选中，可使用 Ctrl+G 组合

---

- **Export SVG** - Export timing diagram as SVG file, filename format: `Timing_{schematic_name}_{date}.svg`
- **Apply** - Convert timing diagram to lines and text and place into schematic, all elements will be auto-selected, use Ctrl+G to group

## 快捷操作 / Shortcuts

- **主题切换** - 点击 🌓 按钮切换编辑器浅色/深色主题
- **拖拽调整** - 拖拽编辑器和预览区之间的分隔线调整高度
- **配置管理** - 使用左侧工具栏的 +、✎、✕ 按钮管理配置

---

- **Theme Toggle** - Click 🌓 button to toggle light/dark editor theme
- **Drag to Resize** - Drag separator between editor and preview to adjust height
- **Config Management** - Use +, ✎, ✕ buttons in left toolbar to manage configurations



## 技术栈 / Tech Stack

- **WaveDrom** - 时序图渲染引擎 / Timing diagram rendering engine
- **EasyEDA Pro API** - 扩展开发接口 / Extension development API
- **Vanilla JavaScript** - 无框架依赖 / No framework dependencies

## 开发 / Development

```bash
# 安装依赖 / Install dependencies
npm install

# 编译 / Compile
npm run compile

# 构建扩展包 / Build extension package
npm run build
```

构建后的 `.eext` 文件位于 `build/dist/` 目录。

Built `.eext` file is located in `build/dist/` directory.

## 许可证 / License

MIT License

## 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！

Issues and Pull Requests are welcome!

## 相关链接 / Links

- [EasyEDA Pro](https://pro.easyeda.com/)
- [WaveDrom](https://wavedrom.com/)
- [EasyEDA Pro 扩展开发文档](https://prodocs.easyeda.com/)
