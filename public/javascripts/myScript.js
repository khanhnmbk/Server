/*
***********************************************************************************************
                                Document ready 
***********************************************************************************************
*/
$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();

  $('body').keyup(function (e) {
    if (e.keyCode == 27) {
      stopDraw(true);
    }
  });

  $('.table-body tr').click(function () {
    $(this).children('td').children('div').children('input').prop('checked', true);
    $('.table-body tr').removeClass('row-selected');
    $(this).toggleClass('row-selected');
  });

  $('#btnRun').on('click', function (clickEvent) {
    $(this).prop('disabled', true);
    $('#btnStop').prop('disabled', false);
    draggableObjects.forEach(function (item) {
      item.disabled = true;
    });
    $('.draggable').draggable('disable');
  });

  $('#btnStop').on('click', function (clickEvent) {
    $(this).prop('disabled', true);
    $('#btnRun').prop('disabled', false);
    draggableObjects.forEach(function (item) {
      item.disabled = false;
    });
    $('.draggable').draggable('enable');
    console.log(draggableObjects);
  });

});

/*
***********************************************************************************************
                                Global variables and functions
***********************************************************************************************
*/
//SVG global variable
const draw = SVG('mainPage1');
const shapes = [];
const draggableObjects = [];
let index = 0;
let shape;
let selectedItemId;

//Default option for basic objects except LINE
const defaultOption = {
  stroke: 'black',
  'stroke-width': 3,
  'fill-opacity': 0,
};

//Line default option
const defaultLineOption = {
  stroke: 'black',
  'stroke-width': 5,
  'stroke-linecap': 'round'
};

//Add context menu
function addContextMenu() {
  $('.contextMenu').on('contextmenu', function (e) {

    selectedItemId = e.target.id;
    while (!selectedItemId) {
      selectedItemId = e.target.parentNode.id;
    }

    var top = e.pageY + 10;
    var left = e.pageX + 10;
    $("#context-menu").css({
      display: "block",
      top: top,
      left: left
    }).addClass("show");
    return false; //blocks default Webbrowser right click menu
  });
  $('#mainPage1').on("click", function () {
    $("#context-menu").removeClass("show").hide();
    selectedItemId = '';
  });

  $("#context-menu a").on("click", function () {
    $(this).parent().removeClass("show").hide();
  });

}

//Delete element
function removeItem() {
  if (selectedItemId) {
    var item = document.getElementById(selectedItemId);
    item.parentNode.removeChild(item);

    for (var elem of shapes) {
      try {
        if (elem.node.id == selectedItemId) {
          shapes.splice(shapes.indexOf(elem), 1);
          index--;
          break;
        }
      }
      catch{
        if (elem.id == selectedItemId) {
          shapes.splice(shapes.indexOf(elem), 1);
          index--;
          break;
        }
      }
    }


    for (var draggableItem of draggableObjects) {
      if (draggableItem.element.id == selectedItemId) {
        draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
        break;
      }
    }

  };

  selectedItemId = '';

}

var hexDigits = new Array
  ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

//Function to convert rgb color to hex format
function rgb2hex(rgb) {
  rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}



/*
***********************************************************************************************
                                Create object functions 
***********************************************************************************************
*/

