//Global variables
let elementHTML = [];
let variableList = [];
let $user = $('#user').text();
let $deviceID = $('#deviceID').text();


$(document).ready(function () {
    let socket = io();

    //Empty alarm table first
    $('#alarmTable tbody').empty();

    socket.on('connect', function (data) {

        //Initialize variables and HTML elements
        socket.emit('/reqPublishParameters' , {user : $user , deviceID : $deviceID});
        socket.on('/' + $deviceID + '/resPublishParameters' , function(dataObject) {
          elementHTML = dataObject.htmlElements;
          variableList = dataObject.variableList;
          initVariable(variableList);
          initElementHTML(elementHTML);
          socket.off('/' + $deviceID + '/resPublishParameters');
        });
        

        //History function
        socket.emit('/reqHistory', $deviceID);
        socket.on('/' + $deviceID + '/resHistory' , function (arrHistory) {
            loadHistoryTable(arrHistory);
        });

        //Alarm function
        socket.on('/' + $deviceID + '/alarm', function (alarmObject) {
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

  $('#btnTest').click(function(){
    var imgs = $( "[id^='text']" );
    console.log(variableList);
  })

});


/* **************** FUNCTIONS ****************** */
function loadHistoryTable(arrHistory) {
    $('#historyTable tbody').empty();
    for (i = 0; i< arrHistory.length ; i++ ) {
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
  for (i = 0 ; i < variableList.length ; i++) {
    var _expression = variableList[i].name + ' = ' + variableList[i].value;
    eval(_expression);
  }
}

function initElementHTML(elementHTML) {

}