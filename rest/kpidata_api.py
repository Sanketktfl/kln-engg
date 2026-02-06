from cs.platform.web import JsonAPI
from cs.platform.web.root import Internal
from cdb import sqlapi


class YieldDashboardKPI(JsonAPI):
    pass

@Internal.mount(app=YieldDashboardKPI, path="yield_dashboard_kpi")
def _mount_app():
    return YieldDashboardKPI()

class YieldDashboardKPIData:
    def yearly_yield(self):
        sqldata = f"""
            select * from yield_dashboard_kpi
        """
        recordset = sqlapi.RecordSet2(sql=sqldata)
        return [ {col: rec[col] for col in rec.keys()} for rec in recordset ]

@YieldDashboardKPI.path(model=YieldDashboardKPIData, path="")
def _path():
    return YieldDashboardKPIData()

@YieldDashboardKPI.json(model=YieldDashboardKPIData, request_method="GET")
def _json(model, request):
    return model.yearly_yield()
