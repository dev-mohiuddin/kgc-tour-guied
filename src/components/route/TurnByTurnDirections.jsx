'use client';

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MapPin, Navigation } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const TurnByTurnDirections = memo(function TurnByTurnDirections({ legs }) {
  const [expandedLeg, setExpandedLeg] = useState(null);

  const handleToggle = useCallback((value) => {
    setExpandedLeg(value === expandedLeg ? null : value);
  }, [expandedLeg]);

  if (!legs || legs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Navigation className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-base md:text-lg">
          যাত্রার নির্দেশিকা
        </h3>
      </div>

      <Accordion type="single" collapsible value={expandedLeg} onValueChange={handleToggle} className="w-full">
        {legs.map((leg, i) => (
          <AccordionItem value={`leg-${i}`} key={i} className="border rounded-lg px-3 md:px-4">
            <AccordionTrigger className="py-2 md:py-3 hover:no-underline">
              <div className="flex items-center gap-2 md:gap-3 text-left">
                <div className="h-5 w-5 md:h-6 md:w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{leg.distance} ({leg.duration} মিনিট)</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 hidden md:block">
                    {leg.startAddress?.split(',')[0] || ''} → {leg.endAddress?.split(',')[0] || ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  {leg.steps?.length > 0 && (
                    <span className="text-[10px] md:text-xs bg-muted px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                      {leg.steps.length} ধাপ
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {leg.steps && leg.steps.length > 0 ? (
                <ol className="space-y-2 md:space-y-3 pt-2 pb-1">
                  {leg.steps.map((step, j) => (
                    <li key={j} className="flex gap-2 md:gap-3 text-sm">
                      <span className="flex-shrink-0 h-4 w-4 md:h-5 md:w-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold">
                        {j + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-muted-foreground leading-relaxed text-xs md:text-sm break-words"
                          dangerouslySetInnerHTML={{ __html: step.instruction }}
                        />
                        {step.distance && (
                          <span className="text-[10px] md:text-xs text-muted-foreground mt-1 block">
                            {step.distance}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  এই ধাপের জন্য বিস্তারিত নির্দেশনা পাওয়া যায়নি।
                </p>
              )}
              
              {leg.steps && leg.steps.length > 0 && (
                <div className="pt-2 md:pt-3 mt-2 md:mt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const origin = encodeURIComponent(leg.startAddress || '');
                      const dest = encodeURIComponent(leg.endAddress || '');
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
                      window.open(url, '_blank');
                    }}
                    className="w-full text-xs"
                  >
                    <MapPin className="h-3 w-3 mr-2 text-blue-600" />
                    গুগল ম্যাপসে খুলুন
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
});

export default TurnByTurnDirections;
