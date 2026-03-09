import type { NpmVersionInfo } from "@/types/version";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Scroll, ExternalLink, Loader2, X } from "lucide-react";
import { fetchGitHubRelease } from "@/lib/npm-api";
import { useEffect } from "react";

interface VersionCardProps {
  version: NpmVersionInfo;
  side: 'left' | 'right';
  index: number;
  repositoryUrl?: string;
  isMobile?: boolean;
}

const eraStyles: Record<string, { dot: string; border: string; label: string; bg: string }> = {
  ancient: { dot: "bg-era-ancient", border: "border-era-ancient", label: "🏛️", bg: "bg-era-ancient/10" },
  founding: { dot: "bg-era-founding", border: "border-era-founding", label: "⚔️", bg: "bg-era-founding/10" },
  revolution: { dot: "bg-era-revolution", border: "border-era-revolution", label: "🔥", bg: "bg-era-revolution/10" },
  war: { dot: "bg-era-war", border: "border-era-war", label: "💥", bg: "bg-era-war/10" },
  modern: { dot: "bg-era-modern", border: "border-era-modern", label: "🚀", bg: "bg-era-modern/10" },
};

const eventLabels: Record<string, string> = {
  birth: "탄생", founding: "건국", revolution: "혁명",
  war: "전쟁", reform: "개혁", minor: "발전", patch: "보수",
};

const eventDescriptions: Record<string, string> = {
  birth: "새로운 세계의 시작. 미지의 땅에 첫 발을 내딛다.",
  founding: "건국 선언! 안정적인 API가 선포되었다.",
  revolution: "대혁명! 세계의 질서가 바뀌다. Breaking Changes!",
  war: "격변의 시기. 호환성이 무너지다.",
  reform: "개혁의 바람. 새로운 기능이 추가되다.",
  minor: "점진적 발전. 왕국이 번영하다.",
  patch: "보수 공사. 버그가 퇴치되다.",
};

function renderChangelog(text: string) {
  const lines = text.split('\n').slice(0, 40);
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    if (trimmed.startsWith('### ')) return <h4 key={i} className="font-display font-bold text-foreground text-xs mt-2 mb-0.5">{trimmed.slice(4)}</h4>;
    if (trimmed.startsWith('## ')) return <h3 key={i} className="font-display font-bold text-foreground text-sm mt-2 mb-0.5">{trimmed.slice(3)}</h3>;
    if (trimmed.startsWith('# ')) return <h3 key={i} className="font-display font-bold text-foreground text-sm mt-2 mb-0.5">{trimmed.slice(2)}</h3>;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <li key={i} className="text-xs text-foreground/80 ml-3 list-disc leading-relaxed">{trimmed.slice(2)}</li>;
    }
    const formatted = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} className="text-xs text-foreground/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

function getNodeImportance(version: NpmVersionInfo): 'major' | 'minor' | 'patch' | 'pre' {
  if (version.isPrerelease) return 'pre';
  if (version.eventType === 'founding' || version.eventType === 'revolution') return 'major';
  if (version.eventType === 'reform') return 'minor';
  return 'patch';
}

