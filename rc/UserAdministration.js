/*
 * UserAdministration Module (IIFE Encapsulation by closure)
 */
var UserAdministrationModule = (function() {
	var WIDGET_NAME = 'UserAdministration';
	var ADMIN_ROLE_ID = 903;
	var VERSION = '3.3.3';
	var ME = null;
	var MSG = '';
	/*
	var MSG = '<b>2017-10-12:</b><br>'
		+ 'Förutom diverse buggfixar finns nu möjlighet att låsa specifika roller<br>'
		+ 'mot vissa specialanvändare. Dessutom kan kontext ID visas vid behov.<br>'
		+ 'Länken till manualen återfinns längst ner.';
	*/
											
	// Current state
	var _current = {
		isLoggedIn: false,
		isAdmin: false,
		isDeveloper: false,
		registerID: 0,
		userID: 0,
		userFullName: null,
		selectedUnitID: null,
		selectedUnitCode: null,
		selectedUnitName: '',
		selectedUserID: null,
		selectedUsername: null,
		selectedUserHasSiths: null,
		selectedContextID: null,
		selectedContextIsActive: false,
		panels: {
			overview: null,		// Main panel and container
			unitChoice: null,	// Combo with all units
			allUnits: null,		// Grid with all units
			searchUser: null,	// Panel with search field and button
			unitDetails: null,	// Panel with unit details
			usersPanel: null,	// Panel with grid of selected unit's users/contexts
			searchResult: null,	// Panel with grid of searched users
			userDetails: null	// Panel with user details and contexts grid
		},
		messageOutputs: []		// Array of all message output panels
	};

	var _config = {};
	// Default configuration will be overridden by the register specific configuration
	var _defaultConfig = {
		container: 			Stratum.containers && Stratum.containers['RC/' + WIDGET_NAME] || WIDGET_NAME,
		registerID: 		100,
		registerName: 		'Registercentrum',
		registerShortName:	'RC',
		filterHideRegisters:[100],
		doAutomaticCollapse:true,
		// Units
		allowNewUnit: 		true,
		allowEditUnit: 		true,
		allowEditUnitCode: 	false, // If true, can cause problem in statistics scripts
		minimumUnitCode:	1,
		allowEditUnitName: 	true,
		displayUnitHsaID:	true,
		allowBlankUnitHsaID:true,
		displayParID: 		true,
		allowBlankParID: 	true,
		filterHideUnits: 	[],
		unitBindings: 		[3003, 3005], //3003.Landsting, 3005.Vårdnivå, 3006.Sjukhustyp
		mandatoryBindings: 	[true, false],
		// Roles
		defaultRoleID:		901,
		roles: [
			{ RoleID: 101, RoleName: 'Dataleverantör',		ShortName: 'Datalev.' 	},
			{ RoleID: 201, RoleName: 'API-klient',			ShortName: 'API-klient'	},
			{ RoleID: 301, RoleName: 'Integratör',			ShortName: 'Integratör'	},
			{ RoleID: 701, RoleName: 'Patient',				ShortName: 'Patient'	},
			{ RoleID: 901, RoleName: 'Registrerare',		ShortName: 'Reg.'		},
			{ RoleID: 902, RoleName: 'Plusregistrerare',	ShortName: 'Plusreg.'	},
			{ RoleID: 903, RoleName: 'Koordinator',			ShortName: 'Koord.'		},
			{ RoleID: 906, RoleName: 'Systemutvecklare',	ShortName: 'Syst.utv.'	},
			{ RoleID: 907, RoleName: 'Observatör',			ShortName: 'Observatör'	}
		],
		filterDisplayRoles: [101, 901, 902, 903, 907],
		filterNewRoles: 	[901, 902],
		filterRolesError: 	'För att välja andra roller, kontakta supporten!',
		displayDevelopers: 	false,
		filterDevelopers: 	[1, 2, 3, 4, 5, 6, 7, 8, 9, 103, 97172, 90912], // Utvecklare+Krister
		displayOtherUsers: 	true,
		filterOtherUsers: 	[90000, 90993, 94163], //info@rc, ImporterSFR@rc, InvitationGenerator@rc
		// Users
		displayExtendedUserDetails: false,
		allowSearchUsers: 	true,
		allowNewUser: 		true,
		allowEditUser: 		true,
		allowEditUsername: 	true,
		alternativeUsername:false,
		alternativeMatch:	null,
		alternativeError: 	'',
		displayUserHsaID: 	true,
		allowEditUserHsaID:	true,
		allowBlankEmail: 	false,
		lockedRoleUsers:	[90993, 94163], // ImporterSFR@rc, InvitationGenerator@rc
		lockedRoles:		[101, 901], // Dataleverantör, Registrerare
		// Login
		allowChangeOfLogin: true,
		allowSithsRelease:	true,
		allowBlankNameSiths:true,
		allowBlankNameBankID:false,
		defaultPasshash:	'zdn+TQhqObQUdp9hZv/qm9CQLak=',
		// Contexts
		allowNewContext:	true,
		allowEditContext: 	true,
		displayAllContexts:	true, // Used?
		displayContextID:	false,
		// Mail
		// Tags used in mail: {nl}, {toName}, {fromName}, {username}, {email}
		allowCreateEmail: 	true,
		mailSithsSubject: 'Välkommen!',
		mailSithsBody:  'Hej {toName}!{nl}'
					+ '{nl}'
					+ 'Du behöver knyta ditt SITHS-kort till din användare:{nl}'
					+ 'Användarnamn: {username}{nl}'
					+ 'Lösenord: sa52re{nl}'
					+ '{nl}'
					+ 'Gå till registrets webbsida, ange ditt SITHS-korts lösenord,{nl}'
					+ 'sedan klickar du på "Logga in"-knappen för att knyta kortet.{nl}'
					+ '{nl}'
					+ 'Med vänlig hälsning{nl}'
					+ '{fromName}',
		mailForBankID: 		true,
		mailBankIDSubject: 	'Välkommen',
		mailBankIDBody: 	'Hej {toName}!{nl}'
					+ '{nl}'
					+ 'Du har nu fått ett konto för registret. Gå till registrets hemsida,{nl}'
					+ 'och logga in genom att klicka på "Logga in"-knappen.{nl}'
					+ '{nl}'
					+ 'Med vänlig hälsning{nl}'
					+ '{fromName}'
		
		// TODO: 'UserBindings' för extra attribut, fråga och svarsalternativ som json, svar i mUsers?
	}; //_defaultConfig

	// Return the short name of a given Role (by ID or Name)
	var getRoleShortName = function(aRoleID) {
		for (var key in _defaultConfig.roles) {
			var role = _defaultConfig.roles[key];
			if (role.RoleName == aRoleID || role.RoleID == aRoleID)
				return role.ShortName;
		}
		
		console.error('Okänd roll, rollID="' + aRoleID + '"');
		return "Okänd roll!";
	};
	
	// Return the short name of a given Role (by ID or Name)
	var getRoleName = function(aRoleID) {
		for (var key in _defaultConfig.roles) {
			var role = _defaultConfig.roles[key];
			if (role.RoleName == aRoleID || role.RoleID == aRoleID)
				return role.RoleName;
		}
		
		console.error('Okänd roll, rollID="' + aRoleID + '"');
		return "Okänd roll!";
	};

	/************************** Public methods ********************************/

	/*
	 * Initialize UserAdministration with a register specific Config object.
	 * This object is defined in a separate page for each register in Stratum
	 * OR inside Advanced settings for the Widget within Keystone.
	 */
	var initialize = function(customConfig) {
		if (!customConfig || !customConfig.registerID) {
			var message = 'Den registerspecifika konfigurationen för denna widget saknas!';
			if (customConfig && !customConfig.registerID)
				message = 'Den registerspecifika konfigurationen för denna widget innehåller fel!';
			Ext.create({
				xtype: 'panel',
				title: 'Felmeddelande',
				renderTo: WIDGET_NAME,
				bodyPadding: 10,
				width: '65%',
				frame: true,
				layout: 'auto',
				html: message
			});
			return;
		}

		// Merge the register's config with the default config into _config
		Ext.apply(_config, customConfig, _defaultConfig);
		
		if (Profile && Profile.Context) {
			var c = Profile.Context;
			_current.isLoggedIn = true;
			_current.isAdmin = (c.Role.RoleID === ADMIN_ROLE_ID);
			_current.isDeveloper = (Ext.Array.contains(_config.filterDevelopers, c.User.UserID));
			_current.registerID = c.Unit.Register.RegisterID;
			_current.userID = c.User.UserID;
			_current.userFullName = Ext.String.trim(c.User.FirstName + ' ' + c.User.LastName);
		}
		
	}; //initialize()

	/*
	 * Start the User administration widget application.
	 */
	var start = function() {
		if (_isAuthorized()) {
			_current.panels.overview = displayOverviewPanel();
		}
	};

	/************************** Private methods *****************************/

	// Check if the user is authorized to run the User administration.
	var _isAuthorized = function() {
		if (!_current.isLoggedIn) {
			Ext.create({
				xtype: 'panel',
				title: '<h3>Behörighet saknas</h3>',
				renderTo: _config.container,
				bodyPadding: 10,
				width: '70%',
				frame: true,
				layout: 'auto',
				html: '<p>Du måste vara inloggad för att se denna sida.</p>'
			});
			return false;
		}
		
		// Check that the user is logged in as Administrator
		if (!_current.isAdmin) {
			Ext.create({
				xtype: 'panel',
				title: '<h3>Användarhanteraren för ' + _config.registerName + '</h3>',
				renderTo: _config.container,
				bodyPadding: 10,
				width: '70%',
				frame: true,
				layout: 'auto',
				html: '<p>Du måste vara inloggad som koordinator för att använda detta verktyg.</p>'
			});
			return false;
		}

		// Check that the user is logged in to the current Register
		if (_current.registerID !== _config.registerID) {
			Ext.create({
				xtype: 'panel',
				title: '<h3>Användarhanteraren för ' + _config.registerName + '</h3>',
				renderTo: _config.container,
				bodyPadding: 10,
				width: '70%',
				frame: true,
				layout: 'auto',
				html: '<h3>Inloggad på fel register</h3>'
					+ '<p>Du måste vara inloggad som koordinator på ' + _config.registerName 
					+ ' för att använda detta verktyg.</p>'
			});
			return false;
		}
		
		return true;
	}; //_isAuthorized()

	// A specific unit is selected, update the panels
	var _selectUnit = function(unitID, unitCode, unitName, source) {
		// Set the selected UnitID (or null if new or none selected)
		if (source != 'update') {
			_current.selectedUnitID = unitID;
			_current.selectedUnitCode = unitCode;
			_current.selectedUnitName = (unitName == null ? '' : unitName);
		}

		switch (source) {
			case 'combo': // Unit selected with the combo
				_current.panels.allUnits.selectUnit(unitID);
				_current.panels.usersPanel.selectUnit(unitID);
				_current.panels.searchUser.display(false);
				_current.panels.searchResult.display(false);
				_current.panels.usersPanel.display(true);
				_current.panels.usersPanel.expand();
				_current.panels.unitDetails.selectUnit(unitID);
				_current.panels.userDetails.selectUser(null);
				break;
			case 'grid': // Unit selected with the grid
				_current.panels.unitChoice.selectUnit(unitID);
				_current.panels.usersPanel.selectUnit(unitID);
				_current.panels.searchUser.display(false);
				_current.panels.searchResult.display(false);
				_current.panels.usersPanel.display(true);
				_current.panels.usersPanel.expand();
				_current.panels.unitDetails.selectUnit(unitID);
				_current.panels.userDetails.selectUser(null);
				break;
			case 'newUnit': // Clear any selected unit and user details
				_current.panels.unitChoice.selectUnit(null);
				_current.panels.allUnits.selectUnit(null);
				_current.panels.searchUser.display(false);
				_current.panels.searchResult.display(false);
				_current.panels.usersPanel.display(false);
				_current.panels.userDetails.display(false);
				_current.panels.overview.down('#ViewUnitDetails').enable();
				_current.panels.unitDetails.newUnit();
				break;
			case 'search': // Search for user
				_current.panels.unitChoice.selectUnit(null);
				_current.panels.allUnits.selectUnit(null);
				_current.panels.allUnits.hide();
				_current.panels.unitDetails.display(false);
				_current.panels.usersPanel.display(false);
				_current.panels.userDetails.selectUser(null);
				break;
			case 'newCreated': // Created a new unit, select it but hide details
				_current.panels.unitChoice.selectUnit(unitID);
				_current.panels.allUnits.selectUnit(unitID);
				_current.panels.allUnits.hide();
				_current.panels.overview.down('#DisplayAllUnits').updateDisplay(false);
				_current.panels.unitDetails.display(false);
				_current.panels.overview.down('#ViewUnitDetails').updateDisplay(false);
				_selectUser(null, null, 'newUser');
				break;
			case 'update': // Update the user information in the grid
				_current.panels.usersPanel.selectUnit(unitID);
				break;
			default:
				console.log('_selectUnit: Unknown source! source=' + source + ', unitID=' + unitID);
				return;
		}
	}; //_selectUnit()

	// A specific user is selected, update the panels
	var _selectUser = function(userID, username, source) {
		_current.selectedUserID = userID;
		_current.selectedUsername = username;

		switch (source) {
			case 'byCheck': // By checking the username
				_current.panels.userDetails.selectUser(userID, true);
				_current.panels.userDetails.display(true);
				break;
			case 'bySearch': // By selecting a user after a search
				_current.panels.userDetails.selectUser(userID);
				_current.panels.userDetails.display(true);
				break;
			case 'byUnit': // By selecting a user in the unit's context list
				_current.panels.userDetails.selectUser(userID);
				_current.panels.userDetails.display(true);
				break;
			case 'newUser': // By new user button
				_current.panels.userDetails.newUser();
				break;
			default:
				console.log('_selectUser: Unknown source! source=' + source + ', userID=' + userID);
				return;
		}
	}; //_selectUser()
	
	/***** Message functions *****/
	
	// Display a message in every registered message container
	var timeoutID = 0;
	var displayMessage = function(text, messageType, deferSeconds) {
		var color;
		switch (messageType) {
			case 'ok':
				color = '00aa00';
				break;
			case 'error':
				color = 'aa0000';
				break;
			case 'info':
			default:
				color = '000000';
				break;
		}
		var message = '<span style="color:#' + color + '">' + text + '</span>';
		Ext.each(_current.messageOutputs, function(output, i) {
			output.update(message);
		});
		if (deferSeconds) {
			// Clear the message after a set time, remove any waiting defers
			if (timeoutID != null)
				clearTimeout(timeoutID);
			timeoutID = Ext.defer(_clearMessage, deferSeconds * 1000);
		}
	}; //displayMessage()
	
	// Display a message with black text, indefinitely
	var _displayInfoMessage = function(text) {
		displayMessage(text, 'info', null);
	};
	// Display a green ok message for three seconds
	var _displayOkMessage = function(text) {
		displayMessage(text, 'ok', 3);
	};
	// Display a red error message for 6 seconds
	var _displayErrorMessage = function(text) {
		displayMessage(text, 'error', 6);
	};
	// Clear all messages
	var _clearMessage = function() {
		timeoutID = null;
		displayMessage('', null, null);
	};
	// Display a message box
	var _displayMessageBox = function(header, text) {
		Ext.Msg.alert(header, text);
	};

/*------------------------------- Stores ------------------------------------*/

	// TODO: Check each model for sorting order:
	// http://docs.sencha.com/extjs/5.1.3/api/Ext.data.SortTypes.html

	// ----- Return a store of all registers -----
	var registersStore = null;
	var getRegistersStore = function() {
		if (registersStore != null) {
			return registersStore;
		}
		
		var store = Ext.create('Ext.data.Store', {
			model: Ext.define(null, {
				extend: 'Stratum.Register'
			}),
			autoLoad: true,
			proxy: {
				type: 'rest',
				url: '/stratum/api/metadata/registers',
				reader: 'compactjson',
				writer: 'compactjson'
			},
			sorters: [{ 
				property: 'RegisterID',
				direction: 'ASC' 
			}],
			filters: [
				function(item) {
					return !Ext.Array.contains(_config.filterHideRegisters, item.data.RegisterID);
				}
			]
		});
		
		registersStore = store;
		return store;
	}; //getRegistersStore()

	// Convert the register store to an array of RegisterID, RegisterName and ShortName
	// also contains an empty array for storing UnitIDs for all units
	var getRegistersStoreArray = function(store) {
		var result = [];
		
		for (var key in store.data.items) {
			var item = store.data.items[key].data;
			result[item.RegisterID] = {
				RegisterID:		item.RegisterID,
				RegisterName: 	item.RegisterName,
				ShortName:		item.ShortName,
				Units:			[]
			};
		}
		
		return result;
	}; //getRegistersStoreArray()
	
	// ----- Return a store of all units (fetched once) -----
	var unitsStore = null;
	var getUnitsStore = function(doReload) {
		if (doReload == false && unitsStore != null) {
			return unitsStore;
		}
		
		var store = Ext.create('Ext.data.Store', {
			model: Ext.define(null, {
				extend: 'Stratum.Unit',
				fields: [{
					name: 'UnitInformation',
					persist: false,
					convert: function(v, rec) {
						var unitCode = rec.get('UnitCode');
						if (unitCode == 0)
							return rec.get('UnitName');
						else
							return rec.get('UnitName') + ' (' + rec.get('UnitCode') + ')';
					}
				}]
			}),
			autoLoad: true,
			loading: true,
			proxy: {
				type: 'rest',
				url: '/stratum/api/metadata/units/register/' + _config.registerID,
				reader: 'compactjson',
				writer: 'compactjson'
			},
			sorters: [{ 
				property: 'UnitName',
				direction: 'ASC' 
			}],
			filters: [
				function(item) {
					return _current.isDeveloper || !Ext.Array.contains(_config.filterHideUnits, item.data.UnitCode);
				}
			],
			listeners: {
				load: function(db, rec, success, op, e) {
					_current.panels.allUnits.updateCount();
				}
			}
		});
		
		unitsStore = store;
		return store;
	}; //getUnitsStore()
	
	// ----- Return a store with details of one unit -----
	var getUnitDetailsStore = function(unitID, callback) {
		var store = Ext.create('Ext.data.Store', {
			model: 'Stratum.Unit',
			autoLoad: true,
			proxy: {
				type: 'rest',
				url: '/stratum/api/metadata/units/' + unitID,
				reader: 'compactjson',
				writer: 'compactjson'
			},
			listeners: {
				load: function(store) {
					callback(store);
				}
			}
		});
	}; //getUnitDetailsStore()

	// ----- Return a store for the specified Unit binding domainID -----
	var getBindingsStore = function(domainID, callback) {
		var store = Ext.create('Ext.data.Store', {
			model: Ext.define(null, {
				extend: 'Ext.data.Model',
				fields: [
					{name: 'DomainValueID',	type: 'int',	allowNull: true},
					{name: 'ValueCode',		type: 'string'},
					{name: 'ValueName',		type: 'string'}
				]
			}),
			autoLoad: true,
			proxy: {
				type: 'rest',
				url: '/stratum/api/metadata/domainvalues/domain/' + domainID,
				reader: 'compactjson',
				writer: 'compactjson'
			},
			listeners: {
				load: function(store) {
					store.sort('ValueName', 'ASC');
					callback(store);
				}
			}
		});
	}; //getBindingsStore()

	// ----- Return a store with details of one user -----
	var getUserDetailsStore = function(userID, callback, doKeepMsg) {
		var store = Ext.create('Ext.data.Store', {
			model: 'Stratum.User',
			autoLoad: true,
			proxy: {
				type: 'rest',
				url: '/stratum/api/metadata/users/' + userID,
				reader: 'compactjson',
				writer: 'compactjson'
			},
			listeners: {
				load: function(store) {
					callback(store, doKeepMsg);
				}
			}
		});
	}; //getUserDetailsStore()
	
	// ----- Return a store of users matching the search query -----
	var getSearchStore = function() {
		var store = Ext.create('Ext.data.Store', {
			model: Ext.define(null, {
				extend: 'Stratum.User'
			}),
			autoLoad: false,
			sorters: { property: 'Username', direction: 'ASC' } 
		});

		return store;
	}; //getSearchStore()

	// ----- Return a store with all contexts for a specific unit -----
	// The specific unit is set and loaded later
	var getUnitContextsStore = function() {
		var store = Ext.create('Ext.data.Store', {
			model: Ext.define(null, {
				extend: 'Stratum.Context',
				fields: [
					{ name: 'IsActive',			mapping: 'IsActive',		type: 'bool' },
					{ name: 'UserUsername',		mapping: 'User.Username',	sortType: 'asUCString' },
					{ name: 'UserFirstName', 	mapping: 'User.FirstName',	sortType: 'asUCString' },
					{ name: 'UserLastName', 	mapping: 'User.LastName', 	sortType: 'asUCString' },
					{ name: 'RoleRoleID', 		mapping: 'Role.RoleID'  	},
					{ name: 'RoleRoleName', 	mapping: 'Role.RoleName'  	},
					{ name: 'UserHSAID', 		mapping: 'User.HSAID', 	  	type: 'string' }
				]
			}),
			autoLoad: false,
			sorters: { property: 'UserUsername', direction: 'ASC' },
			filters: [ 
				function(item) {
					var filterUser = Ext.Array.contains(_config.filterDisplayRoles, item.data.Role.RoleID);
					if (!_config.displayDevelopers)
						filterUser &= !Ext.Array.contains(_config.filterDevelopers, item.data.User.UserID);
					if (!_config.displayOtherUsers)
						filterUser &= !Ext.Array.contains(_config.filterOtherUsers, item.data.User.UserID);
					return filterUser;
				}
			]
		});

		return store;
	}; //getUnitContextsStore()

	// ----- Return a store with all the contexts for a specific user -----
	var getUserContextsStore = function() {
		var store = Ext.create('Ext.data.Store', {
			groupField: 'RegisterShortName',
			model: Ext.define(null, {
				extend: 'Stratum.Context',
				fields: [
					{ name: 'ContextID',		mapping: 'ContextID',		},
					{ name: 'IsActive',			mapping: 'IsActive',		},

					{ name: 'RoleRoleID', 		mapping: 'Role.RoleID'  	},
					{ name: 'RoleRoleName', 	mapping: 'Role.RoleName'  	},

					{ name: 'UnitUnitID', 		mapping: 'Unit.UnitID', 	},
					{ name: 'UnitUnitCode', 	mapping: 'Unit.UnitCode', 	type: 'int' },
					{ name: 'UnitUnitName', 	mapping: 'Unit.UnitName', 	sortType: 'asUCString' }
				]
			}),
			autoLoad: false,
			sorters: { property: 'UnitUnitID', direction: 'ASC' },
			filters: [ 
				function(item) {
					var filterRole = Ext.Array.contains(_config.filterDisplayRoles, item.data.Role.RoleID);
					return filterRole;
				}
			]
		});
		
		return store;
	}; //getUserContextsStore()

	// Returns an array of (filtered) units
	var getUnitsArray = function(doReload, arrayProperty, callback) {
		var unitsStore = getUnitsStore(doReload);

		unitsStore.load(function(records, op, success) {
			if (success) {
				var result = [];
				for (var key in records) {
					var item = records[key].data;
					if (_current.isDeveloper || !Ext.Array.contains(_config.filterHideUnits, item.UnitCode))
						result.push(item[arrayProperty]);
				}
				unitsStore = result;
				callback(result);
			}
		});
		
	}; //getUnitsArray()
	
/*------------------------------- Overview ----------------------------------*/

	// Remove Keystone borders around panels
	Ext.util.CSS.createStyleSheet(
		'.UserAdministration .x-panel-body-default { border-width: 0; }'
	);

	// Make sure that every readonly textfield (and combo) gets a grey background
	// in the Keystone environment, similar to Stratum
	Ext.util.CSS.createStyleSheet(
		'.UserAdministration input[readonly] { color:#333; background-color:#eee; }'
	);

	// TODO: Change to /stratum/Images/ when bug fixed?
	// CSS class 'PrefixMandatory' to display a red dot in front of mandatory fields
	Ext.util.CSS.createStyleSheet(
		'.UserAdministration .PrefixMandatory .x-form-item-label-inner {padding-left:10px; background:url(https://stratum.registercentrum.se/Images/IconMandatory.png) 0px 5px no-repeat;}'
	);

	// Display the Overview panel
	var displayOverviewPanel = function() {
		if (!Ext.isEmpty(MSG)) {
			var messageToUser = Ext.create({
				xtype: 'container',
				renderTo: _config.container,
				padding: 5,
				margin: '5 0 20 0',
				width: '80%',
				style: {
					backgroundColor: '#efe',
					border: '1px solid #ada'
				},
				items: [{
					xtype: 'label',
					style: {
						fontWeight: 400
					},
					html: '<span style="color:#00aa00">' + MSG + '</span>'
				}]
			});
		}
			
		var panel = Ext.create({
			xtype: 'panel',
			title: '<h3>Användarhanteraren för ' + _config.registerName + '</h3>',
			renderTo: _config.container,
			cls: 'UserAdministration',
			margin: '0 10 0 0',
			bodyPadding: 10,
			frame: true,
			layout: 'auto',
			items: [
				_current.panels.searchUser = getSearchUserPanel(),
				{
					xtype: 'container',
					margin: '10 0 0 0',
					layout: {
						type: 'hbox',
						align: 'end'
					},
					items: [
						_current.panels.unitChoice = getUnitChoice('UnitChoice', true, 'Enhet', false),
						getViewUnitButton(),
						getViewAllUnitsButton()
					],
				},
				_current.panels.allUnits = getAllUnitsGrid(),
				getNewUnitButton(),
				_current.panels.unitDetails = getUnitDetailsPanel(),
				_current.panels.usersPanel = getUsersGridPanel(),
				_current.panels.searchResult = getSearchResultPanel(),
				_current.panels.userDetails = getUserDetailsPanel()
			],
			fbar: [{
				xtype: 'button',
				hidden: !_current.isDeveloper,
				isHelpNote: true,
				width: 16,
				height: 16,
				border: false,
				frame: false,
				helpNote: '<b>Systemutvecklare</b><br>'
						+ 'Klicka för att se användarhanteraren som vanlig<br>'
						+ 'koordinator. (Återställ genom att ladda om med F5).',
				glyph: 'xf235@FontAwesome', //fa-user-times: user with X
				ui: 'toolbar',
				cls: 'EventFormHelpNoteButton',
				style: {
					color: '#88f'
				},
				listeners: {
					render: Ext.bind(createHoveringHelpNote, this, [], true),
					click: function() {
						_current.isDeveloper = false;
						this.hide();
					}
				} 
			}, {
				xtype: 'label',
				itemId: 'ActionMessage',
				html: ''
			},
				'->',
			{
				xtype: 'label',
				html: '<span style="color:#777; font:italic 10px arial, serif">v:' + VERSION + '</span>',
				padding: '0 5 0 10'
			}]
		}); // panel
		
		var linkToManual = Ext.create({
			xtype: 'label',
			renderTo: _config.container,
			style: {
				fontWeight: 400
			},
			html: 'Ladda ner: <a href="https://stratum.registercentrum.se/Handlers/ResourceManager.ashx?ID=32515">manual för användarhanteraren</a>.'
		});

		// Add the message field to the array of all notice fields
		_current.messageOutputs.push(panel.down('#ActionMessage'));
		
		return panel;
	}; //displayOverviewPanel()

/*------------------------------- Units -------------------------------------*/

	// Return a dropdown of all units
	var getUnitChoice = function(itemId, doAddListener, label, isMandatory) {
		var dropdown = Ext.create({
			xtype: 'combo',
			itemId: itemId || 'UnitChoice',
			fieldLabel: label || 'Enhet',
			labelAlign: 'top',
			width: 400,
			margin: '0 0 0 0',
			matchFieldWidth: true,
			editable: true,
			allowBlank: !isMandatory,
			labelClsExtra: isMandatory ? 'PrefixMandatory' : '',
			forceSelection: isMandatory,
			typeAhead: true,
			queryMode: 'local',
			minChars: 1,
			checkChangeEvents: ['change', 'keyup'],
			store: getUnitsStore(false), // TODO: true
			displayField: 'UnitInformation',
			valueField: 'UnitID',
			emptyText: 'Välj enhet...',
			listeners: {
				beforequery: function(record) {
					if (record.query == null) {
						return;
					}
					
					if (isNaN(record.query)) {
						// Textsök, måste va minst tre tecken och gäller även del av enhetsnamnet
						if (record.query.length < 3) {
							record.cancel = true;
						} else {
							// Ignore case
							record.query = new RegExp(record.query, 'i');
							record.forceAll = true;
						}
					} else {
						// Numerisk sök = unitcode (innanför parantes efter namnet)
						record.query = new RegExp('(' + record.query + ')');
						record.forceAll = true;
					}
				}
			}
		}); //dropdown

		// Triggers when selecting a unit through the dropdown
		var onSelect = function(combo, record) {
			var value = null;
			var code = null;
			var name = null;
			if (record != null && record.data != null) {
				_current.panels.overview.down('#ViewUnitDetails').enable();
				value = record.data.UnitID;
				code = record.data.UnitCode;
				name = record.data.UnitName;
				value = value == '' || value == 0 ? null : value;
				code = value == null ? null : code;
				name = value == null ? null : name;
			}
			_selectUnit(value, code, name, 'combo');
		};
		
		dropdown.onSelect = onSelect;

		if (doAddListener)
			dropdown.on('select', onSelect, this);
				
		// Select a unit from external source
		dropdown.selectUnit = function(unitID) {
			dropdown.clearValue();
			if (unitID == null) {
				_current.panels.overview.down('#ViewUnitDetails').disable();
			} else {
				_current.panels.overview.down('#ViewUnitDetails').enable();
				dropdown.setValue(unitID);
				dropdown.setRawValue(_current.selectedUnitName + ' (' + _current.selectedUnitCode + ')');
			}
		}; //selectUnit()
	
		// Update the raw value of the combo to display info about the selected unit
		// TODO: Call this to force reload in grid select too?
		dropdown.updateDisplay = function() {
			var anItemID = dropdown.itemId;

			// Force the store to reload
			var store = _current.panels.unitChoice.getStore();
			var temp = (new Date()).getTime();
			store.reload({
				params: {
					temp: temp
				}
			});
			// Update the displayed value
			var unit = dropdown.getSelection() ? dropdown.getSelection().data : null;
			var selectedUnitID = null;
			if (unit) {
				selectedUnitID = unit.UnitID;
			}
			dropdown.select(selectedUnitID);
		}; //updateDisplay()
	
		return dropdown;
	}; //getUnitChoice()

	// Return a grid showing all units for the register
	// Show either this or the above combo
	var getAllUnitsGrid = function() {
		var unitText1 = '<span style="color:#666666">Alla ';
		var unitText2 = 'enheter:</span>';
		
		var allUnitsPanel = Ext.create({
			xtype: 'panel',
			title: unitText1 + unitText2,
			frame: true,
			collapsible: true,
			titleCollapse: true,
			hidden: true,
			margin: '10 0 0 0',
			width: 670,
			layout: 'auto',
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					allUnitsPanel.display(false);
				}
			}],
			items:[
			{
				xtype: 'grid',
				itemId: 'ExistingUnitsGrid',
				frame: true,
				width: '100%',
				height: 180,
				margin: '0 0 0 0',
				viewConfig: {
					stripeRows: true
				},
				selModel: {
					mode: 'single',
					allowDeselect: true // Seam only to enable a second click on the same item to deselect?
				},
				store: getUnitsStore(false), // TODO: true
				columns: {
					defaults: {
						menuDisabled: true
					},
					items: [
						{ text:'Enhetens namn',	dataIndex:'UnitName', flex: 1 },
						{ text:'Enhetskod', 	dataIndex:'UnitCode', width: 100 }
					]
				},
				listeners: {
					itemclick: function(model, records) {
						var value = null;
						var code = null;
						var name = null;
						if (records != null && records.data != null) {
							_current.panels.overview.down('#ViewUnitDetails').enable();
							value = records.data.UnitID;
							code = records.data.UnitCode;
							name = records.data.UnitName;
							value = value == '' || value == 0 ? null : value;
							code = value == null ? null : code;
							name = value == null ? null : name;
						}
						_selectUnit(value, code, name, 'grid');
					}
				}
			}]
		}); //allUnitsPanel
		
		// Select a unit in the grid
		allUnitsPanel.selectUnit = function(unitID) {
			var grid = allUnitsPanel.down('#ExistingUnitsGrid');

			if (unitID == null) {
				// TODO: Doesn't clear the grid - why?
				// Seams like you can click a second time on the same item to deselect?
				_current.panels.overview.down('#ViewUnitDetails').disable();
				grid.getSelectionModel().clearSelections();
			} else {
				var item = grid.store.getById(unitID);
				
				if (item == null) {
					return;
				}
				
				_current.panels.overview.down('#ViewUnitDetails').enable();
				grid.getSelectionModel().select(item);
				try {
					if (!allUnitsPanel.isHidden() && !grid.isHidden())
						grid.ensureVisible(item);
				} 
				catch(err) {
					console.log('allUnitsPanel.selectUnit() Could not ensure visibility for ' + unitID);
					if (err != null)
						console.error('... Error: ' + err.message);
				}
			}
		}; //selectUnit()
		
		allUnitsPanel.updateCount = function() {
			var store = allUnitsPanel.down('#ExistingUnitsGrid').getStore();
			if (store != null) {
				var count = store.getCount() + ' ';
				if (_current.isDeveloper)
					count += ' <span style="color:blue">(' + store.getTotalCount() + ' totalt)</span> ';
				allUnitsPanel.setTitle(unitText1 + count + unitText2);
			}
		};

		allUnitsPanel.updateGrid = function() {
			var grid = allUnitsPanel.down('#ExistingUnitsGrid');
			var temp = (new Date()).getTime();
			grid.getStore().reload({
				params: {
					temp: temp
				}
			});
		};
		
		allUnitsPanel.display = function(doShow) {
			if (doShow) {
				allUnitsPanel.show();
			} else {
				allUnitsPanel.hide();
				_current.panels.overview.down('#DisplayAllUnits').updateDisplay(false);
			}
		};
		
		return allUnitsPanel;
	}; //getAllUnitsGrid()

	// Return a button to view a list of all units
	var getViewAllUnitsButton = function() {
		var pressedText = 'Dölj alla';
		var unpressedText = 'Visa alla';

		var button = Ext.create({
			xtype: 'button',
			itemId: 'DisplayAllUnits',
			text: 'Visa alla',
			minWidth: 80,
			enableToggle: true,
			margin: '0 0 0 10',
			handler: function() {
				this.updateDisplay();
				if (this.pressed) {
					_current.panels.allUnits.show();
					_current.panels.allUnits.expand();
					if (_current.selectedUnitID != null) {
						var grid = _current.panels.allUnits.down('#ExistingUnitsGrid');
						var item = grid.store.getById(_current.selectedUnitID);
						try {
							grid.ensureVisible(item);
						}
						catch (err) {
							console.log('getViewAllUnitsButton. Could not ensure visibility for unitID:' + _current.selectedUnitID);
							if (err != null)
								console.error('... Error:' + err.message);
						}
					}
				} else {
					_current.panels.allUnits.hide();
				}
			}
		});
		
		button.updateDisplay = function(state) {
			if (typeof state == 'boolean') {
				// Force button toggle if state is true, supress any events
				button.toggle(state, true);
			}

			button.setText(button.pressed ? pressedText : unpressedText);
		};

		return button;
	}; //getViewAllUnitsButton()

	// Return a button to view the unit details
	var getViewUnitButton = function() {
		var pressedText = 'Dölj enhet';
		var unpressedText = 'Visa enhet';
		
		var button = Ext.create({
			xtype: 'button',
			itemId: 'ViewUnitDetails',
			text: 'Visa enhet',
			minWidth: 80,
			disabled: true,
			enableToggle: true,
			margin: '0 0 0 10',
			handler: function() {
				this.updateDisplay();
				_current.panels.unitDetails.display(button.pressed);
				if (button.pressed) {
					_current.panels.unitDetails.display(true);
					_current.panels.unitDetails.expand();
				} else {
					_current.panels.unitDetails.display(false);
				}
			}
		});
		
		// Update the button's text depending on toggled state
		// If state is set, then first force the button's state to pressed/unpressed
		button.updateDisplay = function(state) {
			if (typeof state != 'undefined') {
				// Press button if true, but supress any event
				button.toggle(state, true);
			}

			button.setText(button.pressed ? pressedText : unpressedText);
		};
		
		return button;
	}; //getViewUnitButton()
	
	// Return a button to create new units
	var getNewUnitButton = function() {
		var panel = Ext.create({
			xtype: 'container',
			layout: {
				type: 'hbox',
				align: 'end'
			},
			padding: '10 0 0 0',
			items: [{
				xtype: 'button',
				text: 'Ny enhet',
				minWidth: 80,
				handler: function() {
					_selectUnit(null, null, null, 'newUnit');
				}
			}, {
				xtype: 'label',
				itemId: 'TopMessage',
				margin: '0 0 0 10',
				html: ''
			}]
		});
		
		// Add the message field to the array of all notice fields
		_current.messageOutputs.push(panel.down('#TopMessage'));

		return panel;
		
		/*
		var button = Ext.create({
			xtype: 'button',
			text: 'Ny enhet',
			minWidth: 80,
			margin: '10 0 0 0',
			handler: function() {
				_selectUnit(null, null, null, 'newUnit');
			}
		});
		
		return button;
		*/
	}; //getNewUnitButton()

