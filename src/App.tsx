import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { DailyReviewPanel } from "./components/DailyReviewPanel";
import Index from "./pages/Index";
import Budget from "./pages/Budget";
import Capital from "./pages/Capital";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/capital" element={<Capital />} />
            <Route path="/review" element={<Review />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DailyReviewPanel />
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
