/*jslint node: true, indent: 2 */
"use strict";

const
  restify  = require("restify"),
  bunyan   = require("bunyan"),
  routes   = require("./routes/"),
  mongoose = require("mongoose/"),
  config   = require("./config.json"),
  db       = mongoose.connect(config.creds.mongoose_auth),
  Schema   = mongoose.Schema,
  ObjectId = mongoose.Schema.ObjectId;

// Schema

var UserSchema = new Schema({
  username  : {
    type      : String,
    lowercase : true,
    unique    : true
  },
  firstName : String,
  lastName  : String,
  email     : String
});

var MessageSchema = new Schema({
  author: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    trim: true,
    required: true
  }
});

var ConversationSchema = new Schema({
  participants : [String],
  messages     : [MessageSchema],
  updatedAt    : {
    type    : Date,
    default : Date.now()
  }
});


mongoose.model("User", UserSchema);
mongoose.model("Conversation", ConversationSchema);

const User = mongoose.model("User");
const Conversation = mongoose.model("Conversation");

// Server config

var log = bunyan.createLogger({
  name        : "nodechat-server",
  level       : process.env.LOG_LEVEL || "info",
  stream      : process.stdout,
  serializers : bunyan.stdSerializers
});

var server = restify.createServer({
  name : "nodechat-server",
  log  : log,
  formatters : {
    "application/json" : (req, res, body, cb) => {
      res.setHeader("Cache-Control", "must-revalidate");

      // Does the client *explicitly* accepts application/json?
      var sendPlainText = (req.header("Accept").split(/, */).indexOf("application/json") === -1);

      // Send as plain text
      if (sendPlainText) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }

      // Send as JSON
      if (!sendPlainText) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      return cb(null, JSON.stringify(body));
    }
  }
});

server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser());
server.use(restify.gzipResponse());
server.pre(restify.pre.sanitizePath());

/*jslint unparam:true*/
// Default error handler. Personalize according to your needs.
server.on("uncaughtException", (req, res, route, err) => {
  console.log("******* Begin Error *******");
  console.log(route);
  console.log("*******");
  console.log(err.stack);
  console.log("******* End Error *******");
  if (!res.headersSent) {
    return res.send(500, { ok : false });
  }
  res.write("\n");
  res.end();
});
/*jslint unparam:false*/

server.on("after", restify.auditLogger({ log: log }));
routes(server);

console.log("Starting REST server...");
server.listen(process.argv[2] || 3001, () => console.log(`REST Server started: ${server.url}`));
