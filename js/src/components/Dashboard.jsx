import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import DieWeightBar from "./DieWeightBar";
import MasterDataPopup from "./MasterDataPopup";
import ComparisonPopup from "./ComparisonPopup";
import Base64Image from "./Base64Logo";

import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const getFinancialYear = (year, month) => {
  const m = Number(month);
  return m >= 4 ? year : year - 1;
};
const round2 = (val) => Number.parseFloat(val || 0).toFixed(2);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYear, setSelectedYear] = useState(null);
  const [showMonthlyPopup, setShowMonthlyPopup] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [familyViewType, setFamilyViewType] = useState("chart");
  const [dieViewType, setDieViewType] = useState("chart");
  const [selectedDie, setSelectedDie] = useState(null);
  const [showDieMonthlyPopup, setShowDieMonthlyPopup] = useState(false);
  const [activePlant, setActivePlant] = useState(null);
  const [yearWiseData, setYearWiseData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plantSummary, setPlantSummary] = useState([]);
  const [monthlyApiData, setMonthlyApiData] = useState([]);
  const [dieMonthlyApiData, setDieMonthlyApiData] = useState([]);
  const [dieApiData, setDieApiData] = useState([]);
  const [kpis, setKpis] = useState({avgYield: 0,totalDies: 0,totalProduction: 0,totalRevenue: 0});
  const [familyApiData, setFamilyApiData] = useState([]);
  const [weightDieNo, setWeightDieNo] = useState("");
  const [weightDetails, setWeightDetails] = useState([]);
  const [wtLoading, setWtLoading] = useState(false);
  const [showMasterPopup, setShowMasterPopup] = useState(false);
  const [plantTargets, setPlantTargets] = useState({});
  const [showComparisonPopup, setShowComparisonPopup] = useState(false);



  const today = new Date();
  const currentFY = getFinancialYear(today.getFullYear(), today.getMonth() + 1);

  const [familyYear, setFamilyYear] = useState(currentFY);
  const [dieYear, setDieYear] = useState(currentFY);


  const [familyMonth, setFamilyMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [dieMonth, setDieMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );

const [familyPeriodType, setFamilyPeriodType] = useState("month"); // month | quarter
const [diePeriodType, setDiePeriodType] = useState("month");       // month | quarter

const [familyQuarter, setFamilyQuarter] = useState("Q1");
const [dieQuarter, setDieQuarter] = useState("Q1");

const FY_QUARTERS = [
  ["Q1", "Q1 (Apr–Jun)"],
  ["Q2", "Q2 (Jul–Sep)"],
  ["Q3", "Q3 (Oct–Dec)"],
  ["Q4", "Q4 (Jan–Mar)"]
];


  const PLANT_MAP = {
    2101: "R2",
    7001: "Mundhwa",
    7026: "R1",
    7028: "Baramati"
  };

  const PLANT_REVERSE = {
    R2: 2101,
    Mundhwa: 7001,
    R1: 7026,
    Baramati: 7028
  };
  const normalizeFamily = (family) => {
    if (!family || String(family).trim() === "") {
      return "Other";
    }
    return family.trim();
  };

const getFYLabel = (y) => `${y}-${y + 1}`;

const FY_MONTHS = [
  ["04","Apr"], ["05","May"], ["06","Jun"], ["07","Jul"],
  ["08","Aug"], ["09","Sep"], ["10","Oct"], ["11","Nov"],
  ["12","Dec"], ["01","Jan"], ["02","Feb"], ["03","Mar"]
];

const HalfDonut = ({ value, label, target }) => {
  const progress = Math.min(Math.max(Number(value) || 0, 0), 100);
  const TARGET = target || 0;
  const radius = 45;
  const cx = 60;
  const cy = 60;
  const circumference = Math.PI * radius;

  const progressOffset =
    circumference - (progress / 100) * circumference;

  const targetOffset =
    circumference - (TARGET / 100) * circumference;

  const color =
    progress >= 80 ? "#16a34a" :
    progress >= 70 ? "#d97706" :
    "#dc2626";

  return (
    <div style={{ width: "100%", maxWidth: "150px" }}>
      <svg
        viewBox="0 0 120 80"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {/* Background arc */}
        <path
          d="M15 60 A45 45 0 0 1 105 60"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />

        {/* Target line (85%) */}
        <path
          d="M15 60 A45 45 0 0 1 105 60"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={targetOffset}
          strokeLinecap="round"
        />

        {/* Animated progress arc */}
        <path
          d="M15 60 A45 45 0 0 1 105 60"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.9s ease-in-out"
          }}
        />

        {/* Value */}
        <text
          x="60"
          y="52"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill={color}
        >
          {progress.toFixed(1)}%
        </text>

        {/* Target label */}
        <text
          x="60"
          y="66"
          textAnchor="middle"
          fontSize="10"
          fill="#0ea5e9"
          fontWeight="600"
        >
          Target {TARGET}%
        </text>

        {/* Plant label */}
        <text
          x="60"
          y="80"
          textAnchor="middle"
          fontSize="11"
          fill="#334155"
          fontWeight="600"
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/server/__quit__", {
        method: "GET",
        credentials: "include"
      });
      window.location.reload(); // or redirect to login if needed
    } catch (err) {
      console.error("Logout failed", err);
    }
  };


// 🔥 Selected die details FROM Die-wise tab (single record)
const selectedDieFromDieTab = selectedDie
  ? (
      dieApiData.find(d => d.die_no === selectedDie) ||
      dieMonthlyApiData.find(d => d.die_no === selectedDie)
    )
  : null;

useEffect(() => {
  if (activeTab !== "family") return;

  const fetchFamilyData = async () => {
    try {
      const plantCode = activePlant ?? "";

      let fy = familyYear;

      let url = "";
      if (familyPeriodType === "month") {
        url = `http://localhost:8080/internal/yield_dashboard_fam?year=${fy}&month=${familyMonth}&plant_code=${plantCode}`;
      } else {
        url = `http://localhost:8080/internal/yield_dashboard_famq?year=${fy}&quarter=${familyQuarter}&plant_code=${plantCode}`;
      }


      const resp = await fetch(url);
      const data = await resp.json();

      const familyMap = {};

    data.forEach(item => {
      const family = normalizeFamily(item.family);

      if (!familyMap[family]) {
        familyMap[family] = {
          family,
          totalTonnage: 0,
          totalOrders: 0,
          totalDies: 0,
          yieldSum: 0,
          yieldCount: 0
        };
      }

      familyMap[family].totalTonnage += item.total_tonnage ?? 0;
      familyMap[family].totalOrders += item.total_order_qty ?? 0;
      familyMap[family].totalDies += item.totaldies ?? 0;

      if (item.yield_pct !== null && item.yield_pct !== undefined) {
        familyMap[family].yieldSum += item.yield_pct;
        familyMap[family].yieldCount += 1;
      }
    });

    const aggregated = Object.values(familyMap).map(f => ({
      family: f.family,
      avgYield: Number(round2(f.yieldCount ? f.yieldSum / f.yieldCount : 0)),
      totalTonnage: Number(round2(f.totalTonnage)),
      totalOrders: f.totalOrders,
      totalDies: f.totalDies
    }));

    setFamilyApiData(aggregated);

    } catch (err) {
      console.error("❌ Family API error:", err);
      setFamilyApiData([]);
    }
  };

  fetchFamilyData();
}, [activeTab, familyYear, familyMonth, familyQuarter, familyPeriodType, activePlant]);

