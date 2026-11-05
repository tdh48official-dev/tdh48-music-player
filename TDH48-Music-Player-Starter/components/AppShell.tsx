'use client';
import type {ReactNode} from 'react';
import {PlayerProvider} from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';
export default function AppShell({children}:{children:ReactNode}) {
 return <PlayerProvider>{children}<PlayerBar/></PlayerProvider>;
}
