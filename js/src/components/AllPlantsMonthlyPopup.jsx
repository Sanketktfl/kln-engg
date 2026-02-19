import React, { useEffect, useState, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

/* ---------- PLANT LIST ---------- */
const PLANTS = [
  { code: 2101, label: "R2" },
  { code: 7001, label: "Mundhwa" },
  { code: 7026, label: "R1" },
  { code: 7028, label: "Baramati" }
];

function getCurrentFinancialYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

const round2 = (val) => Number.parseFloat(val || 0).toFixed(2);

/* ---- ChartCell: ResizeObserver gives Highcharts a real pixel height ---- */
const ChartCell = ({ options }) => {
  const containerRef = useRef(null);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = Math.floor(entry.contentRect.height);
        if (h > 50) setHeight(h);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      {height ? (
        <HighchartsReact
          highcharts={Highcharts}
          options={{ ...options, chart: { ...options.chart, height } }}
          containerProps={{ style: { width: "100%", height: `${height}px` } }}
        />
      ) : null}
    </div>
  );
};

/* ====================== MAIN COMPONENT ====================== */
const AllPlantsMonthlyPopup = ({ show, onClose }) => {
  const currentFY = getCurrentFinancialYear();
  const [selectedYear, setSelectedYear] = useState(currentFY);
  const [plantMonthlyData, setPlantMonthlyData] = useState({});
  const [plantTargets, setPlantTargets] = useState({});

  const last5Years = [];
  for (let i = 0; i < 5; i++) last5Years.push(currentFY - i);

  /* ---------- FETCH TARGETS ---------- */
  useEffect(() => {
    async function fetchTargets() {
      try {
        const resp = await fetch("http://localhost:8080/api/v1/collection/kln_yield_target");
        const data = await resp.json();
        const map = {};
        (data.objects || []).forEach(o => {
          map[o.plant_code] = o.yield_target ?? 0;
        });
        setPlantTargets(map);
      } catch (err) {
        console.error("Failed to load targets:", err);
      }
    }
    fetchTargets();
  }, []);

  /* ---------- FETCH MONTHLY DATA ---------- */
  useEffect(() => {
    if (!show) return;
    async function fetchAllPlants() {
      try {
        const promises = PLANTS.map(async (plant) => {
          try {
            const url =
              "http://localhost:8080/internal/yield_dashboard_monthly"
              + "?year=" + selectedYear
              + "&plant_code=" + plant.code;
            const resp = await fetch(url);
            const data = await resp.json();
            const formatted = data.map((item) => ({
              month: (() => {
                const date = new Date(item.year_month + "-01");
                const mon = date.toLocaleString("en-US", { month: "short" });  // "Apr"
                const yr = String(date.getFullYear()).slice(2);                 // "25"
                return `${mon}-${yr}`;                                          // "Apr-25"
              })(),
              avgYield: Number(round2(item.yield_pct)),
              totalProduction: Number(round2(item.total_tonnage))
            }));
            return { plant: plant.label, code: plant.code, data: formatted };
          } catch {
            return { plant: plant.label, code: plant.code, data: [] };
          }
        });

        const results = await Promise.all(promises);
        const resultObj = {};
        results.forEach(r => {
          resultObj[r.plant] = { data: r.data, code: r.code };
        });
        setPlantMonthlyData(resultObj);
      } catch (err) {
        console.error("Error loading plant monthly data:", err);
      }
    }
    fetchAllPlants();
  }, [show, selectedYear]);

  if (!show) return null;

  /* ---------- CHART OPTIONS — no legend, tighter bottom margin ---------- */
  function createChartOptions(plantName, data, plantCode) {
    const target = plantTargets[plantCode] ?? null;

    const yieldValues = data.map(d => d.avgYield).filter(v => v > 0);
    const allValues = target !== null ? [...yieldValues, target] : yieldValues;

    const rawMin = allValues.length ? Math.min(...allValues) : 0;
    const rawMax = allValues.length ? Math.max(...allValues) : 100;
    const padding = Math.max((rawMax - rawMin) * 0.2, 3);

    const yMin = Math.max(0, parseFloat((rawMin - padding).toFixed(1)));
    const yMax = parseFloat((rawMax + padding).toFixed(1)) || 100;

    return {
      chart: {
        // bottom margin just for x-axis labels — no legend space needed
        margin: [28, 60, 42, 58],
        style: { fontFamily: "inherit" },
        animation: false
      },
      title: {
        text: plantName,
        style: { fontSize: "13px", fontWeight: "700", color: "#1e293b" },
        margin: 5
      },
      xAxis: {
        categories: data.map(d => d.month),
        crosshair: true,
        labels: {
          style: { fontSize: "12px", color: "#64748b" },
          y: 16
        }
      },
      yAxis: [
        {
          min: yMin,
          max: yMax,
          startOnTick: false,
          endOnTick: false,
          labels: {
            format: "{value}%",
            style: { color: "#16a34a", fontSize: "12px" },
            x: -4
          },
          title: {
            text: "Yield %",
            style: { color: "#16a34a", fontSize: "12px" },
            margin: 6
          },
          gridLineColor: "#f1f5f9",
          plotLines: target !== null ? [
            {
              value: target,
              color: "#f97316",
              dashStyle: "Dash",
              width: 2.5,
              zIndex: 6,
              label: {
                text: `Target: ${target}%`,
                align: "left",
                x: 6,
                y: -5,
                style: {
                  color: "#f97316",
                  fontSize: "11px",
                  fontWeight: "700"
                }
              }
            }
          ] : []
        },
        {
          labels: {
            format: "{value}T",
            style: { color: "#0ea5e9", fontSize: "12px" },
            x: 4
          },
          title: {
            text: "Production (T)",
            style: { color: "#0ea5e9", fontSize: "12px" },
            margin: 6
          },
          opposite: true,
          gridLineWidth: 0
        }
      ],
      tooltip: {
        shared: true,
        valueDecimals: 2,
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#e2e8f0",
        borderRadius: 8,
        shadow: false,
        style: { fontSize: "11px" }
      },
      // ✅ Legend completely disabled — single shared one in header
      legend: { enabled: false },
      credits: { enabled: false },
      plotOptions: {
        series: {
          states: { inactive: { enabled: false, opacity: 1 } }
        },
        column: {
          borderRadius: 3,
          pointPadding: 0.1,
          groupPadding: 0.1
        },
        spline: {
          marker: { enabled: true, radius: 3, lineWidth: 1, lineColor: "#fff" },
          lineWidth: 2
        }
      },
      series: [
        {
          name: "Production (T)",
          type: "column",
          yAxis: 1,
          data: data.map(d => d.totalProduction),
          color: "#38bdf8"
        },
        {
          name: "Yield %",
          type: "spline",
          yAxis: 0,
          data: data.map(d => d.avgYield),
          color: "#16a34a",
          tooltip: { valueSuffix: "%" }
        }
      ]
    };
  }

  /* ====================== UI ====================== */
  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>

        {/* HEADER — title + year picker + single shared legend + close */}
        <div style={headerStyle}>

          {/* LEFT: title + dropdown */}
          <div style={headerLeftStyle}>
            <span style={titleStyle}>📊 All Plants Monthly Performance</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={dropdownStyle}
            >
              {last5Years.map(fy => (
                <option key={fy} value={fy}>{fy}–{fy + 1}</option>
              ))}
            </select>
          </div>

          {/* RIGHT: shared legend + close button */}
          <div style={headerRightStyle}>

            {/* Shared legend pills */}
            <div style={sharedLegendStyle}>
              <span style={legendPill}>
                <span style={{ ...legendSwatch, background: "#38bdf8" }} />
                Production (T)
              </span>
              <span style={legendPill}>
                <span style={{ ...legendSwatch, background: "#16a34a" }} />
                Yield %
              </span>
              <span style={legendPill}>
                <span style={{
                  ...legendSwatch,
                  background: "repeating-linear-gradient(90deg,#f97316 0,#f97316 4px,transparent 4px,transparent 7px)",
                  height: "2px",
                  borderRadius: "0",
                  alignSelf: "center",
                  marginTop: "1px"
                }} />
                Target
              </span>
            </div>

            <button style={closeBtnStyle} onClick={onClose}>✖ Close</button>
          </div>
        </div>

        {/* 2×2 GRID */}
        <div style={gridStyle}>
          {PLANTS.map(plant => {
            const entry = plantMonthlyData[plant.label];
            const data = entry?.data ?? [];
            const code = plant.code;

            return (
              <div key={plant.label} style={cellStyle}>
                {data.length > 0 ? (
                  <ChartCell options={createChartOptions(plant.label, data, code)} />
                ) : (
                  <div style={emptyStyle}>
                    <div style={{ fontSize: "26px", marginBottom: "6px" }}>📭</div>
                    <div style={{ fontWeight: "600", color: "#475569", fontSize: "13px" }}>{plant.label}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                      No data for {selectedYear}–{selectedYear + 1}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AllPlantsMonthlyPopup;

/* ======================= STYLES ======================= */
const overlayStyle = {
  position: "fixed",
  top: 0, left: 0,
  width: "100%", height: "100%",
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const popupStyle = {
  width: "96%",
  height: "94%",
  background: "#f8fafc",
  borderRadius: "18px",
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
  overflow: "hidden"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0
};

const headerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const headerRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const titleStyle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0f172a",
  letterSpacing: "-0.2px"
};

const dropdownStyle = {
  padding: "4px 9px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "12px",
  background: "white",
  cursor: "pointer",
  color: "#334155",
  fontWeight: "500"
};

/* Shared legend */
const sharedLegendStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  background: "#f1f5f9",
  borderRadius: "20px",
  padding: "4px 10px"
};

const legendPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#475569",
  padding: "2px 8px",
  borderRadius: "12px",
  background: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.07)"
};

const legendSwatch = {
  display: "inline-block",
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  flexShrink: 0
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  gap: "10px",
  flex: 1,
  minHeight: 0,
  overflow: "hidden"
};

const cellStyle = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e8eef6",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  overflow: "hidden",
  position: "relative",
  minHeight: 0
};

const emptyStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#94a3b8"
};

const closeBtnStyle = {
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "12px",
  padding: "5px 12px",
  boxShadow: "0 2px 6px rgba(239,68,68,0.35)",
  whiteSpace: "nowrap"
};
