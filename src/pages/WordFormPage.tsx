import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WordForm } from '@/components/WordForm';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function WordFormPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(!!deckId);

  const mode = deckId ? 'edit' : 'create';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Access denied: Admin only');
      navigate('/vocabulary');
    }
  }, [isAdmin, roleLoading, navigate]);

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

      setInitialData(data);
    } catch (error: any) {
      console.error('Error fetching word:', error);
      toast.error('Failed to load word');
      navigate('/vocabulary');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
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
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <WordForm mode={mode} deckId={deckId} initialData={initialData} />
      </main>
    </div>
  );
}
