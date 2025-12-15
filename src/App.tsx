import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import SplashScreen from "./pages/SplashScreen";
import HomeScreen from "./pages/HomeScreen";
import CampaignEditor from "./pages/CampaignEditor";
import PreviewScreen from "./pages/PreviewScreen";
import PlayScreen from "./pages/PlayScreen";
import SettingsScreen from "./pages/SettingsScreen";
import AboutScreen from "./pages/AboutScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/campaign/:id" element={<CampaignEditor />} />
            <Route path="/preview/:id" element={<PreviewScreen />} />
            <Route path="/play" element={<PlayScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
