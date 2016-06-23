const
  express = require("express"),
  app     = require("express")(),
  pug     = require("pug"),
  http    = require("http").Server(app),
  io      = require("socket.io")(http);

app.use("/bower_components", express.static(`${__dirname}/bower_components`));
app.use(express.static(`${__dirname}/dist`));
app.get("/", (req, res) => {
  res.send(pug.renderFile(`${__dirname}/index.pug`));
});

io.on("connection", (socket) => {
  io.emit("chat-enter", "system");                                              // @TODO getUser()
  socket.on("chat-message", (text) => {
    io.emit("chat-message", {content: text, author: "system"});                 // @TODO getAuthor()
  });
  socket.on("disconnect", () => {
    io.emit("chat-exit", "system");
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