//startDraw function: Start drawing object depending on the parameter
//Input: shape (except POLYGON)
var startDraw = function (shape) {
  var modalId = '';
  //Stop the previous draw
  stopDraw(false);

  //Subscribe mouse down event
  draw.on('mousedown', function (event) {
    switch (shape) {
      case 'line': {
        shapes[index] = draw.line().attr(defaultLineOption);
        modalId = '#lineModal';
        break;
      }
      case 'ellipse': {
        shapes[index] = draw.ellipse().attr(defaultOption);
        modalId = '#ellipseModal';
        break;
      }
      case 'circle': {
        shapes[index] = draw.circle(10).attr(defaultOption);
        modalId = '#circleModal';
        break;
      }
      case 'rect': {
        shapes[index] = draw.rect().attr(defaultOption);
        modalId = '#rectModal';
        break;
      }
      case 'roundRect': {
        shapes[index] = draw.rect().attr(defaultOption);
        shapes[index].radius(10);
        modalId = '#roundRectModal';
        break;
      }
    }
    shapes[index].draw(event);
  }, false);

  //Subscribe mouse up event
  draw.on('mouseup', function (event) {
    shapes[index].draw(event);

    //Subscribe mouse over event for each object
    shapes[index].on('mouseover', function (event) {
      event.target.style.opacity = 0.4;
      //event.target.style.cursor = 'move';
    });
    //Subscribe mouse out event for each object
    shapes[index].on('mouseout', function (event) {
      event.target.style.opacity = 1;
    });

    //Subscribe double click event to open modal
    shapes[index].on('dblclick', function (mouseEvent) {
      $(modalId).one('show.bs.modal', function (showEvent) {

        var htmlElement = mouseEvent.target.getBoundingClientRect();
        var svgOffset = mouseEvent.target.parentNode.getBoundingClientRect();
        var element;
        for (var item of shapes) {

          try {
            if (item.node.id == mouseEvent.target.id) {
              element = item;
              break;
            }
          }
          catch{
            if (item.id == mouseEvent.target.id) {
              element = item;
              break;
            }
          }

        }

        switch (modalId) {
          case '#lineModal': {
            if (element) {
              var elemX1 = Math.round(htmlElement.left - svgOffset.left),
                elemY1 = Math.round(htmlElement.top - svgOffset.top),
                elemX2 = Math.round(htmlElement.right - svgOffset.left),
                elemY2 = Math.round(htmlElement.bottom - svgOffset.top),
                elemWidth = element.attr('stroke-width'),
                elemLinecap = element.attr('stroke-linecap'),
                elemColor = element.attr('stroke');

              var itemModal = $(modalId)[0];

              itemModal.querySelector('#inputX1').value = elemX1;
              itemModal.querySelector('#inputY1').value = elemY1;
              itemModal.querySelector('#inputX2').value = elemX2;
              itemModal.querySelector('#inputY2').value = elemY2;
              itemModal.querySelector('#inputStrokeWidth').value = elemWidth;
              itemModal.querySelector('#inputColor').value = elemColor;
              itemModal.querySelector('#inputLinecap').value = elemLinecap;

              if (mouseEvent.target.hiddenWhen) {
                itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
              }
              else {
                itemModal.querySelector('.inputHiddenWhen').value = '';
              }

              $('.saveChangeButton').on('click', function (event) {
                element.attr({
                  'stroke-width': itemModal.querySelector('#inputStrokeWidth').value,
                  'stroke-linecap': itemModal.querySelector('#inputLinecap').value,
                  'stroke': itemModal.querySelector('#inputColor').value,
                  'x1': itemModal.querySelector('#inputX1').value,
                  'y1': itemModal.querySelector('#inputY1').value,
                  'x2': itemModal.querySelector('#inputX2').value,
                  'y2': itemModal.querySelector('#inputY2').value,
                  'transform': 'translate(0,0)',
                });
                mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

                var html = document.getElementById(mouseEvent.target.id);
                for (draggableItem of draggableObjects) {
                  if (draggableItem.element.id == html.id) {
                    draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
                    break;
                  }
                }
                draggable = new PlainDraggable(html, { leftTop: true });
                draggable.autoScroll = true;
                draggable.containment = document.getElementById('mainPage1');
                draggableObjects.push(draggable);
              });

              $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
                $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
                  if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                    itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
                  }
                });
              });

            }
            break;
          }

          case '#rectModal': {
            if (element) {

              var elemWidth = parseInt(element.attr('width'), 10),
                elemHeight = parseInt(element.attr('height'), 10),
                elemPositionX = Math.round(htmlElement.left - svgOffset.left),
                elemPositionY = Math.round(htmlElement.top - svgOffset.top),
                elemLineWidth = element.attr('stroke-width'),
                elemColor = element.attr('stroke');


              var itemModal = $(modalId)[0];

              itemModal.querySelector('#inputWidth').value = elemWidth;
              itemModal.querySelector('#inputHeight').value = elemHeight;
              itemModal.querySelector('#inputPositionX').value = elemPositionX;
              itemModal.querySelector('#inputPositionY').value = elemPositionY;
              itemModal.querySelector('#inputShapeLineWidth').value = elemLineWidth;
              itemModal.querySelector('#inputLineColor').value = elemColor;
              itemModal.querySelector('#fillRectCheckbox').checked = element.attr('fill-opacity');
              itemModal.querySelector('#inputFillRectColor').value = element.attr('fill');
              if (mouseEvent.target.hiddenWhen) {
                itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
              }
              else {
                itemModal.querySelector('.inputHiddenWhen').value = '';
              }

              $('.saveChangeButton').on('click', function (event) {
                element.attr({
                  'stroke-width': itemModal.querySelector('#inputShapeLineWidth').value,
                  'stroke': itemModal.querySelector('#inputLineColor').value,
                  'width': itemModal.querySelector('#inputWidth').value,
                  'height': itemModal.querySelector('#inputHeight').value,
                  'x': itemModal.querySelector('#inputPositionX').value,
                  'y': itemModal.querySelector('#inputPositionY').value,
                  'transform': 'translate(0 0)',
                  'fill-opacity': Number(itemModal.querySelector('#fillRectCheckbox').checked),
                  'fill': itemModal.querySelector('#inputFillRectColor').value,
                });

                mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

                var html = document.getElementById(mouseEvent.target.id);
                for (draggableItem of draggableObjects) {
                  if (draggableItem.element.id == html.id) {
                    draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
                    break;
                  }
                }
                draggable = new PlainDraggable(html, { leftTop: true });
                draggable.autoScroll = true;
                draggable.containment = document.getElementById('mainPage1');
                draggableObjects.push(draggable);
              });

              $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
                $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
                  if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                    itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
                  }
                });
              });

            }
            break;
          }

          case '#roundRectModal': {
            if (element) {
              var elemWidth = parseInt(element.attr('width'), 10),
                elemHeight = parseInt(element.attr('height'), 10),
                elemPositionX = Math.round(htmlElement.left - svgOffset.left),
                elemPositionY = Math.round(htmlElement.top - svgOffset.top),
                elemRadiusX = parseInt(element.attr('rx'), 10),
                elemRadiusY = parseInt(element.attr('ry'), 10),
                elemLineWidth = element.attr('stroke-width'),
                elemColor = element.attr('stroke');

              var itemModal = $(modalId)[0];

              itemModal.querySelector('#inputWidth').value = elemWidth;
              itemModal.querySelector('#inputHeight').value = elemHeight;
              itemModal.querySelector('#inputPositionX').value = elemPositionX;
              itemModal.querySelector('#inputPositionY').value = elemPositionY;
              itemModal.querySelector('#inputRadiusX').value = elemRadiusX;
              itemModal.querySelector('#inputRadiusY').value = elemRadiusY;
              itemModal.querySelector('#inputShapeLineWidth').value = elemLineWidth;
              itemModal.querySelector('#inputShapeColor').value = elemColor;
              itemModal.querySelector('#fillRoundRectCheckbox').checked = element.attr('fill-opacity');
              itemModal.querySelector('#inputFillShapeColor').value = element.attr('fill');

              if (mouseEvent.target.hiddenWhen) {
                itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
              }
              else {
                itemModal.querySelector('.inputHiddenWhen').value = '';
              }

              $('.saveChangeButton').on('click', function (event) {
                element.attr({
                  'stroke-width': itemModal.querySelector('#inputShapeLineWidth').value,
                  'stroke': itemModal.querySelector('#inputShapeColor').value,
                  'width': itemModal.querySelector('#inputWidth').value,
                  'height': itemModal.querySelector('#inputHeight').value,
                  'x': itemModal.querySelector('#inputPositionX').value,
                  'y': itemModal.querySelector('#inputPositionY').value,
                  'rx': itemModal.querySelector('#inputRadiusX').value,
                  'ry': itemModal.querySelector('#inputRadiusY').value,
                  'transform': 'translate(0 0)',
                  'fill-opacity': Number(itemModal.querySelector('#fillRoundRectCheckbox').checked),
                  'fill': itemModal.querySelector('#inputFillShapeColor').value,
                });

                mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

                var html = document.getElementById(mouseEvent.target.id);
                for (draggableItem of draggableObjects) {
                  if (draggableItem.element.id == html.id) {
                    draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
                    break;
                  }
                }
                draggable = new PlainDraggable(html, { leftTop: true });
                draggable.autoScroll = true;
                draggable.containment = document.getElementById('mainPage1');
                draggableObjects.push(draggable);
              });

              $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
                $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
                  if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                    itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
                  }
                });
              });
            }
            break;
          }

          case '#circleModal': {
            if (element) {
              var elemCx = Math.round(htmlElement.left - svgOffset.left + (htmlElement.right - htmlElement.left) / 2),
                elemCy = Math.round(htmlElement.top - svgOffset.top + (htmlElement.bottom - htmlElement.top) / 2),
                elemRadius = parseInt(element.attr('r'), 10),
                elemLineWidth = parseInt(element.attr('stroke-width'), 10),
                elemColor = element.attr('stroke');

              var elemIsFilled = false;
              if (element.attr('fill-opacity') != 0) elemIsFilled = true;

              var itemModal = $(modalId)[0];

              itemModal.querySelector('#inputRadius').value = elemRadius;
              itemModal.querySelector('#inputPositionX').value = elemCx;
              itemModal.querySelector('#inputPositionY').value = elemCy;
              itemModal.querySelector('#inputShapeLineWidth').value = elemLineWidth;
              itemModal.querySelector('#inputShapeColor').value = elemColor;
              itemModal.querySelector('#fillCircleCheckbox').checked = element.attr('fill-opacity');
              itemModal.querySelector('#inputFillShapeColor').value = element.attr('fill');

              if (mouseEvent.target.hiddenWhen) {
                itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
              }
              else {
                itemModal.querySelector('.inputHiddenWhen').value = '';
              }

              $('.saveChangeButton').on('click', function (event) {
                element.attr({
                  'r': itemModal.querySelector('#inputRadius').value,
                  'stroke-width': itemModal.querySelector('#inputShapeLineWidth').value,
                  'stroke': itemModal.querySelector('#inputShapeColor').value,
                  'cx': itemModal.querySelector('#inputPositionX').value,
                  'cy': itemModal.querySelector('#inputPositionY').value,
                  'transform': 'translate(0 0)',
                  'fill-opacity': Number(itemModal.querySelector('#fillCircleCheckbox').checked),
                  'fill': itemModal.querySelector('#inputFillShapeColor').value,
                });

                mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

                var html = document.getElementById(mouseEvent.target.id);
                for (draggableItem of draggableObjects) {
                  if (draggableItem.element.id == html.id) {
                    draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
                    break;
                  }
                }
                draggable = new PlainDraggable(html, { leftTop: true });
                draggable.autoScroll = true;
                draggable.containment = document.getElementById('mainPage1');
                draggableObjects.push(draggable);
              });

              $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
                $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
                  if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                    itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
                  }
                });
              });
            }
            break;
          }

          case '#ellipseModal': {
            if (element) {
              var elemCx = Math.round(htmlElement.left - svgOffset.left + (htmlElement.right - htmlElement.left) / 2),
                elemCy = Math.round(htmlElement.top - svgOffset.top + (htmlElement.bottom - htmlElement.top) / 2),
                elemRadiusX = parseInt(element.attr('rx'), 10),
                elemRadiusY = parseInt(element.attr('ry'), 10),
                elemLineWidth = parseInt(element.attr('stroke-width'), 10),
                elemColor = element.attr('stroke');

              var elemIsFilled = false;
              if (element.attr('fill-opacity') != 0) elemIsFilled = true;

              var itemModal = $(modalId)[0];

              itemModal.querySelector('#inputRadiusX').value = elemRadiusX;
              itemModal.querySelector('#inputRadiusY').value = elemRadiusY;
              itemModal.querySelector('#inputPositionX').value = elemCx;
              itemModal.querySelector('#inputPositionY').value = elemCy;
              itemModal.querySelector('#inputShapeLineWidth').value = elemLineWidth;
              itemModal.querySelector('#inputShapeColor').value = elemColor;
              itemModal.querySelector('#fillEllipseCheckbox').checked = element.attr('fill-opacity');
              itemModal.querySelector('#inputFillShapeColor').value = element.attr('fill');

              if (mouseEvent.target.hiddenWhen) {
                itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
              }
              else {
                itemModal.querySelector('.inputHiddenWhen').value = '';
              }

              $('.saveChangeButton').on('click', function (event) {
                element.attr({
                  'stroke-width': itemModal.querySelector('#inputShapeLineWidth').value,
                  'stroke': itemModal.querySelector('#inputShapeColor').value,
                  'cx': itemModal.querySelector('#inputPositionX').value,
                  'cy': itemModal.querySelector('#inputPositionY').value,
                  'transform': 'translate(0 0)',
                  'rx': itemModal.querySelector('#inputRadiusX').value,
                  'ry': itemModal.querySelector('#inputRadiusY').value,
                  'fill-opacity': Number(itemModal.querySelector('#fillEllipseCheckbox').checked),
                  'fill': itemModal.querySelector('#inputFillShapeColor').value,
                });

                mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

                var html = document.getElementById(mouseEvent.target.id);
                for (draggableItem of draggableObjects) {
                  if (draggableItem.element.id == html.id) {
                    draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
                    break;
                  }
                }
                draggable = new PlainDraggable(html, { leftTop: true });
                draggable.autoScroll = true;
                draggable.containment = document.getElementById('mainPage1');
                draggableObjects.push(draggable);
              });

              $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
                $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
                  if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                    itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
                  }
                });
              });
            }
            break;
          }
        }
      });

      $(modalId).one('hide.bs.modal', function (hideEvent) {
        $('.saveChangeButton').off('click');
        $('.btnHiddenWhen').off('click');
      });

      $(modalId).modal();
    });

    //Add draggable feature
    var element = document.getElementById(shapes[index].node.id);

    draggable = new PlainDraggable(element, { leftTop: true });
    draggable.autoScroll = true;
    draggable.containment = document.getElementById('mainPage1');
    draggableObjects.push(draggable);

    console.log(draggableObjects);


    //Add contextMenu class
    $(element).addClass('contextMenu');

    //Increase index to append the array
    //console.log(shapes);
    index++;
  }, false);
}

