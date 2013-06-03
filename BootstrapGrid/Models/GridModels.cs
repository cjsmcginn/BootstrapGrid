using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BootstrapGrid.Models
{

    public class Filter
    {
        public string Name { get; set; }
        public bool Selected { get; set; }

    }
    #region Column
    public class GridColumn
    {
        public string Header { get; set; }
        public string Column { get; set; }
        public string Width { get; set; }
        public List<Filter> Filters { get; set; }
        public string FilterExpression { get; set; }
        public int SortOrder { get; set; }

    }
    #endregion
    public abstract class GridModel<T>
    {
        public List<T> Rows { get; set; }
        public List<GridColumn> Columns { get; set; }
        public GridPager Pager { get; set; }
        public abstract void Load();

    }
    public class GridPager
    {
        public int TotalPages { get; set; }
        public int TotalRecords { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int CurrentPage { get; set; }
    }


}