import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const ComparisonPopup = ({ show, onClose }) => {

  const [comparisonType, setComparisonType] = useState("plan_actual");
  const [periodType, setPeriodType] = useState("month");
  const today = new Date();
  const calYear = today.getFullYear();
  const calMonth = today.getMonth() + 1;
  const fyYear = calMonth >= 4 ? calYear : calYear - 1;
  const [year, setYear] = useState(fyYear);
  const [month, setMonth] = useState(String(calMonth).padStart(2, "0"));
  const [quarter, setQuarter] = useState("Q1");
  const [dieLeft, setDieLeft] = useState("");
  const [dieRight, setDieRight] = useState("");
  const [leftData, setLeftData] = useState([]);
  const [rightData, setRightData] = useState([]);
  const [familyLeft, setFamilyLeft] = useState("");
  const [familyRight, setFamilyRight] = useState("");
  const [familyLeftData, setFamilyLeftData] = useState([]);
  const [familyRightData, setFamilyRightData] = useState([]);
  const [targetData, setTargetData] = useState([]);


  const fetchDieData = async (dieNo, setData) => {
    let url = `http://localhost:8080/internal/yield_comp_die?die_no=${dieNo}&period_type=${periodType}&year=${year}`;
    if (periodType === "month") url += `&month=${month}`;
    if (periodType === "quarter") url += `&quarter=${quarter}`;
    const resp = await fetch(url);
    setData(await resp.json());
  };

  const fetchFamilyData = async (family, setData) => {
    let url = `http://localhost:8080/internal/yield_comp_family?family=${family}&period_type=${periodType}&year=${year}`;
    if (periodType === "month") url += `&month=${month}`;
    if (periodType === "quarter") url += `&quarter=${quarter}`;
    const resp = await fetch(url);
    setData(await resp.json());
  };

  const fetchTargetData = async () => {
    let url = `http://localhost:8080/internal/yield_comp_target?period_type=${periodType}`;
    const resp = await fetch(url);
    const data = await resp.json();
    setTargetData(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (comparisonType === "plan_actual") {
      fetchTargetData();
    }
  }, [comparisonType, periodType]);

  const safeTargetArray = Array.isArray(targetData) ? targetData : [];

  const allYields = safeTargetArray.flatMap(d => [
    Number(d.yield_target || 0),
    Number(d.yield_pct || 0),
  ]);

  const maxY = allYields.length ? Math.max(...allYields) : 100;

  // Dynamic padding (10% of max, minimum 2)
  const padding = maxY * 0.1 || 2;

  const yMin = 0;
  const yMax = maxY + padding;


  if (!show) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.content}>

        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}>📊</div>
            <h2 style={styles.title}>Yield Comparison</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
        </div>

        <div style={styles.filterRow}>
          {/* LEFT: Comparison Type */}
          <div style={styles.filterLeft}>
            <label style={styles.label}>Comparison Type</label>
            <select
              style={styles.select}
              value={comparisonType}
              onChange={e => setComparisonType(e.target.value)}
            >
              <option value="die">Die-wise Analysis</option>
              <option value="family">Family-wise Analysis</option>
              <option value="plan_actual">Target vs Actual</option>
            </select>
          </div>

          {/* RIGHT: Other Filters */}
          <div style={styles.filterRight}>
            <span style={styles.labelText}>Time Period</span>
            <select
              style={styles.selectSmall}
              value={periodType}
              onChange={e => setPeriodType(e.target.value)}
            >
              <option value="year">Financial Year</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </select>
            {comparisonType !== "plan_actual" && (
              <>
                <select
                  style={styles.selectSmall}
                  value={year}
                  onChange={e => setYear(e.target.value)}
                >
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}-{y + 1}</option>
                  ))}
                </select>
                {periodType === "month" && (
                  <select
                    style={styles.selectSmall}
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                  >
                    {["04","05","06","07","08","09","10","11","12","01","02","03"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
                {periodType === "quarter" && (
                  <select
                    style={styles.selectSmall}
                    value={quarter}
                    onChange={e => setQuarter(e.target.value)}
                  >
                    <option value="Q1">Q1 (Apr–Jun)</option>
                    <option value="Q2">Q2 (Jul–Sep)</option>
                    <option value="Q3">Q3 (Oct–Dec)</option>
                    <option value="Q4">Q4 (Jan–Mar)</option>
                  </select>
                )}
              </>
            )}
          </div>
        </div>

        {/* MAIN BODY (takes remaining height) */}
        <div style={styles.comparisonBody}>
          {comparisonType === "die" && (
            <div style={styles.splitVertical}>
              <ComparePanel title="Die A" color="#3b82f6" value={dieLeft} setValue={setDieLeft}
                data={leftData} onCompare={() => fetchDieData(dieLeft, setLeftData)} mode="die" />
              <ComparePanel title="Die B" color="#8b5cf6" value={dieRight} setValue={setDieRight}
                data={rightData} onCompare={() => fetchDieData(dieRight, setRightData)} mode="die" />
            </div>
          )}

          {comparisonType === "family" && (
            <div style={styles.splitVertical}>
              <ComparePanel title="Family A" color="#16a34a" value={familyLeft} setValue={setFamilyLeft}
                data={familyLeftData} onCompare={() => fetchFamilyData(familyLeft, setFamilyLeftData)} mode="family" />
              <ComparePanel title="Family B" color="#0ea5e9" value={familyRight} setValue={setFamilyRight}
                data={familyRightData} onCompare={() => fetchFamilyData(familyRight, setFamilyRightData)} mode="family" />
            </div>
          )}

          {comparisonType === "plan_actual" && (
            <div style={styles.planActualContainer}>
              <div style={styles.planActualHeader}>
                <div>
                  <h3 style={styles.planActualTitle}>Target vs Actual Yield Performance</h3>
                  <p style={styles.planActualSubtitle}>Plant-wise comparison of planned targets against actual yields</p>
                </div>
                <div style={styles.statsCards}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Avg Target</div>
                    <div style={styles.statValue}>
                      {targetData.length > 0 ? (targetData.reduce((sum, d) => sum + (d.yield_target || 0), 0) / targetData.length).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Avg Actual</div>
                    <div style={styles.statValue}>
                      {targetData.length > 0 ? (targetData.reduce((sum, d) => sum + (d.yield_pct || 0), 0) / targetData.length).toFixed(1) : '0'}%
                    </div>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={targetData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }} barGap={8}>
                  <defs>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="plant_code"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    stroke="#cbd5e1"
                    strokeWidth={2}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    tickFormatter={(value) => value.toFixed(2)}
                    label={{
                      value: 'Yield Percentage (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#475569', fontWeight: 600 }
                    }}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    stroke="#cbd5e1"
                    strokeWidth={2}
                  />


                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.98)',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: 14 }}
                    itemStyle={{ padding: '4px 0', fontSize: 13, fontWeight: 600 }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={36}
                    content={() => (
                      <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 14, height: 14, background: "#4f46e5", borderRadius: 3 }} />
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#334155" }}>Target Yield %</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 14, height: 14, background: "#059669", borderRadius: 3 }} />
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#334155" }}>Actual Yield %</span>
                        </div>
                      </div>
                    )}
                  />
                  <Bar
                    dataKey="yield_target"
                    name="Target Yield %"
                    fill="url(#targetGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar
                    dataKey="yield_pct"
                    name="Actual Yield %"
                    fill="url(#actualGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ComparePanel = ({ title, color, value, setValue, data, onCompare, mode }) => (
  <div style={{...styles.comparePanel, borderTop: `4px solid ${color}`}}>
    <div style={styles.panelHeader}>
      <h4 style={{...styles.panelTitle, color}}>{title}</h4>
      <div style={styles.dieInputGroup}>
        <input
          placeholder={`Enter ${mode === "die" ? "Die" : "Family"}`}
          value={value}
          onChange={e => setValue(e.target.value)}
          style={styles.input}
        />
        <button style={{...styles.compareBtn, background: color}} onClick={onCompare}>Compare</button>
      </div>
    </div>
    <Table data={data} color={color} mode={mode} />
  </div>
);

