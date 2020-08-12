
Ext.define("SHPR.view.form.Trident", {
  extend: "Ext.form.Panel",
  xtype: "trident",
  controller: "trident",
	title: 'Rapportera patientsvar ' + widgetConfig.formName,
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
			title: 'Formuläruppgifter',
			defaultType: 'textfield',
			layout: 'anchor',
			defaults: {
					anchor: '100%',
					componentCls: ""
			},
			items: [{
				xtype: 'container',
				layout: 'vbox',
				margin: '0 0 5 0',

				items: [{
						xtype: 'textfield',
						fieldLabel: 'Personnummer',
						name: 'Subject',
						width: 300
					},
					{
						/*
						xtype: 'textfield',
						fieldLabel: 'Datum',
						name: widgetConfig.formIdentifier + 'DATE',
						width: 300
						*/
						xtype: 'datefield',
                        fieldLabel: 'Datum',
                        width: 240,
                        itemId: 'startDate',
                        value: new Date(),
                        format: 'Y-m-d',
                        altFormats: 'ymd|Ymd',
                        name: widgetConfig.formIdentifier + 'DATE',
					}]
			}]
		}
  ],

  buttons: [
		{
      text: "Hämta svaren",
      width: 150,
      handler: "onFetchAnswers",
      hidden: true
    },
    {
      text: "Skicka in svaren",
      width: 150,
      handler: "onCompleteClick",
    },
  ],
});

Ext.define("SHPR.view.Question", {
  extend: "Ext.form.FieldSet",
  xtype: "trident-question",
  config: {
    question: '',
	},
	style: {
		marginBottom: 0
	},

  layout: "anchor",
  defaults: {
    anchor: "100%",
    componentCls: "",
  },

  items: [
    {
      xtype: "radiogroup",
      layout: {
        autoFlex: false,
      },

      defaults: {
        name: "options",
        margin: "0 15 0 0",
      },

      items: [],
    },
  ],

  initComponent: function () {
    this.callParent();
    var radiogroup = this.down('radiogroup');
		var question = this.getQuestion();
    question.options.forEach(function (option) {
      radiogroup.add({
				name: widgetConfig.formIdentifier + question.id,
        boxLabel: option.text,
        inputValue: option.value,
        checked: option.checked || false
      });
    });
  },
});

Ext.define("SHPR.view.form.TridentController", {
  extend: "Ext.app.ViewController",
  alias: "controller.trident",

  init: function () {
		var view = this.getView()
    SHPR.forms[widgetConfig.formNumber].questions.forEach(function(question){
			var fieldset = Ext.create({
				xtype: "trident-question",
				title: question.label,
				question: question,
			});
			view.add(fieldset);
		})
	},
	
	onCompleteClick: function () {
		console.log('complete')
		var answers = this.prepareJSON()
		answers[1].value = Ext.Date.format(this.getView().down('#startDate').getValue(),  'Y-m-d')
		var subject = answers.shift().value
		this.subject = subject
		this.saveData(subject, answers)
	},

	onFetchAnswers: function () {
		this.getData(this.subject)
	},

	prepareJSON: function () {
		var answers = []
		var values = this.getView().getForm().getFieldValues()
		Object.keys(values).forEach(function(key) {
			answers.push({id: key, value: values[key]})
		})
		return answers
	},

	saveData: function(subjectKey, answers) {
		Ext.Ajax.request({
				url: "/stratum/api/rrct/steisure/subjects/data/" + subjectKey,
				method: "POST",
				jsonData: answers,
				success: function (response) {
						console.log("SUCCESS", response);
						Ext.toast({html: 'Svaren registrerade', anchor: 'contentPanel', align: 'b'})
						//Ext.Msg.alert('Svaren registrerade', 'Registrerat');
				},
				failure: function (response) {
						console.log("FAIL", response);
				}
		});		
	},
	
	getData: function (subjectKey) {
		Ext.Ajax.request({
			url: "/stratum/api/rrct/steisure/subjects/data/" + subjectKey,
			method: "GET",
		
			success: function (response) {
					console.table(Ext.decode(response.responseText).data);
			},
			failure: function (response) {
					console.log("FAIL", response);
			}
		});
	}
});

