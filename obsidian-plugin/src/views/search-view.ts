import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type InkbasePlugin from "../main";

export const VIEW_TYPE_SEARCH = "inkbase-search-view";

export class SearchView extends ItemView {
  private plugin: InkbasePlugin;
  private inputEl: HTMLInputElement;
  private resultsEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: InkbasePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_SEARCH;
  }

  getDisplayText(): string {
    return "Inkbase 搜索";
  }

  getIcon(): string {
    return "search";
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("inkbase-search-container");

    // Search input area
    const searchWrapper = container.createDiv({ cls: "inkbase-search-wrapper" });

    this.inputEl = searchWrapper.createEl("input", {
      type: "text",
      placeholder: "输入语义搜索...",
      cls: "inkbase-search-input",
    });

    const searchBtn = searchWrapper.createEl("button", {
      cls: "inkbase-search-btn",
    });
    setIcon(searchBtn, "search");

    // Results area
    this.resultsEl = container.createDiv({ cls: "inkbase-results" });

    // Stats
    const statsEl = container.createDiv({ cls: "inkbase-stats" });
    const docCount = this.plugin.store.getDocumentCount();
    const chunkCount = this.plugin.store.getChunkCount();
    statsEl.setText(`已索引 ${docCount} 篇文档，${chunkCount} 个片段`);

    // Event handlers
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.doSearch();
      }
    });

    searchBtn.addEventListener("click", () => {
      this.doSearch();
    });
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private async doSearch() {
    const query = this.inputEl.value.trim();
    if (!query) return;

    this.resultsEl.empty();
    const loadingEl = this.resultsEl.createDiv({ cls: "inkbase-loading" });
    loadingEl.setText("搜索中...");

    try {
      const results = await this.plugin.semanticSearch(query, 10);
      this.resultsEl.empty();

      if (results.length === 0) {
        const emptyEl = this.resultsEl.createDiv({ cls: "inkbase-empty" });
        emptyEl.setText("未找到匹配的内容");
        return;
      }

      for (const result of results) {
        const itemEl = this.resultsEl.createDiv({ cls: "inkbase-result-item" });

        const headerEl = itemEl.createDiv({ cls: "inkbase-result-header" });

        const titleEl = headerEl.createEl("span", {
          cls: "inkbase-result-title",
        });
        titleEl.setText(result.title);

        const scoreEl = headerEl.createEl("span", {
          cls: "inkbase-result-score",
        });
        scoreEl.setText(`${Math.round(result.score * 100)}%`);

        const snippetEl = itemEl.createDiv({ cls: "inkbase-result-snippet" });
        // Remove [来源：xxx] prefix for display
        const displayText = result.chunk.replace(/^\[来源：.*?\]\n\n/, "");
        snippetEl.setText(
          displayText.length > 200
            ? displayText.slice(0, 200) + "..."
            : displayText
        );

        // Click to open file
        itemEl.addEventListener("click", () => {
          const file =
            this.plugin.app.vault.getAbstractFileByPath(result.filePath);
          if (file) {
            this.plugin.app.workspace.openLinkText(result.filePath, "", false);
          }
        });
      }
    } catch (err) {
      this.resultsEl.empty();
      const errorEl = this.resultsEl.createDiv({ cls: "inkbase-error" });
      errorEl.setText(
        `搜索失败: ${err instanceof Error ? err.message : "未知错误"}`
      );
    }
  }
}
