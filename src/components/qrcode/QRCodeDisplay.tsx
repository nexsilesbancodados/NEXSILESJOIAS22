import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, QrCode } from 'lucide-react';
import { useRef } from 'react';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  size?: number;
  showButton?: boolean;
  buttonText?: string;
}

export function QRCodeDisplay({ 
  value, 
  title = 'QR Code',
  size = 200,
  showButton = true,
  buttonText = 'Ver QR Code'
}: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const QRCodeContent = (
    <div className="flex flex-col items-center gap-4">
      <div ref={qrRef} className="p-4 bg-white rounded-lg">
        <QRCodeSVG 
          value={value} 
          size={size}
          level="H"
          includeMargin
        />
      </div>
      <p className="text-sm text-muted-foreground text-center break-all max-w-[250px]">
        {value}
      </p>
      <Button onClick={handleDownload} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Baixar QR Code
      </Button>
    </div>
  );

  if (!showButton) {
    return QRCodeContent;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {QRCodeContent}
      </DialogContent>
    </Dialog>
  );
}
