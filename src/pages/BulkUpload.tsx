import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

interface ParsedWord {
  english_word: string;
  mongolian_translation: string;
  phonetic?: string;
  difficulty: number;
}

export default function BulkUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ParsedWord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

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
    const csvContent = 'english_word,mongolian_translation,phonetic,difficulty\nHello,Сайн уу,/sain uu/,1\nGoodbye,Баяртай,/bayartai/,1\nThank you,Баярлалаа,/bayarlalaa/,2\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        difficulty: difficultyNum,
      });
    }

    return { words, errors };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    
    // Parse and preview
    const text = await selectedFile.text();
    const { words, errors } = parseCSV(text);
    
    setPreview(words);
    setErrors(errors);

    if (words.length > 0) {
      toast.success(`Parsed ${words.length} word(s) successfully`);
    }
    if (errors.length > 0) {
      toast.error(`Found ${errors.length} error(s) in CSV`);
    }
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) {
      toast.error('Please select a valid CSV file');
      return;
    }

    setUploading(true);
    try {
      // Prepare data for insertion
      const wordsToInsert = preview.map(word => ({
        ...word,
        name: word.english_word,
        description: word.mongolian_translation,
        user_id: user?.id,
        audio_url: null,
      }));

      const { data, error } = await supabase
        .from('decks')
        .insert(wordsToInsert)
        .select();

      if (error) throw error;

      toast.success(`Successfully uploaded ${data.length} word(s)!`);
      navigate('/decks');
    } catch (error: any) {
      console.error('Error uploading words:', error);
      if (error.code === '23505') {
        toast.error('Some words already exist in the database');
      } else {
        toast.error('Failed to upload words');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bulk Upload Vocabulary</h1>
          <p className="text-lg text-muted-foreground">Upload multiple words at once using a CSV file</p>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>Follow these steps to upload vocabulary in bulk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">CSV Format:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>english_word</strong> (required): The English word</li>
                  <li><strong>mongolian_translation</strong> (required): The Mongolian translation</li>
                  <li><strong>phonetic</strong> (optional): Phonetic transcription</li>
                  <li><strong>difficulty</strong> (optional): Level from 1 (easiest) to 5 (hardest), defaults to 1</li>
                </ul>
              </div>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Errors found in CSV:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {errors.length > 5 && (
                        <li>...and {errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {preview.length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Preview: {preview.length} words ready to upload</div>
                    <div className="text-sm space-y-1">
                      {preview.slice(0, 3).map((word, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">Lvl {word.difficulty}</span>
                          <span>{word.english_word} → {word.mongolian_translation}</span>
                        </div>
                      ))}
                      {preview.length > 3 && (
                        <div className="text-muted-foreground">...and {preview.length - 3} more</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || preview.length === 0}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {preview.length} Word(s)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/decks')}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
