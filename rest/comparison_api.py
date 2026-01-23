from cs.platform.web import JsonAPI
from cs.platform.web.root import Internal
from cdb import sqlapi
from datetime import datetime

# ================= DIE-COMPARISON ==================
class YieldDashboardDie(JsonAPI):
    pass
@Internal.mount(app=YieldDashboardDie, path="yield_comp_die")
def _mount_app():
    return YieldDashboardDie()

class YieldDashboardDieData:
    def yield_die_comparison(self, filters=None):
        if not filters:
            filters = {}
        sqldata = """
            SELECT pre_die_no, total_order_qty, total_tonnage, yield_pct, family, year_month
            FROM prodd_yield_die_agg
            WHERE 1=1
        """
        # Die filter
        if filters.get('die_no'):
            sqldata += f" AND pre_die_no = '{filters['die_no']}'"

        # Financial Year filter
        if filters.get('year'):
            sqldata += f"""
                AND (
                    CASE 
                        WHEN CAST(SUBSTRING(year_month,6,2) AS INT) >= 4 
                        THEN CAST(LEFT(year_month,4) AS INT)
                        ELSE CAST(LEFT(year_month,4) AS INT) - 1
                    END
                ) = {filters['year']}
            """
        # Month filter
        if filters.get('month'):
            sqldata += f" AND RIGHT(year_month,2) = '{filters['month'].zfill(2)}'"
        # Quarter filter (FY based)
        if filters.get('quarter'):
            q = filters['quarter']
            fy = int(filters['year'])

            if q == "Q1":    #Apr-Jun (FY year)
                sqldata += f"""AND year_month BETWEEN '{fy}-04' AND '{fy}-06'"""
            elif q == "Q2":    # Jul-Sep (FY year)
                sqldata += f" AND year_month BETWEEN '{fy}-07' AND '{fy}-09'"
            elif q == "Q3":  # Oct-Dec (FY year)
                sqldata += f" AND year_month BETWEEN '{fy}-10' AND '{fy}-12'"
            elif q == "Q4":  # Jan-Mar (next calendar year but same FY)
                sqldata += f" AND year_month BETWEEN '{fy + 1}-01' AND '{fy + 1}-03'"

        recordset = sqlapi.RecordSet2(sql=sqldata)
        return [{col: rec[col] for col in rec.keys()} for rec in recordset]

@YieldDashboardDie.path(model=YieldDashboardDieData, path="")
def _path():
    return YieldDashboardDieData()

@YieldDashboardDie.json(model=YieldDashboardDieData, request_method="GET")
def _json(model, request):
    filters = {}
    today = datetime.today()
    current_year = today.year
    current_month = f"{today.month:02d}"
    # Die Number
    if request.params.get("die_no"):
        filters["die_no"] = request.params.get("die_no")
    period = request.params.get("period_type", "month")
    if period == "year":
        filters["year"] = request.params.get("year", current_year)
    elif period == "month":
        filters["year"] = request.params.get("year", current_year)
        filters["month"] = request.params.get("month", current_month)
    elif period == "quarter":
        filters["year"] = request.params.get("year", current_year)
        filters["quarter"] = request.params.get("quarter", "Q1")
    return model.yield_die_comparison(filters)


# ================== FAMILY-COMPARISON ==================

class YieldDashboardFamComp(JsonAPI):
    pass

@Internal.mount(app=YieldDashboardFamComp, path="yield_comp_family")
def _mount_app():
    return YieldDashboardFamComp()

class YieldDashboardFamCompData:
    def yield_family_comparison(self, filters=None):
        if not filters:
            filters = {}
        sqldata = """
            SELECT plant_code, family, total_order_qty, total_tonnage, yield_pct, year_month
            FROM prodd_yield_fam_mnth_agg
            WHERE 1=1
        """
        # Family filter
        if filters.get("family"):
            sqldata += f" AND UPPER(family) = UPPER('{filters['family']}')"
        # Plant filter (optional)
        if filters.get("plant_code"):
            sqldata += f" AND plant_code = {filters['plant_code']}"
        # Financial Year filter
        if filters.get("year"):
            sqldata += f"""
                AND (
                    CASE 
                        WHEN CAST(SUBSTRING(year_month,6,2) AS INT) >= 4 
                        THEN CAST(LEFT(year_month,4) AS INT)
                        ELSE CAST(LEFT(year_month,4) AS INT) - 1
                    END
                ) = {filters['year']}
            """
        # Month filter
        if filters.get("month"):
            sqldata += f" AND RIGHT(year_month,2) = '{filters['month'].zfill(2)}'"
        # Quarter filter (FY based)
        if filters.get("quarter"):
            q = filters["quarter"]
            fy = int(filters["year"])
            if q == "Q1":      # Apr-Jun (FY year)
                sqldata += f" AND year_month BETWEEN '{fy}-04' AND '{fy}-06'"
            elif q == "Q2":    # Jul-Sep
                sqldata += f" AND year_month BETWEEN '{fy}-07' AND '{fy}-09'"
            elif q == "Q3":    # Oct-Dec
                sqldata += f" AND year_month BETWEEN '{fy}-10' AND '{fy}-12'"
            elif q == "Q4":    # Jan-Mar (next calendar year, same FY)
                sqldata += f" AND year_month BETWEEN '{fy+1}-01' AND '{fy+1}-03'"
        recordset = sqlapi.RecordSet2(sql=sqldata)
        return [{col: rec[col] for col in rec.keys()} for rec in recordset]