const Table = ({ data, color, mode }) => (
  <div style={styles.tableContainer}>
    <table style={styles.table}>
      <thead>
        <tr style={{ background: `${color}20` }}>
          {mode === "die" ? (
            <>
              <th style={styles.th}>Die</th>
              <th style={styles.th}>Family</th>
            </>
          ) : (
            <>
              <th style={styles.th}>Family</th>
              <th style={styles.th}>Plant</th>
            </>
          )}
          <th style={{ ...styles.th, textAlign: "right" }}>Yield %</th>
          <th style={{ ...styles.th, textAlign: "right" }}>Tonnage</th>
          <th style={{ ...styles.th, textAlign: "right" }}>Orders</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} style={styles.tr}>
            {mode === "die" ? (
              <>
                <td style={styles.td}>{r.pre_die_no}</td>
                <td style={styles.td}>{r.family}</td>
              </>
            ) : (
              <>
                <td style={styles.td}>{r.family}</td>
                <td style={styles.td}>{r.plant_code}</td>
              </>
            )}
            <td style={{ ...styles.td, textAlign: "right" }}>{r.yield_pct?.toFixed(2)}</td>
            <td style={{ ...styles.td, textAlign: "right" }}>{r.total_tonnage?.toFixed(2)}</td>
            <td style={{ ...styles.td, textAlign: "right" }}>{r.total_order_qty}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