export default function VersionCard({ version, side, index, repositoryUrl, isMobile }: VersionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [changelog, setChangelog] = useState<string | null>(version.changelog || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(!!version.changelog);

  const style = eraStyles[version.era] || eraStyles.modern;
  const importance = getNodeImportance(version);
  const date = new Date(version.date);
  const dateStr = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;

  useEffect(() => {
    if (!isOpen || hasFetched || !repositoryUrl) return;
    setHasFetched(true);
    setIsLoading(true);
    fetchGitHubRelease(repositoryUrl, version.version)
      .then((notes) => {
        if (notes) {
          setChangelog(notes);
          version.changelog = notes;
        }
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, repositoryUrl, version, hasFetched]);

  const githubReleaseUrl = repositoryUrl
    ? `https://github.com/${repositoryUrl}/releases/tag/v${version.version}`
    : null;

  const dotSize = importance === 'major' ? 'w-5 h-5' : importance === 'minor' ? 'w-3.5 h-3.5' : importance === 'pre' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <motion.div
      className={`flex items-start gap-0 ${isMobile ? 'flex-row' : side === 'right' ? 'flex-row' : 'flex-row-reverse'} relative`}
      initial={{ opacity: 0, x: isMobile ? 20 : side === 'left' ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      {/* Card */}
      <div className={`flex-1 ${isMobile ? 'pr-2' : side === 'right' ? 'pr-4' : 'pl-4'} ${isMobile ? '' : 'max-w-[calc(50%-20px)]'}`}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full text-left scroll-container rounded-lg p-3 cursor-pointer transition-shadow
            ${isOpen ? 'ring-2 ring-primary/40 shadow-lg' : 'hover:shadow-md'}
            ${version.isPrerelease ? 'opacity-70 border-dashed' : ''}`}
        >
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{style.label}</span>
            <span className={`font-display font-bold text-foreground ${importance === 'major' ? 'text-base' : 'text-sm'}`}>
              v{version.version}
            </span>
            {version.isPrerelease && version.preTag && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/50 text-accent-foreground/70 font-body">
                {version.preTag.split('.')[0]}
              </span>
            )}
            {importance === 'major' && (
              <span className="text-[10px] font-medieval text-primary">
                {eventLabels[version.eventType]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
            <span>{dateStr}</span>
            <span>·</span>
            <span className="font-medieval">{version.eraLabel}</span>
          </div>
          {importance !== 'patch' && importance !== 'pre' && (
            <p className="text-xs font-body text-foreground/60 italic mt-1 leading-relaxed">
              {eventDescriptions[version.eventType]}
            </p>
          )}
        </motion.button>

        {/* Expanded changelog scroll */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="scroll-container rounded-lg mt-2 overflow-hidden">
                {/* Scroll top decoration */}
                <div className="h-1.5 bg-gradient-to-b from-primary/25 to-transparent" />

                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-primary" />
                      <span className="font-medieval text-xs text-primary/80">두루마리</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isLoading && (
                    <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>두루마리 해독 중...</span>
                    </div>
                  )}

                  {changelog && (
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {renderChangelog(changelog)}
                    </div>
                  )}

                  {!changelog && !isLoading && version.description && (
                    <p className="text-xs font-body text-muted-foreground leading-relaxed">
                      {version.description}
                    </p>
                  )}

                  {!changelog && !isLoading && !version.description && hasFetched && (
                    <p className="text-xs text-muted-foreground italic py-2">
                      📜 기록이 소실되었습니다...
                    </p>
                  )}

                  {githubReleaseUrl && (
                    <a href={githubReleaseUrl} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                       onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" /> GitHub Release 보기
                    </a>
                  )}
                </div>

                <div className="h-1.5 bg-gradient-to-t from-primary/25 to-transparent" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center dot + connector */}
      <div className={`flex flex-col items-center shrink-0 relative z-10 ${isMobile ? 'order-first' : ''}`} style={{ width: isMobile ? 28 : 40 }}>
        {/* Horizontal connector line */}
        <div className={`absolute top-3 ${isMobile ? 'left-full' : side === 'right' ? 'right-full mr-0 left-1/2' : 'left-full ml-0 right-1/2'} 
          h-px bg-border`} style={{ width: isMobile ? 12 : 20 }} />
        <motion.div
          whileHover={{ scale: 1.4 }}
          className={`${dotSize} rounded-full ${style.dot} ring-2 ring-background shadow-md cursor-pointer relative
            ${version.isPrerelease ? 'opacity-50 ring-dashed' : ''}
            ${importance === 'major' ? 'shadow-lg' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {importance === 'major' && !version.isPrerelease && (
            <div className={`absolute inset-0 rounded-full ${style.dot} animate-ping opacity-20`} />
          )}
        </motion.div>
      </div>

      {/* Spacer for the other side */}
      {!isMobile && <div className="flex-1 max-w-[calc(50%-20px)]" />}
    </motion.div>
  );
}
