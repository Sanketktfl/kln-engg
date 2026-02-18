import React, { useState, useMemo, useEffect } from "react";

const round2 = (val) => Number.parseFloat(val || 0).toFixed(2);

const PLANT_MAP = {
  2101: "R2",
  7001: "Mundhwa",
  7026: "R1",
  7028: "Baramati"
};

const ANALYSIS_OPTIONS = [
  {
    key: "prod_low_yield",
    label: "High Production · Low Yield",
    icon: "⚙️",
    description: "Dies producing the most with poorest yield efficiency",
    accent: "#f59e0b"
  },
  {
    key: "prod_low_revenue",
    label: "High Production · Low Revenue",
    icon: "📦",
    description: "High-volume dies generating less revenue per run",
    accent: "#ef4444"
  },
  {
    key: "rev_low_yield",
    label: "High Revenue · Low Yield",
    icon: "💹",
    description: "Revenue-generating dies with yield improvement potential",
    accent: "#8b5cf6"
  }
];

const YieldBadge = ({ value }) => {
  const pct = parseFloat(value);
  const color = pct >= 90 ? "#059669" : pct >= 75 ? "#d97706" : "#dc2626";
  return (
    <span style={{
      ...styles.yieldBadge,
      background: color + "18",
      color,
      border: `1px solid ${color}44`
    }}>
      <span style={{ ...styles.yieldDot, background: color }} />
      {round2(pct)}%
    </span>
  );
};

const StatCard = ({ label, value, sub }) => (
  <div style={styles.statCard}>
    <div style={styles.statLabel}>{label}</div>
    <div style={styles.statValue}>{value}</div>
    {sub && <div style={styles.statSub}>{sub}</div>}
  </div>
);