useEffect(() => {
  const fetchTargets = async () => {
    try {
      const resp = await fetch("http://localhost:8080/api/v1/collection/kln_yield_target");
      const data = await resp.json();

      const map = {};
      data.objects.forEach(o => {
        map[o.plant_code] = o.yield_target != null ? o.yield_target : 0;
      });

      setPlantTargets(map);   // {2101: 82.5, 7027: 82.6, ...}
    } catch (e) {
      console.error("Target load failed", e);
    }
  };

  fetchTargets();
}, []);



useEffect(() => {
  if (activeTab !== "die") return;

  const fetchDieTabMonthlyData = async () => {
    try {
      const plantCode = activePlant ?? "";

      const fy = dieYear;   // already financial year start

      let url = "";
      if (diePeriodType === "month") {
        url = `http://localhost:8080/internal/yield_dashboard_die?year=${fy}&month=${dieMonth}&plant_code=${plantCode}`;
      } else {
        url = `http://localhost:8080/internal/yield_dashboard_dieq?year=${fy}&quarter=${dieQuarter}&plant_code=${plantCode}`;
      }

      const resp = await fetch(url);
      const data = await resp.json();

      const formatted = data.map(item => ({
          die_no: item.pre_die_no,
          family: normalizeFamily(item.family),
          percent_yield: Number(round2(item.yield_pct)),
          tonnage: Number(round2(item.total_tonnage)),
          orders: item.total_order_qty ?? 0,
          revenue: Number(item.revenue ?? 0) / 1000000,

          // 🔥 IMPORTANT: split code & label
          plant_code: item.plant_code,     // number (for filtering)
          plant_label:
            item.plant_code === 2101 ? "R2" :
            item.plant_code === 7001 ? "Mundhwa" :
            item.plant_code === 7026 ? "R1" :
            item.plant_code === 7028 ? "Baramati" :
            String(item.plant_code),
        }));

      setDieApiData(formatted);
    } catch (err) {
      console.error("❌ Die tab monthly API error:", err);
      setDieApiData([]);
    }
  };
  fetchDieTabMonthlyData();
}, [activeTab, dieYear, dieMonth, dieQuarter, diePeriodType, activePlant]);


useEffect(() => {
  if (!showMonthlyPopup && !showDieMonthlyPopup) {
    setSelectedMonth(null);
    setSelectedDie(null);
  }
}, [showMonthlyPopup, showDieMonthlyPopup]);

const handleDieClick = (die) => {
  setSelectedDie(die);
  setShowDieMonthlyPopup(true);
};

const [yearlyChartData, setYearlyChartData] = useState([]);

useEffect(() => {
  const fetchYearlyChartData = async () => {
    try {
      const plantCode = activePlant ? activePlant : "";
      const resp = await fetch(
        `http://localhost:8080/internal/yield_dashboard_yearly?plant_code=${plantCode}`
      );

      const data = await resp.json();

      const formatted = data.map((row) => ({
        year: String(row.year),
        avgYield: Number(round2(row.yield_pct)),
        tonnage: Number(round2(row.total_tonnage)),
      }));

      setYearlyChartData(formatted);
    } catch (err) {
      console.error("❌ Yearly chart API error:", err);
    }
  };

  fetchYearlyChartData();
}, [activePlant]);

useEffect(() => {
  if (!showMonthlyPopup || !selectedYear || !selectedMonth) return;

  const fetchDieData = async () => {
    try {
      // Convert "Mar" → "03"
      const monthNumber =
        new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth() + 1;
      const formattedMonth = String(monthNumber).padStart(2, "0");

      // plant_code logic
      const plantCode = activePlant ?? "";

      const fy = getFinancialYear(selectedYear, formattedMonth);
      const url = `http://localhost:8080/internal/yield_dashboard_die?year=${fy}&month=${formattedMonth}&plant_code=${plantCode}`;

      const response = await fetch(url);
      const data = await response.json();

      const formattedDieData = data.map(item => ({
        die_no: item.pre_die_no,
        family: normalizeFamily(item.family),
        plant:
          item.plant_code === 2101 ? "R2" :
          item.plant_code === 7001 ? "Mundhwa" :
          item.plant_code === 7026 ? "R1" :
          item.plant_code === 7028 ? "Baramati" :
          item.plant_code,
        percent_yield: item.yield_pct ?? 0,
        tonnage: item.total_tonnage ?? 0,
        orders: item.total_order_qty ?? 0,
        revenue: Number(item.revenue ?? 0) / 1000000,
        month: selectedMonth,
        plant_code: item.plant_code
      }));

      setDieMonthlyApiData(formattedDieData);

    } catch (error) {
      console.error("❌ Error fetching monthly die data:", error);
      setDieMonthlyApiData([]);
    }
  };

  fetchDieData();
}, [showMonthlyPopup, selectedMonth, selectedYear, activePlant]);



useEffect(() => {
  if (!showMonthlyPopup) {
    setSelectedMonth(null);
    setDieMonthlyApiData([]);  // also cleanup this
  }
}, [showMonthlyPopup]);


useEffect(() => {
  if (!showMonthlyPopup || !selectedYear || selectedMonth) return;

  const fetchMonthlyApiData = async () => {
    try {
      const plantCode = activePlant ?? "";   // numeric or empty

      const fy = getFinancialYear(selectedYear, selectedMonth || "04");
      const url = `http://localhost:8080/internal/yield_dashboard_monthly?year=${fy}&plant_code=${plantCode}`;

      const resp = await fetch(url);
      const data = await resp.json();

      const formatted = data.map(item => ({
        month: new Date(`${item.year_month}-01`)
          .toLocaleString("en-US", { month: "short" }),   // Jan, Feb…
        avgYield: Number(round2(item.yield_pct)),
        totalProduction: Number(round2(item.total_tonnage)),
        totalOrderQty: item.total_order_qty ?? 0,
      }));

      setMonthlyApiData(formatted);

    } catch (err) {
      console.error("❌ Monthly API error:", err);
      setMonthlyApiData([]);
    }
  };

  fetchMonthlyApiData();
}, [showMonthlyPopup, selectedYear, activePlant]);



const fetchDieWeightDetails = async () => {
  if (!weightDieNo.trim()) {
    setWeightDetails([]);
    return;
  }
  setWtLoading(true);

  try {
    const resp = await fetch(
      `http://localhost:8080/internal/yield_dashboard_wt?die_number=${weightDieNo}`
    );

    if (!resp.ok) throw new Error("API failed");
    const data = await resp.json();

    // Normalize keys & avoid nulls
    const cleaned = data.map((row) => ({
      die_no: row.die_number,
      plant_code: row.plant_code,
      cut_weight: row.cut_wt ?? 0,
      burr_weight: row.burr_wt ?? 0,
      flash_weight: row.flash_slug_wt ?? 0,
      end_piece_weight: row.endpc_wt ?? 0,
      gross_weight: row.gross_wt ?? 0,
      net_weight: row.net_wt ?? 0,
      machining_weight: row.machining_wt ?? 0,
    }));

    setWeightDetails(cleaned);
  } catch (err) {
    console.error("❌ Weight API error:", err);
    setWeightDetails([]);
  } finally {
    setWtLoading(false);
  }
};

