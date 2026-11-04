import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  CalendarDays,
  Clock3,
  Briefcase,
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDeals } from "../hooks/useDeals";
import { useTeam } from "../hooks/useTeam";
import {
  useActivities,
  useAddActivity,
  useUpdateActivity,
} from "../hooks/useActivities";
import { useCommandCenterStats } from "../hooks/useCommandCenterStats";
import { useAuth } from "../hooks/useAuth";
import { useMyProfile } from "../hooks/useUserProfiles";
import { useSubscription } from "../hooks/useSubscription";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../components/ui/Dialog";
import QuickWinModal from "../components/pipeline/QuickWinModal";
import SafeResponsiveContainer from "../components/charts/SafeResponsiveContainer";
import { formatCurrency, formatThaiDate } from "../lib/formatters";
import { STAGE_LABELS } from "../lib/constants";
import { cn } from "../lib/utils";

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useMyProfile(user?.id);
  const dealsQuery = useDeals();
  const teamQuery = useTeam();
  const activitiesQuery = useActivities();
  const deals = useMemo(() => dealsQuery.data || [], [dealsQuery.data]);
  const team = useMemo(() => teamQuery.data || [], [teamQuery.data]);
  const activities = useMemo(
    () => activitiesQuery.data || [],
    [activitiesQuery.data],
  );
  const { setPendingOpenDeal, openPaywall, monthlyTarget } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  const addActivity = useAddActivity();
  const updateActivity = useUpdateActivity();
  const [scope, setScope] = useState("team");
  const [taskFilter, setTaskFilter] = useState("today");
  const [taskDialog, setTaskDialog] = useState(false);
  const [quickWin, setQuickWin] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeal, setTaskDeal] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskLimit, setTaskLimit] = useState(8);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const personalTarget = Number(profile?.personal_target || 0);
  const teamTarget =
    team.reduce((sum, member) => sum + Number(member.goal || 0), 0) ||
    monthlyTarget;
  const allStats = useCommandCenterStats(
    deals,
    teamTarget,
    user?.id,
    personalTarget,
  );
  const stats =
    scope === "mine" && allStats?.myStats ? allStats.myStats : allStats;
  const goal = scope === "mine" ? personalTarget : teamTarget;
  const visibleDeals = useMemo(
    () =>
      scope === "mine"
        ? deals.filter((deal) => deal.assigned_to === user?.id)
        : deals,
    [scope, deals, user?.id],
  );
  const dealMap = useMemo(
    () => new Map(visibleDeals.map((deal) => [deal.id, deal])),
    [visibleDeals],
  );
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const relevantTasks = activities.filter(
    (task) =>
      task.scheduled_at && (scope === "team" || dealMap.has(task.deal_id)),
  );
  const dueTasks = relevantTasks.filter(
    (task) =>
      !task.completed_at &&
      new Date(task.scheduled_at).getTime() <= endOfToday.getTime(),
  );
  const tasks = relevantTasks
    .filter((task) =>
      taskFilter === "done"
        ? Boolean(task.completed_at)
        : !task.completed_at &&
          (taskFilter === "today"
            ? new Date(task.scheduled_at).getTime() <= endOfToday.getTime()
            : new Date(task.scheduled_at).getTime() > endOfToday.getTime()),
    )
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const hotDeals = stats?.hotDeals || [];
  const renewals = stats?.renewalDeals || [];
  const openDeal = (deal) => {
    setPendingOpenDeal(deal);
    navigate("/pipeline");
  };
  const guardAction = (action) =>
    shouldBlockBasic
      ? openPaywall(isGuestAccount ? "default" : "trial_ended")
      : action();
  const openTaskDialog = () =>
    guardAction(() => {
      setTaskTitle("");
      setTaskDeal("");
      setTaskError("");
      setTaskDate(
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16),
      );
      setTaskDialog(true);
    });
  const saveTask = async (event) => {
    event.preventDefault();
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? "default" : "trial_ended");
      return;
    }
    if (addActivity.isPending) return;
    const scheduledAt = new Date(taskDate);
    if (!taskTitle.trim() || !Number.isFinite(scheduledAt.getTime())) {
      setTaskError("กรุณากรอกชื่องานและวันเวลาที่ถูกต้อง");
      return;
    }
    try {
      setTaskError("");
      await addActivity.mutateAsync({
        type: "task",
        title: taskTitle.trim(),
        deal_id: taskDeal || null,
        scheduled_at: scheduledAt.toISOString(),
      });
      setTaskDialog(false);
      setTaskFilter("today");
    } catch (error) {
      console.error("Unable to create follow-up task", error);
      setTaskError(error.message || "บันทึกงานไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  if (dealsQuery.isLoading || teamQuery.isLoading)
    return (
      <div className="nova-loading">
        <Loader2 className="animate-spin" />
        กำลังเตรียมพื้นที่ทำงาน
      </div>
    );
  if (dealsQuery.isError || teamQuery.isError)
    return (
      <section className="nova-panel nova-empty">
        <h1>โหลดภาพรวมไม่สำเร็จ</h1>
        <p>ลองโหลดข้อมูลอีกครั้ง</p>
        <Button
          onClick={() => {
            dealsQuery.refetch();
            teamQuery.refetch();
          }}
        >
          ลองอีกครั้ง
        </Button>
      </section>
    );

  return (
    <div className="nova-dashboard">
      <header className="nova-dashboard-heading">
        <div>
          <p className="nova-eyebrow">YOUR SALES WORKSPACE</p>
          <h1>
            เริ่มวันใหม่ ให้ทุกดีลเดินหน้า
            <span className="nova-heading-dot">.</span>
          </h1>
          <p>
            สวัสดี{profile?.full_name ? ", " + profile.full_name : ""} ·{" "}
            {new Date(now).toLocaleDateString("th-TH", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="nova-heading-actions">
          <div className="nova-segment">
            <button
              aria-pressed={scope === "team"}
              onClick={() => setScope("team")}
            >
              ภาพรวมทีม
            </button>
            <button
              disabled={!user?.id}
              aria-pressed={scope === "mine"}
              onClick={() => setScope("mine")}
            >
              ของฉัน
            </button>
          </div>
          <Button onClick={() => guardAction(() => setQuickWin(true))}>
            <Plus size={16} className="mr-2" />
            บันทึกยอดขาย
          </Button>
        </div>
      </header>

      <div className="nova-overview-grid">
        <section className="nova-revenue-hero">
          <div className="nova-hero-top">
            <span className="nova-eyebrow">MONTHLY REVENUE</span>
            <span>
              {new Date(now).toLocaleDateString("th-TH", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="nova-hero-value">
            {formatCurrency(stats?.totalWonValue || 0)}
          </p>
          <p>ยอดขายที่ปิดสำเร็จในเดือนนี้</p>
          <div className="nova-goal">
            <div>
              <span>
                เป้าหมาย {goal > 0 ? formatCurrency(goal) : "ยังไม่ได้กำหนด"}
              </span>
              <b>
                {goal > 0
                  ? Math.round(stats?.achievementPercent || 0) + "%"
                  : "—"}
              </b>
            </div>
            <div className="nova-progress">
              <i
                style={{
                  width:
                    Math.min(100, Math.max(0, stats?.achievementPercent || 0)) +
                    "%",
                }}
              />
            </div>
          </div>
          <button className="nova-hero-link" onClick={() => navigate("/sales")}>
            เปิดรายงานยอดขาย <ArrowUpRight size={16} />
          </button>
        </section>
        <div className="nova-metric-grid">
          {[
            {
              label: "มูลค่าดีลที่เปิดอยู่",
              value: formatCurrency(stats?.totalPipelineValue || 0),
              detail: (stats?.activeCount || 0) + " ดีลใน Pipeline",
              icon: Briefcase,
            },
            {
              label: "อัตราปิดการขาย",
              value: (stats?.winRate || 0) + "%",
              detail: "จากดีลที่ปิดแล้วทั้งหมด",
              icon: TrendingUp,
            },
            {
              label: "งานที่ต้องติดตาม",
              value: dueTasks.length,
              detail: "รวมงานค้างก่อนวันนี้",
              icon: Clock3,
            },
            {
              label: "ดีลรอต่ออายุ",
              value: renewals.length,
              detail: "ภายใน 90 วันข้างหน้า",
              icon: CalendarDays,
            },
          ].map(({ label, value, detail, icon: Icon }) => (
            <section className="nova-metric" key={label}>
              <div>
                <span>{label}</span>
                <Icon size={18} />
              </div>
              <strong>{value}</strong>
              <p>{detail}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="nova-work-grid">
        <section className="nova-panel nova-tasks">
          <div className="nova-section-heading">
            <div>
              <p className="nova-eyebrow">DAILY FOCUS</p>
              <h2>สิ่งที่ต้องทำต่อ</h2>
            </div>
            <button className="nova-text-action" onClick={openTaskDialog}>
              <Plus size={16} />
              เพิ่มงาน
            </button>
          </div>
          <div className="nova-task-tabs">
            {[
              {
                id: "today",
                label: "วันนี้และงานค้าง",
                count: dueTasks.length,
              },
              { id: "upcoming", label: "กำลังจะมาถึง" },
              { id: "done", label: "เสร็จแล้ว" },
            ].map((filter) => (
              <button
                key={filter.id}
                aria-pressed={taskFilter === filter.id}
                onClick={() => setTaskFilter(filter.id)}
              >
                {filter.label}
                {filter.count !== undefined && <span>{filter.count}</span>}
              </button>
            ))}
          </div>
          {activitiesQuery.isLoading ? (
            <p className="nova-empty">กำลังโหลดงาน</p>
          ) : activitiesQuery.isError ? (
            <div className="nova-empty">
              <p>โหลดรายการงานไม่สำเร็จ</p>
              <Button
                variant="outline"
                onClick={() => activitiesQuery.refetch()}
              >
                ลองอีกครั้ง
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="nova-empty">
              <CheckCircle2 size={30} />
              <h3>
                {taskFilter === "done"
                  ? "ยังไม่มีงานที่ทำเสร็จ"
                  : "พร้อมสำหรับก้าวถัดไป"}
              </h3>
              <p>เพิ่มงานติดตามเพื่อให้โอกาสการขายเดินหน้าต่อ</p>
              <Button variant="outline" size="sm" onClick={openTaskDialog}>
                เพิ่มงานติดตาม
              </Button>
            </div>
          ) : (
            <div className="nova-task-list">
              {tasks.slice(0, taskLimit).map((task) => (
                <div className="nova-task-row" key={task.id}>
                  <button
                    className={cn(
                      "nova-task-check",
                      task.completed_at && "is-complete",
                    )}
                    aria-label={
                      (task.completed_at ? "เปิดงานอีกครั้ง " : "ทำงานเสร็จ ") +
                      task.title
                    }
                    disabled={updateActivity.isPending}
                    onClick={() =>
                      guardAction(() =>
                        updateActivity.mutate({
                          id: task.id,
                          updates: {
                            completed_at: task.completed_at
                              ? null
                              : new Date().toISOString(),
                          },
                        }),
                      )
                    }
                  >
                    {task.completed_at && <Check size={13} />}
                  </button>
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {dealMap.get(task.deal_id)?.company || "งานติดตามทั่วไป"}{" "}
                      · {formatThaiDate(task.scheduled_at)}
                    </p>
                  </div>
                  {dealMap.has(task.deal_id) && (
                    <button
                      className="nova-icon-action"
                      aria-label={"เปิดดีลของงาน " + task.title}
                      onClick={() => openDeal(dealMap.get(task.deal_id))}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {tasks.length > taskLimit && (
            <button
              className="nova-text-action nova-list-more"
              onClick={() => setTaskLimit((limit) => limit + 8)}
            >
              แสดงอีก {Math.min(8, tasks.length - taskLimit)} งาน
            </button>
          )}
        </section>
        <section className="nova-panel nova-deals">
          <div className="nova-section-heading">
            <div>
              <p className="nova-eyebrow">OPPORTUNITIES</p>
              <h2>ดีลที่ควรโฟกัส</h2>
            </div>
            <button
              className="nova-text-action"
              onClick={() => navigate("/pipeline")}
            >
              ดูทั้งหมด <ArrowRight size={16} />
            </button>
          </div>
          <div className="nova-deal-table">
            <table>
              <thead>
                <tr>
                  <th>ดีล / ลูกค้า</th>
                  <th>ขั้นตอน</th>
                  <th className="text-right">มูลค่า</th>
                  <th>
                    <span className="sr-only">เปิดดีล</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {hotDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <button
                        className="nova-deal-name"
                        onClick={() => openDeal(deal)}
                      >
                        {deal.title || deal.company || "ไม่ระบุชื่อดีล"}
                      </button>
                      <p>{deal.company}</p>
                    </td>
                    <td>
                      <span className="nova-stage-label">
                        {STAGE_LABELS[deal.stage] || deal.stage}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {formatCurrency(deal.value)}
                    </td>
                    <td>
                      <button
                        className="nova-icon-action"
                        aria-label={"เปิดดีล " + deal.title}
                        onClick={() => openDeal(deal)}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!hotDeals.length && (
            <div className="nova-empty">
              <Briefcase size={28} />
              <h3>เริ่มสร้างโอกาสการขาย</h3>
              <p>เพิ่มดีลแรกเพื่อเริ่มติดตามมูลค่าและความคืบหน้า</p>
              <Button onClick={() => navigate("/pipeline")}>
                ไปที่ Pipeline
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="nova-bottom-grid">
        <section className="nova-panel">
          <div className="nova-section-heading">
            <div>
              <p className="nova-eyebrow">REVENUE TREND</p>
              <h2>เส้นทางยอดขาย 6 เดือน</h2>
            </div>
            <span className="nova-chart-key">
              <i />
              ยอดขายจริง
            </span>
          </div>
          <div className="nova-revenue-chart">
            <SafeResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats?.revenueStream || []}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="novaRevenueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="var(--workspace-border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--workspace-secondary)", fontSize: 11 }}
                />
                <YAxis
                  width={65}
                  tickFormatter={formatCurrency}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--workspace-secondary)", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: "var(--workspace-surface)",
                    border: "1px solid var(--workspace-border)",
                    borderRadius: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="ยอดขายจริง"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="url(#novaRevenueFill)"
                  animationDuration={400}
                />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </section>
        <section className="nova-panel">
          <div className="nova-section-heading">
            <div>
              <p className="nova-eyebrow">WORKSPACE SHORTCUTS</p>
              <h2>พร้อมทำงานต่อ</h2>
            </div>
          </div>
          {[
            {
              title: "ดูแลความสัมพันธ์ลูกค้า",
              detail: "ประวัติการติดต่อและสุขภาพบัญชี",
              path: "/customers",
              icon: Users,
            },
            {
              title: "ดูผลลัพธ์และแนวโน้ม",
              detail: "ยอดขาย ทีมงาน และคาดการณ์",
              path: "/analytics",
              icon: TrendingUp,
            },
            {
              title: "ตั้งเป้าหมายให้ทีม",
              detail: "เป้ารายเดือนและสมาชิกทีมขาย",
              path: "/settings",
              icon: Target,
            },
          ].map(({ title, detail, path, icon: Icon }) => (
            <button
              className="nova-shortcut"
              key={path}
              onClick={() => navigate(path)}
            >
              <span className="nova-shortcut-icon">
                <Icon size={19} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </section>
      </div>

      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="p-6">
          <DialogTitle>เพิ่มงานติดตาม</DialogTitle>
          <DialogDescription>
            ระบุสิ่งที่ต้องทำและกำหนดเวลา เพื่อจัดลำดับงานของคุณ
          </DialogDescription>
          <form onSubmit={saveTask} className="mt-5 space-y-4">
            <Input
              label="ชื่องาน"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              required
              maxLength={200}
              autoFocus
            />
            <Input
              label="วันและเวลา"
              type="datetime-local"
              value={taskDate}
              onChange={(event) => setTaskDate(event.target.value)}
              required
            />
            <label className="block text-sm font-medium">
              เชื่อมกับดีล
              <select
                className="nova-form-select mt-2"
                value={taskDeal}
                onChange={(event) => setTaskDeal(event.target.value)}
              >
                <option value="">งานทั่วไป</option>
                {visibleDeals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title || deal.company}
                  </option>
                ))}
              </select>
            </label>
            {taskError && (
              <p role="alert" className="text-sm text-red-600">
                {taskError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaskDialog(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={addActivity.isPending}>
                {addActivity.isPending ? "กำลังบันทึก…" : "บันทึกงาน"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <QuickWinModal open={quickWin} onOpenChange={setQuickWin} />
    </div>
  );
}
