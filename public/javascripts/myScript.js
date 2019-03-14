/*
***********************************************************************************************
                                Document ready 
***********************************************************************************************
*/
$(document).ready(function () {

  //Disable all elements in alarm and history when not RUN
  $('#alarm *').prop('disabled', true);
  $('#history *').prop('disabled', true);

  declareVariable();

  var socket = io();
  socket.on('connect', function () {

    $('#btnRun').on('click', function (clickEvent) {
      console.log(deviceID);
      $(this).prop('disabled', true);
      $('#btnStop').prop('disabled', false);
      $('.button-icon').prop('disabled', true);
      $('#alarm *').prop('disabled', false);
      $('#history *').prop('disabled', false);
      draggableObjects.forEach(function (item) {
        item.disabled = true;
      });
      $('.draggable').draggable('disable');

      //Disable all input in Modals: to prevent users from changing elements' properties
      $('.inputModal').prop('disabled', true);
      $('.btnBrowseTag').prop('disabled', true);
      $('.btnChooseImage').prop('disabled', true);
      $('.saveChangeButton').prop('disabled', true);
      initSCADA(shapes, socket);

      socket.on('/' + deviceID + '/tag', function (data) {
        var arrVarObjects = JSON.parse(data);
        console.log(arrVarObjects);
        if (arrVarObjects) {
          arrVarObjects.variables.forEach(function (varObject) {
            eval(varObject.tagName + '=' + varObject.value);
            SCADA(shapes, varObject.tagName);
          });
        }
      });

      //Clear table body first
      $('#alarmTable tbody').empty();
      socket.on('/' + deviceID + '/alarm', function (alarmObject) {
        var arrAlarmSource = Array.from($('#alarmTable tr td:nth-child(4)'));
        var _isExist = false;
        var _timeStamp = new Date(alarmObject.timestamp)

        for (var _item of arrAlarmSource) {
          if (_item.innerText == alarmObject.source) {
            if (alarmObject.state == 'UNACK') {
              var _expression = '#alarmTable tr:nth(' + (arrAlarmSource.indexOf(_item) + 1) + ') td';
              var tableRow = $(_expression);
              tableRow[1].innerText = _timeStamp.toLocaleDateString();
              tableRow[2].innerText = _timeStamp.toLocaleTimeString();
              tableRow[4].innerText = alarmObject.value;
              tableRow[5].innerText = alarmObject.message;
              tableRow[6].innerText = alarmObject.type;
              tableRow[7].innerText = alarmObject.state;
            }
            else { //ACKED
              _item.closest('tr').remove();
            }
            _isExist = true;
            break;
          }
        }


        if (!_isExist) {//Not found item 
          var _htmlMarkup =
            `<tr class = "row-pointer">
                <td><input type="checkbox" class = "alarmCheckbox"></td>
                <td>` + _timeStamp.toLocaleDateString() + `</td>
                <td>` + _timeStamp.toLocaleTimeString() + `</td>
                <td>` + alarmObject.source + `</td>
                <td>` + alarmObject.value + `</td>
                <td>` + alarmObject.message + `</td>
                <td>` + alarmObject.type + `</td>
                <td>` + alarmObject.state + `</td>
              </tr>`
          $('#alarmTable').prepend(_htmlMarkup);

          $('#alarmTable tbody tr:nth-child(1)').click(function () {
            var _checkbox = $(this).children('td').children('input');
            _checkbox.prop('checked', !_checkbox.prop('checked'));
            if (_checkbox.prop('checked')) $(this).addClass('alarm-selected');
            else $(this).removeClass('alarm-selected');
          });

        }

      });

      //Clear history table body first
      $('#historyTable tbody').empty();
      socket.emit('/reqHistory', deviceID);
      socket.on('/' + deviceID + '/resHistory', function (data) {
        if (data.length > 0) {
          $('#historyTable tbody').empty();
          data.forEach(function (dataItem) {
            var _htmlMarkup =
              `<tr>
              <td>` + dataItem.tag + `</td>
              <td>` + dataItem.type + `</td>
              <td>` + dataItem.address + `</td>
              <td>` + dataItem.value + `</td>
              <td>` + dataItem.timestamp + `</td>
            </tr>`
            $('#historyTable tbody').append(_htmlMarkup);
          });
        }
      });
    });

    $('#btnStop').on('click', function (clickEvent) {
      $(this).prop('disabled', true);
      $('#btnRun').prop('disabled', false);
      $('.button-icon').prop('disabled', false);
      $('#alarm *').prop('disabled', true);
      $('#history *').prop('disabled', true);
      draggableObjects.forEach(function (item) {
        item.disabled = false;
      });
      $('.draggable').draggable('enable');
      //Enable input
      $('.inputModal').prop('disabled', false);
      $('.btnBrowseTag').prop('disabled', false);
      $('.btnChooseImage').prop('disabled', false);
      $('.saveChangeButton').prop('disabled', false);
      socket.off('/' + deviceID + '/tag');
      socket.off('/' + deviceID + '/alarm');
      socket.off('/' + deviceID + '/resHistory');

    });
  });


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

  $('#btnAck').click(function () {
    if ($('.alarm-selected').length > 0) {
      var _resAlarm = {
        deviceID: deviceID,
        resAlarm: []
      }
      $('.alarm-selected').each(function () {
        var _selectedItem = $(this).find('td');
        _resAlarm.resAlarm.push({
          source: _selectedItem[3].innerText,
          value: _selectedItem[4].innerText,
          message: _selectedItem[5].innerText,
          type: _selectedItem[6].innerText,
          state: 'ACKED',
          timestamp: new Date().toLocaleString(),
        })
      });
      socket.emit('/resAlarm', _resAlarm);
    }
  });

  $('#btnAckAll').click(function () {
    var rows = $('#alarmTable tbody tr');
    if (rows.length > 0) {
      var _resAlarm = {
        deviceID: deviceID,
        resAlarm: []
      }
      rows.each(function () {
        if ($(this).find('td')[7].innerText == 'UNACK')
          _resAlarm.resAlarm.push({
            source: $(this).find('td')[3].innerText,
            value: $(this).find('td')[4].innerText,
            message: $(this).find('td')[5].innerText,
            type: $(this).find('td')[6].innerText,
            state: 'ACKED',
            timestamp: new Date().toLocaleString(),
          })
      });
      socket.emit('/resAlarm', _resAlarm);
    }
  });

  $('#btnRefreshHistory').click(function () {
    socket.emit('/reqHistory', deviceID);
  });

  $('#inputFilter').on('keyup', function () {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("inputFilter");
    filter = input.value.toUpperCase();
    table = document.getElementById("historyTable");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
          tr[i].classList.remove('ignore-row');
        } else {
          tr[i].style.display = "none";
          tr[i].classList.add('ignore-row');
        }
      }
    }
  });

  $('.inputTimeFilter').on('change', function () {
    //console.log('Change')
    var inputFrom, inputTo, filterFrom, filterTo, table, tr, td, i, txtDate;

    inputFrom = document.getElementById("inputFrom");
    filterFrom = new Date(inputFrom.value);
    inputTo = document.getElementById("inputTo");
    filterTo = new Date(inputTo.value);

    table = document.getElementById("historyTable");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[4];
      if (td) {
        txtDate = new Date(td.textContent || td.innerText);
        if (inputFrom.value && !inputTo.value) { //Only from
          if (txtDate > filterFrom) {
            tr[i].style.display = "";
            tr[i].classList.remove('ignore-row');
          } else {
            tr[i].style.display = "none";
            tr[i].classList.add('ignore-row');
          }
        } else if (!inputFrom.value && inputTo.value) { //Only to
          if (txtDate < filterTo) {
            tr[i].style.display = "";
            tr[i].classList.remove('ignore-row');
          } else {
            tr[i].style.display = "none";
            tr[i].classList.add('ignore-row');
          }
        } else {  //Both
          if ((txtDate > filterFrom) && (txtDate < filterTo)) {
            tr[i].style.display = "";
            tr[i].classList.remove('ignore-row');
          } else {
            tr[i].style.display = "none";
            tr[i].classList.add('ignore-row');
          }
        }


      }
    }
  })

  $('#btnExportToPdf').click(function () {

    var rowData = [];
    table = document.getElementById("historyTable");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
      
      if (!tr[i].classList.contains('ignore-row'))  {
        tds = Array.from(tr[i].getElementsByTagName("td"));
        rowData.push(tds);
      }
    }
    var doc = new jsPDF();

    var inputFrom = document.getElementById("inputFrom");
    var filterFrom = new Date(inputFrom.value);
    var inputTo = document.getElementById("inputTo");
    var filterTo = new Date(inputTo.value);

    doc.setFontSize(18);
    doc.text('History table', 14, 22);
    doc.setFontSize(12);
    if (inputFrom.value) doc.text('From: ' + filterFrom.toLocaleDateString() , 16 , 30);
    if (inputTo.value) doc.text('To:   ' + filterTo.toLocaleDateString() , 16 , 35);

    doc.autoTable({
      head: [['Tag', 'Data type', 'Address', 'Value', 'Timestamp']],
      body: rowData,
      startY : 50
    });
    doc.save('table.pdf');
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
let mqttDeviceTopic;
const deviceID = $('#deviceID').text();
let variableList = [];

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

function declareVariable() {
  var tableRows = $('#tagsTable tbody tr');
  if (tableRows.length > 0) {
    tableRows.each(function (index, value) {
      var tds = $(this).find('td');
      var expression = tds[3].innerHTML + '_' + tds[1].innerHTML + ' = null;';
      eval(expression);
      variableList.push({
        name: tds[3].innerHTML + '_' + tds[1].innerHTML,
        value: null,
      });
    });
  }
}

function initSCADA(_shapes, _socket) {
  _shapes.forEach(function (_shape) {
    var _id = _shape.id.toString().toLowerCase().replace(/[0-9]/g, '');
    switch (_id) {
      case 'button': {
        $(_shape).on('click', function (event) {
          var _sendObj = {
            deviceID: deviceID,
            command: this.command,
          }
          _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
        })
        break;
      }
      case 'switch': {
        var _checkbox = $(_shape).find('input')[0];
        var _span = $(_shape).find('span')[0];
        if (_checkbox) {
          $(_checkbox).on('change', function () {
            if ($(this).is(':checked')) {
              var _sendObj = {
                deviceID: deviceID,
                command: _span.onCommand,
              }
              _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
            }
            else {
              var _sendObj = {
                deviceID: deviceID,
                command: _span.offCommand,
              }
              _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
            }
          });
        }
        break;
      }
      case 'input': {
        $(_shape).on('keyup', function (event) {
          if (event.keyCode == 13) {
            if (this.tag) {
              if (this.type == 'text') {
                var _sendObj = {
                  deviceID: deviceID,
                  command: this.tag + ' = ' + '"' + this.value + '"'
                }
              }
              else {
                var _sendObj = {
                  deviceID: deviceID,
                  command: this.tag + ' = ' + this.value
                }
              }
              _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
            }
          }
        });
        break;
      }
      case 'slider': {
        $(_shape).on('input', function (event) {
          $(this).tooltip('dispose');
          $(this).tooltip({
            animation: false,
            offset: (this.value - (this.max - this.min) / 2) * (parseInt(this.style.width, 10) / (this.max - this.min)),
            title: this.value
          });
          $(this).tooltip('show');
        });
        $(_shape).on('change', function (event) {
          var _sendObj = {
            deviceID: deviceID,
            command: this.tag + ' = ' + this.value
          }
          if (this.tag) _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
        });
        break;
      }
      case 'checkbox': {
        var _label = $(_shape).find('label')[0];
        var _checkbox = $(_shape).find('input')[0];
        if (_checkbox) {
          $(_checkbox).on('change', function () {
            if ($(this).is(':checked')) {
              var _sendObj = {
                deviceID: deviceID,
                command: _label.checkedCommand,
              }
              _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
            }
            else {
              var _sendObj = {
                deviceID: deviceID,
                command: _label.unCheckedCommand,
              }
              _socket.emit('/write', JSON.stringify(_sendObj, null, 4));
            }
          });
        }
        break;
      }
    }
  })
}

function SCADA(arrHtmlElems, variableName) {
  shapes.forEach(function (_shape) {
    var _id = _shape.id.toString().toLowerCase().replace(/[0-9]/g, '');
    console.log(_id);
    switch (_id) {
      case 'text': {
        scadaTextObject(_shape, variableName);
        break;
      }
      case 'img': {
        scadaImageObject(_shape, variableName);
        break;
      }
      case 'displayvalue': {
        scadaDisplayValueObject(_shape, variableName);
        break;
      }
      case 'input': {
        scadaInputObject(_shape, variableName);
        break;
      }
      case 'switch': {
        scadaSwitchObject(_shape, variableName);
        break;
      }
      case 'button': {
        scadaButtonObject(_shape, variableName);
        break;
      }
      case 'slider': {
        scadaSliderObject(_shape, variableName);
        break;
      }
      case 'progressbar': {
        scadaProgressBarObject(_shape, variableName);
        break;
      }
      case 'checkbox': {
        scadaCheckboxObject(_shape, variableName);
        break;
      }
      case 'symbolset': {
        scadaSymbolSetObject(_shape, variableName);
        break;
      }
      default: {
        scadaSvgObject(_shape, variableName);
      }
    }
  })
}

//Svg scada
function scadaSvgObject(item, variableName) {
  console.log(item);
  if (item.node.hiddenWhen) {
    if (item.node.hiddenWhen.includes(variableName)) {
      if (eval(item.node.hiddenWhen)) item.hide();
      else item.show();
    }
  }
}

//Text scada
function scadaTextObject(item, variableName) {
  if (item.hiddenWhen) {
    if (item.hiddenWhen.includes(variableName)) {
      if (eval(item.hiddenWhen)) $(item).hide();
      else $(item).show();
    }
  }
}

//Image scada
function scadaImageObject(item, variableName) {
  if (item.hiddenWhen) {
    if (item.hiddenWhen.includes(variableName)) {
      if (eval(item.hiddenWhen)) $(item).hide();
      else $(item).show();
    }
  }
}

//DisplayValue scada
function scadaDisplayValueObject(item, variableName) {
  console.log($(item));
  if (item.hiddenWhen) {
    if (item.hiddenWhen.includes(variableName)) {
      if (eval(item.hiddenWhen)) $(item).hide();
      else $(item).show();
    }
  }

  if (item.tag) {
    if (item.tag.includes(variableName)) {
      if (typeof (eval(item.tag)) == 'boolean') $(item).text(eval(item.tag));
      else $(item).text(eval(item.tag).toFixed(item.format));
    }
  }
}

//Progressbar scada
function scadaProgressBarObject(item, variableName) {
  if (item.isMinTag) {
    if (item.minTag.includes(variableName)) item.min = eval(item.minTag);
  }
  else {
    if (item.minValue) item.min = item.minValue;
  }

  if (item.isMaxTag) {
    if (item.maxTag.includes(variableName)) item.max = eval(item.maxTag);
  }
  else {
    if (item.maxValue) item.max = item.maxValue;
  }

  var _range = item.max - item.min;

  console.log($(item).children('div'))
  if (item.hiddenWhen) {
    if (item.hiddenWhen.includes(variableName)) {
      if (eval(item.hiddenWhen)) $(item).hide();
      else $(item).show();
    }
  }

  if (item.tag) {
    if (item.tag.includes(variableName)) {
      var _width = eval(item.tag) / _range * 100 + '%';
      $(item).children('div').css({
        'width': _width,
      });
      if (item.isHideLabel) $(item).children('div').text('');
      else $(item).children('div').text(_width);
    }
  }
}

//SymbolSet scada
function scadaSymbolSetObject(item, variableName) {
  if (item.hiddenWhen) {
    if (item.hiddenWhen.includes(variableName)) {
      if (eval(item.hiddenWhen)) $(item).hide();
      else $(item).show();
    }
  }

  if (item.onCondition) {
    if (item.onCondition.includes(variableName)) {
      if (eval(item.onCondition)) item.src = item.onSymbol;
      else item.src = item.offSymbol;
    }
  }
}

//Button scada
function scadaButtonObject(item, variableName) {
  if (item.disableWhen) {
    if (item.disableWhen.includes(variableName)) {
      if (eval(item.disableWhen)) $(item).prop('disabled', true);
      else $(item).prop('disabled', false);
    }
  }
}

//Switch scada
function scadaSwitchObject(item, variableName) {
  var _span = $(item).find('span')[0];
  if (_span.disableWhen) {
    if (eval(_span.disableWhen)) $(item).find('input').prop('disabled', true);
    else $(item).find('input').prop('disabled', false);
  }
}

//Checkbox scada
function scadaCheckboxObject(item, variableName) {
  var _label = $(item).find('label')[0];
  if (_label.disableWhen) {
    if (eval(_label.disableWhen)) $(item).find('input').prop('disabled', true);
    else $(item).find('input').prop('disabled', false);
  }
}

//Input scada
function scadaInputObject(item, variableName) {
  if (item.disableWhen) {
    if (item.disableWhen.includes(variableName)) {
      if (eval(item.disableWhen)) $(item).prop('disabled', true);
      else $(item).prop('disabled', false);
    }
  }
}

//Slider scada
function scadaSliderObject(item, variableName) {
  if (item.disableWhen) {
    if (item.disableWhen.includes(variableName)) {
      if (eval(item.disableWhen)) $(item).prop('disabled', true);
      else $(item).prop('disabled', false);
    }
  }

  if (item.tag) {
    if (item.tag.includes(variableName)) {
      item.value = eval(item.tag);
    }
  }

  if (item.isMinTag) {
    if (item.minTag.includes(variableName)) item.min = eval(item.minTag);
  }
  else {
    if (item.minValue) item.min = item.minValue;
  }

  if (item.isMaxTag) {
    if (item.maxTag.includes(variableName)) item.max = eval(item.maxTag);
  }
  else {
    if (item.maxValue) item.max = item.maxValue;
  }
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

    //console.log(draggableObjects);


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
  var defaultImageSrc = '../../images/png/default-image.png';
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
  //  shapes[index].style.border = '2px solid black';

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
        elemPositionY = parseInt(elemStyle.top, 10),
        elemSource = elem.src;


      //console.log('Target ' + mouseEvent.target.id);

      var itemModal = document.getElementById('imageModal');
      itemModal.querySelector('#inputWidth').value = elemWidth;
      itemModal.querySelector('#inputHeight').value = elemHeight;
      itemModal.querySelector('#inputPositionX').value = elemPositionX;
      itemModal.querySelector('#inputPositionY').value = elemPositionY;
      itemModal.querySelector('.inputImageSource').value = elemSource;

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
        mouseEvent.target.src = itemModal.querySelector('.inputImageSource').value;

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
      $('.btnSelect').off('click');
    });

    $('#chooseImageModal').one('show.bs.modal', function (event) {
      $('.btnSelect').on('click', function (btnEvent) {
        if ($("[name=symbol]").is(":checked"))
          $('.inputImageSource').val($('[name=symbol]:checked').val());
        $('#chooseImageModal').modal('toggle');
      });
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
      elemFormat = mouseEvent.target.format;

      var itemModal = $('#displayValueModal')[0];

      itemModal.querySelector('#inputFontSize').value = elemFontsize;
      itemModal.querySelector('#fontPicker').value = elemFontFamily;
      itemModal.querySelector('#fontStyleForm').value = elemFontstyle;
      itemModal.querySelector('#inputTextColor').value = elemColor;
      itemModal.querySelector('#textContent').value = elemText;
      if (elemFormat) itemModal.querySelector('#displayFormat').value = elemFormat;
      else itemModal.querySelector('#displayFormat').value = 3;

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
        mouseEvent.target.format = itemModal.querySelector('#displayFormat').value;

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
  inputsw.className = ' primary ';

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
  input.type = 'number';
  input.id = 'input' + index;
  input.placeholder = 'Add value ...';

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
      elemType = mouseEvent.target.type;

      var itemModal = $('#inputModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;
      itemModal.querySelector('.inputHeight').value = elemHeight;
      itemModal.querySelector('.inputType').value = elemType;

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
        mouseEvent.target.type = itemModal.querySelector('.inputType').value;
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
  slider.min = 0;
  slider.max = 100;
  slider.minValue = slider.min;
  slider.maxValue = slider.max;

  //Image css style
  slider.style.position = 'absolute';
  slider.style.top = top;
  slider.style.left = left;
  slider.style.width = '400px';



  //Image mouse events
  $(slider).on('mouseover', function (event) {
    event.target.style.opacity = 0.4;
    $(this).tooltip('dispose');
    $(this).tooltip({
      animation: false,
      offset: (this.value - (this.max - this.min) / 2) * (parseInt(this.style.width, 10) / (this.max - this.min)),
      title: this.value
    });
    $(this).tooltip('show');

  });
  //Subscribe mouseout event for each polygon
  $(slider).on('mouseout', function (event) {
    event.target.style.opacity = 1;
    $(this).tooltip('hide');
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
  progressbar.isHideLabel = false;
  progressbar.min = 0;
  progressbar.max = 100;

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
      var isHideLabel = false;

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
      isHideLabel = progressElement.isHideLabel;

      var itemModal = $('#progressBarModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;
      itemModal.querySelector('.inputHeight').value = elemHeight;
      itemModal.querySelector('#hideLabelCheckbox').checked = isHideLabel;

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
        progressElement.isHideLabel = itemModal.querySelector('#hideLabelCheckbox').checked;

        if (itemModal.querySelector('.inputMinTag').value)
          progressElement.isMinTag = true;
        else progressElement.isMinTag = false;

        if (itemModal.querySelector('.inputMaxTag').value)
          progressElement.isMaxTag = true;
        else progressElement.isMaxTag = false;

        var _bar = $(progressElement).find('.progress-bar')[0];
        if (progressElement.isHideLabel) _bar.innerText = '';
        else _bar.innerText = _bar.style.width;


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
  var defaultSymbolSet = '../../images/symbol-set/light-off.png';
  var symbolSet = document.createElement('img');
  symbolSet.id = 'symbolSet' + index;
  symbolSet.className += ' contextMenu ';
  symbolSet.offSymbol = '';
  symbolSet.onSymbol = '';



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
        elemPositionY = parseInt(elemStyle.top, 10),
        elemOnSymbol = elem.onSymbol;
      elemOffSymbol = elem.offSymbol;

      var itemModal = $('#symbolSetModal')[0];
      itemModal.querySelector('.inputWidth').value = elemWidth;
      itemModal.querySelector('.inputHeight').value = elemHeight;
      itemModal.querySelector('.inputPositionX').value = elemPositionX;
      itemModal.querySelector('.inputPositionY').value = elemPositionY;
      itemModal.querySelector('.inputOnImageSource').value = elemOnSymbol;
      itemModal.querySelector('.inputOffImageSource').value = elemOffSymbol;

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
        mouseEvent.target.onSymbol = itemModal.querySelector('.inputOnImageSource').value;
        mouseEvent.target.offSymbol = itemModal.querySelector('.inputOffImageSource').value;
        mouseEvent.target.src = mouseEvent.target.offSymbol;
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
      $('.btnSelect').off('click');
    });

    $('#chooseImageModal').on('show.bs.modal', function (event) {
      var _target = event.relatedTarget.id;
      $('.btnSelect').one('click', function (btnEvent) {
        if ($("[name=symbol]").is(":checked")) {
          if (_target == 'btnOnSymbol')
            $('.inputOnImageSource').val($('[name=symbol]:checked').val());
          else
            $('.inputOffImageSource').val($('[name=symbol]:checked').val());
        }
        $('#chooseImageModal').modal('hide');
      });
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



