import { useState } from "react";
import { motion } from "framer-motion";
import PackageSearch from "@/components/PackageSearch";
import Timeline from "@/components/Timeline";
import { fetchPackageVersions, filterSignificantVersions } from "@/lib/npm-api";
import type { NpmPackageData } from "@/types/version";
import { Scroll } from "lucide-react";

const Index = () => {
  const [packageData, setPackageData] = useState<NpmPackageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (packageName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPackageVersions(packageName);
      data.versions = filterSignificantVersions(data.versions);
      setPackageData(data);
    } catch (err: any) {
      setError(err.message || "패키지를 찾을 수 없습니다");
      setPackageData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="parchment-bg border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-3">
              <Scroll className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                Version<span className="gold-text">Era</span>
              </h1>
              <Scroll className="w-8 h-8 text-primary" />
            </div>
            <p className="font-body text-lg text-muted-foreground max-w-lg mx-auto">
              npm 패키지의 버전 역사를 고대 연표처럼 탐험하세요.
              <br />
              <span className="font-medieval text-sm">
                v0.x는 고대 문명기, v1.0은 건국, 메이저 업데이트는 혁명.
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PackageSearch onSearch={handleSearch} isLoading={isLoading} />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="scroll-container max-w-md mx-auto rounded-lg p-6 text-center"
          >
            <p className="font-display text-destructive font-bold">⚠️ {error}</p>
            <p className="font-body text-sm text-muted-foreground mt-1">패키지 이름을 확인해주세요</p>
          </motion.div>
        )}

        {packageData && !error && (
          <Timeline
            versions={packageData.versions}
            packageName={packageData.name}
            description={packageData.description}
            repositoryUrl={packageData.repositoryUrl}
          />
        )}

        {!packageData && !error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-20 space-y-4"
          >
            <p className="font-medieval text-4xl">🏛️</p>
            <p className="font-display text-xl text-muted-foreground">역사는 아직 기록되지 않았습니다</p>
            <p className="font-body text-sm text-muted-foreground">위에서 패키지를 검색하여 연표를 펼쳐보세요</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