SHPR.forms = [{}, {}, {}]
SHPR.forms[1].questions = [
  {
    id: 1,
    label: "Fråga 1: Är du medveten om din höftled i sängen på natten?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      },
    ],
	},
	{
    id: 2,
    label: "Fråga 2: Är du medveten om din höftled när du sitter på en stol i över en timme?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 3,
    label: "Fråga 3: Är du medveten om din höftled när du går mer än 15 minuter?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 4,
    label: "Fråga 4: Är du medveten om din höftled när du badar/duschar?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 5,
    label: "Fråga 5: Är du medveten om din höftled när du åker bil?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 6,
    label: "Fråga 6: Är du medveten om din höftled när du går upp för en trappa?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 7,
    label: "Fråga 7: Är du medveten om din höftled när du går på ojämn mark?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 8,
    label: "Fråga 8: Är du medveten om din höftled när du reser dig upp från en låg sittande ställning?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 9,
    label: "Fråga 9: Är du medveten om din höftled när du står länge?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 10,
    label: "Fråga 10: Är du medveten om din höftled när du utför hushålls- eller trädgårdsarbete?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 11,
    label: "Fråga 11: Är du medveten om din höftled när du tar en promenad eller vandrar?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
      }
    ],
	},
	{
    id: 12,
    label: "Fråga 12: Är du medveten om din höftled när du utövar din favoritsport?",
    options: [
      {
        text: "Aldrig",
        value: 1,
			},
			{
        text: "Nästan aldrig",
        value: 2,
			},
			{
        text: "Sällan",
        value: 3,
			},
			{
        text: "Ibland",
        value: 4,
			},
			{
        text: "För det mesta",
        value: 5,
			},
			{
        text: "Har ingen favoritsport",
        value: 6,
      }
    ]
  }
];

