import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioPlayerProps {
  audioUrl: string | null;
  word: string;
}

export function AudioPlayer({ audioUrl, word }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playAudio = async () => {
    if (!audioUrl) {
      toast.error('No audio available');
      return;
    }

    try {
      setIsPlaying(true);

      // Check if it's a storage path or external URL
      let audioSrc = audioUrl;
      if (audioUrl.startsWith('word-audio/')) {
        const { data } = supabase.storage
          .from('word-audio')
          .getPublicUrl(audioUrl.replace('word-audio/', ''));
        audioSrc = data.publicUrl;
      }

      const audioElement = new Audio(audioSrc);
      setAudio(audioElement);

      audioElement.onended = () => {
        setIsPlaying(false);
      };

      audioElement.onerror = () => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
      };

      await audioElement.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!audioUrl) {
    return (
      <Button variant="ghost" size="icon" disabled className="opacity-50">
        <VolumeX className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={isPlaying ? stopAudio : playAudio}
      className="hover:bg-accent"
    >
      <Volume2 className={`h-5 w-5 ${isPlaying ? 'animate-pulse text-primary' : ''}`} />
    </Button>
  );
}
