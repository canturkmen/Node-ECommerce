exports.show404Error = (req, res, next) => {
  res.status(404).render("404", { docTitle: "404 Page", path: "/404" });
};

exports.show500Error = (req, res, next) => {
  res.status(500).render("500", { docTitle: "500 Page", path: "/500" });
};
