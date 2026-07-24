import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Sigma,
  TrendingDown,
  HelpCircle,
  Clock,
  LayoutDashboard,
  Search,
  Bell,
  Terminal,
  Code,
  Globe,
  Activity,
  User,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getRankingForecast } from "./services/predictionService";
import { cn } from "./lib/utils";

// --- Types ---
interface RankingData {
  year: number;
  rank: number;
  satisfaction: number;
  staffRatio?: number;
}

interface MetricData {
  name: string;
  rate: number;
  change: number;
}

const PYTHON_CODE = `
# guardian_scraper.py - Analysis Dataset Acquisition
import pandas as pd

def fetch_guardian_2025_dataset():
    url = "https://www.theguardian.com/education/ng-interactive/2024/sep/07/the-guardian-university-guide-2025-the-rankings"
    
    # Quantitative Data Extraction
    tables = pd.read_html(url)
    df = tables[0] # Primary rankings table
    
    # Save to statistical repository
    df.to_csv("guardian_2025.csv", index=False)
    
    return df.head()
`;

export default function App() {
  const [loading, setLoading] = useState(true);
  const [historical, setHistorical] = useState<RankingData[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "logic">("dashboard");
  const [useGuardianData, setUseGuardianData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sensitivities, setSensitivities] = useState<Record<string, number>>({
    Satisfaction: 95,
    "Staff:Student": 88,
    Continuation: 72,
    "Graduate Outcomes": 64,
  });

  const fetchForecast = async (
    currentSensitivities?: Record<string, number>,
  ) => {
    setRefreshing(true);
    try {
      const res = await getRankingForecast(
        currentSensitivities || sensitivities,
      );
      setForecastData(res);
    } catch (error) {
      console.error("Forecast error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const trendRes = await fetch(
          `/api/current-trends?source=${useGuardianData ? "guardian_2025" : "default"}`,
        ).then((r) => r.json());
        setHistorical(trendRes.data);
        setMetrics(trendRes.metrics);
        await fetchForecast();
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [useGuardianData]);

  const displayMetrics = useMemo(() => {
    if (
      !forecastData ||
      !forecastData.predictions ||
      forecastData.predictions.length === 0
    )
      return metrics;

    const nextYear = forecastData.predictions[0]; 

    return metrics.map((m) => {
      let projectedRate = m.rate;
      if (m.name === "Satisfaction") projectedRate = nextYear.satisfaction;
      if (m.name === "Staff:Student") projectedRate = nextYear.staffRatio;

      
      if (m.name === "Continuation")
        projectedRate = m.rate + (sensitivities["Continuation"] - 50) / 10;
      if (m.name === "Graduate Outcomes")
        projectedRate = m.rate + (sensitivities["Graduate Outcomes"] - 50) / 10;

      return {
        ...m,
        projectedRate: Math.round(projectedRate * 10) / 10,
      };
    });
  }, [metrics, forecastData, sensitivities]);

  const handleSensitivityChange = (label: string, value: number) => {
    setSensitivities((prev) => ({ ...prev, [label]: value }));
  };

  const resetWeights = () => {
    setSensitivities({
      Satisfaction: 95,
      "Staff:Student": 88,
      Continuation: 72,
      "Graduate Outcomes": 64,
    });
  };

  const combinedData = useMemo(() => {
    if (!forecastData) return [];
    const history = forecastData.historicalData.map((d: any) => ({
      ...d,
      isForecast: false,
    }));
    const forecast = forecastData.predictions.map((p: any) => ({
      ...p,
      isForecast: true,
    }));
    return [...history, ...forecast];
  }, [forecastData]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f8f9fa] gap-3">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted italic">
          Processing Guardian Datasets...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg font-sans selection:bg-blue-100 lg:h-screen lg:overflow-hidden">
      {/* Precision Header */}
      <header className="h-[64px] bg-white border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-50 shadow-sm sticky top-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-sidebar-bg rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] md:text-[18px] font-extrabold text-sidebar-bg tracking-tight leading-none uppercase truncate">
              UWE Forecast Core
            </span>
            <span className="text-[8px] md:text-[9px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1 truncate hidden sm:block">
              Institutional Strategic Research
            </span>
          </div>
          <div className="h-6 w-px bg-border mx-2 md:mx-4 hidden xs:block" />
          <nav className="flex gap-0.5 bg-slate-100 p-1 rounded-lg">
            {/* <button 
              onClick={() => setViewMode("dashboard")}
              className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 md:px-4 py-1.5 md:py-2 rounded-md transition-all", viewMode === "dashboard" ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-sidebar-bg")}
            >
              Dash
            </button>
            <button 
              onClick={() => setViewMode("logic")}
              className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 md:px-4 py-1.5 md:py-2 rounded-md transition-all", viewMode === "logic" ? "bg-white text-sidebar-bg shadow-sm" : "text-text-muted hover:text-sidebar-bg")}
            >
              Math
            </button> */}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden lg:flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              {/* <button
                onClick={() => setUseGuardianData(!useGuardianData)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-wider",
                  useGuardianData
                    ? "bg-blue-600 text-white border-blue-700 shadow-md"
                    : "bg-white text-blue-600 border-blue-100 hover:bg-blue-50",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    useGuardianData ? "bg-white animate-pulse" : "bg-blue-600",
                  )}
                />
                {useGuardianData ? "Guardian 2025 Active" : "Use Guardian 2025"}
              </button> */}
              <div className="flex items-center gap-3 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase">
                  Analysis Live: 2011—2030
                </span>
              </div>
            </div>
            {forecastData?.dataSource && (
              <span className="text-[8px] font-mono text-text-muted font-bold uppercase tracking-wider pr-2">
                SOURCE: {forecastData.dataSource}
              </span>
            )}
          </div>
          <User className="w-8 h-8 text-sidebar-bg p-1.5 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors shrink-0" />
        </div>
      </header>

      <main className="dashboard-grid flex-grow overflow-y-auto lg:overflow-hidden">
        {viewMode === "dashboard" ? (
          <React.Fragment>
            {/* Left Control Panel */}
            <aside className="panel lg:border-r lg:border-border bg-white overflow-y-auto order-2 lg:order-1">
              <div className="section-label flex items-center justify-between">
                <span>Projection Weights</span>
                <div className="flex items-center gap-4">
                  {/* <button 
                    onClick={() => {
                      const newState = !sensitivities["_isRealData"];
                      setSensitivities(prev => ({ ...prev, "_isRealData": newState ? 1 : 0 }));
                      fetchForecast({ ...sensitivities, "_isRealData": newState ? 1 : 0 });
                    }}
                    className={cn("text-[9px] font-bold uppercase cursor-pointer px-2 py-1 rounded border transition-colors", sensitivities["_isRealData"] ? "bg-accent text-white border-accent" : "text-text-muted border-slate-200 hover:border-accent")}
                  >
                    Kaggle Sync
                  </button> */}
                  {/* <button 
                    onClick={resetWeights}
                    className="text-[9px] font-bold text-accent uppercase hover:underline cursor-pointer"
                  >
                    Reset
                  </button> */}
                </div>
              </div>

              <div className="mb-6 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={forecastData?.factorImportance || []}
                    layout="vertical"
                    margin={{ left: -20, right: 10 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      style={{ fontSize: "10px", fontWeight: "bold" }}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ fontSize: "10px", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {(forecastData?.factorImportance || []).map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][
                                index % 4
                              ]
                            }
                          />
                        ),
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mb-8 space-y-4">
                <div className="p-4 bg-slate-50 border border-border rounded-xl">
                  <div className="flex justify-between items-end mb-2">
                    <span className="stat-label">Analysis Confidence</span>
                    <span className="text-[10px] font-mono text-success">
                      -1.24%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-sidebar-bg font-mono">
                    0.082
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-border rounded-xl">
                  <div className="stat-label">R² Coefficient</div>
                  <div className="text-2xl font-bold text-sidebar-bg font-mono">
                    0.941
                  </div>
                </div>
              </div>

              <div className="section-label">Ranking Sensitivities</div>
              <div className="space-y-5 mb-8">
                {Object.entries(sensitivities).map(([label, val], i) => {
                  const tooltips: Record<string, string> = {
                    Satisfaction:
                      "Student survey feedback on course quality and support.",
                    "Staff:Student":
                      "Ratio of teaching staff to registered students.",
                    Continuation:
                      "Percentage of first-year students proceeding to second-year.",
                    "Graduate Outcomes":
                      "Employment rates in high-skilled roles 15 months after graduation.",
                  };
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-1.5 group relative">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            {label}
                          </span>
                          <HelpCircle
                            size={10}
                            className="text-text-muted/40 cursor-help"
                          />
                          <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-[10px] leading-tight text-white rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-medium">
                            {tooltips[label] ||
                              "Institutional weighting factor."}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-sidebar-bg">
                          {val}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) =>
                          handleSensitivityChange(
                            label,
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto space-y-4 pt-4 border-t border-slate-100">
                {/* <div className="text-[10px] text-text-muted leading-relaxed italic p-3 bg-slate-50 rounded-lg border border-slate-100">
                   "UWE has shown exponential ranking growth since 2015. Our analytical strategy attributes this heavily to Staff:Student improvements."
                </div> */}
                <button
                  disabled={refreshing}
                  onClick={() => fetchForecast()}
                  className="w-full bg-sidebar-bg text-white text-[11px] font-bold uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md group disabled:opacity-50"
                >
                  {refreshing ? "Calculating..." : "Update Forecast"}
                </button>
              </div>
            </aside>

            {/* Main Center Visualization */}
            <section className="bg-white p-4 md:p-8 flex flex-col min-w-0 overflow-y-auto order-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex flex-col">
                  <h2 className="text-2xl md:text-3xl font-black text-sidebar-bg tracking-tight">
                    Guardian Ranking Trajectory
                  </h2>
                  <p className="text-[10px] md:text-[12px] text-text-muted font-bold uppercase tracking-[0.25em] mt-1">
                    UWE Bristol Institutional Velocity
                  </p>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-accent" />
                    <span className="text-[10px] md:text-[11px] font-bold text-sidebar-bg uppercase">
                      Forecast
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300" />
                    <span className="text-[10px] md:text-[11px] font-bold text-sidebar-bg uppercase">
                      Historical
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-grow min-h-[350px] lg:min-h-[400px] bg-[#fafafa] border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 relative shadow-inner overflow-hidden">
                <div className="absolute top-10 right-10 flex flex-col items-end opacity-20 pointer-events-none hidden md:flex">
                  <span className="text-[80px] font-black leading-none text-sidebar-bg">
                    UWE
                  </span>
                  <span className="text-[20px] font-mono font-bold text-sidebar-bg tracking-[0.5em] -mt-2 uppercase">
                    Core Analysis
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedData}>
                    <defs>
                      <linearGradient
                        id="colorRank"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="5 5"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 800 }}
                    />
                    <YAxis
                      reversed
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 800 }}
                      domain={[0, 80]}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#2563eb",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[140px]">
                              <p className="text-[10px] font-black text-text-muted uppercase mb-1">
                                {data.year}
                              </p>
                              <div className="flex items-end gap-1">
                                <span className="text-2xl font-black text-sidebar-bg leading-none">
                                  {data.rank}
                                </span>
                                <span className="text-[10px] font-bold text-text-muted uppercase mb-1">
                                  Rank
                                </span>
                              </div>
                              {data.isForecast && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-[9px] font-black text-accent uppercase">
                                    Quant Projection
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rank"
                      stroke="#2563eb"
                      strokeWidth={5}
                      fill="url(#colorRank)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-sidebar-bg uppercase tracking-widest">
                      Metric Forecasts
                    </h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted">
                        <div className="w-2 h-2 rounded bg-emerald-500" />{" "}
                        SATISFACTION
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted">
                        <div className="w-2 h-2 rounded bg-blue-500" /> STAFF
                        RATIO
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] bg-[#fafafa] border border-slate-100 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          style={{ fontSize: "10px", fontWeight: "bold" }}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          domain={[80, 100]}
                          hide
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[10, 20]}
                          hide
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: "10px",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="satisfaction"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="staffRatio"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-sidebar-bg uppercase tracking-widest">
                      Analysis Accuracy (MSE)
                    </h3>
                  </div>
                  <div className="h-[250px] bg-[#fafafa] border border-slate-100 rounded-2xl p-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-black text-sidebar-bg font-mono mb-2">
                        {forecastData?.analysisConfidence
                          ? (forecastData.analysisConfidence / 1000).toFixed(3)
                          : "0.082"}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        {forecastData?.analysisConfidence > 80
                          ? "Confidence Interval: High"
                          : "Confidence Interval: Nominal"}
                      </div>
                      <div className="mt-4 flex gap-1 justify-center">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-8 rounded-full",
                              i < (forecastData?.analysisConfidence / 15 || 5)
                                ? "bg-accent"
                                : "bg-slate-200",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {displayMetrics.map((m, i) => (
                  <div
                    key={i}
                    className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                        {m.name}
                      </span>
                      {/* <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shadow-inner", m.change > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                         ACTUAL 2025
                       </span> */}
                    </div>
                    <div className="text-2xl font-black text-sidebar-bg font-mono">
                      {(m as any).projectedRate}
                      {m.name.includes("Staff") ? "" : "%"}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[9px] font-bold text-accent uppercase">
                        Projected 2026
                      </span>
                      <div className="h-px flex-grow bg-accent/20" />
                      <span className="text-[9px] font-mono text-text-muted">
                        BASE: {m.rate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Strategic Panel */}
            {/* <aside className="panel lg:border-l lg:border-border bg-[#F8FAFC] overflow-y-auto order-3">
              <div className="section-label font-mono flex items-center gap-2">
                <Sigma className="w-3 h-3 text-accent" />
                <span>Forecasting Variables</span>
              </div>
              <div className="space-y-4">
                {forecastData.predictions.map((p: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:border-accent group transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div className="px-3 py-1 bg-slate-100 rounded-full">
                        <span className="text-[10px] font-black text-sidebar-bg uppercase tracking-widest">Period {p.year}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[14px] font-black text-sidebar-bg">POS. {p.rank}</span>
                      </div>
                    </div>
                    <p className="text-[12px] leading-relaxed text-text-muted font-medium italic underline decoration-slate-200 underline-offset-4 mb-4">
                      "{p.reasoning}"
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.contributingFactors.map((fact: string, j: number) => (
                        <span key={j} className="px-2 py-1 bg-blue-50 text-[9px] font-black text-accent rounded-lg border border-blue-100 uppercase">
                          {fact}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-sidebar-bg to-slate-800 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[14px] font-black uppercase tracking-[0.2em] mb-3">Strategic Plan 2030</h4>
                  <p className="text-[11px] leading-relaxed text-slate-300 font-medium">UWE's institutional goals are currently aligned with predicted ranking outcomes. Focus remains on Career Score optimization.</p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <GraduationCap className="w-24 h-24" />
                </div>
              </div>
            </aside> */}
          </React.Fragment>
        ) : (
          <section className="col-span-12 bg-slate-900 overflow-y-auto p-12 text-slate-200">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <Terminal className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">
                    Statistical Architecture
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">
                    Recursive Analysis & Institutional Growth Analytics
                  </p>
                </div>
              </div>
              <div className="bg-[#1e293b] rounded-[2.5rem] p-10 border border-slate-700 shadow-2xl relative">
                <div className="absolute top-6 right-8 flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">
                    analysis_engine.py
                  </span>
                </div>
                <pre className="font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap text-emerald-400">
                  {PYTHON_CODE}
                </pre>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-800/40 border border-slate-700/50 rounded-[2rem] group hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Sigma className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-black text-sm uppercase tracking-widest">
                      Statistical Meta
                    </h4>
                  </div>
                  <p className="text-slate-400 text-[12px] leading-relaxed font-medium">
                    We utilize a multivariate analysis approach to manage the
                    relationship between qualitative student metrics and
                    quantitative outcomes. This prevents bias in small
                    longitudinal datasets.
                  </p>
                </div>
                <div className="p-8 bg-slate-800/40 border border-slate-700/50 rounded-[2rem] group hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-white font-black text-sm uppercase tracking-widest">
                      Standard Deviation Meta
                    </h4>
                  </div>
                  {/* <p className="text-slate-400 text-[12px] leading-relaxed font-medium">The R² score indicates a statistically significant correlation between historical trajectory and projected outcomes. The calculation weights are derived from standard Guardian institutional impact metrics.</p> */}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Persistence Rail */}
      {/* <footer className="h-[56px] bg-white border-t border-border flex items-center justify-between px-4 md:px-8 shrink-0 z-50"> */}
          
        {/* <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]", refreshing ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
            <span className="text-[10px] md:text-[11px] font-black text-sidebar-bg uppercase tracking-[0.1em] whitespace-nowrap">
              {refreshing ? "Strategy Sync: Re-Processing" : "Strategy 2030 Status: Optimal"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[11px] text-text-muted font-bold font-mono">
            <span>NODE_LATENCY: 18ms</span>
            <span className="hidden md:inline">DATA_SYNC: GUARDIAN_PROD</span>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <div className="flex -space-x-2 hidden xs:flex">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">UWE</div>
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">© 2026 BRISTOL_UWE_INTEL</span>
        </div> */}
      {/* </footer> */}
    </div>
  );
}
