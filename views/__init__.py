from cdb.objects import ViewObject

class PPCMasterData(ViewObject):
    __classname__ = "prodd_kln_master_data"
    __maps_to__ = "prodd_kln_master_data"

class DailyProductionPlan(ViewObject):
    __classname__ = "prodd_kln_ppc_week"
    __maps_to__ = "prodd_kln_ppc_week"

class PPCSalesPlan(ViewObject):
    __classname__ = "prodd_kln_prod_schedule"
    __maps_to__ = "prodd_kln_prod_schedule"

class DiewiseYield(ViewObject):
    __classname__ = "prodd_yield_die_agg"
    __maps_to__ = "prodd_yield_die_agg"

class FamMonthYield(ViewObject):
    __classname__ = "prodd_yield_fam_mnth_agg"
    __maps_to__ = "prodd_yield_fam_mnth_agg"

class FamYearYield(ViewObject):
    __classname__ = "prodd_yield_fam_year_agg"
    __maps_to__ = "prodd_yield_fam_year_agg"

class MonthwiseYield(ViewObject):
    __classname__ = "prodd_yield_month_agg"
    __maps_to__ = "prodd_yield_month_agg"

class YearwiseYield(ViewObject):
    __classname__ = "prodd_yield_year_agg"
    __maps_to__ = "prodd_yield_year_agg"