/*------------------------------- UnitDetails -------------------------------*/

	// Return a panel with Unit details
	var getUnitDetailsPanel = function() {
		var panel = Ext.create({
			xtype: 'panel',
			title: 'Skapa ny enhet',
			frame: true,
			collapsible: true,
			titleCollapse: true,
			hidden: true,
			bodyPadding: 10,
			margin: '10 0 0 0',
			layout: 'auto',
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					panel.display(false);
				}
			}],
			items: [{
				xtype: 'form',
				itemId: 'UnitDetails',
				fieldDefaults: {
					validateOnChange: true,
					validateOnBlur: false
				},
				items: [{
					xtype: 'container',
					layout: {
						type: 'hbox',
						align: 'end'
					},
					items: [{
						xtype: 'textfield',
						itemId: 'UnitCode',
						fieldLabel: 'Enhetskod',
						labelAlign: 'top',
						width: 80,
						maxLength: 10,
						labelClsExtra: 'PrefixMandatory',
						margin: '0 10 0 0',
						readOnly: false,
						allowBlank: false,
						maskRe: /[0-9]+/
					}, {
						xtype: 'textfield',
						itemId: 'UnitName',
						fieldLabel: 'Enhetens namn',
						labelAlign: 'top',
						width: 340,
						maxLength: 80,
						readOnly: false,
						allowBlank: false,
						labelClsExtra: 'PrefixMandatory',
						margin: '0 0 0 0'
					}]
				}, {
					xtype: 'container',
					layout: {
						type: 'hbox',
						align: 'end'
					},
					items: [{
						xtype: 'textfield',
						itemId: 'UnitHsaID',
						fieldLabel: 'HSA-id',
						labelAlign: 'top',
						margin: '0 10 0 0',
						width: 165,
						maxLength: 80,
						fieldStyle: {
							textTransform: 'uppercase'
						},
						allowBlank: _config.allowBlankUnitHsaID,
						labelClsExtra: _config.allowBlankUnitHsaID ? '' : 'PrefixMandatory',
						hidden: !_config.displayUnitHsaID,
						emptyText: 'HSA-id'
					}, {
						xtype: 'textfield',
						itemId: 'ParID',
						fieldLabel: 'PAR-id',
						labelAlign: 'top',
						margin: '0 0 0 0',
						width: 185,
						maxLength: 20,
						maskRe: /[0-9]/,
						allowBlank: _config.allowBlankParID,
						labelClsExtra: _config.allowBlankParID ? '' : 'PrefixMandatory',
						hidden: !_config.displayParID,
						emptyText: 'Klinikkod'
					}]
				},
					getBindingsPanel(),
				{
					xtype: 'component',
					html: '<hr style="border-top:1px solid #ccc" />'
				}, {
					xtype: 'container',
					layout: {
						type: 'hbox',
						align: 'end'
					},
					items: [{
						xtype: 'button',
						itemId: 'SaveUnitButton',
						text: 'Spara',
						minWidth: 80,
						disabled: !_config.allowNewUnit,
						handler: saveUnit
					}, {
						xtype: 'button',
						itemId: 'UpdateUnitButton',
						text: 'Uppdatera',
						minWidth: 80,
						disabled: !_config.allowEditUnit,
						handler: updateUnit
					}, {
						xtype: 'label',
						itemId: 'UnitMessage',
						padding: '0 0 0 10',
						html: ''
					}, {
						xtype: 'tbspacer',
						flex: 1
					}]
				}]
			}]
		}); //panel
		
		_current.messageOutputs.push(panel.down('#UnitMessage'));
		
		// Display/hide the unit details panel
		panel.display = function(doShow) {
			if (doShow) {
				panel.show();
			} else {
				panel.hide();
				_current.panels.overview.down('#ViewUnitDetails').updateDisplay(false);
			}
		};
		
		// Select a specific unit or hide display if null
		panel.selectUnit = function(unitID) {
			if (unitID === null) {
				panel.display(false);
			} else {
				// Get the selected unit's store and display values with callback
				getUnitDetailsStore(unitID, setUnitDetails);

				var saveButton = panel.down('#SaveUnitButton');
				var updateButton = panel.down('#UpdateUnitButton');
				
				saveButton.setHidden(true);
				updateButton.setHidden(false);
				if (_config.allowEditUnit)
					updateButton.enable();
				else
					updateButton.disable();
			}
		};
		
		// Display the empty panel for entering a new unit
		panel.newUnit = function() {
			panel.display(true);
			panel.expand();
			setUnitDetails(null);
			_current.panels.overview.down('#ViewUnitDetails').updateDisplay(true);

			var saveButton = panel.down('#SaveUnitButton');
			var updateButton = panel.down('#UpdateUnitButton');

			saveButton.setHidden(false);
			updateButton.setHidden(true);
			if (_config.allowNewUnit)
				saveButton.enable();
			else
				saveButton.disable();
		};
		
		return panel;
	}; //getUnitDetailsPanel()
	
	// Display the unit details
	setUnitDetails = function(store) {
		var panel = _current.panels.unitDetails.down('#UnitDetails');
		
		if (store == null) {
			panel.down('#UnitCode').setReadOnly(false);
			panel.down('#UnitName').setReadOnly(false);
			
			panel.down('#UnitCode').setValue('');
			panel.down('#UnitName').setValue('');
			panel.down('#UnitHsaID').setValue('');
			panel.down('#ParID').setValue('');
			setBindings(null);
			setUnitTitle(null);

			panel.getForm().clearInvalid();
			return;
		}

		if (store.data == null || store.data.items.length === 0) {
			_displayErrorMessage('Kunde inte hitta någon information om enheten!');
			return;
		}

		panel.down('#UnitCode').setReadOnly(!_config.allowEditUnitCode);
		panel.down('#UnitName').setReadOnly(!_config.allowEditUnitName);
		
		var data = store.data.items[0].data;
		panel.down('#UnitCode').setValue(data.UnitCode);
		panel.down('#UnitName').setValue(data.UnitName);
		panel.down('#UnitHsaID').setValue(data.HSAID);
		panel.down('#ParID').setValue(data.PARID);
		setBindings(data.Bindings);

		setUnitTitle(data.UnitName);
		panel.getForm().clearInvalid();
	}; //setUnitDetails()

	// Set the panel's title (truncate if too long)
	var setUnitTitle = function(unitName) {
		var title = '';
		if (unitName !== null) {
			var panel = _current.panels.unitDetails;
			title = Ext.String.ellipsis('Enhet: \'' + unitName + '\'', 60, true);
			if (_current.isDeveloper)
				title += ' <span style="color:blue">(UnitID:' + _current.selectedUnitID + ')</span>';
			panel.setTitle(title);
			return;
		}

		// New unit, also display max used Unit Code
		getUnitsArray(true, 'UnitCode', function(unitsArray) {
			var panel = _current.panels.unitDetails;
			var title = 'Skapa ny enhet';
			if (unitsArray != null && unitsArray.length > 0) {
				var maxCode = Math.max.apply(null, unitsArray) + 1;
				while (Ext.Array.contains(_config.filterHideUnits, maxCode)) {
					maxCode++;
				}
				title += '. (Nästa lediga enhetskod: ' + maxCode + ')';
				if (panel.down('#UnitCode').getValue() == null || panel.down('#UnitCode').getValue() == '') {
					panel.down('#UnitCode').setValue(maxCode);
				}
			}
			panel.setTitle(title);
		});
	}; //setUnitTitle()
	
	// Return a panel with the comboboxes for all the bindings
	var getBindingsPanel = function() {
		var innerPanel = Ext.create({
			xtype: 'panel',
			itemId: 'BindingsPanel',
			layout: 'auto'
		});

		for (var i = 0; i < _config.unitBindings.length; i++) {
			var domainID = _config.unitBindings[i];
			getBindingsStore(domainID, addBindingCombobox(innerPanel, i));
		}
		
		var panel = Ext.create({
			xtype: 'container',
			layout: {
				type: 'hbox',
				align: 'begin'
			},
			margin: '10 0 0 0',
			padding: 0,
			items: [
				innerPanel,
			{
				xtype: 'label',
				itemId: 'BindingsInfo',
				border: 1,
				hidden: true,
				style: {
					borderColor: '#aaa',
					borderStyle: 'solid'
				},
				padding: 5,
				margin: '0 0 0 20',
				html: '<span style="color: #5050ff"><i>Dessa uppgifter kan påverka gjorda registreringar,<br>'
					+ 'kontakta supporten ifall de behöver ändras!</i></span>'
			}]
		});
		
		return panel;
	}; //getBindingsPanel()

	// Create a callback function that creates and adds a combobox for the current domain
	var dropdowns = [];
	var addBindingCombobox = function(panel, index) {
		// This function will be called when the store for this binding domain is fetched
		return function(store) {
			if (store == null || store.data.items.length === 0) {
				return;
			}

			var domain = store.data.items[1].data.Domain;
			var domainID = domain.DomainID;
			var domainTitle = domain.DomainTitle;
			var allowBlank = !_config.mandatoryBindings[index];

			if (allowBlank) {
				var aDomain = {
					DomainValueID: '0',
					ValueCode: '0',
					ValueName: '-'
				};
				store.insert(0, aDomain);
			}
			
			var dropdown = Ext.create({
				xtype: 'combobox',
				itemId: 'Combo' + domainID,
				fieldLabel: domainTitle,
				labelAlign: 'top',
				width: 250,
				matchFieldWidth: false,
				allowBlank: allowBlank,
				labelClsExtra: allowBlank ? '' : 'PrefixMandatory',
				forceSelection: true,
				typeAhead: true,
				queryMode: 'local',
				minChars: 1,
				checkChangeEvents: ['change', 'keyup'],
				store: store,
				displayField: 'ValueName',
				valueField: 'DomainValueID',
				emptyText: 'Välj ' + domainTitle.toLowerCase() + '...'
			});

			// Insert the combo in order of index on the given panel
			dropdowns[index] = dropdown;
			if (dropdowns.length === _config.unitBindings.length) {
				panel.add(dropdowns);
			}
		}; //anonymous callback()
	}; //addBindingCombobox()

	// Set the existing bindings for the selected Unit
	var setBindings = function(bindings) {
		var panel = _current.panels.unitDetails.down('#UnitDetails');
		var bindingsPanel = panel.down('#BindingsPanel');
		if (bindingsPanel == null) {
			console.error('No binding panel!');
			return;
		}

		// Clear and unlock all binding combos
		Ext.each(bindingsPanel.items.items, function(item, index) {
			if (item != null) {
				item.setValue('');
				item.setReadOnly(false);
			}
		});
	
		// Set all binding values for the selected unit
		_current.panels.unitDetails.down('#BindingsInfo').hide();
		Ext.each(bindings, function(binding, index) {
			var domain = binding.Domain;
			if (domain != null) {
				var combo = bindingsPanel.down('#Combo' + domain.DomainID);
				if (combo) {
					combo.setValue(binding.DomainValueID);
					// Lock the value, registrations can be affected by any change in unitbindings!
					// Check the register's forms mQuestion for any //#target=server in CalculationScript!
					combo.setReadOnly(true);
					_current.panels.unitDetails.down('#BindingsInfo').show();
				}
			}
		});
	}; //setBindings()
	
	// Save a new unit
	var saveUnit = function(button, e) {
		var form = _current.panels.unitDetails.down('#UnitDetails').getForm();
		if (!form.isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält först!');
			return;
		}
		
		var unitCode = _current.panels.unitDetails.down('#UnitDetails').down('#UnitCode').getValue();
		if (Ext.isDefined(unitCode) && unitCode != null) {
			if (Ext.Array.contains(_config.filterHideUnits, unitCode*1)) {
				_displayErrorMessage('Den enhetskoden är spärrad, välj en annan!');
				return;
			}
		}
		
		var unitID = _current.selectedUnitID;
		var data = getPanelUnitDetails(unitID);
		var unit = Ext.create('Stratum.Unit', {
			// UnitID is set by Stratum
			Register: 	{ 
				RegisterID: _config.registerID 
			},
			IsActive: 	true, 					// Not used by Stratum
			UnitCode: 	data.unitCode,
			UnitName: 	data.unitName,
			HSAID: 		data.hsaID,
			PARID: 		data.parID,
			Bindings: 	data.currentBindings
		});

		unit.save({
			success: function(response, op) {
				_current.selectedUnitID = response.data.UnitID;
				_current.selectedUnitName = response.data.UnitName;
				_current.selectedUnitCode = response.data.UnitCode;
				
				_current.panels.unitChoice.updateDisplay();
				_current.panels.unitChoice.selectUnit(response.data.UnitID);
				_current.panels.allUnits.updateGrid();
				
				var contextsUnitChoice = _current.panels.userDetails.getContextDetailsPanel();
				contextsUnitChoice.reloadUnits(response.data.UnitID);

				setUnitTitle(response.data.UnitName);
				_selectUnit(response.data.UnitID, response.data.UnitCode, response.data.UnitName, 'newCreated'); // '20170918: combo, above the row above'
				
				_displayOkMessage('Enheten sparades');
			},
			failure: function(response, op) {
				var errorText = 'Kunde inte spara enheten.<br><br>'
					+ 'Enhetskoden kanske används av en annan enhet? Du kan<br>'
					+ 'söka på enhetskod där du väljer enhet, ovanför.';
				if (_current.isDeveloper) {
					if (op && op.error && op.error.response && op.error.response.responseText) {
						errorText += '<br><br><span style="color:blue">Felmeddelande från Stratum: ' + op.error.response.responseText + '</span>';
					} 
				}

				_displayErrorMessage('Kunde inte spara enheten.');
				_displayMessageBox('Kunde inte spara enheten!', errorText);

				/*
				var errorText = 'createNewUnit(): '
					+ (op && op.error && op.error.response && op.error.response.responseText)
					? op.error.response.responseText 
					: 'Felmeddelande saknades';
				if (errorText.indexOf('Unit already exists') >= 0) {
					_displayErrorMessage('Kunde inte skapa enheten.');
					_displayMessageBox('Upptagen enhetskod', 'Kunde inte skapa denna enhet. Det finns redan<br>'
						+ 'en enhet med denna enhetskod.');
				} else {
					_displayErrorMessage('Fel! Kunde inte skapa enheten!');
					if (_current.isDeveloper) {
						_displayMessageBox('Felmeddelande för utvecklare', errorText);
					}
				}
				*/
			}
		});
	}; //saveUnit()

	// Update the unit
	var updateUnit = function(button, e) {
		var form = _current.panels.unitDetails.down('#UnitDetails').getForm();
		if (!form.isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält först!');
			return;
		}
		
		var unitID = _current.selectedUnitID;
		var data = getPanelUnitDetails(unitID);
		Ext.data.schema.Schema.lookupEntity('Stratum.Unit').load(data.unitID, {
			success: function(model, op) {
				model.set('UnitCode', data.unitCode);
				model.set('UnitName', data.unitName);
				model.set('HSAID', data.hsaID);
				model.set('PARID', data.parID);
				model.set('Bindings', data.currentBindings);
				
				model.save({
					success: function(response, op) {
						_displayOkMessage('Enheten uppdaterades.');
						_current.selectedUnitID = response.data.UnitID;
						_current.selectedUnitName = response.data.UnitName;
						_current.selectedUnitCode = response.data.UnitCode;
						
						_current.panels.unitChoice.updateDisplay();
						_current.panels.unitChoice.selectUnit(response.data.UnitID);
						_current.panels.allUnits.updateGrid();
						
						var contextsUnitChoice = _current.panels.userDetails.getContextDetailsPanel();
						contextsUnitChoice.reloadUnits(response.data.UnitID);

						_selectUnit(response.data.UnitID, response.data.UnitCode, response.data.UnitName, 'combo');
						setUnitTitle(response.data.UnitName);
					},
					failure: function(response, op) {
						var errorText = 'Kunde inte uppdatera enheten.<br><br>'
							+ 'Enhetskoden kanske används av en annan enhet? Du kan<br>'
							+ 'söka på enhetskod där du väljer enhet, ovanför.';
						if (_current.isDeveloper) {
							if (op && op.error && op.error.response && op.error.response.responseText) {
								errorText += '<br><br><span style="color:blue">Felmeddelande från Stratum: ' + op.error.response.responseText + '</span>';
							} 
						}

						_displayErrorMessage('Kunde inte uppdatera enheten.');
						_displayMessageBox('Kunde inte uppdatera enheten!', errorText);
							
						/*
						if (errorText.indexOf('Unit already exists') >= 0) {
							_displayErrorMessage('Kunde inte uppdatera enheten.');
							_displayMessageBox('Upptagen enhetskod', 'Kunde inte uppdatera enheten. Det finns redan<br>'
								+ 'en enhet med denna enhetskod.');
						} else {
							_displayErrorMessage('Fel! Kunde inte uppdatera enheten!');
							if (_current.isDeveloper)
								_displayMessageBox('Felmeddelande för utvecklare', errorText);
						}
						*/
					}
				});
			},
			failure: function(response, op) {
				_displayErrorMessage('Fel när enheten skulle läsas in!');
			}
		});
	}; //updateUnit()

	// Return all unit detail values from the panel
	var getPanelUnitDetails = function(unitID) {
		var result = {
			unitID: unitID
		};
		var panel = _current.panels.unitDetails.down('#UnitDetails');
		result.unitCode = panel.down('#UnitCode').getValue();
		result.unitName = panel.down('#UnitName').getValue();
		result.hsaID = panel.down('#UnitHsaID').getValue().toUpperCase();
		result.parID = panel.down('#ParID').getValue();
		if (result.hsaID === '') result.hsaID = null;
		if (result.parID === '') result.parID = null;
		
		var bindingsPanel = panel.down('#BindingsPanel');
		result.currentBindings = [];
		Ext.each(_config.unitBindings, function(domainID, i) {
			var value = bindingsPanel.down('#Combo' + domainID).getValue();
			if (value != null && value !== 0) {
				result.currentBindings.push({
					DomainValueID: value
				});
			}
		});
		
		return result;
	}; //getPanelUnitDetails

