import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import type InkbasePlugin from "./main";

export class InkbaseSettingTab extends PluginSettingTab {
  plugin: InkbasePlugin;

  constructor(app: App, plugin: InkbasePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** 获取当前笔记库内所有文件夹路径 */
  private getAllFolders(): string[] {
    const folders: string[] = [];
    const rootFolder = this.app.vault.getRoot();

    const walk = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          folders.push(child.path);
          walk(child);
        }
      }
    };
    walk(rootFolder);

    folders.sort();
    return folders;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Inkbase 设置" });

    // ============================================================
    // 一、大模型配置
    // ============================================================
    containerEl.createEl("h3", { text: "大模型配置" });
    containerEl.createEl("p", {
      text: "配置用于理解文本语义的 AI 服务。插件通过该服务将你的笔记转化为可搜索的向量数据。",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("服务商")
      .setDesc("选择 AI 服务提供方")
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
        .setDesc("PieBox 项目的应用 ID")
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
        .setDesc("PieBox 项目的应用密钥")
        .addText((text) =>
          text
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
        .setDesc("你的 OpenAI API 密钥")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.openaiApiKey)
            .onChange(async (value) => {
              this.plugin.settings.openaiApiKey = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("服务地址")
        .setDesc("API 地址，支持 OpenAI 兼容的第三方服务")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.openaiBaseUrl)
            .onChange(async (value) => {
              this.plugin.settings.openaiBaseUrl = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("模型名称")
        .setDesc("推荐 text-embedding-3-small")
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
        .setDesc("本地 Ollama 服务地址")
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
        .setDesc("需要先通过 ollama pull 下载模型")
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
        .setName("服务地址")
        .setDesc("OpenAI 兼容格式的 embedding 接口地址")
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
        .setName("模型名称")
        .addText((text) =>
          text
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
    containerEl.createEl("h3", { text: "内容输入配置" });
    containerEl.createEl("p", {
      text: "配置「写点子」功能的保存位置。",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("点子保存位置")
      .setDesc("通过「写点子」功能创建的笔记会保存到这个文件夹")
      .addDropdown((dropdown) => {
        const folders = this.getAllFolders();
        dropdown.addOption("", "— 请选择文件夹 —");
        for (const folder of folders) {
          dropdown.addOption(folder, folder);
        }
        dropdown.setValue(this.plugin.settings.ideasFolder);
        dropdown.onChange(async (value) => {
          this.plugin.settings.ideasFolder = value;
          await this.plugin.saveSettings();
        });
      });

    // ============================================================
    // 三、检索设置
    // ============================================================
    containerEl.createEl("h3", { text: "检索设置" });
    containerEl.createEl("p", {
      text: "配置语义搜索的范围和行为。",
      cls: "setting-item-description",
    });

    // -- 自动更新索引 --
    new Setting(containerEl)
      .setName("自动更新索引")
      .setDesc("开启后，每次保存文件都会自动更新该文件的搜索索引")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoIndex)
          .onChange(async (value) => {
            this.plugin.settings.autoIndex = value;
            await this.plugin.saveSettings();
          })
      );

    // -- 排除文件夹 --
    new Setting(containerEl)
      .setName("排除检索的文件夹")
      .setDesc("这些文件夹中的内容不会被索引，也不会出现在搜索结果中")
      .addDropdown((dropdown) => {
        const folders = this.getAllFolders();
        dropdown.addOption("", "— 点击选择要排除的文件夹 —");
        for (const folder of folders) {
          if (!this.plugin.settings.excludeFolders.includes(folder)) {
            dropdown.addOption(folder, folder);
          }
        }
        dropdown.onChange(async (value) => {
          if (value && !this.plugin.settings.excludeFolders.includes(value)) {
            this.plugin.settings.excludeFolders.push(value);
            await this.plugin.saveSettings();
            this.display();
          }
        });
      });

    // Show excluded folders as removable tags
    if (this.plugin.settings.excludeFolders.length > 0) {
      const excludeList = containerEl.createDiv({ cls: "inkbase-exclude-list" });
      for (const folder of this.plugin.settings.excludeFolders) {
        const tag = excludeList.createDiv({ cls: "inkbase-exclude-tag" });
        tag.createSpan({ text: folder });
        const removeBtn = tag.createEl("button", {
          text: "×",
          cls: "inkbase-exclude-remove",
        });
        removeBtn.addEventListener("click", async () => {
          this.plugin.settings.excludeFolders =
            this.plugin.settings.excludeFolders.filter((f) => f !== folder);
          await this.plugin.saveSettings();
          this.display();
        });
      }
    }

    // -- 搜索对象库 --
    containerEl.createEl("h4", { text: "搜索对象库" });
    containerEl.createEl("p", {
      text: "将文件夹定义为「库」后，搜索时可以选择只在某个库内查找。所有文件夹的内容都会被索引，这里只是方便你按分类筛选搜索结果。",
      cls: "setting-item-description",
    });

    // Display existing libraries
    const libraries = this.plugin.settings.libraries;
    for (let i = 0; i < libraries.length; i++) {
      const lib = libraries[i];
      new Setting(containerEl)
        .setName(lib.name)
        .setDesc(`对应文件夹：${lib.folder}`)
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
      placeholder: "输入库名称，如：素材库",
      cls: "inkbase-lib-input",
    });

    const folderSelect = addLibDiv.createEl("select", {
      cls: "inkbase-lib-select",
    });
    folderSelect.createEl("option", { text: "— 选择对应文件夹 —", value: "" });
    const allFolders = this.getAllFolders();
    for (const folder of allFolders) {
      folderSelect.createEl("option", { text: folder, value: folder });
    }

    const addBtn = addLibDiv.createEl("button", {
      text: "添加",
      cls: "inkbase-lib-add-btn",
    });

    addBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const folder = folderSelect.value;
      if (!name || !folder) return;

      this.plugin.settings.libraries.push({ name, folder });
      await this.plugin.saveSettings();
      this.display();
    });

    // -- 索引管理 --
    containerEl.createEl("h4", { text: "索引管理" });

    const statsEl = containerEl.createDiv({ cls: "inkbase-settings-stats" });
    const docCount = this.plugin.store.getDocumentCount();
    const chunkCount = this.plugin.store.getChunkCount();
    statsEl.setText(`当前已索引：${docCount} 篇文档，${chunkCount} 个文本片段`);

    new Setting(containerEl)
      .setName("重建全部索引")
      .setDesc("重新分析所有笔记并生成搜索索引。首次使用或切换大模型后需要执行。")
      .addButton((btn) =>
        btn.setButtonText("开始重建").onClick(async () => {
          await this.plugin.reindexAll();
          this.display();
        })
      );
  }
}
