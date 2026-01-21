from cs.platform.web import JsonAPI
from cs.platform.web.root import Internal
from cdb import sqlapi
from datetime import datetime


# #For DieMonth popup
# class YieldDashboardDie(JsonAPI):
#     pass
# @Internal.mount(app=YieldDashboardDie, path="yield_comp_die")
# def _mount_app():
#     return YieldDashboardDie()
#
# class YieldDashboardDieData:
#     def yearly_yielddie(self,filters=None):
#
#         sqldata="SELECT pre_die_no,total_order_qty,total_tonnage,yield_pct,family FROM prodd_yield_die_agg WHERE 1=1 "
#         if filters.get('year'):
#             sqldata += f""" AND (
#                 CASE
#                     WHEN CAST(SUBSTRING(year_month,6,2) AS INT) >= 4
#                     THEN CAST(LEFT(year_month,4) AS INT)
#                     ELSE CAST(LEFT(year_month,4) AS INT) - 1
#                 END
#             ) = '{filters['year']}'"""
#         if filters.get('month'):
#             sqldata += f""" AND RIGHT(year_month,2) = '{filters['month'].zfill(2)}'"""
#         recordset=sqlapi.RecordSet2(sql=sqldata)
#         data = []
#         for record in recordset:
#             row_dict = {col: record[col] for col in record.keys()}
#             data.append(row_dict)
#         return data
#
# @YieldDashboardDie.path(model=YieldDashboardDieData, path="")
# def _path():
#     return YieldDashboardDieData()
#
# @YieldDashboardDie.json(model=YieldDashboardDieData,request_method="GET")
# def _json(model, request):
#     filters = {}
#     if request.params.get('year'):
#         filters['year'] = request.params.get('year')
#     if request.params.get('month'):
#         filters['month'] = request.params.get('month')
#     return model.yearly_yielddie(filters)



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


# ================== FAMILY COMPARISON ==================

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
            sqldata += f" AND family = '{filters['family']}'"
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