SHPR.forms[2].questions = [
  {
    id: 1,
    label: "Fråga 1: Hur vill du beskriva smärtan du vanligtvis haft från din höft?",
    options: [
      {
        text: "Inga problem",
        value: 1,
			},
			{
        text: "Mycket lindriga problem",
        value: 2,
			},
			{
        text: "Måttliga problem",
        value: 3,
			},
			{
        text: "Stora svårigheter",
        value: 4,
			},
			{
        text: "Omöjligt att utföra",
        value: 5,
      },
    ],
	},
	{
    id: 2,
    label: "Fråga 2: Har du haft några problem med att tvätta och torka dig själv (hela kroppen) på grund av din höft?",
    options: [
      {
        text: "Inga problem",
        value: 1,
			},
			{
        text: "Mycket lindriga problem",
        value: 2,
			},
			{
        text: "Måttliga problem",
        value: 3,
			},
			{
        text: "Stora svårigheter",
        value: 4,
			},
			{
        text: "Omöjligt att utföra",
        value: 5,
      },
    ],
	},
	{
    id: 3,
    label: "Fråga 3: Har du haft problem med att ta dig i och ur en bil eller haft problem att använda kollektivtrafik (det du brukar använda) pga din höft?",
    options: [
      {
        text: "Inga problem",
        value: 1,
			},
			{
        text: "Mycket lindriga problem",
        value: 2,
			},
			{
        text: "Måttliga problem",
        value: 3,
			},
			{
        text: "Stora svårigheter",
        value: 4,
			},
			{
        text: "Omöjligt att utföra",
        value: 5,
      },
    ],
	},
	{
    id: 4,
    label: "Fråga 4: Har du kunnat ta på dig strumpor, strumpbyxor eller tights?",
    options: [
      {
        text: "Ja, med lätthet",
        value: 1,
			},
			{
        text: "Med viss svårighet",
        value: 2,
			},
			{
        text: "Med måttlig svårighet",
        value: 3,
			},
			{
        text: "Med stor svårighet",
        value: 4,
			},
			{
        text: "Nej, omöjligt",
        value: 5,
      },
    ],
	},
	{
    id: 5,
    label: "Fråga 5: Har du kunnat handla till hushållet på egen hand?",
    options: [
      {
        text: "Ja, med lätthet",
        value: 1,
			},
			{
        text: "Med viss svårighet",
        value: 2,
			},
			{
        text: "Med måttlig svårighet",
        value: 3,
			},
			{
        text: "Med stor svårighet",
        value: 4,
			},
			{
        text: "Nej, omöjligt",
        value: 5,
      },
    ],
	},
	{
    id: 6,
    label: "Fråga 6: Hur länge har du kunnat gå innan smärtan på höften blivit svår? (med eller utan krycka)",
    options: [
      {
        text: "Ingen smärta, mer än 30 min",
        value: 1,
			},
			{
        text: "15-30 min",
        value: 2,
			},
			{
        text: "5-15 min",
        value: 3,
			},
			{
        text: "Endast inomhus",
        value: 4,
			},
			{
        text: "Inte alls, svår smärta vid gång",
        value: 5,
      },
    ],
	},
	{
    id: 7,
    label: "Fråga 7: Har du klarat av att gå uppför en trappa?",
    options: [
      {
        text: "Ja, med lätthet",
        value: 1,
			},
			{
        text: "Med viss svårighet",
        value: 2,
			},
			{
        text: "Med måttlig svårighet",
        value: 3,
			},
			{
        text: "Med stor svårighet",
        value: 4,
			},
			{
        text: "Nej, omöjligt",
        value: 5,
      },
    ],
	},
	{
    id: 8,
    label: "Fråga 8: Hur smärtsamt har det varit för dig att resa sig upp från en stol elfter sittande måltid pga din höft?",
    options: [
      {
        text: "Inte smärtsamt alls",
        value: 1,
			},
			{
        text: "Lite smärtsamt",
        value: 2,
			},
			{
        text: "Måttligt smärtsamt",
        value: 3,
			},
			{
        text: "Mycket smärtsamt",
        value: 4,
			},
			{
        text: "Outhärdligt",
        value: 5,
      },
    ],
	},
	{
    id: 9,
    label: "Fråga 9: Har du haltat när du gått pga av din höft?",
    options: [
      {
        text: "Sällan/aldrig",
        value: 1,
			},
			{
        text: "Ibland eller bara i början",
        value: 2,
			},
			{
        text: "Ofta, inte bara i början",
        value: 3,
			},
			{
        text: "Oftast",
        value: 4,
			},
			{
        text: "Alltid",
        value: 5,
      },
    ],
	},
	{
    id: 10,
    label: 'Fråga 10: Har du haft någon plötslig svår smärta - "snabbt utstrålande", "huggande" eller "krampartad" från den påverkade höften?',
    options: [
      {
        text: "Inte alls",
        value: 1,
			},
			{
        text: "Bara 1-2 dagar",
        value: 2,
			},
			{
        text: "Några dagar",
        value: 3,
			},
			{
        text: "De flesta dagar",
        value: 4,
			},
			{
        text: "Varje dag",
        value: 5,
      },
    ],
	},
	{
    id: 11,
    label: 'Fråga 11: Hur mycket har smärtan från din höft stört dig i ditt vanliga arbete (inkl hushållsarbete)?',
    options: [
      {
        text: "Inte alls",
        value: 1,
			},
			{
        text: "Lite grann",
        value: 2,
			},
			{
        text: "Måttligt",
        value: 3,
			},
			{
        text: "I hög grad",
        value: 4,
			},
			{
        text: "Ständigt",
        value: 5,
      },
    ],
	},
	{
    id: 12,
    label: 'Fråga 12: Har smärtan i din höft varit ett problem för dig nattetid då du legat i sängen?',
    options: [
      {
        text: "Inte alls",
        value: 1,
			},
			{
        text: "Bara 1-2 nätter",
        value: 2,
			},
			{
        text: "Några nätter",
        value: 3,
			},
			{
        text: "De flesta nätter",
        value: 4,
			},
			{
        text: "Varje natt",
        value: 5,
      },
    ],
	}
]

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