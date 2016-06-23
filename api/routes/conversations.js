"use strict";

const
  mongoose     = require("mongoose"),
  APIResponse  = require("../common/api-response.js"),
  Conversation = mongoose.model("Conversation");

module.exports = (server) => {

  /**
   * @endpoint /users/:username/conversations
   */

  server.get("/users/:username/conversations", (req, res, next) => {
    Conversation.find({
      updated_at: {
        // Filter within past 7 days
        $gte: new Date((new Date()).getTime() - (7 * 24 * 60 * 60 * 1000))
      }
    }, "participants updated_at").sort({
      updated_at: "desc"
    }).exec((err, conversations) => {
      if (!err) {
        res.json(new APIResponse(true, conversations));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

  server.post("/users/:username/conversations", (req, res, next) => {
    var participantList = !req.body.recipient
      ? [req.params.username]
      : [req.params.username, req.body.recipient];
    var conversationModel = new Conversation({participants: participantList});
    conversationModel.messages.push({
      message : req.body.message,
      author  : req.params.username
    });
    conversationModel.save((err, conversation) => {
      if (!err) {
        res.json(new APIResponse(true, conversation));
      } else {
        res.json(new APIResponse(false, err));
      }
    });
  });

  /**
   * @endpoint /users/:username/conversations/:conversation_id
   */

  server.get("/users/:username/conversations/:conversation_id", (req, res, next) => {
    Conversation.findById(req.params.conversation_id, (err, conversation) => {
    if (!err) {
      res.json(new APIResponse(true, conversation));
    } else {
      res.json(new APIResponse(false, err));
    }
    });
  });

  server.post("/users/:username/conversations/:conversation_id", (req, res, next) => {
    Conversation.findById(req.params.conversation_id, (err, conversation) => {
      console.log(conversation);
      conversation.messages.push({
        message : req.body.message,
        author  : req.params.username
      });
      conversation.save((err, message) => {
        if (!err) {
          res.json(new APIResponse(true, message));
        } else {
          res.json(new APIResponse(false, err));
        }
      });
    });
  });

};
