//  Tokenizator by Roberto Arosemena
//  v 1.2.0

document.oncontextmenu = function() { return false; }

var app = angular.module('app', []);

app.controller('main', function($scope){

    $scope.imageDropped = function(){
        var qrCode = decodeURIComponent($scope.qrCode);
        $scope.entry.secret = getParams(qrCode.substring(qrCode.indexOf('?')+1))["secret"];
        $scope.entry.name = qrCode.substring(qrCode.indexOf('otp/')+4, qrCode.indexOf('?'));

        function getParams (uri) {
            var match,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

            var urlParams = {};
            while (match = search.exec(uri))
                urlParams[decode(match[1])] = decode(match[2]);

            return urlParams;
        }
    };

  $scope.updateTokens = function() {
    var k = $scope.appData.keys;
    for(var i = 0; i < k.length; i++){
      k[i].key = auth(k[i].secret, epoch());
    }
    $scope.appData.keys = k;
  }

  $scope.saveToken = function(){
    if(typeof $scope.entry.secret !== 'undefined' && $scope.entry.secret.length > 0) {
      $scope.entry.secret = $scope.entry.secret.replace(' ', '');
      $scope.entry.key = auth($scope.entry.secret, epoch());
      $scope.appData.keys.push($scope.entry);
      $scope.page.active = 'password';
      $scope.entry = {};
      chrome.storage.local.set({'appData' : $scope.appData});
    }
  }

  $scope.reader = function(e) {
    var translate = { "49" : 0, "50" : 1, "51" : 2, "52" : 3, "53" : 4, "54" : 5,
                      "55" : 6, "56" : 7, "57" : 8, "58" : 9, "48" : 10, "189" : 11,
                      "187" : 12, "8" : 13 }
    if($scope.page.active == 'password') {
      $scope.copy(translate[e.which]);  
    }
  }

  $scope.changeActive = function(a) {
    if($scope.page.active != 'loading') {
      $scope.page.active = a;
    }
  }

  $scope.killKey = function(i) {
    $scope.appData.keys.splice(i, 1);
    chrome.storage.local.set({'appData' : $scope.appData}, function(){});
  }

  $scope.cancelAdd = function() {
    $scope.entry = {};
    $scope.page.active = 'password'
  }

  $scope.copy = function(i) {
    if(typeof $scope.appData.keys[i] !== 'undefined') {
      document.oncopy = function(e) {
        e.clipboardData.setData('text/plain', $scope.appData.keys[i].key);
        e.preventDefault();
      }
      document.execCommand("Copy", false, null);
      $scope.flashMessage("Copied " + $scope.appData.keys[i].key + "!");
    }
  }

  $scope.flashMessage = function(msg){
    $scope.page.message = msg;
    $scope.messageTimer = setTimeout(function(){
      $scope.page.message = '';
    }, 1500);
  }

  $scope.page = {active : 'loading'};
  chrome.storage.local.get('appData', function(o){
    var defaultData = { keys: [{ name   : 'Example key', 
                                 secret : 'WIJO6RF64FV7GTQ2', 
                                 key    : '' }]};
    if(typeof o.appData === 'undefined') {
      chrome.storage.local.set({'appData' : defaultData});
      $scope.appData = defaultData;
    } else {
      $scope.appData = o.appData;
    }
    $scope.updateTokens();

    setInterval(function(){
      var s = new Date();
      s = s.getSeconds();
      s = s > 30 ? s - 30 : s;
      $scope.$apply(function(){
        $scope.timer = ((30 - s) * 100) / 30;
        if(s == 0 || s == 30) {
          $scope.updateTokens();
        }
      })
    }, 1000);
    $scope.page = {active : 'password'};
    $scope.flashMessage('Loading complete!');
  });
  $scope.entry = {};

});

app.directive("imagedrop", function ($parse) {
        return {
            restrict: "EA",
            link: function (scope, element, attrs) {
                //The on-image-drop event attribute
                var onImageDrop = $parse(attrs.onImageDrop);

                //When an item is dragged over the document, add .dragOver to the body
                var onDragOver = function (e) {
                    e.preventDefault();
                };

                //When the user leaves the window, cancels the drag or drops the item
                var onDragEnd = function (e) {
                    e.preventDefault();
                };

                var loadDataUrl = function (dataUrl) {
                    qrcode.callback = function(data){
                        scope.qrCode = data;
                        scope.$apply(onImageDrop(scope));
                    };
                    qrcode.decode(dataUrl);
                };

                //Dragging begins on the document (shows the overlay)
                element.bind("dragover", onDragOver);

                //Dragging ends on the overlay, which takes the whole window
                element.bind("dragleave", onDragEnd)
                    .bind("drop", function (e) {
                        onDragEnd(e);

                        //Dropped from another browser window
                        var dataUrl = e.dataTransfer.getData('URL');

                        if(!dataUrl){
                            //Dropped from local file system
                            var reader = new FileReader();

                            // Closure to capture the file information.
                            reader.onload = (function(theFile) {
                                return function(evt) {
                                    dataUrl = evt.target.result;
                                    loadDataUrl(dataUrl);
                                };
                            })(e.dataTransfer.files[0]);

                            reader.readAsDataURL(e.dataTransfer.files[0]);
                        }
                        else{
                            loadDataUrl(dataUrl);
                        }
                    });
            }
        };
    });


window.app = app;


function epoch() {
  return Math.floor(new Date().valueOf() / 30000);
}

// Authentication function
function auth(K,t) {
  function sha1(C){
    function L(x,b){return x<<b|x>>>32-b;}
    var l=C.length,D=C.concat([1<<31]),V=0x67452301,W=0x88888888,
        Y=271733878,X=Y^W,Z=0xC3D2E1F0;W^=V;
    do D.push(0);while(D.length+1&15);D.push(32*l);
    while (D.length){
      var E=D.splice(0,16),a=V,b=W,c=X,d=Y,e=Z,f,k,i=12;
      function I(x){var t=L(a,5)+f+e+k+E[x];e=d;d=c;c=L(b,30);b=a;a=t;}
      for(;++i<77;)E.push(L(E[i]^E[i-5]^E[i-11]^E[i-13],1));
      k=0x5A827999;for(i=0;i<20;I(i++))f=b&c|~b&d;
      k=0x6ED9EBA1;for(;i<40;I(i++))f=b^c^d;
      k=0x8F1BBCDC;for(;i<60;I(i++))f=b&c|b&d|c&d;
      k=0xCA62C1D6;for(;i<80;I(i++))f=b^c^d;
      V+=a;W+=b;X+=c;Y+=d;Z+=e;}
    return[V,W,X,Y,Z];
  }
  var k=[],l=[],i=0,j=0,c=0;
  for (;i<K.length;){
    c=c*32+'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.
      indexOf(K.charAt(i++).toUpperCase());
    if((j+=5)>31)k.push(Math.floor(c/(1<<(j-=32)))),c&=31;}
  j&&k.push(c<<(32-j));
  for(i=0;i<16;++i)l.push(0x6A6A6A6A^(k[i]=k[i]^0x5C5C5C5C));
  var s=sha1(k.concat(sha1(l.concat([0,t])))),o=s[4]&0xF;
  var r = ((s[o>>2]<<8*(o&3)|(o&3?s[(o>>2)+1]>>>8*(4-o&3):0))&-1>>>1)%1000000;
  r = r.toString();
  while(r.length < 6) {
    r = '0' + r;
  }
  return r;
}