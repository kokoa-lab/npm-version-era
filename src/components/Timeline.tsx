import type { NpmVersionInfo, VersionEra } from "@/types/version";
import VersionCard from "./VersionCard";
import { useRef, useMemo } from "react";
import { motion } from "framer-motion";

interface TimelineProps {
  versions: NpmVersionInfo[];
  packageName: string;
  description: string;
  repositoryUrl?: string;
}

const eraConfig: { era: VersionEra; label: string; icon: string; cls: string; bgCls: string }[] = [
  { era: "ancient", label: "고대 문명기", icon: "🏛️", cls: "bg-era-ancient", bgCls: "from-[hsl(36,35%,82%)] to-[hsl(36,25%,75%)]" },
  { era: "founding", label: "건국 시대", icon: "⚔️", cls: "bg-era-founding", bgCls: "from-[hsl(32,45%,82%)] to-[hsl(32,55%,70%)]" },
  { era: "revolution", label: "혁명의 시대", icon: "🔥", cls: "bg-era-revolution", bgCls: "from-[hsl(15,35%,82%)] to-[hsl(15,45%,70%)]" },
  { era: "war", label: "격변기", icon: "💥", cls: "bg-era-war", bgCls: "from-[hsl(0,30%,85%)] to-[hsl(0,35%,72%)]" },
  { era: "modern", label: "현대", icon: "🚀", cls: "bg-era-modern", bgCls: "from-[hsl(200,25%,85%)] to-[hsl(200,30%,75%)]" },
];

import { useIsMobile } from "@/hooks/use-mobile";

export default function Timeline({ versions, packageName, description, repositoryUrl }: TimelineProps) {
  const isMobile = useIsMobile();
  const eraRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Group versions by era
  const eraSections = useMemo(() => {
    const sections: { era: VersionEra; label: string; versions: NpmVersionInfo[] }[] = [];
    let current: typeof sections[0] | null = null;
    for (const v of versions) {
      if (!current || current.era !== v.era) {
        current = { era: v.era, label: v.eraLabel, versions: [] };
        sections.push(current);
      }
      current.versions.push(v);
    }
    return sections;
  }, [versions]);

  const presentEras = useMemo(() => eraConfig.filter(e => eraSections.some(s => s.era === e.era)), [eraSections]);

  const scrollToEra = (era: string) => {
    const el = eraRefs.current[era];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let globalIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Package info header */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
          📜 {packageName}의 역사
        </h2>
        {description && (
          <p className="font-body text-muted-foreground text-base italic max-w-xl mx-auto">
            "{description}"
          </p>
        )}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-body pt-1">
          <span>총 <strong className="text-foreground">{versions.length}</strong>개 버전</span>
          <span>·</span>
          <span>{eraSections.length}개 시대</span>
          {repositoryUrl && (
            <>
              <span>·</span>
              <a href={`https://github.com/${repositoryUrl}`} target="_blank" rel="noopener noreferrer"
                 className="underline hover:text-foreground transition-colors">
                GitHub
              </a>
            </>
          )}
        </div>
      </div>

      {/* Sticky Era Navigation */}
      <div className="sticky top-0 z-40 py-2 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {presentEras.map((e) => (
            <button
              key={e.era}
              onClick={() => scrollToEra(e.era)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body
                border border-border hover:border-primary/50 transition-all duration-300
                hover:shadow-md hover:scale-105 cursor-pointer`}
            >
              <div className={`w-2 h-2 rounded-full ${e.cls}`} />
              <span>{e.icon} {e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vertical zigzag timeline */}
      <div className={`relative mx-auto ${isMobile ? 'max-w-lg pl-8' : 'max-w-3xl'}`}>
        {/* Central vertical line */}
        <div className={`absolute top-0 bottom-0 w-px bg-gradient-to-b from-era-ancient via-era-revolution to-era-modern ${isMobile ? 'left-4' : 'left-1/2 -translate-x-1/2'}`} />

        {eraSections.map((section) => {
          const eraConf = eraConfig.find(e => e.era === section.era);
          return (
            <div
              key={section.era + '-' + section.versions[0]?.version}
              ref={(el) => { eraRefs.current[section.era] = el; }}
              className="relative"
            >
              {/* Era header banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`relative z-20 mx-auto w-fit px-6 py-3 rounded-xl mb-6 mt-8
                  bg-gradient-to-r ${eraConf?.bgCls || ''} border border-border shadow-lg`}
              >
                <div className="text-center">
                  <span className="text-2xl">{eraConf?.icon}</span>
                  <h3 className="font-display font-bold text-foreground text-lg">{section.label}</h3>
                  <p className="text-xs text-muted-foreground font-body">
                    {section.versions.length}개 버전
                    {section.versions[0] && (
                      <span> · {new Date(section.versions[0].date).getFullYear()}
                        {section.versions.length > 1 && ` – ${new Date(section.versions[section.versions.length - 1].date).getFullYear()}`}
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Version cards zigzagging */}
              <div className="space-y-3 pb-4">
                {section.versions.map((v) => {
                  const idx = globalIndex++;
                  const side = isMobile ? 'right' as const : (idx % 2 === 0 ? 'left' as const : 'right' as const);
                  return (
                    <VersionCard
                      key={v.version}
                      version={v}
                      side={side}
                      index={idx}
                      repositoryUrl={repositoryUrl}
                      isMobile={isMobile}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* End marker */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative z-20 mx-auto w-fit px-6 py-4 mt-4 text-center"
        >
          <span className="text-3xl">🏁</span>
          <p className="font-medieval text-sm text-muted-foreground mt-1">역사는 계속됩니다...</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