/*------------------------------- Users -------------------------------------*/

	// Return a grid of all users contexts for a specific Unit
	var getUsersGridPanel = function() {
		var panel = Ext.create({
			xtype: 'panel',
			title: 'Enhetens kontexter',
			hidden: true,
			collapsible: true,
			titleCollapse: true,
			margin: '10 0 0 0',
			bodyPadding: 10,
			frame: true,
			layout: 'auto',
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					panel.display(false);
				}
			}],
			items: [{
				xtype: 'grid',
				itemId: 'ExistingContextsGrid',
				height: 260,
				viewConfig: {
					stripeRows: true
				},
				selModel: {
					mode: 'single'
				},
				store: getUnitContextsStore(),
				columns: {
					defaults: {
						menuDisabled: true
					},
					items: [
						{ text:'Användarnamn', 	dataIndex:'UserUsername', 	flex:   1 },
						{ text:'Förnamn', 		dataIndex:'UserFirstName',	width: 90 },
						{ text:'Efternamn', 	dataIndex:'UserLastName',	width:150 },
						{ text:'Roll',			dataIndex:'RoleRoleName',	width: 80,
							renderer: function(v) {
								return getRoleShortName(v);
							}
						},
						{ text:'Inloggning',	dataIndex:'UserHSAID',		width: 95,
							renderer: function(v) { 
								if (v == '') 
									return '-';
								var p = v.substring(0,2);
								return (p == '19' || p == '20') ? 'BankID' : 'SITHS';
							}
						}, 
						{ text:'Aktiv',			dataIndex:'IsActive',		width: 60,
							renderer: function(v) { 
								return v ? 'Ja' : 'Nej' 
							}
						}
					]
				},
				listeners: {
					itemclick: function(model, records) {
						if (records != null) {
							_selectUser(records.data.User.UserID, records.data.User.Username, 'byUnit');
						} else {
							_displayErrorMessage('Kan inte läsa in detaljer kring vald användare just nu!');
						}
					}
				}
			}, {
				xtype: 'component',
				html: '<hr style="border-top:1px solid #ccc" />'
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'button',
					itemId: 'CreateNewUser',
					text: 'Ny användare / kontext',
					minWidth: 80,
					handler: newUserFromUsersGrid
				}, {
					xtype: 'label',
					itemId: 'UsersGridMessage',
					padding: '0 0 0 10',
					html: ''
				}, {
					xtype: 'tbspacer',
					flex: 1
				}, {
					xtype: 'button',
					itemId: 'ShowActive',
					text: 'Endast aktiva',
					disabled: true,
					handler: showActiveInUnit
				}]
			}]
		}); //panel
		
		_current.messageOutputs.push(panel.down('#UsersGridMessage'));

		// Display the panel if doShow=true
		panel.display = function(doShow) {
			if (doShow) {
				panel.show();
			} else {
				if (_current.selectedUnitID != null) {
					_current.selectedUnitID = null;
					_current.panels.unitChoice.selectUnit(null);
					_current.panels.allUnits.selectUnit(null);
				}
				panel.hide();
			}
		};
		
		// Select a unit to display it's contexts and users, or null to clear and hide the panel
		panel.selectUnit = function(unitID) {
			var grid = panel.down('#ExistingContextsGrid');
			grid.getStore().removeAll();
			if (unitID === null) {
				panel.display(false);
				return;
			}

			var proxy = grid.getStore().getProxy();
			var url = '/stratum/api/metadata/contexts/unit/' + unitID;
			if (proxy == null) {
				proxy = Ext.create('Ext.data.proxy.Rest', {
					url: url,
					reader: 'compactjson',
					writer: 'compactjson'
				});
			} else {
				proxy.setUrl(url);
			}
			
			grid.getStore().setProxy(proxy);
			grid.getStore().load(function(records, operation, success) {
				var title = '';

				if (success) {
					var store = grid.getStore();

					title = 'Kontexter för ' + _current.selectedUnitName + ': ' + store.getCount() + ' st.';
					if (_current.isDeveloper)
						title += ' <span style="color:blue">(' + store.getTotalCount() + ' totalt)</span>';
				} else {
					title += 'Användare/kontexter för vald enhet';
					_displayErrorMessage('Något gick fel när kontexterna skulle laddas!');
					// TODO: Display developer error message?
				}
				
				panel.setTitle(title);
			});
		}; //panel.selectUnit()
		
		// Update the grid when the store has changed
		panel.updateGrid = function() {
			if (_current.selectedUnitID == null) {
				return;
			}
			
			var grid = panel.down('#ExistingContextsGrid');
			var store = grid.getStore();
			var proxy = store.getProxy();
			var url = '/stratum/api/metadata/contexts/unit/' + _current.selectedUnitID;
			if (proxy == null) {
				proxy = Ext.create('Ext.data.proxy.Rest', {
					url: url,
					reader: 'compactjson',
					writer: 'compactjson'
				});
			} else {
				proxy.setUrl(url);
			}
			
			store.setProxy(proxy);

			var temp = (new Date()).getTime();
			grid.getStore().reload({
				params: {
					temp: temp
				}
			});
		};
		
		return panel;
	}; //getUsersGridPanel()

	// Display the user details panel for a new user
	var newUserFromUsersGrid = function() {
		_selectUser(null, null, 'newUser');
	};
	
	// Toggle and show all or only active users
	var showActiveInUnit = function() {
		console.log('showActiveInUnit() not implemented');
	};
	
