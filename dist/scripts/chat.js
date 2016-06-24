(function($, io) {
  var ChatWindow, MessageFormatter, Theme, socket;
  socket = io();
  $(function() {
    var $window, chatForm, chatInput, chatWindow, settingsBtn, settingsWin, toggleBtns, toggleSound, toggleTheme;
    $window = $(window);
    chatForm = $("#nc-message-form");
    chatInput = $("#nc-message-compose");
    chatWindow = new ChatWindow("#nc-messages-container");
    settingsBtn = $("#nc-chat-settings-btn");
    settingsWin = $("#nc-chat-settings-modal");
    toggleBtns = $(".ns-chat-toggle");
    toggleSound = toggleBtns.filter("[name=\"toggle-sound\"]");
    toggleTheme = toggleBtns.filter("[name=\"toggle-theme\"]");
    toggleBtns.bootstrapSwitch();
    chatInput.focus();
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
    $window.add(chatInput).bind("keyup keydown keypress", "ctrl+l", function(e) {
      e.preventDefault();
      if (e.type === "keyup") {
        return chatWindow.clear();
      }
    });
    $window.add(chatInput).bind("keyup keydown keypress", "ctrl+m", function(e) {
      e.preventDefault();
      if (e.type === "keyup") {
        chatWindow.soundsEnabled = chatWindow.soundsEnabled ? false : true;
        return toggleSound.bootstrapSwitch("state", chatWindow.soundsEnabled, true);
      }
    });
    settingsWin.on("show.bs.modal hidden.bs.modal", function() {
      return settingsBtn.toggleClass("fa-spin");
    });
    chatForm.on("submit", function(e) {
      var sound, theme, value;
      e.preventDefault();
      value = chatInput.val();
      if (value === "") {
        null;
      } else if (value.match(/^\/clear/)) {
        chatWindow.clear();
      } else if (value.match(/^\/theme/)) {
        theme = value.split(" ");
        if (theme[1]) {
          theme = theme[1];
          Theme.set(theme);
          if (theme !== "dark" && theme !== "light") {
            return;
          }
          toggleTheme.bootstrapSwitch("state", (theme === "dark" ? true : false), true);
        } else {
          return;
        }
      } else if (value.match(/^\/sounds?/)) {
        sound = value.split(" ");
        if (sound[1]) {
          sound = sound[1];
          if (sound !== "on" && sound !== "off") {
            return;
          }
          chatWindow.soundsEnabled = sound === "on" ? true : false;
          toggleSound.bootstrapSwitch("state", chatWindow.soundsEnabled, true);
        } else {
          return;
        }
      } else {
        socket.emit("chat-message", value);
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
      hyperlinkText = new RegExp("(https?\\:\\/\\/)?((?:www)?\\S+\\.(?:" + (this.hyperlinkTLD.join("|")) + ")\\S*)", "gi");
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
        urls: ["/sounds/message.mp3", "/sounds/message.m4a"]
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
      var messageAuthor, messageContent, messageItem;
      if (classes == null) {
        classes = "";
      }
      messageItem = $(document.createElement("li"));
      if (message.author != null) {
        messageContent = MessageFormatter.tagHyperlinks(message.content);
        messageAuthor = "<span class=\"nc-chat-message-item-author\">" + message.author + "</span>";
        message = messageAuthor + messageContent;
      }
      messageItem.addClass(("nc-chat-message-item " + classes).trim()).html(message).appendTo(this.elem);
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
