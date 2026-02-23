const route = (prop) => {
  prop.app.get( "/test",(req, res, next) => {
    res.send({ test: "dsfds" });
  });
};

module.exports = route;
