using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BootstrapGrid.Models
{
    public class PersonGridModel : GridModel<Person>
    {


        public PersonGridModel()
        {
            // _container = container;
            this.Pager = new GridPager();
            this.Rows = new List<Person>();
            this.Pager.CurrentPage = 1;
            GetDefaultColumns();
            //set default page size here
            this.Pager.PageSize = 20;
        }
        public PersonGridModel(IPagedList<Person> source)
        {
            GetDefaultColumns();
            this.Pager = new GridPager { PageIndex = source.PageIndex, PageSize = source.PageSize, TotalPages = source.TotalPages, TotalRecords = source.TotalCount };
            this.Rows = source.Select(x => x).ToList();
            this.Pager.CurrentPage = source.PageIndex < source.TotalPages ? source.PageIndex + 1 : source.TotalPages;
        }
        public string Container { get; set; }
        void GetDefaultColumns()
        {
            var sw = new BootstrapGrid.Models.Filter { Name = "Starts With", Selected = true };
            var ct = new BootstrapGrid.Models.Filter { Name = "Contains", Selected = false };
            var ew = new BootstrapGrid.Models.Filter { Name = "Ends With", Selected = false };
            #region columns
            this.Columns = new List<GridColumn>
            {
                new GridColumn
                {
                    Column = "Id",
                    Header = "Id",
                    Filters = new List<BootstrapGrid.Models.Filter> { sw, ct, ew },
                    Width = "100px",
                    FilterExpression = ""
                },

                new GridColumn
                {
                    Column = "Name",
                    Header = "Name",
                    Filters = new List<BootstrapGrid.Models.Filter> { sw, ct, ew },
                    Width = "400px",
                    FilterExpression = ""

                }


            };
            #endregion
        }
        public override void Load()
        {
            var filters = from column in Columns.Where(x => !String.IsNullOrEmpty(x.FilterExpression))
                          from filter in column.Filters.Where(x => x.Selected)
                          select new { ColumnName = column.Column, FilterType = filter.Name, FilterExpression = column.FilterExpression };
            var qArgs = new List<string>();
            filters.ToList().ForEach(filter =>
            {
                switch (filter.FilterType)
                {
                    case "Starts With":
                        qArgs.Add(String.Format("{0}:{1}*", filter.ColumnName, filter.FilterExpression));
                        break;
                    default:
                        break;
                };
            });
            //default
            var qExpression = "Some default select expression";

            if (qArgs.Count > 0)
            {
                Pager.PageIndex = 0;
                qExpression = String.Join(" AND ", qArgs);

            }

            var sampleData = SampleData.People.Split(System.Environment.NewLine.ToCharArray(),StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Split("|".ToCharArray(), StringSplitOptions.RemoveEmptyEntries))
                .Skip(1).Select(x => new Person { Id = x[0], Name = x[1] }).ToList();

            var source = new PagedList<Person>(sampleData, Pager.PageIndex, Pager.PageSize);
            if (source == null || source.Count == 0)
            {
                Rows = new List<Person>();

                Pager.TotalPages = 0;
                Pager.TotalRecords = 0;
                Pager.CurrentPage = 1;
            }
            else
            {
                Rows = source.Select(row => row).OrderByDescending(x => x.Name).ToList();
                Pager.TotalPages = source.TotalPages;
                Pager.TotalRecords = source.TotalCount;
                Pager.CurrentPage = source.PageIndex < source.TotalPages ? source.PageIndex + 1 : source.TotalPages;
            }
            
        }
    }
}