//drawPolygon function: Draw polygon
var drawPolygon = function () {
  stopDraw(false);
  shapes[index] = draw.polygon().draw();

  //Polygon attribute
  shapes[index].attr({
    'fill-opacity': 0,
    'stroke-width': 3,
  })

  //Subscribe drawstart event 
  shapes[index].on('drawstart', function (e) {
    //Subscribe mouseover event for each polygon
    shapes[index].on('mouseover', function (event) {
      event.target.style.opacity = 0.4;
      //event.target.style.cursor = 'move';
    });
    //Subscribe mouseout event for each polygon
    shapes[index].on('mouseout', function (event) {
      event.target.style.opacity = 1;
    });

    shapes[index].on('dblclick', function (mouseEvent) {
      $('#polygonModal').one('show.bs.modal', function (showEvent) {
        var element;
        for (var item of shapes) {
          if (item.node.id == mouseEvent.target.id) {
            element = item;
            break;
          }
        }

        if (element) {
          var elemWidth = element.attr('stroke-width'),
            elemColor = element.attr('stroke');


          var itemModal = $('#polygonModal')[0];

          itemModal.querySelector('#inputShapeLineWidth').value = elemWidth;
          itemModal.querySelector('#inputShapeColor').value = elemColor;

          itemModal.querySelector('#fillPolygonCheckbox').checked = element.attr('fill-opacity');
          itemModal.querySelector('#inputFillShapeColor').value = element.attr('fill');

          if (mouseEvent.target.hiddenWhen) {
            itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
          }
          else {
            itemModal.querySelector('.inputHiddenWhen').value = '';
          }

          $('.saveChangeButton').on('click', function (event) {
            element.attr({
              'stroke-width': itemModal.querySelector('#inputShapeLineWidth').value,
              'stroke': itemModal.querySelector('#inputShapeColor').value,
              'fill-opacity': Number(itemModal.querySelector('#fillPolygonCheckbox').checked),
              'fill': itemModal.querySelector('#inputFillShapeColor').value,
            });

            mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

          });

          $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
            $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
              if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
              }
            });
          });
        }

      });

      $('#polygonModal').one('hide.bs.modal', function (hideEvent) {
        $('.saveChangeButton').off('click');
        $('.btnHiddenWhen').off('click');
      });

      $('#polygonModal').modal();
    });

    //Add draggable feature
    var element = document.getElementById(shapes[index].node.id);
    draggable = new PlainDraggable(element, { leftTop: true });
    draggable.autoScroll = true;
    draggable.containment = document.getElementById('mainPage1');
    draggableObjects.push(draggable);

    //Add contextMenu class
    $(element).addClass('contextMenu');


    //Subscribe keydown event to detect ENTER key
    document.addEventListener('keydown', keyEnterDownHandler);
  });

  //Subscribe drawstop event: This event fires when <object>.draw('done') executes 
  shapes[index].on('drawstop', function () {
    //Remove enter key event
    document.removeEventListener('keydown', keyEnterDownHandler);
  });
}

