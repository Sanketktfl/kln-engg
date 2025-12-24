from cs.platform.web import JsonAPI
from cs.platform.web.root import Internal
from cdb import sqlapi
from datetime import datetime
from collections import defaultdict

class YieldDashboard(JsonAPI):
    pass
@Internal.mount(app=YieldDashboard, path="yield_dashboard")
def _mount_app():
    return YieldDashboard()

class YieldDashboardData:
    def yield_dashboard(self):

        sqldata=f"""SELECT SUM(total_order_qty) as total_order_qty,
                SUM(totalDies) as totaldies,
                SUM(total_tonnage) as total_tonnage,
                SUM(yield_pct) as yield_pct,
                plant_code
                FROM prodd_yield_year_agg
                group by plant_code
                """
        recordset=sqlapi.RecordSet2(sql=sqldata)
        data = []
        for record in recordset:
            row_dict = {col: record[col] for col in record.keys()}
            data.append(row_dict)
        return data

@YieldDashboard.path(model=YieldDashboardData, path="")
def _path():
    return YieldDashboardData()

@YieldDashboard.json(model=YieldDashboardData,request_method="GET")
def _json(model, request):
    return model.yield_dashboard()


#For year wise table
class YieldDashboardYearly(JsonAPI):
    pass
@Internal.mount(app=YieldDashboardYearly, path="yield_dashboard_yearly")
def _mount_app():
    return YieldDashboardYearly()

class YieldDashboardYearlyData:
    def yearly_yield(self, filters=None):

        if filters is None:
            filters = {}

        current_year = datetime.now().year
        start_year = current_year - 4  # last 5 years including current
        end_year = current_year

        sqldata=f"""SELECT SUM(total_order_qty) as total_order_qty,
                SUM(totalDies) as totaldies,
                SUM(total_tonnage) as total_tonnage,
                (SUM(yield_pct)/COUNT(yield_pct)) as yield_pct,
                year
                FROM prodd_yield_year_agg
                WHERE (year between {start_year} and {end_year})
                """
        if filters.get("plant_code"):
            sqldata += f"""AND plant_code = '{filters.get("plant_code")}'"""
        sqldata += f"""GROUP BY year"""
        recordset = sqlapi.RecordSet2(sql=sqldata)
        data = []
        for record in recordset:
            row_dict = {col: record[col] for col in record.keys()}
            data.append(row_dict)
        return data

@YieldDashboardYearly.path(model=YieldDashboardYearlyData, path="")
def _path():
    return YieldDashboardYearlyData()

@YieldDashboardYearly.json(model=YieldDashboardYearlyData,request_method="GET")
def _json(model, request):
    filters = {}
    if request.params.get("plant_code"):
        filters["plant_code"] = request.params.get("plant_code")
    return model.yearly_yield(filters)


#For Monthly popup
class YieldDashboardMonthly(JsonAPI):
    pass
@Internal.mount(app=YieldDashboardMonthly, path="yield_dashboard_monthly")
def _mount_app():
    return YieldDashboardMonthly()

class YieldDashboardMonthlyData:
    def yearly_yieldmonthly(self,filters=None):

        sqldata="SELECT plant_code,total_order_qty,total_tonnage,yield_pct,year_month FROM prodd_yield_month_agg WHERE 1=1 "
        if filters.get('year'):
            sqldata += f""" AND STRFTIME('%Y', year_month) = '{filters.get('year')}'"""
        if filters.get('plant_code'):
            sqldata += f""" AND plant_code = '{filters.get('plant_code')}'"""
        recordset=sqlapi.RecordSet2(sql=sqldata)
        data = []
        for record in recordset:
            row_dict = {col: record[col] for col in record.keys()}
            data.append(row_dict)
        return data

@YieldDashboardMonthly.path(model=YieldDashboardMonthlyData, path="")
def _path():
    return YieldDashboardMonthlyData()

