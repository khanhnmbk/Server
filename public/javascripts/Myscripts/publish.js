//Global variables
let elementHTML = [];
let variableList = [];
let $user = $('#user').text();
let $deviceID = $('#deviceID').text();

console.log($user);
console.log($deviceID);


$(document).ready(function () {
  let socket = io();

  //Empty alarm table first
  $('#alarmTable tbody').empty();

  //Button style when click
  $('.btn.contextMenu').on('mousedown', function () { $(this).css({ 'opacity': 0.5 }) });
  $('.btn.contextMenu').on('mouseup', function () { $(this).css({ 'opacity': 1 }) });


  socket.on('connect', function (data) {

    //Initialize variables and HTML elements
    socket.emit('/reqPublishParameters', { user: $user, deviceID: $deviceID });
    socket.on('/' + $deviceID + '/resPublishParameters', function (dataObject) {
      elementHTML = dataObject.htmlElements;
      variableList = dataObject.variableList;
      initVariable(variableList);
      reInitVerticalSlider();
      fixTooltip();
      initElementHTML(elementHTML);
      initSCADA(elementHTML, socket);
      socket.off('/' + $deviceID + '/resPublishParameters');
    });

    //History function
    socket.emit('/reqHistory', $deviceID);
    socket.on('/' + $deviceID + '/resHistory', function (arrHistory) {
      loadHistoryTable(arrHistory);
    });

    //Alarm function
    socket.on('/' + $deviceID + '/alarm', function (alarmObject) {
      var arrAlarmSource = Array.from($('#alarmTable tr td:nth-child(4)'));
      var arrAlarmType = Array.from($('#alarmTable tr td:nth-child(7)'));
      var arrAlarmState = Array.from($('#alarmTable tr td:nth-child(8)'));
      var _isExist = false;
      var _timeStamp = new Date(alarmObject.timestamp)

      for (var i = 0; i < arrAlarmSource.length; i++) {
        if ((arrAlarmSource[i].innerText == alarmObject.source) && (arrAlarmType[i].innerText == alarmObject.type) && (arrAlarmState[i].innerText == 'UNACK')) { 
            if (alarmObject.state == 'UNACK') {
              var _expression = '#alarmTable tr:nth(' + (i + 1) + ') td';
              var tableRow = $(_expression);
              tableRow[1].innerText = _timeStamp.toLocaleDateString();
              tableRow[2].innerText = _timeStamp.toLocaleTimeString();
              tableRow[4].innerText = alarmObject.value;
              tableRow[5].innerText = alarmObject.message;
              tableRow[6].innerText = alarmObject.type;
              tableRow[7].innerText = alarmObject.state;
            }
            else { //ACKED
              var _expression = '#alarmTable tr:nth(' + (i + 1) + ') td';
              var tableRow = $(_expression);
              tableRow[1].innerText = _timeStamp.toLocaleDateString();
              tableRow[2].innerText = _timeStamp.toLocaleTimeString();
              tableRow[7].innerText = alarmObject.state;
              $(arrAlarmSource[i].closest('tr')).css('color' , 'black');
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

    //Scada function
    socket.on('/' + $deviceID + '/tag', function (data) {
      var arrVarObjects = JSON.parse(data);
      if (arrVarObjects) {
        arrVarObjects.variables.forEach(function (varObject) {
          eval(varObject.tagName + '=' + varObject.value);
          SCADA(elementHTML, varObject.tagName);
        });
      }
    });

    
  $('#btnAck').click(function () {
    if ($('.alarm-selected').length > 0) {
      var _resAlarm = {
        deviceID: $deviceID,
        resAlarm: []
      }
      $('.alarm-selected').each(function () {
        var _selectedItem = $(this).find('td');
        if (_selectedItem[7].innerText != 'ACKED') {
          _resAlarm.resAlarm.push({
            deviceID : $deviceID,
            source: _selectedItem[3].innerText,
            value: _selectedItem[4].innerText,
            message: _selectedItem[5].innerText,
            type: _selectedItem[6].innerText,
            state: 'ACKED',
            timestamp: new Date().toLocaleString(),
          })
        }
      });
      console.log('ACK button');
      console.log(_resAlarm);
      if (_resAlarm.resAlarm.length > 0) socket.emit('/resAlarm', _resAlarm);
    }
  });

  $('#btnAckAll').click(function () {
    var rows = $('#alarmTable tbody tr');
    if (rows.length > 0) {
      var _resAlarm = {
        deviceID: $deviceID,
        resAlarm: []
      }
      rows.each(function () {
        if ($(this).find('td')[7].innerText == 'UNACK')
          _resAlarm.resAlarm.push({
            deviceID : $deviceID,
            source: $(this).find('td')[3].innerText,
            value: $(this).find('td')[4].innerText,
            message: $(this).find('td')[5].innerText,
            type: $(this).find('td')[6].innerText,
            state: 'ACKED',
            timestamp: new Date().toLocaleString(),
          })
      });
      socket.emit('/resAlarm', _resAlarm);
      console.log('ACK all');
      console.log(_resAlarm);
    }
  });
  });


  $('#btnRefreshHistory').click(function () {
    socket.emit('/reqHistory', $deviceID);
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
          if (txtDate >= filterFrom) {
            tr[i].style.display = "";
            tr[i].classList.remove('ignore-row');
          } else {
            tr[i].style.display = "none";
            tr[i].classList.add('ignore-row');
          }
        } else if (!inputFrom.value && inputTo.value) { //Only to
          if (txtDate <= filterTo) {
            tr[i].style.display = "";
            tr[i].classList.remove('ignore-row');
          } else {
            tr[i].style.display = "none";
            tr[i].classList.add('ignore-row');
          }
        } else {  //Both
          if ((txtDate >= filterFrom) && (txtDate <= filterTo)) {
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

      if (!tr[i].classList.contains('ignore-row')) {
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
    if (inputFrom.value) doc.text('From: ' + filterFrom.toLocaleDateString(), 16, 30);
    if (inputTo.value) doc.text('To:   ' + filterTo.toLocaleDateString(), 16, 35);

    doc.autoTable({
      head: [['Tag', 'Data type', 'Address', 'Value', 'Timestamp']],
      body: rowData,
      startY: 50
    });
    doc.save('table.pdf');
  });

  $('#btnTest').click(function () {
    var _elem = $('#mainPage1').children();
    console.log(_elem);
  });


});


/* **************** FUNCTIONS ****************** */
function loadHistoryTable(arrHistory) {
  $('#historyTable tbody').empty();
  for (i = 0; i < arrHistory.length; i++) {
    var _htmlMarkup =
      `<tr>
            <td>` + arrHistory[i].tag + `</td>
            <td>` + arrHistory[i].type + `</td>
            <td>` + arrHistory[i].address + `</td>
            <td>` + arrHistory[i].value + `</td>
            <td>` + arrHistory[i].timestamp + `</td>
          </tr>`;
    $('#historyTable tbody').append(_htmlMarkup);
  }
}

function initVariable(variableList) {
  for (i = 0; i < variableList.length; i++) {
    var _expression = variableList[i].name + ' = ' + variableList[i].value;
    eval(_expression);
  }
}

function initElementHTML(elementHTML) {
  for (i = 0; i < elementHTML.length; i++) {
    var _htmlElem = document.getElementById(elementHTML[i].id);
    if (_htmlElem) {
      for (j = 0; j < elementHTML[i].properties.length; j++) {
        _htmlElem[elementHTML[i].properties[j].name] = elementHTML[i].properties[j].value;
      }
    }
  }
}

function initSCADA(elementHTML, socket) {
  for (i = 0; i < elementHTML.length; i++) {
    var _id = '#' + elementHTML[i].id;
    switch (elementHTML[i].type.toLowerCase()) {
      //Button
      case 'button': {
        $(_id).on('click', function () {
          var _sendObj = { deviceID: $deviceID, command: this.command };
          socket.emit('/write', _sendObj);
        });
        break;
      }
      //Switch
      case 'switch': {
        var _checkbox = $(_id).siblings('input')[0];
        var _span = $(_id)[0];
        if (_checkbox) {
          $(_checkbox).on('change', function () {
            if ($(this).is(':checked')) {
              var _sendObj = { deviceID: $deviceID, command: _span.onCommand }
              socket.emit('/write', _sendObj);
            }
            else {
              var _sendObj = { deviceID: $deviceID, command: _span.offCommand }
              socket.emit('/write', _sendObj);
            }
          });
        }
        break;
      }
      //Input
      case 'input': {
        $(_id).on('keyup', function (event) {
          if (event.keyCode == 13) {
            if (this.tag) {
              if (this.type == 'text') {
                var _sendObj = { deviceID: $deviceID, command: this.tag + ' = ' + '"' + this.value + '"' };
              }
              else {
                var _sendObj = { deviceID: $deviceID, command: this.tag + ' = ' + this.value };
              }
              socket.emit('/write', _sendObj);
            }
          }
        });
        break;
      }
      //Slider
      case 'slider': {
        $(_id).on('input', function (event) {
          $(this).tooltip('dispose');
          $(this).tooltip({
            animation: false,
            offset: (this.value - (this.max - this.min) / 2) * (parseInt(this.style.width, 10) / (this.max - this.min)),
            title: this.value
          });
          $(this).tooltip('show');
        });
        $(_id).on('change', function (event) {
          var _sendObj = { deviceID: $deviceID, command: this.tag + ' = ' + this.value };
          if (this.tag) socket.emit('/write', _sendObj);
        });
        break;
      }
      //Vertical slider
      case 'verticalslider': {
        var htmlSlider = document.getElementById(elementHTML[i].id);
        $(_id).on('slideStop', function (event) {
          var _sendObj = {
            deviceID: $deviceID,
            command: this.tag + ' = ' + this.value
          }
          console.log(_sendObj);
          if (this.tag) socket.emit('/write', _sendObj);
        });
        break;
      }
      //Checkbox
      case 'checkbox': {
        var _label = $(_id)[0];
        var _checkbox = $(_id).siblings('input')[0];
        if (_checkbox) {
          $(_checkbox).on('change', function () {
            if ($(this).is(':checked')) {
              var _sendObj = { deviceID: $deviceID, command: _label.checkedCommand }
              socket.emit('/write', _sendObj);
            }
            else {
              var _sendObj = { deviceID: $deviceID, command: _label.unCheckedCommand }
              socket.emit('/write', _sendObj);
            }
          });
        }
        break;
      }

    }
  }
}

function SCADA(elementHTML, variableName) {
  for (i = 0; i < elementHTML.length; i++) {
    var _id = elementHTML[i].id;
    var _type = elementHTML[i].type.toLowerCase();
    switch (_type) {
      //Text
      case 'text': {
        scadaText(_id, variableName);
        break;
      }
      //Img
      case 'img': {
        scadaImage(_id, variableName);
        break;
      }
      //Display value
      case 'displayvalue': {
        scadaDisplayValue(_id, variableName);
        break;
      }
      //Input
      case 'input': {
        scadaInput(_id, variableName);
        break;
      }
      //Switch
      case 'switch': {
        scadaSwitch(_id, variableName);
        break;
      }
      //Button
      case 'button': {
        scadaButton(_id, variableName);
        break;
      }
      //Slider
      case 'slider': {
        scadaSlider(_id, variableName);
        break;
      }
      //Vertical slider
      case 'verticalslider': {
        scadaVerticalSlider(_id, variableName);
        break;
      }
      //Progressbar
      case 'progressbar': {
        scadaProgressbar(_id, variableName);
        break;
      }
      //Vertical progressbar
      case 'verticalprogressbar': {
        scadaVerticalProgressbar(_id, variableName);
        break;
      }
      //Checkbox
      case 'checkbox': {
        scadaCheckbox(_id, variableName);
        break;
      }
      //SymbolSet
      case 'symbolset': {
        scadaSymbolSet(_id, variableName);
        break;
      }
      //SVG
      case 'svg': {
        scadaSvg(_id, variableName);
        break;
      }
    }
  }
}

//SVG scada
function scadaSvg(id, variableName) {
  var svg = document.getElementById(id);
  if (svg) {
    if (svg.hiddenWhen) {
      if (svg.hiddenWhen.includes(variableName)) {
        if (eval(svg.hiddenWhen)) $(svg).hide();
        else $(svg).show();
      }
    }
  }
}

//Text scada
function scadaText(id, variableName) {
  var txt = document.getElementById(id);
  if (txt) {
    if (txt.hiddenWhen) {
      if (txt.hiddenWhen.includes(variableName)) {
        if (eval(txt.hiddenWhen)) $(txt).hide();
        else $(txt).show();
      }
    }
  }
}

//Image scada
function scadaImage(id, variableName) {
  var img = document.getElementById(id);
  if (img) {
    if (img.hiddenWhen) {
      if (img.hiddenWhen.includes(variableName)) {
        if (eval(img.hiddenWhen)) $(img).hide();
        else $(img).show();
      }
    }
  }
}

//Display value scada
function scadaDisplayValue(id, variableName) {
  var disp = document.getElementById(id);
  if (disp) {
    if (disp.hiddenWhen) {
      if (disp.hiddenWhen.includes(variableName)) {
        if (eval(disp.hiddenWhen)) $(disp).hide();
        else $(disp).show();
      }
    }

    if (disp.tag) {
      if (disp.tag.includes(variableName)) {
        if (typeof (eval(disp.tag)) == 'boolean') $(disp).text(eval(disp.tag));
        else $(disp).text(eval(disp.tag).toFixed(disp.format));
      }
    }

  }
}

//Progressbar scada
function scadaProgressbar(id, variableName) {
  var bar = document.getElementById(id);
  if (bar.isMinTag) {
    if (bar.minTag.includes(variableName)) bar.min = eval(bar.minTag);
  }
  else {
    if (bar.minValue) bar.min = bar.minValue;
  }

  if (bar.isMaxTag) {
    if (bar.maxTag.includes(variableName)) bar.max = eval(bar.maxTag);
  }
  else {
    if (bar.maxValue) bar.max = bar.maxValue;
  }

  var _range = bar.max - bar.min;

  if (bar.hiddenWhen) {
    if (bar.hiddenWhen.includes(variableName)) {
      if (eval(bar.hiddenWhen)) $(bar).hide();
      else $(bar).show();
    }
  }

  if (bar.tag) {
    if (bar.tag.includes(variableName)) {
      if (eval(bar.tag) <= bar.min) {
        var _width = '0%';
      } else if (eval(bar.tag) >= bar.max) {
        var _width = '100%';
      } else {
        var _width = (eval(bar.tag) - bar.min) / _range * 100 + '%';
      }
      $(bar).children('div').css({
        'width': _width,
      });
      if (bar.isHideLabel) $(bar).children('div').text('');
      else {
        if (!bar.isRawValue) $(bar).children('div').text(_width);
        else $(bar).children('div').text(eval(bar.tag));
      }
    }
  }
}

//Vertical progressbar scada
function scadaVerticalProgressbar(id, variableName) {
  var verticalbar = document.getElementById(id);
  if (verticalbar.isMinTag) {
    if (verticalbar.minTag.includes(variableName)) verticalbar.min = eval(verticalbar.minTag);
  }
  else {
    if (verticalbar.minValue) verticalbar.min = verticalbar.minValue;
  }

  if (verticalbar.isMaxTag) {
    if (verticalbar.maxTag.includes(variableName)) verticalbar.max = eval(verticalbar.maxTag);
  }
  else {
    if (verticalbar.maxValue) verticalbar.max = verticalbar.maxValue;
  }

  var _range = verticalbar.max - verticalbar.min;

  if (verticalbar.hiddenWhen) {
    if (verticalbar.hiddenWhen.includes(variableName)) {
      if (eval(verticalbar.hiddenWhen)) $(verticalbar).hide();
      else $(verticalbar).show();
    }
  }

  if (verticalbar.tag) {
    if (verticalbar.tag.includes(variableName)) {
      if (eval(verticalbar.tag) <= verticalbar.min) {
        var _height = '0%';
        var _top = '100%'
      } else if (eval(verticalbar.tag) >= verticalbar.max) {
        var _height = '100%';
        var _top = '0%'
      } else {
        var _height = (eval(verticalbar.tag) - verticalbar.min) / _range * 100 + '%';
        var _top = (100 - (eval(verticalbar.tag) - verticalbar.min) / _range * 100) + '%';
      }
      $(verticalbar).children('div').css({
        'height': _height,
        'top': _top,
        'width': '100%'
      });
      if (verticalbar.isHideLabel) $(verticalbar).children('div').text('');
      else {
        if (!verticalbar.isRawValue) $(verticalbar).children('div').text(_height);
        else $(verticalbar).children('div').text(eval(verticalbar.tag));
      }
    }
  }
}

//SymbolSet
function scadaSymbolSet(id, variableName) {
  var symbol = document.getElementById(id);
  if (symbol.hiddenWhen) {
    if (symbol.hiddenWhen.includes(variableName)) {
      if (eval(symbol.hiddenWhen)) $(symbol).hide();
      else $(symbol).show();
    }
  }

  if (symbol.onCondition) {
    if (symbol.onCondition.includes(variableName)) {
      if (eval(symbol.onCondition)) symbol.src = symbol.onSymbol;
      else symbol.src = symbol.offSymbol;
    }
  }
}

//Button scada
function scadaButton(id, variableName) {
  var btn = document.getElementById(id);
  if (btn.disableWhen) {
    if (btn.disableWhen.includes(variableName)) {
      if (eval(btn.disableWhen)) $(btn).prop('disabled', true);
      else $(btn).prop('disabled', false);
    }
  }
}

//Input scada
function scadaInput(id, variableName) {
  var input = document.getElementById(id);
  if (input.disableWhen) {
    if (input.disableWhen.includes(variableName)) {
      if (eval(input.disableWhen)) $(input).prop('disabled', true);
      else $(input).prop('disabled', false);
    }
  }
}

//Slider scada
function scadaSlider(id, variableName) {
  var slider = document.getElementById(id);
  if (slider.disableWhen) {
    if (slider.disableWhen.includes(variableName)) {
      if (eval(slider.disableWhen)) $(slider).prop('disabled', true);
      else $(slider).prop('disabled', false);
    }
  }

  if (slider.tag) {
    if (slider.tag.includes(variableName)) {
      slider.value = eval(slider.tag);
    }
  }

  if (slider.isMinTag) {
    if (slider.minTag.includes(variableName)) slider.min = eval(slider.minTag);
  }
  else {
    if (slider.minValue) slider.min = slider.minValue;
  }

  if (slider.isMaxTag) {
    if (slider.maxTag.includes(variableName)) slider.max = eval(slider.maxTag);
  }
  else {
    if (slider.maxValue) slider.max = slider.maxValue;
  }
}

//Vertical slider scada
function scadaVerticalSlider(id, variableName) {
  var verticalSlider = document.getElementById(id);
  if (verticalSlider.disableWhen) {
    if (verticalSlider.disableWhen.includes(variableName)) {
      if (eval(verticalSlider.disableWhen)) $(verticalSlider).bootstrapSlider('disable');
      else $(verticalSlider).bootstrapSlider('enable');
    }
  }

  if (verticalSlider.tag) {
    if (verticalSlider.tag.includes(variableName)) {
      $(verticalSlider).bootstrapSlider('setValue', eval(verticalSlider.tag));
    }
  }

  if (verticalSlider.isMinTag) {
    if (verticalSlider.minTag.includes(variableName)) verticalSlider.min = eval(verticalSlider.minTag);
  }
  else {
    if (verticalSlider.minValue) verticalSlider.min = verticalSlider.minValue;
  }

  if (verticalSlider.isMaxTag) {
    if (verticalSlider.maxTag.includes(variableName)) verticalSlider.max = eval(verticalSlider.maxTag);
  }
  else {
    if (verticalSlider.maxValue) verticalSlider.max = verticalSlider.maxValue;
  }
}

//Switch scada
function scadaSwitch(id, variableName) {
  var _span = document.getElementById(id);
  var sw = _span.parentNode;
  if (_span.disableWhen) {
    if (eval(_span.disableWhen)) $(sw).find('input').prop('disabled', true);
    else $(sw).find('input').prop('disabled', false);
  }
}

//Checkbox scada
function scadaCheckbox(id, variableName) {
  var _label = document.getElementById(id);
  var _cb = _label.parentNode;
  if (_label.disableWhen) {
    if (eval(_label.disableWhen)) $(_cb).find('input').prop('disabled', true);
    else $(_cb).find('input').prop('disabled', false);
  }
}

//Fix tooltip for vertical slider
function fixTooltip() {

  $('.slider-vertical').each(function () {
    $(this).children('.tooltip')[0].classList.add('bs-tooltip-left');
    $(this).children('.tooltip')[0].childNodes[0].classList.add('arrow', 'my-2');
  })


  //Fix background color
  $('.slider-vertical').find('.slider-handle').each(function () {
    $(this).css({ background: '#007bff' })
  });
}

//Re-initialize vertical slider 
function reInitVerticalSlider() {
  for (i = 0; i < elementHTML.length; i++) {
    if (elementHTML[i].type == 'verticalslider') {
      var min, max, height;
      if (elementHTML[i].properties[5].value) min = eval((elementHTML[i].properties[1].value));
      else min = elementHTML[i].properties[2].value;

      if (elementHTML[i].properties[6].value) max = eval((elementHTML[i].properties[3].value));
      else max = elementHTML[i].properties[4].value;

      height = $('#' + elementHTML[i].id).siblings('.slider')[0].style.height;

      var htmlObj = document.getElementById(elementHTML[i].id).cloneNode(true);
      htmlObj.min = min;
      htmlObj.max = max;
      var topDiv = document.getElementById(elementHTML[i].id).parentNode.style.top;
      var leftDiv = document.getElementById(elementHTML[i].id).parentNode.style.left;
      //Remove current slider
      $(document.getElementById(elementHTML[i].id).parentNode).remove();

      //Create new slider
      var verticalSliderDiv = document.createElement('div');
      verticalSliderDiv.style.position = 'absolute';
      verticalSliderDiv.style.top = topDiv;
      verticalSliderDiv.style.left = leftDiv;
      verticalSliderDiv.append(htmlObj);
      $('#mainPage1').append(verticalSliderDiv);
      //Create vertical slider
      $(htmlObj).bootstrapSlider({
        min: min,
        max: max,
        value: 50,
        orientation: 'vertical',
        tooltip_position: 'left',
        reversed: true,
      });
      $('#' + elementHTML[i].id).siblings('.slider')[0].style.height = height;
      console.log($('#' + elementHTML[i].id));
    }
  }
}