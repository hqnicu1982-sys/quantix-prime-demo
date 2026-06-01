import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, FileText, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  buildInitialMapping,
  simulateMspBundle,
  summarizeMapping,
  type MspBundle,
  type MspMappingRow,
} from "@/lib/msProjectImport";
import {
  addTask,
  updateTask,
  useProjectTasks,
  type PlannerTask,
} from "@/lib/planner";
import { useProjectCrews } from "@/lib/labour";
import { useProfitForecast } from "@/lib/profitForecast";
import {
  connectIntegration,
  syncIntegration,
  useIntegrationConnection,
} from "@/lib/integrationConnections";
import { currentUser, fmtMoney } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type Step = "select" | "preview" | "done";

export function MsProjectImportDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [bundle, setBundle] = useState<MspBundle | null>(null);
  const [mapping, setMapping] = useState<MspMappingRow[]>([]);
  const [defaultCrewId, setDefaultCrewId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const tasks = useProjectTasks(projectId);
  const crews = useProjectCrews(projectId);
  const forecast = useProfitForecast(projectId);
  const mspConn = useIntegrationConnection("msp");

  // Auto-pick the first crew so imported tasks always carry a billable rate.
  // Without a crewId the forecast can't price labour and confidence stalls.
  const resolvedDefaultCrewId = defaultCrewId ?? crews[0]?.assignment.memberId;

  const summary = useMemo(() => summarizeMapping(mapping), [mapping]);

  const reset = () => {
    setStep("select");
    setBundle(null);
    setMapping([]);
    setDefaultCrewId(undefined);
    setIsLoading(false);
  };

  const browseFile = () => {
    setIsLoading(true);
    // simulate the file picker + parse delay
    setTimeout(() => {
      const b = simulateMspBundle(projectId);
      setBundle(b);
      setMapping(buildInitialMapping(b.rows, tasks));
      setStep("preview");
      setIsLoading(false);
    }, 600);
  };

  const apply = () => {
    if (!bundle) return;
    let created = 0;
    let updated = 0;
    for (const m of mapping) {
      if (m.action === "skip") continue;
      const fallbackCrew = resolvedDefaultCrewId;
      if (m.action === "update" && m.matchedTaskId) {
        const existing = tasks.find((t) => t.id === m.matchedTaskId);
        updateTask(projectId, m.matchedTaskId, {
          title: m.msp.name,
          start: m.msp.start,
          end: m.msp.finish,
          plannedHours: m.msp.workHours,
          crewId: existing?.crewId ?? fallbackCrew,
          notes: `MSProject baseline ${bundle.baselineName} · UID ${m.msp.uid}`,
        });
        updated += 1;
      } else if (m.action === "create") {
        const newTask: Omit<PlannerTask, "id" | "createdAt" | "updatedAt"> = {
          projectId,
          title: m.msp.name,
          level: levelFromName(m.msp.name),
          crewId: fallbackCrew,
          start: m.msp.start,
          end: m.msp.finish,
          progress: m.msp.pctComplete,
          status: "scheduled",
          boqLineIds: [],
          calloffIds: [],
          dependsOn: [],
          plannedHours: m.msp.workHours,
          notes: `Imported from MSProject · UID ${m.msp.uid} · ${m.msp.resourceNames}`,
        };
        addTask(projectId, newTask);
        created += 1;
      }
    }

    // Ensure MS Project integration is marked as connected so the forecast
    // confidence picks up the baseline bonus.
    if (!mspConn) {
      connectIntegration({
        id: "msp",
        account: currentUser.name,
        apiKey: "msp_mock_********",
        scope: "Programme · baseline tasks · resources",
        frequency: "daily",
        notifyOnError: true,
      });
    }
    syncIntegration("msp");

    toast.success("MSProject import applied", {
      description: `${created} created · ${updated} updated · forecast updated`,
    });
    setStep("done");
  };

  const updateMappingRow = (uid: number, patch: Partial<MspMappingRow>) => {
    setMapping((m) => m.map((r) => (r.msp.uid === uid ? { ...r, ...patch } : r)));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileUp className="mr-1.5 h-3.5 w-3.5" /> Import MSProject
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import MSProject programme</DialogTitle>
          <DialogDescription>
            Mapează task-urile din baseline-ul MSProject la planner-ul Quantix și actualizează automat
            forecast-ul de profitabilitate.
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-[var(--ink-500)]" />
              <p className="mt-3 text-[13px] font-medium text-[var(--ink-700)]">
                Selectează un fișier <code>.mpp</code> sau <code>.xml</code> exportat din MSProject
              </p>
              <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
                Demo: vom simula un baseline tipic de drylining pentru acest proiect.
              </p>
              <Button className="mt-4" onClick={browseFile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Reading baseline…
                  </>
                ) : (
                  <>
                    <FileUp className="mr-1.5 h-3.5 w-3.5" /> Browse mock .mpp
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-[var(--ink-500)]">
              După import, ore-planificate și datele tasks-urilor mapate sunt actualizate, iar cardul „Profit
              forecast" recalculează automat costul de labour și scorul de confidence.
            </p>
          </div>
        )}

        {step === "preview" && bundle && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--ink-50)] px-3 py-2 text-[12px]">
              <div>
                <p className="font-semibold text-[var(--ink-900)]">{bundle.fileName}</p>
                <p className="text-[var(--ink-500)]">{bundle.baselineName} · {bundle.rows.length} task-uri</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--ink-500)]">Default crew:</span>
                <Select
                  value={defaultCrewId ?? resolvedDefaultCrewId ?? "none"}
                  onValueChange={(v) => setDefaultCrewId(v === "none" ? undefined : v)}
                >
                  <SelectTrigger className="h-7 w-[180px] text-[12px]">
                    <SelectValue placeholder="Pick crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {crews.map((c) => (
                      <SelectItem key={c.assignment.memberId} value={c.assignment.memberId}>
                        {c.crewName} · £{c.rate}/h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-h-[340px] overflow-auto rounded-md border border-[var(--ink-200)]">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-[var(--ink-50)] text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                  <tr>
                    <th className="px-3 py-2 text-left">MSP task</th>
                    <th className="px-3 py-2 text-left">Start → finish</th>
                    <th className="px-3 py-2 text-right">Hours</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-200)]">
                  {mapping.map((m) => (
                    <tr key={m.msp.uid} className="hover:bg-[var(--ink-50)]/60">
                      <td className="px-3 py-2">
                        <p className="font-medium text-[var(--ink-900)]">{m.msp.name}</p>
                        <p className="text-[10.5px] text-[var(--ink-500)]">
                          UID {m.msp.uid} · {m.msp.resourceNames}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-[var(--ink-700)]">
                        {m.msp.start} → {m.msp.finish}
                        <span className="ml-1 text-[10.5px] text-[var(--ink-500)]">({m.msp.durationDays}d)</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{m.msp.workHours}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={m.action}
                            onValueChange={(v) => updateMappingRow(m.msp.uid, { action: v as MspMappingRow["action"] })}
                          >
                            <SelectTrigger className="h-7 w-[110px] text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="create">Create new</SelectItem>
                              <SelectItem value="update">Update existing</SelectItem>
                              <SelectItem value="skip">Skip</SelectItem>
                            </SelectContent>
                          </Select>
                          {m.action === "update" && (
                            <Select
                              value={m.matchedTaskId ?? ""}
                              onValueChange={(v) => updateMappingRow(m.msp.uid, { matchedTaskId: v })}
                            >
                              <SelectTrigger className="h-7 max-w-[180px] text-[11px]">
                                <SelectValue placeholder="Pick task…" />
                              </SelectTrigger>
                              <SelectContent>
                                {tasks.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.id} · {t.title.slice(0, 40)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {m.action === "update" && m.matchScore > 0 && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                m.matchScore >= 0.7
                                  ? "bg-[var(--green-600)]/10 text-[var(--green-600)]"
                                  : "bg-[var(--amber-500)]/10 text-[var(--amber-500)]",
                              )}
                              title="Fuzzy match score"
                            >
                              {Math.round(m.matchScore * 100)}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-4 gap-2 rounded-md border border-[var(--ink-200)] p-3 text-[12px]">
              <SummaryStat label="Create" value={summary.created} />
              <SummaryStat label="Update" value={summary.updated} />
              <SummaryStat label="Skip" value={summary.skipped} />
              <SummaryStat
                label="Total work (h)"
                value={summary.totalHours.toLocaleString()}
              />
            </div>
            <p className="text-[11px] text-[var(--ink-500)]">
              Forecast curent: profit{" "}
              <span className="font-mono font-semibold">
                {fmtMoney(forecast.margin.forecastProfit, { compact: true })}
              </span>{" "}
              · margin {forecast.margin.forecastMargin.toFixed(1)}% · confidence {forecast.confidence.score}/100.
              Se actualizează automat după Apply.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-3 py-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--green-600)]" />
            <p className="text-[14px] font-semibold">MSProject baseline aplicat</p>
            <p className="text-[12px] text-[var(--ink-500)]">
              {summary.created} task-uri create · {summary.updated} actualizate · {summary.totalHours.toLocaleString()} ore
              man-hours sincronizate cu planner-ul.
            </p>
            <p className="text-[12px] text-[var(--ink-700)]">
              Forecast nou: profit{" "}
              <span className="font-mono font-semibold">
                {fmtMoney(forecast.margin.forecastProfit, { compact: true })}
              </span>{" "}
              · margin {forecast.margin.forecastMargin.toFixed(1)}% · confidence {forecast.confidence.score}/100.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={() => setStep("select")}>Back</Button>
              <Button onClick={apply} disabled={summary.created + summary.updated === 0}>
                Apply <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => setOpen(false)}>Close</Button>
          )}
          {step === "select" && (
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-[var(--ink-50)] p-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</p>
      <p className="font-mono mt-0.5 text-[16px] font-semibold tabular-nums text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

function levelFromName(name: string): string {
  const m = name.match(/L\s?(\d)/i);
  if (m) return `L${m[1]}`;
  if (/lobby/i.test(name)) return "Lobby";
  return "All";
}