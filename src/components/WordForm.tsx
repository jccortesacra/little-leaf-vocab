import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

interface WordFormProps {
  deckId?: string;
  initialData?: {
    english_word: string;
    mongolian_translation: string;
    phonetic: string;
    audio_url: string | null;
  };
  mode: 'create' | 'edit';
}

export function WordForm({ deckId, initialData, mode }: WordFormProps) {
  const navigate = useNavigate();
  const [englishWord, setEnglishWord] = useState(initialData?.english_word || '');
  const [mongolianTranslation, setMongolianTranslation] = useState(initialData?.mongolian_translation || '');
  const [phonetic, setPhonetic] = useState(initialData?.phonetic || '');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState(initialData?.audio_url || '');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Audio file must be less than 5MB');
      return;
    }

    setAudioFile(file);
  };

  const uploadAudio = async (): Promise<string | null> => {
    if (!audioFile) return audioUrl || null;

    setUploading(true);
    try {
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('word-audio')
        .upload(filePath, audioFile);

      if (uploadError) throw uploadError;

      return `word-audio/${filePath}`;
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to upload audio');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload audio if provided
      const finalAudioUrl = await uploadAudio();

      const { data: userData } = await supabase.auth.getUser();
      
      const wordData = {
        english_word: englishWord,
        mongolian_translation: mongolianTranslation,
        phonetic: phonetic || null,
        audio_url: finalAudioUrl,
        name: englishWord,
        description: mongolianTranslation,
        user_id: userData.user?.id,
      };

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('decks')
          .insert([wordData])
          .select()
          .single();

        if (error) throw error;

        toast.success('Word created successfully!');
        navigate(`/word/${data.id}`);
      } else if (mode === 'edit' && deckId) {
        const { error } = await supabase
          .from('decks')
          .update(wordData)
          .eq('id', deckId);

        if (error) throw error;

        toast.success('Word updated successfully!');
        navigate(`/word/${deckId}`);
      }
    } catch (error: any) {
      console.error('Error saving word:', error);
      if (error.code === '23505') {
        toast.error('This English word already exists');
      } else {
        toast.error('Failed to save word');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Word' : 'Edit Word'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="english">English Word *</Label>
            <Input
              id="english"
              placeholder="e.g., Hello"
              value={englishWord}
              onChange={(e) => setEnglishWord(e.target.value)}
              required
              disabled={mode === 'edit'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mongolian">Mongolian Translation *</Label>
            <Textarea
              id="mongolian"
              placeholder="e.g., Сайн уу"
              value={mongolianTranslation}
              onChange={(e) => setMongolianTranslation(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phonetic">Phonetic (Optional)</Label>
            <Input
              id="phonetic"
              placeholder="e.g., /sain uu/"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">IPA or romanization</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio">Audio Pronunciation (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="cursor-pointer"
              />
              {audioFile && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span>{audioFile.name}</span>
                </div>
              )}
            </div>
            {audioUrl && !audioFile && (
              <p className="text-sm text-muted-foreground">Current audio file attached</p>
            )}
            <p className="text-sm text-muted-foreground">MP3, WAV, or M4A (max 5MB)</p>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create Word' : 'Update Word'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/vocabulary')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
