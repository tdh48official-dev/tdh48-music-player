export type Track = {
  id:string; title:string; artist:string; category:string; album:string|null;
  audio_url:string; cover_url:string|null; duration_seconds:number|null;
  release_date:string|null; is_featured:boolean; created_at:string;
};