useEffect(() => {
  const fetchYearWiseData = async () => {
    try {
      const resp = await fetch("http://localhost:8080/internal/yield_dashboard");
      const result = await resp.json();

      // Fix null year to 2024
      const cleanedData = result.map((row) => ({
        year: String(row.year),
        plant_code: row.plant_code,
        plant: PLANT_MAP[row.plant_code] ?? row.plant_code,
        avgYield: row.yield_pct ?? 0,
        tonnage: row.total_tonnage ?? 0,
        totalDies: row.totaldies ?? 0,
      }));

      setYearWiseData(
        cleanedData.filter((row) => row.year) // only for chart
      );

      // 🔹 Prepare Plant Summary
      const plantSummaryData = cleanedData.map((row) => ({
        plant_code: row.plant,
        avgYield: row.avgYield,
        targetYield: 0 // for now
      }));

      setPlantSummary(plantSummaryData); // add new state below

    } catch (error) {
      console.error("❌ Error fetching year-wise data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchYearWiseData();
}, []);

useEffect(() => {
  if (!yearWiseData || yearWiseData.length === 0) return;

const dataToUse = activePlant
  ? yearWiseData.filter((row) => PLANT_REVERSE[row.plant] === activePlant)
  : yearWiseData;

  const totalDies = dataToUse.reduce((sum, r) => sum + (r.totalDies || 0), 0);
  const totalProduction = dataToUse.reduce((sum, r) => sum + r.tonnage, 0);
  const totalYield = dataToUse.reduce((sum, r) => sum + r.avgYield, 0);
  const totalRevenue = dataToUse.reduce((sum, r) => sum + (r.revenue || 0), 0);


  setKpis({
    avgYield: dataToUse.length ? (totalYield / dataToUse.length).toFixed(2) : 0,
    totalDies: totalDies || 0,
    totalProduction: totalProduction.toFixed(2),
    totalRevenue: (totalRevenue / 1000000).toFixed(2),
  });
}, [activePlant, yearWiseData]);

  useEffect(() => {
    if (activeTab !== "overview") {
      setShowMonthlyPopup(false);
      setSelectedMonth(null);
      setSelectedYear(null);
    }
  }, [activeTab]);

const COLORS = {
  Gear: "#8b5cf6",
  Sleeve: "#10b981",
  "Yoke Shaft": "#38bdf8",
  Other: "#64748b",
};

// Prepare Family-wise data for month analysis
let familyWiseDataForMonth = [];

if (showMonthlyPopup && selectedYear && selectedMonth) {
  const currentDieData = dieMonthlyApiData || [];

  // Group data by family
  const familyTotals = {};
  currentDieData.forEach(item => {
    const fam = normalizeFamily(item.family);

    if (!familyTotals[fam]) {
      familyTotals[fam] = {
        family: fam,
        count: 0,
        totalProduction: 0,
        totalRevenue: 0,
        totalOrders: 0,
        percentYieldSum: 0,
        percentYieldCount: 0
      };
    }

    familyTotals[fam].count++;
    familyTotals[fam].totalProduction += item.tonnage || 0;
    familyTotals[fam].totalRevenue += (item.revenue || 0);
    familyTotals[fam].totalOrders += item.orders || item.order_qty || 0;
    familyTotals[fam].percentYieldSum += item.percent_yield || 0;
    familyTotals[fam].percentYieldCount++;
  });

  // Convert into array with averages
  familyWiseDataForMonth = Object.values(familyTotals).map(family => ({
    ...family,
    avgYield: family.percentYieldCount ? family.percentYieldSum / family.percentYieldCount : 0,
    color: COLORS ? COLORS[family.family] : '#8884d8' // Use your existing COLORS object
  }));
}

const familyWiseDataForDashboard = familyApiData;
const monthKey = `${selectedYear}-${selectedMonth}`;
const selectedMonthDieData = dieMonthlyApiData;

 // FILTER DATA BASED ON activePlant
// Year-wise
const filteredYearwiseData = activePlant
  ? yearWiseData.filter((d) => d.plant === activePlant)
  : yearWiseData;

const filteredFamilyData = familyWiseDataForDashboard;

// Monthly Popup Die-wise
const filteredDieWiseMonthData = activePlant
   ? dieMonthlyApiData.filter((d) => d.plant === activePlant)
   : dieMonthlyApiData;

// Family data in month popup
const filteredFamilyWiseDataForMonth = activePlant
  ? familyWiseDataForMonth.filter((f) =>
      dieMonthlyApiData.some(
        (d) => d.family === f.family && d.plant === activePlant
      )
    )
  : familyWiseDataForMonth;

const filteredDieApiData = activePlant
  ? dieApiData.filter((item) => item.plant_code === activePlant)
  : dieApiData;


const topYieldDie = dieMonthlyApiData.length
  ? [...dieMonthlyApiData].sort((a, b) => b.percent_yield - a.percent_yield)[0]?.die_no
  : "-";

const topProdDie = dieMonthlyApiData.length
  ? [...dieMonthlyApiData].sort((a, b) => b.tonnage - a.tonnage)[0]?.die_no
  : "-";

// ----------------------
// HIGHCHARTS YEARWISE CONFIG
// ----------------------
const yearLabels = yearlyChartData.map(item => item.year);
const yieldData = yearlyChartData.map(item => item.avgYield);
const tonnageData = yearlyChartData.map(item => item.tonnage);

const yearwiseHighchartOptions = {
  chart: {
    zooming: { type: "xy" },
    height: 480
  },

title: {
  text: "Year-wise Performance",
  style: { fontSize: "18px", fontWeight: "600" }
},

xAxis: [{
  categories: yearLabels,
  crosshair: true,
  labels: { style: { fontSize: "13px" } }
}],

yAxis: [
  {
    labels: { format: "{value}%", style: { color: "#16a34a", fontSize: "13px" } },
    title: { text: "Yield (%)", style: { color: "#16a34a",  fontSize: "14px" } },
    opposite: true
  },
  {
    labels: { format: "{value} T", style: { color: "#38bdf8", fontSize: "13px" } },
    title: { text: "Production (T)", style: { color: "#38bdf8", fontSize: "14px" } }
  }
],

tooltip: {
    valueDecimals: 2,
    shared: true },
legend: {
  layout: "horizontal",
  align: "center",
  verticalAlign: "bottom",
  itemStyle: { fontSize: "14px" }
},

  series: [
    {
      name: "Production (T)",
      type: "column",
      yAxis: 1,
      data: tonnageData,
      color: "#38bdf8",
      point: {
        events: {
          click: (e) => {
            const fyStart = parseInt(e.point.category.split("-")[0]);
            setSelectedYear(fyStart);
            setShowMonthlyPopup(true);
          }
        }
      }
    },
    {
      name: "Yield (%)",
      type: "spline",
      yAxis: 0,
      data: yieldData,
      color: "#16a34a",
      tooltip: { valueSuffix: "%" },
      point: {
        events: {
          click: (e) => {
            const fyStart = parseInt(e.point.category.split("-")[0]);
            setSelectedYear(fyStart);
            setShowMonthlyPopup(true);
          }
        }
      }
    }
  ]
};

// ----------------------
// HIGHCHARTS MONTHWISE CONFIG
// ----------------------
const monthLabels = monthlyApiData.map(item => item.month);
const monthYield = monthlyApiData.map(item => item.avgYield);
const monthProduction = monthlyApiData.map(item => item.totalProduction);

const monthwiseHighchartOptions = {
  chart: { zooming: { type: "xy" } },

title: {
  text: `Monthly Performance – ${selectedYear}`,
  style: { fontSize: "18px", fontWeight: "600" }
},

xAxis: [{
  categories: monthLabels,
  crosshair: true,
  labels: { style: { fontSize: "13px" } }
}],

yAxis: [
  {
    labels: { format: "{value}%", style: { color: "#16a34a", fontSize: "13px" } },
    title: { text: "Yield (%)", style: { color: "#16a34a", fontSize: "14px" } },
    opposite: true
  },
  {
    labels: { format: "{value} T", style: { color: "#38bdf8", fontSize: "13px" } },
    title: { text: "Production (T)", style: { color: "#38bdf8", fontSize: "14px" } }
  }
],

tooltip: { shared: true },
legend: {
  layout: "horizontal",
  align: "center",
  verticalAlign: "bottom",
  itemStyle: { fontSize: "14px" }
},

  series: [
    {
      name: "Production (T)",
      type: "column",
      yAxis: 1,
      data: monthProduction,
      color: "#38bdf8",
      point: {
        events: {
          click: (e) => {
            const month = e.point.category;
            setSelectedMonth(month);
          }
        }
      }
    },
    {
      name: "Yield (%)",
      type: "spline",
      yAxis: 0,
      data: monthYield,
      color: "#16a34a",
      tooltip: { valueSuffix: "%" },
      point: {
        events: {
          click: (e) => {
            const month = e.point.category;
            setSelectedMonth(month);
          }
        }
      }
    }
  ]
};

if (isLoading) {
  return <div>Loading Dashboard...</div>;
}
  return (
    <div style={styles.layout}>
      <div style={styles.header}>
        {/* LEFT: Logo */}
        <div style={styles.headerLeft}>
          <Base64Image style={styles.headerLogo}/>
        </div>

        {/* CENTER: Title (TRUE CENTER) */}
        <h1 style={styles.headerTitleCentered}>
          Manufacturing Yield
        </h1>

        {/* RIGHT: Button (kept but does NOT affect centering) */}
        <div style={styles.headerRight}>
          <button
            style={styles.comparisonBtn}
            onClick={() => setShowComparisonPopup(true)}
          >
            📊 Comparison
          </button>

          <button
            style={styles.masterEditBtn}
            onClick={() => setShowMasterPopup(true)}
          >
            ✏️ Edit Data
          </button>

          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={styles.plantOverviewFixed}>
           {activePlant && (
            <button
              style={styles.clearButton}
              onClick={() => setActivePlant(null)}
            >
              Clear
            </button>
          )}
        <div style={styles.cardGrid}>

          {/* ALL PLANTS */}
          <div
            style={{
              ...styles.plantCard,
              ...(activePlant === null ? styles.plantCardActive : {})
            }}
            onClick={() => setActivePlant(null)}
          >
            <HalfDonut
              value={
                plantSummary.length
                  ? plantSummary.reduce((s, p) => s + p.avgYield, 0) / plantSummary.length
                  : 0
              }
              label="All Plants"
              target={
                Object.values(plantTargets).length ? Number(
                  round2(
                    Object.values(plantTargets).reduce((a, b) => a + (b || 0), 0) /
                    Object.values(plantTargets).length
                  )
                ) : 0
              }
            />
          </div>

          {/* INDIVIDUAL PLANTS */}
          {plantSummary.map((plant) => (
            <div
              style={{
                ...styles.plantCard,
                ...(activePlant && PLANT_REVERSE[plant.plant_code] === activePlant
                  ? styles.plantCardActive
                  : {})
              }}
              onClick={() =>
                setActivePlant(PLANT_REVERSE[plant.plant_code] || plant.plant_code)
              }
            >
              <HalfDonut
                value={plant.avgYield}
                label={plant.plant_code}
                target={plantTargets[PLANT_REVERSE[plant.plant_code]] || 0}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{ ...styles.tab, ...(activeTab === "overview" ? styles.activeTab : {}) }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("family")}
          style={{ ...styles.tab, ...(activeTab === "family" ? styles.activeTab : {}) }}
        >
          Family-wise
        </button>
        <button
          onClick={() => setActiveTab("die")}
          style={{ ...styles.tab, ...(activeTab === "die" ? styles.activeTab : {}) }}
        >
          Die-wise
        </button>
        <button
            onClick={() => setActiveTab("die_weight")}
            style={{ ...styles.tab, ...(activeTab === "die_weight" ? styles.activeTab : {}) }}
          >
            Die Weight Details
          </button>
      </div>

      <div style={styles.contentArea}>
        {activeTab === "overview" && (
          <div style={styles.splitView}>
            <div style={styles.pane}>
              <div style={styles.kpiGrid}>

              {/* Avg Yield */}
              <div style={{ ...styles.kpiCardBase, ...styles.kpiCardYield }}>
                <div style={styles.kpiContent}>
                  <p style={{ ...styles.kpiValue, color: "#065f46" }}>
                    { round2(kpis.avgYield) }%
                  </p>
                  <div style={styles.kpiRightColumn}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: "#d1fae5" }}>
                      📈
                    </div>
                    <p style={styles.kpiLabel}>Avg Yield</p>
                  </div>
                </div>
              </div>

              {/* Total Dies */}
              <div style={{ ...styles.kpiCardBase, ...styles.kpiCardDies }}>
                <div style={styles.kpiContent}>
                  <p style={{ ...styles.kpiValue, color: "#5b21b6" }}>
                    {kpis.totalDies}
                  </p>
                  <div style={styles.kpiRightColumn}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: "#f1e9ff" }}>
                      ⚙️
                    </div>
                    <p style={styles.kpiLabel}>Total Dies</p>
                  </div>
                </div>
              </div>

              {/* Production */}
              <div style={{ ...styles.kpiCardBase, ...styles.kpiCardProd }}>
                <div style={styles.kpiContent}>
                  <p style={{ ...styles.kpiValue, color: "#92400e" }}>
                    { round2(kpis.totalProduction) }T
                  </p>
                  <div style={styles.kpiRightColumn}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: "#fef3c7" }}>
                      📊
                    </div>
                    <p style={styles.kpiLabel}>Total Production</p>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div style={{ ...styles.kpiCardBase, ...styles.kpiCardRevenue }}>
                <div style={styles.kpiContent}>
                  <p style={{ ...styles.kpiValue, color: "#9d174d" }}>
                    ₹{ round2(kpis.totalRevenue) }M
                  </p>
                  <div style={styles.kpiRightColumn}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: "#ffe4e6" }}>
                      💵
                    </div>
                    <p style={styles.kpiLabel}>Total Revenue</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
            <div style={styles.paneRight}>
              <div style={{ width: "100%", height: "100%" }}>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={yearwiseHighchartOptions}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "die" && (
          <div>
            {/* Header with toggle buttons */}
            <div style={styles.familyHeaderRow}>
              <h3>Die-wise Performance</h3>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {/* Year */}
                  {/* Mode */}
                  <select
                    value={diePeriodType}
                    onChange={(e) => setDiePeriodType(e.target.value)}
                    style={styles.familyFilterSelect}
                  >
                    <option value="month">Month Wise</option>
                    <option value="quarter">Quarter Wise</option>
                  </select>

                  {/* Financial Year */}
                  <select
                    value={dieYear}
                    onChange={(e) => setDieYear(Number(e.target.value))}
                    style={styles.familyFilterSelect}
                  >
                    {[2023, 2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{getFYLabel(y)}</option>
                    ))}
                  </select>

                  {/* Month / Quarter */}
                  {diePeriodType === "month" ? (
                    <select
                      value={dieMonth}
                      onChange={(e) => setDieMonth(e.target.value)}
                      style={styles.familyFilterSelect}
                    >
                      {FY_MONTHS.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={dieQuarter}
                      onChange={(e) => setDieQuarter(e.target.value)}
                      style={styles.familyFilterSelect}
                    >
                      {FY_QUARTERS.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  )}

                  <div style={styles.familyToggleGroup}>
                  <button
                    style={{
                      ...styles.familyToggleBtn,
                      ...(dieViewType === "chart" ? styles.familyToggleBtnActive : {})
                    }}
                    onClick={() => setDieViewType("chart")}
                  >
                    📊 Chart
                  </button>
                  <button
                    style={{
                      ...styles.familyToggleBtn,
                      ...(dieViewType === "table" ? styles.familyToggleBtnActive : {})
                    }}
                    onClick={() => setDieViewType("table")}
                  >
                    📋 Table
                  </button>
                </div>

                </div>

            </div>
            {dieViewType === "chart" ? (
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={filteredDieApiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="die_no" />
                  <YAxis tickFormatter={(v) => round2(v)} />
                  <Tooltip formatter={(v) => round2(v)} />
                  <Legend />
                  <Bar
                    dataKey="percent_yield"
                    name="Avg Yield %"
                    fill="#10b981"
                    cursor="pointer"
                    onClick={(e) => handleDieClick(e?.payload?.die_no)}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <>
                {/* Detailed Die Performance Table */}
                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>
                      Detailed Die Performance – Year {selectedYear || "2025"}
                    </h3>
                    <div style={styles.chartSubtitle}>
                      Sorted by Yield (Highest to Lowest)
                    </div>
                  </div>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr>
                          <th style={styles.th}>Die Number</th>
                          <th style={styles.th}>Plant</th>
                          <th style={styles.th}>Family</th>
                          <th style={styles.th}>Yield %</th>
                          <th style={styles.th}>Production (T)</th>
                          <th style={styles.th}>Revenue</th>
                          <th style={styles.th}>Orders</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDieApiData.map((item, index) => (
                          <tr
                            key={`${item.die_no}-${index}`}
                            onClick={() => setSelectedDie(item.die_no)}
                            style={styles.tableRow}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <td style={{ ...styles.td, fontWeight: "500" }}>{item.die_no}</td>
                            <td style={styles.td}>{item.plant_label}</td>
                            <td style={styles.td}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <div style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: COLORS[item.family] || "#64748b"
                                }}></div>
                                {item.family}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.statusBadge,
                                ...(item.percent_yield >= 80
                                  ? styles.goodBadge
                                  : item.percent_yield >= 70
                                    ? styles.warningBadge
                                    : styles.criticalBadge)
                              }}>
                                {round2(item.percent_yield)}%
                              </span>
                            </td>
                            <td style={styles.td}>{round2(item.tonnage)}T</td>
                            <td style={styles.td}>₹{round2(item.revenue)}M</td>
                            <td style={styles.td}>{item.orders.toLocaleString()}</td>
                            <td style={styles.td}>
                              {item.percent_yield >= 80 ? (
                                <span style={{ color: "#16a34a", fontSize: "12px" }}>✔ Good</span>
                              ) : item.percent_yield >= 70 ? (
                                <span style={{ color: "#d97706", fontSize: "12px" }}>⚡ Warning</span>
                              ) : (
                                <span style={{ color: "#dc2626", fontSize: "12px" }}>⚠ Critical</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredDieApiData.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#6b7280" }}>
                              No data available for selected filters
                            </td>
                          </tr>
                        ) : <></>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "family" && (
          <div>
            {/* Header row with title left, buttons right */}
            <div style={styles.familyHeaderRow}>
              <h3>Family-wise Performance</h3>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Year Filter */}
                {/* Mode */}
                <select
                  value={familyPeriodType}
                  onChange={(e) => setFamilyPeriodType(e.target.value)}
                  style={styles.familyFilterSelect}
                >
                  <option value="month">Month Wise</option>
                  <option value="quarter">Quarter Wise</option>
                </select>

                {/* Financial Year */}
                <select
                  value={familyYear}
                  onChange={(e) => setFamilyYear(Number(e.target.value))}
                  style={styles.familyFilterSelect}
                >
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{getFYLabel(y)}</option>
                  ))}
                </select>

                {/* Month / Quarter */}
                {familyPeriodType === "month" ? (
                  <select
                    value={familyMonth}
                    onChange={(e) => setFamilyMonth(e.target.value)}
                    style={styles.familyFilterSelect}
                  >
                    {FY_MONTHS.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={familyQuarter}
                    onChange={(e) => setFamilyQuarter(e.target.value)}
                    style={styles.familyFilterSelect}
                  >
                    {FY_QUARTERS.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                )}


                {/* View Toggle */}
                <div style={styles.familyToggleGroup}>
                  <button
                    style={{
                      ...styles.familyToggleBtn,
                      ...(familyViewType === "chart" ? styles.familyToggleBtnActive : {})
                    }}
                    onClick={() => setFamilyViewType("chart")}
                  >
                    📊 Chart
                  </button>
                  <button
                    style={{
                      ...styles.familyToggleBtn,
                      ...(familyViewType === "table" ? styles.familyToggleBtnActive : {})
                    }}
                    onClick={() => setFamilyViewType("table")}
                  >
                    📋 Table
                  </button>
                </div>
              </div>
            </div>


            {familyViewType === "chart" ? (
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={filteredFamilyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="family" />
                  <YAxis tickFormatter={(v) => round2(v)} />
                  <Tooltip formatter={(v) => round2(v)} />
                  <Legend />
                  <Bar
                      dataKey="avgYield"
                      fill="#38bdf8"
                      name="Avg Yield %"
                      cursor="pointer"
                      onClick={() => setActiveTab("die")}   // Tab switch to Die-wise
                    />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>Family-wise Detailed Performance</h3>
                    <div style={styles.chartSubtitle}>Across Plants {activePlant ? `(${activePlant})` : ""}</div>
                  </div>

                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr>
                          <th style={styles.th}>Family</th>
                          <th style={styles.th}>Dies</th>
                          <th style={styles.th}>Yield %</th>
                          <th style={styles.th}>Production (T)</th>
                          <th style={styles.th}>Revenue</th>
                          <th style={styles.th}>Orders</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredFamilyData.map((row, idx) => (
                          <tr
                            key={idx}
                            style={styles.tableRow}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            {/* Family with color indicator */}
                            <td style={{ ...styles.td, fontWeight: "500" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: COLORS[row.family] || "#64748b",
                                  }}
                                ></div>
                                {row.family}
                              </span>
                            </td>

                            <td style={styles.td}>{row.totalDies}</td>

                            {/* Yield badge */}
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  ...(row.avgYield >= 80
                                    ? styles.goodBadge
                                    : row.avgYield >= 70
                                    ? styles.warningBadge
                                    : styles.criticalBadge),
                                }}
                              >
                                {round2(row.avgYield)}%
                              </span>
                            </td>

                            <td style={styles.td}>{round2(row.totalTonnage)}T</td>

                            <td style={styles.td}>₹{((row.totalOrders / 1000) || 0).toFixed(0)}M</td>

                            <td style={styles.td}>{row.totalOrders.toLocaleString()}</td>

                            <td style={styles.td}>
                              {row.avgYield >= 80 ? (
                                <span style={{ color: "#16a34a", fontSize: "12px" }}>✔ Good</span>
                              ) : row.avgYield >= 70 ? (
                                <span style={{ color: "#d97706", fontSize: "12px" }}>⚡ Warning</span>
                              ) : (
                                <span style={{ color: "#dc2626", fontSize: "12px" }}>⚠ Critical</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredFamilyData.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              style={{
                                ...styles.td,
                                textAlign: "center",
                                padding: "12px",
                                color: "#6b7280",
                              }}
                            >
                              No family data for selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
        </div>
        )}


        {/* Die Weight Tab */}
        {activeTab === "die_weight" && (
          <div style={{ overflowX: "auto" }}>
            <DieWeightBar />
          </div>
        )}


        {/* Monthly Popup */}
        {showMonthlyPopup && selectedYear && !selectedMonth && (
          <div style={styles.popupOverlay}>
            <div style={styles.popupContent}>
              <div style={styles.popupHeader}>
                <h3>Monthly Performance – {selectedYear}</h3>
                <button
                  style={styles.closeBtn}
                  onClick={() => {
                    setShowMonthlyPopup(false);
                    setSelectedMonth(null);
                    setSelectedYear(null);
                  }}
                >
                  ✖ Close
                </button>
              </div>
               <div style={{overflowY:"auto", flex:1}}>
              <div style={{ width: "100%", height: "350px" }}>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={monthwiseHighchartOptions}
                  />
                </div>

                {/*  Updated Year Summary Section */}
                <div style={styles.modalSummaryWrapper}>
                  <h3 style={styles.modalSectionTitle}>Year {selectedYear} Summary</h3>

                  {(() => {
                     const monthlyDataForYear = monthlyApiData || [];

                      if (monthlyDataForYear.length === 0) {
                        return (
                          <p style={{ textAlign: "center", marginTop: "10px", color: "#64748b" }}>
                            No data available yet...
                          </p>
                        );
                      }
                    return (
                      <table style={styles.summaryTable}>
                          <thead>
                            <tr>
                              <th style={styles.summaryTableThTd}>Yearly Avg Yield</th>
                              <th style={styles.summaryTableThTd}>Total Production</th>
                              <th style={styles.summaryTableThTd}>Best Month (Yield)</th>
                              <th style={styles.summaryTableThTd}>Months With Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={styles.summaryTableThTd}>
                                {round2(
                                  monthlyDataForYear.reduce((sum, item) => sum + item.avgYield, 0) /
                                  monthlyDataForYear.length
                                )}%
                              </td>
                              <td style={styles.summaryTableThTd}>
                                {round2(
                                  monthlyDataForYear.reduce((sum, item) => sum + item.totalProduction, 0)
                                )}T
                              </td>
                              <td style={styles.summaryTableThTd}>
                                {
                                  monthlyDataForYear.reduce((prev, curr) =>
                                    prev.avgYield > curr.avgYield ? prev : curr
                                  ).month
                                }
                              </td>
                              <td style={styles.summaryTableThTd}>
                              {monthlyDataForYear.length}/12
                              </td>
                            </tr>
                          </tbody>
                      </table>
                    );
                  })()}
                </div>
                </div>
            </div>
          </div>
        )}

      {/*  Enhanced Month Die-wise Analysis Modal */}
        {showMonthlyPopup && selectedMonth && selectedYear && (
          <div style={styles.popupOverlay}>
            <div style={styles.popupContent}>

              {/*  Header Section */}
              <div style={styles.popupHeader}>
                <h3 style={styles.modalSectionTitle}>
                  Die-wise Analysis – {selectedMonth} {selectedYear}
                  {activePlant && ` (${activePlant} Plant)`}
                </h3>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={styles.backBtn} onClick={() => setSelectedMonth(null)}>◀ Back</button>
                  <button
                      style={styles.closeBtn}
                      onClick={() => {
                          setShowMonthlyPopup(false);
                          setSelectedMonth(null);
                          setSelectedYear(null);
                      }}
                    >
                    ✖ Close
                  </button>
                </div>
              </div>

              <div style={{ overflowY: "auto", flex: 1 }}>
                {dieMonthlyApiData?.length > 0 ? (
                  <>
                    {/*  Top Contributors (existing) */}
                    <div style={styles.modalStats}>
                      <h3 style={styles.modalSectionTitle}>Top Contributors – {selectedMonth} {selectedYear}</h3>
                      <div style={{ display: 'flex', gap: "12px", overflowX: "auto" }}>
                        <div style={styles.statItem}>
                          <span style={styles.statLabel}>Best Yield:</span>
                          <span style={styles.statValue}>
                            {topYieldDie}
                          </span>
                        </div>
                        <div style={styles.statItem}>
                          <span style={styles.statLabel}>Most Production:</span>
                          <span style={styles.statValue}>
                              {dieMonthlyApiData.length
                                ? [...dieMonthlyApiData].sort((a, b) => b.tonnage - a.tonnage)[0]?.die_no
                                : "-"}
                          </span>
                        </div>
                        <div style={styles.statItem}>
                          <span style={styles.statLabel}>Total Dies:</span>
                          <span style={styles.statValue}>
                            {dieMonthlyApiData.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/*  Side by Side Layout for Bar + Pie Charts */}
                    <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>

                      {/*  Family-wise Production Bar Chart */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: "10px", fontSize: "14px", color: "#64748b" }}>
                          Production by Family
                        </h4>
                        <ResponsiveContainer width="100%" height={420}>
                          <BarChart data={familyWiseDataForMonth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="family" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "avgYield") return [`${round2(value)}%`, "Yield"];
                                if (name === "totalProduction") return [`${round2(value)} T`, "Production"];
                                return [round2(value), name];
                              }}
                            />
                            <Legend />
                            <Bar dataKey="avgYield" yAxisId="left" name="Avg Yield %" fill="#8b5cf6" />
                            <Bar dataKey="totalProduction" yAxisId="right" name="Production (T)" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Family-wise Pie Chart */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: "10px", fontSize: "14px", color: "#64748b" }}>
                          Revenue Distribution by Family
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={familyWiseDataForMonth}
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                              labelLine={false}
                              label={({ family, percent }) => `${family} (${(percent * 100).toFixed(0)}%)`}
                              dataKey="totalRevenue"
                            >
                              {familyWiseDataForMonth.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color || COLORS[entry.family] || "#8884d8"} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name, props) => [
                                <div>
                                  <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                                    {props.payload.family}
                                  </div>
                                  <div>
                                    Revenue : ₹{round2(value)}M
                                  </div>
                                </div>,
                                null
                              ]}
                              labelFormatter={() => null}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/*  Family-wise Table (below pie) */}
                    <div style={{ ...styles.modalSummaryWrapper, marginTop: "15px" }}>
                      <h4 style={{ marginBottom: "5px", fontSize: "14px", color: "#64748b" }}>Family Summary</h4>
                      <table style={styles.summaryTable}>
                        <thead>
                          <tr>
                            <th style={styles.summaryTableThTd}>Family</th>
                            <th style={styles.summaryTableThTd}>Dies Count</th>
                            <th style={styles.summaryTableThTd}>Avg Yield %</th>
                            <th style={styles.summaryTableThTd}>Total Revenue</th>
                            <th style={styles.summaryTableThTd}>Total Production</th>
                            <th style={styles.summaryTableThTd}>Total Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {familyWiseDataForMonth.map((family, idx) => (
                            <tr key={idx}>
                              <td style={styles.summaryTableThTd}>{family.family}</td>
                              <td style={styles.summaryTableThTd}>{family.count}</td>
                              <td style={styles.summaryTableThTd}>{family.avgYield.toFixed(2)}%</td>
                              <td style={styles.summaryTableThTd}>₹{round2(family.totalRevenue)}M</td>
                              <td style={styles.summaryTableThTd}>{family.totalProduction.toFixed(1)}T</td>
                              <td style={styles.summaryTableThTd}>{family.totalOrders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/*  Existing Die-wise Chart */}
                    <div style={{ marginTop: "25px" }}>
                      <h3 style={styles.modalSectionTitle}>Die-wise Performance</h3>
                      <ResponsiveContainer width="100%" height={420}>
                        <BarChart data={dieMonthlyApiData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="die_no" />
                          <YAxis
                            yAxisId="left"
                            tickFormatter={(v) => round2(v)}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(v) => round2(v)}
                          />
                          <Tooltip
                            formatter={(value, dataKey) => {
                              if (dataKey === "percent_yield") return [`${round2(value)}%`, "Yield %"];
                              if (dataKey === "tonnage") return [`${round2(value)} T`, "Production"];
                              return [round2(value), dataKey];
                            }}
                            labelFormatter={(label) => `Die: ${label}`}
                          />
                          <Legend />
                          <Bar
                            dataKey="percent_yield"
                            yAxisId="left"
                            name="Yield %"
                            fill="#8b5cf6"
                            cursor="pointer"
                            onClick={(e) => handleDieClick(e?.payload?.die_no)}
                          />
                          <Bar
                            dataKey="tonnage"
                            yAxisId="right"
                            name="Production (T)"
                            fill="#10b981"
                            cursor="pointer"
                            onClick={(e) => handleDieClick(e?.payload?.die_no)}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/*  Existing Detailed Table */}
                    <div style={styles.modalSummaryWrapper}>
                      <h3 style={styles.modalSectionTitle}>Die-wise Detailed Data</h3>
                      <table style={styles.summaryTable}>
                        <thead>
                          <tr>
                            <th style={styles.summaryTableThTd}>Die Number</th>
                            <th style={styles.summaryTableThTd}>Family</th>
                            <th style={styles.summaryTableThTd}>Yield %</th>
                            <th style={styles.summaryTableThTd}>Production (T)</th>
                            <th style={styles.summaryTableThTd}>Orders</th>
                            <th style={styles.summaryTableThTd}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dieMonthlyApiData.map((item, idx) =>
                            (
                              <tr key={idx}>
                                <td style={styles.summaryTableThTd}>{item.die_no}</td>
                                <td style={styles.summaryTableThTd}>{item.family}</td>
                                <td style={styles.summaryTableThTd}>{round2(item.percent_yield)}%</td>
                                <td style={styles.summaryTableThTd}>{round2(item.tonnage)} T</td>
                                <td style={styles.summaryTableThTd}>{item.orders || 0}</td>
                                <td style={styles.summaryTableThTd}>₹{round2(item.revenue)}M</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "40px", fontSize: "18px", color: "#555" }}>
                    ⚠ No die-wise data available for <b>{selectedMonth} {selectedYear}</b>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showDieMonthlyPopup && selectedDieFromDieTab && (
          <div style={styles.popupOverlay}>
            <div style={{ ...styles.popupContent, maxWidth: "520px", height: "auto" }}>

              {/* Header */}
              <div style={styles.popupHeader}>
                <h3>Die Details</h3>
                <button
                  style={styles.closeBtn}
                  onClick={() => {
                    setShowDieMonthlyPopup(false);
                    setSelectedDie(null);
                  }}
                >
                  ✖ Close
                </button>
              </div>

              {/* Die Details Card */}
              <div style={{ marginTop: "12px" }}>
                <table style={styles.summaryTable}>
                  <tbody>
                    <tr>
                      <td style={styles.summaryTableThTd}><b>Die Number</b></td>
                      <td style={styles.summaryTableThTd}>
                        {selectedDieFromDieTab.die_no}
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.summaryTableThTd}><b>Plant</b></td>
                      <td style={styles.summaryTableThTd}>
                        {selectedDieFromDieTab.plant_label}
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.summaryTableThTd}><b>Family</b></td>
                      <td style={styles.summaryTableThTd}>
                        {selectedDieFromDieTab.family || "No Family"}
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.summaryTableThTd}><b>Yield %</b></td>
                      <td style={styles.summaryTableThTd}>
                        {selectedDieFromDieTab.percent_yield.toFixed(2)}%
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.summaryTableThTd}><b>Total Production</b></td>
                      <td style={styles.summaryTableThTd}>
                        {selectedDieFromDieTab.tonnage.toFixed(3)} T
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.summaryTableThTd}><b>Total Orders</b></td>
                      <td style={styles.summaryTableThTd}>
                        {selectedDieFromDieTab.orders}
                      </td>
                    </tr>
                    <tr>
                      <td style={styles.summaryTableThTd}><b>Month/Year</b></td>
                      <td style={styles.summaryTableThTd}>
                        {dieMonth}/{dieYear}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= MASTER DATA POPUP ================= */}
        <MasterDataPopup
          show={showMasterPopup}
          onClose={() => setShowMasterPopup(false)}
        />
        <ComparisonPopup
          show={showComparisonPopup}
          onClose={() => setShowComparisonPopup(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;

/* ======================= STYLES ======================= */
const styles = {
  layout: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)", // light indigo
    padding: "5px",
  },
header: {
  top: 0,
  zIndex: 1000,
  height: "46px",
  width: "100%",
  background: "linear-gradient(90deg, #38bdf8, #0ea5e9)",
  padding: "0px 16px",
  borderRadius: "10px",
  marginBottom: "5px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  display: "flex",
  alignItems: "center",   // vertical centering
  position: "relative",
  overflow: "hidden"    // prevents content from stretching it
},
headerLeft: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  height: "100%",
},