//drawPolyline function: Draw polyline
var drawPolyline = function () {
  stopDraw(false);
  shapes[index] = draw.polyline().draw();

  //Polygon attribute
  shapes[index].attr({
    'fill-opacity': 0,
    'stroke-width': 3,
  })

  //Subscribe drawstart event 
  shapes[index].on('drawstart', function (e) {

    //Subscribe mouseover event for each polygon
    shapes[index].on('mouseover', function (event) {
      event.target.style.opacity = 0.4;
      //event.target.style.cursor = 'move';
    });
    //Subscribe mouseout event for each polygon
    shapes[index].on('mouseout', function (event) {
      event.target.style.opacity = 1;
    });
    //Subscribe double click event
    shapes[index].on('dblclick', function (mouseEvent) {
      $('#polylineModal').one('show.bs.modal', function (showEvent) {
        var element;
        for (var item of shapes) {
          if (item.node.id == mouseEvent.target.id) {
            element = item;
            break;
          }
        }

        if (element) {
          var elemWidth = element.attr('stroke-width'),
            elemColor = element.attr('stroke');

          var itemModal = $('#polylineModal')[0];

          itemModal.querySelector('#inputWidth').value = elemWidth;
          itemModal.querySelector('#inputColor').value = elemColor;

          if (mouseEvent.target.hiddenWhen) {
            itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
          }
          else {
            itemModal.querySelector('.inputHiddenWhen').value = '';
          }

          $('.saveChangeButton').on('click', function (event) {
            element.attr({
              'stroke-width': itemModal.querySelector('#inputWidth').value,
              'stroke': itemModal.querySelector('#inputColor').value,
            });

            mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;
          });

          $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
            $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
              if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
                itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
              }
            });
          });
        }
      });


      $('#polylineModal').one('hide.bs.modal', function (hideEvent) {
        $('.saveChangeButton').off('click');
        $('.btnHiddenWhen').off('click');
      });

      $('#polylineModal').modal();
    });

    //Add draggable feature
    var element = document.getElementById(shapes[index].node.id);
    draggable = new PlainDraggable(element, { leftTop: true });
    draggable.autoScroll = true;
    draggable.containment = document.getElementById('mainPage1');
    draggableObjects.push(draggable);

    //Add contextMenu class
    $(element).addClass('contextMenu');

    //Subscribe keydown event to detect ENTER key
    document.addEventListener('keydown', keyEnterDownHandler);
  });

  //Subscribe drawstop event: This event fires when <object>.draw('done') executes 
  shapes[index].on('drawstop', function () {
    //Remove enter key event
    document.removeEventListener('keydown', keyEnterDownHandler);
  });
}

//Add new image
function addNewImage() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', imageMouseDownEventHandler);
}

//Add new textblock
function addNewText() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', textMouseDownEventHandler);
}

//Add new display value
function addNewDisplayValue() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', displayValueMouseDownEventHandler);
}

//Add new button
function addNewButton() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', buttonMouseDownEventHandler);
}

//Add new switch
function addNewSwitch() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', switchMouseDownEventHandler);
}

//Add new input
function addNewInput() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', inputMouseDownEventHandler);
}

//Add new checkbox
function addNewCheckbox() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', checkboxMouseDownEventHandler);
}

//Add new slider
function addNewSlider() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', sliderMouseDownEventHandler);
}

//Add new process bar
function addNewProcessbar() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', processbarMouseDownEventHandler);
}

//Add new symbol set
function addNewSymbolSet() {
  stopDraw(false);
  $('#mainPage1').on('mousedown', symbolsetMouseDownEventHandler);
}

/*
***********************************************************************************************
                                Stop drawing function 
***********************************************************************************************
*/

//stopDraw function: Stop all draw action
var stopDraw = function (addContext) {
  draw.off();
  $('#mainPage1').off('mousedown', imageMouseDownEventHandler);
  $('#mainPage1').off('mousedown', textMouseDownEventHandler);
  $('#mainPage1').off('mousedown', displayValueMouseDownEventHandler);
  $('#mainPage1').off('mousedown', buttonMouseDownEventHandler);
  $('#mainPage1').off('mousedown', switchMouseDownEventHandler);
  $('#mainPage1').off('mousedown', inputMouseDownEventHandler);
  $('#mainPage1').off('mousedown', checkboxMouseDownEventHandler);
  $('#mainPage1').off('mousedown', sliderMouseDownEventHandler);
  $('#mainPage1').off('mousedown', processbarMouseDownEventHandler);
  $('#mainPage1').off('mousedown', symbolsetMouseDownEventHandler);

  if (addContext) addContextMenu();
}

/*
***********************************************************************************************
                                Event handlers
***********************************************************************************************
*/

//Keydown ENTER event handler: To stop drawing polygon
function keyEnterDownHandler(e) {
  if (e.keyCode == 13) {
    shapes[index].draw('done');
    shapes[index].off('drawstart');
    index++;
    stopDraw();
  }
}

