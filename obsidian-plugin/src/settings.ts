import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import type InkbasePlugin from "./main";

export class InkbaseSettingTab extends PluginSettingTab {
  plugin: InkbasePlugin;

  constructor(app: App, plugin: InkbasePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ============================================================
    // 一、大模型配置
    // ============================================================
    new Setting(containerEl).setName("大模型配置").setHeading();

    new Setting(containerEl)
      .setName("服务商")
      .setDesc("选择用于语义分析的 AI 服务")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("pie-gateway", "Pie Gateway")
          .addOption("openai", "OpenAI 兼容")
          .addOption("ollama", "Ollama（完全本地）")
          .addOption("custom", "自定义服务")
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value as typeof this.plugin.settings.provider;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    const provider = this.plugin.settings.provider;

    if (provider === "pie-gateway") {
      new Setting(containerEl)
        .setName("App ID")
        .setDesc("PieBox 项目的应用 ID，格式如 app_63c17985b43acd...")
        .addText((text) =>
          text
            .setPlaceholder("app_xxxxxxxx")
            .setValue(this.plugin.settings.pieAppId)
            .onChange(async (value) => {
              this.plugin.settings.pieAppId = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("App Secret")
        .setDesc("PieBox 项目的应用密钥")
        .addText((text) =>
          text
            .setPlaceholder("sk_live_xxxxxxxx")
            .setValue(this.plugin.settings.pieAppSecret)
            .onChange(async (value) => {
              this.plugin.settings.pieAppSecret = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("服务地址")
        .setDesc("一般不需要修改")
        .addText((text) =>
          text
            .setPlaceholder("https://pie-gateway.weapp.me")
            .setValue(this.plugin.settings.pieGatewayPath)
            .onChange(async (value) => {
              this.plugin.settings.pieGatewayPath = value;
              await this.plugin.saveSettings();
            })
        );
    }

    if (provider === "openai") {
      new Setting(containerEl)
        .setName("API Key")
        .addText((text) =>
          text
            .setPlaceholder("sk-xxxxxxxx")
            .setValue(this.plugin.settings.openaiApiKey)
            .onChange(async (value) => {
              this.plugin.settings.openaiApiKey = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("服务地址")
        .setDesc("支持 OpenAI 兼容的第三方服务")
        .addText((text) =>
          text
            .setPlaceholder("https://api.openai.com")
            .setValue(this.plugin.settings.openaiBaseUrl)
            .onChange(async (value) => {
              this.plugin.settings.openaiBaseUrl = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型名称")
        .addText((text) =>
          text
            .setPlaceholder("text-embedding-3-small")
            .setValue(this.plugin.settings.openaiModel)
            .onChange(async (value) => {
              this.plugin.settings.openaiModel = value;
              await this.plugin.saveSettings();
            })
        );
    }

    if (provider === "ollama") {
      new Setting(containerEl)
        .setName("Ollama 地址")
        .addText((text) =>
          text
            .setPlaceholder("http://localhost:11434")
            .setValue(this.plugin.settings.ollamaEndpoint)
            .onChange(async (value) => {
              this.plugin.settings.ollamaEndpoint = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型名称")
        .setDesc("需要先通过 ollama pull 下载")
        .addText((text) =>
          text
            .setPlaceholder("nomic-embed-text")
            .setValue(this.plugin.settings.ollamaModel)
            .onChange(async (value) => {
              this.plugin.settings.ollamaModel = value;
              await this.plugin.saveSettings();
            })
        );
    }

    if (provider === "custom") {
      new Setting(containerEl)
        .setName("服务地址")
        .setDesc("OpenAI 兼容格式的 embedding 接口")
        .addText((text) =>
          text
            .setPlaceholder("https://your-service.com")
            .setValue(this.plugin.settings.customEndpoint)
            .onChange(async (value) => {
              this.plugin.settings.customEndpoint = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("API Key")
        .addText((text) =>
          text
            .setPlaceholder("your-api-key")
            .setValue(this.plugin.settings.customApiKey)
            .onChange(async (value) => {
              this.plugin.settings.customApiKey = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型名称")
        .addText((text) =>
          text
            .setPlaceholder("model-name")
            .setValue(this.plugin.settings.customModel)
            .onChange(async (value) => {
              this.plugin.settings.customModel = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // ============================================================
    // 二、内容输入配置
    // ============================================================
    new Setting(containerEl).setName("内容输入配置").setHeading();

    new Setting(containerEl)
      .setName("点子保存位置")
      .setDesc("「写点子」创建的笔记保存到这个文件夹，填写相对路径")
      .addText((text) =>
        text
          .setPlaceholder("例如：ideas 或 点子库/日常")
          .setValue(this.plugin.settings.ideasFolder)
          .onChange(async (value) => {
            this.plugin.settings.ideasFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // ============================================================
    // 三、检索设置
    // ============================================================
    new Setting(containerEl).setName("检索设置").setHeading();

    new Setting(containerEl)
      .setName("自动更新索引")
      .setDesc("开启后，保存文件时自动更新该文件的搜索索引")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoIndex)
          .onChange(async (value) => {
            this.plugin.settings.autoIndex = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("排除检索的文件夹")
      .setDesc("这些文件夹不会被索引。多个用英文逗号分隔")
      .addText((text) =>
        text
          .setPlaceholder("例如：模板, .trash, 归档")
          .setValue(this.plugin.settings.excludeFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.excludeFolders = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // -- 搜索对象库 --
    new Setting(containerEl)
      .setName("搜索对象库")
      .setDesc("给笔记库内的文件夹起一个名字作为搜索分类。搜索时可以选择只在某个库内查找。");

    // Display existing libraries
    const libraries = this.plugin.settings.libraries;
    for (let i = 0; i < libraries.length; i++) {
      const lib = libraries[i];
      new Setting(containerEl)
        .setName(lib.name)
        .setDesc(lib.folder)
        .addButton((btn) =>
          btn
            .setButtonText("删除")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.libraries.splice(i, 1);
              await this.plugin.saveSettings();
              this.display();
            })
        );
    }

    // Add new library
    const addLibDiv = containerEl.createDiv({ cls: "inkbase-add-library" });
    const nameInput = addLibDiv.createEl("input", {
      type: "text",
      placeholder: "库名称，如：素材库",
      cls: "inkbase-lib-input",
    });
    const folderInput = addLibDiv.createEl("input", {
      type: "text",
      placeholder: "对应文件夹，如：素材",
      cls: "inkbase-lib-input",
    });
    const addBtn = addLibDiv.createEl("button", {
      text: "添加",
      cls: "inkbase-lib-add-btn",
    });

    addBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const folder = folderInput.value.trim();
      if (!name || !folder) return;

      this.plugin.settings.libraries.push({ name, folder });
      await this.plugin.saveSettings();
      this.display();
    });

    // -- 索引管理 --
    new Setting(containerEl).setName("索引管理").setHeading();

    const statsEl = containerEl.createDiv({ cls: "inkbase-settings-stats" });
    const docCount = this.plugin.store.getDocumentCount();
    const chunkCount = this.plugin.store.getChunkCount();
    statsEl.setText(`当前已索引：${docCount} 篇文档，${chunkCount} 个文本片段`);

    new Setting(containerEl)
      .setName("重建全部索引")
      .setDesc("重新分析所有笔记并生成索引。首次使用或切换模型后需要执行。")
      .addButton((btn) =>
        btn.setButtonText("开始重建").onClick(async () => {
          await this.plugin.reindexAll();
          this.display();
        })
      );
  }
}