headerLogo: {
  width: "60px",
  height: "60px",
  objectFit: "contain",
  borderRadius: "6px",
},

headerText: {
  margin: 0,
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "white",
},

  plantOverviewFixed: {
    background: "white",
    borderRadius: "10px",
    padding: "3px",
    marginBottom: "6px",
    position: "relative",
    border: "1px solid #e5e7eb",     // soft grey border
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)", // VERY soft shadow
  },

  clearButton: {
    background: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "4.5px 9px",
    borderRadius: "6.5px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    position: "absolute",   // Fixed on top-right
    top: "5px",
    right: "5px"
  },
cardGrid: {
  display: "flex",
  gap: "8px",
  padding: "4px",
  flexWrap: "wrap",
  justifyContent: "flex-start",
},

plantCard: {
  background: "linear-gradient(135deg, #fafaff, #eef2ff)",  // ultra-soft light indigo
  borderRadius: "12px",
  padding: "5px",
  width: "150px",
  height: "120px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: "500",
  border: "1px solid #e0e7ff",      // soft indigo border
  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)", // very soft neutral shadow
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer",
},

plantCardActive: {
  background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
  border: "2px solid #38bdf8",
  boxShadow: "0 3px 8px rgba(56, 189, 248, 0.35)",
},

  tabs: { display: "flex", gap: "6px", marginTop: "4px" },

  tab: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",    // visible soft border
    background: "#ffffff",          // pure white for clarity
    color: "#374151",               // darker text for contrast
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
 activeTab: {
  background: "#e0f2fe",
  color: "#075985",
  border: "1px solid #38bdf8",
  fontWeight: "600",
},
  contentArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e5e7eb",        // soft border
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", // light shadow for depth
  },
  splitView: { display: "flex", flex: 1, gap: "6px" },
  pane: {
    flex: "0 0 30%",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "10px",
    padding: "10px",
  },
  paneRight: {
    flex: "0 0 70%",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "10px",
    padding: "10px",
    minHeight: "520px",
  },

  kpiCard: {
   background: "linear-gradient(135deg, #ffffff, #f3f4f6)",  // Modern light gradient
   borderRadius: "12px",
   padding: "6px",
   height: "80px",
   display: "flex",
   flexDirection: "column",
   justifyContent: "center",
   alignItems: "center",
   fontSize: "14px",
   fontWeight: "500",
   boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
   border: "1px solid #e5e7eb",
   transition: "transform 0.2s ease, box-shadow 0.2s ease",
   cursor: "pointer",
  },

  familyHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  familyToggleGroup: {
    display: "flex",
    gap: "6px",
  },
  familyToggleBtn: {
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    background: "#f3f4f6",
    cursor: "pointer",
    fontSize: "12px",
  },
  familyToggleBtnActive: {
    background: "#4f46e5",
    color: "white",
    borderColor: "#4f46e5",
  },
  familyTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "8px",
    fontSize: "13px",
  },

  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
