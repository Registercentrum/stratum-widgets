widgetConfig = {prefix: 'SE_SCREENING::1::F_SCREENING_1::1::IG_SCREE_SCREENING::1::I_SCREE_'}

Ext.define("SHPR.view.form.TridentScreening", {
    extend: "Ext.form.Panel",
    xtype: "tridentscreening",
    controller: "tridentscreening",
    title: 'Rapportera patientmedverkan',
    cls: 'shpr-trident',
    width: '100%',
    bodyPadding: 10,
    frame: false,
  
    fieldDefaults: {
      labelAlign: "right",
      labelWidth: 120,
      msgTarget: "qtip",
    },
  
    items: [
          {
              xtype: 'fieldset',
              title: 'Samtyckesuppgifter',
              defaultType: 'textfield',
              columns: 1,
              layout: 'anchor',
              defaults: {
                      anchor: '100%',
                      componentCls: ""
              },
              items: [{
                  xtype: 'container',
                  layout: 'vbox',
  
                  items: [
                    {
                        xtype: 'textfield',
                        fieldLabel: 'Patient',
                        name: widgetConfig.prefix + 'SUBJECTKEY',
                        width: 400
                    },
                      {
                          xtype: 'textfield',
                          fieldLabel: 'Handläggare',
                          name: widgetConfig.prefix + 'CONSENTSTAFF',
                          width: 400
                      },
                      {
                          xtype: 'textfield',
                          fieldLabel: 'Samtyckesdatum',
                          name: widgetConfig.prefix + 'CONSENTDATE',
                          width: 400
                      },
                      {
                        xtype: "radiogroup",
                        fieldLabel: 'Sida',
                        columns: 2,
                        name: widgetConfig.prefix + 'CONSENTSIDE',
                        items: [
                            { boxLabel: 'Höger', inputValue: 1 },
                            { boxLabel: 'Vänster', inputValue: 2 },
                           
                        ]
                      }]
              }]
          }
    ],
  
    buttons: [
      {
        text: "Skicka in svaren",
        width: 150,
        handler: "onCompleteClick",
      },
    ],
  });

  Ext.define("SHPR.view.form.TridentScreeningController", {
    extend: "Ext.app.ViewController",
    alias: "controller.tridentscreening",

    onCompleteClick: function () {
		var answers = this.prepareJSON()
		var subject = answers.shift().value
    this.subject = subject
    this.savePatient(subject)
    this.saveData(subject, answers)
  },

  savePatient: function (subject) {
    var eventId = new Date().toISOString()
    
    Ext.Ajax.request({
      url: "/stratum/api/rrct/steisure/subjects",
      method: "POST",
      jsonData: {
          subjectKey: subject,
          eventId: eventId
      },
      success: function (response) {
          console.log("SUCCESS", response);
      },
      failure: function (response) {
          console.log("FAIL", response);
      }
    });
    
  },
  
  prepareJSON: function () {
		var answers = []
		var values = this.getView().getForm().getFieldValues()
		Object.keys(values).forEach(function(key) {
			answers.push({id: key, value: values[key]})
		})
		return answers
	},

	saveData: function(subject, answers) {
		Ext.Ajax.request({
				url: "/stratum/api/rrct/steisure/subjects/data/" + subject,
				method: "POST",
				jsonData: answers,
				success: function (response) {
						console.log("SUCCESS", response);
				},
				failure: function (response) {
						console.log("FAIL", response);
				}
		});		
	}
});     

Ext.create("SHPR.view.form.TridentScreening", { renderTo: "contentPanel" });

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