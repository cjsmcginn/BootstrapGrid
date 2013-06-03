using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using BootstrapGrid.Models;
namespace BootstrapGrid.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Message = "Modify this template to jump-start your ASP.NET MVC application.";

            return View();
        }
        public ActionResult People()
        {
            var model = new PersonGridModel();
            model.Load();
            return Json(model,JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public ActionResult People(PersonGridModel model)
        {
            model.Load();
            return Json(model, JsonRequestBehavior.AllowGet);
        }
        public ActionResult About()
        {
            ViewBag.Message = "Your app description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}
