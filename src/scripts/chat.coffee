(($, io) ->

  socket = io();

  $ ->

    $window    = $ window
    chatForm   = $ "#nc-message-form"
    chatInput  = $ "#nc-message-compose"
    messageBuf = new BufferContainer "#nc-messages-container"

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
        else socket.emit "chat-message", chatInput.val()
      chatInput.val ""

  # Functions and Classes

  class BufferContainer

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
      messageItem
        .text messageText
        .addClass "nc-chat-message-item #{classes}".trim()
        .appendTo @elem
      if @pusher then @pusher.height Math.floor((@pusher.height() - messageItem.outerHeight(true)))
      @scrollToBottom()

    scrollToBottom: ->
      @elem.scrollTop @elem[0].scrollHeight

) jQuery, io