export default ComparisonPopup;

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(88,28,135,0.75))",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(8px)",
    zIndex: 9999
  },
  content: {
    width: "1400px",
    height: "720px",
    background: "linear-gradient(135deg, #ffffff, #f8fafc)",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 30px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.8)",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "16px",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "16px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  iconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    boxShadow: "0 4px 12px rgba(59,130,246,0.4)"
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #1e293b, #475569)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  closeBtn: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  filterSection: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
    minWidth: "120px"
  },
  select: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    background: "white",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    cursor: "pointer",
    outline: "none",
    minWidth: "220px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    transition: "all 0.2s"
  },
  toolbar: {
    background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
    padding: "16px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "inset 0 2px 6px rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.2)",
    marginBottom: "16px"
  },
  labelText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e40af"
  },
  selectSmall: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "white",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  splitVertical: {
    display: "flex",
    flex: 1,
    gap: "20px",
    overflow: "hidden"
  },
  comparePanel: {
    flex: 1,
    background: "white",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e2e8f0",
    minHeight: 0,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #f1f5f9"
  },
  panelTitle: {
    margin: 0,
    fontSize: "20px",       // was 18
    fontWeight: "700"
  },
  dieInputGroup: {
    display: "flex",
    gap: "8px"
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "14.5px",     // was 13
    outline: "none",
    transition: "all 0.2s",
    fontWeight: "500"
  },
  compareBtn: {
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14.5px",     // was 13
    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
    transition: "all 0.2s"
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
    borderRadius: "10px",
    border: "1px solid #f1f5f9"
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0
  },
  planActualContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "white",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  planActualHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9"
  },
  planActualTitle: {
    margin: "0 0 6px 0",
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b"
  },
  planActualSubtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 500
  },
  statsCards: {
    display: "flex",
    gap: "12px"
  },
  statCard: {
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    padding: "12px 20px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    minWidth: "120px",
    textAlign: "center"
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px"
  },
  statValue: {
    fontSize: "22px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  th: {
    padding: "12px 14px",
    fontSize: "16px",        // was 14
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "left",
    borderBottom: "2px solid #e5e7eb",
    whiteSpace: "nowrap"
  },
  td: {
    padding: "12px 14px",
    fontSize: "15px",        // was 13.5
    fontWeight: "600",
    color: "#334155",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap"
  },
  tr: {
    transition: "background 0.2s",
    height: "44px"          // better row height
  },
  filterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "1px solid rgba(59,130,246,0.2)",
    boxShadow: "inset 0 2px 6px rgba(59,130,246,0.1)",
    marginBottom: "16px",
    flexWrap: "nowrap"
  },
  filterLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0
  },
  filterRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0
  },
  comparisonBody: {
    flex: 1,              // 🔥 fills remaining height
    overflow: "hidden",   // 🔥 prevents overflow
    display: "flex",
    flexDirection: "column"
  },



};