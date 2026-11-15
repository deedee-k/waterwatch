import React from 'react';
import { GlobeIcon } from '../components/Icons';
import { useLanguage } from '../lib/i18n';

/**
 * Simple language toggle button. When clicked it triggers `onOpen`
 * which opens the language modal panel.
 */
export default function LanguageSelector({ onOpen }) {
  const { lang } = useLanguage();
  return (
    <button
      type="button"
      className="lang-toggle-btn"
      onClick={onOpen}
      title="Switch Language / Khetho ea Puo"
    >
      <GlobeIcon size={14} color="var(--primary)" />
      <span>{lang === 'st' ? '🇱🇸 Sesotho' : '🇬🇧 English'}</span>
    </button>
  );
}

