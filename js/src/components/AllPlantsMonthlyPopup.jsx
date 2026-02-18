import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";


/* ---------- PLANT LIST ---------- */
const PLANTS = [
  { code: 2101, label: "R2" },
  { code: 7001, label: "Mundhwa" },
  { code: 7026, label: "R1" },
  { code: 7028, label: "Baramati" }
];

/* ---------- GET CURRENT FINANCIAL YEAR ---------- */
function getCurrentFinancialYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

/* ---------- ROUND FUNCTION ---------- */
const round2 = (val) => Number.parseFloat(val || 0).toFixed(2);

/* ====================== COMPONENT ====================== */
const AllPlantsMonthlyPopup = ({ show, onClose }) => {

  const currentFY = getCurrentFinancialYear();
  const [selectedYear, setSelectedYear] = useState(currentFY);
  const [plantMonthlyData, setPlantMonthlyData] = useState({});

  /* ---------- LAST 5 FINANCIAL YEARS ---------- */
  const last5Years = [];

  for (let i = 0; i < 5; i++) {
    last5Years.push(currentFY - i);
  }

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    if (!show) return;
    async function fetchAllPlants() {
      try {
        /* Parallel API calls for faster loading */
        const promises = PLANTS.map(async (plant) => {
          try {
            const url =
              "https://ktflceprd.kalyanicorp.com/internal/yield_dashboard_monthly"
              + "?year=" + selectedYear
              + "&plant_code=" + plant.code;
            const resp = await fetch(url);
            const data = await resp.json();
            const formatted = data.map((item) => ({
              month: new Date(item.year_month + "-01")
                .toLocaleString("en-US", { month: "short" }),
              avgYield: Number(round2(item.yield_pct)),
              totalProduction: Number(round2(item.total_tonnage))
            }));
            return { plant: plant.label, data: formatted };
          } catch {
            return { plant: plant.label, data: [] };
          }
        });

        const results = await Promise.all(promises);

        const resultObj = {};
        results.forEach(r => {
          resultObj[r.plant] = r.data;
        });
        setPlantMonthlyData(resultObj);
      }
      catch (err) {
        console.error("Error loading plant monthly data:", err);
      }
    }
    fetchAllPlants();
  }, [show, selectedYear]);

  if (!show) return null;

  /* ---------- CHART OPTIONS ---------- */
function createChartOptions(plantName, data) {

  return {

    chart: {
      height: 320
    },

    title: {
      text: "Monthly Performance – " + plantName,
      style: {
        fontSize: "18px",
        fontWeight: "600"
      }
    },

    xAxis: {
      categories: data.map(d => d.month),
      crosshair: true,
      labels: {
        style: {
          fontSize: "13px",
          fontWeight: "500"
        }
      }
    },

    yAxis: [
      {
        labels: {
          format: "{value}%",
          style: {
            color: "#16a34a",
            fontSize: "13px",
            fontWeight: "500"
          }
        },

        title: {
          text: "Yield (%)",
          style: {
            color: "#16a34a",
            fontSize: "14px",
            fontWeight: "600"
          }
        },

        opposite: true
      },

      {
        labels: {
          format: "{value} T",
          style: {
            color: "#38bdf8",
            fontSize: "13px",
            fontWeight: "500"
          }
        },

        title: {
          text: "Production (T)",
          style: {
            color: "#38bdf8",
            fontSize: "14px",
            fontWeight: "600"
          }
        }
      }
    ],

    tooltip: {
      shared: true,
      valueDecimals: 2
    },

    legend: {
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        fontSize: "14px",
        fontWeight: "500"
      }
    },

    plotOptions: {
      series: {
        states: {
          inactive: {
            enabled: false,
            opacity: 1
          },
          hover: {
            enabled: true,
            opacity: 1
          }
        }
      },

      column: {
        states: {
          inactive: {
            enabled: false,
            opacity: 1
          }
        }
      },

      spline: {
        states: {
          inactive: {
            enabled: false,
            opacity: 1
          }
        },
        marker: {
          enabled: true,
          radius: 4
        }
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
        name: "Yield (%)",
        type: "spline",
        yAxis: 0,
        data: data.map(d => d.avgYield),
        color: "#16a34a",
        tooltip: {
          valueSuffix: "%"
        }
      }
    ]

  };

}


  /* ====================== UI ====================== */
  return (

    <div style={overlayStyle}>
      <div style={popupStyle}>

        {/* HEADER */}
        <div style={headerStyle}>

          <div style={headerLeftStyle}>
            <h3 style={{ margin: 0 }}>
              All Plants Monthly Performance
            </h3>

            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(Number(e.target.value))
              }
              style={dropdownStyle}
            >
              {last5Years.map(fy => (
                <option key={fy} value={fy}>
                  {fy}-{fy + 1}
                </option>
              ))}
            </select>
          </div>

          <button
            style={closeBtnStyle}
            onClick={onClose}
          >
            ✖ Close
          </button>
        </div>

        {/* CHART LIST */}
        <div style={chartContainerStyle}>
          {Object.keys(plantMonthlyData).map(plant => (
            <div
              key={plant}
              style={chartWrapperStyle}
            >
              <HighchartsReact
                highcharts={Highcharts}
                options={createChartOptions(
                  plant,
                  plantMonthlyData[plant]
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

};

export default AllPlantsMonthlyPopup;

/* ======================= STYLES ======================= */
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const popupStyle = {
  width: "95%",
  height: "95%",
  background: "white",
  borderRadius: "12px",
  padding: "18px",
  display: "flex",
  flexDirection: "column"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px"
};

const headerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

const dropdownStyle = {
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  height: "28px",
  cursor: "pointer"
};

const chartContainerStyle = {
  overflowY: "auto",
  height: "100%",
  paddingRight: "5px"
};

const chartWrapperStyle = {
  marginBottom: "40px"
};

const closeBtnStyle = {
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  border: "none",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  height: "28px",
  minWidth: "65px",
  padding: "0px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(239,68,68,0.35)"
};
