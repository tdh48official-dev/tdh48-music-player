'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'tdh48_member_last_activity';

export default function SessionActivityGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    let signingOut = false;

    const endExpiredSession = async () => {
      if (signingOut) return;
      signingOut = true;
      await supabase.auth.signOut();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      window.location.replace('/');
    };

    const checkAndRecordActivity = () => {
      const now = Date.now();
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));

      if (lastActivity && now - lastActivity >= INACTIVITY_LIMIT_MS) {
        void endExpiredSession();
        return;
      }

      // Keep a persistent, sliding last-active timestamp across browser restarts.
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };

    checkAndRecordActivity();

    const activityEvents: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'touchstart',
      'wheel',
      'click',
    ];

    let lastWrite = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 60_000) return;
      lastWrite = now;
      checkAndRecordActivity();
    };

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, onActivity, { passive: true })
    );

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkAndRecordActivity();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <>{children}</>;
}