popupContent: {
  width: "96%",      // widened
  height: "92%",     // taller
  background: "white",
  borderRadius: "12px",
  padding: "18px",   // Slightly more padding
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
},

  popupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    background: "#ff4d4d",
    border: "none",
    borderRadius: "6px",
    padding: "5px 10px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  backBtn: {
    background: "#6b7280",
    border: "none",
    borderRadius: "6px",
    padding: "5px 10px",
    color: "white",
    cursor: "pointer",
    marginRight: "8px",
    fontWeight: "bold",
  },

modalSectionTitle: {
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "6px"
},
modalStats: {
  background: "white",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  marginTop: "10px",
  padding: "10px 0",
  borderTop: "1px solid #e2e8f0",
  flexWrap: "nowrap",        // no wrapping
  overflowX: "auto",         // allow scrolling if too wide
  scrollBehavior:"smooth",
},
statItem: {
  background: "#f9fafb",
  padding: "10px",
  borderRadius: "8px",
  textAlign: "center",
  minWidth: "160px",
  flexShrink: 0,
  marginRight: "10px",
},

statLabel: {
  fontSize: "13px",
  color: "#6b7280"
},
statValue: {
  fontSize: "15px",
  fontWeight: "600"
},
modalSummaryWrapper: {
  marginTop: "15px",
  width: "100%",
},

