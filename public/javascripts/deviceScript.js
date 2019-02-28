//Global variable
let deviceObject = {};

$(document).ready(function () {
    var _user = $('#user').text();
    var socket = io();

    socket.on('connect', function(){
        socket.emit('reqDeviceConfig',_user); //Get device config array
        socket.on('resDeviceConfig', function (data) { 
            console.log(data);
            console.log('New');
            loadDeviceTable(data);
        });
        $('#sidebarButton').on('click', function () {
            $('#sidebar').toggleClass('active');
            var icon = $(this).children('i')[0];
            $(icon).toggleClass('fa-arrow-left');
            $(icon).toggleClass('fa-bars');
        });
    
        //Clear all inputs after modal closes
        $('body').on('hidden.bs.modal', '.modal', function () {
            $(".modal-body input").val("");
          });
    
        
        $('#gatewayChildrenModal').one('show.bs.modal',function (event) {
            var $row = event.relatedTarget;
            var $tr = $($row).closest('tr');
            var $tds = $tr.find('td');
    
            $(this).find('.gatewayName')[0].innerHTML = $tds[1].innerHTML;
            $(this).find('.creationTime')[0].innerHTML = $tds[2].innerHTML;
            $(this).find('.lastActive')[0].innerHTML = $tds[3].innerHTML;
            $(this).find('.longitude')[0].innerHTML = $tds[4].innerHTML;
            $(this).find('.latitude')[0].innerHTML = $tds[5].innerHTML;
    
        });
    
        $('#variableModal').one('show.bs.modal',function (event) {
            var $row = event.relatedTarget;
            var $tr = $($row).closest('tr');
            var $tds = $tr.find('td');
    
            $(this).find('.plcName')[0].innerHTML = $tds[1].innerHTML;
            $(this).find('.connectionName')[0].innerHTML = $tds[2].innerHTML;
            $(this).find('.plcIPAddress')[0].innerHTML = $tds[3].innerHTML;
        });
    
        //Create new device
        $('#newDeviceModal').one('show.bs.modal',function (event) {
            var modalItem = $(this);
            //console.log($(this));
             $(this).find('.btnNext').on('click',function (nextEvent) {
                if (!(modalItem.find('.inputName')[0].value && modalItem.find('.inputID')[0].value)){
                    alert('Fill in required parameters');
                }
                else { //Filled
                    deviceObject.deviceName = modalItem.find('.inputName')[0].value;
                    deviceObject.deviceID = modalItem.find('.inputID')[0].value;
                    deviceObject.longitude = modalItem.find('.inputLongitude')[0].value;
                    deviceObject.latitude = modalItem.find('.inputLatitude')[0].value;
                    if (modalItem.find('.inputInterval')[0].value != 0) 
                        deviceObject.period = modalItem.find('.inputInterval')[0].value;
                    else deviceObject.period = 5000;
                    deviceObject.PLCs = [];
                    deviceObject.user = _user;
                    deviceObject.creationTime = new Date().toLocaleString();
                    deviceObject.lastActive = '';
                    
                    modalItem.modal('hide');
                    //Add new row to device table
                    var htmlMarkup = `
                    <tr>
                        <td><input type = "checkbox"></td>
                        <td>` + deviceObject.deviceName + `</td>
                        <td>` + deviceObject.creationTime + `</td>
                        <td>` + deviceObject.lastActive + `</td>
                        <td>` + deviceObject.longitude + `</td>
                        <td>` + deviceObject.latitude + `</td>
                        <td>` + deviceObject.period + `</td>
                        <td><span class="rounded-circle bg-secondary status"></span></td>
                        <td>
                            <i class="fas fa-cog variable-icon" data-toggle="modal" data-target="#gatewayChildrenModal">
                        </td>
                    </tr>
                    `
                    $('#deviceTable tbody').append(htmlMarkup);
    
                    $('#newPLCModal').modal('show');          
                }
    
            });
        });
    
        $('#newPLCModal').one('show.bs.modal',function(event){
            var modalItem = $(this);
            $('#btnAddNewPLC').on('click',function (clickEvent) {  
                var plcName = modalItem.find('.inputName')[0].value,
                    plcProtocol = modalItem.find('[name=protocol]').val(),
                    plcIPAddress = modalItem.find('.inputIPAddress')[0].value;
                if (!(plcName && plcIPAddress)){
                    alert('Please fill required parameters');
                }
                else {
                    var newPLC = {
                        name: plcName,
                        protocol : plcProtocol,
                        ipAddress : plcIPAddress,
                        variables : [],
                    }
                    deviceObject.PLCs.push(newPLC);
                    deviceObject.status = false;
    
                    var htmlMarkup = `
                    <tr>
                        <td><input type = "checkbox"></td>
                        <td>` + plcName + `</td>
                        <td>` + plcProtocol + `</td>
                        <td>` + plcIPAddress + `</td>
                    </tr>
                    `;
                    $('#plcTable tbody').append(htmlMarkup);
                    $('.modal-body').css({
                        'max-height':'600px',
                        'overflow-y':'scroll'
                    });
    
                    //Clear old PLC
                    modalItem.find('.inputName')[0].value = '';
                    modalItem.find('.inputIPAddress')[0].value = '';
                }
            });
    
            modalItem.find('.btnNext').on('click',function (clickEvent) {  
                var rows = $('#plcTable tr').length - 1;
                if (rows > 0) {
                    modalItem.modal('hide');
                    $('#addNewVariable').modal('show');
                }
                else alert('Please add a new PLC');
            });
        });
    
        $('#addNewVariable').one('show.bs.modal',function (evebt) {  
            var modalItem = $(this);
            deviceObject.PLCs.forEach(plc => {
                var _option = new Option(plc.name, plc.name);
                $(_option).html(plc.name);
                modalItem.find('[name=plc]').append(_option);
            });
            modalItem.find('.btnAdd').on('click',function (clickEvent) {  
                if (!(modalItem.find('.inputName')[0].value && modalItem.find('.inputAddress')[0].value)){
                    alert('Please fill required parameters');
                }
                else{
                    var variableObject = {};
                    variableObject.name = modalItem.find('.inputName')[0].value;
                    variableObject.dataType = modalItem.find('[name=dataType]').val();
                    variableObject.plc = modalItem.find('[name=plc]').val();
                    variableObject.address = modalItem.find('.inputAddress')[0].value;
                    variableObject.access = modalItem.find('[name=access]').val();
                    variableObject.unit = modalItem.find('.inputUnit')[0].value;
                    variableObject.isAlarm = modalItem.find('.inputAlarm')[0].checked;
                    variableObject.isHistory = modalItem.find('.inputHistory')[0].checked;
    
                    for (var plc of deviceObject.PLCs){
                        if (plc.name == variableObject.plc) {
                            plc.variables.push(variableObject);
                            break;
                        }
                    }
    
                    var htmlMarkup = `
                    <tr>
                        <td><input type = "checkbox"></td>
                        <td>` + variableObject.name + `</td>
                        <td>` + variableObject.dataType + `</td>
                        <td>` + variableObject.plc + `</td>
                        <td>` + variableObject.address + `</td>
                        <td>` + variableObject.access + `</td>
                        <td>` + variableObject.unit + `</td>
                        <td>` + variableObject.isAlarm + `</td>
                        <td>` + variableObject.isHistory + `</td>
    
                    </tr>
                    `
                    $('#tableVariableList tbody').append(htmlMarkup);
                    $('.modal-body').css({
                        'max-height':'600px',
                        'overflow-y':'scroll'
                    });
    
                    //Clear old variable
                    modalItem.find('.inputName')[0].value = '';
                    modalItem.find('.inputAddress')[0].value = '';
                    modalItem.find('.inputUnit')[0].value = '';
                    modalItem.find('.inputAlarm')[0].checked = false;
                    modalItem.find('.inputHistory')[0].checked = false;
                }
            });
    
            modalItem.find('.btnSave').on('click', function (clickEvent) { 
                socket.emit('deviceConfig', JSON.stringify(deviceObject,null,4));
                location.reload();
                socket.emit('reqDeviceConfig',_user); //Get device config array
            });
        });
    
        //Delete row
        $(".delete-row").click(function(){
            $('table tbody').find('input[type="checkbox"]').each(function(){
                if($(this).is(":checked")){
                    $(this).parents("tr").remove();
                }
            });
        });

    });
});