//Image mouse down event handler: To create new image
function imageMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new image
  var defaultImageSrc = '../public/img/png/default-image.png';
  shapes[index] = document.createElement('img');
  shapes[index].id = 'img' + index;
  shapes[index].className += ' contextMenu '


  //Image css style
  shapes[index].src = defaultImageSrc;
  shapes[index].style.height = '100px';
  shapes[index].style.width = '150px';
  shapes[index].style.position = 'absolute';
  shapes[index].style.top = top;
  shapes[index].style.left = left;
  shapes[index].style.border = '2px solid black';

  //Image mouse events
  $(shapes[index]).on('mouseover', function (event) {
    event.target.style.cursor = 'pointer';
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(shapes[index]).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(shapes[index]).on('dblclick', function (mouseEvent) {
    $('#imageModal').one('show.bs.modal', function (showEvent) {

      var elem = document.getElementById(mouseEvent.target.id);

      var elemStyle = elem.style;

      var elemWidth = parseInt(elemStyle.width, 10),
        elemHeight = parseInt(elemStyle.height, 10),
        elemPositionX = parseInt(elemStyle.left, 10),
        elemPositionY = parseInt(elemStyle.top, 10);

      //console.log('Target ' + mouseEvent.target.id);

      var itemModal = document.getElementById('imageModal');
      itemModal.querySelector('#inputWidth').value = elemWidth;
      itemModal.querySelector('#inputHeight').value = elemHeight;
      itemModal.querySelector('#inputPositionX').value = elemPositionX;
      itemModal.querySelector('#inputPositionY').value = elemPositionY;

      if (mouseEvent.target.hiddenWhen) {
        itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
      }
      else {
        itemModal.querySelector('.inputHiddenWhen').value = '';
      }

      //Button save 
      $('.saveChangeButton').on('click', function (event) {
        elemStyle.width = imageModal.querySelector('#inputWidth').value + 'px';
        elemStyle.height = imageModal.querySelector('#inputHeight').value + 'px';
        elemStyle.left = imageModal.querySelector('#inputPositionX').value + 'px';
        elemStyle.top = imageModal.querySelector('#inputPositionY').value + 'px';
        mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

      });

      $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#imageModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnHiddenWhen').off('click');
    });

    $('#imageModal').modal();
  });


  $('#mainPage1').append(shapes[index]);



  //Add draggable feature
  // draggable = new PlainDraggable(shapes[index], { leftTop: true });
  // draggable.position();
  // draggable.autoScroll = true;
  // draggable.containment = document.getElementById('mainPage1');
  // draggableObjects.push(draggable);

  $(shapes[index]).addClass('draggable');
  $('.draggable').draggable({
    refreshPositions: true,
    containment: $('#mainPage1'),
  });

  index++;



}

//Text mouse down event handler: To create new text
function textMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var para = document.createElement('p');
  var text = document.createTextNode('Textblock');
  para.appendChild(text);
  para.id = 'text' + index;
  para.className += ' contextMenu ';


  //Image css style
  para.style.fontSize = '30px';
  para.style.fontFamily = 'Arial';
  para.style.fontStyle = 'normal';
  para.style.color = '#000000';
  para.style.position = 'absolute';
  para.style.top = top;
  para.style.left = left;


  //Image mouse events
  $(para).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(para).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(para).on('dblclick', function (mouseEvent) {
    $('#textModal').one('show.bs.modal', function (showEvent) {
      var elemStyle = mouseEvent.target.style;
      var elemId = mouseEvent.target.id;
      var elemFontsize = parseInt(elemStyle.fontSize, 10).toString(),
        elemFontstyle = elemStyle.fontStyle,
        elemFontFamily = elemStyle.fontFamily.replace(/["']/g, ""), //Replace double quote from font with WHITESPACE
        elemColor = rgb2hex(elemStyle.color),
        elemText = mouseEvent.target.innerText;

      var itemModal = $('#textModal')[0];

      itemModal.querySelector('#inputFontSize').value = elemFontsize;
      itemModal.querySelector('#fontPicker').value = elemFontFamily;
      itemModal.querySelector('#fontStyleForm').value = elemFontstyle;
      itemModal.querySelector('#inputTextColor').value = elemColor;
      itemModal.querySelector('#textContent').value = elemText;
      if (mouseEvent.target.hiddenWhen) {
        itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
      }
      else {
        itemModal.querySelector('.inputHiddenWhen').value = '';
      }


      $('.saveChangeButton').on('click', function (event) {
        document.getElementById(elemId).style.fontSize = itemModal.querySelector('#inputFontSize').value + 'px';
        document.getElementById(elemId).style.fontFamily = itemModal.querySelector('#fontPicker').value;
        document.getElementById(elemId).style.color = itemModal.querySelector('#inputTextColor').value;
        document.getElementById(elemId).style.fontStyle = itemModal.querySelector('#fontStyleForm').value;
        document.getElementById(elemId).innerHTML = itemModal.querySelector('#textContent').value;
        mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;
      });

      $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#textModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnHiddenWhen').off('click');
    });

    $('#textModal').modal();
  });

  $('#mainPage1').append(para);
  shapes[index] = para;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(para, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);
}

//Display Value mouse down event handler: To create new DisplayValue
function displayValueMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var para = document.createElement('p');
  var text = document.createTextNode('##.##');
  para.appendChild(text);
  para.id = 'displayValue' + index;
  para.className += ' contextMenu '

  //Image css style
  para.style.fontSize = '40px';
  para.style.fontFamily = 'Arial';
  para.style.fontStyle = 'normal';
  para.style.color = '#000000';
  para.style.position = 'absolute';
  para.style.top = top;
  para.style.left = left;


  //Image mouse events
  $(para).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(para).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(para).on('dblclick', function (mouseEvent) {
    $('#displayValueModal').one('show.bs.modal', function (showEvent) {
      var elemStyle = mouseEvent.target.style;
      var elemId = mouseEvent.target.id;
      var elemFontsize = parseInt(elemStyle.fontSize, 10).toString(),
        elemFontstyle = elemStyle.fontStyle,
        elemFontFamily = elemStyle.fontFamily.replace(/["']/g, ""), //Replace double quote from font with WHITESPACE
        elemColor = rgb2hex(elemStyle.color),
        elemText = mouseEvent.target.innerText;

      var itemModal = $('#displayValueModal')[0];

      itemModal.querySelector('#inputFontSize').value = elemFontsize;
      itemModal.querySelector('#fontPicker').value = elemFontFamily;
      itemModal.querySelector('#fontStyleForm').value = elemFontstyle;
      itemModal.querySelector('#inputTextColor').value = elemColor;
      itemModal.querySelector('#textContent').value = elemText;

      if (mouseEvent.target.hiddenWhen) {
        itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
      }
      else {
        itemModal.querySelector('.inputHiddenWhen').value = '';
      }

      if (mouseEvent.target.tag) {
        itemModal.querySelector('.inputTag').value = mouseEvent.target.tag;
      }
      else {
        itemModal.querySelector('.inputTag').value = '';
      }

      $('.saveChangeButton').on('click', function (event) {
        document.getElementById(elemId).style.fontSize = itemModal.querySelector('#inputFontSize').value + 'px';
        document.getElementById(elemId).style.fontFamily = itemModal.querySelector('#fontPicker').value;
        document.getElementById(elemId).style.color = itemModal.querySelector('#inputTextColor').value;
        document.getElementById(elemId).style.fontStyle = itemModal.querySelector('#fontStyleForm').value;
        document.getElementById(elemId).innerHTML = itemModal.querySelector('#textContent').value;
        mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;
        mouseEvent.target.tag = itemModal.querySelector('.inputTag').value;

      });

      $('.btnTag').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputTag').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnHiddenWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#displayValueModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnTag').off('click');
      $('.btnHiddenWhen').off('click');
    });

    $('#displayValueModal').modal();
  });

  $('#mainPage1').append(para);
  shapes[index] = para;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(para, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);


}

//Button mouse down event handler: To create new button
function buttonMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var btn = document.createElement('button');
  var text = document.createTextNode('Button');
  btn.appendChild(text);
  btn.id = 'button' + index;

  //Image css style
  btn.className = 'btn btn-primary contextMenu ';
  btn.style.position = 'absolute';
  btn.style.top = top;
  btn.style.left = left;
  btn.style.color = '#ffffff';
  btn.style.background = '#4285F4';
  btn.style.fontFamily = 'Helvetica Neue';
  btn.style.fontSize = '16px';
  btn.style.fontStyle = 'normal';



  //Image mouse events
  $(btn).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(btn).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(btn).on('dblclick', function (mouseEvent) {
    $('#buttonModal').one('show.bs.modal', function (showEvent) {
      var elemStyle = mouseEvent.target.style;
      var elemId = mouseEvent.target.id;

      var htmlElement = mouseEvent.target.getBoundingClientRect();
      var svgOffset = mouseEvent.target.parentNode.getBoundingClientRect();

      var elemFontsize = parseInt(elemStyle.fontSize, 10).toString(),
        elemFontstyle = elemStyle.fontStyle,
        elemFontFamily = elemStyle.fontFamily.replace(/["']/g, ""), //Replace double quote from font with WHITESPACE
        elemColor = rgb2hex(elemStyle.color),
        elemBackground = rgb2hex(elemStyle.background),
        elemWidth = Math.round(htmlElement.right - htmlElement.left),
        elemHeight = Math.round(htmlElement.bottom - htmlElement.top),
        elemPositionX = Math.round(htmlElement.left - svgOffset.left),
        elemPositionY = Math.round(htmlElement.top - svgOffset.top),
        elemText = mouseEvent.target.innerText;


      var itemModal = $('#buttonModal')[0];

      itemModal.querySelector('#inputFontSize').value = elemFontsize;
      itemModal.querySelector('#fontPicker').value = elemFontFamily;
      itemModal.querySelector('#fontStyleForm').value = elemFontstyle;
      itemModal.querySelector('#inputTextColor').value = elemColor;
      itemModal.querySelector('#inputBackgroundColor').value = elemBackground;
      itemModal.querySelector('#textContent').value = elemText;
      itemModal.querySelector('#inputWidth').value = elemWidth;
      itemModal.querySelector('#inputHeight').value = elemHeight;
      itemModal.querySelector('#inputPositionX').value = elemPositionX;
      itemModal.querySelector('#inputPositionY').value = elemPositionY;

      if (mouseEvent.target.command) {
        itemModal.querySelector('.inputCommand').value = mouseEvent.target.command;
      }
      else {
        itemModal.querySelector('.inputCommand').value = '';
      }

      if (mouseEvent.target.disableWhen) {
        itemModal.querySelector('.inputDisableWhen').value = mouseEvent.target.disableWhen;
      }
      else {
        itemModal.querySelector('.inputDisableWhen').value = '';
      }

      $('.saveChangeButton').on('click', function (event) {
        document.getElementById(elemId).style.fontSize = itemModal.querySelector('#inputFontSize').value + 'px';
        document.getElementById(elemId).style.fontFamily = itemModal.querySelector('#fontPicker').value;
        document.getElementById(elemId).style.color = itemModal.querySelector('#inputTextColor').value;
        document.getElementById(elemId).style.background = itemModal.querySelector('#inputBackgroundColor').value;
        document.getElementById(elemId).style.fontStyle = itemModal.querySelector('#fontStyleForm').value;
        document.getElementById(elemId).innerHTML = itemModal.querySelector('#textContent').value;
        document.getElementById(elemId).style.left = itemModal.querySelector('#inputPositionX').value + 'px';
        document.getElementById(elemId).style.top = Number(itemModal.querySelector('#inputPositionY').value) + 43 + 'px';
        document.getElementById(elemId).style.width = itemModal.querySelector('#inputWidth').value + 'px';
        document.getElementById(elemId).style.height = itemModal.querySelector('#inputHeight').value + 'px';
        mouseEvent.target.command = itemModal.querySelector('.inputCommand').value;
        mouseEvent.target.disableWhen = itemModal.querySelector('.inputDisableWhen').value;

        var html = document.getElementById(elemId);
        for (draggableItem of draggableObjects) {
          if (draggableItem.element.id == html.id) {
            draggableObjects.splice(draggableObjects.indexOf(draggableItem), 1);
            break;
          }
        }
        draggable = new PlainDraggable(html, { leftTop: true });
        draggable.autoScroll = true;
        draggable.containment = document.getElementById('mainPage1');
        draggableObjects.push(draggable);
      });

      $('.btnCommand').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputCommand').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnDisableWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputDisableWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#buttonModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnCommand').off('click');
      $('.btnDisableWhen').off('click');
    });

    $('#buttonModal').modal();
  });
  $('#mainPage1').append(btn);
  shapes[index] = btn;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(btn, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);


}

//Switch mouse down event handler: To create new switch
function switchMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var sw = document.createElement('label');
  sw.className = 'switch contextMenu ';

  var inputsw = document.createElement('input');
  inputsw.setAttribute('type', 'checkbox');
  inputsw.className = 'primary';

  var spansw = document.createElement('span');
  spansw.className = 'slider round';

  sw.appendChild(inputsw);
  sw.appendChild(spansw);

  sw.id = 'switch' + index;

  //Image css style
  sw.style.position = 'absolute';
  sw.style.top = top;
  sw.style.left = left;


  //Image mouse events
  $(sw).on('mouseover', function (event) {
    event.target.style.opacity = 0.65;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(sw).on('mouseout', function (vent) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(sw).on('dblclick', function (mouseEvent) {
    $('#switchModal').one('show.bs.modal', function (showEvent) {
      var itemModal = $('#switchModal')[0];

      if (mouseEvent.target.onCommand) {
        itemModal.querySelector('.inputOnCommand').value = mouseEvent.target.onCommand;
      }
      else {
        itemModal.querySelector('.inputOnCommand').value = '';
      }

      if (mouseEvent.target.offCommand) {
        itemModal.querySelector('.inputOffCommand').value = mouseEvent.target.offCommand;
      }
      else {
        itemModal.querySelector('.inputOffCommand').value = '';
      }

      if (mouseEvent.target.disableWhen) {
        itemModal.querySelector('.inputDisableWhen').value = mouseEvent.target.disableWhen;
      }
      else {
        itemModal.querySelector('.inputDisableWhen').value = '';
      }

      $('.saveChangeButton').on('click', function (event) {
        mouseEvent.target.onCommand = itemModal.querySelector('.inputOnCommand').value;
        mouseEvent.target.offCommand = itemModal.querySelector('.inputOffCommand').value;
        mouseEvent.target.disableWhen = itemModal.querySelector('.inputDisableWhen').value;
      });

      $('.btnOnCommand').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputOnCommand').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnOffCommand').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputOffCommand').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnDisableWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputDisableWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#switchModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnOnCommand').off('click');
      $('.btnOffCommand').off('click');
      $('.btnDisableWhen').off('click');
    });

    $('#switchModal').modal();
  });

  $('#mainPage1').append(sw);
  shapes[index] = sw;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(sw, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);


}

//Input mouse down event handler: To create new input
function inputMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var input = document.createElement('input');
  input.type = 'text';
  input.id = 'input' + index;
  input.placeholder = 'Add text ...';

  //Image css style
  input.className = 'form-control contextMenu ';
  input.style.width = '200px';
  input.style.position = 'absolute';
  input.style.top = top;
  input.style.left = left;


  //Image mouse events
  $(input).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(input).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(input).on('dblclick', function (mouseEvent) {
    $('#inputModal').one('show.bs.modal', function (showEvent) {
      var elemStyle = mouseEvent.target.style;
      var elemId = mouseEvent.target.id;
      var elemBound = mouseEvent.target.getBoundingClientRect();

      var elemWidth = parseInt(elemStyle.width, 10),
        elemHeight = Math.round(elemBound.bottom - elemBound.top);


      var itemModal = $('#inputModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;
      itemModal.querySelector('.inputHeight').value = elemHeight;

      if (mouseEvent.target.tag) {
        itemModal.querySelector('.inputTag').value = mouseEvent.target.tag;
      }
      else {
        itemModal.querySelector('.inputTag').value = '';
      }

      if (mouseEvent.target.disableWhen) {
        itemModal.querySelector('.inputDisableWhen').value = mouseEvent.target.disableWhen;
      }
      else {
        itemModal.querySelector('.inputDisableWhen').value = '';
      }

      $('.saveChangeButton').on('click', function (event) {
        document.getElementById(elemId).style.width = itemModal.querySelector('.inputWidth').value + 'px';
        document.getElementById(elemId).style.height = itemModal.querySelector('.inputHeight').value + 'px';
        mouseEvent.target.tag = itemModal.querySelector('.inputTag').value;
        mouseEvent.target.disableWhen = itemModal.querySelector('.inputDisableWhen').value;
      });

      $('.btnTag').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputTag').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnDisableWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputDisableWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#inputModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnTag').off('click');
      $('.btnDisableWhen').off('click');
    });

    $('#inputModal').modal();
  });

  $('#mainPage1').append(input);
  shapes[index] = input;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(input, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);


}

//Checkbox mouse down event handler: To create new Checkbox
function checkboxMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var checkbox = document.createElement('div');
  checkbox.className = 'custom-control custom-checkbox contextMenu ';
  checkbox.id = 'checkbox' + index;

  var cbInput = document.createElement('input');
  cbInput.type = 'checkbox';
  cbInput.className = 'custom-control-input';
  cbInput.id = 'cbInput' + index;

  var cbLabel = document.createElement('label');
  cbLabel.className = 'custom-control-label';
  cbLabel.htmlFor = 'cbInput' + index;
  cbLabel.innerText = 'Checkbox';

  checkbox.appendChild(cbInput);
  checkbox.appendChild(cbLabel);


  //Image css style
  checkbox.style.position = 'absolute';
  checkbox.style.top = top;
  checkbox.style.left = left;


  //Image mouse events
  $(checkbox).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(checkbox).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe double click event
  $(checkbox).on('dblclick', function (mouseEvent) {
    $('#checkboxModal').one('show.bs.modal', function (showEvent) {

      var itemModal = $('#checkboxModal')[0];
      itemModal.querySelector('.textContent').value = mouseEvent.target.innerText;

      if (mouseEvent.target.checkedCommand) {
        itemModal.querySelector('.inputChecked').value = mouseEvent.target.checkedCommand;
      }
      else {
        itemModal.querySelector('.inputChecked').value = '';
      }

      if (mouseEvent.target.unCheckedCommand) {
        itemModal.querySelector('.inputUnchecked').value = mouseEvent.target.unCheckedCommand;
      }
      else {
        itemModal.querySelector('.inputUnchecked').value = '';
      }

      if (mouseEvent.target.disableWhen) {
        itemModal.querySelector('.inputDisableWhen').value = mouseEvent.target.disableWhen;
      }
      else {
        itemModal.querySelector('.inputDisableWhen').value = '';
      }

      $('.saveChangeButton').on('click', function (event) {
        mouseEvent.target.innerHTML = itemModal.querySelector('.textContent').value;
        mouseEvent.target.checkedCommand = itemModal.querySelector('.inputChecked').value;
        mouseEvent.target.unCheckedCommand = itemModal.querySelector('.inputUnchecked').value;
        mouseEvent.target.disableWhen = itemModal.querySelector('.inputDisableWhen').value;
      });

      $('.btnChecked').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputChecked').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnUnchecked').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputUnchecked').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnDisableWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputDisableWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#checkboxModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnChecked').off('click');
      $('.btnUnchecked').off('click');
      $('.btnDisableWhen').off('click');
    });

    $('#checkboxModal').modal();
  });

  $('#mainPage1').append(checkbox);
  shapes[index] = checkbox;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(checkbox, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);


}

