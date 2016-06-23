(($, io) ->

  socket = io();

  $ ->

    # Vars

    $window      = $ window
    chatForm     = $ "#nc-message-form"
    chatInput    = $ "#nc-message-compose"
    messageBuf   = new BufferContainer "#nc-messages-container"
    toggleBtns   = $ ".ns-chat-toggle"
    toggleTheme  = toggleBtns.filter "[name=\"toggle-theme\"]"

    # UI Init

    toggleBtns.bootstrapSwitch()

    # Events

    $window.on "resize", -> messageBuf.resize()

    socket
      .on "chat-message", (message) -> messageBuf.addMessage message
      .on "chat-enter", (username) -> messageBuf.addMessage "#{username} entered", "text-muted nc-chat-enter-text"
      .on "chat-exit", (username) -> messageBuf.addMessage "#{username} left", "text-muted nc-chat-exit-text"

    $window.add(chatInput).bind "keyup", "ctrl+shift+l", (e) -> messageBuf.clear()

    chatForm.on "submit", (e) ->
      e.preventDefault()
      switch chatInput.val()
        when "" then null
        when "/clear" then messageBuf.clear()
        when "/theme:light", "/theme:dark"
          theme = chatInput.val().split(":")[1]
          Theme.set theme
          toggleTheme.bootstrapSwitch "state", (if theme is "dark" then true else false), true
        else socket.emit "chat-message", chatInput.val()
      chatInput.val ""

    toggleTheme.on "switchChange.bootstrapSwitch", (e, state) ->
      if state is true then Theme.set "dark" else Theme.set "light"

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


  class BufferContainer

    @sounds:
      message: new Howl(urls: [
        "/sounds/message.mp3",
        "/sounds/message.m4r"
      ])

    constructor: (bufferContainer) ->
      @elem = $ bufferContainer
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
      messageText = if message.author then "#{message.author}: #{message.content}" else message
      formattedMessageText = MessageFormatter.tagHyperlinks messageText
      messageItem
        .addClass "nc-chat-message-item #{classes}".trim()
        .html formattedMessageText
        .appendTo @elem
      if @pusher then @pusher.height Math.floor((@pusher.height() - messageItem.outerHeight(true)))
      @scrollToBottom()
      BufferContainer.sounds.message.play() if message.author

    scrollToBottom: ->
      @elem.scrollTop @elem[0].scrollHeight

) jQuery, io
