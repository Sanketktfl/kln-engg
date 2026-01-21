import React, { useState } from "react";

const ComparisonPopup = ({ show, onClose }) => {

  const [comparisonType, setComparisonType] = useState("die");
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

  if (!show) return null;

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

        <div style={styles.filterSection}>
          <label style={styles.label}>Comparison Type</label>
          <select style={styles.select} value={comparisonType} onChange={e => setComparisonType(e.target.value)}>
            <option value="die">Die-wise Analysis</option>
            <option value="family">Family-wise Analysis</option>
            <option value="plan_actual">Plan vs Actual</option>
          </select>
        </div>

        <div style={styles.toolbar}>
          <span style={styles.labelText}>Time Period</span>
          <select style={styles.selectSmall} value={periodType} onChange={e => setPeriodType(e.target.value)}>
            <option value="year">Year</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
          <select style={styles.selectSmall} value={year} onChange={e => setYear(e.target.value)}>
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}-{y + 1}</option>
            ))}
          </select>

          {periodType === "month" && (
            <select style={styles.selectSmall} value={month} onChange={e => setMonth(e.target.value)}>
              {["04","05","06","07","08","09","10","11","12","01","02","03"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {periodType === "quarter" && (
            <select style={styles.selectSmall} value={quarter} onChange={e => setQuarter(e.target.value)}>
              <option value="Q1">Q1 (Apr-Jun)</option>
              <option value="Q2">Q2 (Jul-Sep)</option>
              <option value="Q3">Q3 (Oct-Dec)</option>
              <option value="Q4">Q4 (Jan-Mar)</option>
            </select>
          )}
        </div>

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
          <div style={styles.placeholderSection}>
            <h2>Plan vs Actual</h2>
            <p>Plan vs Actual KPIs will be implemented here.</p>
          </div>
        )}

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
        <tr style={{background: `${color}15`}}>
          {mode === "die" ? (
            <>
              <th>Die</th>
              <th>Family</th>
            </>
          ) : (
            <>
              <th>Family</th>
              <th>Plant</th>
            </>
          )}
          <th>Yield %</th>
          <th>Tonnage</th>
          <th>Orders</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            {mode === "die" ? (
              <>
                <td>{r.pre_die_no}</td>
                <td>{r.family}</td>
              </>
            ) : (
              <>
                <td>{r.family}</td>
                <td>{r.plant_code}</td>
              </>
            )}
            <td>{r.yield_pct?.toFixed(2)}</td>
            <td>{r.total_tonnage?.toFixed(2)}</td>
            <td>{r.total_order_qty}</td>
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
    border: "1px solid rgba(255,255,255,0.8)"
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
  closeBtnText: {
    fontSize: "14px"
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
  toolbarLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: "140px"
  },
  labelIcon: {
    fontSize: "18px"
  },
  labelText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e40af"
  },
  toolbarGroup: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flex: 1
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
    border: "1px solid #e2e8f0"
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
    fontSize: "18px",
    fontWeight: "700"
  },
  dieInputGroup: {
    display: "flex",
    gap: "8px"
  },
  input: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
    transition: "all 0.2s",
    fontWeight: "500"
  },
  compareBtn: {
    color: "white",
    border: "none",
    padding: "8px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
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
  tableHeader: {
    position: "sticky",
    top: 0,
    zIndex: 1
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0"
  },
  tableRowEven: {
    background: "#ffffff"
  },
  tableRowOdd: {
    background: "#f8fafc"
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9"
  },
  tdHighlight: {
    fontWeight: "700",
    fontSize: "15px"
  },
  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px"
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5
  },
  placeholderSection: {
    flex: 1,
    marginTop: "8px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #ffffff, #f8fafc)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
    border: "2px dashed #cbd5e1"
  },
  placeholderIcon: {
    fontSize: "72px",
    marginBottom: "20px",
    opacity: 0.6
  },
  placeholderTitle: {
    margin: "0 0 12px 0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#475569"
  },
  placeholderText: {
    margin: 0,
    fontSize: "16px",
    color: "#94a3b8",
    maxWidth: "500px",
    textAlign: "center",
    lineHeight: "1.6"
  }


};