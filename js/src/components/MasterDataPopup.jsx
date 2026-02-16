import React, { useState, useEffect } from "react";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const MasterDataPopup = ({ show, onClose }) => {

  const [masterTab, setMasterTab] = useState("edit"); // "edit" | "create"
  const [masterSearchNo, setMasterSearchNo] = useState("");
  const [masterResult, setMasterResult] = useState(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState("");
  const [masterRaw, setMasterRaw] = useState(null);
  const [targetPlant, setTargetPlant] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetId, setTargetId] = useState(null);
  const [masterList, setMasterList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);


const [createForm, setCreateForm] = useState({
  plant_code: "",
  die_number: "",
  forge_press: "",
  cycle_time: "",

  customer_name: "",
  part_name: "",

  cut_wt: "",
  burr_wt: "",
  flash_slug_wt: "",
  endpc_wt: "",
  gross_wt: "",
  net_wt: "",
  machining_wt: "",

  forge_price: "",
  forge_scrap_price: "",
  rm_rate_kg: "",

  r_code: "",
  rm_grade: "",
  rm_section: "",
  cut_length: ""
});


const fetchMasterList = async (pageNo = 1) => {
  setListLoading(true);

  try {
    const skip = (pageNo - 1) * pageSize;

    const url =
      `http://localhost:8080/api/v1/collection/kln_master_data` +
      `?$skip=${skip}&$top=${pageSize}`;

    const resp = await fetch(url);
    const data = await resp.json();

    const cleaned = data.objects.map(obj =>
      Object.fromEntries(
        Object.entries(obj).filter(
          ([key]) =>
            !key.startsWith("@") &&
            !key.startsWith("system:")
        )
      )
    );

    setMasterList(cleaned);

    // CONTACT returns total_count
    setTotalRecords(data.total_count || cleaned.length);

  } catch (err) {
    console.error("List fetch error", err);
  } finally {
    setListLoading(false);
  }
};

useEffect(() => {
  if (masterTab !== "edit") return;

  if (masterSearchNo.trim() === "") {
    fetchMasterList(page);   // show full list
  } else {
    searchMasterList(masterSearchNo);   // show filtered list
  }

}, [masterSearchNo, masterTab, page]);


const searchMasterList = async (dieNo) => {

  setListLoading(true);

  try {

    const filter =
      encodeURIComponent(`startswith(die_number,'${dieNo}')`);

    const url =
      `http://localhost:8080/api/v1/collection/kln_master_data` +
      `?$filter=${filter}&$top=${pageSize}`;

    const resp = await fetch(url);
    const data = await resp.json();

    const cleaned = data.objects.map(obj =>
      Object.fromEntries(
        Object.entries(obj).filter(
          ([key]) =>
            !key.startsWith("@") &&
            !key.startsWith("system:")
        )
      )
    );

    setMasterList(cleaned);

    setTotalRecords(data.total_count || cleaned.length);

  } catch (err) {

    console.error("Search error:", err);

  } finally {

    setListLoading(false);

  }
};


const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
const cancelEdit = () => {
  setMasterResult(null);
  setMasterRaw(null);
  setMasterSearchNo("");
  setMasterError("");

  // reload list again
  fetchMasterList(page);
};



  const fetchTarget = async (plant) => {
    if (!plant) return;


    try {
      const resp = await fetch("http://localhost:8080/api/v1/collection/kln_yield_target");
      const data = await resp.json();

      const match = data.objects.find(
        o => o.plant_code == plant
      );

      if (match) {
        setTargetValue(match.yield_target);
        setTargetId(match["@id"]);   // for PUT
      } else {
        setTargetValue("");
        setTargetId(null);           // means new record (POST)
      }
    } catch (e) {
      console.error("Target fetch error", e);
    }
  };
  useEffect(() => {
    if (masterTab === "target") {
      fetchTarget(targetPlant);
    }
  }, [masterTab, targetPlant]);

  const saveTarget = async () => {
    if (!targetPlant || !targetValue) {
      alert("Please select plant and enter target");
      return;
    }

    const payload = {
      plant_code: Number(targetPlant),
      yield_target: Number(targetValue),
    };

    try {
      const authOptions = await getAuthHeadersWithCSRF_Target();

      if (targetId) {
        // UPDATE
        await fetch(targetId, {
          method: "PUT",
          ...authOptions,
          body: JSON.stringify(payload),
        });
        alert("Target updated successfully");
      } else {
        // CREATE
        await fetch(
          "http://localhost:8080/api/v1/collection/kln_yield_target",
          {
            method: "POST",
            ...authOptions,
            body: JSON.stringify(payload),
          }
        );
        alert("Target created successfully");
      }
    } catch (e) {
      console.error("Save target error", e);
      alert("Failed to save target");
    }
  };


  const fetchMasterRecord = async (dieNoParam = null) => {
      const dieNo = dieNoParam || masterSearchNo;
      if (!dieNo.trim()) {
      setMasterError("Enter a die number");
      return;
    }

    setMasterLoading(true);
    setMasterError("");

    try {
      const filter = encodeURIComponent(`die_number eq '${dieNo}'`);
      const url = `http://localhost:8080/api/v1/collection/kln_master_data?$filter=${filter}`;

      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.objects || data.objects.length === 0) {
        setMasterError("No record found");
        setMasterResult(null);
        return;
      }

      const raw = data.objects[0];                     // keep original
      const cleaned = Object.fromEntries(             // cleaned for UI
        Object.entries(raw).filter(
          ([key]) =>
            !key.startsWith("@") &&
            !key.startsWith("system:")
        )
      );

      setMasterRaw(raw);       // 🔥 RAW contains @id for PATCH
      setMasterResult(cleaned);

    } catch (err) {
      console.error("Master fetch error:", err);
      setMasterError("Failed to load data");
    } finally {
      setMasterLoading(false);
    }
  };

  const updateMasterRecord = async () => {
    if (!masterRaw || !masterRaw["@id"]) {
      alert("No valid record to update");
      return;
    }

    const url = masterRaw["@id"];

    // convert string numbers → real numbers
    const payload = { ...masterResult };

    numericFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== "") {
        payload[field] = Number(payload[field]);
      }
    });

    try {
        const authOptions = await getAuthHeadersWithCSRF("PUT");
        const resp = await fetch(url, {
          method: "PUT",
          ...authOptions,
          body: JSON.stringify(payload),
        });

        if (!resp.ok) throw new Error("Update failed");

        alert("Master Data Updated Successfully!");

        // CLEAR FORM BUT KEEP POPUP OPEN
        setMasterResult(null);     // empty UI form
        setMasterRaw(null);        // clear raw
        setMasterSearchNo("");     // clear search box

      } catch (err) {
        console.error("Update error:", err);
        alert("Failed to update master data");
      }
    };

  const createMasterRecord = async () => {
    const payload = { ...createForm };

    // 1️⃣ Convert empty strings -> null
    Object.keys(payload).forEach(key => {
      if (payload[key] === "" || payload[key] === undefined) {
        payload[key] = null;
      }
    });

    // 2️⃣ Convert numeric fields into numbers
    numericFields.forEach(field => {
      if (payload[field] !== null) {
        payload[field] = Number(payload[field]);
      }
    });

    try {
        const authOptions = await getAuthHeadersWithCSRF("POST");
      const resp = await fetch(
        "http://localhost:8080/api/v1/collection/kln_master_data",
        {
          method: "POST",
          ...authOptions,
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) throw new Error("Create failed");

      alert("Master Data Created Successfully!");

      // 🔥 Reset form EXACTLY like EDIT reset
      setCreateForm({
        die_number: "",
        plant_code: "",
        customer_name: "",
        part_name: "",
        r_code: "",
        forge_press: "",
        rm_grade: "",
        rm_section: "",
        rm_rate_kg: "",
        cut_wt: "",
        burr_wt: "",
        flash_slug_wt: "",
        endpc_wt: "",
        gross_wt: "",
        net_wt: "",
        machining_wt: "",
        cycle_time: "",
        forge_price: "",
        forge_scrap_price: "",
        currency: "",
        country: "",
        kam: "",
      });

    } catch (err) {
      console.error("Create error:", err);
      alert("Failed to create master data");
    }
  };

  const getAuthHeadersWithCSRF = async (method = "GET", contentType = true) => {
    const credentials = btoa("caddok:");
    // Step 1: Trigger cookie set
    await fetch("http://localhost:8080/api/v1/collection/kln_master_data", {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      credentials: "include",
    });

    // const csrfToken = getCookie("CSRFToken");
    // console.log("Fetched CSRF Token from cookie:", csrfToken);
    // if (!csrfToken) {
    //   throw new Error("CSRF token not found in cookies.");
    // }

    const headers = {
      Authorization: `Basic ${credentials}`,
      // "X-CSRF-Token": csrfToken,
    };

    if (contentType) {
      headers["Content-Type"] = "application/json";
    }

    return {
      headers,
      credentials: "include",
    };
  };

  const getAuthHeadersWithCSRF_Target = async () => {
  const credentials = btoa("caddok:");

  // 🔹 Trigger CSRF cookie for TARGET collection
  await fetch("http://localhost:8080/api/v1/collection/kln_yield_target", {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    credentials: "include",
  });

  // const csrfToken = getCookie("CSRFToken");
  // if (!csrfToken) throw new Error("CSRF token not found");

  const headers = {
    Authorization: `Basic ${credentials}`,
    // "X-CSRF-Token": csrfToken,
    "Content-Type": "application/json",
    "If-Match": "*",   // 🔴 mandatory for PUT / POST in CONTACT
  };

  return {
    headers,
    credentials: "include",
  };
};


const numericFields = [
  "plant_code",
  "forge_press",
  "cycle_time",
  "cut_wt",
  "burr_wt",
  "flash_slug_wt",
  "endpc_wt",
  "gross_wt",
  "net_wt",
  "machining_wt",
  "forge_price",
  "forge_scrap_price",
  "rm_rate_kg",
  "rm_section",
  "cut_length"
];


  const editFieldOrder = [
    "die_number",
    "plant_code",
    "customer_name",
    "part_name",
    "r_code",
    "forge_press",
    "rm_grade",
    "rm_section",
    "rm_rate_kg",
    "cut_wt",
    "burr_wt",
    "flash_slug_wt",
    "endpc_wt",
    "gross_wt",
    "net_wt",
    "machining_wt",
    "cycle_time",
    "forge_price",
    "forge_scrap_price",
    "currency",
    "country",
    "kam"
  ];


  if (!show) return null;
  return (
    <div style={masterStyles.popupOverlay}>
      <div style={masterStyles.masterPopup}>
        {/* HEADER */}
        <div style={masterStyles.masterPopupHeader}>
          <h3>Edit Form Data</h3>
          <button
            style={masterStyles.closeBtn}
            onClick={() => onClose()}
          >
            ✖
          </button>
        </div>
        {/* TABS */}
        <div style={masterStyles.masterTabRow}>
          <button
            style={{ ...masterStyles.masterTab, ...(masterTab === "edit" ? masterStyles.masterTabActive : {}) }}
            onClick={() => setMasterTab("edit")}
          >
            ✏️ Edit Master Data
          </button>
          <button
            style={{ ...masterStyles.masterTab, ...(masterTab === "create" ? masterStyles.masterTabActive : {}) }}
            onClick={() => setMasterTab("create")}
          >
            ➕ Create Master Data
          </button>
          <button
            style={{ ...masterStyles.masterTab, ...(masterTab === "target" ? masterStyles.masterTabActive : {}) }}
            onClick={() => setMasterTab("target")}
          >
            🎯 Edit Target
          </button>
        </div>

        {/* CONTENT */}
        <div style={masterStyles.masterContent}>
          {masterTab === "edit" ? (
            <div>
              <h4>Edit Master Data</h4>
              <p style={{ color: "#64748b" }}>Search by Die Number</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  placeholder="Enter Die Number…"
                  style={masterStyles.masterInput}
                  value={masterSearchNo}
                  onChange={(e) => setMasterSearchNo(e.target.value)}
                />

              </div>
              {masterError && <p style={{ color: "red" }}>{masterError}</p>}
              {masterLoading && <p>Loading...</p>}
              {/* SHOW LIST WHEN NO SEARCH */}
                {!masterResult && (
                  <div style={{ marginTop: "15px" }}>

                    <h4>All Die Master Data</h4>

                    {listLoading ? (
                      <p>Loading...</p>
                    ) : (
                      <>
                        <table style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginTop: "10px"
                        }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th style={thStyle}>Plant</th>
                              <th style={thStyle}>Die Number</th>
                              <th style={thStyle}>Part Name</th>
                              <th style={thStyle}>Forge Press</th>
                              <th style={thStyle}>Cycle Time</th>
                              <th style={thStyle}>Customer</th>
                            </tr>
                          </thead>

                          <tbody>
                          {masterList.map((row, i) => (
                            <tr
                              key={i}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setMasterSearchNo(row.die_number);
                                fetchMasterRecord(row.die_number);
                              }}
                            >
                              <td style={tdStyle}>{row.plant_code}</td>
                              <td style={tdStyle}>{row.die_number}</td>
                              <td style={tdStyle}>{row.part_name}</td>
                              <td style={tdStyle}>{row.forge_press}</td>
                              <td style={tdStyle}>{row.cycle_time}</td>
                              <td style={tdStyle}>{row.customer_name}</td>
                            </tr>
                          ))}
                        </tbody>
                        </table>

                        {/* PAGINATION */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "10px"
                        }}>
                          <button
                              disabled={page <= 1}
                              onClick={() => setPage(prev => Math.max(1, prev - 1))}
                              style={{
                                ...masterStyles.masterSaveBtn,
                                opacity: page <= 1 ? 0.5 : 1,
                                cursor: page <= 1 ? "not-allowed" : "pointer"
                              }}
                            >
                              Previous
                            </button>
                          <span>
                            Page {page} of {totalPages}
                          </span>
                          <button
                              disabled={page >= totalPages}
                              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                              style={{
                                ...masterStyles.masterSaveBtn,
                                opacity: page >= totalPages ? 0.5 : 1,
                                cursor: page >= totalPages ? "not-allowed" : "pointer"
                              }}
                            >
                              Next
                            </button>
                        </div>

                      </>
                    )}
                  </div>
                )}

              {masterResult && (
                <div style={masterStyles.masterFormCard}>
                  <h4>Editing: Die {masterResult.die_number}</h4>
                  {/* ================= SECTION A - MASTER DATA ================= */}
                    <h3 style={masterStyles.masterSectionTitle}>Master Data</h3>
                    <div style={masterStyles.masterFormGrid}>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Plant Code</label>
                        <input style={masterStyles.masterInput} value={masterResult.plant_code ?? ""} disabled />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Die Number</label>
                        <input style={masterStyles.masterInput} value={masterResult.die_number ?? ""} disabled />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Forging Press (T)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.forge_press ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, forge_press: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Cycle Time (sec)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.cycle_time ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, cycle_time: e.target.value })}
                        />
                      </div>
                    </div>
                    {/* ================= SECTION B - CUSTOMER ================= */}
                    <h3 style={masterStyles.masterSectionTitle}>Customer</h3>
                    <div style={masterStyles.masterFormGrid}>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Customer Name</label>
                        <input style={masterStyles.masterInput} value={masterResult.customer_name ?? ""} disabled />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Part Name</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.part_name ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, part_name: e.target.value })}
                        />
                      </div>
                    </div>
                    {/* ================= SECTION C - WEIGHT ================= */}
                    <h3 style={masterStyles.masterSectionTitle}>Weight</h3>
                    <div style={masterStyles.masterFormGrid}>
                      {[
                        ["Cut Weight (kg)", "cut_wt"],
                        ["Burr Weight (kg)", "burr_wt"],
                        ["Flash / Slug Weight (kg)", "flash_slug_wt"],
                        ["End Piece Weight (kg)", "endpc_wt"],
                        ["Gross Weight (kg)", "gross_wt"],
                        ["Net Weight (kg)", "net_wt"],
                        ["Machining Weight", "machining_wt"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <label style={masterStyles.masterCreateLabel}>{label}</label>
                          <input
                            style={masterStyles.masterInput}
                            value={masterResult[key] ?? ""}
                            onChange={(e) => setMasterResult({ ...masterResult, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    {/* ================= SECTION D - RATE ================= */}
                    <h3 style={masterStyles.masterSectionTitle}>Rate</h3>
                    <div style={masterStyles.masterFormGrid}>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Forging Rate (₹)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.forge_price ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, forge_price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Forge Scrap Rate (₹)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.forge_scrap_price ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, forge_scrap_price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>RM Rate / Kg (₹)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.rm_rate_kg ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, rm_rate_kg: e.target.value })}
                        />
                      </div>
                    </div>
                    {/* ================= SECTION E - Raw Material ================= */}
                    <h3 style={masterStyles.masterSectionTitle}>Raw Material</h3>
                    <div style={masterStyles.masterFormGrid}>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>R Code</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.r_code ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, r_code: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>RM Grade</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.rm_grade ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, rm_grade: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Section (mm)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.rm_section ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, rm_section: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={masterStyles.masterCreateLabel}>Cut Length (mm)</label>
                        <input
                          style={masterStyles.masterInput}
                          value={masterResult.cut_length ?? ""}
                          onChange={(e) => setMasterResult({ ...masterResult, cut_length: e.target.value })}
                        />
                      </div>
                    </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    style={masterStyles.masterSaveBtn}
                    onClick={updateMasterRecord}
                  >
                    Save Changes
                  </button>
                  <button
                    style={{
                      background: "#64748b",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
                </div>
              )}
              </div>
          ) : masterTab === "create" ? (
            <div style={masterStyles.masterFormCard}>
              <h4>Create New Master Data</h4>
              {/* ================= SECTION A - MASTER DATA ================= */}
              <h3 style={masterStyles.masterSectionTitle}>Master Data</h3>
              <div style={masterStyles.masterFormGrid}>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Plant Code*</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.plant_code}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, plant_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Die Number*</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.die_number}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, die_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Forging Press (T)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.forge_press}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, forge_press: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Cycle Time (sec)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.cycle_time}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, cycle_time: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* ================= SECTION B - CUSTOMER ================= */}
              <h3 style={masterStyles.masterSectionTitle}>Customer</h3>
              <div style={masterStyles.masterFormGrid}>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Customer Name*</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.customer_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, customer_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Part Name</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.part_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, part_name: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* ================= SECTION C - WEIGHT ================= */}
              <h3 style={masterStyles.masterSectionTitle}>Weight</h3>
              <div style={masterStyles.masterFormGrid}>
                {[
                  ["Cut Weight (kg)", "cut_wt"],
                  ["Burr Weight (kg)", "burr_wt"],
                  ["Flash / Slug Weight (kg)", "flash_slug_wt"],
                  ["End Piece Weight (kg)", "endpc_wt"],
                  ["Gross Weight (kg)", "gross_wt"],
                  ["Net Weight (kg)", "net_wt"],
                  ["Machining Weight", "machining_wt"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={masterStyles.masterCreateLabel}>{label}</label>
                    <input
                      style={masterStyles.masterInput}
                      value={createForm[key]}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              {/* ================= SECTION D - RATE ================= */}
              <h3 style={masterStyles.masterSectionTitle}>Rate</h3>
              <div style={masterStyles.masterFormGrid}>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Forging Rate (₹)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.forge_price}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, forge_price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Forge Scrap Rate (₹)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.forge_scrap_price}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        forge_scrap_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>RM Rate / Kg (₹)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.rm_rate_kg}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, rm_rate_kg: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* ================= SECTION E - RAW MATERIAL ================= */}
              <h3 style={masterStyles.masterSectionTitle}>Raw Material</h3>
              <div style={masterStyles.masterFormGrid}>
                <div>
                  <label style={masterStyles.masterCreateLabel}>R Code</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.r_code}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, r_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>RM Grade</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.rm_grade}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, rm_grade: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Section (mm)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.rm_section}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, rm_section: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Cut Length (mm)</label>
                  <input
                    style={masterStyles.masterInput}
                    value={createForm.cut_length}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, cut_length: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* CREATE BUTTON */}
              <button
                style={{ ...masterStyles.masterSaveBtn, marginTop: "16px" }}
                onClick={createMasterRecord}
              >
                Create Record
              </button>
            </div>
          ) : (
            <div style={masterStyles.masterFormCard}>
              <h3>Edit Plant Yield Target</h3>
              <div style={masterStyles.masterFormGrid}>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Plant Code</label>
                  <select
                    style={masterStyles.masterInput}
                    value={targetPlant}
                    onChange={(e) => setTargetPlant(e.target.value)}
                  >
                    <option value="">-- Select Plant --</option>
                    <option value="2101">2101 (R2)</option>
                    <option value="7001">7001 (Mundhwa)</option>
                    <option value="7026">7026 (R1)</option>
                    <option value="7028">7028 (Baramati)</option>
                  </select>
                </div>
                <div>
                  <label style={masterStyles.masterCreateLabel}>Yield Target (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    style={masterStyles.masterInput}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>
              </div>
              <button
                style={{ ...masterStyles.masterSaveBtn, marginTop: "16px" }}
                onClick={saveTarget}
              >
                {targetId ? "Update Target" : "Create Target"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDataPopup;
const masterStyles = {
  masterPopup: {
    width: "75%",
    height: "90%",
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  masterPopupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  masterTabRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },
  masterTab: {
    padding: "8px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: "500",
  },

  masterTabActive: {
    background: "#64748b",
    borderColor: "#64748b",
    color: "white",
  },
  masterContent: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    boxShadow: "inset 0 0 6px rgba(0,0,0,0.05)",
    borderRadius: "6px",
  },
  masterInput: {
    width: "100%",
    padding: "9px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#ffffff",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
    outline: "none",
  },
  masterSaveBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 2px 6px rgba(16,185,129,0.35)",
  },
  masterFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  masterFormCard: {
    background: "linear-gradient(180deg, #ffffff, #f8fafc)",
    borderRadius: "12px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  masterSectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "20px",
    marginBottom: "10px",
    color: "#334155",                // softer than black
    paddingBottom: "6px",
    borderBottom: "1px dashed #e2e8f0", // dashed = lighter feel
  },
  masterCreateLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#64748b",
    marginBottom: "4px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
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
  closeBtn: {
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },

};

const thStyle = {
  border: "1px solid #e2e8f0",
  padding: "8px",
  textAlign: "left"
};

const tdStyle = {
  border: "1px solid #e2e8f0",
  padding: "8px"
};
