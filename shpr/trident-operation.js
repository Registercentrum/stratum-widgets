
widgetConfig = {prefix: 'SE_PRIMARYTRT::1::F_PRIMARYTRT_1::1::IG_PRIMA_PRIMARYTRT::1::I_PRIMA_'}

Ext.define("SHPR.view.form.TridentOperation", {
    extend: "Ext.form.Panel",
    xtype: "tridentoperation",
    controller: "tridentoperation",
    title: 'Rapportera operation',
    cls: 'shpr-trident',
    width: '100%',
    bodyPadding: 10,
    marginBottom: 20,
    frame: false,
  
    fieldDefaults: {
      labelAlign: "right",
      labelWidth: 120,
      msgTarget: "qtip",
    },
  
    items: [
          {
              xtype: 'fieldset',
              title: 'Operation',
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
                        name: widgetConfig.prefix + 'SUBJECT',
                        width: 400
                    },
                    {
                        xtype: 'datefield',
                        fieldLabel: 'Operationsdatum',
                        width: 240,
                        itemId: 'startDate',
                        value: new Date(),
                        format: 'Y-m-d',
                        altFormats: 'ymd|Ymd',
                        name: widgetConfig.prefix + 'P_SURGDATE',
                    },
                    {
                        xtype: "radiogroup",
                        fieldLabel: 'Sida',
                        columns: 2,
                        name: widgetConfig.prefix + 'P_SIDE',
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

  Ext.define("SHPR.view.form.TridentOperationController", {
    extend: "Ext.app.ViewController",
    alias: "controller.tridentoperation",

    onCompleteClick: function () {
        var answers = this.prepareJSON()
        answers[1].value = Ext.Date.format(this.getView().down('#startDate').getValue(),  'Y-m-d')
		var subject = answers.shift().value
        this.subject = subject
        this.saveData(subject, answers)
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
						Ext.toast({html: 'Svaren registrerade', anchor: 'contentPanel', align: 't'})
				},
				failure: function (response) {
						console.log("FAIL", response);
				}
		});		
	}
});     

Ext.create("SHPR.view.form.TridentOperation", { renderTo: "contentPanel" });

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

	+ '.trident-toast {'
	+ '  width: 100%;'
	+ '  height: 40px;'
	+ '  background: red;'
	+ '}'

	, 'trident'
);