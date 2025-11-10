import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Progress from "./pages/Progress";
import Decks from "./pages/Decks";
import Review from "./pages/Review";
import WordDetail from "./pages/WordDetail";
import WordFormPage from "./pages/WordFormPage";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/decks" element={<Decks />} />
            <Route path="/vocabulary" element={<Decks />} />
            <Route path="/word/new" element={<WordFormPage />} />
            <Route path="/word/:deckId" element={<WordDetail />} />
            <Route path="/word/:deckId/edit" element={<WordFormPage />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/review" element={<Review />} />
            <Route path="/review/:deckId" element={<Review />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
