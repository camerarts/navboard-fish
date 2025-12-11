
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SEARCH_ENGINES } from '../constants';
import { SearchEngine } from '../types';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = () => {
  const [query, setQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(SEARCH_ENGINES[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    window.location.href = `${selectedEngine.urlTemplate}${encodeURIComponent(query)}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 relative z-20">
      {/* Search Input Box */}
      <div className="relative group">
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        
        <form onSubmit={handleSearch} className="relative flex items-center bg-[var(--bg-glass)] backdrop-blur-sm rounded-2xl shadow-xl shadow-[var(--shadow-color)] ring-1 ring-[var(--border-color)] p-2 transition-all duration-300">
          
          {/* Left: Search Engine Selector */}
          <div className="flex items-center pl-3 pr-2 border-r border-[var(--border-color)] min-w-[110px]">
            <select 
                className="bg-transparent text-sm font-semibold text-[var(--text-secondary)] focus:outline-none cursor-pointer py-2 w-full"
                value={selectedEngine.id}
                onChange={(e) => setSelectedEngine(SEARCH_ENGINES.find(eng => eng.id === e.target.value) || SEARCH_ENGINES[0])}
            >
                {SEARCH_ENGINES.map(eng => (
                <option key={eng.id} value={eng.id}>{eng.name}</option>
                ))}
            </select>
          </div>

          {/* Center: Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] px-4 py-3 w-full focus:outline-none"
            autoFocus
          />
          
          {/* Right: Action Button */}
          <div className="flex items-center gap-2 pl-2">
            <button
                type="submit"
                disabled={!query.trim()}
                className={`p-3 rounded-xl transition-all duration-200 ${
                query.trim() 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
            >
                <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