/*------------------------------ SearchUser ---------------------------------*/

	// Return a button for showing the search panel
	var getSearchUserPanel = function() {
		if (!_config.allowSearchUsers) {
			var panel = Ext.create({
				xtype: 'component',
				html: '<p>Sökning är ej aktiverad.</p>'
			});
			panel.display = function() {};
			panel.updateDisplay = function() {};
			return panel;
		}
		
		var searchResult = null;
		
		var panel = Ext.create({
			xtype: 'panel',
			itemId: 'SearchUser',
			layout: 'auto',
			items: [
				getSearchField()
			]
		});

		// Display/hide search result panel
		// Clear the search user textfield
		panel.display = function(doShow) {
			if (!doShow) {
				panel.down('#SearchText').setValue('');
			}
		}; 
		
		return panel;
	}; //getSearchUserPanel()

	var getSearchField = function() {
		var panel = Ext.create({
			xtype: 'container',
			margin: '0 0 0 0',
			layout: {
				type: 'hbox',
				align: 'end'
			},
			items: [{
				xtype: 'textfield',
				itemId: 'SearchText',
				fieldLabel: 'Sök användare (oberoende av register)',
				labelAlign: 'top',
				emptyText: 'Ange minst 3 tecken i varje sökord',
				width: 400,
				listeners: {
					specialkey: function(field, e) {
						if (e.getKey() == e.ENTER) {
							searchUsers();
						}
					}
				}
			}, {
				xtype: 'button',
				text: 'Sök',
				glyph: 'xf002@FontAwesome', //fa-search: magnifying glass
				minWidth: 80,
				margin: '0 0 0 10',
				handler: searchUsers
			}, {
				xtype: 'button',
				isHelpNote: true,
				width: 16,
				height: 16,
				margin: 5,
				border: false,
				frame: false,
				helpTitle: 'Söka användare',
				helpNote: instructions,
				tabIndex: -1,
				glyph: 0xf0e6, //fa-question-circle=0xf059, 
				ui: 'toolbar',
				cls: 'EventFormHelpNoteButton',
				listeners: {
					render: Ext.bind(createHoveringHelpNote, this, [], true),
					click: Ext.bind(createFloatingHelpNote, this, [], true)
				}
			}]
		});
		
		return panel;
	}; //getSearchField

	// Code from Stratum to create a hovering help note
	var createHoveringHelpNote = function(aButton) {
		aButton.on('destroy', function() { 
			this.tip.destroy(); 
		});
		aButton.tip = Ext.create('Ext.tip.ToolTip', { 
			target: aButton.el, 
			cls: 'EventFormHelpNote',
			minWidth: 120,
			maxWidth: 380,
			showDelay: 300, 
			dismissDelay: 0,
			mouseOffset: [-100,-10],
			listeners: {
				show: function() {
					this.update(aButton.helpNote, true); 
				}
			}
		});
	};

	// Modified code from Stratum to display a help note
	var createFloatingHelpNote = function(aButton) {
		aButton.on('destroy', function() { 
			this.tip.destroy(); 
		});
		if (aButton.tip) {
			aButton.tip.close();
			aButton.tip.destroy();
		}
		aButton.tip = Ext.create('Ext.tip.ToolTip', { 
			target: aButton.el,
			cls: 'EventFormHelpNote',
			style: 'position: fixed !important',
			shadow: false,
			closable: true,
			draggable: true,
			autoHide: false,
			anchor: 'left',
			closeAction: 'destroy',
			title: aButton.helpTitle,
			minWidth: 120,
			maxWidth: 380,
			listeners: {
				show: function() {
					this.animate({
						to: {
							x: Ext.dom.Element.getViewportWidth() - 500,
							y: Ext.getBody().getScrollTop() + 300
						}
					});
					this.update(aButton.helpNote, true);
				},
				close: function() {
					createHoveringHelpNote(aButton);
				}
			}
		});
		aButton.tip.show();
	};
	
	// Return a panel with Search field and result grid for users
	var getSearchResultPanel = function() {
		var panel = Ext.create({
			xtype: 'panel',
			itemId: 'SearchResult',
			title: 'Sökresultat',
			hidden: true,
			collapsible: true,
			titleCollapse: true,
			bodyPadding: 10,
			margin: '10 0 0 0',
			frame: true,
			layout: 'auto',
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					panel.display(false);
				}
			}],
			items: [{
				xtype: 'grid',
				itemId: 'SearchResultGrid',
				height: 260,
				viewConfig: {
					stripeRows: true
				},
				selModel: {
					mode: 'single'
				},
				store: getSearchStore(),
				columns: {
					defaults: {
						menuDisabled: true
					},
					items: [
						{ text:'Användarnamn', 	dataIndex:'Username', 		flex:   1 },
						{ text:'Förnamn', 		dataIndex:'FirstName',		width: 80 },
						{ text:'Efternamn', 	dataIndex:'LastName',		width:150 },
						{ text:'E-post', 		dataIndex:'Email',			width:170 }
					]
				},
				listeners: {
					itemclick: function(model, records) {
						if (records != null) {
							_selectUser(records.data.UserID, records.data.Username, 'bySearch');
						} else {
							_displayErrorMessage('Kan inte läsa in detaljer kring vald användare just nu!');
						}
					}
				}
			}, {
				xtype: 'component',
				html: '<hr style="border-top:1px solid #ccc" />'
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'button',
					itemId: 'CreateNewUserFromSearch',
					text: 'Ny användare / kontext',
					minWidth: 80,
					handler: newUserFromSearchGrid
				}, {
					xtype: 'label',
					itemId: 'SearchGridMessage',
					padding: '0 0 0 10',
					html: ''
				}]
			}]
		}); //panel
		
		_current.messageOutputs.push(panel.down('#SearchGridMessage'));

		// Show the panel if doShow == true
		panel.display = function(doShow) {
			if (doShow) {
				panel.show();
			} else {
				panel.hide();
			}
		}; 
		
		// Update the panel title
		panel.updateDisplay = function(title) {
			panel.setTitle(title);
		};

		// Update the grid when the store has changed
		panel.updateGrid = function() {
			var grid = panel.down('#SearchResultGrid');
			var temp = (new Date()).getTime();
			grid.getStore().reload({
				params: {
					temp: temp
				}
			});
		};
		
		return panel;
	}; //getSearchResultPanel()

	// Display the user details panel for a new user
	var newUserFromSearchGrid = function() {
		_selectUser(null, null, 'newUser');
	};

	// Search for users matching the search text
	var searchUsers = function() {
		_displayOkMessage('OBS! Sökning i hela plattformen, oavsett register!');

		var searchText = _current.panels.searchUser.down('#SearchText').getValue();
		var query = validateSearch(searchText);
		if (query == null) {
			return;
		}
		
		// Clear active unit selection and hide the user contexts grid
		_selectUnit(null, null, null, 'search');

		var grid = _current.panels.searchResult.down('#SearchResultGrid');
		grid.getStore().removeAll();
		
		var proxy = grid.getStore().getProxy();
		var url = '/stratum/api/metadata/users/?query=' + encodeURIComponent(query);
		if (proxy == null) {
			proxy = Ext.create('Ext.data.proxy.Rest', {
				url: url,
				reader: 'compactjson',
				writer: 'compactjson'
			});
		} else {
			proxy.setUrl(url);
		}

		grid.getStore().setProxy(proxy);
		grid.getStore().load(function(records, operation, success) {
			var hits = '';
			var queryText = '\'' + query + '\': ';
			if (success) {
				var store = grid.getStore();
				if (store.getCount() === 0) {
					hits = 'Inga träffar';
				} else {
					hits = store.getCount() + ' användare hittades';
				}

				_current.panels.searchResult.display(true);
				_current.panels.searchResult.expand();
			} else {
				hits = 'Ett fel inträffade!';
				_displayErrorMessage('Något gick fel vid sökningen!');
				// TODO: Verbose error message for developers?
				_current.panels.searchResult.display(false);
			}
			_current.panels.searchResult.updateDisplay('Sökresultat för ' + queryText + hits);
		});
	}; //searchUsers()
	
	var instructions = 'Du anger <i>minst</i> tre tecken för att söka efter användare vars '
		+ 'användarnamn, för- eller efternamn, e-post, organisation, jobbtitel, '
		+ 'HSA-id (eller personnummer om de har BankID) börjar med denna söktext.<br/>'
		+ '<br/>'
		+ 'Vill du <i>begränsa</i> sökresultatet ytterligare? Ange fler sökord '
		+ 'med mellanslag eller kommatecken mellan!<br/>'
		+ '<br/>'
		+ 'Endast bokstäver, siffror, punkt och följande tecken:<br/>'
		+ '@ - _ tillåts!</span>';

	var validateSearch = function(searchText) {
		var lengthError = '<br/><br/><span style="color:red">OBS! Varje sökord måste vara minst tre tecken!</span>';

		var maxSearch = 5;
		var maxSearchError = '<br/><br/><span style="color:red">OBS! För många sökord, ange max ' + maxSearch + '!</span>';
		
		var query = searchText.trim();
		if (query.length < 3) {
			_displayMessageBox('Sök användare', instructions);
			return null;
		}

		var comma = /,/g;
		var spaces = /\s\s+/g;
		var invalidChars = /[^a-zåäö0-9.,@ _\-]/gi;

		// Replace comma and remove extra spaces
		query = query.replace(comma, ' ').replace(spaces, ' ');
		// Remove any invalid characgers
		query = query.replace(invalidChars, '');

		// Check the length of every valid search word
		var words = query.split(' ');
		for (key in words) {
			if (key >= maxSearch) {
				_displayMessageBox('Sök användare', instructions + maxSearchError);
				return null;
			}
			
			var word = words[key];
			if (word.length < 3) {
				_displayMessageBox('Sök användare', instructions + lengthError);
				return null;
			}
		}
		
		return query;
	}; //validateSearch()
	
