(function() {

	var container = Stratum.containers && Stratum.containers['SHPR/CrossWalking'] || 'WidgetContainer',
		me;

	Ext.fly(container).update('');
	Ext.util.CSS.createStyleSheet(
		'.CrossWalkingPanel input { font-size: 28px; line-height: 28px; padding: 10px; text-align: center; } '
	);

	me = new Ext.panel.Panel({
		width: '100%',
		renderTo: container,
		border: false,
		cls: 'CrossWalkingPanel',
		activeItem: 0,
		layout: {
			type: 'hbox',
			align: 'stretch'
		},
		defaults: {
			xtype: 'textfield',
			labelAlign: 'top',
			padding: 20,
			checkChangeEvents: ['change', 'propertychange', 'keyup']
		},
		items: [{
			itemId: 'SE',
			fieldLabel: 'Sweden',
			flex: 8,
			listeners: {
				change: function () {
					var oc = me.getComponent('UK'),
						ov = me.getComponent('SE').getValue();

					oc.suspendEvents(false);
					if (Ext.isEmpty(ov)) {
						oc.emptyText = ' ';
						oc.setValue(null);
					} else {
						ov = ov.replace(',', '.');
						if (!Ext.isNumeric(ov)) {
							oc.emptyText = '?';
							oc.setValue(null);
						} else {
							if (ov < 0.0000) {
								oc.emptyText = 'to low';
								oc.setValue(null);
							} else {
								if (ov > 1.0000) {
									oc.emptyText = 'to high';
									oc.setValue(null);
								} else {
									oc.setValue(Ext.util.Format.round(Math.max(Math.min(-1.6468 + (2.7800*ov), 1.0000) ,-0.5940), 3));
								}
							}
						}
					}
					oc.resumeEvents();
				}
			}
		}, {
			xtype: 'component',
			html: '<span style="font-family: FontAwesome; font-size: 36px; color: #ccc">&#xf0ec;</span>',
			padding: '50px 0 0 0',
			flex: 1
		}, {
			itemId: 'UK',
			fieldLabel: 'UK',
			flex: 8,
			listeners: {
				change: function () {
					var oc = me.getComponent('SE'),
						ov = me.getComponent('UK').getValue();

					oc.suspendEvents(false);
					if (Ext.isEmpty(ov)) {
						oc.emptyText = ' ';
						oc.setValue(null);
					} else {
						ov = ov.replace(',', '.');
						if (!Ext.isNumeric(ov)) {
							oc.emptyText = '?';
							oc.setValue(null);
						} else {
							if (ov < -0.594) {
								oc.emptyText = 'to low';
								oc.setValue(null);
							} else {
								if (ov > 1.000) {
									oc.emptyText = 'to high';
									oc.setValue(null);
								} else {
									oc.setValue(Ext.util.Format.round(Math.max(Math.min(0.5922 + (0.3596*ov), 0.9694) ,0.3402), 3));
								}
							}
						}
					}
					oc.resumeEvents();
				}
			}
		}],
		listeners: {
			afterrender: function () {
				Ext.Function.defer(function() { me.getComponent('SE').focus(); }, 100);
			}
		}
	});

})()
