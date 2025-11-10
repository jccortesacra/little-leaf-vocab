import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Word {
  id: string;
  english_word: string;
  mongolian_translation: string;
  phonetic: string | null;
  audio_url: string | null;
}

export default function WordDetail() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && deckId) {
      fetchWord();
    }
  }, [user, deckId]);

  const fetchWord = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;

      setWord(data);
    } catch (error: any) {
      console.error('Error fetching word:', error);
      toast.error('Failed to load word');
      navigate('/vocabulary');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deckId) return;

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;

      toast.success('Word deleted successfully');
      navigate('/vocabulary');
    } catch (error: any) {
      console.error('Error deleting word:', error);
      toast.error('Failed to delete word');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!word) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/vocabulary')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vocabulary
        </Button>

        <Card>
          <CardContent className="pt-8">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <h1 className="text-5xl font-bold">{word.english_word}</h1>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/word/${deckId}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Word?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{word.english_word}" and all associated reviews.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              <div className="h-px bg-border"></div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Language</p>
                  <p className="text-lg font-medium">Mongolian</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Translation</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-semibold text-primary">{word.mongolian_translation}</p>
                    <AudioPlayer audioUrl={word.audio_url} word={word.english_word} />
                  </div>
                </div>

                {word.phonetic && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phonetic</p>
                    <p className="text-xl font-mono text-muted-foreground">{word.phonetic}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
