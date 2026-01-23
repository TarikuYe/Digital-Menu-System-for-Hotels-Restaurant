import React from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'de', name: 'Deutsch' },
];

const LanguageSelector = ({ language, setLanguage }) => {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 transition-all hover:border-gold/30">
      <Globe size={16} className="text-gold/70" />
      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Language</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-4"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-brand-dark text-white">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
