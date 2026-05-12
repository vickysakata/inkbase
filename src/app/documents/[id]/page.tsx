"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ExternalLink, HardDrive, FileText, Loader2, AlertCircle } from "lucide-react";

interface DocumentDetail {
  id: string;
  title: string;
  filePath: string;
  content: string;
  source: { name: string };
}

export default function DocumentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    async function fetchDoc() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (!res.ok) {
          throw new Error("文档不存在或无法访问");
        }
        const data = await res.json();
        setDoc(data);
      } catch (err: unknown) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : "加载失败";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchDoc();
    }
  }, [id]);

  const handleOpenLocal = async () => {
    if (!doc?.filePath) return;
    
    setIsOpening(true);
    try {
      const res = await fetch("/api/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: doc.filePath }),
      });
      
      if (!res.ok) {
        alert("无法打开文件，请检查文件是否存在");
      }
    } catch (err) {
      console.error("Open file error", err);
      alert("打开失败");
    } finally {
      setIsOpening(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">加载素材中...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回搜索
        </Link>
        
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">加载失败</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-serif font-medium text-zinc-900 tracking-tight truncate">
            {doc.title || '无标题文档'}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-zinc-500">
              <HardDrive className="w-3.5 h-3.5" />
              {doc.source?.name || '未知来源'}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span className="inline-flex items-center gap-1.5 text-zinc-400 truncate">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[200px] md:max-w-md" title={doc.filePath}>
                {doc.filePath.split('/').pop()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
          <article className="prose prose-zinc prose-headings:font-serif prose-headings:font-medium prose-h1:text-3xl prose-h2:text-2xl prose-a:text-blue-600 hover:prose-a:text-blue-500 max-w-none prose-p:leading-relaxed prose-p:text-zinc-700 prose-pre:bg-zinc-900 prose-pre:text-zinc-50">
            <ReactMarkdown>{doc.content}</ReactMarkdown>
          </article>
        </div>
        
        {/* Bottom Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between mt-auto">
          <div className="text-xs text-zinc-400 font-mono truncate px-4 flex-1">
            {doc.filePath}
          </div>
          <button
            onClick={handleOpenLocal}
            disabled={isOpening}
            className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 shadow-sm"
          >
            {isOpening ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>在本地打开</span>
          </button>
        </div>
      </div>
    </div>
  );
}