/*------------------------------- UserDetails -------------------------------*/

	// Define vtype 'ua_username', used in Username textfield
	Ext.define('Override.form.field.VTypes', {
		override: 'Ext.form.field.VTypes',
		ua_username: function(v) {
			if (_current.isDeveloper) {
				return true;
			}
			if (_config.alternativeUsername && _config.alternativeMatch.test(v)) {
				return true;
			}
			return Ext.form.VTypes.email(v);
		},
		ua_usernameRe: /[a-z0-9@._\-]/gi,
		ua_usernameText: Ext.form.VTypes.emailText + ' eller alternativt användarnamn',
		ua_usernameMask: Ext.form.VTypes.emailMask
	});
	
	Ext.define('Override.form.field.VTypes', {
		override: 'Ext.form.field.VTypes',
		ua_bankid: function(v) {
			var bankidTest = /^(19|20){1}[0-9]{10}$/;
			if (bankidTest.test(v)) {
				var year = +v.substring(0,4);
				var month = +v.substring(4,6);
				var day = +v.substring(6,8);
				if (Ext.Date.isValid(year, month, day)) {
					return true;
				}
			}
			return false;
		},
		//ua_bankidRe: /[0-9]{12-12}/gi,
		ua_bankidText: 'Du måste ange ett personnummer på formen ÅÅÅÅMMDDNNNN',
		ua_bankidMask: /[0-9]/i
	});

	// Return a panel showing details about selected user and the user's contexts
	var getUserDetailsPanel = function() {
		var userInformationPanel = null;
		var userContextsGridPanel = null;
		var contextDetailsPanel = null;
		
		var panel = Ext.create({
			xtype: 'panel',
			itemId: 'UserDetails',
			title: 'Information om användaren',
			hidden: true,
			collapsible: true,
			titleCollapse: true,
			bodyPadding: 10,
			margin: '30 0 0 0',
			frame: true,
			layout: 'auto',
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					panel.display(false);
				}
			}],
			items: [
				userInformationPanel = getUserInformationPanel(),
				userContextsGridPanel = getUserContextsGridPanel(),
				contextDetailsPanel = getContextDetailsPanel()
			]
		});
		
		// Return a reference to the User information form
		panel.getUserInformationPanel = function() {
			return userInformationPanel;
		};
		
		// Return a reference to the User contexts panel (with the grid)
		panel.getUserContextsGridPanel = function() {
			return userContextsGridPanel;
		};
		
		// Return a reference to the User contexts panel (with the grid)
		panel.getContextDetailsPanel = function() {
			return contextDetailsPanel;
		};

		// Display the child panels if doShow == true
		panel.display = function(doShow) {
			if (doShow) {
				panel.show();
			} else {
				_current.selectedUserID = null;
				_current.selectedUsername = null;
				_current.selectedUserHasSiths = null;
				_current.selectedContextID = null;
				_current.selectedContextIsActive = false;
				if (_current.selectedUnitID == null)
					_current.panels.searchResult.down('#SearchResultGrid').getSelectionModel().clearSelections();
				else
					_current.panels.usersPanel.down('#ExistingContextsGrid').getSelectionModel().clearSelections();
					
				panel.hide();
			}
		};

		// Display user details or hide if userID is null
		panel.selectUser = function(userID, doKeepMsg) {
			if (!doKeepMsg)
				panel.showMessage('clear', null);
			
			if (userID == null) {
				// New user
				panel.getUserContextsGridPanel().selectUser(null);
				panel.getContextDetailsPanel().display(false);
				panel.display(false);
				return;
			}
			
			setUserTitle('Läser in information...', 'loading');
			getUserDetailsStore(userID, setUserDetails, doKeepMsg);
			panel.getUserContextsGridPanel().selectUser(userID);
			
			var updateButton = panel.down('#UpdateUserButton');
			if (_config.allowEditUser)
				updateButton.enable();
			else
				updateButton.disable();
			
			panel.getUserInformationPanel().down('#UserDetailsFooter').show();
			panel.getUserContextsGridPanel().down('#ContextsGridFooter').show();
		}; //panel.selectUser()
		
		// Display the empty panel for entering a new user
		panel.newUser = function() {
			// Empty the search field
			_current.panels.searchUser.down('#SearchText').setValue('');
			
			panel.display(true);
			panel.setCollapsed(false);
			
			setUserDetails(null);
			panel.getUserContextsGridPanel().selectUser(null);
			
			// TODO: Display save user button in context panel
			panel.getUserInformationPanel().down('#UserDetailsFooter').hide();
			panel.getUserContextsGridPanel().down('#ContextsGridFooter').hide();
		};

		panel.showMessage = function(state, message, emailMessage) {
			userInformationPanel.showMessage(state, message, emailMessage);
		};
		
		return panel;
	}; //getUserDetailsPanel()

