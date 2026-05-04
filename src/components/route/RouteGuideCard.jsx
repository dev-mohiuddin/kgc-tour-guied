'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RouteGuideCard = memo(function RouteGuideCard({ guideContent, locale, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!guideContent) return;
    await navigator.clipboard.writeText(guideContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [guideContent]);

  if (isLoading) {
    return (
      <div className="border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-50 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <h3 className="font-semibold text-sm md:text-base">AI Travel Guide</h3>
          </div>
          <div className="space-y-2">
            <div className="h-3 md:h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 md:h-4 bg-muted rounded animate-pulse w-full" />
            <div className="h-3 md:h-4 bg-muted rounded animate-pulse w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!guideContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-50 rounded-xl overflow-hidden"
    >
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm md:text-base">
              {locale === 'bn' ? 'এআই ট্রাভেল গাইড' : 'AI Travel Guide'}
            </h3>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 md:h-8 px-2"
            >
              {copied ? (
                <Check className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </Button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed text-xs md:text-sm">
                {guideContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default RouteGuideCard;
