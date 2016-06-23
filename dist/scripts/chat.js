(function($, io) {
  var BufferContainer, socket;
  socket = io();
  $(function() {
    var $window, chatForm, chatInput, messageBuf;
    $window = $(window);
    chatForm = $("#nc-message-form");
    chatInput = $("#nc-message-compose");
    messageBuf = new BufferContainer("#nc-messages-container");
    $window.on("resize", function() {
      return messageBuf.resize();
    });
    socket.on("chat-message", function(message) {
      return messageBuf.addMessage(message);
    }).on("chat-enter", function(username) {
      return messageBuf.addMessage(username + " entered", "text-muted nc-chat-enter-text");
    }).on("chat-exit", function(username) {
      return messageBuf.addMessage(username + " left", "text-muted nc-chat-exit-text");
    });
    $window.add(chatInput).bind("keyup", "ctrl+shift+l", function(e) {
      return messageBuf.clear();
    });
    return chatForm.on("submit", function(e) {
      e.preventDefault();
      switch (chatInput.val()) {
        case "":
          null;
          break;
        case "/clear":
          messageBuf.clear();
          break;
        default:
          socket.emit("chat-message", chatInput.val());
      }
      return chatInput.val("");
    });
  });
  return BufferContainer = (function() {
    function BufferContainer(bufferContainer) {
      this.elem = $(bufferContainer);
      this.pusher = null;
      this.resize();
      this.clear();
    }

    BufferContainer.prototype.resize = function() {
      var chatForm;
      chatForm = $("#nc-message-form");
      this.height = Math.ceil(chatForm.offset().top) - 16;
      this.height -= this.elem.offset().top;
      return this.elem.css("height", this.height);
    };

    BufferContainer.prototype.clear = function() {
      var pusherOld;
      pusherOld = this.pusher;
      this.pusher = $(document.createElement("div"));
      this.pusher.addClass("nc-chat-buffer-pusher").height(this.height).appendTo(this.elem);
      this.scrollToBottom();
      if (pusherOld) {
        return pusherOld.remove();
      }
    };

    BufferContainer.prototype.addMessage = function(message, classes) {
      var messageItem, messageText;
      if (classes == null) {
        classes = "";
      }
      messageItem = $(document.createElement("li"));
      messageText = message.author ? message.author + ": " + message.content : message;
      messageItem.text(messageText).addClass(("nc-chat-message-item " + classes).trim()).appendTo(this.elem);
      if (this.pusher) {
        this.pusher.height(Math.floor(this.pusher.height() - messageItem.outerHeight(true)));
      }
      return this.scrollToBottom();
    };

    BufferContainer.prototype.scrollToBottom = function() {
      return this.elem.scrollTop(this.elem[0].scrollHeight);
    };

    return BufferContainer;

  })();
})(jQuery, io);
