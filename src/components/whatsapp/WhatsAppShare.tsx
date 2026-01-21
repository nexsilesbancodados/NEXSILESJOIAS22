import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { openWhatsApp, openWhatsAppWithoutPhone } from '@/lib/whatsapp';

interface WhatsAppShareProps {
  message: string;
  phone?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function WhatsAppShare({
  message,
  phone,
  buttonText = 'Enviar via WhatsApp',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  showIcon = true,
}: WhatsAppShareProps) {
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [editedMessage, setEditedMessage] = useState(message);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = () => {
    if (phoneNumber) {
      openWhatsApp(phoneNumber, editedMessage);
    } else {
      openWhatsAppWithoutPhone(editedMessage);
    }
    setIsOpen(false);
  };

  const handleDirectSend = () => {
    if (phone) {
      openWhatsApp(phone, message);
    } else {
      setIsOpen(true);
    }
  };

  // If we have a phone, send directly
  if (phone) {
    return (
      <Button 
        variant={buttonVariant} 
        size={buttonSize}
        onClick={handleDirectSend}
        className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        {showIcon && <MessageCircle className="h-4 w-4" />}
        {buttonText}
      </Button>
    );
  }

  // Otherwise show dialog to enter phone number
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {showIcon && <MessageCircle className="h-4 w-4" />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar via WhatsApp</DialogTitle>
          <DialogDescription>
            Insira o número de telefone e revise a mensagem antes de enviar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (com DDD)</Label>
            <Input
              id="phone"
              placeholder="11999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSend}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
