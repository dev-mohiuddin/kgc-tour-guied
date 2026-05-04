'use client';

import { Phone, Ambulance, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { useI18n } from '@/lib/i18n';

export default function EmergencyButton() {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        className="h-14 w-14 rounded-full bg-secondary hover:bg-secondary/90 shadow-lg"
        onClick={() => window.open('tel:999')}
      >
        <Phone className="h-6 w-6" />
      </Button>
    </div>
  );
}