summaryTable: {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0px",
  marginTop: "8px",
  fontSize: "14px",
  textAlign: "center",
},

summaryTableThTd: {
  border: "1px solid #e5e7eb",
  padding: "8px",
  textAlign: "center",
  fontWeight: "500",
},
modal: {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

tableContainer: { marginTop: "8px" },
table: { width: "100%", borderCollapse: "collapse" },
th: { border: "1px solid #e5e7eb", padding: "6px", background: "#f1f5f9" },
td: { border: "1px solid #e5e7eb", padding: "6px" },
chartCard: { background: "white", borderRadius: "10px", padding: "10px", marginTop: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
chartHeader: { marginBottom: "6px" },
chartTitle: { fontSize: "15px", fontWeight: "600" },
chartSubtitle: { fontSize: "12px", color: "#6b7280" },
tableRow: { cursor: "pointer" },
statusBadge: { borderRadius: "6px", padding: "2px 6px" },
goodBadge: { backgroundColor: "#dcfce7", color: "#16a34a" },
warningBadge: { backgroundColor: "#fef9c3", color: "#d97706" },
criticalBadge: { backgroundColor: "#fee2e2", color: "#dc2626" },

dieWeightContainer: {
  padding: "20px",
},

dieWeightSearchCard: {
  background: "white",
  padding: "12px 16px",
  borderRadius: "10px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  maxWidth: "380px",
  margin: "0 auto 15px auto",
  textAlign: "center",
},

dieWeightSearchTitle: {
  marginBottom: "10px",
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
},

dieWeightInput: {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  width: "200px",
  fontSize: "13px",
},

dieWeightSearchBtn: {
  padding: "8px 12px",
  background: "#4f46e5",
  color: "white",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  boxShadow: "0 1px 4px rgba(79,70,229,0.25)",
},

dieWeightTableWrapper: {
  overflowX: "auto",
  marginTop: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
},

dieWeightTable: {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: "10px",
  overflow: "hidden",
  fontSize: "14px",
},

dieWeightTableHeader: {
  background: "#f1f5f9",
  fontWeight: "600",
  color: "#1e293b",
},

dieWeightTableCell: {
  border: "1px solid #e5e7eb",
  padding: "10px",
  textAlign: "center",
},
kpiCardYield: {
  background: "linear-gradient(135deg, #d1fae5, #b3f1d3)",
  border: "1px solid #a5e6c4",
},

kpiCardDies: {
  background: "linear-gradient(135deg, #f1e9ff, #e6d8ff)",
  border: "1px solid #d8c4ff",
},

kpiCardProd: {
  background: "linear-gradient(135deg, #fef3c7, #fde493)",
  border: "1px solid #f9d97b",
},

kpiCardRevenue: {
  background: "linear-gradient(135deg, #ffe4e6, #fecdd5)",
  border: "1px solid #f7b4bd",
},

masterEditBtn: {
  background: "#dbeafe",
  color: "#4f46e5",
  padding: "5px 10px",
  borderRadius: "3px",
  border: "none",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
},

kpiCardBase: {
  borderRadius: "14px",
  padding: "16px 18px",
  height: "105px",
  display: "flex",
  alignItems: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  border: "1px solid rgba(255,255,255,0.4)",
  backdropFilter: "blur(6px)",
  background: "rgba(255,255,255,0.65)",   // glass-like subtle sheen
  cursor: "pointer",
  transition: "all 0.25s ease",
},
kpiContent: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  gap: "12px",
},
kpiLabel: {
  margin: 0,
  fontSize: "15px",
  fontWeight: "600",
  color: "#475569",
  opacity: 0.75,
  textAlign: "center",
  whiteSpace: "nowrap",
},
kpiValue: {
  margin: 0,
  fontSize: "38px",
  fontWeight: "800",
  letterSpacing: "-1px",
  lineHeight: "1",
  flex: 1,
},
kpiIcon: {
  width: "45px",
  height: "45px",
  borderRadius: "10px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "18px",
  boxShadow: "inset 0 0 4px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.7)",
  marginBottom: "4px",
},
kpiRightColumn: {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  minWidth: "70px",
},
kpiGrid: {
  display: "flex",
  flexDirection: "column",
  gap: "10px",          // spacing between KPI cards
  marginBottom: "10px", // optional extra bottom padding
},

sectionHeader: {
  marginTop: "15px",
  marginBottom: "8px",
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
},
masterLabel: {
  fontSize: "13px",
  fontWeight: "500",
  color: "#475569",
  marginBottom: "4px",
  display: "block",
},
plantOverviewTitle: {
  margin: "0 0 6px 4px",
  fontSize: "17px",
  fontWeight: "700",
  color: "#1e293b",
  padding: "8px 16px",
  borderRadius: "12px",
  background: "rgba(99,102,241,0.12)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(99,102,241,0.25)",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
},
headerTitleCentered: {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  margin: 0,
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "white",
  whiteSpace: "nowrap",
},
familyFilterSelect: {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  background: "#ffffff",
  cursor: "pointer",
},
  comparisonBtn: {
    background: "#ecfeff",
    color: "#0f766e",
    padding: "5px 10px",
    borderRadius: "3px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  },
  logoutBtn: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "5px 10px",
    borderRadius: "3px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  },
  headerRight: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },


};
