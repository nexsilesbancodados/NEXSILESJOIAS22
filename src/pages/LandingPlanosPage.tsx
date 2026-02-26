import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LandingPlanosPage = () => {
  useEffect(() => {
    window.location.href = 'https://www.nexsiles.com.br/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default LandingPlanosPage;