function loadDeviceTable(arrDeviceObject){
    if (arrDeviceObject.length > 0) {
        arrDeviceObject.forEach(function (device) { 
            var htmlMarkup = `
                <tr>
                    <td><input type = "checkbox"></td>
                    <td>` + device.deviceName + `</td>
                    <td>` + device.creationTime + `</td>
                    <td>` + device.lastActive + `</td>
                    <td>` + device.longitude + `</td>
                    <td>` + device.latitude + `</td>
                    <td>` + device.period + `</td>`
            if (!device.status) 
                htmlMarkup += '<td><span class="rounded-circle bg-secondary status"></span></td>'
            else htmlMarkup += '<td><span class="rounded-circle bg-primary status"></span></td>'
                 htmlMarkup += `
                    <td>
                        <i class="fas fa-cog variable-icon" data-toggle="modal" data-target="#gatewayChildrenModal">
                    </td>
                </tr>`   
            $('#deviceTable > tbody').append(htmlMarkup);
                
        });
    }
}

function loadPLCModal($modal,deviceObj){
    $modal.find('.gatewayName')[0].innerHTML = deviceObj.deviceName;
    $modal.find('.creationTime')[0].innerHTML = deviceObj.creationTime;
    $modal.find('.lastActive')[0].innerHTML = deviceObj.lastActive;
    $modal.find('.longitude')[0].innerHTML = deviceObj.longitude;
    $modal.find('.latitude')[0].innerHTML = deviceObj.latitude;

    var plcList = deviceObj.PLCs;
    $modal.find('.table > tbody')[0].empty();
    plcList.forEach(function (plc) { 
        var htmlMarkup = `
        <tr>
            <td>` + (plcList.indexOf(plc) +1) +`</td>
            <td>` + plc.name + `</td>
            <td>` + plc.protocol + `</td>
            <td>` + plc.ipAddress + `</td>
            <td>
                <i class="fas fa-cog variable-icon" data-toggle="modal" data-target="#variableModal">
            </td>
        </tr>`
        $modal.find('.table > tbody')[0].append(htmlMarkup);
    });
}

function loadVariables($modal,plcObject){
    $modal.find('.plcName')[0].innerHTML = plcObject.name;
    $modal.find('.connectionName')[0].innerHTML = plcObject.protocol;
    $modal.find('.plcIPAddress')[0].innerHTML = plcObject.ipAddress;

    var variableList = plcObject.variables;
    $modal.find('.table > tbody')[0].empty();
    variableList.forEach(function (variable) { 
        var htmlMarkup = `
        <tr>
            <td>` + (variableList.indexOf(variable) +1) +`</td>
            <td>` + variable.name + `</td>
            <td>` + variable.dataType + `</td>
            <td>` + variable.address + `</td>
            <td>` + variable.access + `</td>
            <td>` + variable.unit + `</td>
            <td>` + variable.isAlarm + `</td>
            <td>` + variable.isHistory + `</td>
        </tr>`
        $modal.find('.table > tbody')[0].append(htmlMarkup);
    });
}

