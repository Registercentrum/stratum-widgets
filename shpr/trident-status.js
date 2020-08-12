
Ext.define("SHPR.view.TridentStatus", {
  extend: "Ext.grid.GridPanel",
  xtype: "tridentstatus",
  controller: "tridentstatus",
  title: 'Status',
  cls: 'shpr-trident',
  width: '100%',
  bodyPadding: 10,
  frame: false,

  store: {
    fields: ['SubjectId', 'SubjectKey', 'SurgeryDate', 'ReadyProm3'],
  },

  columns: [
    { text: 'Patient',  dataIndex: 'SubjectKey', width: 130 },
    { text: 'Operationsdatum', dataIndex: 'SurgeryDate', width : 150},
    { text: '1 år', dataIndex: 'ReadyProm1'},
    { text: '6 år', dataIndex: 'ReadyProm6'},
    { text: '10 år', dataIndex: 'ReadyProm10'}
],
});

Ext.define("SHPR.view.TridentStatusController", {
extend: "Ext.app.ViewController",
alias: "controller.tridentstatus",

init: function () {
  this.loadPatients().then(this.updateGrid)
},

loadPatients: function () {
  var deferred = new Ext.Deferred()
  var controller = this
  Ext.Ajax.request({
    url: "/stratum/api/rrct/steisure/subjects",
    method: "GET",
    success: function (response) {
        var data = {}
        data.patients = Ext.decode(response.responseText).data
        data.controller = controller
        deferred.resolve(data)
    },
    failure: function (response) {
        console.log("FAIL", response);
        deferred.reject('Unable to load patient list')
    }
  })
  return deferred.promise
},

updateGrid: function (data) {
  console.table(data.patients)
  data.controller.getView().getStore().loadData(data.patients)
  var requests = []
  var patientData = [] 
  data.patients.forEach(function(patient) {
    var request = Ext.Ajax.request({
      url: '/stratum/api/rrct/steisure/subjects/data/' + patient.SubjectKey,
      method: 'GET',
    });
    requests.push(request);
  });
  Ext.Promise.all(requests).then(function(results) {
    results.forEach(function(result) {
      var patient = Ext.decode(result.responseText).data
      patientData.push(patient)
    });
    data.answers = patientData
    data.controller.loadPatientData(data)
  },
  function(){console.log('failed')})
  console.table(patientData)
},

loadPatientData: function(data) {
  var store = data.controller.getView().getStore()
  var answers = data.answers
  var index = 0
  data.patients.forEach(function(patient) {
    var record = store.findRecord('SubjectKey', patient.SubjectKey)
    // var key = 'SE_POSTPROM1::1::F_PROM_1::1::IG_PROM_PROM::1::I_PROM_FJSDATE'
    var key = 'SE_PRIMARYTRT::1::F_PRIMARYTRT_1::1::IG_PRIMA_PRIMARYTRT::1::I_PRIMA_P_SURGDATE'
    var dateString = answers[index].find(function(answer){return answer.Id === key})
    dateString = dateString ? dateString.Value : ''
    var surgeryDate  = new Date(Date.parse(dateString))
    var elapsedTime = 0.1 // Divide by zero hack
    if(surgeryDate) {
      elapsedTime = new Date() - surgeryDate
    }
    elapsedTime = elapsedTime/365/24/60/60/1000
    record.set('SurgeryDate', dateString)
    record.set('ReadyProm1', elapsedTime >= 1 ? 'Ja': 'Nej')
    record.set('ReadyProm6', elapsedTime >= 6 ? 'Ja': 'Nej')
    record.set('ReadyProm10', elapsedTime >= 10 ? 'Ja': 'Nej')
    record.commit()
    index++
  });
}

});     

Ext.create("SHPR.view.TridentStatus", { renderTo: "contentPanel" });

Ext.util.CSS.removeStyleSheet('shpr');
Ext.util.CSS.createStyleSheet(
' '
+ '.x-fieldset-header-default {'
+ '  padding: 10px 5px;'
+ '  line-height: 20px;'
+ '  width: initial;'
+ '  border-bottom: none;'
+ '}'

+ '.shpr-trident .x-fieldset {'
+ '  background: #fff;'
+ '}'

, 'trident'
);