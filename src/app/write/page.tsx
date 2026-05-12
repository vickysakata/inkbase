"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PenLine, Loader2, FileText, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

interface Source {
  id: string;
  name: string;
  path: string;
}

interface RelatedIdea {
  documentId: string;
  title: string;
  filePath: string;
  snippet: string;
  score: number;
  sourceName: string;
}

export default function WritePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [relatedIdeas, setRelatedIdeas] = useState<RelatedIdea[]>([]);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch("/api/sources");
        if (res.ok) {
          const data: Source[] = await res.json();
          setSources(data);
          if (data.length > 0) {
            setSelectedSourceId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sources", err);
      }
    }
    fetchSources();
    
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !selectedSourceId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          sourceId: selectedSourceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "保存失败");
      }

      setSuccess(true);
      setTitle("");
      setContent("");
      
      if (data.relatedIdeas) {
        setRelatedIdeas(data.relatedIdeas);
      } else {
        setRelatedIdeas([]);
      }
      
      // Auto focus title input for next idea
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("未知错误");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSource = sources.find((s) => s.id === selectedSourceId);
  const isFormValid = title.trim() !== "" && content.trim() !== "" && selectedSourceId !== "";

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pt-8 md:pt-16 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-serif font-medium text-3xl md:text-4xl text-zinc-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-zinc-50 flex items-center justify-center shadow-sm">
            <PenLine className="w-5 h-5" />
          </div>
          写点子
        </h1>
        <p className="mt-3 text-zinc-500">随时记录灵感与素材片段，自动建立关联。</p>
      </div>

      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-between border border-green-200 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">点子已成功保存并建立语义索引。</p>
            </div>
            <button 
              onClick={() => { setSuccess(false); setRelatedIdeas([]); }}
              className="text-green-700 hover:text-green-900 text-sm font-medium"
            >
              关闭
            </button>
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all focus-within:border-zinc-300 focus-within:shadow-md">
          {/* Title Input */}
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="在此输入点子标题..."
              className="w-full bg-transparent font-serif text-2xl md:text-3xl text-zinc-900 placeholder:text-zinc-300 border-none focus:outline-none focus:ring-0 px-0"
            />
          </div>

          {/* Source Selector & Path */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-500">归档至</label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-800 text-sm rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent px-3 py-1.5 outline-none transition-colors"
              >
                {sources.length === 0 && <option disabled value="">正在加载来源...</option>}
                {sources.map(source => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
            </div>
            
            {selectedSource && title.trim() && (
              <p className="text-xs text-zinc-400 font-mono pl-[54px] break-all">
                保存到：{selectedSource.path}/{title.trim().replace(/[/\\:*?"<>|]/g, "_")}.md
              </p>
            )}
          </div>

          {/* Content Textarea */}
          <div className="flex-1 mt-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入你的点子或素材内容..."
              className="w-full h-64 md:h-80 bg-transparent text-base md:text-lg text-zinc-700 leading-relaxed placeholder:text-zinc-300 border-none focus:outline-none focus:ring-0 px-0 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end border-t border-zinc-100">
            <button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
              className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 flex items-center gap-2 shadow-sm"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? '正在封装记忆...' : '保存点子'}
            </button>
          </div>
        </div>

        {/* Related Ideas Section */}
        {success && relatedIdeas.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-serif text-xl font-medium text-zinc-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-400" />
              发现关联的记忆碎片
            </h3>
            <div className="flex flex-col gap-4">
              {relatedIdeas.map((result) => (
                <Link
                  key={`${result.documentId}-${result.score}`}
                  href={`/documents/${result.documentId}`}
                  className="group block bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <h4 className="font-semibold text-zinc-900 truncate">
                        {result.title || '无标题文档'}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 flex-shrink-0">
                        {result.sourceName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">
                        匹配度 {Math.round(result.score * 100)}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  </div>
                  
                  <div 
                    className="text-sm text-zinc-600 leading-relaxed line-clamp-2 prose-strong:text-zinc-900 prose-strong:font-semibold prose-strong:bg-yellow-100 prose-strong:px-1 prose-strong:rounded"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
