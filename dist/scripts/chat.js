(function($, io) {
  var ChatWindow, MessageFormatter, Theme, socket;
  socket = io();
  $(function() {
    var $window, chatForm, chatInput, chatWindow, toggleBtns, toggleSound, toggleTheme;
    $window = $(window);
    chatForm = $("#nc-message-form");
    chatInput = $("#nc-message-compose");
    chatWindow = new ChatWindow("#nc-messages-container");
    toggleBtns = $(".ns-chat-toggle");
    toggleTheme = toggleBtns.filter("[name=\"toggle-theme\"]");
    toggleSound = toggleBtns.filter("[name=\"toggle-sound\"]");
    toggleBtns.bootstrapSwitch();
    $window.on("resize", function() {
      return chatWindow.resize();
    });
    socket.on("chat-message", function(message) {
      return chatWindow.addMessage(message);
    }).on("chat-enter", function(username) {
      return chatWindow.addMessage(username + " entered", "text-muted nc-chat-enter-text");
    }).on("chat-exit", function(username) {
      return chatWindow.addMessage(username + " left", "text-muted nc-chat-exit-text");
    });
    $window.add(chatInput).bind("keyup", "ctrl+shift+l", function(e) {
      return chatWindow.clear();
    });
    chatForm.on("submit", function(e) {
      var sound, theme;
      e.preventDefault();
      switch (chatInput.val()) {
        case "":
          null;
          break;
        case "/clear":
          chatWindow.clear();
          break;
        case "/theme:light":
        case "/theme:dark":
          theme = chatInput.val().split(":")[1];
          Theme.set(theme);
          toggleTheme.bootstrapSwitch("state", (theme === "dark" ? true : false), true);
          break;
        case "/sound:on":
        case "/sound:off":
        case "sounds:on":
        case "sounds:off":
          sound = chatInput.val().split(":")[1];
          chatWindow.soundsEnabled = false;
          toggleSound.bootstrapSwitch("state", (sound === "on" ? true : false), true);
          break;
        default:
          socket.emit("chat-message", chatInput.val());
      }
      return chatInput.val("");
    });
    toggleTheme.on("switchChange.bootstrapSwitch", function(e, state) {
      if (state === true) {
        return Theme.set("dark");
      } else {
        return Theme.set("light");
      }
    });
    return toggleSound.on("switchChange.bootstrapSwitch", function(e, state) {
      if (state === true) {
        return chatWindow.soundsEnabled = true;
      } else {
        return chatWindow.soundsEnabled = false;
      }
    });
  });
  MessageFormatter = (function() {
    function MessageFormatter() {}

    MessageFormatter.hyperlinkTLD = ["com", "us", "ca", "net", "eu", "tv", "gov", "org"];

    MessageFormatter.tagHyperlinks = function(str) {
      var hyperlinkText;
      hyperlinkText = new RegExp("(https?\\:\\/\\/)?((?:www)?\\S+\\.(?:" + (this.hyperlinkTLD.join("|")) + "))", "gi");
      return str.replace(hyperlinkText, "<a href=\"http://$2\" target=\"_blank\">$1$2</a>");
    };

    return MessageFormatter;

  })();
  Theme = (function() {
    function Theme() {}

    Theme.stylesheetElement = $("#nc-chat-stylesheet");

    Theme.stylesheets = {
      light: "/styles/chat-light.min.css",
      dark: "/styles/chat-dark.min.css"
    };

    Theme.set = function(stylesheet) {
      var retval;
      if (this.stylesheets[stylesheet] != null) {
        this.stylesheetElement.attr("href", this.stylesheets[stylesheet]);
        retval = true;
      } else {
        console.error("stylesheet not found: " + stylesheet);
        retval = false;
      }
      return retval;
    };

    return Theme;

  })();
  return ChatWindow = (function() {
    ChatWindow.sounds = {
      message: new Howl({
        urls: ["/sounds/message.mp3", "/sounds/message.m4r"]
      })
    };

    ChatWindow.prototype.soundsEnabled = true;

    function ChatWindow(chatWindow) {
      this.elem = $(chatWindow);
      this.pusher = null;
      this.resize();
      this.clear();
    }

    ChatWindow.prototype.resize = function() {
      var chatForm;
      chatForm = $("#nc-message-form");
      this.height = Math.ceil(chatForm.offset().top) - 16;
      this.height -= this.elem.offset().top;
      return this.elem.css("height", this.height);
    };

    ChatWindow.prototype.clear = function() {
      var pusherOld;
      pusherOld = this.pusher;
      this.pusher = $(document.createElement("div"));
      this.pusher.addClass("nc-chat-buffer-pusher").height(this.height).appendTo(this.elem);
      this.scrollToBottom();
      if (pusherOld) {
        return pusherOld.remove();
      }
    };

    ChatWindow.prototype.addMessage = function(message, classes) {
      var formattedMessageText, messageItem, messageText;
      if (classes == null) {
        classes = "";
      }
      messageItem = $(document.createElement("li"));
      messageText = message.author != null ? message.author + ": " + message.content : message;
      formattedMessageText = MessageFormatter.tagHyperlinks(messageText);
      messageItem.addClass(("nc-chat-message-item " + classes).trim()).html(formattedMessageText).appendTo(this.elem);
      if (this.pusher) {
        this.pusher.height(Math.floor(this.pusher.height() - messageItem.outerHeight(true)));
      }
      this.scrollToBottom();
      if (message.author) {
        return this.playSound("message");
      }
    };

    ChatWindow.prototype.playSound = function(sound) {
      var retval;
      if (ChatWindow.sounds[sound] != null) {
        if (this.soundsEnabled) {
          ChatWindow.sounds.message.play();
          retval = true;
        } else {
          retval = false;
        }
      } else {
        console.error("sound not found: " + sound);
        retval = false;
      }
      return retval;
    };

    ChatWindow.prototype.scrollToBottom = function() {
      return this.elem.scrollTop(this.elem[0].scrollHeight);
    };

    return ChatWindow;

  })();
})(jQuery, io);
