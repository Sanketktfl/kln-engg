import React, { useEffect, useState } from "react";

const DieWeightBar = () => {
  const [weights, setWeights] = useState(null);
  const [dieInput, setDieInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------- FETCH FROM API (ONLY AFTER 4 CHARS) ---------- */
  useEffect(() => {
    if (dieInput.trim().length < 3) {
      setWeights(null);
      setError("");
      return;
    }

    const fetchWeights = async () => {
      setLoading(true);
      setError("");

      try {
        const filter = encodeURIComponent(
          `die_number eq '${dieInput.trim()}'`
        );

        const url = `http://localhost:8080/api/v1/collection/kln_master_data?$filter=${filter}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (!data.objects || data.objects.length === 0) {
          setWeights(null);
          setError("Die number not found");
          return;
        }
        // remove system fields
        const raw = data.objects[0];
        const cleaned = Object.fromEntries(
          Object.entries(raw).filter(
            ([key]) => !key.startsWith("@") && !key.startsWith("system:")
          )
        );
        setWeights(cleaned);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchWeights();
  }, [dieInput]);

  /* ---------- LABEL CONFIG ---------- */
  const labels = [
    { label: "Cut Weight", key: "cut_wt" },
    { label: "Burr Weight", key: "burr_wt" },
    { label: "Net Weight", key: "net_wt" },
    { label: "Gross Weight", key: "gross_wt" },
    { label: "Flash Slug Weight", key: "flash_slug_wt" },
    { label: "Machining Weight", key: "machining_wt" },
    { label: "End PC Weight", key: "endpc_wt" }
  ];
  const weightValues = labels.map(
    (item) => Number(weights?.[item.key] ?? 0)
  );
  const totalWeight = weightValues.reduce((a, b) => a + b, 0);
  /* ---------- BAR CALC ---------- */
  const BAR_WIDTH = 1200;
  const BAR_START = 100;
  const BAR_HEIGHT = 100;
  const MIN_SEGMENT = 80;
  let rawWidths = weightValues.map((w) =>
    totalWeight === 0 ? MIN_SEGMENT : (w / totalWeight) * BAR_WIDTH
  );
  rawWidths = rawWidths.map((w) => Math.max(w, MIN_SEGMENT));

  const scale =
    BAR_WIDTH / rawWidths.reduce((a, b) => a + b, 0);

  const segmentWidths = rawWidths.map((w) => w * scale);

  let xCursor = BAR_START;
  const segmentX = segmentWidths.map((w) => {
    const x = xCursor;
    xCursor += w;
    return x;
  });

  return (
  <div style={{ width: "100%", textAlign: "center", paddingTop: "10px" }}>
    {/* ---------- DIE INPUT (COMPACT & ALWAYS VISIBLE) ---------- */}
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#1e293b"
        }}
      >
        Enter Die Number
      </label>
      <br />
      <input
        value={dieInput}
        onChange={(e) => setDieInput(e.target.value)}
        style={{
          marginTop: "6px",
          padding: "6px 12px",
          fontSize: "15px",
          borderRadius: "6px",
          border: "1.5px solid #334155",
          width: "200px",
          textAlign: "center",
          fontWeight: 600
        }}
      />
      {loading && (
        <div style={{ marginTop: "4px", fontSize: "13px" }}>
          Loading…
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: "4px",
            color: "red",
            fontWeight: 600,
            fontSize: "13px"
          }}
        >
          {error}
        </div>
      )}
    </div>

    {/* ---------- BAR (MOVED UP & COMPACT) ---------- */}
    {weights && (
      <svg
        viewBox="0 0 1400 320"
        width="100%"
        height="260"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b4513" />
            <stop offset="50%" stopColor="#c2a28c" />
            <stop offset="100%" stopColor="#8b4513" />
          </linearGradient>
        </defs>

        {labels.map((item, i) => {
          const x = segmentX[i];
          const w = segmentWidths[i];
          const cx = x + w / 2;

          return (
            <g key={item.key}>
              <rect
                x={x}
                y={140}              // bar moved UP
                width={w}
                height={BAR_HEIGHT}
                fill="url(#steelGrad)"
                stroke="#444"
              />
              <text
                x={cx}
                y={105}                 // move label UP
                textAnchor="middle"
                fontSize="15"
                fontWeight="600"
                fill="#1e40af"
              >
                {item.label.split(" ").map((word, idx) => (
                  <tspan
                    key={idx}
                    x={cx}
                    dy={idx === 0 ? 0 : 14}   // tighter line spacing
                  >
                    {word}
                  </tspan>
                ))}
              </text>
              <text
                x={cx}
                y={190}             // centered value
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
              >
                {weightValues[i]} kg
              </text>
            </g>
          );
        })}
      </svg>
    )}
  </div>
);
};

export default DieWeightBar;
