import { Plugin, WorkspaceLeaf, TFile, TAbstractFile, Notice, debounce } from "obsidian";
import { InkbaseSettingTab } from "./settings";
import { SearchView, VIEW_TYPE_SEARCH } from "./views/search-view";
import { VectorStore } from "./store";
import { createEmbeddingProvider } from "./embedding/factory";
import { splitIntoChunks } from "./chunker";
import type { InkbaseSettings, EmbeddingProvider } from "./types";

const DEFAULT_SETTINGS: InkbaseSettings = {
  provider: "doubao",
  pieAppId: "",
  pieAppSecret: "",
  pieGatewayPath: "https://pie-gateway.weapp.me",
  doubaoApiKey: "",
  doubaoModel: "ep-20260514161629-ljxkk",
  openaiApiKey: "",
  openaiBaseUrl: "https://api.openai.com",
  openaiModel: "text-embedding-3-small",
  ollamaEndpoint: "http://localhost:11434",
  ollamaModel: "nomic-embed-text",
  customEndpoint: "",
  customApiKey: "",
  customModel: "",
  excludeFolders: [],
  autoIndex: true,
  libraries: [],
};

export default class InkbasePlugin extends Plugin {
  settings: InkbaseSettings;
  store: VectorStore;
  embeddingProvider: EmbeddingProvider;

  private indexQueue: Set<string> = new Set();
  private isIndexing = false;

  private debouncedProcessQueue = debounce(
    () => this.processIndexQueue(),
    2000,
    true
  );

  async onload() {
    await this.loadSettings();

    this.store = new VectorStore(this);
    await this.store.load();

    this.embeddingProvider = createEmbeddingProvider(this.settings);

    // Register views
    this.registerView(VIEW_TYPE_SEARCH, (leaf) => new SearchView(leaf, this));

    // Ribbon icons
    this.addRibbonIcon("search", "Inkbase: 语义搜索", () => {
      this.activateView(VIEW_TYPE_SEARCH);
    });

    // Commands
    this.addCommand({
      id: "open-search",
      name: "打开语义搜索",
      callback: () => this.activateView(VIEW_TYPE_SEARCH),
    });

    this.addCommand({
      id: "reindex-all",
      name: "重建全部索引",
      callback: () => this.reindexAll(),
    });

    // Settings tab
    this.addSettingTab(new InkbaseSettingTab(this.app, this));

    // File watchers for auto-indexing
    if (this.settings.autoIndex) {
      this.registerEvent(
        this.app.vault.on("modify", (file) => this.onFileChange(file))
      );
      this.registerEvent(
        this.app.vault.on("create", (file) => this.onFileChange(file))
      );
      this.registerEvent(
        this.app.vault.on("delete", (file) => this.onFileDelete(file))
      );
      this.registerEvent(
        this.app.vault.on("rename", (file, oldPath) =>
          this.onFileRename(file, oldPath)
        )
      );
    }
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SEARCH);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Rebuild embedding provider when settings change
    this.embeddingProvider = createEmbeddingProvider(this.settings);
  }

  async activateView(viewType: string) {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(viewType)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: viewType, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  // --- File Change Handlers ---

  private onFileChange(file: TAbstractFile) {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    if (this.isExcluded(file.path)) return;
    this.indexQueue.add(file.path);
    this.debouncedProcessQueue();
  }

  private onFileDelete(file: TAbstractFile) {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    this.store.removeDocument(file.path);
    this.store.save();
  }

  private onFileRename(file: TAbstractFile, oldPath: string) {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    this.store.removeDocument(oldPath);
    if (!this.isExcluded(file.path)) {
      this.indexQueue.add(file.path);
      this.debouncedProcessQueue();
    } else {
      this.store.save();
    }
  }

  private isExcluded(filePath: string): boolean {
    return this.settings.excludeFolders.some(
      (folder) => filePath.startsWith(folder + "/") || filePath === folder
    );
  }

  // --- Indexing ---

  private async processIndexQueue() {
    if (this.isIndexing || this.indexQueue.size === 0) return;
    this.isIndexing = true;

    const paths = [...this.indexQueue];
    this.indexQueue.clear();

    try {
      for (const path of paths) {
        await this.indexFile(path);
      }
      await this.store.save();
    } catch (err) {
      console.error("[Inkbase] Indexing error:", err);
    } finally {
      this.isIndexing = false;
      // If more items queued during processing, process again
      if (this.indexQueue.size > 0) {
        this.debouncedProcessQueue();
      }
    }
  }

  async indexFile(filePath: string, force = false): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.cachedRead(file);
    if (!content.trim()) {
      this.store.removeDocument(filePath);
      return;
    }

    const title = file.basename;
    const chunks = splitIntoChunks(content, title);

    // Check if content has changed (skip re-embedding only when not forced)
    if (!force) {
      const existing = this.store.getDocument(filePath);
      if (existing && this.chunksUnchanged(existing.chunks, chunks)) {
        return; // No change, skip re-embedding
      }
    }

    // Generate embeddings
    const embeddings = await this.embeddingProvider.getEmbeddings(chunks);

    // Store
    this.store.setDocument(filePath, {
      title,
      chunks: chunks.map((text, i) => ({
        text,
        embedding: embeddings[i],
      })),
      lastModified: file.stat.mtime,
    });
  }

  private chunksUnchanged(
    existing: { text: string }[],
    newChunks: string[]
  ): boolean {
    if (existing.length !== newChunks.length) return false;
    return existing.every((chunk, i) => chunk.text === newChunks[i]);
  }

  async reindexAll() {
    const files = this.app.vault.getMarkdownFiles().filter(
      (f) => !this.isExcluded(f.path)
    );

    new Notice(`Inkbase: 开始索引 ${files.length} 个文件...`);

    let indexed = 0;
    for (const file of files) {
      try {
        await this.indexFile(file.path, true); // force re-embedding
        indexed++;
        if (indexed % 10 === 0) {
          new Notice(`Inkbase: 已索引 ${indexed}/${files.length}...`);
          await this.store.save();
        }
      } catch (err) {
        console.error(`[Inkbase] Failed to index ${file.path}:`, err);
      }
    }

    await this.store.save();
    new Notice(`Inkbase: 索引完成！共 ${indexed} 个文件。`);
  }

  // --- Search ---

  async semanticSearch(
    query: string,
    limit = 10,
    libraryFolder?: string
  ): Promise<{ filePath: string; title: string; chunk: string; score: number }[]> {
    const queryEmbedding = await this.embeddingProvider.getEmbedding(query);
    return this.store.search(queryEmbedding, limit, libraryFolder);
  }
}
