import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function LGPDPanel() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState<{ id: string; scheduled_for: string } | null>(null);

  useEffect(() => {
    void loadPending();
  }, []);

  async function loadPending() {
    const { data } = await supabase
      .from("account_deletion_requests" as never)
      .select("id, scheduled_for")
      .eq("status", "pending")
      .maybeSingle();
    if (data) setPendingDeletion(data as { id: string; scheduled_for: string });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `nexsiles-meus-dados-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Download iniciado");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha no export";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

  async function handleRequestDeletion() {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deletion", {
        body: { confirm: true, reason: reason || undefined },
      });
      if (error) throw error;
      toast.success("Solicitação registrada. Sua conta será excluída em 30 dias.");
      setReason("");
      await loadPending();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleCancelDeletion() {
    if (!pendingDeletion) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("account_deletion_requests" as never)
        .update({ status: "cancelled" } as never)
        .eq("id", pendingDeletion.id);
      if (error) throw error;
      toast.success("Solicitação de exclusão cancelada");
      setPendingDeletion(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar meus dados
          </CardTitle>
          <CardDescription>
            Baixe uma cópia completa de todos os seus dados pessoais e da sua organização em formato JSON (LGPD Art. 18, II).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Baixar meus dados (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Excluir minha conta
          </CardTitle>
          <CardDescription>
            Solicite a exclusão permanente da sua conta e de todos os dados associados (LGPD Art. 18, VI). Sua conta entrará em período de carência de <strong>30 dias</strong>, no qual você pode cancelar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingDeletion ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm">
                ⏳ Exclusão agendada para <strong>{format(new Date(pendingDeletion.scheduled_for), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>.
              </p>
              <Button variant="outline" onClick={handleCancelDeletion} disabled={cancelling}>
                {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancelar solicitação
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                placeholder="Motivo (opcional) — nos ajuda a melhorar"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                rows={3}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Solicitar exclusão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão da conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação iniciará a exclusão permanente da sua conta e de todos os dados em 30 dias. Você pode cancelar a qualquer momento antes disso.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRequestDeletion} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                      {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
