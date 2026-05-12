"use client";

import { useState, useEffect } from "react";
import { FolderPlus, RefreshCw, Trash2, HardDrive, Database, AlertCircle, CheckCircle2 } from "lucide-react";

interface Source {
  id: string;
  name: string;
  path: string;
  _count?: { documents: number };
}

export default function SettingsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [newName, setNewName] = useState("");
  const [newPath, setNewPath] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Status state for scanning
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<{type: 'scan' | 'index' | 'error' | 'success', message: string} | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error("Failed to fetch sources", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPath.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, path: newPath }),
      });
      
      if (res.ok) {
        setNewName("");
        setNewPath("");
        await fetchSources();
      } else {
        alert("添加失败，请检查路径是否有效");
      }
    } catch (err) {
      console.error("Failed to add source", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("确定要删除该来源吗？相关文档和索引也会被移除。")) return;
    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSources();
      } else {
        alert("删除失败");
      }
    } catch (err) {
      console.error("Failed to delete source", err);
      alert("删除请求失败");
    }
  };

  const handleScanAndIndex = async (sourceId: string) => {
    if (processingId) return; // Prevent multiple concurrent operations
    
    setProcessingId(sourceId);
    
    try {
      // 1. Scan
      setProcessStatus({ type: 'scan', message: '正在扫描目录文件...' });
      const scanRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      
      if (!scanRes.ok) throw new Error("扫描失败");
      const scanData = await scanRes.json();
      
      // 2. Index - 循环调用直到所有 chunk 都有 embedding
      let remaining = 1; // 初始化为非零值以进入循环
      let totalProcessed = 0;
      
      while (remaining > 0) {
        setProcessStatus({ type: 'index', message: `正在生成向量索引...（已处理 ${totalProcessed} 个片段）` });
        const indexRes = await fetch("/api/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId }),
        });
        
        if (!indexRes.ok) throw new Error("索引生成失败");
        const indexData = await indexRes.json();
        
        remaining = indexData.remaining || 0;
        totalProcessed += indexData.processed || 0;
        
        // 如果本轮没处理任何 chunk，说明已完成
        if (indexData.processed === 0) break;
      }
      
      setProcessStatus({ type: 'success', message: `完成！扫描 ${scanData.total || 0} 个文件，索引 ${totalProcessed} 个片段` });
      await fetchSources(); // Refresh document counts
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setProcessStatus(null);
        setProcessingId(null);
      }, 3000);
      
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '操作失败';
      setProcessStatus({ type: 'error', message: errorMsg });
      setTimeout(() => {
        setProcessStatus(null);
        setProcessingId(null);
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-medium text-zinc-900 tracking-tight mb-2">
          库管理
        </h1>
        <p className="text-zinc-500">
          管理您的本地素材来源，扫描并构建语义索引。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Source List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="font-medium text-zinc-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-500" />
                已添加的来源
              </h2>
              <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                {sources.length} 个库
              </span>
            </div>
            
            <div className="divide-y divide-zinc-100">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">加载中...</p>
                </div>
              ) : sources.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                    <HardDrive className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="font-medium text-zinc-700">暂无来源</p>
                  <p className="text-sm mt-1">请在右侧添加您的本地 Markdown 文件夹</p>
                </div>
              ) : (
                sources.map((source) => (
                  <div key={source.id} className="p-6 transition-colors hover:bg-zinc-50/50 group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-zinc-900 truncate">
                            {source.name}
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {source._count?.documents || 0} 篇文档
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 font-mono truncate bg-zinc-50 px-2 py-1 rounded border border-zinc-100 inline-block max-w-full">
                          {source.path}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleScanAndIndex(source.id)}
                          disabled={processingId !== null}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                            ${processingId === source.id 
                              ? 'bg-zinc-900 text-white border-zinc-900' 
                              : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {processingId === source.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{processStatus?.type === 'index' ? '索引中' : '扫描中'}</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>扫描更新</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          disabled={processingId !== null}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          title="删除该来源"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Status Feedback */}
                    {processingId === source.id && processStatus && (
                      <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 border
                        ${processStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 
                          processStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 
                          'bg-zinc-900 text-zinc-50 border-zinc-900'}
                      `}>
                        {processStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
                        {processStatus.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                        {(processStatus.type === 'scan' || processStatus.type === 'index') && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>{processStatus.message}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Add Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sticky top-24">
            <h2 className="font-medium text-zinc-900 flex items-center gap-2 mb-5">
              <FolderPlus className="w-4 h-4 text-zinc-500" />
              添加新来源
            </h2>
            
            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                  显示名称
                </label>
                <input
                  id="name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：营销素材库"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="path" className="block text-sm font-medium text-zinc-700 mb-1">
                  本地文件夹路径
                </label>
                <input
                  id="path"
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="/Users/name/Documents/Materials"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-mono placeholder:font-sans placeholder:text-zinc-400"
                  required
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  输入包含 Markdown 文件的绝对路径。
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isAdding || !newName.trim() || !newPath.trim()}
                className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 flex items-center justify-center gap-2"
              >
                {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : '添加并保存'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
