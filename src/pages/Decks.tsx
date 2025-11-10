import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, BookOpen, ChevronRight, Upload } from "lucide-react";

interface Word {
  id: string;
  english_word: string;
  mongolian_translation: string;
  phonetic: string | null;
}

export default function Decks() {
  const { user, loading } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWords();
    }
  }, [user]);

  const fetchWords = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('id, english_word, mongolian_translation, phonetic')
        .order('english_word', { ascending: true });
      
      if (error) throw error;

      setWords(data || []);
    } catch (error: any) {
      console.error('Error fetching words:', error);
      toast.error('Failed to load vocabulary');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Browse Vocabulary</h1>
            <p className="text-lg text-muted-foreground">Explore and learn Mongolian words</p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/bulk-upload')}
                variant="secondary"
              >
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Button 
                onClick={() => navigate('/word/new')}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Word
              </Button>
            </div>
          )}
        </div>

        {words.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No words yet</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin ? 'Add your first word to get started' : 'Check back soon for new vocabulary'}
              </p>
              {isAdmin && (
                <Button onClick={() => navigate('/word/new')} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Word
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map((word) => (
              <Card 
                key={word.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/word/${word.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{word.english_word}</CardTitle>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardDescription className="text-lg text-primary">
                    {word.mongolian_translation}
                  </CardDescription>
                </CardHeader>
                {word.phonetic && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground font-mono">
                      {word.phonetic}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
