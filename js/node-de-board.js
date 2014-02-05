;(function(window, $){
"use strict";
var
  doc = window.document,

  int = function( str ) {
    return Math.floor( parseInt(str, 10) );
  },

  intAbs = function( str ) {
    return Math.abs( parseInt(str, 10) );
  },

  PI = Math.PI,

  CANVAS_WIDTH = 1200,
  CANVAS_HEIGHT = 742,

  $overlay = null,


  // ========================================================
  // login
  // 
  login = {

    $container: null,
    $inputName: null,
    $nameAvailable: null,
    $decideBtn: null,

    defaultMessage: "",

    init: function(){
      this.$nameAvailable = $("#input_name .name_available");
      this.$inputName = $("#artist_name");
      this.$decideBtn = $("#deside_name");
      this.$container = $("#login");
      this.defaultMessage = this.$inputName.val();

      this.$inputName
      .on({
        "keyup": this.onChange,
        "focus": this.onFocus,
        "blur": this.onBlur
      });

      this.$decideBtn
      .on({
        "tap click": this.onDeside
      });
    },

    onFocus: function( event ){
      event.preventDefault();
      if( login.defaultMessage === login.$inputName.val() ){
        login.$inputName.attr("value", "");
      }
    },

    onBlur: function( event ){
      event.preventDefault();
      var value = login.$inputName.val();

      if( login.defaultMessage === value || value === "" || !!value ){
        login.$inputName.attr("value", login.defaultMessage);
      }
    },

    onChange: function( event ){
      event.preventDefault();
      socket.checkName( this.value );
    },

    nameAvailable: function( available ){
      var value = this.$inputName.val();
      if( available && value !== this.defaultMessage && value !== "" && value.length >= 3 ){
        this.$nameAvailable.addClass("available");
        this.$decideBtn.removeClass("disabled");
      } else {
        this.$nameAvailable.removeClass("available");
        this.$decideBtn.addClass("disabled");
      }
    },

    onDeside: function(event){
      event.preventDefault();
      if( !$(this).hasClass("disabled") ){
        socket.desideName( login.$inputName.val() );
      }
    },

    remove: function(){
      $overlay.remove();
      login.$container.remove();
    },

    fadeOut: function(){
      $overlay.fadeOut();
      this.$container.fadeOut(this.remove);
    }
  },

  // ========================================================
  // websocket
  // 
  socket = {
    domain: "board.renoat.net",
    port: 8081,
    webSocket: null,

    init: function() {
      this.webSocket = io.connect("//" + this.domain + ":" + this.port);

      this.webSocket.on("connect", this.onConnect);

      this.webSocket.on('connect_failed', function (response) {
        alert( "Sorry, The connection to the server failed." );
      });

      this.webSocket.on("drawCircle", this.onDrawCircle);
      this.webSocket.on("drawLine", this.onDrawLine);

      this.webSocket.on("inputText", this.onInputText);
      this.webSocket.on("mousemove", this.onMouseMove);
      // this.webSocket.on("comment", this.onComment);
      this.webSocket.on("setData", this.onSetData);
      this.webSocket.on("checkName", this.onCheckName);
      this.webSocket.on("addUser", this.onAddUser);
      this.webSocket.on("disConnect", this.onDisConnect);
      this.webSocket.on("setImageData", this.onSetImageData);
      this.webSocket.on("chat", this.onChat);

    },

    onSetImageData: function( data ){
      canvas.drawData(data);
    },

    onSetData: function( response ) {
      var key = "";

      for( key in response ){
        if( !!response[key] ){
          name.addName( response[key] );
        }
      }
    },

    onConnect: function( response ) {

      canvasWrap.init();

      chat.init();

      name.init();

      tool.init();

      txtField.init();

      canvas.init();

      hitArea.init();

      colorPallete.init();

      extent.init();

      login.init();
    },
    onDrawCircle: function( response ) {
      canvas.drawCircle( response );
    },
    onDrawLine: function( response ) {
      canvas.drawLine( response );
      name.move({
        "name": response.name,
        "x": response.mouseX,
        "y": response.mouseY
      });
    },

    onInputText: function( response ) {
      canvas.inputText( response );
    },
    onMouseMove: function( response ) {
      name.move( response );
    },
    onComment: function( response ) {

    },

    onAddUser: function( response ) {
      name.addName(response);
    },

    // check name
    onCheckName: function( response ){
      login.nameAvailable( response );
    },

    onDisConnect: function( response ){
      name.removeName( response );
    },

    onChat: function( response ){
      chat.getMessage(response);
    },


    // ---------------------
    // emit
    // 
    checkName: function( name ){
      this.webSocket.emit("checkName", name);
    },

    desideName: function(desidedName){
      this.webSocket.emit("addUser", desidedName);
      artist.setName(desidedName);
      login.fadeOut();
    },

    drawCircle: function(){
      this.webSocket.emit("drawCircle", {
        "x": artist.exMouseX,
        "y": artist.exMouseY,
        "width": artist.tool === 0? artist.brushWidth : artist.eraserWidth,
        "drawColor": artist.tool === 0? artist.drawColor : "#fff"
      });
    },

    drawLine: function( eraser ){
      this.webSocket.emit("drawLine", {
        "exMouseX": artist.exMouseX,
        "exMouseY": artist.exMouseY,
        "mouseX": artist.mouseX,
        "mouseY": artist.mouseY,
        "brushWidth": eraser? artist.eraserWidth : artist.brushWidth,
        "drawColor": eraser? "#fff" : artist.drawColor,
        "name": artist.name
      });
    },

    mousemove: function(){
      this.webSocket.emit("mousemove", {
        "name": artist.name,
        "x": artist.mouseX,
        "y": artist.mouseY
      });
    },

    inputText: function( txtData ){
      this.webSocket.emit("inputText", txtData);
    },

    saveImage: function(){
      // console.log( canvas.getImageData().data );
      // this.webSocket.emit("saveImage", canvas.dataURL());
    },

    chat: function( data ){
      this.webSocket.emit("chat", data);
    }
  },

  // ========================================================
  // timer : TODO
  // 
  timer = {
    id: null,
    interval: 1000,
    start: function(){
      clearTimeout( this.id );
      this.id = setTimeout( this.onComplete, this.interval );
    },
    stop: function(){
      clearTimeout( this.id );
    },
    onComplete: function(){
      // canvas.drawSelfData();
      socket.saveImage();
    }
  },

  // ========================================================
  // tool
  // 
  tool = {
    $tools: null,
    toolNum: 0,

    brushWidth: null,
    eraserWidth: null,

    init: function() {
      this.$tools = $( doc.getElementById("tools") ).find("li");
      this.brushWidth = doc.getElementById("brush_width");
      this.eraserWidth = doc.getElementById("eraser_width");

      this.toolNum = this.$tools.length;

      this.$tools.on({
        "mouseenter": this.onToolEnter,
        "mouseleave": this.onToolLeave,
        "click": this.onToolClick,
        "tap": this.onToolToggle
      });

      $( doc.getElementById("brush-range") )
      .on({
        "change": this.onBrushChange
      });

      $( doc.getElementById("eraser-range") )
      .on({
        "change": this.onEraserChange
      });
    },

    onToolToggle: function(event){
      event.preventDefault();
      $(this)
      .children(".option")
      .stop()
      .toggle();
    },

    setCurrent: function( $target ) {
      var i = 0;
      for( ; i < this.toolNum; i ++ ){
        this.$tools.eq(i).removeClass("current");
      }
      $target.addClass("current");
    },

    // --------------------------------------
    // tool | mouse event
    // 
    onToolEnter: function(event) {
      event.preventDefault();
      $(this)
      .children(".option")
      .stop()
      .fadeTo("fast", 1);
    },

    onToolLeave: function(event) {
      event.preventDefault();
      $(this)
      .children(".option")
      .stop()
      .fadeTo("fast", 0, function(){
        $(this).hide();
      });
    },

    onToolClick: function( event ) {
      event.preventDefault();
      var $this = $(this);
      tool.setCurrent( $this );
      artist.setTool( $this.index() );
    },

    onBrushChange: function( event ){
      tool.brushWidth.innerHTML = this.value;
      artist.setBrushWidth( this.value );
    },

    onEraserChange: function(event) {
      tool.eraserWidth.innerHTML = this.value;
      artist.setEraserWidth( this.value );
    }
  },

  // ========================================================
  // canvas_wrap
  // 
  canvasWrap = {
    $field: null,

    init: function(){
      this.$field = doc.getElementById("canvas_wrap");
      return this;
    },

    addElement: function( element ){
      this.$field.appendChild( element );
      return this;
    },

    removeElement: function( element ){
      this.$field.removeChild( element );
      return this;
    }
  },

  // ========================================================
  // name_field
  // 
  name = {
    $nameField: null,
    userNames: {},


    nameTipTemp: (function(){
      var nameTip = doc.createElement("span");
      nameTip.setAttribute("class", "name_tip");
      return nameTip;
    }()),

    init: function() {
      this.nameField = doc.getElementById("name_field");
      return this;
    },

    addName: function( focusName ){
      var nameTip = this.nameTipTemp.cloneNode(true);
      nameTip.setAttribute("id", "name_" + focusName);
      nameTip.innerHTML = focusName;
      this.nameField.appendChild( nameTip );

      this.userNames[focusName] = nameTip;
    },

    move: function( data ) {

      var nameEle = this.userNames[data] || doc.getElementById("name_" + data.name);
      // console.log(nameEle);

      if( !nameEle ) return;

      nameEle.style.top = data.y - nameEle.offsetHeight + "px";
      nameEle.style.left = data.x - (nameEle.offsetWidth / 2) + "px";
    },

    removeName: function(name){
      var nameEle = this.userNames[name] || doc.getElementById("name_" + name);

      // console.log( nameEle );

      if( !nameEle ){
        return;
      }

      this.nameField.removeChild( nameEle );
      this.userNames[name] = null;
    }
  },

  // ========================================================
  // hitArea
  // 
  hitArea = {
    $sensor: null,
    offset: {
      x: 0,
      y: 0
    },

    init: function(){

      this.$sensor = $( doc.getElementById("hit_area") )
      .on({
        "mousedown touchstart": this.onAreaDown,
        "mousemove touchmove": this.onAreaMove,
        "mouseup touchend": this.onAreaUp,
        "mouseenter": this.onAreaEnter,
        "mouseleave": this.onAreaLeave
      });

      this.offset.x = this.$sensor.offset().left;
      this.offset.y = this.$sensor.offset().top;
    },

    onAreaDown: function(event) {
      event.preventDefault();
      var
        mouseX = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageX : event.pageX,
        mouseY = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageY : event.pageY,
        exX = mouseX - hitArea.offset.x,
        exY = mouseY - hitArea.offset.y;

      artist.downMouse(exX, exY);

      if( artist.tool !== 1 ) {
        socket.drawCircle();
      } else {
        txtField.beginTextArea();
      }

      // timer.stop();
      
    },

    onAreaMove: function(event) {
      event.preventDefault();
      var
        mouseX = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageX : event.pageX,
        mouseY = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageY : event.pageY;

      artist.action(mouseX, mouseY);

      // name.move( "name_" + artist.name );

      // socket.mousemove();

      if( artist.tool === 1 ){
        extent.clear();
      } else {
        extent.drawExtent( artist.tool === 2 );
      }
    },

    onAreaUp: function(event) {
      event.preventDefault();

      artist.upMouse();

      if( artist.tool === 1 && txtField.active) {
        txtField.endTextArea();
      }

      // socket.saveImage();
      // timer.start();
    },

    onAreaEnter: function(event) {
      event.preventDefault();
      var
        mouseX = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageX : event.pageX,
        mouseY = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageY : event.pageY;
      artist.mouseX = artist.exMouseX = mouseX - hitArea.offset.x;
      artist.mouseY = artist.exMouseY = mouseY - hitArea.offset.y;

    },

    onAreaLeave: function(event) {
      event.preventDefault();
      var
        mouseX = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageX : event.pageX,
        mouseY = event.originalEvent.changedTouches? event.originalEvent.changedTouches[0].pageY : event.pageY;

      // artist.upMouse();
      if( artist.tool === 1 && txtField.active) {
        txtField.endTextArea();
      }

      artist.mouseX = artist.exMouseX = mouseX - hitArea.offset.x;
      artist.mouseY = artist.exMouseY = mouseY - hitArea.offset.y;

      extent.clear();
    }
  },

  // ========================================================
  // txt_field
  // 
  txtField = {
    $field: null,
    focusInput: null,
    minWidth: 100,
    minHeight: 50,
    active: false,

    sendTxtBtn: (function(){
      var btn = doc.createElement("div");
      btn.setAttribute("class", "send_txt");
      btn.innerHTML = "決&nbsp;定";
      return btn;
    }()),

    cancelTxtBtn: (function(){
      var btn = doc.createElement("div");
      btn.setAttribute("class", "send_cancel");
      btn.innerHTML = "キャンセル";
      return btn;
    }()),

    textAreaTemp: (function(){
      var textArea = doc.createElement("textarea");
      textArea.setAttribute("class", "inline_txt");
      return textArea;
    }()),

    init: function(){
      this.$field = doc.getElementById("txt_field");
    },

    onClickTxtAction: function( event ) {
      // console.log(event.currentTarget.data);
    },

    beginTextArea: function(){
      this.active = true;
      this.focusInput = this.textAreaTemp.cloneNode(true);
      this.focusInput.style.top = artist.mouseY + "px";
      this.focusInput.style.left = artist.mouseX + "px";
      this.$field.appendChild( this.focusInput );
    },

    setTextArea: function() {
      var
        areaWidth = Math.abs(artist.firstX - artist.mouseX),
        areaHeight = Math.abs(artist.firstY - artist.mouseY);

      this.focusInput.style.width = areaWidth + "px";
      this.focusInput.style.height = areaHeight + "px";

      if( artist.firstX > artist.mouseX ) {
        this.focusInput.style.left = artist.mouseX + "px";
      } else {
        this.focusInput.style.left = artist.firstX + "px";
      }

      if( artist.firstY > artist.mouseY ) {
        this.focusInput.style.top = artist.mouseY + "px";
      } else {
        this.focusInput.style.top = artist.firstY + "px";
      }
      
    },

    endTextArea: function(){
      this.active = false;
      this.textSet( this.focusInput );
      this.focusInput = null;
    },

    textSet: function( txtArea ){
      var that = {
        $txtArea: $(txtArea),
        $btnSend: null,
        $btnCancel: null,


        init: function(){
          var
            areaWidth = intAbs( this.$txtArea.width() ),
            areaHeight = intAbs( this.$txtArea.height() );

          this.$btnSend = $( txtField.sendTxtBtn.cloneNode(true) );
          this.$btnCancel = $( txtField.cancelTxtBtn.cloneNode(true) );

          this.$txtArea
          .css({
            "width": ( areaWidth < txtField.minWidth? txtField.minWidth : areaWidth ) + "px",
            "height": ( areaHeight < txtField.minHeight? txtField.minHeight : areaHeight ) + "px"
          });

          this.$btnSend
          .css({
            "top": intAbs(this.$txtArea.css("top")) + intAbs(this.$txtArea.outerHeight()) + 5 + "px",
            "left": intAbs(this.$txtArea.css("left")) + "px"
          });

          this.$btnCancel
          .css({
            "top": intAbs(this.$txtArea.css("top")) + intAbs(this.$txtArea.outerHeight()) + 5 + "px",
            "left": intAbs(this.$txtArea.css("left")) + 50 + "px"
          });


          canvasWrap.addElement( this.$btnSend[0] );
          canvasWrap.addElement( this.$btnCancel[0] );
          canvasWrap.addElement( this.$txtArea[0] );

          this.$txtArea.focus();

          this.$btnSend
          .on({
            "tap click": this.onAgree
          });

          this.$btnCancel
          .on({
            "tap click": this.onCancel
          });
        },

        onCancel: function( event ){
          event.preventDefault();
          that.delete();
        },

        delete: function(){
          canvasWrap.removeElement( that.$btnSend[0] );
          canvasWrap.removeElement( that.$txtArea[0] );
          canvasWrap.removeElement( that.$btnCancel[0] );

          that.$btnCancel.off();
          that.$btnSend.off();

          that =
          that.$txtArea =
          that.$btnCancel =
          that.$btnSend = null;
        },

        onAgree: function( event ){

          event.preventDefault();

          // canvas.inputText(
          //   that.$txtArea.val(),
          //   int(that.$txtArea.css("left")),
          //   int(that.$txtArea.css("top")),
          //   that.$txtArea.width() - int(artist.fontSize)
          // );

          socket.inputText({
            "str": that.$txtArea.val(),
            "x": int(that.$txtArea.css("left")),
            "y": int(that.$txtArea.css("top")),
            "width": that.$txtArea.width() - int(artist.fontSize),
            "drawColor": artist.drawColor
          });

          that.delete();
        }
      };
      // that.constructor = that;
      that.init();
    }
  },

  colorPallete = {
    $currentColor: null,
    $option: null,

    init: function(){
      this.$currentColor = $("#current_color");
      this.$option = this.$currentColor.siblings(".option");

      $("#custom").spectrum({
        color: "#000",
        flat: true,
        move: this.onPalleteMove,
        change: this.onPalleteMove
      });

      this.$option.hide();

      this.$currentColor
      .parent(".color_wrap")
      .on({
        "mouseenter": this.showOption,
        "mouseleave": this.hideOption
      });
    },

    showOption: function(event){
      event.preventDefault();
      colorPallete.$option
      .stop()
      .fadeTo("fast", 1);
    },

    hideOption: function(event){
      event.preventDefault();
      colorPallete.$option
      .stop()
      .fadeTo("fast", 0, function(){
        colorPallete.$option.hide();
      });
    },

    onPalleteMove: function( color ){
      // console.log(color.toHexString());
      var newColor = color.toHexString();

      colorPallete.$currentColor
      .css("backgroundColor", newColor);

      artist.setColor( newColor );
    }
  },

  // ========================================================
  // extent
  // 
  extent = {
    canvas: null,
    context: null,

    init: function(){
      this.canvas = doc.getElementById("extent");
      this.context = this.canvas.getContext("2d");

      this.canvas.width = CANVAS_WIDTH;
      this.canvas.height = CANVAS_HEIGHT;
    },

    clear: function(){
      this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    drawExtent: function( eraser ){
      // console.log( eraser )
      this.clear();
      this.context.beginPath();
      this.context.arc(artist.mouseX, artist.mouseY, (eraser? artist.eraserWidth : artist.brushWidth) / 2, 0, PI * 2, false);
      this.context.stroke();
    }
  },


  // ========================================================
  // canvas
  // 
  canvas = {
    txtField: null,
    canvasWrap: null,
    board: null,
    context: null,
    txtOffset: {
      x: 10,
      y: 15
    },

    dataURL: function(){
      return this.board.toDataURL();
    },

    getImageData: function(){
      return this.context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    drawSelfData: function(){
      this.context.drawImage( this.board, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
      this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);      
    },

    drawData: function( data ){
      // console.log(data);
      var img = null;
      if( data ){
        img = doc.createElement("img");
        img.addEventListener("load", this.onLoad, false);
        img.src = data;
      }
    },

    onLoad: function(event){
      canvas.context.drawImage( this, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
      this.removeEventListener("load");
    },

    init: function(){

      this.board = doc.getElementById("board");
      this.context = board.getContext("2d");

      this.board.width = CANVAS_WIDTH;
      this.board.height = CANVAS_HEIGHT;

      this.txtField = doc.getElementById("txt_field");
      this.canvasWrap = doc.getElementById("canvas_wrap");
      this.context.lineCap = "round";
    },

    drawLine: function( drawData ) {
      this.context.lineWidth = drawData.brushWidth;
      this.context.strokeStyle = drawData.drawColor;
      this.context.beginPath();
      this.context.moveTo( drawData.exMouseX, drawData.exMouseY );
      this.context.lineTo( drawData.mouseX, drawData.mouseY );
      this.context.stroke();
    },

    drawCircle: function( drawData ) {
      this.context.beginPath();
      this.context.arc(drawData.x, drawData.y, drawData.width / 2, 0, PI * 2, false);
      this.context.fillStyle = drawData.drawColor;
      this.context.fill();
    },

    isHalf: function( letter ){
      if ( (letter >= 0x0 && letter < 0x81) || (letter == 0xf8f0) || (letter >= 0xff61 && letter < 0xffa0) || (letter >= 0xf8f1 && letter < 0xf8f4)) {
        return true;
      }
      return false;
    },

    inputText: function( data ){
      var
        i = 0,
        len = data.str.length,
        strWidth = 0,
        wrap = 0,
        strRow = [],
        rowLen = 0;

      for( ; i < len; i ++ ){
        if( this.isHalf( data.str.charCodeAt(i) ) ){
          strWidth = strWidth + int(artist.fontSize) / 2;
        } else {
          strWidth = strWidth + int(artist.fontSize);
        }

        if( strWidth > data.width ){
          strRow.push( data.str.substring(wrap, i) );
          wrap = i;
          strWidth = 0;
        }
      }

      strRow.push( data.str.substring(wrap, len) );

      this.context.font = artist.fontSize + " " + artist.fontFamily;
      this.context.fillStyle = data.drawColor;

      for( i = 0, rowLen = strRow.length; i < rowLen; i ++){
        this.context.fillText(strRow[i], data.x + this.txtOffset.x, data.y + this.txtOffset.y + (i * int(artist.fontSize)), data.width);
      }
    }

  },


  // ========================================================
  // chat
  // 
  chat = {
    $chatBox: null,
    $textarea: null,
    $commentBox: null,
    $header: null,
    $inner: null,

    blockElement: (function(){
      var elem = doc.createElement("div");
      elem.setAttribute("class", "chat_block");
      return elem;
    }()),

    nameElement: (function(){
      var elem = doc.createElement("span");
      elem.setAttribute("class", "name");
      return elem;
    }()),

    messageElement: (function(){
      var elem = doc.createElement("span");
      elem.setAttribute("class", "message");
      return elem;
    }()),

    prevName: "",

    init: function(){
      this.$chatBox = $("#chat");
      this.$commentBox = this.$chatBox.find(".comment_box");
      this.$textarea = this.$chatBox.find("textarea.chat_txt");
      this.$header = this.$chatBox.find(".chat_header");
      this.$inner = this.$commentBox.find(".comment_inner");

      this.$header
      .on({
        "tap click": this.toggleShow
      });

      this.$textarea
      .on({
        "keyup": this.checkKey
      });
    },

    checkKey: function(event){
      event.preventDefault();
      if( chat.$textarea.val() === "\n" ){
        chat.$textarea.val("");
      }
      if( event.keyCode === 13 && chat.$textarea.val() !== "" ){
        chat.sendMessage();
      }
    },

    toggleShow: function(event){
      event.preventDefault();
      chat.$chatBox.toggleClass("blur");
    },

    getMessage: function( data ){
      var
        chatBlock = this.blockElement.cloneNode(),
        messageBlock = this.messageElement.cloneNode(),
        nameBlock;

      if( data.name !== this.prevName ){
        nameBlock = this.nameElement.cloneNode();
        nameBlock.innerHTML = data.name + ":&nbsp;";
        chatBlock.appendChild( nameBlock );

        this.prevName = data.name;
      }

      messageBlock.innerHTML = data.message;
      chatBlock.appendChild( messageBlock );

      this.$inner.append(chatBlock);

      this.$commentBox
      .scrollTop( this.$inner.outerHeight() - 200 );

    },

    sendMessage: function(){

      socket.chat({
        "name": artist.name,
        "message": this.encodeHTML( this.$textarea.val() )
      });
      this.$textarea.val("");
    },

    encodeHTML: function(postedString){
      var s = postedString;
      s = s.replace("#",  "&#40;");
      s = s.replace("&",  "&#40;");
      s = s.replace(">",  "&gt;");
      s = s.replace("<",  "&lt;");
      s = s.replace("\'", "&quot;");
      s = s.replace("\'", "&#039;");
      s = s.replace(" ",  "&nbsp;");
      s = s.replace("(",  "&#40;");
      s = s.replace(")",  "&#40;");
      s = s.replace("\n", "<br>");
      return s;
    }
  },

  // ========================================================
  // artist
  // 
  artist = {
    name: "test_user",
    sessionId: 0,
    tool: 0,// 0: brush, 1: text, 2: eraser
    brushWidth: 1,// 1~30
    maxBrushWidth: 30,
    minBrushWidth: 1,
    eraserWidth: 1,
    drawColor: "#000",
    mouseX: 0,
    mouseY: 0,
    exMouseX: 0,
    exMouseY: 0,
    firstX: 0,
    firstY: 0,
    drag: false,
    fontSize: "13px",
    fontFamily: 'Verdana, Arial, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "メイリオ", Meiryo, Osaka, "ＭＳ Ｐゴシック", "MS PGothic", sans-serif',
    setName: function(inputName) {
      this.name = inputName || this.name;
      return this;
    },
    setColor: function(inputColor) {
      this.drawColor = inputColor;
      return this;
    },
    setTool: function(toolNum) {
      this.tool = toolNum;
      return this;
    },
    setBrushWidth: function(brushWidth) {
      this.brushWidth = brushWidth;
      return this;
    },
    setEraserWidth: function(eraserWidth) {
      this.eraserWidth = eraserWidth;
      return this;
    },
    downMouse: function( x, y ) {
      this.drag = true;
      this.mouseX = this.exMouseX = this.firstX = x || 0;
      this.mouseY = this.exMouseY = this.firstY = y || 0;
      return this;
    },
    upMouse: function() {
      this.drag = false;
      return this;
    },
    action: function(pageX, pageY){

      this.exMouseX = this.mouseX;
      this.exMouseY = this.mouseY;
      this.mouseX = pageX - hitArea.offset.x;
      this.mouseY = pageY - hitArea.offset.y;

      if( this.drag ) {
        this.drawType[ this.tool ]();
      } else {
        socket.mousemove();
      }

      return this;
    },
    drawType: [
      // brush
      function(){
        socket.drawLine();
      },
      // text
      function(){
        txtField.setTextArea();
      },
      // eraser
      function(){
        socket.drawLine(true);
      }
    ]
  },

  // ========================================================
  // init
  // 
  init = function() {

    $("#menu .save")
    .on({
      "tap click": function(event){
        event.preventDefault();
        window.open( canvas.dataURL(), "_blank" );
      }
    });

    $overlay = $("#overlay");
    
    socket.init();
  };

  // ========================================================
  // document.ready
  // 
  $(function() {
    init();
  });

}(window, jQuery));