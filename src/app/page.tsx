"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Loader2, FileText, ChevronRight } from "lucide-react";

interface Source {
  id: string;
  name: string;
}

interface SearchResult {
  documentId: string;
  title: string;
  filePath: string;
  snippet: string;
  score: number;
  sourceName: string;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch available sources
    async function fetchSources() {
      try {
        const res = await fetch("/api/sources");
        if (res.ok) {
          const data = await res.json();
          setSources(data);
        }
      } catch (err) {
        console.error("Failed to fetch sources", err);
      }
    }
    fetchSources();
    
    // Focus search input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query, 
          sourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
          limit: 20
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pt-12 md:pt-24 pb-20">
      {/* Search Header */}
      <div className={`flex flex-col items-center transition-all duration-500 ease-in-out ${hasSearched ? 'mb-12' : 'mb-8 translate-y-8 md:translate-y-20'}`}>
        {!hasSearched && (
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-zinc-50 flex items-center justify-center font-serif font-bold text-4xl shadow-md mb-8">
            I
          </div>
        )}
        
        <h1 className={`font-serif font-medium text-zinc-900 tracking-tight transition-all duration-500 ${hasSearched ? 'text-3xl' : 'text-4xl md:text-5xl mb-12'}`}>
          {hasSearched ? '探索素材' : 'InkBase 素材检索'}
        </h1>
        
        <form onSubmit={handleSearch} className="w-full relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入自然语言描述寻找文档片段..."
            className="w-full pl-12 pr-24 py-4 md:py-5 bg-white border border-zinc-200 rounded-2xl shadow-sm text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400 text-zinc-900"
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '检索'}
            </button>
          </div>
        </form>

        {/* Source Selectors */}
        {sources.length > 0 && (
          <div className={`flex flex-wrap items-center justify-center gap-2 mt-6 transition-all duration-500 ${hasSearched ? 'opacity-100' : 'opacity-100'}`}>
            <button
              type="button"
              onClick={() => setSelectedSourceIds([])}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedSourceIds.length === 0 
                  ? 'bg-zinc-900 text-white border-zinc-900' 
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              全部范围
            </button>
            
            {sources.map(source => (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedSourceIds.includes(source.id)
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-300' 
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Area */}
      {hasSearched && (
        <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!isSearching && results.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-white border border-zinc-100 rounded-2xl shadow-sm">
              <p className="text-lg">未找到匹配的素材片段</p>
              <p className="text-sm mt-2">尝试调整搜索词或范围</p>
            </div>
          ) : (
            results.map((result) => (
              <Link
                key={`${result.documentId}-${result.score}`}
                href={`/documents/${result.documentId}`}
                className="group block bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <h2 className="font-semibold text-zinc-900 truncate">
                      {result.title || '无标题文档'}
                    </h2>
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
                  className="text-sm text-zinc-600 leading-relaxed line-clamp-3 prose-strong:text-zinc-900 prose-strong:font-semibold prose-strong:bg-yellow-100 prose-strong:px-1 prose-strong:rounded"
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </Link>
            ))
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && <div className="mt-8" />}
    </div>
  );
}
