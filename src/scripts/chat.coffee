(($, io) ->

  socket = io();

  $ ->

    # Vars

    $window      = $ window
    chatForm     = $ "#nc-message-form"
    chatInput    = $ "#nc-message-compose"
    chatWindow   = new ChatWindow "#nc-messages-container"
    toggleBtns   = $ ".ns-chat-toggle"
    toggleTheme  = toggleBtns.filter "[name=\"toggle-theme\"]"
    toggleSound  = toggleBtns.filter "[name=\"toggle-sound\"]"

    # UI Init

    toggleBtns.bootstrapSwitch()

    # Events

    $window.on "resize", -> chatWindow.resize()

    socket
      .on "chat-message", (message) -> chatWindow.addMessage message
      .on "chat-enter", (username) -> chatWindow.addMessage "#{username} entered", "text-muted nc-chat-enter-text"
      .on "chat-exit", (username) -> chatWindow.addMessage "#{username} left", "text-muted nc-chat-exit-text"

    $window.add(chatInput).bind "keyup keydown keypress", "ctrl+l", (e) ->
      e.preventDefault()
      if e.type is "keyup" then chatWindow.clear()

    $window.add(chatInput).bind "keyup keydown keypress", "ctrl+m", (e) ->
      e.preventDefault()
      if e.type is "keyup"
        chatWindow.soundsEnabled = if chatWindow.soundsEnabled then false else true
        toggleSound.bootstrapSwitch "state", chatWindow.soundsEnabled, true


    chatForm.on "submit", (e) ->
      e.preventDefault()
      value = chatInput.val()
      # Do nothing if empty
      if value == "" then null
      # /clear command
      else if value.match /^\/clear/ then chatWindow.clear()
      # /theme command
      else if value.match /^\/theme/
        theme = value.split(" ")
        if theme[1]
          theme = theme[1]
          Theme.set theme
          unless theme in ["dark", "light"] then return # validation
          toggleTheme.bootstrapSwitch "state", (if theme is "dark" then true else false), true
        else return
      # /sound command
      else if value.match /^\/sounds?/
        sound = value.split(" ")
        if sound[1]
          sound = sound[1]
          unless sound in ["on", "off"] then return # validation
          chatWindow.soundsEnabled = if sound is "on" then true else false
          toggleSound.bootstrapSwitch "state", chatWindow.soundsEnabled, true
        else return
      # Messages
      else socket.emit "chat-message", value
      # Clear input after command, or message
      chatInput.val ""

    toggleTheme.on "switchChange.bootstrapSwitch", (e, state) ->
      if state is true then Theme.set "dark" else Theme.set "light"

    toggleSound.on "switchChange.bootstrapSwitch", (e, state) ->
      if state is true then chatWindow.soundsEnabled = true else chatWindow.soundsEnabled = false


  # Functions and Classes

  class MessageFormatter

    @hyperlinkTLD: [ "com", "us", "ca", "net", "eu", "tv", "gov", "org" ]

    @tagHyperlinks: (str) ->
      hyperlinkText = new RegExp "(https?\\:\\/\\/)?((?:www)?\\S+\\.(?:#{@hyperlinkTLD.join("|")}))", "gi"
      str.replace hyperlinkText, "<a href=\"http://$2\" target=\"_blank\">$1$2</a>"


  class Theme

    @stylesheetElement: $("#nc-chat-stylesheet")

    @stylesheets:
      light: "/styles/chat-light.min.css"
      dark: "/styles/chat-dark.min.css"

    @set: (stylesheet) ->
      if @stylesheets[stylesheet]?
        @stylesheetElement.attr "href", @stylesheets[stylesheet]
        retval = true
      else
        console.error "stylesheet not found: #{stylesheet}"
        retval = false
      retval


  class ChatWindow

    @sounds:
      message: new Howl(urls: [
        "/sounds/message.mp3",
        "/sounds/message.m4a"
      ])

    soundsEnabled: true

    constructor: (chatWindow) ->
      @elem = $ chatWindow
      @pusher = null
      @resize()
      @clear()

    resize: ->
      chatForm = $ "#nc-message-form"
      @height  = Math.ceil(chatForm.offset().top) - 16
      @height -= @elem.offset().top
      @elem.css "height", @height

    clear: ->
      pusherOld = @pusher
      @pusher   = $ document.createElement("div")
      @pusher
        .addClass "nc-chat-buffer-pusher"
        .height @height
        .appendTo @elem
      @scrollToBottom()
      if pusherOld then pusherOld.remove()

    addMessage: (message, classes = "") ->
      messageItem = $ document.createElement("li")
      messageText = if message.author? then "#{message.author}: #{message.content}" else message
      formattedMessageText = MessageFormatter.tagHyperlinks messageText
      messageItem
        .addClass "nc-chat-message-item #{classes}".trim()
        .html formattedMessageText
        .appendTo @elem
      if @pusher then @pusher.height Math.floor((@pusher.height() - messageItem.outerHeight(true)))
      @scrollToBottom()
      @playSound "message" if message.author

    playSound: (sound) ->
      if ChatWindow.sounds[sound]?
        if @soundsEnabled
          ChatWindow.sounds.message.play()
          retval = true
        else
          retval = false
      else
        console.error "sound not found: #{sound}"
        retval = false
      return retval

    scrollToBottom: ->
      @elem.scrollTop @elem[0].scrollHeight

) jQuery, io
