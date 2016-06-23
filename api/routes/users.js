"use strict";

const
  mongoose    = require("mongoose"),
  APIResponse = require("../common/api-response.js"),
  User        = mongoose.model("User");

module.exports = (server) => {

  /**
   * @endpoint /users
   */

  server.get("/users", (req, res, next) => {
    var q = req.params.username ? req.params.username : "\\w";
    User.find({
      username: new RegExp((`^${q}`), "i")
    }, (err, docs) => {
      if (!err) {
        res.json(new APIResponse(true, docs));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

  server.post("/users", (req, res, next) => {
    var userModel = new User(req.body);
    userModel.save((err, user) => {
      if (!err) {
        res.json(new APIResponse(true, user));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

  /**
   * endpoint /users/:username
   */

  server.get("/users/:username", (req, res, next) => {
    User.find({
      username: new RegExp((`^${req.params.username}$`), "i")
    }, (err, user) => {
      if (!err) {
        res.json(new APIResponse(true, user));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

  server.put("/users/:username", (req, res, next) => {
    User.update({
      username: new RegExp((`^${req.params.username}$`), "i")
    }, req.body, (err, user) => {
      if (!err) {
        res.json(new APIResponse(true, user));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

  server.del("/users/:username", (req, res, next) => {
    User.remove({
      username: new RegExp((`^${req.params.username}$`), "i")
    }, (err, user) => {
      if (!err) {
        res.json(new APIResponse(true, user));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

};