/*------------------------------- UserInformation ---------------------------*/

	// Get a panel for the user specific information
	var getUserInformationPanel = function() {
		var panel = Ext.create({
			xtype: 'form',
			itemId: 'UserInformation',
			margin: '0 0 0 0',
			fieldDefaults: {
				validateOnChange: true,
				validateOnBlur: false
			},
			layout: 'auto',
			items: [{
				xtype: 'label',
				text: 'Information om användarkontot (gäller oavsett register/enhet):'
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'textfield',
					itemId: 'Username',
					fieldLabel: 'Användarnamn (e-post)',
					labelAlign: 'top',
					width: 365,
					maxLength: 80,
					readOnly: !_config.allowEditUsername,
					allowBlank: false,
					labelClsExtra: 'PrefixMandatory',
					margin: '0 0 0 0',
					vtype: 'ua_username', // Defined in file UserDetails.widget, checks for valid username
					enableKeyEvents: true,
					listeners: {
						keyup: onUsernameKeyup
					}
				}, {
					xtype: 'button',
					itemId: 'CheckUsername',
					hidden: !_config.allowEditUsername,
					disabled: true,
					text: 'Kontrollera',
					glyph: 'xf002@FontAwesome', //fa-search: magnifying glass
					minWidth: 105,
					margin: '0 0 0 10',
					handler: checkUsername
				}, {
					xtype: 'image',
					itemId: 'UsernameOk',
					glyph: 'xf058@FontAwesome',
					style: {
						color: 'green',
						fontSize: '20pt'
					},
					margin: '0 0 0 10',
					hidden: true
				}, {
					xtype: 'image',
					itemId: 'UsernameWarning',
					glyph: 'xf071@FontAwesome',
					style: {
						color: 'red',
						fontSize: '20pt'
					},
					margin: '0 0 0 10',
					hidden: true
				}, {
					xtype: 'label',
					itemId: 'UsernameMsg',
					html: '&nbsp;',
					margin: '0 0 0 10',
					hidden: false
				}]
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'combobox',
					itemId: 'TypeOfLogin',
					fieldLabel: 'Typ av login',
					labelAlign: 'top',
					margin: '0 0 0 0',
					width: 95,
					editable: true,
					allowBlank: false,
					labelClsExtra: 'PrefixMandatory',
					forceSelection: true,
					queryMode: 'local',
					store: {
						fields: [ 'LoginValue', 'LoginText' ],
						data: [
							{ LoginValue: '1', LoginText: 'SITHS' },
							{ LoginValue: '2', LoginText: 'BankID' }
						]
					},
					displayField: 'LoginText',
					valueField: 'LoginValue',
					value: '1',
					listeners: {
						select: function(combo, rec) {
							if (rec.data.LoginValue === '1') {
								// SITHS is selected
								panel.down('#HsaID').show();
								panel.down('#BankID').hide();
								panel.down('#BankID').allowBlank = true;

								panel.down('#FirstName').allowBlank = true;
								panel.down('#LastName').allowBlank = true;
								panel.down('#FirstName').labelEl.removeCls('PrefixMandatory');
								panel.down('#LastName').labelEl.removeCls('PrefixMandatory');

								if (_current.selectedUserID != null) {
									// Existing user
									if (_current.selectedUserHasSiths) {
										panel.down('#ReleaseSithsButton').show();
										panel.down('#ReleaseSithsButton').enable();
										panel.down('#HasSithsConnected').show();
									} else {
										panel.down('#ReleaseSithsButton').hide();
										panel.down('#HasSithsConnected').hide();
									}
								}
							} else {
								// BankID is selected
								panel.down('#HsaID').hide();
								panel.down('#BankID').show();
								panel.down('#BankID').allowBlank = false;

								panel.down('#FirstName').allowBlank = false;
								panel.down('#LastName').allowBlank = false;
								panel.down('#FirstName').labelEl.addCls('PrefixMandatory');
								panel.down('#LastName').labelEl.addCls('PrefixMandatory');
								
								panel.down('#ReleaseSithsButton').hide();
								panel.down('#HasSithsConnected').hide();
							}
						} //select
					} //listeners
				}, {
					xtype: 'textfield',
					itemId: 'TypeOfLoginText',
					hidden: true,
					fieldLabel: 'Typ av login',
					labelAlign: 'top',
					margin: '0 0 0 0',
					width: 95,
					labelClsExtra: 'PrefixMandatory',
					readOnly: true
				}, {
					xtype: 'textfield',
					itemId: 'HsaID',
					hidden: false,
					readOnly: false,
					fieldLabel: 'HSA-id (läses från kortet)',
					labelAlign: 'top',
					margin: '0 0 0 10',
					width: 260,
					maxLength: 64,
					fieldStyle: {
						textTransform: 'uppercase'
					},
					maskRe: _current.isDeveloper ? null : /[0-9a-zA-Z\-]/
				}, {
					xtype: 'textfield',
					itemId: 'BankID',
					hidden: true,
					fieldLabel: 'Personnummer',
					labelAlign: 'top',
					margin: '0 0 0 10',
					width: 180,
					maxLength: 15,
					labelClsExtra: 'PrefixMandatory',
					emptyText: 'ÅÅÅÅMMDDNNNN',
					vtype: 'ua_bankid'
					//maskRe: /^[0-9]+$/
				}, {
					xtype: 'textfield',
					itemId: 'HasSithsConnected',
					hidden: true,
					fieldLabel: 'Kopplat kort',
					labelAlign: 'top',
					margin: '0 0 0 10',
					width: 105,
					readOnly: true
				}, {
					xtype: 'button',
					itemId: 'ReleaseSithsButton',
					text: 'Nytt SITHS-kort',
					hidden: true, 
					minWidth: 120,
					margin: '0 0 0 10',
					handler: releaseSiths
				}]
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'textfield',
					itemId: 'FirstName',
					fieldLabel: 'Förnamn',
					labelAlign: 'top',
					width: 170,
					maxLength: 35,
					margin: '0 0 0 0'
				}, {
					xtype: 'textfield',
					itemId: 'LastName',
					fieldLabel: 'Efternamn',
					labelAlign: 'top',
					width: 300,
					maxLength: 50,
					margin: '0 0 0 10'
				}]
			},
				getExtendedUserDetails(),
			{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'textfield',
					itemId: 'Email',
					fieldLabel: 'e-post',
					labelAlign: 'top',
					readOnly: false,
					width: 365,
					maxLength: 80,
					vtype: 'email',
					validateOnChange: true,
					validateOnBlur: false,
					margin: '0 0 0 0'
				}, {
					xtype: 'button',
					itemId: 'CreateEmail',
					hidden: !_config.allowCreateEmail,
					text: 'Skapa e-post',
					minWidth: 105,
					margin: '0 0 0 10',
					handler: createEmail
				}, {
					xtype: 'label',
					itemId: 'EmailMsg',
					html: '&nbsp;',
					margin: '0 0 0 10',
					hidden: false
				}]
			}, {
				xtype: 'container',
				itemId: 'LatestLoginInformation',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				margin: '10 0 0 0',
				padding: 0,
				items: [{
					xtype: 'label',
					border: 1,
					style: {
						borderColor: '#aaa',
						borderStyle: 'solid'
					},
					padding: 5,
					margin: 0,
					html: '<span style="color:#5050ff"><i>Senaste inloggning visas ej tills vidare.</i></span>'
				}]
			},{
				/*
				xtype: 'textfield',
				itemId: 'LatestLogin',
				hidden: false,
				autoRender: true,
				fieldLabel: 'Senaste inloggning <span style="color:#11f">(visas ej tills vidare)</span>',
				labelAlign: 'top',
				margin: '0 10 0 0',
				width: 170,
				readOnly: true,
				value: isUserAddsContext ? 'Ny användare' : getLoginDate()
			}, {
				*/
				xtype: 'component',
				html: '<hr style="border-top:1px solid #ccc" />'
			}, {
				xtype: 'container',
				itemId: 'UserDetailsFooter',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'button',
					itemId: 'UpdateUserButton',
					text: 'Uppdatera',
					minWidth: 80,
					disabled: !_config.allowEditUser,
					handler: updateUser
				}, {
					xtype: 'label',
					itemId: 'UserMessage',
					padding: '0 0 0 10',
					html: ''
				}]
			}]
		}); //panel
		
		_current.messageOutputs.push(panel.down('#UserMessage'));
		
		// Store the store with the current displayed user's data
		panel.store = null;

		// Show an Ok or Warning icon and a message
		panel.showMessage = function(state, message, emailMessage) {
			panel.down('#EmailMsg').setText('', false);

			if (state == 'ok') {
				panel.down('#UsernameOk').show();
				panel.down('#UsernameWarning').hide();
				panel.down('#UsernameMsg').setText('<span style="color:#0a0">' + message + '</span>', false);
				if (emailMessage)
					panel.down('#EmailMsg').setText('<span style="color:#0a0">' + emailMessage + '</span>', false);
			} else if (state == 'warning') {
				panel.down('#UsernameOk').hide();
				panel.down('#UsernameWarning').show();
				panel.down('#UsernameMsg').setText('<span style="color:#a00">' + message + '</span>', false);
			} else if (state == 'clear') {
				panel.down('#UsernameOk').hide();
				panel.down('#UsernameWarning').hide();
				panel.down('#UsernameMsg').setText('', false);
			} else {
				panel.down('#UsernameOk').hide();
				panel.down('#UsernameWarning').hide();
				panel.down('#UsernameMsg').setText('', false);
			}
		};

		// Save a new user and call the callback if everything went ok
		panel.saveUser = function(callback) {
			saveUser(callback);
		};
		
		return panel;
	}; //getUserInformationPanel()

	// Extended user details, sometimes provided by the SITHS card
	var getExtendedUserDetails = function() {
		if (!_config.displayExtendedUserDetails)
			return;

		/* TODO: Add fields for:
			- WorkTitle (35)
			- Organization (35)
			- StreetAddress (50)
			- PostalNumber (8)	
			- PostalOffice (25)
		*/
		var panel = Ext.create({
			xtype: 'panel',
			html: '<p>Extended User details here.</p>'
		});
		
		return panel;
	};
	
	// Display the user details
	var setUserDetails = function(store, doKeepMsg) {
		setUserFormState('lock');
		var panel = _current.panels.userDetails.getUserInformationPanel();
		var contextDetails = _current.panels.userDetails.getContextDetailsPanel();
		panel.store = null;
		if (!doKeepMsg)
			panel.showMessage('clear', null);
		
		_current.selectedUserHasSiths = false;
		panel.down('#TypeOfLogin').setValue('1');

		panel.down('#TypeOfLogin').show();
		panel.down('#TypeOfLoginText').hide();
		panel.down('#HsaID').show();
		panel.down('#BankID').hide();
		panel.down('#ReleaseSithsButton').hide();
		panel.down('#HasSithsConnected').hide();
		panel.down('#LatestLoginInformation').hide();
		
		panel.down('#Username').setValue('');
		panel.down('#TypeOfLogin').setValue('1');
		panel.down('#HsaID').setValue('');
		panel.down('#BankID').setValue('');
		panel.down('#HasSithsConnected').setValue('Nej');
		panel.down('#FirstName').setValue('');
		panel.down('#LastName').setValue('');
		panel.down('#Email').setValue('');

		if (!panel.down('#CheckUsername').isDisabled()) {
			panel.down('#HsaID').setReadOnly(true);
		} else if (panel.down('#HsaID').getValue() == '') {
			panel.down('#HsaID').setReadOnly(false);
		} else {
			panel.down('#HsaID').setReadOnly(true);
		}
		panel.down('#BankID').setReadOnly(false);
		
		setUserTitle(null, 'new');
		panel.getForm().clearInvalid();
		contextDetails.display(false);

		if (store == null) {
			contextDetails.newUserLocked();
			return;
		}
		
		if (store.data == null || store.data.items.length === 0) {
			_displayErrorMessage('Kunde inte läsa information om användaren!');
			return;
		}
		
		if (_config.allowChangeOfLogin) {
			panel.down('#TypeOfLogin').show();
			panel.down('#TypeOfLoginText').hide();
		} else {
			panel.down('#TypeOfLogin').hide();
			panel.down('#TypeOfLoginText').show();
		}
		
		setUserFormState('unlock');
		panel.store = store;
		var data = store.data.items[0].data;
		if (isBankID(data.HSAID)) {
			// BankID
			panel.down('#HsaID').hide();
			panel.down('#BankID').show();
			panel.down('#HsaID').setReadOnly(false);
			panel.down('#BankID').setReadOnly(false);
			panel.down('#ReleaseSithsButton').hide();
			panel.down('#HasSithsConnected').hide();

			_current.selectedUserHasSiths = false;
			panel.down('#TypeOfLogin').setValue('2');
			panel.down('#BankID').setValue(data.HSAID);
		} else {
			panel.down('#HsaID').show();
			panel.down('#BankID').hide();
			if (data.HSAID && data.HSAID != '') {
				panel.down('#HsaID').setReadOnly(true);
			} else {
				panel.down('#HsaID').setReadOnly(false);
			}
			panel.down('#BankID').setReadOnly(false);
			if (_config.allowSithsRelease && _current.selectedUserID != null && data.HSAID && data.HSAID != '') {
				panel.down('#ReleaseSithsButton').show();
				panel.down('#ReleaseSithsButton').enable();
			} else {
				panel.down('#ReleaseSithsButton').hide();
			}
			panel.down('#HasSithsConnected').show();

			if (data.HSAID && (data.HSAID.substring(0,2) === 'SE')) {
				_current.selectedUserHasSiths = true;
				panel.down('#HasSithsConnected').setValue('Ja');
			} else if (data.HSAID && data.HSAID != '') {
				_current.selectedUserHasSiths = true;
				if (_current.isDeveloper) {
					panel.down('#HasSithsConnected').setValue('Special');
				} else {
					panel.down('#HasSithsConnected').setValue('Ja');
				}
			} else {
				panel.down('#HasSithsConnected').setValue('Nej');
			}
			
			// TODO: Handle strange HsaID like developers and invitation, etc
			panel.down('#TypeOfLogin').setValue('1');
			panel.down('#HsaID').setValue(data.HSAID);
		}
		panel.down('#LatestLoginInformation').show();
		panel.down('#Username').setValue(data.Username);
		panel.down('#FirstName').setValue(data.FirstName);
		panel.down('#LastName').setValue(data.LastName);
		panel.down('#Email').setValue(data.Email);

		setUserTitle(data.Username, 'loaded');
		panel.getForm().clearInvalid();
	}; //setUserDetails()
	
	// Set the panel's title (truncate if too long)
	var setUserTitle = function(title, mode) {
		var panel = _current.panels.userDetails;
		
		if (title == null) {
			panel.setTitle('Skapa ny användare');
		} else if (mode == 'loading') {
			panel.setTitle(title);
			// TODO: panel.el.mask() or other load mask solution?
		} else {
			var title = Ext.String.ellipsis('Användare \'' + title + '\'', 60, true);
			if (_current.isDeveloper)
				title += ' <span style="color:blue">(UserID:' + _current.selectedUserID + ')</span>';
			panel.setTitle(title);
			panel.setCollapsed(false);
		}
	};

	// Called when writing in the username field
	var doClearMessage = true;
	var onUsernameKeyup = function(field, e) {
		if (doClearMessage) {
			doClearMessage = false;
			var panel = _current.panels.userDetails;
			panel.showMessage('clear', null);
		}
		
		if (!_config.allowEditUsername)
			return;
		
		var ignoreKeyCodes = [e.TAB, e.ESC, e.UP, e.DOWN, e.RIGHT, e.LEFT, e.HOME, e.END, e.SHIFT, e.CTRL, e.ALT]; //e.SPACE
		// altKey, ctrlKey, shiftKey, keyCode, charCode
		if (!Ext.Array.contains(ignoreKeyCodes, e.keyCode)) {
			if (e.keyCode == e.ENTER) {
				checkUsername();
				return;
			}
			
			if (!e.ctrlKey || e.keyCode == e.V) {
				// Only lock the form if any ordinary key is pressed or if Ctrl+V
				setUserFormState('lock');
				if (_current.selectedUserID == null) {
					var contextDetails = _current.panels.userDetails.getContextDetailsPanel();
					contextDetails.newUserLocked();
				}
			}
		}
	};

	// Check that the user name is valid, and search for the user
	var checkUsername = function() {
		doClearMessage = true;
		setUserFormState('lock');
		var panel = _current.panels.userDetails;
		var contextDetails = panel.getContextDetailsPanel();
		var field = panel.down('#Username');
		var usernameToCheck = field.getValue();
		usernameToCheck = Ext.util.Format.trim(usernameToCheck);
		field.setRawValue(usernameToCheck);
		panel.showMessage('clear', null);
		
		if (usernameToCheck == null || usernameToCheck.length == 0) {
			_displayMessageBox('Användarnamn saknas', 'Fyll i användarnamnet först!');
			return;
		}
		
		if (usernameToCheck == _current.selectedUsername) {
			_displayOkMessage('Återgår till befintligt användarnamn.');
			setUserFormState('unlock');
			return;
		}
		
		if (!field.validate()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält först!');
			return;
		}
		
		_current.panels.userDetails.getContextDetailsPanel().display(false);
		
		_displayInfoMessage('Kontrollerar användarnamnet...');
		Ext.Ajax.request({
			url: '/stratum/api/metadata/users/exists/' + usernameToCheck,
			method: 'GET',
			success: function(response, opts) {
				// The username already exist in Stratum DB - changing to that user!
				var existingUser = Ext.decode(response.responseText).data;
				if (_current.selectedUsername == null || _current.selectedUsername == '') {
					// Search from new user, don't need to ask
					doChangeUser(existingUser);
				} else {
					// Change of existing user, do ask if this was intended
					Ext.MessageBox.show({
						title: 'Befintlig användare',
						msg: 'OBS! Detta användarnamn används redan av en annan användare!<br><br>'
							+ 'Vill du se den användaren istället?',
						buttons: Ext.MessageBox.YESNO,
						buttonText: {
							yes: 'Ja',
							no: 'Nej'
						},
						fn: function(btn) {
							var panel = _current.panels.userDetails;
							if (btn == 'yes') {
								doChangeUser(existingUser);
							} else {
								var field = _current.panels.userDetails.down('#Username');
								field.setValue(_current.selectedUsername);
								_displayOkMessage('Återgår till tidigare användarnamnet');
							}
						}
					});
				}
			},
			failure: function(response, opts) {
				// The username doesn't exist in Stratum DB - it's available as a new username
				_displayOkMessage('Användarnamnet är ledigt!');

				if (_current.selectedUserID == null) {
					panel.showMessage('ok', 'Ny användare');
					_displayOkMessage('Ny användare');
					// Copy the username to the email-field if it's a valid e-mail address but only when creating new users
					var username = panel.down('#Username').getValue();
					var re = /\S+@\S+/; // Just the most simple e-mail test
					if (re.test(username))
						panel.down('#Email').setValue(username);
				} else {
					panel.showMessage('ok', 'Uppdatera för att<br>byta användarnamn!',
						'Byt även e-postadressen<br>om den har ändrats!');
					_displayOkMessage('Ledigt användarnamn');
				}
				setUserFormState('unlock');
				if (_current.selectedUserID == null)
					contextDetails.newUserUnlocked();
			}
		});
	}; //checkUsername()

	// Change the currently selected user
	var doChangeUser = function(existingUser) {
		var panel = _current.panels.userDetails;
		// Deselect in the grids
		if (_current.selectedUnitID == null)
			_current.panels.searchResult.down('#SearchResultGrid').getSelectionModel().clearSelections();
		else
			_current.panels.usersPanel.down('#ExistingContextsGrid').getSelectionModel().clearSelections();

		// Empty the search field
		_current.panels.searchUser.down('#SearchText').setValue('');
		
		_selectUser(existingUser.UserID, existingUser.Username, 'byCheck');
		panel.showMessage('ok', 'Befintlig<br/>användare');
		_displayOkMessage('Byter till befintlig användare');
	};
	
	// Set the state of the user details form (and context)
	var setUserFormState = function(state) {
		if (state !== 'lock' && state !== 'unlock') {
			console.error('UserInformation.setUserFormState() unknown state:"' + state + '"');
			return;
		}

		var panel = _current.panels.userDetails;
		var doLock = (state === 'lock');
		panel.down('#TypeOfLogin').setReadOnly(doLock);
		panel.down('#HsaID').setReadOnly(doLock || panel.down('#HsaID').getValue() != '');
		panel.down('#BankID').setReadOnly(doLock);
		panel.down('#FirstName').setReadOnly(doLock);
		panel.down('#LastName').setReadOnly(doLock);
		panel.down('#Email').setReadOnly(doLock);

		panel.down('#CheckUsername').enable();
		if (doLock) {
			panel.down('#CheckUsername').enable();
			panel.down('#UpdateUserButton').disable();
			panel.down('#ReleaseSithsButton').disable();
			panel.down('#CreateEmail').disable();
		} else {
			panel.down('#CheckUsername').disable();
			panel.down('#UpdateUserButton').enable();
			panel.down('#ReleaseSithsButton').enable();
			panel.down('#CreateEmail').enable();
		}
	};
	
	// Create and display an e-mail to send to the user
	var createEmail = function() {
		var mailMaxLength = 1250;
		var newLine = ' ' + escape('\n');
		var hash = escape('#!');

		var panel = _current.panels.userDetails;
		var subject = _config.mailSithsSubject;
		var body = _config.mailSithsBody;
		var hasSiths = (panel.down('#TypeOfLogin').getValue() == '1');
		if (_config.mailForBankID && !hasSiths) {
			subject = _config.mailBankIDSubject || subject;
			body = _config.mailBankIDBody || body;
		}

		var fromName = _current.userFullName;
		var toUsername = panel.down('#Username').getValue();
		var toEmail = panel.down('#Email').getValue();
		var firstName = panel.down('#FirstName').getValue();
		var lastName = panel.down('#LastName').getValue();
		var toName = Ext.String.trim(firstName + ' ' + lastName);
		
		var mailContent = 'mailto:' + toEmail
					+ '?subject=' + subject
					+ '&body=' + body.replace(/\{nl}/g, newLine)
						.replace(/#!/g, hash)
						.replace(/\{username}/g, toUsername)
						.replace(/\{email}/g, toEmail)
						.replace(/\{toName}/g, toName)
						.replace(/\{fromName}/g, fromName);
		
		if (mailContent.length > mailMaxLength) {
			// Too long mail, add a warning at the end
			var tooLongMsg = '----- Ändra konfigurationen! Mailet är för långt! -----';
			mailContent.substring(0, mailMaxLength-tooLongMsg.length-5) + newLine + newLine + tooLongMsg;
		}
		window.location = mailContent;
	}; //createEmail()
	
	var releaseSiths = function() {
		Ext.MessageBox.show({
			title: 'Nytt SITHS-kort',
			msg: 'Du är på väg att ta bort denna användares befintliga<br>'
				+ 'SITHS-kort. Användaren kommer behöva göra om proceduren<br>'
				+ 'för att logga in första gången.<br>'
				+ '<br>'
				+ 'Är du säker?',
			buttons: Ext.MessageBox.YESNO,
			buttonText: {
				yes: 'Ja',
				no: 'Nej'
			},
			fn: function(btn) {
				if (btn == 'yes')
					yesReleaseSiths();
			}
		});
	};
	
	// Release the current Siths card
	var yesReleaseSiths = function() {
		if (_current.selectedUserID == null) {
			_displayErrorMessage('Ingen användare har valts!');
			return;
		}

		var panel = _current.panels.userDetails.getUserInformationPanel();
		var userModel = panel.store;
		
		panel.down('#ReleaseSithsButton').disable();
		_displayInfoMessage('Nytt SITHS-kort, var god vänta...');
		Ext.data.schema.Schema.lookupEntity('Stratum.User').load(_current.selectedUserID, {
			success: function(model, op) {
				model.set('HSAID', null);
				model.set('Passhash', _config.defaultPasshash);

				_displayInfoMessage('Sparar ändringar...');
				model.save({
					success: function(model,op) {
						_current.selectedUserHasSiths = false;

						// Update the current panel
						panel.down('#HsaID').setValue('');
						panel.down('#BankID').setValue('');
						panel.down('#HsaID').setReadOnly(false);
						panel.down('#ReleaseSithsButton').hide();
						panel.down('#HasSithsConnected').setValue('Nej');
						
						if (_current.selectedUnitID != null) {
							// Reload the user grid by reloading the users for this unit
							// (The search user grid doesn't display active/inactive contexts)
							_selectUnit(_current.selectedUnitID, null, null, 'update');
						}
						
						_displayMessageBox('Nytt SITHS-kort', 'Användaren kan nu koppla sitt nya SITHS-kort genom att<br>'
							+ 'logga in med sitt användarnamn och engångslösenord.');
						_displayOkMessage('Redo för nytt SITHS-kort');
					},
					failure: function(model, op) {
						// TODO: Verbose error message for developers?
						console.error('Error when saving changes!');
						_displayErrorMessage('Fel när SITHS-kortet skulle uppdateras!');
					}
				});
			},
			failure: function(model, op) {
				// TODO: Verbose error message for developers?
				console.error('Error when loading user model!');
				_displayErrorMessage('Fel när information om SITHS-kortet skulle läsas in!');
			}
		});
	}; //releaseSiths()
	
	// Save a new user and a context - Save new user button moved to ContextDetails!
	// Changes: call the callback if the user get's saved correctly
	var saveUser = function(callback) {
		var form = _current.panels.userDetails.down('#UserInformation').getForm();
		if (!form.isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält för användaren först!');
			return;
		}
		
		var userID = _current.selectedUserID;
		var formData = getPanelUserDetails(userID);
		var user = null;
		_current.selectedUserHasSiths = formData.isSiths;
		// TODO: Rewrite to simpler if-statements
		if (formData.isSiths) {
			// SITHS user (HSAID can be set or null)
			if (formData.hsaID == null) {
				user = Ext.create('Stratum.User', {
					HSAID:		null,
					Username:	formData.username,
					FirstName:	formData.firstName,
					LastName:	formData.lastName,
					Email:		formData.email
					//Passhash is set by Stratum
				});
			} else {
				if (formData.firstName == null || formData.lastName == null) {
					_displayErrorMessage('Fyll i för- och efternamn');
					_displayMessageBox('Fyll i uppgifter', 'Du måste själv ange för- och efternamn när du manuellt<br>'
						+ 'fyller i ett HSA-id, eftersom dessa uppgifter då inte<br>'
						+ 'läses in från SITHS-kortet.');
					return;
				}
				
				user = Ext.create('Stratum.User', {
					HSAID:		formData.hsaID,
					Username:	formData.username,
					FirstName:	formData.firstName,
					LastName:	formData.lastName,
					Email:		formData.email,
					Passhash:	'?'
				});
			}
		} else {
			// BankID user
			user = Ext.create('Stratum.User', {
				HSAID:		formData.hsaID,
				Username:	formData.username,
				FirstName:	formData.firstName,
				LastName:	formData.lastName,
				Email:		formData.email,
				Passhash:	'?'
			});
		}

		user.save({
			success: function(model, op) { // response
				_current.selectedUserID = model.data.UserID;
				_current.selectedUsername = model.data.Username;
				setUserTitle(model.data.Username, 'saved');
				_displayOkMessage('Användaren sparades...');
				// Also create a new context
				callback(true);
			},
			failure: function(model, op) {
				var userPanel = _current.panels.userDetails;
				var isSithsSelected = userPanel.down('#TypeOfLogin').getValue() == '1';
				var errorHeader = 'Användaruppgifterna kunde inte sparas!';
				var errorText = '';
				if (isSithsSelected) {
					var hsaId = userPanel.down('#HsaID').getValue();
					if (hsaId != '') {
						errorText = 'Användarens uppgifter kunde inte sparas.<br><br>'
							+ 'Det HSAID du har angett kanske redan används av<br>'
							+ 'en annan användare? Du kan söka på HSAID i sökrutan<br>'
							+ 'högst upp!<br><br>'
							+ 'Kontakta din kontaktperson på Registercentrum<br>'
							+ 'Västra Götaland för hjälp';
					}
				} else {
					var bankId = userPanel.down('#BankID').getValue();
					if (bankId != '') {
						errorText = 'Användarens uppgifter kunde inte sparas.<br><br>'
							+ 'Det personnummer du har angett kanske redan används av<br>'
							+ 'en annan användare? Du kan söka på personnummer i sökrutan<br>'
							+ 'högst upp!<br><br>'
							+ 'Kontakta din kontaktperson på Registercentrum<br>'
							+ 'Västra Götaland för hjälp';
					}
				}
				
				if (_current.isDeveloper) {
					if (op && op.error && op.error.response && op.error.response.responseText) {
						errorText += '<br><br><span style="color:blue">Felmeddelande från Stratum: ' + op.error.response.responseText + '</span>';
					}
				}

				_displayErrorMessage(errorHeader);
				_displayMessageBox(errorHeader, errorText);
			}
		});
	}; //saveUser

	// Update an existing user
	var updateUser = function(button, e) {
		var form = _current.panels.userDetails.down('#UserInformation').getForm();
		if (!form.isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält först!');
			return;
		}
		
		var userID = _current.selectedUserID;
		
		Ext.data.schema.Schema.lookupEntity('Stratum.User').load(userID, {
			success: function(model,op) {
				var formData = getPanelUserDetails(userID);
				
				if (_config.allowEditUsername && formData.username != model.data.Username)
					model.set('Username', formData.username);

				var newHsaID = formData.hsaID || '';
				var oldHsaID = model.data.HSAID || '';

				if (formData.isSiths && newHsaID != '') {
					if (formData.firstName == null || formData.lastName == null) {
						_displayErrorMessage('Fyll i för- och efternamn');
						if (oldHsaID = '') {
							_displayMessageBox('Fyll i uppgifter', 'Du måste själv ange för- och efternamn när du manuellt<br>'
								+ 'fyller i ett HSA-id, eftersom dessa uppgifter då inte<br>'
								+ 'läses in från SITHS-kortet.');
						} else {
							_displayMessageBox('Obligatoriska uppgifter', 'För- och efternamn får inte lämnas blanka<br>'
								+ 'när HSA-id har angetts, då dessa uppgifter<br>'
								+'inte läses in på nytt från SITHS-kortet!');
						}
						return;
					}
				}

				if (newHsaID != oldHsaID) {
					// Ignore if no changes was made
					if (formData.isSiths && newHsaID == '') {
						// User has selected SITHS-card and blank HSA-id, Stratum sets the password
						model.set('HSAID', null);
						model.set('Passhash', null); // Password set to default by Stratum
					} else {
						// Regardless of BankID or SITHS, set the new HSA-id
						model.set('HSAID', newHsaID);
						model.set('Passhash', '?');
					}
				}

				if (formData.firstName != model.data.FirstName)
					model.set('FirstName', formData.firstName);
				if (formData.lastName != model.data.LastName)
					model.set('LastName', formData.lastName);
				if (formData.email != model.data.Email)
					model.set('Email', formData.email);

				model.save({
					success: function(model,op) {
						setUserTitle(model.data.Username, 'updated');
						if (_current.selectedUnitID == null) {
							_current.panels.searchResult.updateGrid();
							_selectUser(model.data.UserID, model.data.Username, 'bySearch');
						} else {
							_current.panels.usersPanel.updateGrid();
							_selectUser(model.data.UserID, model.data.Username, 'byUnit');
						}
						_displayOkMessage('Användaren uppdaterades');
						return;
					},
					failure: function(model,op) {
						var userPanel = _current.panels.userDetails;
						var isSithsSelected = userPanel.down('#TypeOfLogin').getValue() == '1';
						var errorHeader = 'Användaruppgifterna kunde inte uppdateras!';
						var errorText = '';
						if (isSithsSelected) {
							var hsaId = userPanel.down('#HsaID').getValue();
							if (hsaId != '') {
								errorText = 'Användarens uppgifter kunde inte uppdateras.<br><br>'
									+ 'Det HSAID du har angett kanske redan används av<br>'
									+ 'en annan användare? Du kan söka på HSAID i sökrutan<br>'
									+ 'högst upp!';
							}
						} else {
							var bankId = userPanel.down('#BankID').getValue();
							if (bankId != '') {
								errorText = 'Användarens uppgifter kunde inte uppdateras.<br><br>'
									+ 'Det personnummer du har angett kanske redan används av<br>'
									+ 'en annan användare? Du kan söka på personnummer i sökrutan<br>'
									+ 'högst upp!';
							}
						}
						
						if (_current.isDeveloper) {
							if (op && op.error && op.error.response && op.error.response.responseText) {
								errorText += '<br><br><span style="color:blue">Felmeddelande från Stratum: ' + op.error.response.responseText + '</span>';
							}
						}

						_displayErrorMessage(errorHeader);
						_displayMessageBox(errorHeader, errorText);
					}
				});
			},
			failure: function(model,op) {
				_displayErrorMessage('Fel! Användaruppgifter kunde inte läsas in.');

				if (_current.isDeveloper) {
					var errorText2 = (op && op.error && op.error.response && op.error.response.responseText) ? 
						op.error.response.responseText : '';
					_displayMessageBox('Felmeddelande från Stratum', errorText2);
				}
			}
		});
	}; //updateUser

	// Return all user detail values
	var getPanelUserDetails = function(userID) {
		var result = {
			userID: userID
		};
		var panel = _current.panels.userDetails.down('#UserInformation');
		result.isSiths = panel.down('#TypeOfLogin').getValue() == '1';
		if (result.isSiths) {
			result.hsaID = panel.down('#HsaID').getValue().toUpperCase();
			result.hsaID = Ext.util.Format.trim(result.hsaID);
			panel.down('#HsaID').setRawValue(result.hsaID);
		} else {
			result.hsaID = panel.down('#BankID').getValue().replace(/\D/g, '');
			result.hsaID = Ext.util.Format.trim(result.hsaID);
			panel.down('#BankID').setRawValue(result.hsaID);
		}
		result.username = panel.down('#Username').getValue();
		result.firstName = panel.down('#FirstName').getValue();
		result.lastName = panel.down('#LastName').getValue();
		result.email = panel.down('#Email').getValue();

		if (result.hsaID == '') result.hsaID = null;
		if (result.username == '') result.username = null;
		if (result.firstName == '') result.firstName = null;
		if (result.lastName == '') result.lastName = null;
		if (result.email == '') result.email = null;
		
		return result;
	};
	
	// Check if a given value is used for BankID or not
	var isBankID = function(value) {
		return (value != null && (value.substring(0,2) == '19' || value.substring(0,2) == '20'));
	};
	
/*------------------------------- UserContexts ------------------------------*/

	// Get a panel for the context specific information
	var getUserContextsGridPanel = function() {
		var registersStore = getRegistersStore();
		var registersArray = [];
		if (registersStore.data.items.length == 0) {
			registersStore.load(function(records, operation, success) {
				if (success)
					registersArray = getRegistersStoreArray(registersStore);
			});
		} else {
			registersArray = getRegistersStoreArray(registersStore);
		}
		
		var panel = Ext.create({
			xtype: 'panel',
			title: 'Användarens kontexter',
			hidden: false,
			collapsible: true,
			titleCollapse: true,
			margin: '10 0 0 0',
			bodyPadding: 10,
			frame: true,
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					_current.panels.userDetails.getContextDetailsPanel().display(false);
					panel.display(false);
				}
			}],
			items: [{
				xtype: 'grid',
				itemId: 'UserContextsGrid',
				height: 200,
				viewConfig: {
					stripeRows: true
				},
				selModel: {
					mode: 'single'
				},
				store: getUserContextsStore(),
				columns: {
					defaults: {
						menuDisabled: true
					},
					items: [
						{ text:'Enhetskod', 				dataIndex:'UnitUnitCode', 	width: 80  },
						{ text:'Enhet', 					dataIndex:'UnitUnitName', 	flex:   1  },
						{ text:'Roll', 						dataIndex:'RoleRoleName', 	width: 160 },
						{ text:'Aktiv',						dataIndex:'IsActive',		width: 60,
							renderer: function(v) { 
								return v ? 'Ja' : 'Nej' 
							}
						}
					]
				},
				listeners: {
					itemclick: function(model, records) {
						var contextDetails = _current.panels.userDetails.getContextDetailsPanel();
						
						if (records != null) {
							contextDetails.selectContext(records.data);
						} else {
							_displayErrorMessage('Kunde inte läsa in detaljerna');
						}
					}
				}
			}, {
				xtype: 'component',
				html: '<hr style="border-top:1px solid #ccc" />'
			}, {
				xtype: 'container',
				itemId: 'ContextsGridFooter',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'button',
					itemId: 'NewContextButton',
					text: 'Ny kontext',
					minWidth: 80,
					hidden: !_config.allowNewContext,
					handler: newContextFromContextsGrid
				}, {
					xtype: 'label',
					itemId: 'ContextsGridMessage',
					padding: '0 0 0 10',
					html: ''
				}, {
					xtype: 'tbspacer',
					flex: 1
				}, {
					xtype: 'button',
					itemId: 'ShowActive',
					text: 'Endast aktiva',
					disabled: true,
					handler: showActiveContexts
				}]
			}]
		}); //panel
		
		_current.messageOutputs.push(panel.down('#ContextsGridMessage'));

		// Display all contexts for this register for the selected user
		panel.selectUser = function(userID) {
			var grid = panel.down('#UserContextsGrid');
			var store = grid.getStore();
			store.removeAll();

			if (userID == null) {
				if (panel && !panel.isHidden()) {
					panel.hide();
				}
				return;
			}
			
			panel.show();
			panel.setTitle('Läser in kontexter...');
			
			var proxy = store.getProxy();
			var url = '/stratum/api/metadata/contexts/user/' + userID;
			if (proxy == null) {
				proxy = Ext.create('Ext.data.proxy.Rest', {
					url: url,
					reader: 'compactjson',
					writer: 'compactjson'
				});
			} else {
				proxy.setUrl(url);
			}
			
			store.setProxy(proxy);
			store.load(function(records, operation, success) {
				var title = '';
				if (success) {
					var count = store.getCount();
					if (count == 0) {
						title = 'Kontexter saknas för ' + _config.registerShortName + '. Användaren är aktiv i andra register.';
					} else {
						title = 'Kontexter för ' + _config.registerShortName + ': ' + store.getCount();
					}
					if (_current.isDeveloper)
						title += ' <span style="color:blue">(' + store.getTotalCount() + ' totalt)</span>';
					panel.setCollapsed(false);
				} else {
					title += 'Kontexter för vald användare';
					_displayErrorMessage('Något gick fel när kontexterna skulle laddas!');
				}
				
				panel.setTitle(title);
			});
		};

		panel.display = function(doShow) {
			if (doShow)
				panel.show();
			else
				panel.hide();
		};
		
		panel.getTitle = function() {
			return 'Kontexter för ' + _config.registerShortName + ': ';
		};
		
		// Update the grid when the store has changed
		panel.updateGrid = function() {
			if (_current.selectedUserID == null) {
				return;
			}
			
			var grid = panel.down('#UserContextsGrid');
			var store = grid.getStore();
			var proxy = store.getProxy();
			var url = '/stratum/api/metadata/contexts/user/' + _current.selectedUserID;
			if (proxy == null) {
				proxy = Ext.create('Ext.data.proxy.Rest', {
					url: url,
					reader: 'compactjson',
					writer: 'compactjson'
				});
			} else {
				proxy.setUrl(url);
			}
			
			store.setProxy(proxy);

			var temp = (new Date()).getTime();
			store.reload({
				params: {
					temp: temp
				}
			});
		};

		return panel;
	}; //getUserContextsGridPanel()

	// Display the context form for a new context
	var newContextFromContextsGrid = function() {
		var contextDetails = _current.panels.userDetails.getContextDetailsPanel();
		var contextUnitsChoice = contextDetails.down('#ContextUnitChoice');
		contextUnitsChoice.updateDisplay();
		contextDetails.newContext();
	};
	
	// Show all/only active contexts
	var showActiveContexts = function() {
		console.log('showActiveContexts() not implemented');
	};
	