//Slider mouse down event handler: To create new Checkbox
function sliderMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'custom-range contextMenu ';
  slider.id = 'slider' + index;

  //Image css style
  slider.style.position = 'absolute';
  slider.style.top = top;
  slider.style.left = left;
  slider.style.width = '400px';


  //Image mouse events
  $(slider).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(slider).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(slider).on('dblclick', function (mouseEvent) {
    $('#sliderModal').one('show.bs.modal', function (showEvent) {

      var elem = document.getElementById(mouseEvent.target.id);
      var elemStyle = elem.style;

      var elemWidth = parseInt(elemStyle.width, 10);

      var itemModal = $('#sliderModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;

      if (mouseEvent.target.tag) {
        itemModal.querySelector('.inputValue').value = mouseEvent.target.tag;
      }
      else {
        itemModal.querySelector('.inputValue').value = '';
      }

      if (mouseEvent.target.minTag) {
        itemModal.querySelector('.inputMinTag').value = mouseEvent.target.minTag;
      }
      else {
        itemModal.querySelector('.inputMinTag').value = '';
      }

      if (mouseEvent.target.minValue) {
        itemModal.querySelector('.inputMinValue').value = mouseEvent.target.minValue;
      }
      else {
        itemModal.querySelector('.inputMinValue').value = '';
      }

      if (mouseEvent.target.maxTag) {
        itemModal.querySelector('.inputMaxTag').value = mouseEvent.target.maxTag;
      }
      else {
        itemModal.querySelector('.inputMaxTag').value = '';
      }

      if (mouseEvent.target.maxValue) {
        itemModal.querySelector('.inputMaxValue').value = mouseEvent.target.maxValue;
      }
      else {
        itemModal.querySelector('.inputMaxValue').value = '';
      }

      if (mouseEvent.target.disableWhen) {
        itemModal.querySelector('.inputDisableWhen').value = mouseEvent.target.disableWhen;
      }
      else {
        itemModal.querySelector('.inputDisableWhen').value = '';
      }

      //Button save 
      $('.saveChangeButton').on('click', function (event) {
        elemStyle.width = itemModal.querySelector('.inputWidth').value + 'px';
        mouseEvent.target.tag = itemModal.querySelector('.inputValue').value;
        mouseEvent.target.minTag = itemModal.querySelector('.inputMinTag').value;
        mouseEvent.target.minValue = itemModal.querySelector('.inputMinValue').value;
        mouseEvent.target.maxTag = itemModal.querySelector('.inputMaxTag').value;
        mouseEvent.target.maxValue = itemModal.querySelector('.inputMaxValue').value;
        mouseEvent.target.disableWhen = itemModal.querySelector('.inputDisableWhen').value;

        if (itemModal.querySelector('.inputMinTag').value)
          mouseEvent.target.isMinTag = true;
        else mouseEvent.target.isMinTag = false;

        if (itemModal.querySelector('.inputMaxTag').value)
          mouseEvent.target.isMaxTag = true;
        else mouseEvent.target.isMaxTag = false;


      });

      //Browse button
      $('.btnValue').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputValue').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnMinTag').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputMinTag').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnMaxTag').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputMaxTag').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnDisableWhen').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputDisableWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#sliderModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnValue').off('click');
      $('.btnMinTag').off('click');
      $('.btnMaxTag').off('click');
      $('.btnDisableWhen').off('click');
    });

    $('#sliderModal').modal();
  });

  $('#mainPage1').append(slider);
  shapes[index] = slider;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(slider, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);

}

