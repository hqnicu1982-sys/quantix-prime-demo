import { Link } from "@tanstack/react-router";
import { Card, CardHead } from "@/components/Primitives";
import { useProject } from "@/lib/ProjectContext";
import { useProjectData } from "@/lib/projectData";
import { useLabourLogs, computeEntryCost } from "@/lib/laborLog";
import { useInvoices, type RegistryInvoice } from "@/lib/invoiceRegistry";
import { useProjectVariations } from "@/lib/variations";
import { useCan } from "@/lib/permissions";
import { usePendingNotices, usePaymentCycle } from "@/lib/paymentCycle";
import { ClipboardCheck, FileSignature, Truck, GitBranch, ArrowRight, Inbox, ShieldAlert, Banknote } from "lucide-react";

/**
 * Approval inbox — surfaces every item the current user needs to act on,
 * across labour approvals, call-offs, invoices, and variations.
 * Renders nothing if the user has no approval capabilities.
 */
export function ApprovalInboxCard() {
  const { current } = useProject();
  const projectId = current.id;

  const canApproveLabour = useCan("approve.labour");
  const canApproveCalloffs = useCan("approve.calloffs");
  const canSignInvoices = useCan("sign.invoices");
  const canEditVariations = useCan("edit.variations");
  const canIssuePaymentNotice = useCan("issue.payment.notice");
  const canRecordPayment = useCan("record.payment");

  const data = useProjectData(projectId);
  const labourLogs = useLabourLogs(projectId);
  const invoices = useInvoices(projectId);
  const variations = useProjectVariations(projectId);
  const pendingNotices = usePendingNotices(projectId, 7);
  const paymentCycle = usePaymentCycle(projectId);

  const anyCap = canApproveLabour || canApproveCalloffs || canSignInvoices || canEditVariations || canIssuePaymentNotice || canRecordPayment;
  if (!anyCap) return null;

  // Build sections for things the current user can act on
  const sections: Array<{ key: string; show: boolean; icon: React.ReactNode; title: string; count: number; subtitle: string; to: any; params?: any }> = [];

  if (canApproveLabour) {
    const pending = labourLogs.filter((l) => (l.status ?? "submitted") === "submitted");
    const totalCost = pending.reduce((s, l) => s + computeEntryCost(l), 0);
    const totalHours = pending.reduce((s, l) => s + l.hours, 0);
    sections.push({
      key: "labour",
      show: pending.length > 0,
      icon: <ClipboardCheck className="h-4 w-4" />,
      title: "Labour to approve",
      count: pending.length,
      subtitle: `${totalHours.toFixed(1)}h · £${totalCost.toFixed(0)} pending`,
      to: "/daily-report",
    });
  }

  if (canApproveCalloffs) {
    const pending = data.callOffs.filter((c) => c.status === "draft");
    // ProjectCallOff has no monetary value yet — surface count + line count
    const totalLines = pending.reduce((s, c) => s + c.lineIds.length, 0);
    sections.push({
      key: "calloffs",
      show: pending.length > 0,
      icon: <Truck className="h-4 w-4" />,
      title: "Call-offs to approve",
      count: pending.length,
      subtitle: `${totalLines} line${totalLines === 1 ? "" : "s"} across ${pending.length} draft${pending.length === 1 ? "" : "s"}`,
      to: "/projects/$projectId/calloffs",
      params: { projectId },
    });
  }

  if (canSignInvoices) {
    const pending = invoices.filter((i: RegistryInvoice) => i.status === "outstanding" || i.status === "overdue");
    const overdue = pending.filter((i: RegistryInvoice) => i.status === "overdue").length;
    const totalValue = pending.reduce((s: number, i: RegistryInvoice) => s + i.amount, 0);
    sections.push({
      key: "invoices",
      show: pending.length > 0,
      icon: <FileSignature className="h-4 w-4" />,
      title: "Invoices to action",
      count: pending.length,
      subtitle: `£${(totalValue / 1000).toFixed(0)}k outstanding${overdue ? ` · ${overdue} overdue` : ""}`,
      to: "/projects/$projectId/invoices",
      params: { projectId },
    });
  }

  if (canEditVariations) {
    const pending = variations.filter((v) => v.status === "submitted" || v.status === "draft");
    sections.push({
      key: "variations",
      show: pending.length > 0,
      icon: <GitBranch className="h-4 w-4" />,
      title: "Variations to price",
      count: pending.length,
      subtitle: `${pending.filter((v) => v.status === "draft").length} draft · ${pending.filter((v) => v.status === "submitted").length} submitted`,
      to: "/projects/$projectId/variations",
      params: { projectId },
    });
  }

  if (canIssuePaymentNotice && pendingNotices.length > 0) {
    const overdue = pendingNotices.filter((a) => {
      const d = new Date(a.dueDateForNotice); d.setHours(0, 0, 0, 0);
      return d.getTime() < Date.now();
    }).length;
    sections.push({
      key: "payment-notices",
      show: true,
      icon: <FileSignature className="h-4 w-4" />,
      title: "Payment Notices to issue",
      count: pendingNotices.length,
      subtitle: overdue ? `${overdue} overdue · contract clock running` : `Soonest due ${pendingNotices[0].dueDateForNotice}`,
      to: "/projects/$projectId/payments",
      params: { projectId },
    });
  }

  if (canRecordPayment) {
    const dueCerts = paymentCycle.applications.filter(
      (a) => a.status === "certified",
    );
    if (dueCerts.length > 0) {
      const total = dueCerts.reduce((s, a) => {
        const c = a.certificateId ? paymentCycle.certificates.find((x) => x.id === a.certificateId) : undefined;
        return s + (c?.finalAmount ?? 0);
      }, 0);
      sections.push({
        key: "payments-due",
        show: true,
        icon: <Banknote className="h-4 w-4" />,
        title: "Certificates awaiting payment",
        count: dueCerts.length,
        subtitle: `£${(total / 1000).toFixed(0)}k due to record`,
        to: "/projects/$projectId/payments",
        params: { projectId },
      });
    }
  }

  const visible = sections.filter((s) => s.show);
  const totalItems = visible.reduce((s, x) => s + x.count, 0);

  return (
    <Card>
      <CardHead
        title="Awaiting your approval"
        subtitle={totalItems === 0 ? "All clear — nothing pending in your queue" : `${totalItems} item${totalItems === 1 ? "" : "s"} need your action on this project`}
        right={
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${totalItems > 0 ? "bg-[var(--amber-500)]/15 text-[var(--amber-500)]" : "bg-[var(--green-600)]/15 text-[var(--green-600)]"}`}>
            <Inbox className="h-3 w-3" />
            {totalItems}
          </span>
        }
      />
      {visible.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-[var(--ink-500)]">
          Inbox empty. New items appear here as crews log labour, call-offs are drafted, invoices arrive, or variations are raised.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--ink-200)]">
          {visible.map((s) => (
            <li key={s.key}>
              <Link
                to={s.to}
                {...(s.params ? { params: s.params } : {})}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--ink-50)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-500)]/10 text-[var(--accent-500)]">
                  {s.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--ink-900)]">{s.title}</p>
                    <span className="rounded-full bg-[var(--amber-500)]/15 px-1.5 py-0.5 font-mono-num text-[10.5px] font-bold text-[var(--amber-500)]">{s.count}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[var(--ink-500)]">{s.subtitle}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--ink-500)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}