@YieldDashboardMonthly.json(model=YieldDashboardMonthlyData,request_method="GET")
def _json(model, request):
    filters = {}
    if request.params.get('year'):
        filters['year'] = request.params.get('year')
    if request.params.get('plant_code'):
        filters['plant_code'] = request.params.get('plant_code')
    return model.yearly_yieldmonthly(filters)


#For DieMonth popup
class YieldDashboardDie(JsonAPI):
    pass
@Internal.mount(app=YieldDashboardDie, path="yield_dashboard_die")
def _mount_app():
    return YieldDashboardDie()

class YieldDashboardDieData:
    def yearly_yielddie(self,filters=None):

        sqldata="SELECT plant_code,pre_die_no,total_order_qty,total_tonnage,yield_pct,family,year_month FROM prodd_yield_die_agg WHERE 1=1 "
        if filters.get('year'):
            sqldata += f""" AND STRFTIME('%Y', year_month) = '{filters['year']}'"""
        if filters.get('month'):
            sqldata += f"""AND STRFTIME('%',year_month) = '{filters['month']}'"""
        recordset=sqlapi.RecordSet2(sql=sqldata)
        data = []
        for record in recordset:
            row_dict = {col: record[col] for col in record.keys()}
            data.append(row_dict)
        return data

@YieldDashboardDie.path(model=YieldDashboardDieData, path="")
def _path():
    return YieldDashboardDieData()

@YieldDashboardDie.json(model=YieldDashboardDieData,request_method="GET")
def _json(model, request):
    filters = {}
    if request.params.get('year'):
        filters['year'] = request.params.get('year')
    if request.params.get('month'):
        filters['month'] = request.params.get('month')
    return model.yearly_yielddie(filters)


#For Family Details
class YieldDashboardFam(JsonAPI):
    pass
@Internal.mount(app=YieldDashboardFam, path="yield_dashboard_fam")
def _mount_app():
    return YieldDashboardFam()

class YieldDashboardFamData:
    def yearly_yieldfam(self,filters=None):

        sqldata="SELECT plant_code,total_order_qty,total_tonnage,yield_pct,family,year,totaldies FROM prodd_yield_fam_year_agg"
        if filters.get('plant_code'):
            sqldata += f""" WHERE plant_code = '{filters['plant_code']}'"""
        # if filters.get('year'):
        #     sqldata += f"""AND STRFTIME('%Y', year) = '{filters['year']}'"""
        recordset=sqlapi.RecordSet2(sql=sqldata)
        data = []
        for record in recordset:
            row_dict = {col: record[col] for col in record.keys()}
            data.append(row_dict)
        return data

@YieldDashboardFam.path(model=YieldDashboardFamData, path="")
def _path():
    return YieldDashboardFamData()

@YieldDashboardFam.json(model=YieldDashboardFamData,request_method="GET")
def _json(model, request):
    filters = {}
    if request.params.get('plant_code'):
        filters['plant_code'] = request.params.get('plant_code')
    return model.yearly_yieldfam(filters)


#For Die Weight Details
class YieldDashboardWt(JsonAPI):
    pass
@Internal.mount(app=YieldDashboardWt, path="yield_dashboard_wt")
def _mount_app():
    return YieldDashboardWt()

class YieldDashboardWtData:
    def yearly_yieldwt(self,filters=None):

        sqldata="SELECT plant_code,die_number,cut_wt,burr_wt,flash_slug_wt,endpc_wt,gross_wt,net_wt,null as machining_wt FROM kln_master_data"
        if filters.get('die_number'):
            sqldata += f""" WHERE die_number = '{filters['die_number']}'"""
        recordset=sqlapi.RecordSet2(sql=sqldata)
        data = []
        for record in recordset:
            row_dict = {col: record[col] for col in record.keys()}
            data.append(row_dict)
        return data

@YieldDashboardWt.path(model=YieldDashboardWtData, path="")
def _path():
    return YieldDashboardWtData()

@YieldDashboardWt.json(model=YieldDashboardWtData,request_method="GET")
def _json(model, request):
    filters = {}
    if request.params.get('die_number'):
        filters['die_number'] = request.params.get('die_number')
    return model.yearly_yieldwt(filters)