//Process bar mouse down event handler: To create new Checkbox
function processbarMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new paragrap
  var progressbar = document.createElement('div');
  progressbar.className = 'progress contextMenu';
  progressbar.id = 'progressbar' + index;

  var bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.style.width = '70%';
  //bar.style.height = '20px';
  bar.innerText = '70%';


  progressbar.appendChild(bar);

  //Image css style
  progressbar.style.position = 'absolute';
  progressbar.style.top = top;
  progressbar.style.left = left;
  progressbar.style.width = '400px';
  //progressbar.style.height = '20px';


  //Image mouse events
  $(progressbar).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(progressbar).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe mouse double click event
  $(progressbar).on('dblclick', function (mouseEvent) {
    $('#progressBarModal').one('show.bs.modal', function (showEvent) {

      var selectedItem = mouseEvent.target;
      var elemWidth, elemHeight;
      var progressElement;

      if (selectedItem.id) { //Progress is chosen
        progressElement = selectedItem;
        elemWidth = parseInt(selectedItem.style.width, 10);
        elemHeight = Math.round(selectedItem.getBoundingClientRect().bottom - selectedItem.getBoundingClientRect().top);
      }
      else { //Bar is chosen
        progressElement = selectedItem.parentNode;
        elemWidth = parseInt(selectedItem.parentNode.style.width, 10);
        elemHeight = Math.round(selectedItem.getBoundingClientRect().bottom - selectedItem.getBoundingClientRect().top);
      }

      var itemModal = $('#progressBarModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;
      itemModal.querySelector('.inputHeight').value = elemHeight;

      if (progressElement.tag) {
        itemModal.querySelector('.inputValue').value = progressElement.tag;
      }
      else {
        itemModal.querySelector('.inputValue').value = '';
      }

      if (progressElement.minTag) {
        itemModal.querySelector('.inputMinTag').value = progressElement.minTag;
      }
      else {
        itemModal.querySelector('.inputMinTag').value = '';
      }

      if (progressElement.minValue) {
        itemModal.querySelector('.inputMinValue').value = progressElement.minValue;
      }
      else {
        itemModal.querySelector('.inputMinValue').value = '';
      }

      if (progressElement.maxTag) {
        itemModal.querySelector('.inputMaxTag').value = progressElement.maxTag;
      }
      else {
        itemModal.querySelector('.inputMaxTag').value = '';
      }

      if (progressElement.maxValue) {
        itemModal.querySelector('.inputMaxValue').value = progressElement.maxValue;
      }
      else {
        itemModal.querySelector('.inputMaxValue').value = '';
      }

      if (progressElement.hiddenWhen) {
        itemModal.querySelector('.inputHiddenWhen').value = progressElement.hiddenWhen;
      }
      else {
        itemModal.querySelector('.inputHiddenWhen').value = '';
      }


      //Button save 
      $('.saveChangeButton').on('click', function (event) {
        if (selectedItem.id) { //Progress is chosen
          selectedItem.style.width = itemModal.querySelector('.inputWidth').value + 'px';
          selectedItem.style.height = itemModal.querySelector('.inputHeight').value + 'px';
        }
        else {  //Bar is chosen
          selectedItem.parentNode.style.width = itemModal.querySelector('.inputWidth').value + 'px';
          selectedItem.parentNode.style.height = itemModal.querySelector('.inputHeight').value + 'px';
        }

        progressElement.tag = itemModal.querySelector('.inputValue').value;
        progressElement.minTag = itemModal.querySelector('.inputMinTag').value;
        progressElement.minValue = itemModal.querySelector('.inputMinValue').value;
        progressElement.maxTag = itemModal.querySelector('.inputMaxTag').value;
        progressElement.maxValue = itemModal.querySelector('.inputMaxValue').value;
        progressElement.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

        if (itemModal.querySelector('.inputMinTag').value)
          progressElement.isMinTag = true;
        else progressElement.isMinTag = false;

        if (itemModal.querySelector('.inputMaxTag').value)
          progressElement.isMaxTag = true;
        else progressElement.isMaxTag = false;

        console.log(progressElement.tag);
        console.log(progressElement.minTag);
        console.log(progressElement.minValue);
        console.log(progressElement.maxTag);
        console.log(progressElement.maxValue);
        console.log(progressElement.hiddenWhen);
        console.log(progressElement.isMinTag);
        console.log(progressElement.isMaxTag);


      });

      //Button Value browse tag
      $('.btnValueTag').on('click', function (valueEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputValue').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnMinTag').on('click', function (valueEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputMinTag').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnMaxTag').on('click', function (valueEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputMaxTag').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      $('.btnHiddenWhen').on('click', function (valueEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#progressBarModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('.btnValueTag').off('click');
      $('.btnMinTag').off('click');
      $('.btnMaxTag').off('click');
      $('.btnHiddenWhen').off('click');
    });

    $('#progressBarModal').modal();
  });

  $('#mainPage1').append(progressbar);
  shapes[index] = progressbar;
  index++;

  //Add draggable feature
  draggable = new PlainDraggable(progressbar, { leftTop: true });
  draggable.autoScroll = true;
  draggable.containment = document.getElementById('mainPage1');
  draggableObjects.push(draggable);


}

//Symbol Set mouse down event handler: To create new image
function symbolsetMouseDownEventHandler(event) {
  var leftOffset = document.getElementById('mainPage1').getBoundingClientRect().left;
  var topOffset = document.getElementById('mainPage1').getBoundingClientRect().top;

  var left = event.pageX - leftOffset + 'px';
  var top = event.pageY - topOffset + 'px';

  //Declare new image
  var defaultSymbolSet = '../public/img/symbol-set/light-off.png';
  var symbolSet = document.createElement('img');
  symbolSet.id = 'symbolSet' + index;
  symbolSet.className += ' contextMenu ';



  //Image css style
  symbolSet.src = defaultSymbolSet;
  symbolSet.style.height = '50px';
  symbolSet.style.width = '50px';
  symbolSet.style.position = 'absolute';
  symbolSet.style.top = top;
  symbolSet.style.left = left;

  //Image mouse events
  $(symbolSet).on('mouseover', function (event) {
    event.target.style.cursor = 'pointer';
    event.target.style.opacity = 0.4;
    //event.target.style.cursor = 'move';
  });
  //Subscribe mouseout event for each polygon
  $(symbolSet).on('mouseout', function (event) {
    event.target.style.opacity = 1;
  });
  //Subscribe double click event
  $(symbolSet).on('dblclick', function (mouseEvent) {
    $('#symbolSetModal').one('show.bs.modal', function (showEvent) {

      var elem = document.getElementById(mouseEvent.target.id);
      var elemStyle = elem.style;

      var elemWidth = parseInt(elemStyle.width, 10),
        elemHeight = parseInt(elemStyle.height, 10),
        elemPositionX = parseInt(elemStyle.left, 10),
        elemPositionY = parseInt(elemStyle.top, 10);

      var itemModal = $('#symbolSetModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;
      itemModal.querySelector('.inputHeight').value = elemHeight;
      itemModal.querySelector('.inputPositionX').value = elemPositionX;
      itemModal.querySelector('.inputPositionY').value = elemPositionY;

      if (mouseEvent.target.onCondition) {
        itemModal.querySelector('.inputOnCondition').value = mouseEvent.target.onCondition;
      }
      else {
        itemModal.querySelector('.inputOnCondition').value = '';
      }

      if (mouseEvent.target.hiddenWhen) {
        itemModal.querySelector('.inputHiddenWhen').value = mouseEvent.target.hiddenWhen;
      }
      else {
        itemModal.querySelector('.inputHiddenWhen').value = '';
      }

      //Button save 
      $('.saveChangeButton').on('click', function (event) {
        elemStyle.width = itemModal.querySelector('.inputWidth').value + 'px';
        elemStyle.height = itemModal.querySelector('.inputHeight').value + 'px';
        elemStyle.left = itemModal.querySelector('.inputPositionX').value + 'px';
        elemStyle.top = itemModal.querySelector('.inputPositionY').value + 'px';
        mouseEvent.target.onCondition = itemModal.querySelector('.inputOnCondition').value;
        mouseEvent.target.hiddenWhen = itemModal.querySelector('.inputHiddenWhen').value;

      
      });

      //Browse Tag button
      $('#btnOnCondition').on('click', function (onConditionClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputOnCondition').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

      //Browse Tag button
      $('.btnHiddenWhen').on('click', function (onHiddenWhenClickEvent) {
        $('#tagModal').one('hide.bs.modal', function (modalHideEvent) {
          if ($('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked')) {
            itemModal.querySelector('.inputHiddenWhen').value += $('#tagModal')[0].querySelector('input[name="rdoChoseTag"]:checked').value;
          }
        });
      });

    });

    $('#symbolSetModal').one('hide.bs.modal', function (hideEvent) {
      $('.saveChangeButton').off('click');
      $('#btnOnCondition').off('click');
      $('.btnHiddenWhen').off('click');
    });

    $('#symbolSetModal').modal();
  });

  $('#mainPage1').append(symbolSet);
  shapes[index] = symbolSet;
  index++;

  //Add draggable feature
  // draggable = new PlainDraggable(symbolSet, { leftTop: true });
  // draggable.autoScroll = true;
  // draggable.containment = document.getElementById('mainPage1');
  // draggableObjects.push(draggable);
  symbolSet.classList.add('draggable');
  $('.draggable').draggable({
    refreshPositions: true,
    containment: $('#mainPage1'),
  });

}



