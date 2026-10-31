'use client';
import {createContext,useContext,useRef,useState} from 'react';
import type {Track} from '@/lib/types';
type Ctx={track:Track|null;playing:boolean;play:(t:Track)=>void;toggle:()=>void;audio:React.RefObject<HTMLAudioElement|null>};
const C=createContext<Ctx|null>(null);
export function PlayerProvider({children}:{children:React.ReactNode}){
 const [track,setTrack]=useState<Track|null>(null); const [playing,setPlaying]=useState(false); const audio=useRef<HTMLAudioElement>(null);
 const play=(t:Track)=>{setTrack(t);setPlaying(true);setTimeout(()=>{if(audio.current){audio.current.src=t.audio_url;audio.current.play().catch(()=>setPlaying(false));}},0)};
 const toggle=()=>{if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false)}else{audio.current.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))}};
 return <C.Provider value={{track,playing,play,toggle,audio}}>{children}<audio ref={audio} onEnded={()=>setPlaying(false)} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)}/></C.Provider>
}
export function usePlayer(){const v=useContext(C);if(!v)throw new Error('PlayerProvider missing');return v}
