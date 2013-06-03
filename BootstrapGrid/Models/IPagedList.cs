using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BootstrapGrid.Models
{
    public interface IPagedList<T> : IList<T>
    {
        int PageIndex { get; set; }
        int PageSize { get; set; }
        int TotalCount { get; set; }
        int TotalPages { get; set; }
        string Expression { get; set; }
    }
}