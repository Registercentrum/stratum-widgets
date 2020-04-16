import * as api from "./api";

export function getComboBox(registerStore, callback) {
    return Ext.create('Ext.form.field.ComboBox', {
        fieldLabel: 'Välj register',
        displayField: 'RegisterName',
        valueField: 'RegisterID',
        store: registerStore,
        width: '100%',
        listeners: {
            select: function(element, selection) {
                api.getForms(selection.data.RegisterID).then(forms => {
                    var promiseList = [];
                    forms.forEach(form => {
                        promiseList.push(api.getVariables(form.FormID));
                    });

                    Ext.Promise.all(promiseList).then(results => {
                        var variableList = [].concat.apply([], results);
                        callback(variableList);
                    });
                });
            }
        },
    });
}

export function getGrid() {
    return Ext.create("Ext.grid.Panel", {
        plugins: "gridfilters",
        hidden: true,
        columns: [
            {
                text: "Variabel",
                flex: 1,
                dataIndex: "ColumnName",
                filter: {
                    type: "string"
                }
            },
            {
                text: "Definition",
                flex: 1,
                dataIndex: "PrefixText",
                filter: {
                    type: "string"
                }
            },
        ],
        listeners: {
            filterchange: function(store) {
                var footerText = getFooterText(store);
                this.down("#toolbarText").setHtml(footerText);
            },
            viewready: function(view) {
                var footerText = getFooterText(view.store);
                this.down("#toolbarText").setHtml(footerText);
            },
            dblclick: {
                element: 'body', //bind to the underlying body property on the panel
                fn: function(sender) { 
                    showVariableEditor(sender.record.data);
                }
            },
        },
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [
                { itemId: "toolbarText", xtype: 'tbtext', text: '' }
            ]
        }]
    });        
}

export function showVariableEditor(variable) {
    api.getVariable(variable.QuestionID).then(question => {
        var editor = new Ext.Window({
            width: 640, 
            modal: true,
            layout: "fit",
            //frame: false,
            //scrollable: "vertical",
            title: 'Variabeleditor',
            items: [{
                xtype: "container",
                layout: "fit",
                items: [{
                    xtype: 'form',
                    layout: 'form',
                    id: 'variableForm',
                    items: [
                        {
                            xtype: "textfield",
                            fieldLabel: 'Variabel',
                            name: 'variable',
                            disabled: true,
                            value: question.ColumnName,
                        }, {
                            xtype: 'textareafield',
                            fieldLabel: 'Beskrivning',
                            name: 'description',
                            grow: true,
                            minHeight: 200,
                            value: question.Description
                        }
                    ],
                    buttons: [
                        {
                            text: 'Spara',
                            listeners: {
                                click: function() {
                                    var form = this.up('form').getForm();
                                    api.updateVariable(question.QuestionID, {
                                        Description: form.getValues().description
                                    });
                                    editor.close();
                                }
                            }
                        }, {
                            text: 'Avbryt',
                            listeners: {
                                click: function() {
                                    var formIsDirty = this.up('form').getForm().isDirty();
                                    if(formIsDirty) {
                                        Ext.MessageBox.show ({
                                            title: 'Spara ändringarna',
                                            msg: 'Du har gjort förändringar i formuläret. Vill du spara dessa?',
                                            buttons: Ext.MessageBox.YESNOCANCEL,
                                            icon: Ext.MessageBox.QUESTION,
                                            fn: function(answer) {
                                                switch (answer) {
                                                    case 'yes':
                                                        editor.close();
                                                        break;
                                                    case 'no':
                                                        editor.close();
                                                        break;
                                                    case 'cancel':
                                                        break;
                                                }
                                            }
                                        });        
                                    
                                    }
                                    else {
                                        editor.close();
                                    }
                                }
                            }
                        }
                    ]
                }]
            }],
            listeners: {
                beforeclose: function() {
                    return true;
                }
            }
        });
        editor.show();
    });
}

function getFooterText(store) {
    return "Antal: " + store.data.length;
}