@YieldDashboardFamComp.path(model=YieldDashboardFamCompData, path="")
def _path():
    return YieldDashboardFamCompData()

@YieldDashboardFamComp.json(model=YieldDashboardFamCompData, request_method="GET")
def _json(model, request):
    filters = {}
    today = datetime.today()
    current_year = today.year
    current_month = f"{today.month:02d}"
    # Family name
    if request.params.get("family"):
        filters["family"] = request.params.get("family")
    # Plant (optional)
    if request.params.get("plant_code"):
        filters["plant_code"] = request.params.get("plant_code")
    period = request.params.get("period_type", "month")
    if period == "year":
        filters["year"] = request.params.get("year", current_year)
    elif period == "month":
        filters["year"] = request.params.get("year", current_year)
        filters["month"] = request.params.get("month", current_month)
    elif period == "quarter":
        filters["year"] = request.params.get("year", current_year)
        filters["quarter"] = request.params.get("quarter", "Q1")

    return model.yield_family_comparison(filters)


# ================= TARGET-COMPARISON ==================

class YieldDashboardTargetComp(JsonAPI):
    pass

@Internal.mount(app=YieldDashboardTargetComp, path="yield_comp_target")
def _mount_app():
    return YieldDashboardTargetComp()

class YieldDashboardTargetCompData:
    def yield_target_comparison(self, filters=None):
        today = datetime.today()
        cal_year = today.year
        cal_month = today.month

        # Financial year
        fy = cal_year if cal_month >= 4 else cal_year - 1
        current_month = f"{cal_month:02d}"

        sqldata = f"""
            SELECT 
                t.plant_code,
                t.yield_target,
                t.target_year,
                AVG(a.yield_pct) AS yield_pct
            FROM kln_yield_target t
            JOIN prodd_yield_month_agg a
                ON t.plant_code = a.plant_code
            WHERE  (
                    CASE 
                        WHEN CAST(SUBSTRING(a.year_month,6,2) AS INT) >= 4 
                        THEN CAST(LEFT(a.year_month,4) AS INT)
                        ELSE CAST(LEFT(a.year_month,4) AS INT) - 1
                    END
                ) = {fy}
        """
        period = filters.get("period_type", "month")
        if period == "month":
            sqldata += f" AND RIGHT(a.year_month,2) = '{current_month}'"
        elif period == "quarter":
            if 4 <= cal_month <= 6:
                sqldata += f" AND a.year_month BETWEEN '{fy}-04' AND '{fy}-06'"
            elif 7 <= cal_month <= 9:
                sqldata += f" AND a.year_month BETWEEN '{fy}-07' AND '{fy}-09'"
            elif 10 <= cal_month <= 12:
                sqldata += f" AND a.year_month BETWEEN '{fy}-10' AND '{fy}-12'"
            else:
                sqldata += f" AND a.year_month BETWEEN '{fy+1}-01' AND '{fy+1}-03'"
        # Group by plant to get single row per plant
        sqldata += """
            GROUP BY 
                t.plant_code, 
                t.yield_target, 
                t.target_year
            ORDER BY t.plant_code
        """
        recordset = sqlapi.RecordSet2(sql=sqldata)
        return [{col: rec[col] for col in rec.keys()} for rec in recordset]

@YieldDashboardTargetComp.path(model=YieldDashboardTargetCompData, path="")
def _path():
    return YieldDashboardTargetCompData()

@YieldDashboardTargetComp.json(model=YieldDashboardTargetCompData, request_method="GET")
def _json(model, request):
    filters = {
        "period_type": request.params.get("period_type", "month")
    }
    return model.yield_target_comparison(filters)
