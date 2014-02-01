angular.module('ui.imagedrop', [])
    .directive("imagedrop", function ($parse) {
        return {
            restrict: "EA",
            link: function (scope, element, attrs) {
                //The on-image-drop event attribute
                var onImageDrop = $parse(attrs.onImageDrop);

                //When an item is dragged over the document, add .dragOver to the body
                var onDragOver = function (e) {
                    e.preventDefault();
                    //$('body').addClass("dragOver");
                    if(document.body.className.indexOf('dragOver')<0){
                        document.body.className += "dragOver";
                    }

                };

                //When the user leaves the window, cancels the drag or drops the item
                var onDragEnd = function (e) {
                    e.preventDefault();
                    //$('body').removeClass("dragOver");
                    document.body.className = document.body.className.replace("dragOver","");
                };

                //When a file is dropped on the overlay
                var loadFile = function (dataUrl) {

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

                        var dataUrl = e.dataTransfer.getData('URL');

                        if(!dataUrl){
                            var reader = new FileReader();

                            // Closure to capture the file information.
                            reader.onload = (function(theFile) {
                                return function(evt) {
                                    dataUrl = evt.target.result;
                                    loadFile(dataUrl);
                                };
                            })(e.dataTransfer.files[0]);

                            reader.readAsDataURL(e.dataTransfer.files[0]);
                        }
                        else{
                          loadFile(dataUrl);
                        }
                    });
            }
        };
    });