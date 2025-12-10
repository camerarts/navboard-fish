import React, { useState } from 'react';

interface BookmarkIconProps {
  url: string;
  title: string;
  className?: string;
}

// Extensive palette for better distinction
const BG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-lime-100 text-lime-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-slate-200 text-slate-700',
];

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ url, title, className = "" }) => {
  const [error, setError] = useState(false);

  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    domain = '';
  }

  // Use Google S2 Service - extremely reliable and supports high res (sz=64)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  // Generate a consistent index based on the domain string hash
  // This ensures that even if the title changes, "google.com" always gets the same color.
  const getHashIndex = (str: string, max: number) => {
    let hash = 0;
    if (str.length === 0) return 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % max;
  };

  const colorIndex = getHashIndex(domain || title || 'default', BG_COLORS.length);
  const colorClass = BG_COLORS[colorIndex];
  
  // Use first valid character
  const letter = (title || domain || '#').charAt(0).toUpperCase();

  if (error || !domain) {
    return (
      <div 
        className={`flex items-center justify-center font-bold shadow-inner ${colorClass} ${className}`} 
        style={{ fontSize: '100%' }}
      >
        {letter}
      </div>
    );
  }

  return (
    <img 
      src={faviconUrl}
      alt={title} 
      className={`object-cover bg-white ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

export default BookmarkIcon;