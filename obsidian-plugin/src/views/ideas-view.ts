import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import type InkbasePlugin from "../main";

export const VIEW_TYPE_IDEAS = "inkbase-ideas-view";

export class IdeasView extends ItemView {
  private plugin: InkbasePlugin;
  private textareaEl: HTMLTextAreaElement;
  private relatedEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: InkbasePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_IDEAS;
  }

  getDisplayText(): string {
    return "Inkbase 点子";
  }

  getIcon(): string {
    return "lightbulb";
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("inkbase-ideas-container");

    // Title
    const titleEl = container.createEl("h4", { cls: "inkbase-ideas-title" });
    titleEl.setText("记录点子");

    // Textarea
    this.textareaEl = container.createEl("textarea", {
      cls: "inkbase-ideas-textarea",
      attr: { placeholder: "写下你的想法...", rows: "6" },
    });

    // Save button
    const btnWrapper = container.createDiv({ cls: "inkbase-ideas-actions" });
    const saveBtn = btnWrapper.createEl("button", {
      cls: "inkbase-ideas-save-btn",
      text: "保存点子",
    });

    // Related results area
    const relatedTitle = container.createDiv({ cls: "inkbase-related-title" });
    relatedTitle.setText("相关素材");
    this.relatedEl = container.createDiv({ cls: "inkbase-related-results" });

    // Event handlers
    saveBtn.addEventListener("click", () => this.saveIdea());
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private async saveIdea() {
    const content = this.textareaEl.value.trim();
    if (!content) {
      new Notice("请先写点内容");
      return;
    }

    try {
      // Create file in ideas folder
      const folder = this.plugin.settings.ideasFolder;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const fileName = `${folder}/${timestamp}.md`;

      // Ensure folder exists
      const folderExists = this.plugin.app.vault.getAbstractFileByPath(folder);
      if (!folderExists) {
        await this.plugin.app.vault.createFolder(folder);
      }

      // Write file
      await this.plugin.app.vault.create(fileName, `# 点子\n\n${content}\n`);

      // Index it immediately
      await this.plugin.indexFile(fileName);
      await this.plugin.store.save();

      new Notice("点子已保存！");

      // Find related content
      await this.findRelated(content);

      // Clear textarea
      this.textareaEl.value = "";
    } catch (err) {
      new Notice(
        `保存失败: ${err instanceof Error ? err.message : "未知错误"}`
      );
    }
  }

  private async findRelated(content: string) {
    this.relatedEl.empty();

    try {
      const results = await this.plugin.semanticSearch(content, 3);

      if (results.length === 0) {
        this.relatedEl.createDiv({ cls: "inkbase-empty", text: "暂无相关素材" });
        return;
      }

      for (const result of results) {
        const itemEl = this.relatedEl.createDiv({ cls: "inkbase-result-item" });

        const titleEl = itemEl.createEl("span", {
          cls: "inkbase-result-title",
        });
        titleEl.setText(result.title);

        const snippetEl = itemEl.createDiv({ cls: "inkbase-result-snippet" });
        const displayText = result.chunk.replace(/^\[来源：.*?\]\n\n/, "");
        snippetEl.setText(
          displayText.length > 150
            ? displayText.slice(0, 150) + "..."
            : displayText
        );

        itemEl.addEventListener("click", () => {
          this.plugin.app.workspace.openLinkText(result.filePath, "", false);
        });
      }
    } catch (err) {
      this.relatedEl.createDiv({
        cls: "inkbase-error",
        text: "查找相关素材失败",
      });
    }
  }
}
