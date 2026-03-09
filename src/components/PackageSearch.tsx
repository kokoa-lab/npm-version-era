import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface PackageSearchProps {
  onSearch: (packageName: string) => void;
  isLoading: boolean;
}

export default function PackageSearch({ onSearch, isLoading }: PackageSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const suggestions = ["react", "vue", "express", "lodash", "typescript", "next"];

  return (
    <div className="flex flex-col items-center gap-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xl relative">
        <div className="scroll-container rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="npm 패키지명을 입력하세요..."
              className="flex-1 bg-transparent font-body text-lg text-foreground placeholder:text-muted-foreground outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-1.5 rounded bg-primary text-primary-foreground font-display text-sm font-bold
                         hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isLoading ? "탐색 중..." : "탐험하기"}
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((s) => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setQuery(s); onSearch(s); }}
            className="px-3 py-1 rounded-full border border-border text-sm font-body text-muted-foreground
                       hover:border-primary hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
