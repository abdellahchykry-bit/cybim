import { ArrowLeft, Home, Settings, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TVButton } from '@/components/ui/tv-button';
import { CybimLogo } from '@/components/icons/CybimLogo';

export function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/home';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center gap-4">
        {!isHome && (
          <TVButton
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </TVButton>
        )}
        <div className="flex items-center gap-3">
          <CybimLogo className="h-8 w-8 text-primary" />
          <span className="font-display text-xl font-bold tracking-wider">CYBIM</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TVButton
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </TVButton>
        <TVButton
          variant="ghost"
          size="icon"
          onClick={() => navigate('/about')}
          aria-label="About"
        >
          <Info className="h-5 w-5" />
        </TVButton>
        {!isHome && (
          <TVButton
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            aria-label="Go to home"
          >
            <Home className="h-6 w-6" />
          </TVButton>
        )}
      </div>
    </nav>
  );
}