const DieAnalysisPopup = ({ show, onClose }) => {
  const [analysisType, setAnalysisType] = useState(ANALYSIS_OPTIONS[0].key);
  const [dieData, setDieData]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [hoveredRow, setHoveredRow]     = useState(null);

  useEffect(() => {
    if (!show) return;

    // Set default tab
    setAnalysisType(ANALYSIS_OPTIONS[0].key);

    const fetchDieData = async () => {
      try {
        setLoading(true);
        const resp = await fetch("/internal/yield_dashboard_die", {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" }
        });
        const data = await resp.json();
        const formatted = data.map(item => ({
          die_no: item.pre_die_no,
          percent_yield: Number(item.yield_pct || 0),
          tonnage: Number(item.total_tonnage || 0),
          revenue: Number(item.revenue || 0) / 1000000,
          plant_label: PLANT_MAP[item.plant_code] || item.plant_code
        }));
        setDieData(formatted);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDieData();
  }, [show]);

  const analysisResults = useMemo(() => {
    if (!dieData.length) return [];
    switch (analysisType) {
      case "prod_low_yield":
        return [...dieData].sort((a, b) => b.tonnage - a.tonnage).slice(0, 20)
          .sort((a, b) => a.percent_yield - b.percent_yield).slice(0, 5);
      case "prod_low_revenue":
        return [...dieData].sort((a, b) => b.tonnage - a.tonnage).slice(0, 20)
          .sort((a, b) => a.revenue - b.revenue).slice(0, 5);
      case "rev_low_yield":
        return [...dieData].sort((a, b) => b.revenue - a.revenue).slice(0, 20)
          .sort((a, b) => a.percent_yield - b.percent_yield).slice(0, 5);
      default:
        return [];
    }
  }, [analysisType, dieData]);

  const displayData  = analysisType ? analysisResults : dieData.slice(0, 5); // ← changed from 50 to 5
  const activeOption = ANALYSIS_OPTIONS.find(o => o.key === analysisType);

  const summaryStats = useMemo(() => {
    if (!displayData.length) return null;
    const avgYield     = (displayData.reduce((s, d) => s + d.percent_yield, 0) / displayData.length).toFixed(1);
    const totalTonnage = displayData.reduce((s, d) => s + d.tonnage,        0).toFixed(2);
    const totalRevenue = displayData.reduce((s, d) => s + d.revenue,        0).toFixed(2);
    return { avgYield, totalTonnage, totalRevenue };
  }, [displayData]);

  if (!show) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeIn  { from { opacity: 0 }                             to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to   { transform: rotate(360deg) } }
      `}</style>

      <div
        style={styles.overlay}
        onClick={(e) => { if (e.target === e.currentTarget) { setAnalysisType(null); onClose(); } }}
      >
        <div style={styles.popup}>

          {/* ── HEADER ── */}
          <div style={styles.header}>
            <div style={styles.titleGroup}>
              <div style={styles.iconBox}>🔩</div>
              <div>
                <h3 style={styles.title}>Die Performance Analysis</h3>
                <div style={styles.subtitle}>
                  {loading
                    ? "Fetching latest data…"
                    : dieData.length > 0
                    ? `${dieData.length} dies loaded`
                    : "Select an analysis type below"}
                </div>
              </div>
            </div>
            <button
              style={styles.closeBtn}
              onMouseEnter={e => Object.assign(e.currentTarget.style, styles.closeBtnHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, styles.closeBtn)}
              onClick={() => { setAnalysisType(null); onClose(); }}
            >
              ✕ Close
            </button>
          </div>

          <div style={styles.body}>

            {/* ── ANALYSIS OPTION CARDS ── */}
            <div style={styles.analysisGrid}>
              {ANALYSIS_OPTIONS.map((opt) => {
                const isActive = analysisType === opt.key;
                return (
                  <div
                    key={opt.key}
                    style={{
                      ...styles.analysisCard,
                      ...(isActive ? { ...styles.analysisCardActive, borderColor: opt.accent } : {})
                    }}
                    onClick={() => setAnalysisType(isActive ? null : opt.key)}
                    onMouseEnter={e => { if (!isActive) Object.assign(e.currentTarget.style, styles.analysisCardHover); }}
                    onMouseLeave={e => { if (!isActive) Object.assign(e.currentTarget.style, styles.analysisCard); }}
                  >
                    {isActive && <div style={{ ...styles.cardAccentBar, background: opt.accent }} />}
                    {isActive && <div style={{ ...styles.cardCheck,     background: opt.accent }}>✓</div>}
                    <div style={styles.cardIcon}>{opt.icon}</div>
                    <div style={styles.cardLabel}>{opt.label}</div>
                    <div style={styles.cardDesc}>{opt.description}</div>
                  </div>
                );
              })}
            </div>

            {/* ── LOADING STATE ── */}
            {loading && (
              <div style={styles.loadingContainer}>
                <div style={styles.loader} />
                <div style={styles.loadingText}>Fetching die performance data…</div>
              </div>
            )}

            {/* ── DATA LOADED ── */}
            {!loading && dieData.length > 0 && (
              <>
                {summaryStats && (
                  <>
                    <div style={styles.sectionLabel}>
                      <span>{analysisType ? `Results · ${activeOption?.label}` : "Overview"}</span>
                      <span style={styles.recordsChip}>● {displayData.length} records</span>
                      <span style={styles.sectionLine} />
                    </div>
                    <div style={styles.statsRow}>
                      <StatCard label="Avg. Yield"       value={`${summaryStats.avgYield}%`}                               sub="Across shown dies" />
                      <StatCard label="Total Production" value={`${Number(summaryStats.totalTonnage).toLocaleString()} T`}  sub="Combined tonnage"  />
                      <StatCard label="Total Revenue"    value={`₹ ${summaryStats.totalRevenue} M`}                        sub="In millions"       />
                    </div>
                  </>
                )}

                <div style={{ ...styles.sectionLabel, marginTop: "18px" }}>
                  <span>Die Records</span>
                  <span style={styles.sectionLine} />
                </div>

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["#", "Die Number", "Plant", "Yield", "Production (T)", "Revenue"].map((h, i) => (
                          <th key={i} style={{ ...styles.th, textAlign: i >= 4 ? "right" : "left" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.map((die, index) => (
                        <tr
                          key={index}
                          onMouseEnter={() => setHoveredRow(index)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={{ ...styles.td, ...(hoveredRow === index ? styles.tdHover : {}) }}>
                            <span style={{ ...styles.rankBadge, ...(index < 3 && analysisType ? styles.rankBadgeTop : {}) }}>
                              {index + 1}
                            </span>
                          </td>
                          <td style={{ ...styles.td, ...styles.dieNoCell,   ...(hoveredRow === index ? styles.tdHover : {}) }}>{die.die_no}</td>
                          <td style={{ ...styles.td,                         ...(hoveredRow === index ? styles.tdHover : {}) }}>
                            <span style={styles.plantBadge}>{die.plant_label}</span>
                          </td>
                          <td style={{ ...styles.td,                         ...(hoveredRow === index ? styles.tdHover : {}) }}>
                            <YieldBadge value={die.percent_yield} />
                          </td>
                          <td style={{ ...styles.td, ...styles.tonnageCell, textAlign: "right", ...(hoveredRow === index ? styles.tdHover : {}) }}>
                            {Number(round2(die.tonnage)).toLocaleString()} T
                          </td>
                          <td style={{ ...styles.td, ...styles.revenueCell, textAlign: "right", ...(hoveredRow === index ? styles.tdHover : {}) }}>
                            ₹ {round2(die.revenue)} M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── EMPTY STATE ── */}
            {!loading && dieData.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <div>No data available. Check your API connection.</div>
              </div>
            )}

            {/* ── HINT ── */}
            {!loading && dieData.length > 0 && !analysisType && (
              <div style={styles.hint}>↑ Select an analysis card above to filter results</div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default DieAnalysisPopup;


/* =========================== STYLES =========================== */
const styles = {

  /* ── Overlay & Popup ──────────────────────────── */
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    animation: "fadeIn 0.2s ease"
  },

  popup: {
    width: "920px",
    maxHeight: "95vh",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 20px 60px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.9) inset",
    animation: "slideUp 0.25s ease"
  },

  /* ── Header ───────────────────────────────────── */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 28px 18px",
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    flexShrink: 0
  },

  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  iconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
  },

  title: {
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.3px"
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 500,
    marginTop: "1px"
  },

  closeBtn: {
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    padding: "7px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.15s ease"
  },

  closeBtnHover: {
    background: "#ef4444",
    color: "#fff",
    border: "1px solid #ef4444",
    padding: "7px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },

  /* ── Body ─────────────────────────────────────── */
  body: {
    padding: "22px 28px",
    overflowY: "auto",
    flex: 1,
    scrollbarWidth: "thin",
    scrollbarColor: "#e2e8f0 transparent",
    background: "#f8fafc"
  },

  /* ── Analysis Cards ───────────────────────────── */
  analysisGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "22px"
  },

  analysisCard: {
    position: "relative",
    borderRadius: "12px",
    padding: "14px 16px",
    cursor: "pointer",
    border: "1.5px solid #e2e8f0",
    background: "#ffffff",
    transition: "all 0.2s ease",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)"
  },

  analysisCardHover: {
    position: "relative",
    borderRadius: "12px",
    padding: "14px 16px",
    cursor: "pointer",
    border: "1.5px solid #bfdbfe",
    background: "#eff6ff",
    transition: "all 0.2s ease",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(59,130,246,0.12)",
    transform: "translateY(-1px)"
  },

  analysisCardActive: {
    background: "#ffffff",
    boxShadow: "0 4px 16px rgba(15,23,42,0.1)"
  },

  cardAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px"
  },

  cardCheck: {
    position: "absolute",
    top: "10px",
    right: "12px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "#fff",
    fontWeight: 700
  },

  cardIcon: {
    fontSize: "22px",
    marginBottom: "8px"
  },

  cardLabel: {
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "4px"
  },

  cardDesc: {
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.4
  },

  /* ── Section Label ────────────────────────────── */
  sectionLabel: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  sectionLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0",
    display: "inline-block"
  },

  recordsChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    padding: "3px 10px",
    fontSize: "11px",
    color: "#3b82f6",
    fontWeight: 600
  },

  /* ── Stat Cards ───────────────────────────────── */
  statsRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px 18px",
    minWidth: "120px",
    flex: 1,
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)"
  },

  statLabel: {
    color: "#334155",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "5px"
  },

  statValue: {
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: 1
  },

  statSub: {
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "4px"
  },

  /* ── Table ────────────────────────────────────── */
  tableWrapper: {
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'DM Mono', monospace"
  },

  th: {
    background: "#e2e8f0",        // slightly darker background
    color: "#334155",             // darker text for visibility
    fontSize: "12px",             // slightly larger
    fontWeight: 700,              // bolder
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    padding: "12px 14px",         // slightly more padding
    borderBottom: "1.5px solid #cbd5e1"
  },

  td: {
    padding: "11px 14px",
    color: "#334155",
    fontSize: "13px",
    borderBottom: "1px solid #f1f5f9",
    background: "#ffffff"
  },

  tdHover: {
    background: "#f8fafc"
  },

  dieNoCell: {
    color: "#2563eb",
    fontWeight: 600,
    fontSize: "13px"
  },

  plantBadge: {
    display: "inline-block",
    background: "#eff6ff",
    color: "#3b82f6",
    padding: "2px 9px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    border: "1px solid #bfdbfe"
  },

  tonnageCell: {
    color: "#64748b"
  },

  revenueCell: {
    color: "#059669",
    fontWeight: 600
  },

  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    background: "#f1f5f9",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 700
  },

  rankBadgeTop: {
    background: "linear-gradient(135deg, #fbbf24, #d97706)",
    color: "#fff"
  },

  /* ── Yield Badge ──────────────────────────────── */
  yieldBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "2px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    letterSpacing: "0.3px"
  },

  yieldDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block"
  },

  /* ── Loading ──────────────────────────────────── */
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
    gap: "14px"
  },

  loader: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },

  loadingText: {
    color: "#94a3b8",
    fontSize: "14px"
  },

  /* ── Empty State ──────────────────────────────── */
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#cbd5e1",
    fontSize: "14px"
  },

  emptyIcon: {
    fontSize: "28px",
    marginBottom: "10px"
  },

  /* ── Hint ─────────────────────────────────────── */
  hint: {
    textAlign: "center",
    color: "#cbd5e1",
    fontSize: "13px",
    padding: "8px 0 0"
  }

};