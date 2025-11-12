import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, ArrowLeft, FileText, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseApkg, type AnkiCard } from '@/lib/ankiParser';
import { AudioPlayer } from '@/components/AudioPlayer';

interface ParsedWord {
  english_word: string;
  mongolian_translation: string;
  phonetic?: string;
  difficulty?: number;
}

export default function BulkUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ParsedWord[] | AnkiCard[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadMode, setUploadMode] = useState<'csv' | 'anki'>('csv');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const downloadTemplate = () => {
    const csv = 'english_word,mongolian_translation,phonetic,difficulty\nhello,сайн уу,sain uu,1\ngoodbye,баяртай,bayartai,1';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary_template.csv';
    a.click();
  };

  const parseCSV = (text: string): { words: ParsedWord[]; errors: string[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    const words: ParsedWord[] = [];
    const errors: string[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with commas inside quoted fields
      const parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      
      if (!parts || parts.length < 2) {
        errors.push(`Line ${i + 1}: Invalid format`);
        continue;
      }

      const [english_word, mongolian_translation, phonetic = '', difficulty = '1'] = parts.map(p => p.replace(/^"(.*)"$/, '$1').trim());

      if (!english_word || !mongolian_translation) {
        errors.push(`Line ${i + 1}: Missing required fields (english_word, mongolian_translation)`);
        continue;
      }

      const difficultyNum = parseInt(difficulty);
      if (isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
        errors.push(`Line ${i + 1}: Difficulty must be between 1 and 5`);
        continue;
      }

      words.push({
        english_word,
        mongolian_translation,
        phonetic: phonetic || undefined,
        difficulty: difficultyNum || 1,
      });
    }

    return { words, errors };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview([]);
    setErrors([]);

    try {
      if (uploadMode === 'csv') {
        if (!selectedFile.name.endsWith('.csv')) {
          toast.error('Please select a CSV file');
          return;
        }

        const text = await selectedFile.text();
        const { words, errors: parseErrors } = parseCSV(text);
        
        setPreview(words);
        setErrors(parseErrors);
        
        if (words.length > 0) {
          toast.success(`Parsed ${words.length} words from CSV`);
        }
      } else {
        if (!selectedFile.name.endsWith('.apkg')) {
          toast.error('Please select an .apkg file');
          return;
        }

        toast.info('Parsing Anki deck... This may take a moment.');
        const { cards, errors: parseErrors } = await parseApkg(selectedFile);
        
        setPreview(cards);
        setErrors(parseErrors);
        
        const cardsWithAudio = cards.filter(c => c.audioFile).length;
        toast.success(
          `Parsed ${cards.length} cards from Anki deck (${cardsWithAudio} with audio)`
        );
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0 || !user) {
      toast.error('Please select a valid file first');
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      if (uploadMode === 'anki') {
        const ankiCards = preview as AnkiCard[];
        setUploadProgress({ current: 0, total: ankiCards.length });

        for (let i = 0; i < ankiCards.length; i++) {
          const card = ankiCards[i];
          let audioUrl: string | null = null;

          if (card.audioFile && card.audioFilename) {
            const timestamp = Date.now();
            const sanitizedFilename = card.audioFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `${timestamp}-${sanitizedFilename}`;

            const { error: uploadError } = await supabase.storage
              .from('word-audio')
              .upload(storagePath, card.audioFile, {
                contentType: card.audioFile.type || 'audio/mpeg',
                upsert: false,
              });

            if (uploadError) {
              console.error('Audio upload error:', uploadError);
              setErrors(prev => [...prev, `Failed to upload audio for: ${card.english_word}`]);
            } else {
              audioUrl = `word-audio/${storagePath}`;
            }
          }

          const { error: insertError } = await supabase
            .from('decks')
            .insert({
              english_word: card.english_word,
              mongolian_translation: card.mongolian_translation,
              phonetic: card.phonetic || null,
              audio_url: audioUrl,
              difficulty: card.difficulty || 1,
              name: card.english_word,
              description: card.mongolian_translation,
              user_id: user.id,
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            setErrors(prev => [...prev, `Failed to insert: ${card.english_word}`]);
          } else {
            successCount++;
          }

          setUploadProgress({ current: i + 1, total: ankiCards.length });
        }
      } else {
        const csvWords = preview as ParsedWord[];
        const wordsToInsert = csvWords.map(word => ({
          english_word: word.english_word,
          mongolian_translation: word.mongolian_translation,
          phonetic: word.phonetic || null,
          audio_url: null,
          difficulty: word.difficulty || 1,
          name: word.english_word,
          description: word.mongolian_translation,
          user_id: user.id,
        }));

        const { error } = await supabase.from('decks').insert(wordsToInsert);

        if (error) {
          throw error;
        }

        successCount = csvWords.length;
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} words!`);
        navigate('/vocabulary');
      } else {
        toast.error('No words were uploaded. Check errors.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload words');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vocabulary')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Upload</h1>
            <p className="text-muted-foreground">Import vocabulary from CSV or Anki decks</p>
          </div>
        </div>

        <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'csv' | 'anki')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Import
            </TabsTrigger>
            <TabsTrigger value="anki" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Anki Deck
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CSV Upload Instructions</CardTitle>
                <CardDescription>
                  Upload a CSV file with vocabulary words
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li><strong>english_word</strong> - The English word (required)</li>
                  <li><strong>mongolian_translation</strong> - The Mongolian translation (required)</li>
                  <li><strong>phonetic</strong> - Phonetic pronunciation (optional)</li>
                  <li><strong>difficulty</strong> - Difficulty level 1-5 (optional, defaults to 1)</li>
                </ul>
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anki" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Anki Deck Import</CardTitle>
                <CardDescription>
                  Upload an Anki deck file (.apkg) to import vocabulary with audio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Supports .apkg files exported from Anki</li>
                  <li>Automatically extracts audio files and uploads them</li>
                  <li>Parses English, Mongolian, and phonetic fields</li>
                  <li>May take a few minutes for large decks with audio</li>
                </ul>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Example Deck:</p>
                  <a 
                    href="https://ankiweb.net/shared/info/1157492766" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Mongolian Core Vocabulary with Audio →
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept={uploadMode === 'csv' ? '.csv' : '.apkg'}
                onChange={handleFileChange}
                disabled={uploading}
              />

              {errors.length > 0 && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="font-medium text-destructive mb-2">Errors ({errors.length}):</p>
                  <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                    {errors.slice(0, 10).map((error, i) => (
                      <li key={i} className="text-destructive">{error}</li>
                    ))}
                    {errors.length > 10 && (
                      <li className="text-muted-foreground">... and {errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {preview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      Preview ({preview.length} {uploadMode === 'anki' ? 'cards' : 'words'})
                      {uploadMode === 'anki' && ` - ${preview.filter((c: any) => c.audioFile).length} with audio`}
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {preview.slice(0, 10).map((item, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{item.english_word}</p>
                            <p className="text-sm text-muted-foreground">{item.mongolian_translation}</p>
                            {item.phonetic && (
                              <p className="text-xs text-muted-foreground italic">{item.phonetic}</p>
                            )}
                          </div>
                          {uploadMode === 'anki' && (item as AnkiCard).audioFilename && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AudioPlayer 
                                audioUrl={(item as AnkiCard).audioFilename || null} 
                                word={item.english_word}
                              />
                              <span className="text-xs">Audio</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                    {preview.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        ... and {preview.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {uploadProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || preview.length === 0 || uploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : `Upload ${preview.length} ${uploadMode === 'anki' ? 'Cards' : 'Words'}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/vocabulary')}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}