/*------------------------------- ContextDetailsPanel ----------------------*/

	// Get a panel for the context specific information
	var getContextDetailsPanel = function() {
		var unitChoice = null;
		
		var panel = Ext.create({
			xtype: 'form',
			itemId: 'ContextDetails',
			bodyPadding: 10,
			margin: '10 0 0 0',
			title: 'Kontext-information',
			frame: true,
			hidden: true,
			tools: [{
				type: 'close',
				handler: function(e, toolEl, aPanel, tc) {
					panel.display(false);
				}
			}],
			items: [{
				xtype: 'label',
				itemId: 'contextDetailsInfo',
				text: 'Enhetsspecifik information:'
			},
				getUnitChoice('ContextUnitChoice', false, 'Välj enhet', true),
			{
				xtype: 'container',
				itemId: 'ContextUnitChoicePanel',
				hidden: false,
				layout: {
					type: 'hbox',
					align: 'end'
				},
				padding: '0 0 0 0',
				items: [{
					xtype: 'textfield',
					itemId: 'ContextUnitChoiceText',
					hidden: false,
					fieldLabel: 'Enhet',
					labelAlign: 'top',
					readOnly: true,
					margin: '0 0 0 0',
					width: 400,
					value: null
				}, {
					xtype: 'textfield',
					itemId: 'ContextID',
					hidden: !_config.displayContextID,
					fieldLabel: 'Kontext ID',
					labelAlign: 'top',
					readOnly: true,
					margin: '0 0 0 10',
					width: 100,
					value: ''
				}]
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				padding: '0 0 0 0',
				items: [{
					xtype: 'combobox',
					itemId: 'RoleChoice',
					hidden: false,
					autoRender: true,
					fieldLabel: 'Roll',
					labelAlign: 'top',
					width: 190,
					margin: '0 0 0 0',
					editable: true,
					allowBlank: false,
					labelClsExtra: 'PrefixMandatory',
					forceSelection: true,
					typeAhead: true,
					minChars: 1,
					queryMode: 'local',
					store: {
						fields: [ 'RoleID', 'RoleName' ],
						data: _config.roles,
						filters: [ 
							function(item) {
								// Visa bara befintligt och giltiga alternativ
								return Ext.Array.contains(_config.filterNewRoles, item.data.RoleID);
							}
						]
					},
					displayField: 'RoleName',
					valueField: 'RoleID',
					value: _config.defaultRoleID
				}, {
					xtype: 'textfield',
					itemId: 'RoleChoiceText',
					hidden: true,
					autoRender: true,
					readOnly: true,
					fieldLabel: 'Roll',
					labelAlign: 'top',
					margin: '0 0 0 0',
					width: 190,
					value: null
				}, {
					xtype: 'combobox',
					itemId: 'IsActiveChoice',
					hidden: false,
					autoRender: true,
					disabled: false,
					fieldLabel: 'Aktiv',
					labelAlign: 'top',
					margin: '0 0 0 10',
					width: 65,
					editable: true,
					allowBlank: false,
					labelClsExtra: 'PrefixMandatory',
					forceSelection: true,
					typeAhead: true,
					minChars: 1,
					queryMode: 'local',
					store: {
						fields: [ 'ActiveValue', 'ActiveText' ],
						data: [
							{ ActiveValue: '0', ActiveText: 'Nej' },
							{ ActiveValue: '1', ActiveText: 'Ja' }
						]
					},
					displayField: 'ActiveText',
					valueField: 'ActiveValue',
					value: '1'
				}, {
					xtype: 'textfield',
					itemId: 'IsActiveChoiceText',
					hidden: true,
					autoRender: true,
					readOnly: true,
					fieldLabel: 'Aktiv',
					labelAlign: 'top',
					margin: '0 0 0 10',
					width: 65,
					value: null
				}, {
					xtype: 'label',
					itemId: 'LockedRoleInfo',
					hidden: true,
					border: 1,
					style: {
						borderColor: '#aaa',
						borderStyle: 'solid'
					},
					padding: '2 5 2 5',
					margin: '0 0 0 10',
					html: '<span style="color:#5050ff"><i>Användaren är låst till denna roll.<br>'
						+ 'Kontakta supporten vid frågor.</i></span>'
				}]
			}, {
				xtype: 'component',
				html: '<hr style="border-top:1px solid #ccc" />'
			}, {
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end'
				},
				items: [{
					xtype: 'button',
					itemId: 'SaveUserAndContextButton',
					text: 'Spara ny användare',
					minWidth: 80,
					hidden: false,
					disabled: !_config.allowNewUser,
					handler: saveUserAndContext
				}, {
					xtype: 'button',
					itemId: 'SaveContextButton',
					text: 'Spara',
					minWidth: 80,
					hidden: true,
					handler: saveNewContext // saveContext
				}, {
					xtype: 'button',
					itemId: 'UpdateContextButton',
					text: 'Deaktivera',
					minWidth: 80,
					hidden: true,
					handler: updateContext
				}, {
					xtype: 'label',
					itemId: 'ContextMessage',
					padding: '0 0 0 10',
					html: ''
				}]
			}]
		}); //panel

		// Reload the Unit's store
		panel.reloadUnits = function(unitID) {
			panel.down('#ContextUnitChoice').setStore(getUnitsStore(true));
			panel.down('#ContextUnitChoice').updateDisplay();
			if (unitID)
				panel.down('#ContextUnitChoice').selectUnit(unitID);
		};
		
		// Display the form to add a user and a context
		panel.newUserLocked = function() {
			panel.down('#ContextUnitChoice').hide();
			panel.down('#ContextUnitChoice').allowBlank = true;
			//panel.down('#ContextUnitChoiceText').show();
			panel.down('#ContextUnitChoicePanel').show();
			panel.down('#RoleChoice').hide();
			panel.down('#RoleChoice').allowBlank = true;
			panel.down('#RoleChoiceText').show();
			panel.down('#IsActiveChoice').hide();
			panel.down('#IsActiveChoiceText').show();
			panel.down('#LockedRoleInfo').hide();

			panel.down('#SaveUserAndContextButton').show();
			panel.down('#SaveUserAndContextButton').disable();
			panel.down('#SaveContextButton').hide();
			panel.down('#UpdateContextButton').hide();

			panel.tools['close'].hide();
			panel.setTitle('Ny kontext för ny användare (kontrollera användarnamnet först)');
			panel.display(true);

			if (_current.selectedUnitID && _current.selectedUnitName)
				panel.down('#ContextUnitChoiceText').setValue(_current.selectedUnitName);
			else 
				panel.down('#ContextUnitChoiceText').setValue('');
			panel.down('#RoleChoiceText').setValue('Registrerare');
			panel.down('#IsActiveChoiceText').setValue('Ja');
		};

		// Display the form to add a user and a context
		panel.newUserUnlocked = function() {
			panel.down('#ContextUnitChoice').show();
			panel.down('#ContextUnitChoice').allowBlank = false;

			//panel.down('#ContextUnitChoiceText').hide();
			panel.down('#ContextUnitChoicePanel').hide();
			panel.down('#RoleChoice').show();
			panel.down('#RoleChoice').allowBlank = false;
			panel.down('#RoleChoice').setReadOnly(false);
			panel.down('#RoleChoiceText').hide();
			panel.down('#RoleChoiceText').roleID = null;
			panel.down('#IsActiveChoice').show();
			panel.down('#IsActiveChoiceText').hide();
			panel.down('#LockedRoleInfo').hide();

			panel.down('#SaveUserAndContextButton').show();
			panel.down('#SaveUserAndContextButton').enable();
			panel.down('#SaveContextButton').hide();
			panel.down('#UpdateContextButton').hide();

			panel.tools['close'].hide();
			panel.setTitle('Ny kontext för ny användare');
			panel.display(true);

			panel.down('#ContextUnitChoice').setStore(getUnitsStore(true));
			panel.down('#ContextUnitChoice').updateDisplay();

			if (_current.selectedUnitID) {
				panel.down('#ContextUnitChoice').setValue(_current.selectedUnitID);
			} else {
				panel.down('#ContextUnitChoice').setValue('');	// New
			}
			panel.down('#RoleChoice').setValue(_config.defaultRoleID);
			panel.down('#IsActiveChoice').setValue(1);
		};

		// Display the form to add a new context for an existing user
		panel.newContext = function() {
			panel.down('#ContextUnitChoice').show();
			panel.down('#ContextUnitChoice').allowBlank = false;
			panel.down('#ContextUnitChoicePanel').hide();
			panel.down('#RoleChoice').show();
			panel.down('#RoleChoice').allowBlank = false;
			panel.down('#RoleChoice').setReadOnly(false);
			panel.down('#RoleChoiceText').hide();
			panel.down('#RoleChoiceText').roleID = null;
			panel.down('#IsActiveChoice').show();
			panel.down('#IsActiveChoiceText').hide();
			panel.down('#LockedRoleInfo').hide();
			
			panel.down('#SaveUserAndContextButton').hide();
			panel.down('#SaveContextButton').show();
			panel.down('#UpdateContextButton').hide();

			panel.tools['close'].show();
			panel.setTitle('Ny kontext');
			panel.display(true);

			panel.down('#ContextUnitChoice').setStore(getUnitsStore(false)); // TODO: test, was true
			panel.down('#ContextUnitChoice').updateDisplay();

			if (_current.selectedUnitID) {
				panel.down('#ContextUnitChoice').setValue(_current.selectedUnitID);
			} else {
				panel.down('#ContextUnitChoice').setValue('');
			}
			panel.down('#RoleChoice').setValue(_config.defaultRoleID);
			panel.down('#IsActiveChoice').setValue(1);

			for (var i=0; i<_config.lockedRoleUsers.length; i++) {
				if (_config.lockedRoleUsers[i] == _current.selectedUserID) {
					if (Ext.Array.contains(_config.filterNewRoles, _config.lockedRoles[i])) {
						panel.down('#RoleChoice').setValue(_config.lockedRoles[i]);
						panel.down('#RoleChoice').setReadOnly(true);
						panel.down('#LockedRoleInfo').show();
					} else {
						console.log('Role ' + _config.lockedRoles[i] + ' is not found in filterNewRoles! Special case?')
						panel.down('#RoleChoice').hide();
						panel.down('#RoleChoice').allowBlank = true;
						panel.down('#RoleChoiceText').setValue(getRoleName(_config.lockedRoles[i]));
						panel.down('#RoleChoiceText').show();
						panel.down('#RoleChoiceText').roleID = _config.lockedRoles[i];
						panel.down('#LockedRoleInfo').show();
					}
				}
			}
		};
		
		// Select and display a specific context
		panel.selectContext = function(data) {
			_current.selectedContextID = null;
			_current.selectedContextIsActive = false;

			if (data == null || data.ContextID == null) {
				_displayErrorMessage('Fel! Kunde inte visa kontexten!');
				return;
			}

			_current.selectedContextID = data.ContextID;
			_current.selectedContextIsActive = data.IsActive;
			
			panel.down('#ContextUnitChoice').hide();
			panel.down('#ContextUnitChoice').allowBlank = true;
			panel.down('#ContextUnitChoicePanel').show();
			panel.down('#RoleChoice').hide();
			panel.down('#RoleChoice').allowBlank = true;
			panel.down('#RoleChoiceText').show();
			panel.down('#IsActiveChoice').hide();
			panel.down('#IsActiveChoiceText').show();
			panel.down('#LockedRoleInfo').hide();
			
			panel.down('#SaveUserAndContextButton').hide();
			panel.down('#SaveContextButton').hide();
			panel.down('#UpdateContextButton').show();
			panel.down('#UpdateContextButton').enable();

			panel.tools['close'].show();
			var title = 'Kontext-information';
			if (_current.isDeveloper)
				title += ' <span style="color:blue">(ContextID:' + data.ContextID + ')</span>';
			panel.setTitle(title);
			panel.display(true);

			panel.down('#ContextID').setValue(data.ContextID);
			panel.down('#ContextUnitChoiceText').setValue(data.Unit.UnitCode + '. ' + data.Unit.UnitName);
			panel.down('#RoleChoiceText').setValue(data.Role.RoleName);
			panel.down('#IsActiveChoiceText').setValue(data.IsActive ? 'Ja' : 'Nej');
			panel.down('#UpdateContextButton').setText(data.IsActive ? 'Deaktivera' : 'Aktivera');
		}; //panel.selectContext()
		
		// Display or hide the context details panel
		panel.display = function(doShow) {
			if (doShow)
				panel.show();
			else
				panel.hide();
		};
		
		return panel;
	}; //getContextDetailsPanel()
	
	// Save a new user or update an existing
	var saveUserAndContext = function(button, e) {
		var userPanel = _current.panels.userDetails.getUserInformationPanel();
		if (!userPanel.getForm().isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält för användaren först!');
			return;
		}
		
		var contextPanel = _current.panels.userDetails.getContextDetailsPanel();
		if (!contextPanel.getForm().isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält för kontexten först.');
			return;
		}
		
		userPanel.saveUser(saveContext);
	};
	
	// Save a new context for an existing user (could use Ext.bind in button handler)
	var saveNewContext = function() {
		saveContext(false);
	};
	
	// Save a new context for the user
	var saveContext = function(isNewUser) {
		if (_current.selectedUserID == null) {
			if (isNewUser)
				_displayErrorMessage('Användaren sparades, men inte kontexten!');
			else
				_displayErrorMessage('Ingen användare vald!');
			return;
		}
		
		var panel = _current.panels.userDetails.getContextDetailsPanel();
		var isActive = panel.down('#IsActiveChoice').getValue() == '1';
		var userID = _current.selectedUserID;
		var unitID = panel.down('#ContextUnitChoice').getValue();
		var roleID = panel.down('#RoleChoice').getValue();

		// A special case if it's a user with a locked role and the role is not in the RoleChoice
		if (panel.down('#RoleChoiceText').isVisible()) {
			roleID = panel.down('#RoleChoiceText').roleID;
		}
		
		var form = panel.getForm();
		if (!form.isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält först.');
			return;
		}

		var newContext = Ext.create('Stratum.Context', {
			IsActive: isActive,
			User: { UserID: userID },
			Unit: { UnitID: unitID },
			Role: { RoleID: roleID }
		});
		
		newContext.save({
			success: function(model, op) {
				if (_current.selectedUnitID == null)
					_current.panels.searchResult.updateGrid();
				else 
					_current.panels.usersPanel.updateGrid();

				var allContexts = _current.panels.userDetails.getUserContextsGridPanel();
				allContexts.updateGrid();
				_current.panels.usersPanel.updateGrid();

				if (_current.selectedUserID == null) 
					_selectUser(_current.selectedUserID, _current.selectedUsername, 'bySearch');
				else
					_selectUser(_current.selectedUserID, _current.selectedUsername, 'byUnit');

				if (isNewUser)
					_displayOkMessage('Användare och kontexten sparades');
				else 
					_displayOkMessage('Kontexten lades till');
			},
			failure: function(model, op) {
				if (_current.selectedUnitID == null)
					_current.panels.searchResult.updateGrid();
				else 
					_current.panels.usersPanel.updateGrid();
				
				var headerText = '';
				var errorText = '';
				if (isNewUser) {
					headerText = 'Användaren sparades men INTE kontexten!';
					errorText = 'Kunde inte spara/lägga till kontexten. Kontrollera att<br>'
						+ 'inte användaren redan har denna behörighet!';
				} else {
					headerText = 'Kunde inte lägga till ny kontext!';
					errorText = 'Kunde inte spara/lägga till kontexten. Kontrollera att<br>'
						+ 'inte användaren redan har denna behörighet!';
				}
				
				if (_current.isDeveloper) {
					var errorMsg = '';
					if (op && op.error && op.error.response && op.error.response.responseText) {
						errorText += '<br><br><span style="color:blue">Felmeddelande från Stratum: ' + op.error.response.responseText + '</span>';
					}
				}
				
				_displayErrorMessage(headerText);
				_displayMessageBox(headerText, errorText);
			}
		});
	}; //saveContext()
	
	// Update an existing context
	var updateContext = function() {
		var panel = _current.panels.userDetails.getContextDetailsPanel();

		if (!panel.getForm().isValid()) {
			_displayErrorMessage('Åtgärda rödmarkerade fält först!');
			return;
		}

		_displayInfoMessage((_current.selectedContextIsActive ? 'Deaktiverar' : 'Aktiverar') + ' kontexten, vänta...');
		panel.down('#UpdateContextButton').disable();
		Ext.data.schema.Schema.lookupEntity('Stratum.Context').load(_current.selectedContextID, {
			success: function(model,op) {
				model.set('IsActive', !_current.selectedContextIsActive);
				model.save({
					success: function(model, op) {
						_current.selectedContextIsActive = !_current.selectedContextIsActive;

						var panel = _current.panels.userDetails.getContextDetailsPanel();
						panel.down('#IsActiveChoiceText').setValue(_current.selectedContextIsActive ? 'Ja' : 'Nej');
						panel.down('#UpdateContextButton').enable();
						panel.down('#UpdateContextButton').setText(_current.selectedContextIsActive ? 'Deaktivera' : 'Aktivera');
						var allContexts = _current.panels.userDetails.getUserContextsGridPanel();
						allContexts.updateGrid();
						if (_current.selectedUnitID == null)
							_current.panels.searchResult.updateGrid();
						else 
							_current.panels.usersPanel.updateGrid();
						_displayOkMessage('Denna behörighet ' + (_current.selectedContextIsActive ? 'kan nu användas' : 'är nu ogiltig/avstängd'));
					},
					failure: function(model, op) {
						var panel = _current.panels.userDetails.getContextDetailsPanel();
						panel.down('#UpdateContextButton').enable();
						_displayErrorMessage('Det gick inte att uppdatera behörigheten!');
						
						if (_current.isDeveloper) {
							var errorText = (op && op.error && op.error.response && op.error.response.responseText) ? 
								op.error.response.responseText : '';
							_displayMessageBox('Felmeddelande från Stratum', '<span style="color:blue">' + errorText + '</span>');
						}
					}
				});
			},
			failure: function(model,op) {
				var panel = _current.panels.userDetails.getContextDetailsPanel();
				panel.down('#UpdateContextButton').enable();
				_displayErrorMessage('Fel när behörigheten skulle läsas in!');

				if (_current.isDeveloper) {
					var errorText = (op && op.error && op.error.response && op.error.response.responseText) ? 
						op.error.response.responseText : '';
					_displayMessageBox('Felmeddelande från Stratum', '<span style="color:blue">' + errorText + '</span>');
				}
			}
		});
	}; //updateContext()
	
/*-------------------------------- UserAdministration -----------------------*/

	// Return the public methods of the Widget Module
	return {
		initialize: initialize,
		start: 		start
	};
})(); //UserAdministrationModule()

/*
 * Initialize and start the User Administration
 * The register specific configuration is stored in a cPage for the register
 * or in Keystone, in the Widget's Advanced Settings
 */
Ext.onReady(function() {
	Ext.tip.QuickTipManager.init();
	
	var config = (typeof UserAdministrationConfig != 'undefined' ? UserAdministrationConfig : null);
	UserAdministrationModule.initialize(config);
	UserAdministrationModule.start();
});

//! Användar- och enhetshantering
