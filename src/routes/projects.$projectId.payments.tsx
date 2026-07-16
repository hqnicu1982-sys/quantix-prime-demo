import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardHead } from "@/components/Primitives";
import { Button } from "@/components/ui/button";
import { Plus, FileSignature, ShieldAlert, CheckCircle2, Banknote, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/lib/ProjectContext";
import { useCan } from "@/lib/permissions";
import { fmtMoney } from "@/lib/mockData";
import {
  usePaymentCycle,
  usePaymentTotals,
  submitApplication,
  deleteApplication,
  CATEGORY_LABELS,
  type PaymentApplication,
} from "@/lib/paymentCycle";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { NewApplicationDialog } from "@/components/payments/NewApplicationDialog";
import {
  PaymentNoticeDialog, PayLessNoticeDialog, CertificateDialog, RecordPaymentDialog,
} from "@/components/payments/IssueNoticeDialogs";
import { CashflowForecastCard } from "@/components/payments/CashflowForecastCard";
import { NoAccess } from "@/components/auth/NoAccess";

export const Route = createFileRoute("/projects/$projectId/payments")({ component: GuardedPaymentsPage });

function GuardedPaymentsPage() {
  const allowed = useCan("view.payments");
  if (!allowed) return <NoAccess cap="view.payments" title="Payments restricted" />;
  return <PaymentsPage />;
}

function PaymentsPage() {
  const { projectId } = Route.useParams();
  const { current } = useProject();
  const ourRole = current.ourRole ?? "subcontractor";
  const data = usePaymentCycle(projectId);
  const totals = usePaymentTotals(projectId);

  const canCreate = useCan("create.payment.application");
  const canIssueNotice = useCan("issue.payment.notice");
  const canRecord = useCan("record.payment");

  const [newOpen, setNewOpen] = useState(false);
  const [noticeApp, setNoticeApp] = useState<PaymentApplication | null>(null);
  const [payLessApp, setPayLessApp] = useState<PaymentApplication | null>(null);
  const [certApp, setCertApp] = useState<PaymentApplication | null>(null);
  const [paymentApp, setPaymentApp] = useState<PaymentApplication | null>(null);

  const counterparty = current.mainContractor;

  const apps = data.applications;

  const dueTone = useMemo(() => {
    if (totals.daysToNextDue == null) return null;
    if (totals.daysToNextDue < 0) return "danger";
    if (totals.daysToNextDue <= 2) return "warning";
    return "ok";
  }, [totals.daysToNextDue]);

  return (
    <div className="space-y-4 py-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Applied to date" value={fmtMoney(totals.appliedYTD, { compact: true })} hint={`${apps.length} application${apps.length === 1 ? "" : "s"}`} />
        <Kpi label="Certified to date" value={fmtMoney(totals.certifiedYTD, { compact: true })} hint={`Retention held ${fmtMoney(totals.retentionHeldTotal, { compact: true })}`} />
        <Kpi label="Outstanding" value={fmtMoney(totals.outstanding, { compact: true })} hint="Certified − paid" tone={totals.outstanding > 0 ? "warn" : "ok"} />
        <Kpi
          label="Next Notice due"
          value={totals.nextDueDate ?? "—"}
          hint={
            totals.daysToNextDue == null
              ? "No pending applications"
              : totals.daysToNextDue < 0
                ? `${Math.abs(totals.daysToNextDue)} day${Math.abs(totals.daysToNextDue) === 1 ? "" : "s"} overdue`
                : `in ${totals.daysToNextDue} day${totals.daysToNextDue === 1 ? "" : "s"}`
          }
          tone={dueTone === "danger" ? "danger" : dueTone === "warning" ? "warn" : undefined}
        />
      </div>

      <Card>
        <CardHead
          title="Payment cycle"
          subtitle={
            ourRole === "subcontractor"
              ? `Submit Applications to ${counterparty} → receive Notices & Certificates → mark when paid`
              : `Receive Applications from subbies → issue Payment Notices, Pay Less Notices and Certificates`
          }
          right={
            ourRole === "subcontractor" && canCreate ? (
              <Button size="sm" onClick={() => setNewOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Application
              </Button>
            ) : ourRole === "main_contractor" && totals.pendingApplicationsCount > 0 ? (
              <span className="text-[12px] font-medium text-[var(--amber-500)]">
                {totals.pendingApplicationsCount} awaiting your Notice
              </span>
            ) : null
          }
        />

        {apps.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] text-[var(--ink-500)]">No applications yet.</p>
            {ourRole === "subcontractor" && canCreate && (
              <Button size="sm" className="mt-3" onClick={() => setNewOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create the first one
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--ink-200)]">
            {apps.map((app) => {
              const notice = app.noticeId ? data.notices.find((n) => n.id === app.noticeId) : null;
              const payLess = app.payLessNoticeId ? data.payLess.find((p) => p.id === app.payLessNoticeId) : null;
              const cert = app.certificateId ? data.certificates.find((c) => c.id === app.certificateId) : null;
              return (
                <li key={app.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num text-[13px] font-bold text-[var(--ink-900)]">{app.appNumber}</span>
                        <PaymentStatusBadge status={app.status} />
                        <span className="text-[12px] text-[var(--ink-500)]">· valuation {app.periodEnd}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-[var(--ink-500)]">
                        <span>Gross <strong className="font-mono-num text-[var(--ink-700)]">{fmtMoney(app.grossTotal)}</strong></span>
                        <span>Retention <strong className="font-mono-num text-[var(--ink-700)]">−{fmtMoney(app.retentionHeld)}</strong></span>
                        <span>This app <strong className="font-mono-num text-[var(--ink-900)]">{fmtMoney(app.netThisApplication)}</strong></span>
                        {app.status === "submitted" && (
                          <span className="text-[var(--amber-500)]">Notice due {app.dueDateForNotice}</span>
                        )}
                        {(app.status === "noticed" || app.status === "certified") && (
                          <span>Final date {app.finalDateForPayment}</span>
                        )}
                      </div>
                    </div>
                    <ApplicationActions
                      app={app}
                      ourRole={ourRole}
                      canCreate={canCreate}
                      canIssueNotice={canIssueNotice}
                      canRecord={canRecord}
                      onSubmit={() => { submitApplication(projectId, app.id); toast.success("Application submitted", { description: `Notice due ${app.dueDateForNotice}` }); }}
                      onDelete={() => { deleteApplication(projectId, app.id); toast.success("Application deleted"); }}
                      onIssueNotice={() => setNoticeApp(app)}
                      onPayLess={() => setPayLessApp(app)}
                      onIssueCert={() => setCertApp(app)}
                      onRecordPayment={() => setPaymentApp(app)}
                    />
                  </div>

                  {/* Line breakdown */}
                  <details className="mt-2 text-[12px]">
                    <summary className="cursor-pointer text-[var(--accent-500)]">Line items ({app.lines.length})</summary>
                    <ul className="mt-2 space-y-1 rounded bg-[var(--ink-50)] p-2">
                      {app.lines.map((l) => (
                        <li key={l.id} className="flex justify-between gap-3">
                          <span className="text-[var(--ink-500)]">[{CATEGORY_LABELS[l.category]}] {l.description || <em>—</em>}</span>
                          <span className="font-mono-num text-[var(--ink-700)]">{fmtMoney(l.gross)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>

                  {/* Cycle artifacts */}
                  {(notice || payLess || cert) && (
                    <div className="mt-2 space-y-1.5">
                      {notice && (
                        <CycleRow icon={<FileSignature className="h-3.5 w-3.5 text-[var(--accent-500)]" />} label="Payment Notice" date={notice.issuedAt} amount={fmtMoney(notice.certifiedAmount)} note={notice.notes} />
                      )}
                      {payLess && (
                        <CycleRow icon={<ShieldAlert className="h-3.5 w-3.5 text-[var(--amber-500)]" />} label="Pay Less Notice" date={payLess.issuedAt} amount={`−${fmtMoney(payLess.withholdingAmount)}`} note={payLess.reason} />
                      )}
                      {cert && (
                        <CycleRow
                          icon={<CheckCircle2 className={`h-3.5 w-3.5 ${cert.paidAt ? "text-[var(--green-600)]" : "text-[var(--accent-500)]"}`} />}
                          label={`Certificate ${cert.certificateNumber}`}
                          date={cert.issuedAt}
                          amount={fmtMoney(cert.finalAmount)}
                          note={cert.paidAt ? `Paid ${cert.paidAt}${cert.paymentReference ? ` · ${cert.paymentReference}` : ""}` : `Due ${app.finalDateForPayment}`}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <CashflowForecastCard projectId={projectId} counterparty={counterparty} ourRole={ourRole} />

      <NewApplicationDialog open={newOpen} onOpenChange={setNewOpen} projectId={projectId} />
      <PaymentNoticeDialog open={!!noticeApp} onOpenChange={(v) => !v && setNoticeApp(null)} projectId={projectId} application={noticeApp} />
      <PayLessNoticeDialog open={!!payLessApp} onOpenChange={(v) => !v && setPayLessApp(null)} projectId={projectId} application={payLessApp} />
      <CertificateDialog open={!!certApp} onOpenChange={(v) => !v && setCertApp(null)} projectId={projectId} application={certApp} ourRole={ourRole} counterparty={counterparty} />
      <RecordPaymentDialog
        open={!!paymentApp}
        onOpenChange={(v) => !v && setPaymentApp(null)}
        projectId={projectId}
        application={paymentApp}
        certificateAmount={paymentApp?.certificateId ? (data.certificates.find((c) => c.id === paymentApp!.certificateId)?.finalAmount ?? 0) : 0}
      />
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "warn" | "danger" }) {
  const valueClass =
    tone === "danger" ? "text-[var(--red-500)]"
    : tone === "warn" ? "text-[var(--amber-500)]"
    : "text-[var(--ink-900)]";
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
      <div className={`mt-1 font-mono-num text-[20px] font-bold ${valueClass}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-[var(--ink-500)]">{hint}</div>}
    </Card>
  );
}

function CycleRow({ icon, label, date, amount, note }: { icon: React.ReactNode; label: string; date: string; amount: string; note?: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-[var(--ink-200)] bg-white px-2.5 py-1.5 text-[12px]">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[var(--ink-900)]">{label}</span>
          <span className="font-mono-num text-[var(--ink-700)]">{amount}</span>
        </div>
        <div className="text-[11px] text-[var(--ink-500)]">{date}{note ? ` · ${note}` : ""}</div>
      </div>
    </div>
  );
}

function ApplicationActions({
  app, ourRole, canCreate, canIssueNotice, canRecord,
  onSubmit, onDelete, onIssueNotice, onPayLess, onIssueCert, onRecordPayment,
}: {
  app: PaymentApplication;
  ourRole: "subcontractor" | "main_contractor";
  canCreate: boolean;
  canIssueNotice: boolean;
  canRecord: boolean;
  onSubmit: () => void;
  onDelete: () => void;
  onIssueNotice: () => void;
  onPayLess: () => void;
  onIssueCert: () => void;
  onRecordPayment: () => void;
}) {
  const buttons: React.ReactNode[] = [];

  if (app.status === "draft" && ourRole === "subcontractor" && canCreate) {
    buttons.push(
      <Button key="submit" size="sm" variant="outline" onClick={onSubmit}>
        <Send className="mr-1 h-3.5 w-3.5" /> Submit
      </Button>,
      <Button key="del" size="sm" variant="ghost" onClick={onDelete} className="text-[var(--red-500)]">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>,
    );
  }

  if (app.status === "submitted" && ourRole === "main_contractor" && canIssueNotice) {
    buttons.push(
      <Button key="notice" size="sm" onClick={onIssueNotice}>
        <FileSignature className="mr-1 h-3.5 w-3.5" /> Issue Notice
      </Button>,
    );
  }

  if (app.status === "noticed" && ourRole === "main_contractor" && canIssueNotice) {
    buttons.push(
      <Button key="payless" size="sm" variant="outline" onClick={onPayLess} className="text-[var(--amber-500)]">
        <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Pay Less
      </Button>,
      <Button key="cert" size="sm" onClick={onIssueCert}>
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Issue Certificate
      </Button>,
    );
  }

  if (app.status === "certified" && canRecord) {
    buttons.push(
      <Button key="record" size="sm" onClick={onRecordPayment}>
        <Banknote className="mr-1 h-3.5 w-3.5" /> Record payment
      </Button>,
    );
  }

  if (buttons.length === 0) return null;
  return <div className="flex shrink-0 items-center gap-1.5">{buttons}</div>;
}