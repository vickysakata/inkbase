import { App, PluginSettingTab, Setting } from "obsidian";
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

    containerEl.createEl("h2", { text: "Inkbase 设置" });

    // --- Provider Selection ---
    new Setting(containerEl)
      .setName("Embedding 服务")
      .setDesc("选择用于生成文本向量的服务提供商")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("pie-gateway", "Pie Gateway")
          .addOption("openai", "OpenAI 兼容")
          .addOption("ollama", "Ollama (本地)")
          .addOption("custom", "自定义 Endpoint")
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value as typeof this.plugin.settings.provider;
            await this.plugin.saveSettings();
            this.display(); // Refresh to show relevant fields
          })
      );

    // --- Provider-specific settings ---
    const provider = this.plugin.settings.provider;

    if (provider === "pie-gateway") {
      new Setting(containerEl)
        .setName("App ID")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.pieAppId)
            .onChange(async (value) => {
              this.plugin.settings.pieAppId = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("App Secret")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.pieAppSecret)
            .onChange(async (value) => {
              this.plugin.settings.pieAppSecret = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Gateway URL")
        .addText((text) =>
          text
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
            .setValue(this.plugin.settings.openaiApiKey)
            .onChange(async (value) => {
              this.plugin.settings.openaiApiKey = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Base URL")
        .setDesc("OpenAI 兼容的 API 地址")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.openaiBaseUrl)
            .onChange(async (value) => {
              this.plugin.settings.openaiBaseUrl = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型")
        .addText((text) =>
          text
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
            .setValue(this.plugin.settings.ollamaEndpoint)
            .onChange(async (value) => {
              this.plugin.settings.ollamaEndpoint = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型名称")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.ollamaModel)
            .onChange(async (value) => {
              this.plugin.settings.ollamaModel = value;
              await this.plugin.saveSettings();
            })
        );
    }

    if (provider === "custom") {
      new Setting(containerEl)
        .setName("Endpoint URL")
        .setDesc("OpenAI 兼容的 embedding endpoint")
        .addText((text) =>
          text
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
            .setValue(this.plugin.settings.customApiKey)
            .onChange(async (value) => {
              this.plugin.settings.customApiKey = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.customModel)
            .onChange(async (value) => {
              this.plugin.settings.customModel = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // --- General Settings ---
    containerEl.createEl("h3", { text: "通用设置" });

    new Setting(containerEl)
      .setName("点子文件夹")
      .setDesc("保存点子的文件夹路径（相对 vault 根目录）")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.ideasFolder)
          .onChange(async (value) => {
            this.plugin.settings.ideasFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("自动索引")
      .setDesc("文件修改时自动更新索引")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoIndex)
          .onChange(async (value) => {
            this.plugin.settings.autoIndex = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("排除文件夹")
      .setDesc("不参与索引的文件夹，用逗号分隔")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.excludeFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.excludeFolders = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // --- Library Configuration ---
    containerEl.createEl("h3", { text: "库配置" });
    containerEl.createEl("p", {
      text: "配置搜索时可筛选的库（对应 vault 中的文件夹），索引仍覆盖整个 vault。",
      cls: "setting-item-description",
    });

    // Display existing libraries
    const libraries = this.plugin.settings.libraries;
    for (let i = 0; i < libraries.length; i++) {
      const lib = libraries[i];
      new Setting(containerEl)
        .setName(lib.name)
        .setDesc(`文件夹：${lib.folder}`)
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
      placeholder: "库名称（如：素材库）",
      cls: "inkbase-lib-input",
    });
    const folderInput = addLibDiv.createEl("input", {
      type: "text",
      placeholder: "文件夹路径（如：素材）",
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

    // --- Index Stats & Actions ---
    containerEl.createEl("h3", { text: "索引管理" });

    const statsEl = containerEl.createDiv({ cls: "inkbase-settings-stats" });
    const docCount = this.plugin.store.getDocumentCount();
    const chunkCount = this.plugin.store.getChunkCount();
    statsEl.setText(`当前索引：${docCount} 篇文档，${chunkCount} 个片段`);

    new Setting(containerEl)
      .setName("重建索引")
      .setDesc("重新扫描所有文件并生成索引（耗时较长）")
      .addButton((btn) =>
        btn.setButtonText("开始重建").onClick(async () => {
          await this.plugin.reindexAll();
          this.display(); // Refresh stats
        })
      );
  }
}
