import createError from "http-errors";
import express from "express";
import path from "path";
import indexRouter from "./routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "public")));
app.use("/", indexRouter);

import cors from "cors";
app.use(cors());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`> Server listening on port ${port}`);
});
