
var pelvisWidget = function (event, callback) {
	Ext.tip.QuickTipManager.init();
	var app = pelvisWidget;
	app.event = event;
	app.callback = callback;
	app.imagesurl = 'https://stratum.blob.core.windows.net/';
	var RINGSKADA_TEXT = 'Ringskada';
	var BACK_SUBFRACTURE_TEXT = 'Ryggfraktur';
	var NO_COMPETENCE_TO_CLASSIFY_CODE = 0;
	var NO_CLASSIFIABLE_CODE = 1;
	var PARTIAL_NO_CLASSIFIABLE_CODE = 2;
	var NO_COMPETENCE_TO_CLASSIFY_TEXT = 'Har ej kunnat klassificera';
	var NO_COMPETENCE_TO_CLASSIFY_TOOLTIP = 'Anges om du inte kan finna en lämplig frakturtyp i klassifikationen';
	var NO_CLASSIFIABLE_TOOLTIP = 'Anges av en erfaren<br/>ortoped när frakturtypen inte är<br/>möjlig att klassificera med det klassifikationssystem vi använder'
	var NO_CLASSIFIABLE_TEXT = 'Ej möjlig att klassificera';
	var NO_CLASSIFIABLE_BUTTON_TEXT = '<b>Ej kunnat klassificera/ej klassificerbar</b>';
	var NO_CLASSIFIABLE_BUTTON_TOOLTIP = 'Om frakturen ej kan klassificeras kommer ändå ICD-kod att skapas automatiskt utifrån vald kroppsdel och behöver ej ifyllas manuellt.<br/>I undantagsfall måste kod väljas aktivt i listan vilket man ser genom att rutan för koden är rödfärgad';
	var NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE = 'Ej kunnat klassificera/ej klassificerbar';
	var NO_CLASSIFIABLE_DIALOG_TEXT = 'Anledning till att frakturen ej kommer att klassificeras?';
	var PROSTHESIS_FRACTURE = 'PROSTHESIS_FRACTURE';

	var ChildClassChars = { VESSEL: '-K', CAPUT: '-C', FELSTALLNING: '-F', NERV: '-N', FLEX: '-M' };
	app.requiredDomainCodes = [5757];
	app.skeletonDomainCodes = [4158, 4159, 4060, 5554, 5555, 5563, 5572, 5573, 5757, 4144];
	app.registerDomainCodes = [4000, 4049, 4051, 4052, 4053, 4056, 4059, 4060, 4061, 4094, 4095, 4096, 4097, 4098, 4006, 4007, 4008, 4009, 4010,
									4140, 4144, 4145, 4146, 4156, 4157, 4158, 4159, 4188, 4189, 4281, 4311, 4402, 4403, 5545, 5550, 5551, 5552, 5554, 5555, 5563, 5572, 5573, 5619, 5620, 5621, 5665, 5690, 5748, 5757];

	var tplFracture = new Ext.XTemplate(
        '<img title="{title}" src="{image}" width="65" height="65" style="margin:0px" />'
    );
	var tplRadiusImg = new Ext.XTemplate(
		'<img title="{title}" src="{image}" width="65" height="65" style="margin-top: 0px" />'
	);
	var tplUlnaImg = new Ext.XTemplate(
		'<img title="{title}" src="{image}" width="65" height="65" style="margin-top: 0px" />'
	);
	var tplScapulaImg = new Ext.XTemplate(
		'<img title="{title}" src="{image}" width="65" height="65" style="margin-top: 0px" />'
	);
	var tplClavicleImg = new Ext.XTemplate(
		'<img title="{title}" src="{image}" width="65" height="65" style="margin-top: 0px" />'
	);

	onLoadAOImages = function (aPictureID, aSide, aTargetPanel, gotoPicID) {
		var aoPanel = app.mySkeletonWindow.items.items[1];
		if (aoImagesNavigationHandler.showNoChildFractureSupportAlert === true && !isBackFracture(aPictureID)) {
			var t = new Ext.Template("<div></div>");
			if (Ext.isEmpty(aTargetPanel)) {
				t.overwrite(aoPanel.body, '');
			}
			else {
				t.overwrite(aTargetPanel.body, '');
			}
			var dialogitems = [
                        {
                        	tooltip: '',
                        	text: 'Fortsätt',
                        	handler: function () {
                        		msgBox.close();
                        		aoImagesNavigationHandler.showNoChildFractureSupportAlert = false;
                        		onLoadAOImages(aPictureID, aSide, aTargetPanel, gotoPicID);
                        	}
                        }, {
                        	tooltip: '',
                        	text: 'Ej klassificerad barnfraktur',
                        	handler: function () {
                        		msgBox.close();
                        		generate_ICD_AO_SubFracturePanels(app.myCurrentFracturePanel.id, aSide, aPictureID, '-1', app.mySkeletonWindow.id, null, false, null);

                        	}
                        }, {
                        	tooltip: '',
                        	text: 'Avbryt',
                        	handler: function () {
                        		msgBox.close();
                        		app.mySkeletonWindow.setActiveItem(0);

                        	}
                        }
			]
			var msgBox = createDialog('Öppna fyser', "Registret stödjer inte klassificering av barnfrakturer för denna skelettdel. Om du anser att frakturen ändå kan klassas i vuxenklassificeringen klicka på Fortsätt. Är frakturen en uttalad barnfraktur klicka på Ej klassificerad barnfraktur.", dialogitems, true);
			msgBox.show();
			return;
		}

		var sideLetter = "";
		var sideText = "";
		/*var infoTextA1 = "";
        var infoTextA2 = "";
        var infoTextA3 = "";
        var infoTextA4 = "";
        var infoTextA5 = "";
        var infoTextA6 = "";
        var infoTextB1 = "";
        var infoTextB2 = "";
        var infoTextB3 = "";
        var infoTextB4 = "";
        var infoTextB5 = "";
        var infoTextB6 = "";
        var infoTextC1 = "";
        var infoTextC2 = "";
        var infoTextC3 = "";
        var infoTextC4 = "";
        var infoTextC5 = "";
        var infoTextC6 = "";*/
		var infoTexts = createInfoTextMatrix();

		aoImagesNavigationHandler.pictureID = aPictureID;
		aoImagesNavigationHandler.side = aSide;

		sideLetter = getSideLetter(aSide);
		if (aSide == 1) {
			sideText = "Höger";
		}
		if (aSide == 2) {
			sideText = "Vänster";
		}
		var displayMatrix;
		var aoMatrix;
		var picIDStr = aPictureID + '-';
		if (aoImagesNavigationHandler.inHandMode) {
			picIDStr = getHandAOnrFromPictureID(aPictureID) + '-';
		}
		onLoadAOImages.isolatedFibulaFractureAO = '4X';
		var buttons = aoPanel.getDockedComponent(1);
		switchPelvisSideBtn = getButtonByName('pelvisRingSideSwitcher', buttons);
		switchPelvisSideBtn.setVisible(false);
		if (aoImagesNavigationHandler.inProsthesisMode) {
			var prosthConfig = getProsthesisClassificationConfig(aPictureID);
			displayMatrix = prosthConfig[0];
			aoMatrix = prosthConfig[1];
		}
		else if (aPictureID == '9') {
			displayMatrix = createDisplayMatrix(3, 4);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '1A1';
			aoMatrix[0][1] = '1B1';
			aoMatrix[0][2] = '1A2';
			aoMatrix[0][3] = '1B2';
			aoMatrix[1][0] = '2A1';
			aoMatrix[1][1] = '2A2';
			aoMatrix[1][2] = '2B1';
			aoMatrix[1][3] = '2B2';
			aoMatrix[2][0] = '3A1';
			aoMatrix[2][1] = '3B1';
			aoMatrix[2][2] = '3A2';
			aoMatrix[2][3] = '3B2';
			picIDStr = '-';
		}
		else if (aPictureID == '10') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][4] = displayMatrix[2][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[0][1] = 'B1';
			aoMatrix[0][2] = 'B2';
			aoMatrix[0][3] = 'B3';
			aoMatrix[0][4] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'C1';
			aoMatrix[1][1] = 'C2';
			aoMatrix[1][2] = 'D1a';
			aoMatrix[1][3] = 'D1b';
			aoMatrix[2][0] = 'D2a';
			aoMatrix[2][1] = 'D2b';
			aoMatrix[2][2] = 'D2c';
			aoMatrix[2][3] = 'D3';
			picIDStr = '-';
		}
		else if (aPictureID == '11') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][1] = 'A1.3';
			aoMatrix[0][2] = 'A2';
			aoMatrix[0][3] = 'A3';
			aoMatrix[0][4] = PROSTHESIS_FRACTURE;
			aoMatrix[2][2] = 'C2.3';
			aoMatrix[2][3] = 'C3';
			aoMatrix[2][4] = 'C3.1';
		}
		else if (aPictureID == '11-P') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '11-E/1.1';
			aoMatrix[0][1] = '11-E/2.1';
			aoMatrix[0][2] = '11-E/3.1';
			aoMatrix[1][0] = '11-E/4.1';
			aoMatrix[1][1] = '11-E/8.1';
			aoMatrix[2][0] = '11-M/2.1';
			aoMatrix[2][1] = '11-M/3.1';
			aoMatrix[2][2] = '11-M/3.2';
		}
		else if (aPictureID == '12') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '12-D') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][2] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '12-D/4.1';
			aoMatrix[0][1] = '12-D/5.1';
			aoMatrix[1][0] = '12-D/4.2';
			aoMatrix[1][1] = '12-D/5.2';
		}
		else if (aPictureID == '13') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '13-E') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][2] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '13-E/1.1';
			aoMatrix[0][1] = '13-E/2.1';
			aoMatrix[0][2] = '13-E/3.1/2';
			aoMatrix[1][0] = '13-E/4.1';
			aoMatrix[1][1] = '13-E/4.2';
			aoMatrix[2][0] = '13-E/7-l';
			aoMatrix[2][1] = '13-E/8.1/2';
		}
		else if (aPictureID == '13-M') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '13-M/3.1-I';
			aoMatrix[0][1] = '13-M/3.1-II';
			aoMatrix[0][2] = '13-M/3.1-III-IV';
			aoMatrix[1][1] = '13-M/3.2-II';
			aoMatrix[1][2] = '13-M/3.2-III-IV';
			aoMatrix[2][0] = '13-M/7m';
		}
		else if (aPictureID == '21-A') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[2][1] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '1';
			aoMatrix[0][1] = '2';
			aoMatrix[0][2] = '3';
			aoMatrix[1][0] = '4';
			aoMatrix[1][1] = '5';
			aoMatrix[1][2] = '6';
			aoMatrix[2][0] = PROSTHESIS_FRACTURE;
			aoMatrix[2][2] = '0';
			sideLetter = '';
			picIDStr = '-';
		}
		else if (aPictureID == '21-ME') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '21r-E/1.1-I';
			aoMatrix[0][1] = '21r-E/2.1-I';
			aoMatrix[0][2] = '21r-E/3.1';
			aoMatrix[0][3] = '21r-E/4.1';
			aoMatrix[0][4] = '21r-M/2.1/3.1-I';
			aoMatrix[1][0] = '21r-E/1.1-II';
			aoMatrix[1][1] = '21r-E/2.1-II'
			aoMatrix[1][2] = '21r-E/3.1-I'
			aoMatrix[1][3] = '21r-E/4.1-II'
			aoMatrix[1][4] = '21r-M/3.1-II'
			aoMatrix[2][0] = '21r-E/1.1-III';
			aoMatrix[2][1] = '21r-E/2.1-III';
			aoMatrix[2][3] = '0';
			aoMatrix[2][4] = '21r-M/3.1-III';
		}
		else if (aPictureID == '21-B') {
			var displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][2] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '1';
			aoMatrix[0][1] = '2';
			aoMatrix[0][2] = '3';
			aoMatrix[0][3] = '4';
			aoMatrix[1][0] = '5';
			aoMatrix[1][1] = '6';
			aoMatrix[1][2] = '7';
			aoMatrix[2][0] = '8';
			aoMatrix[2][1] = '9';
			aoMatrix[2][3] = '0';
			sideLetter = '';
			picIDStr = '-';
		}
		else if (aPictureID == '21-U') {
			var displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '21u-M/2.1';
			aoMatrix[0][1] = '21u-M/3.1';
			aoMatrix[0][2] = '21u-M/3.2';
			aoMatrix[0][3] = '21u-M/7';
			aoMatrix[1][0] = '21u-5';
			aoMatrix[1][1] = '21u-6';
			aoMatrix[1][2] = '21u-7';
			aoMatrix[2][0] = '21u-M/6.1';
			aoMatrix[2][3] = '0';
		}
		else if (aPictureID == '22') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][1] = 'A1.3';
			aoMatrix[0][2] = 'A2';
			aoMatrix[0][3] = 'A2.3';
			aoMatrix[0][4] = 'A3';

			aoMatrix[1][1] = 'B1.3';
			aoMatrix[1][2] = 'B2';
			aoMatrix[1][3] = 'B2.3';
			aoMatrix[1][4] = 'B3';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '22-D') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[0][3] = displayMatrix[1][4] = displayMatrix[2][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '22-D/1.1';
			aoMatrix[0][1] = '22-D/2.1';
			aoMatrix[0][2] = '22-D/5.1';
			aoMatrix[0][4] = '22r-D/5.1-22u-D/1.1';
			aoMatrix[1][0] = '22r-D/1.1';
			aoMatrix[1][1] = '22r-D/2.1';
			aoMatrix[1][2] = '22r-D/5.1';
			aoMatrix[1][3] = '22r-D/7.1';
			aoMatrix[2][0] = '22u-D/1.1';
			aoMatrix[2][1] = '22u-D/2.1';
			aoMatrix[2][2] = '22u-D/5.1';
			aoMatrix[2][3] = '22u-D/6.1';
		}
		else if (aPictureID == '23') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][1] = 'A2.1';
			aoMatrix[0][2] = 'A2.2';
			aoMatrix[0][3] = 'A2.3';
			aoMatrix[0][4] = 'A3';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '23-M') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][1] = displayMatrix[1][3] = displayMatrix[2][1] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '23-M/2.1';
			aoMatrix[0][1] = '23r-M/2.1-23u-E/7';
			aoMatrix[0][2] = '23-M/3.1';
			aoMatrix[0][3] = '23r-M/2.1-23u-M/3.1';
			aoMatrix[1][0] = '23r-M/2.1';
			aoMatrix[1][2] = '23r-M/3.1';
			aoMatrix[2][0] = '23u-M/2.1';
			aoMatrix[2][2] = '23u-M/3.1';
		}
		else if (aPictureID == '23-E') {
			displayMatrix = createDisplayMatrix(3, 6);
			displayMatrix[1][5] = displayMatrix[2][5] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '23-E/1.1';
			aoMatrix[0][1] = '23-E/2.1';
			aoMatrix[0][2] = '23-E/3.1';
			aoMatrix[0][3] = '23-E/4.1';
			aoMatrix[0][4] = '23-E/7';
			aoMatrix[0][5] = '23r-E/2.1-23u-E/7';
			aoMatrix[1][0] = '23r-E/1';
			aoMatrix[1][1] = '23r-E/2.1';
			aoMatrix[1][2] = '23r-E/3';
			aoMatrix[1][3] = '23r-E/4.1';
			aoMatrix[1][4] = '23r-E/7';
			aoMatrix[2][0] = '23u-E/1.1';
			aoMatrix[2][1] = '23u-E/2.1';
			aoMatrix[2][2] = '23u-E/3';
			aoMatrix[2][3] = '23u-E/4.1';
			aoMatrix[2][4] = '23u-E/7';
		}
		else if (aPictureID == '31') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = displayMatrix[2][1] = displayMatrix[2][2] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();

			aoMatrix[0][0] = 'A1';
			aoMatrix[0][1] = 'A2.1';
			aoMatrix[0][2] = 'A2.2';
			aoMatrix[0][3] = 'A2.3';
			aoMatrix[0][4] = 'A3';

			aoMatrix[1][0] = 'B1';
			aoMatrix[1][1] = 'B2';
			aoMatrix[1][2] = 'B3';

			aoMatrix[2][0] = 'C1';

			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '31-E') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][2] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '31-E/1.1';
			aoMatrix[0][1] = '31-E/7';
			aoMatrix[1][0] = '31-E/2.1';
			aoMatrix[1][1] = '31-E/8.1';
		}
		else if (aPictureID == '31-M') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[0][3] = displayMatrix[0][4] = displayMatrix[1][3] = displayMatrix[1][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '31-M/2.1-I';
			aoMatrix[0][1] = '31-M/3.1-I';
			aoMatrix[0][2] = '31-M/3.2-I';
			aoMatrix[1][0] = '31-M/2.1-II';
			aoMatrix[1][1] = '31-M/3.1-II';
			aoMatrix[1][2] = '31-M/3.2-II';
			aoMatrix[2][0] = '31-M/2.1-III';
			aoMatrix[2][1] = '31-M/3.1-III';
			aoMatrix[2][2] = '31-M/3.2-III';
			aoMatrix[2][3] = '31-M/7-I';
			aoMatrix[2][4] = '31-M/7-II';
		}
		else if (aPictureID == '32') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][3] = displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '32-D') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][2] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '32-D/4.1';
			aoMatrix[0][1] = '32-D/5.1';
			aoMatrix[1][0] = '32-D/4.2';
			aoMatrix[1][1] = '32-D/5.2';
		}
		else if (aPictureID == '33') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][3] = displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '33-M') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[1][3] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '33-M/2.1';
			aoMatrix[0][1] = '33-M/3.1';
			aoMatrix[0][2] = '33-M/3.2';
			aoMatrix[0][3] = '33-M/7';
		}
		else if (aPictureID == '33-E') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][0] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = displayMatrix[2][3] = displayMatrix[2][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '33-E/1.1';
			aoMatrix[0][1] = '33-E/2.1';
			aoMatrix[0][2] = '33-E/3.1';
			aoMatrix[0][3] = '33-E/4.1';
			aoMatrix[0][4] = '33-E/8.1';
			aoMatrix[1][1] = '33-E/2.2';
			aoMatrix[1][2] = '33-E/3.2';
			aoMatrix[1][3] = '33-E/4.2';
			aoMatrix[1][4] = '33-E/8.2';
		}
		else if (aPictureID == '34') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '41') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[0][3] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[1][0] = 'B1.1';
			aoMatrix[1][1] = 'B1.2';
			aoMatrix[1][2] = 'B1.3';
			aoMatrix[1][3] = 'B2';
			aoMatrix[1][4] = 'B3';
			aoMatrix[0][4] = PROSTHESIS_FRACTURE;
			aoMatrix[2][4] = onLoadAOImages.isolatedFibulaFractureAO;
		}
		else if (aPictureID == '41-E') {
			displayMatrix = createDisplayMatrix(4, 4);
			displayMatrix[0][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '41t-E/1.1';
			aoMatrix[0][1] = '41t-E/2.1';
			aoMatrix[0][2] = '41t-E/2.2';
			aoMatrix[1][0] = '41t-E/3.1';
			aoMatrix[1][1] = '41t-E/3.2';
			aoMatrix[1][2] = '41t-E/4.1';
			aoMatrix[1][3] = '41t-E/4.2';
			aoMatrix[2][0] = '41t-E/7';
			aoMatrix[2][1] = '41t-E/8.1';
			aoMatrix[2][2] = '41t-M/7';
			aoMatrix[2][3] = onLoadAOImages.isolatedFibulaFractureAO;
		}
		else if (aPictureID == '41-M') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '41-M/2.1';
			aoMatrix[0][1] = '41-M/3.1';
			aoMatrix[0][2] = '41-M/3.2';
			aoMatrix[1][0] = '41t-M/2.1';
			aoMatrix[1][1] = '41t-M/3.1';
			aoMatrix[1][2] = '41t-M/3.2';
			aoMatrix[2][0] = onLoadAOImages.isolatedFibulaFractureAO;
		}
		else if (aPictureID == '42') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[2][3] = onLoadAOImages.isolatedFibulaFractureAO;
			aoMatrix[0][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '43') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '42-D') {
			displayMatrix = createDisplayMatrix(3, 6);
			displayMatrix[2][1] = displayMatrix[2][2] = displayMatrix[2][3] = displayMatrix[2][4] = displayMatrix[2][5] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '42-D/1.1';
			aoMatrix[0][1] = '42-D/2.1';
			aoMatrix[0][2] = '42-D/4.1';
			aoMatrix[0][3] = '42-D/4.2';
			aoMatrix[0][4] = '42-D/5.1';
			aoMatrix[0][5] = '42-D/5.2';
			aoMatrix[1][0] = '42t-D/1.1';
			aoMatrix[1][1] = '42t-D/2.1';
			aoMatrix[1][2] = '42t-D/4.1';
			aoMatrix[1][3] = '42t-D/4.2';
			aoMatrix[1][4] = '42t-D/5.1';
			aoMatrix[1][5] = '42t-D/5.2';
			aoMatrix[2][0] = onLoadAOImages.isolatedFibulaFractureAO;
		}
		else if (aPictureID == '43t-E') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '43t-E/1.1';
			aoMatrix[0][1] = '43t-E/2.1';
			aoMatrix[0][2] = '43t-E/2.2';
			aoMatrix[1][0] = '43t-E/3.1';
			aoMatrix[1][1] = '43t-E/4.1';
			aoMatrix[1][2] = '43t-E/4.2';
			aoMatrix[2][0] = '43t-E/5.1';
			aoMatrix[2][1] = '43t-E/6.1';
			aoMatrix[2][2] = '43t-E/8.1';
		}
		else if (aPictureID == '43f-E') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '43f-E/1.1';
			aoMatrix[0][1] = '43f-E/2.1';
			aoMatrix[0][2] = '43f-E/3.1';
			aoMatrix[1][0] = '43f-E/4.1';
			aoMatrix[1][1] = '43f-E/7';
			aoMatrix[1][2] = '43f-E/8.1';
		}
		else if (aPictureID == '43-E') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[1][3] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '43-E/1.1';
			aoMatrix[0][1] = '43-E/2.1';
			aoMatrix[0][2] = '43-E/3.1';
			aoMatrix[0][3] = '43-E/4.1';

		}
		else if (aPictureID == '43-M') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '43-M/2.1';
			aoMatrix[0][1] = '43-M/3.1';
			aoMatrix[0][2] = '43-M/3.2';
			aoMatrix[1][0] = '43t-M/2.1';
			aoMatrix[1][1] = '43t-M/3.1';
			aoMatrix[1][2] = '43t-M/3.2';
			aoMatrix[2][0] = '43f-M/2.1';
			aoMatrix[2][1] = '43f-M/3.1';
			aoMatrix[2][2] = '43f-M/3.2';
		}
		else if (aPictureID == '44') {
			displayMatrix = createDisplayMatrix(3, 6);
			displayMatrix[0][5] = displayMatrix[2][3] = displayMatrix[2][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A1';
			aoMatrix[0][1] = 'A2.1/2';
			aoMatrix[0][2] = 'A2.3';
			aoMatrix[0][3] = 'A3.1/2';
			aoMatrix[0][4] = 'A3.3';

			aoMatrix[1][0] = 'B1.1';
			aoMatrix[1][1] = 'B1.2/3';
			aoMatrix[1][2] = 'B2.1';
			aoMatrix[1][3] = 'B2.2/3';
			aoMatrix[1][4] = 'B3.1';
			aoMatrix[1][5] = 'B3.2/3';

			aoMatrix[2][0] = 'C1';
			aoMatrix[2][1] = 'C2';
			aoMatrix[2][2] = 'C3';

			aoMatrix[2][5] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '61') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][0] = displayMatrix[0][1] = displayMatrix[0][2] = false;
			aoMatrix = createAoMatrix();
			switchPelvisSideBtn.setVisible(true);
			if (aSide == 1) {
				switchPelvisSideBtn.setText('<b>Visa vänsterbilder</b>');
				switchPelvisSideBtn.setHandler(Ext.bind(onLoadAOImages, this, ['61', 2], false));
			}
			else {
				switchPelvisSideBtn.setText('<b>Visa högerbilder</b>');
				switchPelvisSideBtn.setHandler(Ext.bind(onLoadAOImages, this, ['61', 1], false));
			}
		}
		else if (aPictureID == '62') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][4] = displayMatrix[2][1] = displayMatrix[2][2] = displayMatrix[2][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][1] = 'A2.1/2';
			aoMatrix[0][2] = 'A2.3';
			aoMatrix[0][3] = 'A3.1';
			aoMatrix[0][4] = 'A3.2/3';
			aoMatrix[1][0] = 'B1.1/2';
			aoMatrix[1][1] = 'B1.3';
			aoMatrix[1][2] = 'B2';
			aoMatrix[1][3] = 'B3';
			aoMatrix[2][0] = 'C';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '81') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][3] = displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '82') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][3] = displayMatrix[1][2] = displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
		}
		else if (aPictureID == '83') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[1][0] = 'B';
		}
		else if (aPictureID == '84') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[1][0] = 'B';
			codePrefixText = codePrefixText + '-';
		}
		else if (aPictureID == '85') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][3] = displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
		}
		else if (aPictureID == '87') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[1][0] = 'B';
			aoMatrix[2][0] = 'C';
		}
		else if (aPictureID == '88') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[1][0] = 'B';
			aoMatrix[2][0] = 'C';
		}
		else if (aPictureID == '71') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[0][1] = 'B';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '72') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][0] = displayMatrix[0][2] = displayMatrix[2][0] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = '';
			aoMatrix[0][2] = '';
			aoMatrix[0][1] = 'A3';
			aoMatrix[0][3] = 'A2(0)';
			aoMatrix[1][0] = 'A2(1)';
			aoMatrix[1][1] = 'A2(2)';
			aoMatrix[1][2] = 'A1';
			aoMatrix[1][3] = 'A2(L)';
			aoMatrix[2][1] = 'A(D)';
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '73') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[0][1] = 'B';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '74') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A(1)';
			aoMatrix[0][1] = 'A(2)';
			aoMatrix[0][2] = 'B';
			aoMatrix[1][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '75T') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2';
			aoMatrix[0][1] = 'B2';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '75P') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A1';
			aoMatrix[0][1] = 'B1';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '76T1') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A1';
			aoMatrix[0][1] = 'B1';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '76T2') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2';
			aoMatrix[0][1] = 'B2';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '77N') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3-N';
			aoMatrix[0][1] = 'C3-N';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-N';
			aoMatrix[1][1] = 'A2.2-N';
			aoMatrix[1][2] = 'C2.2-N';
			aoMatrix[2][0] = 'B1.1-N';
			aoMatrix[2][1] = 'B1.2-N';
			aoMatrix[2][2] = 'B1.3-N';
		}
		else if (aPictureID == '77M') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3-M';
			aoMatrix[0][1] = 'C3-M';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-M';
			aoMatrix[1][1] = 'A2.2-M';
			aoMatrix[1][2] = 'C2.2-M';
			aoMatrix[2][0] = 'B1.1-M';
			aoMatrix[2][1] = 'B1.2-M';
			aoMatrix[2][2] = 'B1.3-M';
		}
		else if (aPictureID == '77R') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3-R';
			aoMatrix[0][1] = 'C3-R';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-R';
			aoMatrix[1][1] = 'A2.2-R';
			aoMatrix[1][2] = 'C2.2-R';
			aoMatrix[2][0] = 'B1.1-R';
			aoMatrix[2][1] = 'B1.2-R';
			aoMatrix[2][2] = 'B1.3-R';
		}
		else if (aPictureID == '77L') {
			displayMatrix = createDisplayMatrix(3, 3);

			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3-L';
			aoMatrix[0][1] = 'C3-L';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-L';
			aoMatrix[1][1] = 'A2.2-L';
			aoMatrix[1][2] = 'C2.2-L';
			aoMatrix[2][0] = 'B1.1-L';
			aoMatrix[2][1] = 'B1.2-L';
			aoMatrix[2][2] = 'B1.3-L';
		}
		else if (aPictureID == '78N1') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3.1-N1';
			aoMatrix[0][1] = 'A3.2-N1';
			aoMatrix[0][2] = 'B3.1(1-2)-N1';
			aoMatrix[0][3] = 'B3.1(3)-N1';
			aoMatrix[0][4] = 'C3-N1';
			aoMatrix[1][0] = 'A2.3-N1';
			aoMatrix[1][1] = 'A2.1-N1';
			aoMatrix[1][2] = 'C2-N1';
			aoMatrix[2][0] = 'A1.1-N1';
			aoMatrix[2][1] = 'A1.2-N1';
			aoMatrix[2][2] = 'B1-N1';
			aoMatrix[2][3] = 'C1-N1';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78M1') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3.1-M1';
			aoMatrix[0][1] = 'A3.2-M1';
			aoMatrix[0][2] = 'B3.1(1-2)-M1';
			aoMatrix[0][3] = 'B3.1(3)-M1';
			aoMatrix[0][4] = 'C3-M1';
			aoMatrix[1][0] = 'A2.3-M1';
			aoMatrix[1][1] = 'A2.1-M1';
			aoMatrix[1][2] = 'C2-M1';
			aoMatrix[2][0] = 'A1.1-M1';
			aoMatrix[2][1] = 'A1.2-M1';
			aoMatrix[2][2] = 'B1-M1';
			aoMatrix[2][3] = 'C1-M1';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78R1') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3.1-R1';
			aoMatrix[0][1] = 'A3.2-R1';
			aoMatrix[0][2] = 'B3.1(1-2)-R1';
			aoMatrix[0][3] = 'B3.1(3)-R1';
			aoMatrix[0][4] = 'C3-R1';
			aoMatrix[1][0] = 'A2.3-R1';
			aoMatrix[1][1] = 'A2.1-R1';
			aoMatrix[1][2] = 'C2-R1';
			aoMatrix[2][0] = 'A1.1-R1';
			aoMatrix[2][1] = 'A1.2-R1';
			aoMatrix[2][2] = 'B1-R1';
			aoMatrix[2][3] = 'C1-R1';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78L1') {
			displayMatrix = createDisplayMatrix(3, 5);
			displayMatrix[1][3] = displayMatrix[1][4] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3.1-L1';
			aoMatrix[0][1] = 'A3.2-L1';
			aoMatrix[0][2] = 'B3.1(1-2)-L1';
			aoMatrix[0][3] = 'B3.1(3)-L1';
			aoMatrix[0][4] = 'C3-L1';
			aoMatrix[1][0] = 'A2.3-L1';
			aoMatrix[1][1] = 'A2.1-L1';
			aoMatrix[1][2] = 'C2-L1';
			aoMatrix[2][0] = 'A1.1-L1';
			aoMatrix[2][1] = 'A1.2-L1';
			aoMatrix[2][2] = 'B1-L1';
			aoMatrix[2][3] = 'C1-L1';
			aoMatrix[2][4] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78N2') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'B3-N2';
			aoMatrix[0][1] = 'C3-N2';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-N2';
			aoMatrix[1][1] = 'A2.1-N2';
			aoMatrix[1][2] = 'C2-N2';
			aoMatrix[2][0] = 'B1.1(1-2)-N2';
			aoMatrix[2][1] = 'C1-N2';
			aoMatrix[2][2] = 'B1.1(3)-N2';
		}
		else if (aPictureID == '78M2') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'B3-M2';
			aoMatrix[0][1] = 'C3-M2';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-M2';
			aoMatrix[1][1] = 'A2.1-M2';
			aoMatrix[1][2] = 'C2-M2';
			aoMatrix[2][0] = 'B1.1(1-2)-M2';
			aoMatrix[2][1] = 'C1-M2';
			aoMatrix[2][2] = 'B1.1(3)-M2';
		}
		else if (aPictureID == '78R2') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'B3-R2';
			aoMatrix[0][1] = 'C3-R2';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-R2';
			aoMatrix[1][1] = 'A2.1-R2';
			aoMatrix[1][2] = 'C2-R2';
			aoMatrix[2][0] = 'B1.1(1-2)-R2';
			aoMatrix[2][1] = 'C1-R2';
			aoMatrix[2][2] = 'B1.1(3)-R2';
		}
		else if (aPictureID == '78L2') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'B3-L2';
			aoMatrix[0][1] = 'C3-L2';
			aoMatrix[0][2] = PROSTHESIS_FRACTURE;
			aoMatrix[1][0] = 'A2.3-L2';
			aoMatrix[1][1] = 'A2.1-L2';
			aoMatrix[1][2] = 'C2-L2';
			aoMatrix[2][0] = 'B1.1(1-2)-L2';
			aoMatrix[2][1] = 'C1-L2';
			aoMatrix[2][2] = 'B1.1(3)-L2';
		}
		else if (aPictureID == '78N3') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2.3-N3';
			aoMatrix[0][1] = 'A2.1-N3';
			aoMatrix[0][2] = 'C2-N3';
			aoMatrix[0][3] = 'A1.1(4)-N3';
			aoMatrix[1][0] = 'A1.2(4)-N3';
			aoMatrix[1][1] = 'A1.4(4)-N3';
			aoMatrix[1][2] = 'A1.3(4)-N3';
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78M3') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2.3-M3';
			aoMatrix[0][1] = 'A2.1-M3';
			aoMatrix[0][2] = 'C2-M3';
			aoMatrix[0][3] = 'A1.1(4)-M3';
			aoMatrix[1][0] = 'A1.2(4)-M3';
			aoMatrix[1][1] = 'A1.4(4)-M3';
			aoMatrix[1][2] = 'A1.3(4)-M3';
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78R3') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2.3-R3';
			aoMatrix[0][1] = 'A2.1-R3';
			aoMatrix[0][2] = 'C2-R3';
			aoMatrix[0][3] = 'A1.1(4)-R3';
			aoMatrix[1][0] = 'A1.2(4)-R3';
			aoMatrix[1][1] = 'A1.4(4)-R3';
			aoMatrix[1][2] = 'A1.3(4)-R3';
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78L3') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][3] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2.3-L3';
			aoMatrix[0][1] = 'A2.1-L3';
			aoMatrix[0][2] = 'C2-L3';
			aoMatrix[0][3] = 'A1.1(4)-L3';
			aoMatrix[1][0] = 'A1.2(4)-L3';
			aoMatrix[1][1] = 'A1.4(4)-L3';
			aoMatrix[1][2] = 'A1.3(4)-L3';
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78T2') {
			displayMatrix = createDisplayMatrix(2, 4);
			displayMatrix[1][0] = displayMatrix[1][1] = displayMatrix[1][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A2.3-T2';
			aoMatrix[0][1] = 'A2.1-T2';
			aoMatrix[0][2] = 'C2-T2';
			aoMatrix[0][3] = 'A1.1(4)-T2';
			aoMatrix[1][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '78T1') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[0][3] = displayMatrix[1][3] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'B3.1-2-T1';
			aoMatrix[0][1] = 'B3.1(3)-T1';
			aoMatrix[0][2] = 'C3-T1';
			aoMatrix[1][0] = 'A2.3-T1';
			aoMatrix[1][1] = 'A2.1-T1';
			aoMatrix[1][2] = 'C2-T1';
			aoMatrix[2][0] = 'B1-T1';
			aoMatrix[2][1] = 'C1-T1';
			aoMatrix[2][2] = 'B2-T1';
			aoMatrix[2][3] = PROSTHESIS_FRACTURE;
		}
		else if (aPictureID == '77T') {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A3-T';
			aoMatrix[0][1] = PROSTHESIS_FRACTURE;
			aoMatrix[0][2] = 'C3-T';
			aoMatrix[1][0] = 'A2.3-T';
			aoMatrix[1][1] = 'A2.1-2-T';
			aoMatrix[1][2] = 'B-C-T';
			aoMatrix[2][0] = 'A1-T';
			aoMatrix[2][1] = 'B1.1-T';
			aoMatrix[2][2] = 'C1-T';
		}
		else if (aPictureID == '100-C0') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][2] = displayMatrix[1][2] = displayMatrix[2][2] = displayMatrix[0][1] = displayMatrix[1][1] = displayMatrix[2][1] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'Typ-A';
			aoMatrix[1][0] = 'Typ-B';
			aoMatrix[2][0] = 'Typ-C';

		}
		else if (aPictureID == '100-C1') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[0][2] = displayMatrix[1][2] = displayMatrix[2][2] = displayMatrix[0][1] = displayMatrix[1][1] = displayMatrix[2][1] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A';
			aoMatrix[1][0] = 'B';
			aoMatrix[2][0] = 'C';

		}
		else if (aPictureID == '100-C2') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'AOD-Typ-I';
			aoMatrix[0][1] = 'AOD-Typ-II';
			aoMatrix[0][2] = 'AOD-Typ-III';
			aoMatrix[1][0] = 'ELE-Typ-I';
			aoMatrix[1][1] = 'ELE-Typ-II';
			aoMatrix[1][2] = 'ELE-Typ-III';

		}
		else if (aPictureID == '101') {
			displayMatrix = createDisplayMatrix(3, 4);
			displayMatrix[1][1] = displayMatrix[1][2] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'c-A';
			aoMatrix[0][1] = 'c-B';
			aoMatrix[0][2] = 'c-C';
			aoMatrix[0][3] = 'c-D';
			aoMatrix[1][0] = 'b-A';
			aoMatrix[1][3] = '0';
			aoMatrix[2][0] = 'd-A';
			aoMatrix[2][1] = 'd-B';
			aoMatrix[2][2] = 'd-C';
			aoMatrix[2][3] = 'd-D';

		}
		else if (aPictureID == '102') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			var aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'A1';
			aoMatrix[0][1] = 'A2';
			aoMatrix[0][2] = 'A3/4';
			aoMatrix[1][0] = 'C1';
			aoMatrix[1][1] = 'C2/3';
		}
		else if (aPictureID == '102b') {
			displayMatrix = createDisplayMatrix(3, 3);
			displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
			aoMatrix = createAoMatrix();
			aoMatrix[0][0] = 'B0';
			aoMatrix[0][1] = 'B1';
			aoMatrix[0][2] = 'B2';
			aoMatrix[1][0] = 'BX';
		}
		else {
			displayMatrix = createDisplayMatrix(3, 3);
			aoMatrix = createAoMatrix();
		}
		var codePrefixText = getFractureClassificationName(aPictureID);
		if (codePrefixText == 'OTA' || codePrefixText == 'MAO' || codePrefixText == 'AOR' || codePrefixText == 'SLI' || codePrefixText == 'UCS') {
			codePrefixText = codePrefixText + '-';
		}
		if (aoImagesNavigationHandler.isChildFracture === true) {
			picIDStr = '';
		}
		var i = 0;
		var classCode = '';
		var domainIDs = new Array();
		var codePrefixTextPicIDstr = '';
		if (aPictureID == '21-A') {
			domainIDs.push('4158');
		}
		else if (aPictureID == '21-B') {
			if (aoImagesNavigationHandler.inProsthesisMode == true) {
				codePrefixTextPicIDstr = codePrefixText;
				domainIDs.push('4060');
			}
			else {
				domainIDs.push('4159');
			}
		}
		else if (aPictureID == '21-ME') {
			domainIDs.push('5620');
		}
		else if (aPictureID == '21-U') {
			domainIDs.push('5621');
		}
		else if (aPictureID == '100-C2') {
			domainIDs.push('4060');
			codePrefixTextPicIDstr = '';
		}
		else if (aPictureID == '101') {
			domainIDs.push('4060');
			codePrefixTextPicIDstr = codePrefixText;
		}
		else if (aPictureID == '102') {
			domainIDs.push('5572');
			domainIDs.push('4060');
			codePrefixTextPicIDstr = codePrefixText;
		}
		else if (aPictureID == '102b') {
			domainIDs.push('5573');
			domainIDs.push('4060');
			codePrefixTextPicIDstr = codePrefixText;
		}
		else {
			domainIDs.push('4060');
			codePrefixTextPicIDstr = codePrefixText;
			if (!aoImagesNavigationHandler.inProsthesisMode) {
				codePrefixTextPicIDstr += picIDStr;
			}
		}
		var d = 0;
		var domainID = '';
		for (d = 0; d < domainIDs.length; d++) {
			domainID = domainIDs[d];
			if(!app.myRegisterDomains[domainID])continue;
			for (i = 0; i < app.myRegisterDomains[domainID].DomainValues.length; i++) {
				classCode = app.myRegisterDomains[domainID].DomainValues[i].ValueCode;
				classText = app.myRegisterDomains[domainID].DomainValues[i].ValueName;
				//Remove all "extrainfo" suffixes (kärlpåverkan, nervpåverkan, felställning) to get the original AO-code.            
				if (aoImagesNavigationHandler.isChildFracture === true) {
					classCode = classCode.replace(ChildClassChars.NERV + '0', '').replace(ChildClassChars.VESSEL + '0', '').replace(ChildClassChars.FELSTALLNING + '0', '').replace(ChildClassChars.CAPUT + '0', '');
				}
				var j = 0;
				for (j = 0; j < 10; j++) {
					var k = 0;
					for (k = 0; k < 10; k++) {
						if (aoMatrix[j][k] == PROSTHESIS_FRACTURE) {
							var lbreak = '\r\n';
							infoTexts[j][k] = 'Klassificeras enl. UCS. Vancouverklassifikationen för höftproteser har här utvecklats till att gälla för frakturer nära samtliga protestyper. Variabler som vägs samman är relation till protes/-er, benkvalitet och ifall protesen är lös.' + lbreak + lbreak + 'Då klassifikationen baseras på relationen till en proteskomponent automatgenereras inte S-koden för de bensegment där flera är möjliga utan sätts separat.' + lbreak + lbreak + 'M-koden är den diagnoskod som är specifik för protesnära fraktur i resp. ben (nere till vänster på frakturpanelen).';
						}
						else if (classCode == codePrefixTextPicIDstr + aoMatrix[j][k]) {
							infoTexts[j][k] = classText + ' ' + sideText;

							if (j == 0 && k == 0 && aPictureID == '61') {
								infoTexts[j][k] = classText;
							}
							else if (j == 2 && k == 2 && aPictureID == '61') {
								infoTexts[j][k] = classText;
							}
							else if (j == 2 && k == 1 && aPictureID == '61') {
								infoTexts[j][k] = classText + ' ' + sideText;
								var otherSideText = 'Höger';
								if (sideText === 'Höger')
									otherSideText = 'Vänster';
								infoTexts[j][k] = classText.replace('ena sidan', sideText).replace('andra sidan', otherSideText);
							}
						}
					}
				}
				/*for(
                switch (classCode) {
                    case (codePrefixTextPicIDstr + aoMatrix[0][0]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[0][1]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[0][2]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[0][3]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[0][4]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[0][5]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[1][0]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[1][1]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[1][2]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        if (aPictureID == '61')
                            infoTexts[0][0] = classText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[1][3]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[1][4]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[1][5]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[2][0]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[2][1]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        if (aPictureID == '61') {
                            var otherSideText = 'Höger';
                            if (sideText === 'Höger')
                                otherSideText = 'Vänster';
                            infoTextC2 = classText.replace('ena sidan', sideText).replace('andra sidan', otherSideText);
                        }
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[2][2]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        if (aPictureID == '61') {
                            infoTextC3 = classText;
                        }
                        break;
                    case (codePrefixTextPicIDstr + aoMatrix[2][3]):
                        infoTexts[0][0] = classText + ' ' + sideText;
                        break;

                    case (codePrefixTextPicIDstr + aoMatrix[2][4]):
                        infoTexts[2][4] = classText + ' ' + sideText;
                        break;

                    case (codePrefixTextPicIDstr + aoMatrix[2][5]):
                        infoTexts[2][5] = classText + ' ' + sideText;
                        break;
                }*/
			}
		}



		if (sideLetter != '') {
			sideLetter = '-' + sideLetter;
		}
		var p = aPictureID;
		if (aoImagesNavigationHandler.inProsthesisMode) {
			p = getProsthesisClassificationPictureID(aPictureID);
		}
		var data = {
			image: "https://stratum.blob.core.windows.net/sfr/Images/Assembled/AO-" + p + sideLetter + ".png?v=5",
			side: aSide,
			PictureId: aPictureID,
			windowId: app.mySkeletonWindow.id,
			infoTextA1: infoTexts[0][0],
			infoTextA2: infoTexts[0][1],
			infoTextA3: infoTexts[0][2],
			infoTextA4: infoTexts[0][3],
			infoTextA5: infoTexts[0][4],
			infoTextA6: infoTexts[0][5],
			infoTextB1: infoTexts[1][0],
			infoTextB2: infoTexts[1][1],
			infoTextB3: infoTexts[1][2],
			infoTextB4: infoTexts[1][3],
			infoTextB5: infoTexts[1][4],
			infoTextB6: infoTexts[1][5],
			infoTextC1: infoTexts[2][0],
			infoTextC2: infoTexts[2][1],
			infoTextC3: infoTexts[2][2],
			infoTextC4: infoTexts[2][3],
			infoTextC5: infoTexts[2][4],
			infoTextC6: infoTexts[2][5]
		};
		var currentFracturePanelID = null;
		
		var tplContent = null;
		//if (Ext.isEmpty(gotoPicID)) {
		tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, aoImagesNavigationHandler.inHandMode, aPictureID, gotoPicID);
		/*}
        else {
            tplContent=initAOtemplateSpecial(displayMatrix, aoMatrix, currentFracturePanelID,  gotoPicID);
        }*/
		var tplAO = new Ext.Template(tplContent);
		if (Ext.isEmpty(aTargetPanel)) {
			tplAO.overwrite(aoPanel.body, data);
		}
		else {
			tplAO.overwrite(aTargetPanel.body, data);
		}
	};

	aoImagesNavigationHandler = function (aBtn, aPictureID, aSide, aPseduoAO, aIsHandPartClick) {
		if(app.myRegisterDomains === {})return;
		onReturnCodes.foreArmRadiusAO = '';
		var skeletonPanel = app.mySkeletonWindow.items.items[0];
		var aoPanel = app.mySkeletonWindow.items.items[1];
		var pelvisPanel = app.mySkeletonWindow.items.items[2];
		var foreArmRadiusImages = app.mySkeletonWindow.items.items[3];
		var foreArmUlnaImages = app.mySkeletonWindow.items.items[4];
		var foreArmRadiusChildImages = app.mySkeletonWindow.items.items[14];
		var foreArmUlnaChildImages = app.mySkeletonWindow.items.items[15];
		var footPartImages = app.mySkeletonWindow.items.items[5];
		var childDistHumerusImages = app.mySkeletonWindow.items.items[7];
		var childDistForearmImages = app.mySkeletonWindow.items.items[16];
		var childProxTibiaImages = app.mySkeletonWindow.items.items[8];
		var childDistTibiaImages = app.mySkeletonWindow.items.items[9];
		var childProxFemurImages = app.mySkeletonWindow.items.items[10];
		var childDistFemurImages = app.mySkeletonWindow.items.items[11];
		var spinePanel = app.mySkeletonWindow.items.items[12];
		var spine102BImages = app.mySkeletonWindow.items.items[13];

		var vertebraC0Images = app.mySkeletonWindow.items.items[17];
		var vertebraC1Images = app.mySkeletonWindow.items.items[18];
		var vertebraC2Images = app.mySkeletonWindow.items.items[19];

		var handSkeleton = app.mySkeletonWindow.items.items[6];
		var prosthesisImages = app.mySkeletonWindow.items.items[20];

		var buttons = app.mySkeletonWindow.getDockedComponent(1);
		var nextBtn = getButtonByName('nextBtn', buttons);
		var previousBtn = getButtonByName('previousBtn', buttons);

		aoImagesNavigationHandler.goToProsthesisHandler = true;

		aoImagesNavigationHandler.inProsthesisMode = false;
		if (aPseduoAO !== null) {

			if (aPseduoAO == PROSTHESIS_FRACTURE) {
				aoImagesNavigationHandler.inProsthesisMode = true;

				nextBtn.setDisabled(true);
				onLoadAOImages(aPictureID, aSide, prosthesisImages, null);
				app.mySkeletonWindow.getLayout().setActiveItem(20);

				return;
				/*onLoadAOImages('21-U', aSide, foreArmUlnaChildImages);
                aoImagesNavigationHandler.pageNrStack.push(14);
                app.mySkeletonWindow.getLayout().setActiveItem(15);*/
			} else {
				onReturnCodes.foreArmRadiusAO = aPseduoAO;
			}

		}
		if (aoImagesNavigationHandler.toggleNavigationButton === undefined) {
			aoImagesNavigationHandler.toggleNavigationButton = function (pelvisPanel) {
				var pR = getCmpByName('prosthesisRight', pelvisPanel);
				var pL = getCmpByName('prosthesisLeft', pelvisPanel);
				var match = onPelvisClick.matchFoundForLightRingInjury(pelvisPanel) || onPelvisClick.matchFoundForSeriousRingInjury(pelvisPanel);
				if (match) {
					nextBtn.setDisabled(false);
					pR.setDisabled(false);
					pL.setDisabled(false);
				}
				else {
					nextBtn.setDisabled(true);
					pR.setDisabled(true);
					pL.setDisabled(true);
				}
			};
		}
		if (aoImagesNavigationHandler.pageNrStack === undefined || app.mySkeletonWindow.getLayout().getActiveItem() === app.mySkeletonWindow.items.items[0]) {
			aoImagesNavigationHandler.pageNrStack = new Array();
		}


		var aoTitleText = '';
		if (aBtn == null) //Skeleton click/AO-image click/handpart click
		{
			aoImagesNavigationHandler.inPelvisMode = false;
			aoImagesNavigationHandler.inHandMode = false;
			/*
			var infoTextA1Radius = getDomainValueName('4158', 1);
			var infoTextA2Radius = getDomainValueName('4158', 2);
			var infoTextA3Radius = getDomainValueName('4158', 3);
			var infoTextB1Radius = getDomainValueName('4158', 4);
			var infoTextB2Radius = getDomainValueName('4158', 5);
			var infoTextB3Radius = getDomainValueName('4158', 6);
			var infoTextC3Radius = getDomainValueName('4158', 0);
			var infoTextA1Ulna = getDomainValueName('4159', 1);
			var infoTextA2Ulna = getDomainValueName('4159', 2);
			var infoTextA3Ulna = getDomainValueName('4159', 3);
			var infoTextA4Ulna = getDomainValueName('4159', 4);
			var infoTextB1Ulna = getDomainValueName('4159', 5);
			var infoTextB2Ulna = getDomainValueName('4159', 6);
			var infoTextB3Ulna = getDomainValueName('4159', 7);
			var infoTextC1Ulna = getDomainValueName('4159', 8);
			var infoTextC2Ulna = getDomainValueName('4159', 9);
			var infoTextC4Ulna = getDomainValueName('4159', 0);
			*/
			if (aoImagesNavigationHandler.isChildFracture === true && aoImagesNavigationHandler.showNoChildFractureSupportAlert === false) {
				if (aPictureID == '44') {
					aPictureID = '43';
				}
				if (aPictureID == '11') {
					onLoadAOImages('11-P', aSide);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '12') {
					onLoadAOImages('12-D', aSide);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '13' && aPseduoAO === null) {
					var sideLetter = getSideLetter(aSide);
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-DistHumerus-" + sideLetter + ".png",
						side: aSide,
						PictureId: aPictureID,
						windowId: app.mySkeletonWindow.id,
						infoTextA1: 'Distala metafysen',
						infoTextA2: '',
						infoTextA3: '',
						infoTextA4: '',
						infoTextA5: '',
						infoTextB1: 'Distala epifysen',
						infoTextB2: '',
						infoTextB3: '',
						infoTextB4: '',
						infoTextB5: '',
						infoTextC1: '',
						infoTextC2: '',
						infoTextC3: '',
						infoTextC4: '',
						infoTextC5: ''
					};
					var displayMatrix = createDisplayMatrix(3, 3);
					displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
					var aoMatrix = createAoMatrix();
					currentFracturePanelID = null;
					var tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, false, aPictureID, '13');
					var tpl = new Ext.Template(tplContent);
					tpl.overwrite(childDistHumerusImages.body, data);
					app.mySkeletonWindow.getLayout().setActiveItem(7);
				}
				else if (aPictureID == '13') {
					var aoID;
					switch (aPseduoAO) {
						case 'A1':
							aoID = '13-M';
							break;
						case 'B1':
							aoID = '13-E';
							break;
					}
					onLoadAOImages(aoID, aSide);
					aoImagesNavigationHandler.pageNrStack.push(7);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '21') {
					onLoadAOImages('21-ME', aSide, foreArmRadiusChildImages, '21-U');
					app.mySkeletonWindow.getLayout().setActiveItem(14);
				}
				else if (aPictureID == '21-U') {
					onLoadAOImages('21-U', aSide, foreArmUlnaChildImages);
					aoImagesNavigationHandler.pageNrStack.push(14);
					app.mySkeletonWindow.getLayout().setActiveItem(15);
				}
				else if (aPictureID == '22') {
					onLoadAOImages('22-D', aSide);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '23' && aPseduoAO === null) {
					var sideLetter = getSideLetter(aSide);
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-DistForearm-" + sideLetter + ".png",
						side: aSide,
						PictureId: aPictureID,
						windowId: app.mySkeletonWindow.id,
						infoTextA1: 'Distala metafysen',
						infoTextA2: '',
						infoTextA3: '',
						infoTextA4: '',
						infoTextA5: '',
						infoTextB1: 'Distala epifysen',
						infoTextB2: '',
						infoTextB3: '',
						infoTextB4: '',
						infoTextB5: '',
						infoTextC1: '',
						infoTextC2: '',
						infoTextC3: '',
						infoTextC4: '',
						infoTextC5: ''
					};
					var displayMatrix = createDisplayMatrix(3, 3);
					displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
					var aoMatrix = createAoMatrix();
					currentFracturePanelID = null;
					if (app.onlySkeletonWindow == false) {
						currentFracturePanelID = app.myCurrentFracturePanel.id;
					}
					var tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, false, aPictureID, '23');
					var tpl = new Ext.Template(tplContent);
					tpl.overwrite(childDistForearmImages.body, data);
					app.mySkeletonWindow.getLayout().setActiveItem(16);
				}
				else if (aPictureID == '23') {
					var aoID;
					switch (aPseduoAO) {
						case 'A1':
							aoID = '23-M';
							break;
						case 'B1':
							aoID = '23-E';
							break;
					}
					onLoadAOImages(aoID, aSide);
					aoImagesNavigationHandler.pageNrStack.push(16);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '31' && aPseduoAO === null) {
					var sideLetter = getSideLetter(aSide);
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-ProxFemur-" + sideLetter + ".png",
						side: aSide,
						PictureId: aPictureID,
						windowId: app.mySkeletonWindow.id,
						infoTextA1: 'Proximala epifysen/fysen',
						infoTextA2: '',
						infoTextA3: '',
						infoTextA4: '',
						infoTextA5: '',
						infoTextB1: 'Proximala metafysen',
						infoTextB2: '',
						infoTextB3: '',
						infoTextB4: '',
						infoTextB5: '',
						infoTextC1: '',
						infoTextC2: '',
						infoTextC3: '',
						infoTextC4: '',
						infoTextC5: ''
					};
					var displayMatrix = createDisplayMatrix(3, 3);
					displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
					var aoMatrix = createAoMatrix();
					currentFracturePanelID = null;
					if (app.onlySkeletonWindow == false) {
						currentFracturePanelID = app.myCurrentFracturePanel.id;
					}
					var tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, false, aPictureID, '31');
					var tpl = new Ext.Template(tplContent);
					tpl.overwrite(childProxFemurImages.body, data);
					app.mySkeletonWindow.getLayout().setActiveItem(10);
				}
				else if (aPictureID == '31') {
					var aoID;
					switch (aPseduoAO) {
						case 'A1':
							aoID = '31-E';
							break;
						case 'B1':
							aoID = '31-M';
							break;
					}
					onLoadAOImages(aoID, aSide);
					aoImagesNavigationHandler.pageNrStack.push(10);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '32') {
					onLoadAOImages('32-D', aSide);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}

				else if (aPictureID == '33' && aPseduoAO === null) {
					var sideLetter = getSideLetter(aSide);
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-DistFemur-" + sideLetter + ".png",
						side: aSide,
						PictureId: aPictureID,
						windowId: app.mySkeletonWindow.id,
						infoTextA1: 'Proximala metafysen',
						infoTextA2: '',
						infoTextA3: '',
						infoTextA4: '',
						infoTextA5: '',
						infoTextB1: 'Proximala epifysen/fysen',
						infoTextB2: '',
						infoTextB3: '',
						infoTextB4: '',
						infoTextB5: '',
						infoTextC1: '',
						infoTextC2: '',
						infoTextC3: '',
						infoTextC4: '',
						infoTextC5: ''
					};
					var displayMatrix = createDisplayMatrix(3, 3);
					displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
					var aoMatrix = createAoMatrix();
					currentFracturePanelID = null;
					if (app.onlySkeletonWindow == false) {
						currentFracturePanelID = app.myCurrentFracturePanel.id;
					}
					var tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, false, aPictureID, '33');
					var tpl = new Ext.Template(tplContent);
					tpl.overwrite(childDistFemurImages.body, data);
					app.mySkeletonWindow.getLayout().setActiveItem(11);
				}
				else if (aPictureID == '33') {
					var aoID;
					switch (aPseduoAO) {
						case 'A1':
							aoID = '33-M';
							break;
						case 'B1':
							aoID = '33-E';
							break;
					}
					onLoadAOImages(aoID, aSide);
					aoImagesNavigationHandler.pageNrStack.push(11);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '41' && aPseduoAO === null) {
					var sideLetter = getSideLetter(aSide);
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-ProxTibia-" + sideLetter + ".png",
						side: aSide,
						PictureId: aPictureID,
						windowId: app.mySkeletonWindow.id,
						infoTextA1: 'Proximala epifysen',
						infoTextA2: '',
						infoTextA3: '',
						infoTextA4: '',
						infoTextA5: '',
						infoTextB1: 'Proximala metafysen',
						infoTextB2: '',
						infoTextB3: '',
						infoTextB4: '',
						infoTextB5: '',
						infoTextC1: '',
						infoTextC2: '',
						infoTextC3: '',
						infoTextC4: '',
						infoTextC5: ''
					};
					var displayMatrix = createDisplayMatrix(3, 3);
					displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
					var aoMatrix = createAoMatrix();
					currentFracturePanelID = null;
					if (app.onlySkeletonWindow == false) {
						currentFracturePanelID = app.myCurrentFracturePanel.id;
					}
					var tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, false, aPictureID, '41');
					var tpl = new Ext.Template(tplContent);
					tpl.overwrite(childProxTibiaImages.body, data);
					app.mySkeletonWindow.getLayout().setActiveItem(8);
				}
				else if (aPictureID == '41') {
					var aoID;
					switch (aPseduoAO) {
						case 'A1':
							aoID = '41-E';
							break;
						case 'B1':
							aoID = '41-M';
							break;
					}
					onLoadAOImages(aoID, aSide);
					aoImagesNavigationHandler.pageNrStack.push(8);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '42') {
					onLoadAOImages('42-D', aSide);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else if (aPictureID == '43' && aPseduoAO === null) {
					var sideLetter = getSideLetter(aSide);
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-DistTibia-" + sideLetter + ".png",
						side: aSide,
						PictureId: aPictureID,
						windowId: app.mySkeletonWindow.id,
						infoTextA1: 'Distala metafysen',
						infoTextA2: '',
						infoTextA3: '',
						infoTextA4: '',
						infoTextA5: '',
						infoTextB1: 'Distala epifysen: Isolerad tibiafraktur',
						infoTextB2: 'Distala epifysen: Isolerad fibulafraktur',
						infoTextB3: 'Distala epifysen: Både tibia och fibula',
						infoTextB4: '',
						infoTextB5: '',
						infoTextC1: '',
						infoTextC2: '',
						infoTextC3: '',
						infoTextC4: '',
						infoTextC5: ''
					};
					var displayMatrix = createDisplayMatrix(3, 3);
					displayMatrix[0][1] = displayMatrix[0][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
					var aoMatrix = createAoMatrix();
					currentFracturePanelID = null;
					if (app.onlySkeletonWindow == false) {
						currentFracturePanelID = app.myCurrentFracturePanel.id;
					}
					var tplContent = initAOtemplate(displayMatrix, aoMatrix, currentFracturePanelID, false, aPictureID, '43');
					var tpl = new Ext.Template(tplContent);
					tpl.overwrite(childDistTibiaImages.body, data);
					app.mySkeletonWindow.getLayout().setActiveItem(9);

				}
				else if (aPictureID == '43') {
					var aoID;
					switch (aPseduoAO) {
						case 'A1':
							aoID = '43-M';
							break;
						case 'B1':
							aoID = '43t-E';
							break;
						case 'B2':
							aoID = '43f-E';
							break;
						case 'B3':
							aoID = '43-E';
							break;
					}
					onLoadAOImages(aoID, aSide);
					aoImagesNavigationHandler.pageNrStack.push(9);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
				}
				else {
					aoImagesNavigationHandler.showNoChildFractureSupportAlert = true;
					aoImagesNavigationHandler.classifyAsAdult = true;
					aoImagesNavigationHandler(aBtn, aPictureID, aSide, aPseduoAO, aIsHandPartClick);

					/*Ext.Msg.show({
                        title: 'Öppna fyser',
                        msg: 'I Frakturregistret kan man tillsvidare inte registrera barnfrakturer i den skelettdel du valt',
                        buttons: Ext.Msg.OKCANCEL,
                        fn: function (btn, text) {
                            if (btn == 'ok') {
                                aoImagesNavigationHandler.isChildFracture = false;
                                aoImagesNavigationHandler(aBtn, aPictureID, aSide, aPseduoAO, aIsHandPartClick);
                            }
                        },
                        icon: Ext.MessageBox.INFO,
                        width: 600
                    });*/
				}
			}
			else if (aPictureID == '21') {
				onLoadAOImages('21-A', aSide, foreArmRadiusImages, '21-B');
				app.mySkeletonWindow.getLayout().setActiveItem(3);
			}
			else if (aPictureID == '21-B') {
				onLoadAOImages('21-B', aSide, foreArmUlnaImages);
				aoImagesNavigationHandler.pageNrStack.push(3);
				app.mySkeletonWindow.getLayout().setActiveItem(4);
				aoImagesNavigationHandler.pageNrStack.push(3);
			}
			///QQQ
			else if (aPictureID == '61') {
				aoImagesNavigationHandler.inPelvisMode = true;
				app.mySkeletonWindow.getLayout().setActiveItem(2);
				///app.mySkeletonWindow.getLayout().setActiveItem(1);
				///onLoadAOImages('61', 2);
				///nextBtn.setDisabled(true);
			}
			else if (aPictureID == '7') {
				aoImagesNavigationHandler.inHandMode = true;
				handSkeleton.body.update('<div></div>');
				if (aSide == 1) {
					var handSkeletonHData = {
						a: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-skeleton.png"
					};
					tplHandSkeletonH.overwrite(handSkeleton.body, handSkeletonHData);

				}
				else if (aSide == 2) {
					var handSkeletonVData = {
						a: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-skeleton.png"
					};
					tplHandSkeletonV.overwrite(handSkeleton.body, handSkeletonVData);
				}
				//app.mySkeletonWindow.getLayout().setActiveItem(6); This call is moved to function onLoadHandImgMini
			}
			else if (aPictureID == '8' && aPseduoAO === null) {
				var sideLetter = getSideLetter(aSide);
				var footPartsData = {
					image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-Foot-" + sideLetter + ".png",
					side: aSide,
					PictureId: aPictureID,
					windowId: app.mySkeletonWindow.id,
					infoTextA1: 'Talus',
					infoTextA2: 'Calcaneus',
					infoTextA3: '',
					infoTextA4: '',
					infoTextA5: '',
					infoTextB1: 'Navikulare',
					infoTextB2: 'Cuboideum',
					infoTextB3: 'Cuneiformeben',
					infoTextB4: '',
					infoTextB5: '',
					infoTextC1: 'Metatarsalben',
					infoTextC2: 'Falanger',
					infoTextC3: '',
					infoTextC4: '',
					infoTextC5: ''
				};
				var displayMatrixFootPart = createDisplayMatrix(3, 3);
				displayMatrixFootPart[0][2] = displayMatrixFootPart[2][2] = false;
				var aoMatrixFootPart = createAoMatrix();
				currentFracturePanelID = null;
				if (app.onlySkeletonWindow == false) {
					currentFracturePanelID = app.myCurrentFracturePanel.id;
				}
				var tplContentFootPart = initAOtemplate(displayMatrixFootPart, aoMatrixFootPart, currentFracturePanelID, false, aPictureID, '8');
				var tplFootPart = new Ext.Template(tplContentFootPart);
				tplFootPart.overwrite(footPartImages.body, footPartsData);
				app.mySkeletonWindow.getLayout().setActiveItem(5);
			}
			else if (aPictureID == '8') {
				var aoID;
				switch (aPseduoAO) {
					case 'A1':
						aoID = '81';
						break;
					case 'A2':
						aoID = '82';
						break;
					case 'B1':
						aoID = '83';
						break;
					case 'B2':
						aoID = '84';
						break;
					case 'B3':
						aoID = '85';
						break;
					case 'C1':
						aoID = '87';
						Ext.MessageBox.show({
							title: 'Påverkan på Lisfrancs led?',
							msg: 'Om du vill registrera en eller flera metatarsalbensfrakturer som påverkar Lisfrancs led, tryck på ”Föregående”-knappen nere till höger och välj därefter Cuneiformebenen.</br></br>Registrera sedan Lisfrancledsskadan enligt valen under C.',
							buttons: Ext.Msg.OK
						});
						break;
					case 'C2':
						aoID = '88';
						break;
				}
				aoPanel.setTitle('Modifierad OTA-klassifikation');
				onLoadAOImages(aoID, aSide);
				aoImagesNavigationHandler.pageNrStack.push(5);
				app.mySkeletonWindow.getLayout().setActiveItem(1);
			}
			else if (aPictureID == '100' || aPictureID == '100b' || aPictureID == '101' || aPictureID == '102' || aPictureID == '103') {
				nextBtn.setDisabled(false);
				aoImagesNavigationHandler.currentSpinePictureID = aPictureID;

				var segmentNr = 0;
				switch (aPictureID) {
					case '100':
					case '100b':
						segmentNr = 1;
						break;
					case '101':
						segmentNr = 2;
						break;
					case '102':
						segmentNr = 3;
						break;
					case '103':
						segmentNr = 4;
						break;
				}
				backHandler.currentSegment = segmentNr;
				var v2 = getCmpByName('v2', spinePanel);
				var v3 = getCmpByName('v3', spinePanel);
				var activeItem = app.mySkeletonWindow.getLayout().getActiveItem();
				if (activeItem == vertebraC0Images) {
					backHandler.c0Class = aPseduoAO;
					if (v2.getValue() === true) {
						onLoadAOImages('100-C1', aSide, vertebraC1Images, '100');
						app.mySkeletonWindow.getLayout().setActiveItem(18);
					}
					else if (v3.getValue() === true) {
						onLoadAOImages('100-C2', aSide, vertebraC2Images, '100');
						app.mySkeletonWindow.getLayout().setActiveItem(19);
					}
					else {
						backHandler(app.myCurrentFracturePanel.id, aSide, aPictureID, aPseduoAO, app.mySkeletonWindow.id, null, vertebraC0Images.name);
					}
				}
				else if (activeItem == vertebraC1Images) {
					if (!Ext.isEmpty(aPseduoAO)) {
						backHandler.c1Class = aPseduoAO;
					}
					if (aPictureID == '100' && aPseduoAO !== 'X') { //TODO: 'Typ-A??' X?????? (constant)
						backHandler.c1Class = aPseduoAO;
						if (aPseduoAO != 'A' && !Ext.isEmpty(aPseduoAO)) { //TODO: "A" must be made to constant or something.
							var dialog = Ext.create('Ext.window.Window', {
								title: 'Massa lateralis',
								resizable: false,
								html: '<br/><b>Massa lateralis vidgad 7 mm eller mer (dvs om avstånd a+b är 7 mm eller mer)(anges som gräns för instabil fraktur eftersom lig transversum då anses vara rupturerat)</b><img src="https://stratum.blob.core.windows.net/sfr/Images/assembled/c1-extra.png"/>',
								style: 'text-align:center;',
								width: 400,
								height: 420,
								modal: true,
								dockedItems: [{
									xtype: 'toolbar',
									layout: 'vbox',
									dock: 'bottom',
									items: [
                                    {
                                    	text: 'JA',
                                    	handler: function () {
                                    		dialog.close();
                                    		backHandler.massaLateralis = true;
                                    		aoImagesNavigationHandler(null, '100b', '3', null, false);
                                    		//onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '0';
                                    		//generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                                    	}
                                    }, {
                                    	text: 'NEJ',
                                    	handler: function () {
                                    		dialog.close();
                                    		backHandler.massaLateralis = false;
                                    		aoImagesNavigationHandler(null, '100b', '3', null, false);
                                    		//onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '1';
                                    		//generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                                    	}
                                    }]
								}]
							}
                            );
							dialog.show();
							return;
						}
					}
					if (v3.getValue() === true) {
						onLoadAOImages('100-C2', aSide, vertebraC2Images, '100');
						app.mySkeletonWindow.getLayout().setActiveItem(19);
					}
					else {
						backHandler(app.myCurrentFracturePanel.id, aSide, aPictureID, aPseduoAO, app.mySkeletonWindow.id, null, vertebraC1Images.name);
					}
				}
				else if (activeItem == vertebraC2Images) {
					backHandler.c2Class = aPseduoAO;
					backHandler(app.myCurrentFracturePanel.id, aSide, aPictureID, aPseduoAO, app.mySkeletonWindow.id, null, vertebraC2Images.name);
				}
				else {
					app.mySkeletonWindow.getLayout().setActiveItem(12);
					activeItem = app.mySkeletonWindow.getLayout().getActiveItem();
					//activeItem.el.setStyle({ display: 'block', backgroundPosition: '170px 40px', backgroundImage: 'url(Images/Assembled/Spine-S' + segmentNr + '.png)', height: '50', overflow: 'hidden', backgroundRepeat: 'no-repeat'});
					//activeItem.el.setStyle({ display: 'block', backgroundPosition: '170px 40px', backgroundImage: 'url(Images/Assembled/Spine-S' + segmentNr + '.png)', height: '600', width:'800', overflow: 'hidden', backgroundRepeat: 'no-repeat'});
					activeItem.setBodyStyle('background-image:url(sfr/images/assembled/Spine-S' + segmentNr + '.png);background-repeat:no-repeat;background-position:170px 15px;');
					var v1 = getCmpByName('v1', activeItem);
					var v2 = getCmpByName('v2', activeItem);
					var v3 = getCmpByName('v3', activeItem);
					var v4 = getCmpByName('v4', activeItem);
					var v5 = getCmpByName('v5', activeItem);
					var v6 = getCmpByName('v6', activeItem);
					var v7 = getCmpByName('v7', activeItem);
					var v8 = getCmpByName('v8', activeItem);
					var v9 = getCmpByName('v9', activeItem);

					v1.setValue(false); v2.setValue(false); v3.setValue(false); v4.setValue(false); v5.setValue(false); v6.setValue(false); v7.setValue(false); v8.setValue(false); v9.setValue(false);
					v1.setVisible(true); v2.setVisible(true); v3.setVisible(true); v4.setVisible(true); v5.setVisible(true); v6.setVisible(true); v7.setVisible(true); v8.setVisible(true); v9.setVisible(true);

					/// var neuroCmp = getCmpByName('neurology', activeItem);
					/// neuroCmp.setValue(null);

					/// var neuroExtCmp = getCmpByName('neurologiExtended', activeItem);
					/// neuroExtCmp.setValue(null);

					var hideCaudaQuestion = true;
					if (aPictureID == '100') {
						v1.setBoxLabel('C0'); v1.aValue = 'C0';
						v2.setBoxLabel('C1'); v2.aValue = 'C1';
						v3.setBoxLabel('C2'); v3.aValue = 'C2';
						v4.setVisible(false);
						v5.setVisible(false);
						v6.setVisible(false);
						v7.setVisible(false);
						v8.setVisible(false);
						v9.setVisible(false);

					}
					else if (aPictureID == '101') {
						v1.setBoxLabel('C3'); v1.aValue = 'C3';
						v2.setBoxLabel('C4'); v2.aValue = 'C4';
						v3.setBoxLabel('C5'); v3.aValue = 'C5';
						v4.setBoxLabel('C6'); v4.aValue = 'C6';
						v5.setBoxLabel('C7'); v5.aValue = 'C7';
						v6.setBoxLabel('Th1'); v6.aValue = 'Th1';
						v7.setVisible(false);
						v8.setVisible(false);
						v9.setVisible(false);
					}
					else if (aPictureID == '102') {
						v1.setBoxLabel('Th2'); v1.aValue = 'Th2';
						v2.setBoxLabel('Th3'); v2.aValue = 'Th3';
						v3.setBoxLabel('Th4'); v3.aValue = 'Th4';
						v4.setBoxLabel('Th5'); v4.aValue = 'Th5';
						v5.setBoxLabel('Th6'); v5.aValue = 'Th6';
						v6.setBoxLabel('Th7'); v6.aValue = 'Th7';
						v7.setBoxLabel('Th8'); v7.aValue = 'Th8';
						v8.setBoxLabel('Th9'); v8.aValue = 'Th9';
						v9.setBoxLabel('Th10'); v9.aValue = 'Th10';
					}
					else if (aPictureID == '103') {
						v1.setBoxLabel('Th11'); v1.aValue = 'Th11';
						v2.setBoxLabel('Th12'); v2.aValue = 'Th12';
						v3.setBoxLabel('L1'); v3.aValue = 'L1';
						v4.setBoxLabel('L2'); v4.aValue = 'L2';
						v5.setBoxLabel('L3'); v5.aValue = 'L3';
						v6.setBoxLabel('L4'); v6.aValue = 'L4';
						v7.setBoxLabel('L5'); v7.aValue = 'L5';
						v8.setVisible(false);
						v9.setVisible(false);
						hideCaudaQuestion = false;

					}
				}
			}
			else if (aPictureID == '102b') {
				aoImagesNavigationHandler.pageNrStack.push(1);
				if (aPseduoAO.indexOf('A') == 0) {
					backHandler.pseudoAO = aPseduoAO;
					onLoadAOImages('102b', aSide, spine102BImages);
					app.mySkeletonWindow.getLayout().setActiveItem(13);
				}
				else {
					backHandler.pseudoAO = '';
					backHandler(app.myCurrentFracturePanel.id, aSide, aPictureID, aPseduoAO, app.mySkeletonWindow.id, null, false);
				}

			}
			else {
				if (aIsHandPartClick === true) {
					aoImagesNavigationHandler.inHandMode = true;
					aoImagesNavigationHandler.pageNrStack.push(6);
				}
				aoTitleText = 'AO-klassifikation';
				if (aoImagesNavigationHandler.inProsthesisMode) {
					aoTitleText = 'Klassifikation enligt UCS (Unified Classification System)';
				}
				else if (aPictureID == '9') {
					aoTitleText = 'Robinson-klassifikation';
				}
				else if (aPictureID == '10') {
					aoTitleText = 'Euler-Ruediklassifikation';
				}


				aoPanel.setTitle(aoTitleText);
				onLoadAOImages(aPictureID, aSide);
				app.mySkeletonWindow.getLayout().setActiveItem(1);
			}
			if (aoImagesNavigationHandler.inPelvisMode === true && onPelvisClick.matchFoundForLightRingInjury !== undefined) {
				if (onPelvisClick.matchFoundForLightRingInjury(pelvisPanel) || onPelvisClick.matchFoundForSeriousRingInjury(pelvisPanel)) {
					nextBtn.setDisabled(false);
				}
			}
			else if (isBackFracture(aPictureID)) {
				nextBtn.setDisabled(false);
			}
			else {
				nextBtn.setDisabled(true);
			}
			previousBtn.setDisabled(false);
			return;
		}
		else {
			if (aBtn === previousBtn) {
				if (aoImagesNavigationHandler.currentSpinePictureID == '100b') {
					aoImagesNavigationHandler.currentSpinePictureID = '100';
				}
				else if (aoImagesNavigationHandler.currentSpinePictureID == '102b') {
					aoImagesNavigationHandler.currentSpinePictureID = '102';
				}
				if (aoImagesNavigationHandler.pageNrStack.length !== 0) {
					var pageID = aoImagesNavigationHandler.pageNrStack.pop();
					if (pageID === 2 || pageID == 12) { //pelvis panel, back panel
						nextBtn.setDisabled(false);
					}
					app.mySkeletonWindow.getLayout().setActiveItem(pageID);
				} else {

					var layout;
					layout = app.mySkeletonWindow.getLayout();

					layout.setActiveItem(0);
					nextBtn.setDisabled(true);
					previousBtn.setDisabled(true);
				}
			}
			else if (app.mySkeletonWindow.getLayout().activeItem === foreArmRadiusImages) {
				onReturnCodes.foreArmRadiusAO = 'X';
				aoImagesNavigationHandler.pageNrStack.push(3);

				var ulnaSide = aoImagesNavigationHandler.side;
				onLoadAOImages('21-B', ulnaSide, foreArmUlnaImages);
				app.mySkeletonWindow.getLayout().setActiveItem(4);
				return;
			}
			else if (app.mySkeletonWindow.getLayout().activeItem === pelvisPanel) {
				var matchFoundForSeriousRingInjury = onPelvisClick.matchFoundForSeriousRingInjury(pelvisPanel);
				if (matchFoundForSeriousRingInjury) {
					aoImagesNavigationHandler.pageNrStack.push(2);
					app.mySkeletonWindow.getLayout().setActiveItem(1);
					onLoadAOImages('61', 2);
					nextBtn.setDisabled(true);
				}
				else {
					var fractureForm = app.myCurrentFracturePanel;
					var side = getSide(pelvisPanel);
					onReturnCodes('null', side, '61', 'A', app.mySkeletonWindow.id, null, false);
					return;
				}
			}
			else if (app.mySkeletonWindow.getLayout().activeItem === spinePanel) {
				var neurologiCmp = getCmpByName('neurology', spinePanel);
				var extendedNeurologiCmp = getCmpByName('neurologiExtended', spinePanel);
				var v1 = getCmpByName('v1', spinePanel);
				var v2 = getCmpByName('v2', spinePanel);
				var v3 = getCmpByName('v3', spinePanel);
				var v4 = getCmpByName('v4', spinePanel);
				var v5 = getCmpByName('v5', spinePanel);
				var v6 = getCmpByName('v6', spinePanel);
				var v7 = getCmpByName('v7', spinePanel);
				var v8 = getCmpByName('v8', spinePanel);
				var v9 = getCmpByName('v9', spinePanel);
				var errorMsg = '';
				var vertebraeValuesCombined = v1.getValue() + v2.getValue() + v3.getValue() + v4.getValue() + v5.getValue() + v6.getValue() + v7.getValue() + v8.getValue() + v9.getValue();
				if (v1.getValue() === false && v2.getValue() === false && v3.getValue() === false && v4.getValue() === false && v5.getValue() === false && v6.getValue() === false && v7.getValue() === false && v8.getValue() === false && v9.getValue() === false) {
					errorMsg = 'Du måste ange minst en kota.';

				}
				else if (Ext.isEmpty(errorMsg)) {
					backHandler.pseudoAO = '';
					var spineTargetPanel = aoPanel;
					if (aoImagesNavigationHandler.currentSpinePictureID == '100') {
						backHandler.c0Class = '';
						backHandler.c1Class = '';
						backHandler.c2Class = '';
						var c0Cmp = getCmpByName('v1', spinePanel);
						var c1Cmp = getCmpByName('v2', spinePanel);
						var c2Cmp = getCmpByName('v3', spinePanel);
						var gotoPicID = '';

						if (c0Cmp.getValue() === true) {
							spineTargetPanel = vertebraC0Images;
							gotoPicID = '100-C0';
							aoTitleText = 'Klassifikation enligt Anderson och Montesano (1988, Spine, p 731-736)';
							aoPanel.setTitle(aoTitleText);
						}
						else if (c1Cmp.getValue() === true) {
							gotoPicID = '100-C1';
							spineTargetPanel = vertebraC1Images;
						}
						else if (c2Cmp.getValue() === true) {
							gotoPicID = '100-C2';
							spineTargetPanel = vertebraC2Images;
						}
						onLoadAOImages(gotoPicID, 3, spineTargetPanel, '100');
					}
					else if (aoImagesNavigationHandler.currentSpinePictureID == '102') {
						aoTitleText = 'Klassifikationen modifierad från AO-klassifikationen, såsom den beskrivits av<br/>Reinhold et al (Eur Spine J, 2013; sidorna 2184-2201)';
						aoPanel.setTitle(aoTitleText);
						onLoadAOImages(aoImagesNavigationHandler.currentSpinePictureID, 3, null, '102b');
					}
					else if (aoImagesNavigationHandler.currentSpinePictureID == '103') {
						aoTitleText = 'Klassifikationen modifierad från AO-klassifikationen, såsom den beskrivits av<br/>Reinhold et al (Eur Spine J, 2013; sidorna 2184-2201)';
						aoPanel.setTitle(aoTitleText);
						onLoadAOImages('102', 3, null, '102b');
					}
					else {
						aoTitleText = 'Klassifikation baserad på SLIC; Subaxial cervical spine injury classification system<br/>(Vaccaro et al, Spine, 2007, sidorna 2365-2374)';
						aoPanel.setTitle(aoTitleText);
						onLoadAOImages(aoImagesNavigationHandler.currentSpinePictureID, 3, null, null);
					}
					aoImagesNavigationHandler.pageNrStack.push(12);
					app.mySkeletonWindow.getLayout().setActiveItem(spineTargetPanel);
					nextBtn.setDisabled(true);
				}
				if (!Ext.isEmpty(errorMsg)) {
					Ext.Msg.show({
						title: 'Värden saknas',
						msg: errorMsg,
						buttons: Ext.Msg.OK,
						icon: Ext.MessageBox.INFO,
						width: 600
					});
				}
			}
			else if (app.mySkeletonWindow.getLayout().activeItem == vertebraC0Images) {
				backHandler.c0Class = 'X';
				aoImagesNavigationHandler(null, aPictureID, aSide, aPseduoAO, aIsHandPartClick);
			}
			else if (app.mySkeletonWindow.getLayout().activeItem == vertebraC1Images) {
				backHandler.c1Class = 'X';
				aoImagesNavigationHandler(null, aPictureID, aSide, aPseduoAO, aIsHandPartClick);
			}
			else if (app.mySkeletonWindow.getLayout().activeItem == vertebraC2Images) {
				backHandler.c2Class = 'X';
				aoImagesNavigationHandler(null, aPictureID, aSide, aPseduoAO, aIsHandPartClick);
			}
		}
	};

	onReturnCodes = function (aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName) {
		onReturnCodes.extraClassInfo = '';
		if (aoImagesNavigationHandler.inProsthesisMode && aoImagesNavigationHandler.goToProsthesisHandler) {
			aoImagesNavigationHandler.goToProsthesisHandler = false;
			prosthesisHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
		else if (aPictureID == '11-P') {
			childProxHumerusHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
		else if (aPictureID == '13-M') {
			childDistMetafysHumerusHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
		else if (aPictureID == '13-E') {
			childDistEpifysHumerusHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
		else if (aPictureID == '23') {
			wristHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '41-E') {
			childProxEpifysTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '31-E') {
			childProxEpifysFemurHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '33-E') {
			childDistEpifysFemurHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '33-M') {
			childDistMetafysFemurHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '41' || aPictureID == '42' || aPictureID == '43') {

			if (aAO == '4X') {
				Ext.Msg.show({
					title: 'Isolerad fibulafraktur?',
					msg: 'Observera att de enda fibulafrakturer som ska klassas som isolerade (ICD S82.40) är de få som orsakats av ett rent direktvåld. Samtliga övriga fibulafrakturer oavsett nivå på fibula är fotledsfrakturer av B- eller C-typ och ska klassas så',
					buttons: Ext.Msg.OKCANCEL,
					fn: function (c) {
						if (c != 'ok') {
							return;
						}
						if (aPictureID == '42') {
							diafysTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
						}
						else if (aPictureID == '43') {
							distalTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
						}
						else {
							generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
						}

					},
					icon: Ext.MessageBox.INFO,
					width: 600
				});
			}
			else {
				if (aPictureID == '42') {
					diafysTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
				}
				else if (aPictureID == '43') {
					distalTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
				}
				else {
					generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
				}
			}
		}
		else if(aPictureID == '61') {
			Ext.Msg.show({
				msg: 'Multipla frakturer?', title: 'Multipla frakturer', buttons: Ext.Msg.YESNOCANCEL,
				fn: function (aBtn) {
					if (aBtn === 'cancel') {
						return;
					}
					else if (aBtn == 'yes') {
						aoImagesNavigationHandler.multipleInjuriesSelected = true;
					}
					else {
						aoImagesNavigationHandler.multipleInjuriesSelected = false;
					}
					generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
				}
			});
		} 
		else if (aPictureID == '21-B' || aPictureID == '21-U') {
			foreArmHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '101') {
			backHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '102') {
			backHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aPictureID == '102b') {
			backHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName);
		}
		else if (aUseHandAO) {
			handHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
	};

	initialize();

	function getToday() {
		var today = new Date();
		return Ext.Date.dateFormat(today, 'Y-m-d');
	}

	function setICD10TextToolTip(aFractureForm, target) {
		var icd10Field = getCmpByName('Fx_ICD10', aFractureForm);
		if (icd10Field === null) {
			icd10Field = getCmpByName('FxS_ICD10', aFractureForm);
		}
		if (icd10Field === null) {
			icd10Field = getCmpByName('FxP_ICD10', aFractureForm);
		}
		if (icd10Field === null) {
			return;
		}
		var icd10Code = icd10Field.getValue();
		var icd10Text = getDomainValueName(4061, icd10Code);
		if (icd10Text == '')
			return;
		Ext.tip.QuickTipManager.register({
			target: target.id,
			text: icd10Text,
			title: icd10Code
		});
	}

	function getCmpByName(cmpName, panel) {
		var i = 0;
		if (panel instanceof Ext.form.Panel || panel instanceof Ext.panel.Panel) {
			for (i = 0; i < panel.items.length; i++) {
				switch (panel.items.items[i].name) {
					case cmpName:
						return panel.items.items[i];
						break;
				}
			}
		}
		else if (panel instanceof Ext.form.BasicForm) {
			for (i = 0; i < panel.items.length; i++) {
				switch (panel.items[i].name) {
					case cmpName:
						return panel.items[i];
						break;
				}
			}
		}
		return null;
	}

	function getPanel(eventID) {
		var i = 0;
		for (i = 0; i < app.myMiddlePanel.items.length; i++) {
			var cmp = app.myMiddlePanel.items.items[i];
			if (cmp instanceof Ext.form.Panel) {
				var eventIDField = getCmpByName('EventID', cmp);
				if (eventIDField != null) {
					if (eventIDField.getValue() == eventID) {
						return cmp;
					}
				}
			}
		}
		return null;
	}

	function getDomainValueName(domainid, valueCode) {
		if (isNaN(domainid) || !app.myRegisterDomains[domainid])
			return;
		var i = 0;
		for (i = 0; i < app.myRegisterDomains[domainid].DomainValues.length; i++) {
			if (app.myRegisterDomains[domainid].DomainValues[i].ValueCode == valueCode) {
				return app.myRegisterDomains[domainid].DomainValues[i].ValueName;
			}
		}
		return '';
	}

	function getDomainValue(domainid, valueCode) {
		if (isNaN(domainid) || !app.myRegisterDomains[domainid])
			return;
		var i = 0;
		for (i = 0; i < app.myRegisterDomains[domainid].DomainValues.length; i++) {
			if (app.myRegisterDomains[domainid].DomainValues[i].ValueCode == valueCode) {
				return app.myRegisterDomains[domainid].DomainValues[i];
			}
		}
		return '';
	}

	function getButtonByName(buttonName, buttons) {
		var i = 0;
		for (i = 0; i < buttons.items.length; i++) {
			switch (buttons.items.items[i].name) {
				case buttonName:
					return buttons.items.items[i];
					break;
			}
		}
		return null;
	}

	function getSide(pelvisPanel) {
		if (aoImagesNavigationHandler.inProsthesisMode === true) {
			return 3;
		}
		var manualClassification = onPelvisClick.matchFoundForSeriousRingInjury(pelvisPanel);
		if (manualClassification)
			return '';
		var middleInjuryFound = false;
		var leftInjuryFound = false;
		var rightInjuryFound = false;
		var i = 0;
		var selectedCmps = onPelvisClick.getSelectedCmps(pelvisPanel);
		for (i = 0; i < selectedCmps.length; i++) {
			var cmpName = selectedCmps[i].name;
			if (selectedCmps[i].name.indexOf('H', cmpName.length - 1) > 0)
				rightInjuryFound = true;
			else if (selectedCmps[i].name.indexOf('V', cmpName.length - 1) > 0)
				leftInjuryFound = true;
			else
				middleInjuryFound = true;
		}
		if (middleInjuryFound)
			return 3;
		if (leftInjuryFound && rightInjuryFound)
			return 3;
		if (leftInjuryFound)
			return 2;
		if (rightInjuryFound)
			return 1;
		return '';
	}

	function onPelvisClick (cmp, checked) {
		if (onPelvisClick.DISLOCATED_TEXT === undefined) {
			onPelvisClick.DISLOCATED_TEXT = 'Dislocerad';
		}
		if (onPelvisClick.matchFoundForSeriousRingInjury === undefined) {
			onPelvisClick.matchFoundForSeriousRingInjury = function (pelvisPanel) {
				var match = false;
				match = match || getCmpByName('RingskadaInstabilH', pelvisPanel).checked;
				match = match || getCmpByName('SakrumH', pelvisPanel).checked;
				match = match || getCmpByName('SILedH', pelvisPanel).checked;
				match = match || getCmpByName('RingskadaInstabilV', pelvisPanel).checked;
				match = match || getCmpByName('SakrumV', pelvisPanel).checked;
				match = match || getCmpByName('SILedV', pelvisPanel).checked;
				return match;
			}
		}
		if (onPelvisClick.matchFoundForLightRingInjury === undefined) {
			onPelvisClick.matchFoundForLightRingInjury = function (pelvisPanel) {
				var match = false;
				match = match || getCmpByName('AlaStabilH', pelvisPanel).checked;
				match = match || getCmpByName('OSPubisH', pelvisPanel).checked;
				match = match || getCmpByName('AlaStabilV', pelvisPanel).checked;
				match = match || getCmpByName('OSPubisV', pelvisPanel).checked;
				match = match || getCmpByName('SpinopelvinDissociation', pelvisPanel).checked;
				match = match || getCmpByName('Transversell', pelvisPanel).checked;
				match = match || getCmpByName('Coccyx', pelvisPanel).checked;
				match = match || getCmpByName('Symfys', pelvisPanel).checked;
				return match;
			}
		}
		if (onPelvisClick.getLabel === undefined)
			onPelvisClick.getLabel = function (checkbox, pelvisPanel) {
				var i = 0;
				var j = 0;
				var index = 0;
				var cmps = getGroupedCmpsArray(pelvisPanel);
				for (i = 0; i < cmps.length; i++) {
					for (j = 0; j < cmps[i].length; j++) {
						if (cmps[i][j] === checkbox) {
							index = i;
							break;
						}
					}
				}
				switch (index) {
					case 0:
						return pelvisPanel.items.items[24];
					case 1:
						return pelvisPanel.items.items[28];
					case 2:
						return pelvisPanel.items.items[26];
					case 3:
						return pelvisPanel.items.items[30];
					case 4:
						return pelvisPanel.items.items[25];
					case 5:
						return pelvisPanel.items.items[29];
					case 6:
						return pelvisPanel.items.items[27];
					case 7:
						return pelvisPanel.items.items[31];
					case 8:
						return pelvisPanel.items.items[32];
					case 9:
						return pelvisPanel.items.items[33];
				}
			}
		if (onPelvisClick.getSelectedCmps === undefined)
			onPelvisClick.getSelectedCmps = function (pelvisPanel) {
				var i = 0;
				var cmps = [];
				var j = 0;
				for (i = 0; i < pelvisPanel.items.length; i++) {
					if (pelvisPanel.items.items[i] instanceof Ext.form.Checkbox) {
						var box = pelvisPanel.items.items[i];
						if (box.checked) {
							cmps[j] = box;
							j++;
						}
					}
				}
				return cmps;

			}
		if (onPelvisClick.getPelvisRingInjuryPart === undefined) {
			onPelvisClick.getPelvisRingInjuryPart = function (aInjuryCode) {
				var i = 0;
				var j = 0;
				var valueCode = '';
				for (i = 0; i < app.myRegisterDomains[4144].DomainValues.length; i++) {
					for (j = 0; j < app.myRegisterDomains[4144].DomainValues[i].ChildValues.length; j++) {
						valueCode = app.myRegisterDomains[4144].DomainValues[i].ChildValues[j].ValueCode;
						if (valueCode == aInjuryCode)
					return app.myRegisterDomains[4144].DomainValues[i].ValueCode;
					}
				}
				return '';
			}
		}
		if (onPelvisClick.multipleInjuriesSelected === undefined) {
			onPelvisClick.multipleInjuriesSelected = function (pelvisPanel) {
				var cmps = onPelvisClick.getSelectedCmps(pelvisPanel);
				var nrOfCmps = cmps.length;
				var nrOfDislocated = 0;
				var i = 0;
				for (i = 0; i < nrOfCmps; i++) {
					if (cmps[i].name.indexOf('Dislocerad') >= 0) {
						nrOfDislocated++;
					}
				}
				return (nrOfCmps - nrOfDislocated) > 1;
			}
		}
		var pelvisPanel = cmp.ownerCt;
		if (cmp.name.indexOf(onPelvisClick.DISLOCATED_TEXT) >= 0)
			return;
		cmps = getGroupedCmps(cmp, pelvisPanel);
		var label = onPelvisClick.getLabel(cmp, pelvisPanel);
		if (checked) {
			label.el.dom.style.color = 'orange';
			var i = 0;
			for (i = 0; i < cmps.length; i++) {
				if (i === cmps.length - 1) //Dislocerad button
					cmps[i].setDisabled(false);
				else if (cmps[i] !== cmp && cmps[cmps.length - 1] !== cmp)
					cmps[i].setValue(false);
			}
		}
		else {
			label.el.dom.style.color = '';
			if (cmps.length > 0) {
				var dislocatedButton = cmps[cmps.length - 1];
				if (dislocatedButton !== cmp) {
					dislocatedButton.setDisabled(true);
					dislocatedButton.setValue(false);
				}
			}
		}
		aoImagesNavigationHandler.toggleNavigationButton(pelvisPanel);
		function getICD10codes(pelvisPanel, openFractureMarker) {
			var codes = [];
			var selectedCmps = onPelvisClick.getSelectedCmps(pelvisPanel);
			var rightSideMarker = 1;
			var leftSideMarker = 2;
			var unspecSideMarker = 3;
			if (openFractureMarker === undefined) {
				openFractureMarker = '';
			}
			var i = 0;
			for (i = 0; i < selectedCmps.length; i++) {
				var pelvisPart = selectedCmps[i].name;
				switch (pelvisPart) {
					case 'RingskadaInstabilH':
					case 'AlaStabilH':
						codes[i] = 'S32.3' + openFractureMarker + rightSideMarker;
						break;
					case 'RingskadaInstabilV':
					case 'AlaStabilV':
						codes[i] = 'S32.3' + openFractureMarker + leftSideMarker;
						break;
					case 'SILedH':
						codes[i] = 'S33.2' + openFractureMarker + rightSideMarker;
						break;
					case 'SILedV':
						codes[i] = 'S33.2' + openFractureMarker + leftSideMarker;
						break;
					case 'SakrumH':
						codes[i] = 'S32.1' + openFractureMarker + rightSideMarker;
						break;
					case 'SakrumV':
						codes[i] = 'S32.1' + openFractureMarker + leftSideMarker;
						break;
					case 'OSPubisH':
						codes[i] = 'S32.5' + openFractureMarker + rightSideMarker;
						break;
					case 'OSPubisV':
						codes[i] = 'S32.5' + openFractureMarker + leftSideMarker;
						break;
					case 'SpinopelvinDissociation':
					case 'Transversell':
						codes[i] = 'S32.1' + openFractureMarker + unspecSideMarker;
						break;
					case 'Coccyx':
						codes[i] = 'S32.2' + openFractureMarker + unspecSideMarker;
						break;
					case 'Symfys':
						codes[i] = 'S33.4' + openFractureMarker + unspecSideMarker;
						break;
				}
			}
			return codes;
		}
		
		//Returns AO-code for pelvis parts where no manual (image-click) ao-classification is made
		function getAOcode(fractureForm) {
			var codes = [];
			var selectedCmps = onPelvisClick.getSelectedCmps(fractureForm);
			var i = 0;
			for (i = 0; i < selectedCmps.length; i++) {
				var pelvisPart = selectedCmps[i].name;
				switch (pelvisPart) {
					case 'AlaStabilH':
					case 'AlaStabilV':
						codes[i] = '61-A2.1';
						break;
					case 'OSPubisH':
					case 'OSPubisV':
						codes[i] = '61-A2.2';
						break;
					case 'SpinopelvinDissociation':
						codes[i] = '?'; //TODO:?
						break;
					case 'Transversell':
					case 'coccyx':
						codes[i] = '61-A3';
						break;
					case 'Symfys':
						return '?'; //TODO:?
						break;
				}
			}
			var aoCode = '';
			if (codes.indexOf('OSPubisH') > 0 && codes.indexOf('OSPubisV') > 0 && codes.length === 2)
				aoCode = '61-A2.3';
			else if (codes.length > 1)
				aoCode = '61-A';
			else if (codes.length === 1)
				aoCode = codes[0];
			else
				return '';
			return aoCode;
		}
	}
	
	function getGroupedCmpsArray(pelvisPanel) {
		return [[getCmpByName('RingskadaInstabilH', pelvisPanel), getCmpByName('AlaStabilH', pelvisPanel), getCmpByName('IleumDisloceradH', pelvisPanel)],
						[getCmpByName('SILedH', pelvisPanel), getCmpByName('SILedDisloceradH', pelvisPanel)],
					    [getCmpByName('SakrumH', pelvisPanel), getCmpByName('SakrumDisloceradH', pelvisPanel)],
					    [getCmpByName('OSPubisH', pelvisPanel), getCmpByName('OSPubisDisloceradH', pelvisPanel)],
						[getCmpByName('RingskadaInstabilV', pelvisPanel), getCmpByName('AlaStabilV', pelvisPanel), getCmpByName('IleumDisloceradV', pelvisPanel)],
						[getCmpByName('SILedV', pelvisPanel), getCmpByName('SILedDisloceradV', pelvisPanel)],
					    [getCmpByName('SakrumV', pelvisPanel), getCmpByName('SakrumDisloceradV', pelvisPanel)],
						[getCmpByName('OSPubisV', pelvisPanel), getCmpByName('OSPubisDisloceradV', pelvisPanel)],
						[getCmpByName('Symfys', pelvisPanel), getCmpByName('SymfysDislocerad', pelvisPanel)],
						[getCmpByName('SpinopelvinDissociation', pelvisPanel), getCmpByName('Transversell', pelvisPanel), getCmpByName('Coccyx', pelvisPanel), getCmpByName('SakrumDislocerad', pelvisPanel)]
		];
	}

	function getGroupedCmps(cmp, pelvisPanel) {
		var groupedCmps = getGroupedCmpsArray(pelvisPanel);
		var i = 0;
		for (i = 0; i < groupedCmps.length; i++) {
			var j = 0;
			for (j = 0; j < groupedCmps[i].length; j++) {
				if (groupedCmps[i][j] === cmp) {
					return groupedCmps[i];
				}
			}
		}
		return [];
	}
	
	function createPelvisPanel() {
		//To change the placement of components modify the [CMP]_[SIDE]_FIRST_BOX_POS_X and [CMP]_FIRST_BOX_POS_Y
		//"constants", Changing for example ILEUM_RIGHT_FIRST_BOX_POS_X and ILEUM_FIRST_BOX_POS_Y moves the Ileum components (labels, headers and checkboxes)
		//Modifying the other constants changes components relative spacing. Changing for example HEADER_SPACE_Y 
		//modfies the height between header labels and related checkboxes.
		var ILEUM_RIGHT_FIRST_BOX_POS_X = 117;
		var ILEUM_LEFT_FIRST_BOX_POS_X = 460;
		var ILEUM_FIRST_BOX_POS_Y = 140;
		var SILED_RIGHT_FIRST_BOX_POS_X = 215;
		var SILED_LEFT_FIRST_BOX_POS_X = 362;
		var SILED_FIRST_BOX_POS_Y = 115;
		var SAKRUM_RIGHT_FIRST_BOX_POS_X = 246;
		var SAKRUM_LEFT_FIRST_BOX_POS_X = 330;
		var SAKRUM_FIRST_BOX_POS_Y = 47;
		var OSPUBIS_RIGHT_FIRST_BOX_POS_X = 216;
		var OSPUBIS_RIGHT_HEADER_POS_X = 248;
		var OSPUBIS_LEFT_FIRST_BOX_POS_X = 368;
		var OSPUBIS_FIRST_BOX_POS_Y = 457;
		var SAKRUM_MIDDLE_FIRST_BOX_POS_X = 280;
		var SAKRUM_MIDDLE_FIRST_BOX_POS_Y = 282;
		var SYMFYS_FIRST_BOX_POS_X = 278;
		var SYMFYS_FIRST_BOX_POS_Y = 457;
		var BOX_SPACE_Y = 16;
		var EXTRA_SEPARATOR_SPACE_Y = 3;
		var EXTRA_LABEL_SPACE_Y = 3;
		var HEADER_SPACE_Y = 15;
		var LEFT_LABEL_SPACE_X = 20;
		var DISLOCATED_RIGHT_LABEL_SPACE_X = -67;
		var HEADER_STYLE = 'background-color:white;font-weight:bold;z-index:2;';
		var DESC_STYLE = 'background-color:white;z-index:2;font-style:italic;';
		var LABEL_STYLE = 'background-color:white;z-index:2;';
		var DISLOCATED_LABEL_STYLE = 'background-color:white;font-style:italic;';
		var SEPARATOR_LABEL_STYLE = 'background-color:white;z-index:5;font-weight:bold;';
		var BOX_STYLE = 'z-index:1';
		return Ext.create('Ext.panel.Panel', {
			xtype: 'panel',
			cls: 'FormPanelSmallFont',
			name: 'pelvisPanel',
			layout: 'absolute',
			height: 668,
			width: 670,
			defaults: { handler: Ext.bind(onPelvisClick, this, [], true) },
			bodyStyle: 'background-image:url(' + app.imagesurl + 'sfr/Images/Skeleton/AO-pelvis.png);background-repeat:no-repeat;background-color:white;',

			items: [

      {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SILED_LEFT_FIRST_BOX_POS_X,
      	y: SILED_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'SILedV',
      	style: BOX_STYLE,
      	aValue: '3'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SILED_RIGHT_FIRST_BOX_POS_X,
      	y: SILED_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'SILedH',
      	style: BOX_STYLE,
      	aValue: '3'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 2),
      	boxLabel: '',
      	name: 'Coccyx',
      	style: BOX_STYLE,
      	aValue: '7'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 1),
      	boxLabel: '',
      	name: 'Transversell',
      	style: BOX_STYLE,
      	aValue: '6'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'SpinopelvinDissociation',
      	style: BOX_STYLE,
      	aValue: '5'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SYMFYS_FIRST_BOX_POS_X,
      	y: SYMFYS_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'Symfys',
      	style: BOX_STYLE,
      	aValue: '9'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_LEFT_FIRST_BOX_POS_X,
      	y: SAKRUM_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'SakrumV',
      	style: BOX_STYLE,
      	aValue: '4'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_RIGHT_FIRST_BOX_POS_X,
      	y: SAKRUM_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'SakrumH',
      	style: BOX_STYLE,
      	aValue: '4'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 1),
      	boxLabel: '',
      	name: 'AlaStabilV',
      	style: BOX_STYLE,
      	aValue: '2'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X,
      	y: ILEUM_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'RingskadaInstabilV',
      	style: BOX_STYLE,
      	aValue: '1'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X,
      	y: ILEUM_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'RingskadaInstabilH',
      	style: BOX_STYLE,
      	aValue: '1'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 1),
      	boxLabel: '',
      	name: 'AlaStabilH',
      	style: BOX_STYLE,
      	aValue: '2'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: OSPUBIS_LEFT_FIRST_BOX_POS_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'OSPubisV',
      	style: BOX_STYLE,
      	aValue: '8'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: OSPUBIS_RIGHT_FIRST_BOX_POS_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y,
      	boxLabel: '',
      	name: 'OSPubisH',
      	style: BOX_STYLE,
      	aValue: '8'
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SILED_LEFT_FIRST_BOX_POS_X,
      	y: SILED_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'SILedDisloceradV',
      	style: BOX_STYLE,
      	aValue: '6',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SILED_RIGHT_FIRST_BOX_POS_X,
      	y: SILED_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'SILedDisloceradH',
      	style: BOX_STYLE,
      	aValue: '6',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_LEFT_FIRST_BOX_POS_X,
      	y: SAKRUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'SakrumDisloceradV',
      	aValue: '2',
      	style: BOX_STYLE,
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_RIGHT_FIRST_BOX_POS_X,
      	y: SAKRUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'SakrumDisloceradH',
      	style: BOX_STYLE,
      	aValue: '2',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 2),
      	boxLabel: '',
      	name: 'IleumDisloceradV',
      	style: BOX_STYLE,
      	aValue: '7',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: OSPUBIS_LEFT_FIRST_BOX_POS_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'OSPubisDisloceradV',
      	style: BOX_STYLE,
      	aValue: '4',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SYMFYS_FIRST_BOX_POS_X,
      	y: SYMFYS_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'SymfysDislocerad',
      	style: BOX_STYLE,
      	aValue: '1',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: OSPUBIS_RIGHT_FIRST_BOX_POS_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y + (BOX_SPACE_Y),
      	boxLabel: '',
      	name: 'OSPubisDisloceradH',
      	style: BOX_STYLE,
      	aValue: '4',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 2),
      	boxLabel: '',
      	name: 'IleumDisloceradH',
      	style: BOX_STYLE,
      	aValue: '7',
      	disabled: true
      }, {
      	xtype: 'checkboxfield',
      	uncheckedValue: 'false',
      	inputValue: 'true',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 3),
      	boxLabel: '',
      	name: 'SakrumDislocerad',
      	style: BOX_STYLE,
      	aValue: '5',
      	disabled: true
      }, {
      	xtype: 'label',
      	text: 'Ilium hö',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X - 62,
      	y: ILEUM_FIRST_BOX_POS_Y - HEADER_SPACE_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Ilium vä',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: ILEUM_FIRST_BOX_POS_Y - HEADER_SPACE_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Sakrum hö',
      	x: SAKRUM_RIGHT_FIRST_BOX_POS_X - 73,
      	y: SAKRUM_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Sakrum vä',
      	x: SAKRUM_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Si-led hö',
      	x: SILED_RIGHT_FIRST_BOX_POS_X - 61,
      	y: SILED_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Si-led vä',
      	x: SILED_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SILED_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'OS pubis hö',
      	x: OSPUBIS_RIGHT_FIRST_BOX_POS_X - 81,
      	y: OSPUBIS_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'OS pubis vä',
      	x: OSPUBIS_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Symfys',
      	x: SYMFYS_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SYMFYS_FIRST_BOX_POS_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Sakrum',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y - HEADER_SPACE_Y,
      	style: HEADER_STYLE
      }, {
      	xtype: 'label',
      	text: 'Ringskada instabil',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X - 111,
      	y: ILEUM_FIRST_BOX_POS_Y + EXTRA_LABEL_SPACE_Y,
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Ringskada instabil',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: ILEUM_FIRST_BOX_POS_Y + EXTRA_LABEL_SPACE_Y,
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Ala stabil',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X - 59,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 1 + EXTRA_LABEL_SPACE_Y),
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Ala stabil',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 1 + EXTRA_LABEL_SPACE_Y),
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Spinopelvin dissociation',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + EXTRA_LABEL_SPACE_Y,
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Transversell',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 1 + EXTRA_LABEL_SPACE_Y),
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Coccyx',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 2 + EXTRA_LABEL_SPACE_Y),
      	style: LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: ILEUM_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 2 + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: ILEUM_RIGHT_FIRST_BOX_POS_X + DISLOCATED_RIGHT_LABEL_SPACE_X,
      	y: ILEUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 2 + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      },
      {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: SILED_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SILED_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: SILED_RIGHT_FIRST_BOX_POS_X + DISLOCATED_RIGHT_LABEL_SPACE_X,
      	y: SILED_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: SAKRUM_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: SAKRUM_RIGHT_FIRST_BOX_POS_X + DISLOCATED_RIGHT_LABEL_SPACE_X,
      	y: SAKRUM_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: OSPUBIS_RIGHT_FIRST_BOX_POS_X + DISLOCATED_RIGHT_LABEL_SPACE_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: OSPUBIS_LEFT_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: OSPUBIS_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: SYMFYS_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SYMFYS_FIRST_BOX_POS_Y + (BOX_SPACE_Y + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	text: 'Dislocerad',
      	x: SAKRUM_MIDDLE_FIRST_BOX_POS_X + LEFT_LABEL_SPACE_X,
      	y: SAKRUM_MIDDLE_FIRST_BOX_POS_Y + (BOX_SPACE_Y * 3 + EXTRA_LABEL_SPACE_Y),
      	style: DISLOCATED_LABEL_STYLE
      }, {
      	xtype: 'label',
      	html: 'Börja alltid med att sätta ett kryss för varje skadekomponent samt ytterligare kryss<br/>om dislocerad. Flera kryss är tillåtna. Gå sedan vidare genom att klicka på Nästa. Om frakturen är protesnära klicka istället på knappen Protesnära fraktur för den aktuella sidan.<br/><b>OBS! Acetabulumengagerande frakturer klassificeras i Acetabulum-modulen.</b>',
      	x: 20,
      	y: 535,
      	style: DESC_STYLE
      }, {
      	xtype: 'button',
      	name: 'prosthesisRight',
      	text: 'Protesnära fraktur Hö',
      	disabled: true,
      	style: 'background-color:#B80000 ;',
      	x: 10,
      	y: 430,
      	handler: function () {
      		aoImagesNavigationHandler(null, '61', '1', PROSTHESIS_FRACTURE, false);
      	}
      },
        {
        	xtype: 'button',
        	name: 'prosthesisLeft',
        	text: 'Protesnära fraktur Vä',
        	style: 'background-color:#B80000 ;',
        	disabled: true,
        	x: 445,
        	y: 430,
        	handler: function () {
        		aoImagesNavigationHandler(null, '61', '2', PROSTHESIS_FRACTURE, false);
        	}
        }
			]
		});
	}
	
	function createSkeletonWindow(aBody) {
		var n = 0;
		var tplSkeleton;
		var tplHandSkeleton;
		if (1) {
			tplSkeleton = new Ext.XTemplate(
				'<img src="{image}"> ',
				'<div class="skeleton SevenV"><a onmouseover="onHover(this, \'SevenV\' )" onmouseout="onUnHover(this, \'SevenV\')" onclick="onDetermineIfChildFracture(null,7,2,null,false)"></a></div>',
				'<div class="skeleton EightV"><a onmouseover="onHover(this, \'EightV\' )" onmouseout="onUnHover(this, \'EightV\')" onclick="onDetermineIfChildFracture(null,8,2,null,false)"></a></div>',
				'<div class="skeleton NineV"><a onmouseover="onHover(this, \'NineV\' )" onmouseout="onUnHover(this, \'NineV\')" onclick="onDetermineIfChildFracture(null,9,2,null,false)"></a></div>',
				'<div class="skeleton TenV"><a onmouseover="onHover(this, \'TenV\' )" onmouseout="onUnHover(this, \'TenV\')" onclick="onDetermineIfChildFracture(null,10,2,null,false)"></a></div>',
				'<div class="skeleton ElevenV"><a onmouseover="onHover(this, \'ElevenV\' )" onmouseout="onUnHover(this, \'ElevenV\')" onclick="onDetermineIfChildFracture(null,11,2,null,false)"></a></div>',
				'<div class="skeleton TwelveV"><a onmouseover="onHover(this, \'TwelveV\' )" onmouseout="onUnHover(this, \'TwelveV\')" onclick="onDetermineIfChildFracture(null,12,2,null,false)"></a></div>',
				'<div class="skeleton ThirteenV"><a onmouseover="onHover(this, \'ThirteenV\' )" onmouseout="onUnHover(this, \'ThirteenV\')" onclick="onDetermineIfChildFracture(null,13,2,null,false)"></a></div>',
				'<div class="skeleton TwentyoneV"><a onmouseover="onHover(this, \'TwentyoneV\' )" onmouseout="onUnHover(this, \'TwentyoneV\')" onclick="onDetermineIfChildFracture(null,21,2,null,false)"></a></div>',
				'<div class="skeleton TwentytwoV"><a onmouseover="onHover(this, \'TwentytwoV\' )" onmouseout="onUnHover(this, \'TwentytwoV\')" onclick="onDetermineIfChildFracture(null,22,2,null,false)"></a></div>',
				'<div class="skeleton TwentythreeV"><a onmouseover="onHover(this, \'TwentythreeV\' )" onmouseout="onUnHover(this, \'TwentythreeV\')" onclick="onDetermineIfChildFracture(null,23,2,null,false)"></a></div>',
				'<div class="skeleton ThirtyoneV"><a onmouseover="onHover(this, \'ThirtyoneV\' )" onmouseout="onUnHover(this, \'ThirtyoneV\')" onclick="onDetermineIfChildFracture(null,31,2,null,false)"></a></div>',
				'<div class="skeleton ThirtytwoV"><a onmouseover="onHover(this, \'ThirtytwoV\' )" onmouseout="onUnHover(this, \'ThirtytwoV\')" onclick="onDetermineIfChildFracture(null,32,2,null,false)"></a></div>',
				'<div class="skeleton ThirtythreeV"><a onmouseover="onHover(this, \'ThirtythreeV\' )" onmouseout="onUnHover(this, \'ThirtythreeV\')" onclick="onDetermineIfChildFracture(null,33,2,null,false)"></a></div>',
				'<div class="skeleton ThirtyFourV"><a onmouseover="onHover(this, \'ThirtyFourV\' )" onmouseout="onUnHover(this, \'ThirtyFourV\')" onclick="onDetermineIfChildFracture(null,34,2,null,false)"></a></div>',
				'<div class="skeleton FortyoneV"><a onmouseover="onHover(this, \'FortyoneV\' )" onmouseout="onUnHover(this, \'FortyoneV\')" onclick="onDetermineIfChildFracture(null,41,2,null,false)"></a></div>',
				'<div class="skeleton FortytwoV"><a onmouseover="onHover(this, \'FortytwoV\' )" onmouseout="onUnHover(this, \'FortytwoV\')" onclick="onDetermineIfChildFracture(null,42,2,null,false)"></a></div>',
				'<div class="skeleton FortythreeV"><a onmouseover="onHover(this, \'FortythreeV\' )" onmouseout="onUnHover(this, \'FortythreeV\')" onclick="onDetermineIfChildFracture(null,43,2,null,false)"></a></div>',
				'<div class="skeleton FortyfourV"><a onmouseover="onHover(this, \'FortyfourV\' )" onmouseout="onUnHover(this, \'FortyfourV\')" onclick="onDetermineIfChildFracture(null,44,2,null,false)"></a></div>',
				'<div class="skeleton SixtyTwoV"><a onmouseover="onHover(this, \'SixtyTwoV\' )" onmouseout="onUnHover(this, \'SixtyTwoV\')" onclick="onDetermineIfChildFracture(null,62,2,null,false)"></a></div>',
				'<div class="skeleton SevenH"><a onmouseover="onHover(this, \'SevenH\' )" onmouseout="onUnHover(this, \'SevenH\')" onclick="onDetermineIfChildFracture(null,7,1,null,false)"></a></div>',
				'<div class="skeleton EightH"><a onmouseover="onHover(this, \'EightH\' )" onmouseout="onUnHover(this, \'EightH\')" onclick="onDetermineIfChildFracture(null,8,1,null,false)"></a></div>',
				'<div class="skeleton NineH"><a onmouseover="onHover(this, \'NineH\' )" onmouseout="onUnHover(this, \'NineH\')" onclick="onDetermineIfChildFracture(null,9,1,null,false)"></a></div>',
				'<div class="skeleton TenH"><a onmouseover="onHover(this, \'TenH\' )" onmouseout="onUnHover(this, \'TenH\')" onclick="onDetermineIfChildFracture(null,10,1,null,false)"></a></div>',
				'<div class="skeleton ElevenH"><a onmouseover="onHover(this, \'ElevenH\' )" onmouseout="onUnHover(this, \'ElevenH\')" onclick="onDetermineIfChildFracture(null,11,1,null,false)"></a></div>',
				'<div class="skeleton TwelveH"><a onmouseover="onHover(this, \'TwelveH\' )" onmouseout="onUnHover(this, \'TwelveH\')" onclick="onDetermineIfChildFracture(null,12,1,null,false)"></a></div>',
				'<div class="skeleton ThirteenH"><a onmouseover="onHover(this, \'ThirteenH\' )" onmouseout="onUnHover(this, \'ThirteenH\')" onclick="onDetermineIfChildFracture(null,13,1,null,false)"></a></div>',
				'<div class="skeleton TwentyoneH"><a onmouseover="onHover(this, \'TwentyoneH\' )" onmouseout="onUnHover(this, \'TwentyoneH\')" onclick="onDetermineIfChildFracture(null,21,1,null,false)"></a></div>',
				'<div class="skeleton TwentytwoH"><a onmouseover="onHover(this, \'TwentytwoH\' )" onmouseout="onUnHover(this, \'TwentytwoH\')" onclick="onDetermineIfChildFracture(null,22,1,null,false)"></a></div>',
				'<div class="skeleton TwentythreeH"><a onmouseover="onHover(this, \'TwentythreeH\' )" onmouseout="onUnHover(this, \'TwentythreeH\')" onclick="onDetermineIfChildFracture(null,23,1,null,false)"></a></div>',
				'<div class="skeleton ThirtyoneH"><a onmouseover="onHover(this, \'ThirtyoneH\' )" onmouseout="onUnHover(this, \'ThirtyoneH\')" onclick="onDetermineIfChildFracture(null,31,1,null,false)"></a></div>',
				'<div class="skeleton ThirtytwoH"><a onmouseover="onHover(this, \'ThirtytwoH\' )" onmouseout="onUnHover(this, \'ThirtytwoH\')" onclick="onDetermineIfChildFracture(null,32,1,null,false)"></a></div>',
				'<div class="skeleton ThirtythreeH"><a onmouseover="onHover(this, \'ThirtythreeH\' )" onmouseout="onUnHover(this, \'ThirtythreeH\')" onclick="onDetermineIfChildFracture(null,33,1,null,false)"></a></div>',
				'<div class="skeleton ThirtyFourH"><a onmouseover="onHover(this, \'ThirtyFourH\' )" onmouseout="onUnHover(this, \'ThirtyFourH\')" onclick="onDetermineIfChildFracture(null,34,1,null,false)"></a></div>',
				'<div class="skeleton FortyoneH"><a onmouseover="onHover(this, \'FortyoneH\' )" onmouseout="onUnHover(this, \'FortyoneH\')" onclick="onDetermineIfChildFracture(null,41,1,null,false)"></a></div>',
				'<div class="skeleton FortytwoH"><a onmouseover="onHover(this, \'FortytwoH\' )" onmouseout="onUnHover(this, \'FortytwoH\')"  onclick="onDetermineIfChildFracture(null,42,1,null,false)"></a></div>',
				'<div class="skeleton FortythreeH"><a onmouseover="onHover(this, \'FortythreeH\' )" onmouseout="onUnHover(this, \'FortythreeH\')" onclick="onDetermineIfChildFracture(null,43,1,null,false)"></a></div>',
				'<div class="skeleton FortyfourH"><a onmouseover="onHover(this, \'FortyfourH\' )" onmouseout="onUnHover(this, \'FortyfourH\')"  onclick="onDetermineIfChildFracture(null,44,1,null,false)"></a></div>',
				'<div class="skeleton SixtyTwoH"><a onmouseover="onHover(this, \'SixtyTwoH\' )" onmouseout="onUnHover(this, \'SixtyTwoH\')" onclick="onDetermineIfChildFracture(null,62,1,null,false)"></a></div>',
				'<div class="skeleton SixtyOne"><a onmouseover="onHover(this, \'SixtyOne\' )" onmouseout="onUnHover(this, \'SixtyOne\')" onclick="onDetermineIfChildFracture(null,61,0,null,false)"></a></div>',
                '<div title="C0-C2" class="skeleton Hundred"><a onmouseover="onHover(this, \'Hundred\' )" onmouseout="onUnHover(this, \'Hundred\')" onclick="onDetermineIfChildFracture(null,100,3,null,false)"></a></div>',
                '<div title="C3-T1" class="skeleton HundredOne"><a onmouseover="onHover(this, \'HundredOne\' )" onmouseout="onUnHover(this, \'HundredOne\')" onclick="onDetermineIfChildFracture(null,101,3,null,false)"></a></div>',
                '<div title="T2-T10" class="skeleton HundredTwo"><a onmouseover="onHover(this, \'HundredTwo\' )" onmouseout="onUnHover(this, \'HundredTwo\')" onclick="onDetermineIfChildFracture(null,102,3,null,false)"></a></div>',
                '<div title="T11-L5" class="skeleton HundredThree"><a onmouseover="onHover(this, \'HundredThree\' )" onmouseout="onUnHover(this, \'HundredThree\')" onclick="onDetermineIfChildFracture(null,103,3,null,false)"></a></div>'
			);
		} else {
			tplSkeleton = new Ext.XTemplate(
				'<img src="{image}"> ',
				'<div class="skeleton SevenV"><a onmouseover="onHover(this, \'SevenV\' )" onmouseout="onUnHover(this, \'SevenV\')" onclick="onDetermineIfChildFracture(null,7,2,null,false)"></a></div>',
				'<div class="skeleton EightV"><a onmouseover="onHover(this, \'EightV\' )" onmouseout="onUnHover(this, \'EightV\')" onclick="onDetermineIfChildFracture(null,8,2,null,false)"></a></div>',
				'<div class="skeleton NineV"><a onmouseover="onHover(this, \'NineV\' )" onmouseout="onUnHover(this, \'NineV\')" onclick="onDetermineIfChildFracture(null,9,2,null,false)"></a></div>',
				'<div class="skeleton TenV"><a onmouseover="onHover(this, \'TenV\' )" onmouseout="onUnHover(this, \'TenV\')" onclick="onDetermineIfChildFracture(null,10,2,null,false)"></a></div>',
				'<div class="skeleton ElevenV"><a onmouseover="onHover(this, \'ElevenV\' )" onmouseout="onUnHover(this, \'ElevenV\')" onclick="onDetermineIfChildFracture(null,11,2,null,false)"></a></div>',
				'<div class="skeleton TwelveV"><a onmouseover="onHover(this, \'TwelveV\' )" onmouseout="onUnHover(this, \'TwelveV\')" onclick="onDetermineIfChildFracture(null,12,2,null,false)"></a></div>',
				'<div class="skeleton ThirteenV"><a onmouseover="onHover(this, \'ThirteenV\' )" onmouseout="onUnHover(this, \'ThirteenV\')" onclick="onDetermineIfChildFracture(null,13,2,null,false)"></a></div>',
				'<div class="skeleton TwentyoneV"><a onmouseover="onHover(this, \'TwentyoneV\' )" onmouseout="onUnHover(this, \'TwentyoneV\')" onclick="onDetermineIfChildFracture(null,21,2,null,false)"></a></div>',
				'<div class="skeleton TwentytwoV"><a onmouseover="onHover(this, \'TwentytwoV\' )" onmouseout="onUnHover(this, \'TwentytwoV\')" onclick="onDetermineIfChildFracture(null,22,2,null,false)"></a></div>',
				'<div class="skeleton TwentythreeV"><a onmouseover="onHover(this, \'TwentythreeV\' )" onmouseout="onUnHover(this, \'TwentythreeV\')" onclick="onDetermineIfChildFracture(null,23,2,null,false)"></a></div>',
				'<div class="skeleton ThirtyoneV"><a onmouseover="onHover(this, \'ThirtyoneV\' )" onmouseout="onUnHover(this, \'ThirtyoneV\')" onclick="onDetermineIfChildFracture(null,31,2,null,false)"></a></div>',
				'<div class="skeleton ThirtytwoV"><a onmouseover="onHover(this, \'ThirtytwoV\' )" onmouseout="onUnHover(this, \'ThirtytwoV\')" onclick="onDetermineIfChildFracture(null,32,2,null,false)"></a></div>',
				'<div class="skeleton ThirtythreeV"><a onmouseover="onHover(this, \'ThirtythreeV\' )" onmouseout="onUnHover(this, \'ThirtythreeV\')" onclick="onDetermineIfChildFracture(null,33,2,null,false)"></a></div>',
				'<div class="skeleton ThirtyFourV"><a onmouseover="onHover(this, \'ThirtyFourV\' )" onmouseout="onUnHover(this, \'ThirtyFourV\')" onclick="onDetermineIfChildFracture(null,34,2,null,false)"></a></div>',
				'<div class="skeleton FortyoneV"><a onmouseover="onHover(this, \'FortyoneV\' )" onmouseout="onUnHover(this, \'FortyoneV\')" onclick="onDetermineIfChildFracture(null,41,2,null,false)"></a></div>',
				'<div class="skeleton FortytwoV"><a onmouseover="onHover(this, \'FortytwoV\' )" onmouseout="onUnHover(this, \'FortytwoV\')" onclick="onDetermineIfChildFracture(null,42,2,null,false)"></a></div>',
				'<div class="skeleton FortythreeV"><a onmouseover="onHover(this, \'FortythreeV\' )" onmouseout="onUnHover(this, \'FortythreeV\')" onclick="onDetermineIfChildFracture(null,43,2,null,false)"></a></div>',
				'<div class="skeleton FortyfourV"><a onmouseover="onHover(this, \'FortyfourV\' )" onmouseout="onUnHover(this, \'FortyfourV\')" onclick="onDetermineIfChildFracture(null,44,2,null,false)"></a></div>',
				'<div class="skeleton SixtyTwoV"><a onmouseover="onHover(this, \'SixtyTwoV\' )" onmouseout="onUnHover(this, \'SixtyTwoV\')" onclick="onDetermineIfChildFracture(null,62,2,null,false)"></a></div>',
				'<div class="skeleton SevenH"><a onmouseover="onHover(this, \'SevenH\' )" onmouseout="onUnHover(this, \'SevenH\')" onclick="onDetermineIfChildFracture(null,7,1,null,false)"></a></div>',
				'<div class="skeleton EightH"><a onmouseover="onHover(this, \'EightH\' )" onmouseout="onUnHover(this, \'EightH\')" onclick="onDetermineIfChildFracture(null,8,1,null,false)"></a></div>',
				'<div class="skeleton NineH"><a onmouseover="onHover(this, \'NineH\' )" onmouseout="onUnHover(this, \'NineH\')" onclick="onDetermineIfChildFracture(null,9,1,null,false)"></a></div>',
				'<div class="skeleton TenH"><a onmouseover="onHover(this, \'TenH\' )" onmouseout="onUnHover(this, \'TenH\')" onclick="onDetermineIfChildFracture(null,10,1,null,false)"></a></div>',
				'<div class="skeleton ElevenH"><a onmouseover="onHover(this, \'ElevenH\' )" onmouseout="onUnHover(this, \'ElevenH\')" onclick="onDetermineIfChildFracture(null,11,1,null,false)"></a></div>',
				'<div class="skeleton TwelveH"><a onmouseover="onHover(this, \'TwelveH\' )" onmouseout="onUnHover(this, \'TwelveH\')" onclick="onDetermineIfChildFracture(null,12,1,null,false)"></a></div>',
				'<div class="skeleton ThirteenH"><a onmouseover="onHover(this, \'ThirteenH\' )" onmouseout="onUnHover(this, \'ThirteenH\')" onclick="onDetermineIfChildFracture(null,13,1,null,false)"></a></div>',
				'<div class="skeleton TwentyoneH"><a onmouseover="onHover(this, \'TwentyoneH\' )" onmouseout="onUnHover(this, \'TwentyoneH\')" onclick="onDetermineIfChildFracture(null,21,1,null,false)"></a></div>',
				'<div class="skeleton TwentytwoH"><a onmouseover="onHover(this, \'TwentytwoH\' )" onmouseout="onUnHover(this, \'TwentytwoH\')" onclick="onDetermineIfChildFracture(null,22,1,null,false)"></a></div>',
				'<div class="skeleton TwentythreeH"><a onmouseover="onHover(this, \'TwentythreeH\' )" onmouseout="onUnHover(this, \'TwentythreeH\')" onclick="onDetermineIfChildFracture(null,23,1,null,false)"></a></div>',
				'<div class="skeleton ThirtyoneH"><a onmouseover="onHover(this, \'ThirtyoneH\' )" onmouseout="onUnHover(this, \'ThirtyoneH\')" onclick="onDetermineIfChildFracture(null,31,1,null,false)"></a></div>',
				'<div class="skeleton ThirtytwoH"><a onmouseover="onHover(this, \'ThirtytwoH\' )" onmouseout="onUnHover(this, \'ThirtytwoH\')" onclick="onDetermineIfChildFracture(null,32,1,null,false)"></a></div>',
				'<div class="skeleton ThirtythreeH"><a onmouseover="onHover(this, \'ThirtythreeH\' )" onmouseout="onUnHover(this, \'ThirtythreeH\')" onclick="onDetermineIfChildFracture(null,33,1,null,false)"></a></div>',
				'<div class="skeleton ThirtyFourH"><a onmouseover="onHover(this, \'ThirtyFourH\' )" onmouseout="onUnHover(this, \'ThirtyFourH\')" onclick="onDetermineIfChildFracture(null,34,1,null,false)"></a></div>',
				'<div class="skeleton FortyoneH"><a onmouseover="onHover(this, \'FortyoneH\' )" onmouseout="onUnHover(this, \'FortyoneH\')" onclick="onDetermineIfChildFracture(null,41,1,null,false)"></a></div>',
				'<div class="skeleton FortytwoH"><a onmouseover="onHover(this, \'FortytwoH\' )" onmouseout="onUnHover(this, \'FortytwoH\')"  onclick="onDetermineIfChildFracture(null,42,1,null,false)"></a></div>',
				'<div class="skeleton FortythreeH"><a onmouseover="onHover(this, \'FortythreeH\' )" onmouseout="onUnHover(this, \'FortythreeH\')" onclick="onDetermineIfChildFracture(null,43,1,null,false)"></a></div>',
				'<div class="skeleton FortyfourH"><a onmouseover="onHover(this, \'FortyfourH\' )" onmouseout="onUnHover(this, \'FortyfourH\')"  onclick="onDetermineIfChildFracture(null,44,1,null,false)"></a></div>',
				'<div class="skeleton SixtyTwoH"><a onmouseover="onHover(this, \'SixtyTwoH\' )" onmouseout="onUnHover(this, \'SixtyTwoH\')" onclick="onDetermineIfChildFracture(null,62,1,null,false)"></a></div>',
				'<div class="skeleton SixtyOne"><a onmouseover="onHover(this, \'SixtyOne\' )" onmouseout="onUnHover(this, \'SixtyOne\')" onclick="onDetermineIfChildFracture(null,61,0,null,false)"></a></div>',
                '<div title="C0-C2" class="skeleton Hundred"><a onmouseover="onHover(this, \'Hundred\' )" onmouseout="onUnHover(this, \'Hundred\')" onclick="onDetermineIfChildFracture(null,100,3,null,false)"></a></div>',
                '<div title="C3-T1" class="skeleton HundredOne"><a onmouseover="onHover(this, \'HundredOne\' )" onmouseout="onUnHover(this, \'HundredOne\')" onclick="onDetermineIfChildFracture(null,101,3,null,false)"></a></div>',
                '<div title="T2-T10" class="skeleton HundredTwo"><a onmouseover="onHover(this, \'HundredTwo\' )" onmouseout="onUnHover(this, \'HundredTwo\')" onclick="onDetermineIfChildFracture(null,102,3,null,false)"></a></div>',
                '<div title="T11-L5" class="skeleton HundredThree"><a onmouseover="onHover(this, \'HundredThree\' )" onmouseout="onUnHover(this, \'HundredThree\')" onclick="onDetermineIfChildFracture(null,103,3,null,false)"></a></div>'
			);
		}
		tplHandSkeletonV = new Ext.XTemplate(
				'<div id="container" style="display:block;background-image:url(https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-V.png);" width="591" height="500">',
				'<img src="https://stratum.blob.core.windows.net/sfr/Images/s.gif" width="591" height="500" />',
				'<img src="https://stratum.blob.core.windows.net/sfr/Images/s.gif" style="position:absolute;top:0px; left:0px;z-index:2;" width="591" height="500" class="map-trans" usemap="#handMap" />',
				'<img onload="onLoadHandImgMini()"  src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-75P-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:423px; left:345px;z-index:0;visibility:hidden;" id="img75P" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-75T-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:404px; left:334px;z-index:0;visibility:hidden;" id="img75T" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-71-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:438px; left:299px;z-index:0;visibility:hidden;" id="img71" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-72-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:419px; left:253px;z-index:0;visibility:hidden;" id="img72" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-76T2-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:392px; left:266px;z-index:0;visibility:hidden;" id="img76T2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-73-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:388px; left:282px;z-index:0;visibility:hidden;" id="img73" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-74-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:380px; left:319px;z-index:0;visibility:hidden;" id="img74" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-76T1-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:388px; left:231px;z-index:0;visibility:hidden;" id="img76T1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78N1-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:128px; left:239px;z-index:0;visibility:hidden;" id="img78N1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78M1-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:123px; left:289px;z-index:0;visibility:hidden;" id="img78M1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78R1-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:148px; left:338px;z-index:0;visibility:hidden;" id="img78R1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78L1-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:200px; left:386px;z-index:0;visibility:hidden;" id="img78L1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77N-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:229px; left:244px;z-index:0;visibility:hidden;" id="img77N" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77M-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:231px; left:286px;z-index:0;visibility:hidden;" id="img77M" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77R-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:244px; left:312px;z-index:0;visibility:hidden;" id="img77R" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77L-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:270px; left:337px;z-index:0;visibility:hidden;" id="img77L" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78N2-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:72px; left:229px;z-index:0;visibility:hidden;" id="img78N2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78M2-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:55px; left:289px;z-index:0;visibility:hidden;" id="img78M2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78R2-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:78px; left:348px;z-index:0;visibility:hidden;" id="img78R2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78L2-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:139px; left:412px;z-index:0;visibility:hidden;" id="img78L2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78N3-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:34px; left:233px;z-index:0;visibility:hidden;" id="img78N3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78M3-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:5px; left:290px;z-index:0;visibility:hidden;" id="img78M3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78R3-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:33px; left:360px;z-index:0;visibility:hidden;" id="img78R3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78L3-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:108px; left:417px;z-index:0;visibility:hidden;" id="img78L3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78T2-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:205px; left:100px;z-index:0;visibility:hidden;" id="img78T2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78T1-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:250px; left:124px;z-index:0;visibility:hidden;" id="img78T1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77T-V-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:310px; left:159px;z-index:0;visibility:hidden;" id="img77T" />',
				'</div>',
				'<map id="handMap" name="handMap">',
				'<area title="Pisiforme" shape="polygon" coords="339,437,347,451,371,451,371,419,358,419" onmouseover="onHandSkeletonHover(\'img75P\')" onmouseout="onHandSkeletonUnhover(\'img75P\')" onclick="aoImagesNavigationHandler(null,\'75P\',2,null,true)"/>',
				'<area title="Triquetrum" shape="polygon" coords="331,431,338,436,353,417,380,417,380,396,354,396" onmouseover="onHandSkeletonHover(\'img75T\')" onmouseout="onHandSkeletonUnhover(\'img75T\')" onclick="aoImagesNavigationHandler(null,\'75T\',2,null,true)"/>',
				'<area title="Lunatum" shape="polygon" coords="298,449,308,464,348,464,328,435" onmouseover="onHandSkeletonHover(\'img71\')" onmouseout="onHandSkeletonUnhover(\'img71\')" onclick="aoImagesNavigationHandler(null,\'71\',2,null,true)"/>',
				'<area title="Scaphoideum" shape="polygon" coords="245,438,297,463,297,442,279,415" onmouseover="onHandSkeletonHover(\'img72\')" onmouseout="onHandSkeletonUnhover(\'img72\')" onclick="aoImagesNavigationHandler(null,\'72\',2,null,true)"/>',
				'<area title="Trapezoideum" shape="polygon" coords="266,399,279,415,287,410,290,390,269,390" onmouseover="onHandSkeletonHover(\'img76T2\')" onmouseout="onHandSkeletonUnhover(\'img76T2\')" onclick="aoImagesNavigationHandler(null,\'76T2\',2,null,true)"/>',
				'<area title="Capitatum" shape="polygon" coords="281,417,298,443,320,431,311,382" onmouseover="onHandSkeletonHover(\'img73\')" onmouseout="onHandSkeletonUnhover(\'img73\')" onclick="aoImagesNavigationHandler(null,\'73\',2,null,true)"/>',
				'<area title="Hamatum" shape="polygon" coords="319,395,324,432,353,393,337,376" onmouseover="onHandSkeletonHover(\'img74\')" onmouseout="onHandSkeletonUnhover(\'img74\')" onclick="aoImagesNavigationHandler(null,\'74\',2,null,true)"/>',
				'<area title="Trapezium" shape="polygon" coords="221,415,247,438,279,416,258,392" onmouseover="onHandSkeletonHover(\'img76T1\')" onmouseout="onHandSkeletonUnhover(\'img76T1\')" onclick="aoImagesNavigationHandler(null,\'76T1\',2,null,true)"/>',
				'<area title="Metakarpal N" shape="rect" coords="253,235,284,386" onmouseover="onHandSkeletonHover(\'img77N\')" onmouseout="onHandSkeletonUnhover(\'img77N\')" onclick="aoImagesNavigationHandler(null,\'77N\',2,null,true)"/>',
				'<area title="Metakarpal M" shape="rect" coords="292,235,327,372" onmouseover="onHandSkeletonHover(\'img77M\')" onmouseout="onHandSkeletonUnhover(\'img77M\')" onclick="aoImagesNavigationHandler(null,\'77M\',2,null,true)"/>',
				'<area title="Metakarpal R" shape="rect" coords="333,247,366,359" onmouseover="onHandSkeletonHover(\'img77R\')" onmouseout="onHandSkeletonUnhover(\'img77R\')" onclick="aoImagesNavigationHandler(null,\'77R\',2,null,true)"/>',
				'<area title="Metakarpal L" shape="rect" coords="372,270,418,384" onmouseover="onHandSkeletonHover(\'img77L\')" onmouseout="onHandSkeletonUnhover(\'img77L\')" onclick="aoImagesNavigationHandler(null,\'77L\',2,null,true)"/>',
				'<area title="Proximal falang N" shape="rect" coords="236,134,282,231" onmouseover="onHandSkeletonHover(\'img78N1\')" onmouseout="onHandSkeletonUnhover(\'img78N1\')" onclick="aoImagesNavigationHandler(null,\'78N1\',2,null,true)"/>',
				'<area title="Proximal falang M" shape="rect" coords="290,124,330,233" onmouseover="onHandSkeletonHover(\'img78M1\')" onmouseout="onHandSkeletonUnhover(\'img78M1\')" onclick="aoImagesNavigationHandler(null,\'78M1\',2,null,true)"/>',
				'<area title="Proximal falang R" shape="rect" coords="340,145,378,248" onmouseover="onHandSkeletonHover(\'img78R1\')" onmouseout="onHandSkeletonUnhover(\'img78R1\')" onclick="aoImagesNavigationHandler(null,\'78R1\',2,null,true)"/>',
				'<area title="Proximal falang L" shape="rect" coords="387,195,435,275" onmouseover="onHandSkeletonHover(\'img78L1\')" onmouseout="onHandSkeletonUnhover(\'img78L1\')" onclick="aoImagesNavigationHandler(null,\'78L1\',2,null,true)"/>',
				'<area title="Mellanfalang N" shape="rect" coords="227,78,282,135" onmouseover="onHandSkeletonHover(\'img78N2\')" onmouseout="onHandSkeletonUnhover(\'img78N2\')" onclick="aoImagesNavigationHandler(null,\'78N2\',2,null,true)"/>',
				'<area title="Mellanfalang M" shape="rect" coords="290,52,332,121" onmouseover="onHandSkeletonHover(\'img78M2\')" onmouseout="onHandSkeletonUnhover(\'img78M2\')" onclick="aoImagesNavigationHandler(null,\'78M2\',2,null,true)"/>',
				'<area title="Mellanfalang R" shape="rect" coords="349,77,392,144" onmouseover="onHandSkeletonHover(\'img78R2\')" onmouseout="onHandSkeletonUnhover(\'img78R2\')" onclick="aoImagesNavigationHandler(null,\'78R2\',2,null,true)"/>',
				'<area title="Mellanfalang L" shape="rect" coords="405,147,450,198" onmouseover="onHandSkeletonHover(\'img78L2\')" onmouseout="onHandSkeletonUnhover(\'img78L2\')" onclick="aoImagesNavigationHandler(null,\'78L2\',2,null,true)"/>',
				'<area title="Distal falang N" shape="rect" coords="218,37,266,75" onmouseover="onHandSkeletonHover(\'img78N3\')" onmouseout="onHandSkeletonUnhover(\'img78N3\')" onclick="aoImagesNavigationHandler(null,\'78N3\',2,null,true)"/>',
				'<area title="Distal falang M" shape="rect" coords="291,1,332,52" onmouseover="onHandSkeletonHover(\'img78M3\')" onmouseout="onHandSkeletonUnhover(\'img78M3\')" onclick="aoImagesNavigationHandler(null,\'78M3\',2,null,true)"/>',
				'<area title="Distal falang R" shape="rect" coords="356,32,392,87" onmouseover="onHandSkeletonHover(\'img78R3\')" onmouseout="onHandSkeletonUnhover(\'img78R3\')" onclick="aoImagesNavigationHandler(null,\'78R3\',2,null,true)"/>',
				'<area title="Distal falang L" shape="rect" coords="411,109,457,152" onmouseover="onHandSkeletonHover(\'img78L3\')" onmouseout="onHandSkeletonUnhover(\'img78L3\')" onclick="aoImagesNavigationHandler(null,\'78L3\',2,null,true)"/>',
				'<area title="Distal falang T" shape="rect" coords="76,204,160,251" onmouseover="onHandSkeletonHover(\'img78T2\')" onmouseout="onHandSkeletonUnhover(\'img78T2\')" onclick="aoImagesNavigationHandler(null,\'78T2\',2,null,true)"/>',
				'<area title="Proximal falang T" shape="rect" coords="114,267,194,316" onmouseover="onHandSkeletonHover(\'img78T1\')" onmouseout="onHandSkeletonUnhover(\'img78T1\')" onclick="aoImagesNavigationHandler(null,\'78T1\',2,null,true)"/>',
				'<area title="Metakarpal T" shape="rect" coords="160,327,248,396" onmouseover="onHandSkeletonHover(\'img77T\')" onmouseout="onHandSkeletonUnhover(\'img77T\')" onclick="aoImagesNavigationHandler(null,\'77T\',2,null,true)"/>',
				'</map>'
			);

		tplHandSkeletonH = new Ext.XTemplate(
				'<div id="container" style="display:block;background-image:url(https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-H.png);" width="591" height="500">',
				'<img src="https://stratum.blob.core.windows.net/sfr/Images/s.gif" width="591" height="500" />',
				'<img src="https://stratum.blob.core.windows.net/sfr/Images/s.gif" style="position:absolute;top:0px; left:0px;z-index:2;" width="591" height="500" class="map-trans" usemap="#handMap" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-75P-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:423px; left:208px;z-index:0;visibility:hidden;" id="img75P" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-75T-H-mini.png?_' + (new Date().getTime()) + '"  style="position:absolute;top:404px; left:208px;z-index:0;visibility:hidden;" id="img75T" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-71-H-mini.png?_' + (new Date().getTime()) + '"  style="position:absolute;top:438px; left:230px;z-index:0;visibility:hidden;" id="img71" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-72-H-mini.png?_' + (new Date().getTime()) + '"  style="position:absolute;top:419px; left:271px;z-index:0;visibility:hidden;" id="img72" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-76T2-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:392px; left:288px;z-index:0;visibility:hidden;" id="img76T2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-73-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:388px; left:255px;z-index:0;visibility:hidden;" id="img73" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-74-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:380px; left:221px;z-index:0;visibility:hidden;" id="img74" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-76T1-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:388px; left:300px;z-index:0;visibility:hidden;" id="img76T1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78N1-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:128px; left:296px;z-index:0;visibility:hidden;" id="img78N1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78M1-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:123px; left:251px;z-index:0;visibility:hidden;" id="img78M1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78R1-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:148px; left:192px;z-index:0;visibility:hidden;" id="img78R1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78L1-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:200px; left:137px;z-index:0;visibility:hidden;" id="img78L1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77N-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:229px; left:283px;z-index:0;visibility:hidden;" id="img77N" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77M-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:231px; left:248px;z-index:0;visibility:hidden;" id="img77M" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77R-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:244px; left:203px;z-index:0;visibility:hidden;" id="img77R" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77L-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:270px; left:168px;z-index:0;visibility:hidden;" id="img77L" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78N2-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:72px; left:300px;z-index:0;visibility:hidden;" id="img78N2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78M2-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:55px; left:246px;z-index:0;visibility:hidden;" id="img78M2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78R2-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:78px; left:185px;z-index:0;visibility:hidden;" id="img78R2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78L2-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:139px; left:137px;z-index:0;visibility:hidden;" id="img78L2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78N3-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:34px; left:310px;z-index:0;visibility:hidden;" id="img78N3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78M3-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:5px; left:243px;z-index:0;visibility:hidden;" id="img78M3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78R3-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:33px; left:186px;z-index:0;visibility:hidden;" id="img78R3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78L3-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:108px; left:127px;z-index:0;visibility:hidden;" id="img78L3" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78T2-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:205px; left:434px;z-index:0;visibility:hidden;" id="img78T2" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-78T1-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:250px; left:393px;z-index:0;visibility:hidden;" id="img78T1" />',
				'<img onload="onLoadHandImgMini()" src="https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-hand-77T-H-mini.png?_' + (new Date().getTime()) + '" style="position:absolute;top:310px; left:319px;z-index:0;visibility:hidden;" id="img77T" />',
				'</div>',
				'<map id="handMap" name="handMap">',
				'<area title="Pisiforme" shape="polygon" coords="208,427, 217,447, 237,447, 241,442, 239 ,422" onmouseover="onHandSkeletonHover(\'img75P\')" onmouseout="onHandSkeletonUnhover(\'img75P\')" onclick="aoImagesNavigationHandler(null,\'75P\',1,null,true)"/>',
				'<area title="Triquetrum" shape="polygon" coords="203,405, 203,418, 221,418, 238,437, 246,431, 217,399" onmouseover="onHandSkeletonHover(\'img75T\')" onmouseout="onHandSkeletonUnhover(\'img75T\')" onclick="aoImagesNavigationHandler(null,\'75T\',1,null,true)"/>',
				'<area title="Lunatum" shape="polygon" coords="230,465, 271,465, 278,445, 251,435" onmouseover="onHandSkeletonHover(\'img71\')" onmouseout="onHandSkeletonUnhover(\'img71\')" onclick="aoImagesNavigationHandler(null,\'71\',1,null,true)"/>',
				'<area title="Scaphoideum" shape="polygon" coords="297,416, 289,431, 282,445, 282,470, 332,439" onmouseover="onHandSkeletonHover(\'img72\')" onmouseout="onHandSkeletonUnhover(\'img72\')" onclick="aoImagesNavigationHandler(null,\'72\',1,null,true)"/>',
				'<area title="Trapezoideum" shape="polygon" coords="287,394, 287,410, 297,415, 315,392" onmouseover="onHandSkeletonHover(\'img76T2\')" onmouseout="onHandSkeletonUnhover(\'img76T2\')" onclick="aoImagesNavigationHandler(null,\'76T2\',1,null,true)"/>',
				'<area title="Capitatum" shape="polygon" coords="260,397, 257,436, 278,443, 296,416" onmouseover="onHandSkeletonHover(\'img73\')" onmouseout="onHandSkeletonUnhover(\'img73\')" onclick="aoImagesNavigationHandler(null,\'73\',1,null,true)"/>',
				'<area title="Hamatum" shape="polygon" coords="217,399, 248,430, 259,403, 238,380" onmouseover="onHandSkeletonHover(\'img74\')" onmouseout="onHandSkeletonUnhover(\'img74\')" onclick="aoImagesNavigationHandler(null,\'74\',1,null,true)"/>',
				'<area title="Trapezium" shape="polygon" coords="320,397, 299,417, 312,429, 335,432, 347,413" onmouseover="onHandSkeletonHover(\'img76T1\')" onmouseout="onHandSkeletonUnhover(\'img76T1\')" onclick="aoImagesNavigationHandler(null,\'76T1\',1,null,true)"/>',
				'<area title="Metakarpal N" shape="rect" coords="292,235,327,372" onmouseover="onHandSkeletonHover(\'img77N\')" onmouseout="onHandSkeletonUnhover(\'img77N\')" onclick="aoImagesNavigationHandler(null,\'77N\',1,null,true)"/>',
				'<area title="Metakarpal M" shape="rect" coords="253,235,284,386" onmouseover="onHandSkeletonHover(\'img77M\')" onmouseout="onHandSkeletonUnhover(\'img77M\')" onclick="aoImagesNavigationHandler(null,\'77M\',1,null,true)"/>',
				'<area title="Metakarpal R" shape="rect" coords="206,246,251,386" onmouseover="onHandSkeletonHover(\'img77R\')" onmouseout="onHandSkeletonUnhover(\'img77R\')" onclick="aoImagesNavigationHandler(null,\'77R\',1,null,true)"/>',
				'<area title="Metakarpal L" shape="rect" coords="165,286,210,376" onmouseover="onHandSkeletonHover(\'img77L\')" onmouseout="onHandSkeletonUnhover(\'img77L\')" onclick="aoImagesNavigationHandler(null,\'77L\',1,null,true)"/>',
				'<area title="Proximal falang N" shape="rect" coords="296,132,346,232" onmouseover="onHandSkeletonHover(\'img78N1\')" onmouseout="onHandSkeletonUnhover(\'img78N1\')" onclick="aoImagesNavigationHandler(null,\'78N1\',1,null,true)"/>',
				'<area title="Proximal falang M" shape="rect" coords="247,131,284,232" onmouseover="onHandSkeletonHover(\'img78M1\')" onmouseout="onHandSkeletonUnhover(\'img78M1\')" onclick="aoImagesNavigationHandler(null,\'78M1\',1,null,true)"/>',
				'<area title="Proximal falang R" shape="rect" coords="193,148,235,242" onmouseover="onHandSkeletonHover(\'img78R1\')" onmouseout="onHandSkeletonUnhover(\'img78R1\')" onclick="aoImagesNavigationHandler(null,\'78R1\',1,null,true)"/>',
				'<area title="Proximal falang L" shape="rect" coords="144,197,189,272" onmouseover="onHandSkeletonHover(\'img78L1\')" onmouseout="onHandSkeletonUnhover(\'img78L1\')" onclick="aoImagesNavigationHandler(null,\'78L1\',1,null,true)"/>',
				'<area title="Mellanfalang N" shape="rect" coords="309,80,346,130" onmouseover="onHandSkeletonHover(\'img78N2\')" onmouseout="onHandSkeletonUnhover(\'img78N2\')" onclick="aoImagesNavigationHandler(null,\'78N2\',1,null,true)"/>',
				'<area title="Mellanfalang M" shape="rect" coords="248,56,286,122" onmouseover="onHandSkeletonHover(\'img78M2\')" onmouseout="onHandSkeletonUnhover(\'img78M2\')" onclick="aoImagesNavigationHandler(null,\'78M2\',1,null,true)"/>',
				'<area title="Mellanfalang R" shape="rect" coords="189,87,224 146" onmouseover="onHandSkeletonHover(\'img78R2\')" onmouseout="onHandSkeletonUnhover(\'img78R2\')" onclick="aoImagesNavigationHandler(null,\'78R2\',1,null,true)"/>',
				'<area title="Mellanfalang L" shape="rect" coords="136,152,169,190" onmouseover="onHandSkeletonHover(\'img78L2\')" onmouseout="onHandSkeletonUnhover(\'img78L2\')" onclick="aoImagesNavigationHandler(null,\'78L2\',1,null,true)"/>',
				'<area title="Distal falang N" shape="rect" coords="315,37,343,75" onmouseover="onHandSkeletonHover(\'img78N3\')" onmouseout="onHandSkeletonUnhover(\'img78N3\')" onclick="aoImagesNavigationHandler(null,\'78N3\',1,null,true)"/>',
				'<area title="Distal falang M" shape="rect" coords="246,2,278,47" onmouseover="onHandSkeletonHover(\'img78M3\')" onmouseout="onHandSkeletonUnhover(\'img78M3\')" onclick="aoImagesNavigationHandler(null,\'78M3\',1,null,true)"/>',
				'<area title="Distal falang R" shape="rect" coords="186,39,214,79" onmouseover="onHandSkeletonHover(\'img78R3\')" onmouseout="onHandSkeletonUnhover(\'img78R3\')" onclick="aoImagesNavigationHandler(null,\'78R3\',1,null,true)"/>',
				'<area title="Distal falang L" shape="rect" coords="126,116,159,142" onmouseover="onHandSkeletonHover(\'img78L3\')" onmouseout="onHandSkeletonUnhover(\'img78L3\')" onclick="aoImagesNavigationHandler(null,\'78L3\',1,null,true)"/>',
				'<area title="Distal falang T" shape="rect" coords="418,201,480,270" onmouseover="onHandSkeletonHover(\'img78T2\')" onmouseout="onHandSkeletonUnhover(\'img78T2\')" onclick="aoImagesNavigationHandler(null,\'78T2\',1,null,true)"/>',
				'<area title="Proximal falang T" shape="rect" coords="383,248,460,337" onmouseover="onHandSkeletonHover(\'img78T1\')" onmouseout="onHandSkeletonUnhover(\'img78T1\')" onclick="aoImagesNavigationHandler(null,\'78T1\',1,null,true)"/>',
				'<area title="Metakarpal T" shape="rect" coords="336,326,410,403" onmouseover="onHandSkeletonHover(\'img77T\')" onmouseout="onHandSkeletonUnhover(\'img77T\')" onclick="aoImagesNavigationHandler(null,\'77T\',1,null,true)"/>',
				'</map>'
			);
		onHover = function (aEl, aNumber) {
			aEl.className = aNumber + ' ' + aNumber + 'Hover';
		}
		onUnHover = function (aEl, aNumber) {
			aEl.className = aNumber;
		}
		onHandSkeletonHover = function (aImgNumber) {
			var el = document.getElementById(aImgNumber);
			el.style.visibility = 'visible';
		}
		onHandSkeletonUnhover = function (aImgNumber) {
			var el = document.getElementById(aImgNumber);
			el.style.visibility = 'hidden';
		}
		onHandSkeletonClick = function (aImgNumber) {
			alert(aImgNumber);
		}

		onLoadHandImgMini = function () {
			if (onLoadHandImgMini.count === undefined) {
				onLoadHandImgMini.count = 0;
			}
			//app.mySkeletonWindow.getLayout().setActiveItem(0);
			if (onLoadHandImgMini.count === 0) {

			}
			onLoadHandImgMini.count++;
			app.mySkeletonWindow.setTitle('Laddar handmodul (' + onLoadHandImgMini.count + ' av totalt 27 objekt)');
			if (onLoadHandImgMini.count == 27) {
				onLoadHandImgMini.count = 0;
				app.mySkeletonWindow.getLayout().setActiveItem(6);
				app.mySkeletonWindow.setTitle('<b>Klassificering av fraktur</b>');
			}

		}
		var skeleton = Ext.create('Ext.panel.Panel', {
			name: 'skeleton',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top'

		});

		var handSkeleton = Ext.create('Ext.panel.Panel', {
			name: 'handSkeleton',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top'
		});

		var foreArmRadiusImages = Ext.create('Ext.panel.Panel', {
			name: 'foreArmRadiusImages',
			title: 'Radius - Klassifikation enligt Mason',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>radiusfraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					aoImagesNavigationHandler(btn, '', '', '', false);
				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar radiusfraktur',
							autoHide: false
						});
					}
				}
			}
			]
		});

		var prosthesisImages = Ext.create('Ext.panel.Panel', {
			name: 'prosthesisImages',
			title: 'Protesnära frakturer - Unified Classification System',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>protesnära fraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					aoImagesNavigationHandler(btn, '', '', '', false);
				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar radiusfraktur',
							autoHide: false
						});
					}
				}
			}
			]
		});

		var foreArmRadiusChildImages = Ext.create('Ext.panel.Panel', {
			name: 'foreArmRadiusChildImages',
			title: 'Radius',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>radiusfraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					aoImagesNavigationHandler(btn, '', '', '', false);
				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar radiusfraktur',
							autoHide: false
						});
					}
				}
			}
			]
		});

		var foreArmUlnaImages = Ext.create('Ext.panel.Panel', {
			name: 'foreArmUlnaImages',
			title: 'Ulna - Modifiering efter Mayo',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>ulnafraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					var panelName = btn.ownerCt.ownerCt.name;
					if (onReturnCodes.foreArmRadiusAO == 'X') {
						var dialogitems = [
                            {
                            	tooltip: NO_COMPETENCE_TO_CLASSIFY_TOOLTIP,
                            	text: NO_COMPETENCE_TO_CLASSIFY_TEXT,
                            	handler: function () {
                            		msgBox.close();
                            		foreArmHandler(app.myCurrentFracturePanel.id, '', '', '', container.id, NO_COMPETENCE_TO_CLASSIFY_CODE, panelName);
                            	}
                            }, {
                            	tooltip: NO_CLASSIFIABLE_TOOLTIP,
                            	text: NO_CLASSIFIABLE_TEXT,
                            	handler: function () {
                            		msgBox.close();
                            		foreArmHandler(app.myCurrentFracturePanel.id, '', '', '', container.id, NO_CLASSIFIABLE_CODE, panelName);
                            	}
                            }
						]
						var msgBox = createDialog("Ej kunnat/Ej klassificerbar", NO_CLASSIFIABLE_DIALOG_TEXT, dialogitems);
						msgBox.show();
					}
					else {

						foreArmHandler(app.myCurrentFracturePanel.id, '', '', '', container.id, PARTIAL_NO_CLASSIFIABLE_CODE, panelName);
					}

				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar ulnafraktur',
							autoHide: false
						});
					}
				}
			},
				{
					//Only for pelvis ring injury (where side is not decided before ao-classification is made)
					name: 'pelvisRingSideSwitcher',
					text: 'Visa vänsterbilder',
					hidden: true
				}
			]
		});

		var foreArmUlnaChildImages = Ext.create('Ext.panel.Panel', {
			name: 'foreArmUlnaChildImages',
			title: 'Ulna',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>ulnafraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					var panelName = btn.ownerCt.ownerCt.name;
					if (onReturnCodes.foreArmRadiusAO == 'X') {
						var dialogitems = [
                            {
                            	tooltip: NO_COMPETENCE_TO_CLASSIFY_TOOLTIP,
                            	text: NO_COMPETENCE_TO_CLASSIFY_TEXT,
                            	handler: function () {
                            		msgBox.close();
                            		foreArmHandler(app.myCurrentFracturePanel.id, '', '', '', container.id, NO_COMPETENCE_TO_CLASSIFY_CODE, panelName);
                            	}
                            }, {
                            	tooltip: NO_CLASSIFIABLE_TOOLTIP,
                            	text: NO_CLASSIFIABLE_TEXT,
                            	handler: function () {
                            		msgBox.close();
                            		foreArmHandler(app.myCurrentFracturePanel.id, '', '', '', container.id, NO_CLASSIFIABLE_CODE, panelName);
                            	}
                            }
						]
						var msgBox = createDialog("Ej kunnat/Ej klassificerbar", NO_CLASSIFIABLE_DIALOG_TEXT, dialogitems);
						msgBox.show();
					}
					else {

						foreArmHandler(app.myCurrentFracturePanel.id, '', '', '', container.id, PARTIAL_NO_CLASSIFIABLE_CODE, panelName);
					}

				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar ulnafraktur',
							autoHide: false
						});
					}
				}
			},
				{
					//Only for pelvis ring injury (where side is not decided before ao-classification is made)
					name: 'pelvisRingSideSwitcher',
					text: 'Visa vänsterbilder',
					hidden: true
				}
			]
		});

		var vertebraC0Images = Ext.create('Ext.panel.Panel', {
			name: 'vertebraC0Images',
			title: '<b>C0</b> Klassifikation enligt Anderson och Montesano (Spine, 1988, sidorna 731-736)',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>C0-fraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					aoImagesNavigationHandler(btn, '100', '3', 'X', false);
				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar C0-fraktur',
							autoHide: false
						});
					}
				}
			}
			]
		});

		var vertebraC1Images = Ext.create('Ext.panel.Panel', {
			name: 'vertebraC1Images',
			title: '<b>C1</b> Klassifikation av C1-frakturer enligt Jackson et al<br/>(J Am Acad Orthop Surg, 2002, sidorna 271-280)',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>C1-fraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					aoImagesNavigationHandler(btn, '100', '3', 'X', false);
				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar C1-fraktur',
							autoHide: false
						});
					}
				}
			}
			]
		});

		var vertebraC2Images = Ext.create('Ext.panel.Panel', {
			name: 'vertebraC2Images',
			title: '<b>C2</b>. Dens: Anderson och DAlonzo (JBJS(A) 1974, pp 1663-1674).<br/>Hangman: Effendi et al (JBJS(B) 1981; pp 319-327 ),Levine, Edwards (JBJS(A) 1985, pp 217-226)',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			labelAlign: 'top',
			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT + ' <b>C2-fraktur</b>',
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					aoImagesNavigationHandler(btn, '100', '3', 'AOD-X', false); //TODO: AOD?? constant?
				},
				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: 'Ej kunnat klassificera/ej klassificerbar C2-fraktur',
							autoHide: false
						});
					}
				}
			}
			]
		});

		function createTransitionPanel(name, title) {
			return Ext.create('Ext.panel.Panel', {
				name: name,
				title: title,
				bodyStyle: 'padding: 5px',
				style: 'margin-bottom: 10px',
				frame: true,
				labelAlign: 'top'
			});
		}
		
		var footPartImages = createTransitionPanel('footPartImages', 'Fot');
		var childDistHumerusImages = createTransitionPanel('childDistHumerusImages', 'Distala humerus');
		var childDistForearmImages = createTransitionPanel('childDistForearmImages', 'Distala underam');
		var childProxTibiaImages = createTransitionPanel('childProxTibiaImages', 'Proximala tibia');
		var childDistTibiaImages = createTransitionPanel('childDistTibiaImages', 'Distala tibia');
		var childProxFemurImages = createTransitionPanel('childProxFemurImages', 'Proximala femur');
		var childDistFemurImages = createTransitionPanel('childDistFemurImages', 'Distala femur');
		var vertebra102BImages = createTransitionPanel('vertebra102BImages', 'B-skador');

		var vertebraSelectorPanel = Ext.create('Ext.panel.Panel', {
			name: 'vertebraSelectorPanel',
			title: 'Välj kota/kotor',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			layout: 'absolute',
			//style: { display: 'block', backgroundPosition:'170px 40px', backgroundImage: 'url(Images/Assembled/Spine-S4.png)', height: '50', overflow: 'hidden', backgroundRepeat: 'no-repeat' },
			labelAlign: 'top',
			items: [

                {
                	xtype: 'label',
                	text: 'Skadade kotor:',
                	style: 'font-weight:bold;',
                	x: 20,
                	y: 3
                },
                {
                	xtype: 'component',
                	style: 'margin-top:10px'
                },
                {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v1',
                	x: 125,
                	y: 40
                },
                , {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v2',
                	x: 125,
                	y: 65

                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v3',
                	x: 125,
                	y: 90
                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v4',
                	x: 125,
                	y: 115
                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v5',
                	x: 125,
                	y: 140
                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v6',
                	x: 125,
                	y: 165
                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v7',
                	x: 125,
                	y: 190
                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v8',
                	x: 125,
                	y: 215
                }, {
                	xtype: 'checkboxfield',
                	uncheckedValue: 'false',
                	inputValue: 'true',
                	boxLabel: 'x',
                	name: 'v9',
                	x: 125,
                	y: 240
                }, {
                	xtype: 'component',
                	style: 'margin-top:125px'
                }
			]
		});

		var AO = Ext.create('Ext.panel.Panel', {
			name: 'ao',
			title: 'AO-klassifikation',
			bodyStyle: 'padding: 5px',
			style: 'margin-bottom: 10px',
			frame: true,
			//header: false,
			labelAlign: 'top',

			buttons: [{
				text: NO_CLASSIFIABLE_BUTTON_TEXT,
				tooltip: new Ext.ToolTip({ title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE, text: NO_CLASSIFIABLE_BUTTON_TOOLTIP }),
				handler: function (btn) {
					var panelName = btn.ownerCt.ownerCt.name;

					var pictureID = aoImagesNavigationHandler.pictureID;
					var inBackModule = pictureID == '101' || pictureID == '102';
					var dialogitems = [
                        {
                        	tooltip: NO_COMPETENCE_TO_CLASSIFY_TOOLTIP,
                        	text: NO_COMPETENCE_TO_CLASSIFY_TEXT,
                        	handler: function () {
                        		msgBox.close();
                        		if (inBackModule === true) {
                        			backHandler(app.myCurrentFracturePanel.id, 3, pictureID, null, app.mySkeletonWindow.id, NO_COMPETENCE_TO_CLASSIFY_CODE, panelName);
                        		}
                        		else {
                        			onReturnCodes('', '', '', '', container.id, NO_COMPETENCE_TO_CLASSIFY_CODE, false, panelName);
                        		}
                        	}
                        }, {
                        	tooltip: NO_CLASSIFIABLE_TOOLTIP,
                        	text: NO_CLASSIFIABLE_TEXT,
                        	handler: function () {
                        		msgBox.close();
                        		if (inBackModule === true) {
                        			backHandler(app.myCurrentFracturePanel.id, 3, pictureID, null, app.mySkeletonWindow.id, NO_CLASSIFIABLE_CODE, panelName);
                        		}
                        		else {
                        			onReturnCodes('', '', '', '', container.id, NO_CLASSIFIABLE_CODE, false, panelName);
                        		}
                        	}
                        }
					]
					var msgBox = createDialog("Ej kunnat/Ej klassificerbar", NO_CLASSIFIABLE_DIALOG_TEXT, dialogitems);
					msgBox.show();
				},

				listeners: {
					render: function (c) {
						Ext.tip.QuickTipManager.register({
							target: c.id,
							text: NO_CLASSIFIABLE_BUTTON_TOOLTIP,
							title: NO_CLASSIFIABLE_BUTTON_TOOLTIP_TITLE,
							autoHide: false
						});
					}
				}
			},
				{
					//Only for pelvis ring injury (where side is not decided before ao-classification is made)
					name: 'pelvisRingSideSwitcher',
					text: 'Visa vänsterbilder',
					hidden: true
				}
			]
		});

		onDetermineIfChildFracture = function (aBtn, aPictureID, aSide, aPseduoAO) {
			aoImagesNavigationHandler.showNoChildFractureSupportAlert = false;
			aoImagesNavigationHandler.classifyAsAdult = false;
			var picIDstr = aPictureID.toString();
			if (isChildFracture(aPictureID) && childFracturesActivated()) {
				aoImagesNavigationHandler.isChildFracture = true;
				aoImagesNavigationHandler(aBtn, picIDstr, aSide, aPseduoAO);
			}
			else if (askIfChildFracture(aPictureID) && childFracturesActivated()) {
				Ext.MessageBox.show({
					title: 'Öppna fyser?',
					msg: 'Är tillväxtzonerna (fyserna) synligt öppna på röntgenbilderna av det skadade skelettsegmentet, dvs är skelettet att betrakta som ett barnskelett där tillväxt pågår?',
					buttons: Ext.Msg.YESNOCANCEL,
					fn: function (aDialogButton) {
						if (aDialogButton === 'yes') {
							aoImagesNavigationHandler.isChildFracture = true;
							aoImagesNavigationHandler(aBtn, picIDstr, aSide, aPseduoAO);
						}
						else if (aDialogButton == 'no') {
							aoImagesNavigationHandler.isChildFracture = false;
							aoImagesNavigationHandler(aBtn, picIDstr, aSide, aPseduoAO);
						}
					}
				});
			}
			else {
				aoImagesNavigationHandler.isChildFracture = false;
				aoImagesNavigationHandler(aBtn, picIDstr, aSide, aPseduoAO);

			}
		}
		var pelvisPanel = createPelvisPanel();
		var container = Ext.create('Ext.window.Window', {
			renderTo: aBody,
			x: 40,
			y: 40,
			width: 615,
			height: 690,
			minWidth: 420,
			minHeight: 200,
			constrain: true,
			collapsible: false,
			closable: true,
			layout: 'card',
			activeItem: 0,
			items: [skeleton, AO, pelvisPanel, foreArmRadiusImages, foreArmUlnaImages, footPartImages, handSkeleton, childDistHumerusImages, childProxTibiaImages, childDistTibiaImages, childProxFemurImages, childDistFemurImages, vertebraSelectorPanel, vertebra102BImages, foreArmRadiusChildImages, foreArmUlnaChildImages, childDistForearmImages, vertebraC0Images, vertebraC1Images, vertebraC2Images, prosthesisImages],
			//          0      1    2               3                   4                   5               6           7                           8                   9                       10                  11                  12                      13                      14                      15                      16                      17              18                  19              20
			buttons: [{
				name: 'previousBtn',
				text: '<b>Föregående</b>',
				disabled: true,
				handler: Ext.bind(aoImagesNavigationHandler, this, [-1, -1], true)
			}, {
				name: 'nextBtn', text: '<b>Nästa</b>', disabled: true, handler: Ext.bind(aoImagesNavigationHandler, this, [-1, -1], true)
			}
			],
			listeners: {
				show: function (t) {
					t.setTitle('<b>Klassificering av fraktur</b>');
					var data = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Skeleton/AO-skeleton.png"
					};
					tplSkeleton.overwrite(skeleton.body, data);
				},
				beforeclose: function (panel) {
					panel.hide();
					return false;
				},
				beforedestroy: function () {
					purgeOrphans(app.mySkeletonWindow);
				}
			}
		});
		return container;
	}
	///QQQ
	function generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName) {
		var msg = 'Öppen fraktur?';
		var title = 'Öppen fraktur';
		if (isBackFracture(aPictureID)) {
			msg = '<b>Finns tecken på diffus idiopatisk skeletal hyperostos (DISH) eller ankyloserande spondylit (Mb Bechterew) i frakturområdet?</b><br/><br/>(DISH respektive ankyloserande spondylit innebär överbroande ben mellan flera intill-liggande kotor, som medför en ankylos. En fraktur genom ett sådant område kan vara mycket instabil.)';
			title = 'DISH/Mb Bechterew';
		}
        var result = {};
		Ext.Msg.show({
			msg: msg, title: title, buttons: Ext.Msg.YESNOCANCEL,
			fn: function (aBtn) {
				if (aBtn === 'cancel') {
					return;
				}
				
				if (aoImagesNavigationHandler.inProsthesisMode === true && aPictureID == 61) {
					aSide = '3';
				}
				var windowX = Ext.getCmp(aWindow);
				var pelvisPanel = windowX.items.items[2];
				var foo = onPelvisClick.getSelectedCmps(pelvisPanel);
				var fractureForm; ///
				///var fractureForm = Ext.getCmp(aParentID);
				///var openPhysesCmp = getCmpByName('Fx_OpenPhyses', fractureForm);
				///var fieldAOklass = getCmpByName('Fx_Class', fractureForm);
				///var fieldSida = getCmpByName('Fx_Side', fractureForm);
				///var panelAOklass = getCmpByName('panelAOKlass', fractureForm);
				///var fieldICD10 = getCmpByName('Fx_ICD10', fractureForm);
				///var fieldOpenFracture = getCmpByName('Fx_Open', fractureForm);

				if (aoImagesNavigationHandler.isChildFracture === true) {
                    ///openPhysesCmp.setValue('1');
                    result.OpenPhyses = 1;///
				}
				else {
                    ///openPhysesCmp.setValue('0');
                    result.OpenPhyses = 0;///
				}
				
				
				var windowX = Ext.getCmp(aWindow);
				var pelvisPanel = windowX.items.items[2];
				
				var dishBecthValue;

				if (aBtn === 'yes' && !isBackFracture(aPictureID)) {
					///fieldOpenFracture.setValue('1');
                    result.Open = 1;///
				}
				else {
                    ///fieldOpenFracture.setValue('0');
                    result.Open = 0;///
				}

				if (isBackFracture(aPictureID)) {
					dishBecthValue = aBtn === 'yes' ? '1' : '0';
				}

				var icd10 = "";
				var className = getFractureClassificationName(aPictureID);
				className = className + '-';
				var aoData;
				var sideLetter = getSideLetter(aSide);
				///fieldICD10.setReadOnly(true);
				if (aNoClassification === null) {
                    ///fieldSida.setValue(aSide);
                    result.Side = aSide;///
					var aoSide = '-' + sideLetter;
					if (aAO === 'A' && aPictureID == '61') {
						aoSide = ''; //Generic AO-image for non-serious pelvisring injuries                   
					}
					if (aAO.indexOf('IV-6-') >= 0 && aSide == '3' && aoImagesNavigationHandler.inProsthesisMode) { //Pelvis prosthesis fracture
						aoSide = '-H'
					}
					if (isBackFracture(aPictureID)) {
						aoSide = '';
					}
					var picIDstr = '';
					picIDstr = aPictureID + '-';
					if (aUseHandAO) {
						picIDstr = getHandAOnrFromPictureID(aPictureID) + '-';
					}
					if (picIDstr == '9-' || picIDstr == '10-' || picIDstr == '8-' || picIDstr == '21-B-' || aAO == onLoadAOImages.isolatedFibulaFractureAO || (aoImagesNavigationHandler.isChildFracture === true && aoImagesNavigationHandler.classifyAsAdult == false)) {
						picIDstr = ''
					}
					if (isBackFracture(aPictureID)) { //TODO: REMOVE!!!
						picIDstr = '';
					}
					tmpCode = className + picIDstr + aAO;
					if (Ext.isEmpty(onReturnCodes.extraClassInfo)) {
						onReturnCodes.extraClassInfo = '';
					}
					tmpCode += onReturnCodes.extraClassInfo;
					if (aPictureID == '100' || aPictureID == '100b' || aAO == '-1') {
						tmpCode = aAO;
					}
					if (aoImagesNavigationHandler.inProsthesisMode) {
						tmpCode = className + aAO + onReturnCodes.extraClassInfo;
					}
                    ///fieldAOklass.setValue(tmpCode);
                    result.Class = tmpCode;///
					var tmpCodeThumb = tmpCode;
					if (aoImagesNavigationHandler.isChildFracture === true) {
						tmpCodeThumb = tmpCode.replace(onReturnCodes.extraClassInfo, '').replace(ChildClassChars.NERV + '1', '').replace(ChildClassChars.NERV + '2', '').replace(ChildClassChars.NERV + '3', '').replace(ChildClassChars.NERV + '4', '').replace(ChildClassChars.VESSEL + '0', '').replace(ChildClassChars.VESSEL + '1', '').replace(ChildClassChars.FELSTALLNING + '0', '').replace(ChildClassChars.FELSTALLNING + '1', '').replace(ChildClassChars.FELSTALLNING + '2', '').replace(ChildClassChars.FLEX + '0', '').replace(ChildClassChars.FLEX + '1', '').replace(ChildClassChars.FLEX + '2', '');
					}
					else if (aPictureID == '100' || aPictureID == '100b') {
						if (backHandler.C0injuried === true && backHandler.C1injuried === true && backHandler.C2injuried === true) {
							tmpCodeThumb = 'C0-C1-C2';
						}
						else if (backHandler.C0injuried === true && backHandler.C1injuried === true) {
							tmpCodeThumb = 'C0-C1';
						}
						else if (backHandler.C0injuried === true && backHandler.C2injuried === true) {
							tmpCodeThumb = 'C0-C2';
						}
						else if (backHandler.C1injuried === true && backHandler.C2injuried === true) {
							tmpCodeThumb = 'C1-C2';
						}
					}
					aoData = {
						image: "https://stratum.blob.core.windows.net/sfr/Images/Thumbs/" + tmpCodeThumb.split('/').join('_') + aoSide + "-thumb.png",
						///title: getDomainValueName(4060, tmpCode)
					};
				}
				else {
					var panel = getCmpByName(aPanelName, windowX);
					if (!Ext.isEmpty(panel)) {
						aSide = aoImagesNavigationHandler.side;
						sideLetter = getSideLetter(aSide);
						/// fieldSida.setValue(aSide);
						result.Side = aSide;
						aPictureID = aoImagesNavigationHandler.pictureID;
					}
					if (aPanelName === 'foreArmUlnaImages' && aNoClassification == PARTIAL_NO_CLASSIFIABLE_CODE /*onReturnCodes.foreArmRadiusAO !== 'X'*/) {
						className = getFractureClassificationName(aPictureID);
						className = className + '-';
						var uarCode = className + onReturnCodes.foreArmRadiusAO + '-X' + onReturnCodes.extraClassInfo;
                        ///fieldAOklass.setValue(uarCode);
                        result.Class = uarCode;///
						aoData = {
							image: "https://stratum.blob.core.windows.net/sfr/Images/Thumbs/" + uarCode + '-' + sideLetter + "-thumb.png",
							///title: getDomainValueName(4060, uarCode)
						};
					}
					else if (aNoClassification == NO_CLASSIFIABLE_CODE) {
                        ///fieldAOklass.setValue("00-X0");
                        result.Class = "00-XO";///
						aoData = {
							image: "https://stratum.blob.core.windows.net/sfr/Images/Thumbs/00-X0-H-thumb.png",
							title: ''
						};
					}
					else if (aNoClassification == NO_COMPETENCE_TO_CLASSIFY_CODE) {
                        ///fieldAOklass.setValue("0");
                        result.Class = "0";///
						aoData = {
							image: "https://stratum.blob.core.windows.net/sfr/Images/Thumbs/0-H-thumb.png",
							title: ''
						};
					}
				}
				/// Pelvis
				var cmps = onPelvisClick.getSelectedCmps(pelvisPanel);
				  for (i = 0; i < cmps.length; i++) {
                    if (cmps[i].name.indexOf(onPelvisClick.DISLOCATED_TEXT) >= 0) {
                      continue;
                    }
                    // regDateField.setValue(getToday());
                    result.Fx = cmps[i].aValue;
                    result.Segment = onPelvisClick.getPelvisRingInjuryPart(result.Fx);
                 }
                result.Disloc = 0;
					for (k = 0; k < cmps.length; k++) {
						if (cmps[k].name.indexOf(onPelvisClick.DISLOCATED_TEXT) >= 0) {
							var disloceradSideText = cmps[k].name.charAt(cmps[k].name.length - 1);
							if (true) { //cmps[k].aValue == result.Segment && (disloceradSideText == result.Side || disloceradSideText == 'd')) { //'d': last letter in dislocerad
								if (cmps[k].checked) {
									result.Disloc = 1;
								}
							}
						}
					}
				///
				var icdSuffix = ''
				var icdCodes = new Array();
				switch (aPictureID) {
					case '9':
						icd10 = 'S42.0';
						break;
					case '10':
						icd10 = 'S42.1';
						break;
					case '11':
					case '11-P':
						icd10 = "S42.2";
						break;
					case '12':
					case '12-D':
						icd10 = "S42.3";
						break;
					case '13':
					case '13-E':
					case '13-M':
						icd10 = "S42.4";
						break;
					case '21-B':
					case '21-U':
						icdCodes[0] = 'S52.0';
						icdCodes[1] = 'S52.1';
						icdCodes[2] = 'S52.7';
						var isRadiusFracture = aAO.substring(0, 1) != '0';
						var isUlnaFracture = aAO.substring(2, 3) != '0';
						if (aoImagesNavigationHandler.isChildFracture === true) {
							isRadiusFracture = aAO.indexOf('21r') != -1;
							isUlnaFracture = aAO.indexOf('21u') != -1;
						}
						if (isRadiusFracture === false) //only ulna fractrued
							icd10 = icdCodes[0];
						else if (isUlnaFracture == false) //only radius fractured
							icd10 = icdCodes[1];
						else //Both fractured
							icd10 = icdCodes[2];
						break;
					case '22':
					case '22-D':
						icdCodes[0] = 'S52.2';
						icdCodes[1] = 'S52.3';
						icdCodes[2] = 'S52.4';

						if (aoImagesNavigationHandler.isChildFracture === true) {
							if ((aAO.indexOf('u') != -1 && aAO.indexOf('r') != -1) || (aAO.indexOf('u') == -1 && aAO.indexOf('r') == -1)) {
								icd10 = icdCodes[2];
							}
							else if (aAO.indexOf('r') != -1) {
								icd10 = icdCodes[1];
							}
							else if (aAO.indexOf('u') != -1) {
								icd10 = icdCodes[0];
							}
						}
						else {
							if (aAO === 'A1' || aAO === 'A1.3' || aAO === 'B1' || aAO === 'B1.3') {
								icd10 = icdCodes[0];
							}
							else if (aAO === 'A2' || aAO === 'A2.3' || aAO === 'B2' || aAO === 'B2.3') {
								icd10 = icdCodes[1];
							}
							else if (aAO === 'A3' || aAO === 'B3' || aAO === 'C1' || aAO === 'C2' || aAO === 'C3') {
								icd10 = icdCodes[2];
							}
						}
						break;
					case '23':
					case '23-M':
					case '23-E':
						icdCodes[0] = 'S52.8';
						icdCodes[1] = 'S52.6';
						icdCodes[2] = 'S52.5'

						if (aoImagesNavigationHandler.isChildFracture === true) {
							if ((aAO.indexOf('u') != -1 && aAO.indexOf('r') != -1) || (aAO.indexOf('u') == -1 && aAO.indexOf('r') == -1)) {
								icd10 = icdCodes[1];
							}
							else if (aAO.indexOf('r') != -1) {
								icd10 = icdCodes[2];
							}
							else if (aAO.indexOf('u') != -1) {
								icd10 = icdCodes[0];
							}
						}
						else {
							if (aAO === 'A1')
								icd10 = icdCodes[0];
							else if (wristHandler.ulna === true) {
								icd10 = icdCodes[1];
							}
							else if (aAO != '') {
								icd10 = icdCodes[2];
							}
						}
						break;
					case '31':
					case '31-E':
					case '31-M':
						icdCodes[0] = 'S72.1';
						icdCodes[1] = 'S72.2';
						icdCodes[2] = 'S72.0';
						if (aAO === 'A1' || aAO === 'A2' || aAO === 'A2.1' || aAO === 'A2.2' || aAO === 'A2.3') {
							icd10 = icdCodes[0];
						}
						else if (aAO === 'A3') {
							icd10 = icdCodes[1];
						}
						else if (aAO === 'B1' || aAO === 'B2' || aAO === 'B3' || aAO === 'C1' || aAO === 'C2' || aAO === 'C3' || aAO == '31-M/2.1-I' || aAO == '31-M/3.1-I' || aAO == '31-M/3.2-I' || aAO == '31-M/2.1-II' || aAO == '31-M/3.1-II' || aAO == '31-M/3.2-II' || aPictureID == '31-E') {
							icd10 = icdCodes[2];
						}
						else if (aPictureID == '31-M') {
							icd10 = icdCodes[0];
						}
						break;
					case '32':
					case '32-D':
						icd10 = "S72.3";
						break;
					case '33':
					case '33-M':
					case '33-E':
						icd10 = "S72.4";
						break;
					case '34':
						icd10 = "S82.0";
						break;
					case '41-E':
					case '41-M':
					case '41':
						icdCodes[0] = 'S82.1';
						icdCodes[1] = 'S82.4';
						switch (aAO) {
							case "":
								break;
							case onLoadAOImages.isolatedFibulaFractureAO:
								icd10 = icdCodes[1];
								break;
							default:
								icd10 = icdCodes[0];
								break;
						}
						break;
					case '42':
					case '42-D':
						icdCodes[0] = 'S82.2';
						icdCodes[1] = 'S82.4';
						switch (aAO) {
							case "":
								break;
							case onLoadAOImages.isolatedFibulaFractureAO:
								icd10 = icdCodes[1];
								break;
							default:
								icd10 = icdCodes[0];
								break;
						}
						break;
					case '43':
					case '43t-E':
					case '43-E':
						icd10 = "S82.3";
						if (aoImagesNavigationHandler.isChildFracture) {
							icdSuffix = '.X'
						}
						break;
					case '43f-E':
						icd10 = 'S82.4';
						break;
					case '43-M':
						icdCodes[0] = 'S82.3';

						icdCodes[1] = 'S82.4';
						switch (aAO) {
							case "":
								break;
							case '43f-M/2.1':
							case '43f-M/3.1':
							case '43f-M/3.2':
								icd10 = icdCodes[1];
								break;
							default:
								icd10 = icdCodes[0];
								break;
						}

						if (aoImagesNavigationHandler.isChildFracture === true && icd10 == icdCodes[0]) {
							icdSuffix = '.X'
						}
						break;
					case '44':
						icdCodes[0] = 'S82.6';
						icdCodes[1] = 'S82.8';
						icdCodes[2] = 'S82.5';
						switch (aAO) {
							case "A1":
							case "B1.1": case 'B1.2/3': case 'B2.1':
								icd10 = icdCodes[0];
								break;
							case "A2.3": case "A3.3": case "B2.2/3": case "B3.1": case "B3.2/3": case "C1": case "C2": case "C3":
								icd10 = icdCodes[1];
								break;
							case "A2.1/2": case "A3.1/2":
								icd10 = icdCodes[2];
								break;
						}
						break;
					case '61':
						icdCodes[0] = 'S32.7';
						icdCodes[1] = 'S32.8';
						if (aoImagesNavigationHandler.multipleInjuriesSelected) { ///(onPelvisClick.multipleInjuriesSelected(pelvisPanel)) {
							icd10 = icdCodes[0];
						}
						else {
							icd10 = icdCodes[1];
						}
						switch (aAO) {
							case "B3":
							case "C3":
								aSide = 3;
								break;
						}
						break;
					case '62':
						icd10 = 'S32.4';
						break;
					case '81':
						icd10 = 'S92.1';
						break;
					case '82':
						icd10 = 'S92.0';
						break;
					case '83':
						icd10 = 'S92.2';
						icdSuffix = '.W'
						break;
					case '84':
						icd10 = 'S92.2';
						icdSuffix = '.X'
						break;
					case '85':
						icdCodes[0] = 'S92.2';
						icdCodes[1] = 'S93.2';
						icdCodes[2] = 'S92.3';
						switch (aAO) {
							case "A1": case "A2": case "A3": case "B1": case "B2": case "B3": case "C3":
								icd10 = icdCodes[0];
								break;
							case "C1":
								icd10 = icdCodes[1];
								break;
							case "C2":
								icd10 = icdCodes[2];
								break;
							case "C4":
								icd10 = icdCodes[2];
								break;
						}
						icdSuffix = '.Y'
						break;
					case '87':
						var ICD_SUFFIX_87A = '.A';
						var ICD_SUFFIX_87B = '.B';
						var ICD_SUFFIX_87C = '.Z';
						var ICD10_87A = 'S92.3'
						icd10 = ICD10_87A;
						switch (aAO) {
							case "A":
								icdSuffix = ICD_SUFFIX_87A;
								break;
							case "B":
								icdSuffix = ICD_SUFFIX_87B;
								break;
							case "C":
								icdSuffix = ICD_SUFFIX_87C;
								break;
							default:
								icd10 = '';
								break;
						}
						break;
					case '88':
						var ICD_SUFFIX_88B = '.A'
						var ICD_SUFFIX_88C = '.B'
						var ICD10_88A = 'S92.4';
						var ICD10_88B_C = 'S92.5';
						switch (aAO) {
							case "A":
								icd10 = ICD10_88A;
								break;
							case "B":
								icd10 = ICD10_88B_C;
								icdSuffix = ICD_SUFFIX_88B;
								break;
							case "C":
								icd10 = ICD10_88B_C;
								icdSuffix = ICD_SUFFIX_88C;
								break;
						}
						break;
					case '71':
						icd10 = 'S62.1';
						icdSuffix = '.A';
						break;
					case '72':
						icd10 = 'S62.0';
						break;
					case '73':
						icd10 = 'S62.1';
						icdSuffix = '.F';
						break;
					case '74':
						icd10 = 'S62.1';
						icdSuffix = '.G';
						break;
					case '75T':
						icd10 = 'S62.1';
						icdSuffix = '.B';
						break;
					case '75P':
						icd10 = 'S62.1';
						icdSuffix = '.C';
						break;
					case '76T1':
						icd10 = 'S62.1';
						icdSuffix = '.D';
						break;
					case '76T2':
						icd10 = 'S62.1';
						icdSuffix = '.E';
						break;
					case '77N':
						icd10 = 'S62.3';
						icdSuffix = '.N';
						break;
					case '77M':
						icd10 = 'S62.3';
						icdSuffix = '.M';
						break;
					case '77R':
						icd10 = 'S62.3';
						icdSuffix = '.R';
						break;
					case '77L':
						icd10 = 'S62.3';
						icdSuffix = '.L';
						break;
					case '77T':
						icd10 = 'S62.2';
						icdSuffix = '.T';
						break;
					case '78N1':
						icd10 = 'S62.6';
						icdSuffix = '.N1';
						break;
					case '78M1':
						icd10 = 'S62.6';
						icdSuffix = '.M1';
						break;
					case '78R1':
						icd10 = 'S62.6';
						icdSuffix = '.R1';
						break;
					case '78L1':
						icd10 = 'S62.6';
						icdSuffix = '.L1';
						break;
					case '78N2':
						icd10 = 'S62.6';
						icdSuffix = '.N2';
						break;
					case '78M2':
						icd10 = 'S62.6';
						icdSuffix = '.M2';
						break;
					case '78R2':
						icd10 = 'S62.6';
						icdSuffix = '.R2';
						break;
					case '78L2':
						icd10 = 'S62.6';
						icdSuffix = '.L2';
						break;
					case '78N3':
						icd10 = 'S62.6';
						icdSuffix = '.N3';
						break;
					case '78M3':
						icd10 = 'S62.6';
						icdSuffix = '.M3';
						break;
					case '78R3':
						icd10 = 'S62.6';
						icdSuffix = '.R3';
						break;
					case '78L3':
						icd10 = 'S62.6';
						icdSuffix = '.L3';
						break;
					case '78T2':
						icd10 = 'S62.5';
						icdSuffix = '.T2';
						break;
					case '78T1':
						icd10 = 'S62.5';
						icdSuffix = '.T1';
						break;
					case '100':
					case '100b':
					case '100-C0':
					case '100-C1':
					case '100-C2':
						icd10 = 'T08.9';
						icdSuffix = '.N1';
						break;
					case '101':
						icd10 = 'T08.9';
						icdSuffix = '.N2';
						break;
					case '102':
						icd10 = 'T08.9';
						icdSuffix = backHandler.currentSegment == 3 ? '.N3' : '.N4';
						break;
					case '102b':
						icd10 = 'T08.9';
						icdSuffix = backHandler.currentSegment == 3 ? '.N3' : '.N4';
						break;
				}
				if (icd10 == '') {
					///fieldICD10.setReadOnly(false);
                    ///fieldICD10.setValue('');
                    result.ICD10 = ''; ///
				}

				///enableDisableXrayTimeAndDateCmps(fractureForm, isFemurFracture(icd10));


                
				//Openfracture?
				///var fieldOpen = getCmpByName('Fx_Open', fractureForm);
				///var open = fieldOpen.Value;
				if (icd10 != '') {
					//if (fieldOpen.getValue() == 1) {
                    if(result.Open == 1) { ///
						icd10 = icd10 + "1";
					}
					else {
						icd10 = icd10 + "0";
					}
					icd10 = icd10 + icdSuffix;
					handleAtypicalFemurFracture.inChangeMode = true;
                    ///fieldICD10.setValue(icd10);
                    result.ICD10 = icd10;///
				}
				//only display icdcodes whose last number matches value of openfracture field (0 or 1)
				var rs;
                var r;
                /*
				if (aPictureID == '87') {
					fieldICD10.lastQuery = '';
					fieldICD10.store.clearFilter();
					fieldICD10.store.filterBy(function (record, id) {
						var i = 0;
						if (ICD10_87A + fieldOpen.getValue() + ICD_SUFFIX_87A == record.data.ValueCode) {
							return true;
						}
						if (ICD10_87A + fieldOpen.getValue() + ICD_SUFFIX_87B == record.data.ValueCode) {
							return true;
						}
						if (ICD10_87A + fieldOpen.getValue() + ICD_SUFFIX_87C == record.data.ValueCode) {
							return true;
						}
						return false;
					});
				}
				else if (aPictureID == '88') {
					fieldICD10.lastQuery = ''
					fieldICD10.store.clearFilter();
					fieldICD10.store.filterBy(function (record, id) {
						var i = 0;
						if (ICD10_88A + fieldOpen.getValue() == record.data.ValueCode) {
							return true;
						}
						if (ICD10_88B_C + fieldOpen.getValue() + ICD_SUFFIX_88B == record.data.ValueCode) {
							return true;
						}
						if (ICD10_88B_C + fieldOpen.getValue() + ICD_SUFFIX_88C == record.data.ValueCode) {
							return true;
						}
						return false;
					});
				}
				else if (icdCodes.length > 0) {
					fieldICD10.lastQuery = '';
					fieldICD10.store.clearFilter();
					fieldICD10.store.filterBy(function (record, id) {
						var i = 0;
						for (i = 0; i < icdCodes.length; i++) {
							if (icdCodes[i] + fieldOpen.getValue() + icdSuffix == record.data.ValueCode) {
								return true;
							}
						}
						return false;
					});
                }
                */
				///tplFracture.overwrite(panelAOklass.getEl(), aoData);
				///panelAOklass.show();
                /*
				var dishBechtCmp = getCmpByName('Fx_DISHBecht', fractureForm);

				var upperCmp = getCmpByName('Fx_UpperVertebra', fractureForm);


				var lowerCmp = getCmpByName('Fx_LowerVertebra', fractureForm);


				var neurologiCmp = getCmpByName('Fx_Neurology', fractureForm);


				var extendedNeurologiCmp = getCmpByName('Fx_NeurologyExtended', fractureForm);

				dishBechtCmp.setValue('');

				upperCmp.setValue('');

				lowerCmp.setValue('');

				neurologiCmp.setValue('');

				extendedNeurologiCmp.setValue('');

				dishBechtCmp.setVisible(false);
				upperCmp.setVisible(false);

				lowerCmp.setVisible(false);

				neurologiCmp.setVisible(false);

				extendedNeurologiCmp.setVisible(false);
				getCmpByName('backLabel1', fractureForm).setVisible(false);
				getCmpByName('backLabel2', fractureForm).setVisible(false);
				getCmpByName('backLabel3', fractureForm).setVisible(false);
				getCmpByName('backLabel4', fractureForm).setVisible(false);
				getCmpByName('backLabel5', fractureForm).setVisible(false);
                
				if (isBackFracture(aPictureID)) {
					dishBechtCmp.setValue(dishBecthValue.toString());
					upperCmp.setValue(backHandler.injuredVertebraes[0]);

					lowerCmp.setValue(backHandler.injuredVertebraes[backHandler.injuredVertebraes.length - 1]);

					neurologiCmp.setValue(backHandler.neurologi);

					extendedNeurologiCmp.setValue(backHandler.extendedNeurologi);

					dishBechtCmp.setVisible(true);
					upperCmp.setVisible(true);
					lowerCmp.setVisible(true);
					neurologiCmp.setVisible(true);
					extendedNeurologiCmp.setVisible(true);

					getCmpByName('backLabel1', fractureForm).setVisible(true);
					getCmpByName('backLabel2', fractureForm).setVisible(true);
					getCmpByName('backLabel3', fractureForm).setVisible(true);
					getCmpByName('backLabel4', fractureForm).setVisible(true);
					getCmpByName('backLabel5', fractureForm).setVisible(true);
				}
                */
				///fractureForm.setTitle('Fraktur ' + icd10 + ' ' + getFractureFormSideTitleText(fractureForm) + addCrossBorderTitleInfo(fractureForm));
				var fracturePosition = 0;
				//Find fractureform position
				/// for (i = 0; i < app.myMiddlePanel.items.length; i++) {
				/// 	if (app.myMiddlePanel.items.items[i].id == fractureForm.id) {
				/// 		fracturePosition = i;
				/// 		break;
				/// 	}
				/// }
				var TreatmentCount = 0;
				//Find the Fracture Form´s Treatment forms
				var j = 0;
				///for (j = fracturePosition + 1; j < app.myMiddlePanel.items.length; j++) {
				///	if (isRingInjuryForm(app.myMiddlePanel.items.items[j]) || isBackSubFractureForm(app.myMiddlePanel.items.items[j])) {
				///		continue;
				///	}
				///	if (app.myMiddlePanel.items.items[j].title.substring(0, 10) == 'Behandling') {
				///		var treatmentForm = app.myMiddlePanel.items.items[j];
				///		TreatmentCount++;
				///		var comboBehandlingTyp = getCmpByName('Trt_Type', treatmentForm);
				///		var menuButton = getCmpByName('ButtonTreatmentMenu', treatmentForm);
				///		if (comboBehandlingTyp != null && menuButton != null) {
				///			menuButton.setMenu(FillTreatmentMenu(comboBehandlingTyp.getValue(), icd10, treatmentForm), false);
				///		}
				///		if (TreatmentCount >= 1) {
				///			Ext.Msg.show({
				///				title: 'Ändrad diagnos',
				///				msg: 'Observera att ändrad diagnos även kan påverka registrerad behandling. Kom därför ihåg att kontrollera vald åtgärdskod!',
				///				buttons: Ext.Msg.OK,
				///				icon: Ext.MessageBox.INFO,
				///				width: 600
				///			});
				///		}
				///	}
				///	else { break; }
				///}
				///var position = getPositionIndex(fractureForm);
				///position++;
				///var currentForm = app.myMiddlePanel.items.items[position];
				///while (isRingInjuryForm(currentForm) || isBackSubFractureForm(currentForm)) {
				///	currentForm.setVisible(false);
				///	position++;
				///	currentForm = app.myMiddlePanel.items.items[position];
				///}
				if (aPictureID == '61') {
					///onPelvisClick.generateRingInjuries(pelvisPanel, fractureForm);
				}
				else if (isBackFracture(aPictureID)) {
					///backHandler.generateBackFractureSubPanels(fractureForm);
				}


				///var prosthCmp = getCmpByName('Fx_CloseToProsthesis', fractureForm);

				var prosthPicID = getProsthesisClassificationPictureID(aPictureID);

				if (aoImagesNavigationHandler.inProsthesisMode) {
					///prosthCmp.setVisible(true);
					var icdArr;
					if (!Ext.isEmpty(icd10)) {
						icdArr = [icd10];
					}
					else {
						icdArr = icdCodes;
						var i = 0;
						for (i = 0; i < icdArr.length; i++) {
							icdArr[i] += '0';
						}
					}
					///prosthCmp.setValue(getProsthesisICD10(icdArr));
					result.CloseToProsthesis = getProsthesisICD10(icdArr);
				}
				else {
					///prosthCmp.setValue(null);
					///prosthCmp.setVisible(false);
				}
                

                    



				/*********************************************************************************/

				/* var atypicalFractureField = getCmpByName('Fx_Atypical', fractureForm);
				 enableDisableAtypicalFractureCmps(fractureForm, false);
				 var hideWindow = true;
				 if (askAboutAtypcialFemurFracture(icd10)) {
					 hideWindow = false;
					 enableDisableAtypicalFractureCmps(fractureForm, true);
					 var dialogitems = [
				 {
					 text: 'Ja',
					 handler: function () {
 
						 msgBox.close();
						 atypicalFractureField.setValue(1);
						 windowX.hide();
					 }
				 }, {
					 text: 'Nej',
					 handler: function () {
						 msgBox.close();
						 atypicalFractureField.setValue(0);
						 windowX.hide();
					 }
				 }, {
					 text: 'Oklart',
					 textAlign: 'left',
					 handler: function () {
						 msgBox.close();
						 atypicalFractureField.setValue(9);
						 windowX.hide();
					 }
				 }, {
					 text: 'Avbryt',
					 handler: function () {
						 msgBox.close();
					 }
				 }];
					 msgBox = createDialog('Atypisk fraktur', 'Atypisk fraktur?', dialogitems, true, '(Atypiska frakturer är stressfrakturer med en tvärgående frakturlinje från laterala kortex på frontalbilden. Minst en antydd kallusreaktion (kortical förtjockning) ska ses. Frakturen kan bestå av en spricka enbart, eller vara komplett. Frakturen har ofta samband med bisfosfonatbehandling)', true);
					 msgBox.show();
				 }
				 else {
					 hideWindow = true;
					 atypicalFractureField.setValue(null);
				 }
 
 
 
				 if (hideWindow === true) {
 
					 windowX.hide();
				 }*/
				/***********************************************************/

				var hideWindow = true; /// = handleAtypicalFemurFracture(icd10, fractureForm, windowX);

				if (hideWindow === true) {

					windowX.hide();
				}
				app.callback(app.event,result);
			}
		});
	}

	function wristHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		wristHandler.ulna = false;
		if (aAO != 'A1') { //A1 is an isolated ulna fracture and no question about ulna is needed
			Ext.Msg.show({
				msg: 'Ulna också frakturerad (styloidfraktur räknas ej)?', title: 'Ulnafraktur', buttons: Ext.Msg.YESNOCANCEL,
				fn: function (aBtn) {
					if (aBtn === 'cancel') {
						return;
					}
					else if (aBtn == 'yes') {
						wristHandler.ulna = true;
					}
					else {
						wristHandler.ulna = false;
					}
					generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
				}
			});
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
		}
	}

	function backHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		function getFirstVertebrae(vertebraeLetter, list) {
			var i = 0;
			for (i = 0; i < list.length; i++) {
				if (list[i].indexOf(vertebraeLetter) === 0) {
					return list[i];
				}
			}
			return '';
		}

		var spinePanel = app.mySkeletonWindow.items.items[12];
		var upperCmp = getCmpByName('upperVertebra', spinePanel);
		var lowerCmp = getCmpByName('lowerVertebra', spinePanel);

		var v1 = getCmpByName('v1', spinePanel);
		var v2 = getCmpByName('v2', spinePanel);
		var v3 = getCmpByName('v3', spinePanel);
		var v4 = getCmpByName('v4', spinePanel);
		var v5 = getCmpByName('v5', spinePanel);
		var v6 = getCmpByName('v6', spinePanel);
		var v7 = getCmpByName('v7', spinePanel);
		var v8 = getCmpByName('v8', spinePanel);
		var v9 = getCmpByName('v9', spinePanel);

		var vertebraeCmps = [v1, v2, v3, v4, v5, v6, v7, v8, v9];
		backHandler.injuredVertebraes = new Array();
		backHandler.nrInjuriedC = 0;
		backHandler.nrInjuriedT = 0;
		backHandler.nrInjuriedL = 0;
		backHandler.C0injuried = false;
		backHandler.C1injuried = false;
		backHandler.C2injuried = false;
		var i = 0;
		for (i = 0; i < vertebraeCmps.length; i++) {
			if (vertebraeCmps[i].getValue() === true) {
				var value = vertebraeCmps[i].aValue
				backHandler.injuredVertebraes.push(value);
				if (value == 'C0') {
					backHandler.C0injuried = true;
				}
				else if (value == 'C1') {
					backHandler.C1injuried = true;
				}
				else if (value == 'C2') {
					backHandler.C2injuried = true;
				}
				else if (value.indexOf('C') == 0) {
					backHandler.nrInjuriedC++;
				}
				else if (value.indexOf('T') == 0) {
					backHandler.nrInjuriedT++;
				}
				else if (value.indexOf('L') == 0) {
					backHandler.nrInjuriedL++;
				}
			}
		}
		var pseudoAO = '';
		if (!Ext.isEmpty(backHandler.pseudoAO)) {
			pseudoAO = backHandler.pseudoAO;
		}
		if (!Ext.isEmpty(pseudoAO)) {
			aAO = pseudoAO + '-' + aAO;
		}
		if (aPictureID == '100' || aPictureID == '100b') {
			var ao100 = '';
			var nrNotClassified = 0;
			var nrInjuries = 0;
			if (!Ext.isEmpty(backHandler.c0Class)) {
				nrInjuries++;
				ao100 = getFractureClassificationName('100-C0') + '-' + backHandler.c0Class;
				if (backHandler.c0Class === 'X') {
					nrNotClassified++;
				}
			}
			if (!Ext.isEmpty(backHandler.c1Class)) {
				nrInjuries++;
				if (!Ext.isEmpty(ao100)) {
					ao100 += '-';
				}
				ao100 += getFractureClassificationName('100-C1') + '-' + backHandler.c1Class;
				if (backHandler.c1Class == 'B' || backHandler.c1Class == 'C') {
					if (backHandler.massaLateralis === true) {
						ao100 += '-1';
					}
				}
				if (backHandler.c1Class === 'X') {
					nrNotClassified++;
				}
			}
			if (!Ext.isEmpty(backHandler.c2Class)) {
				nrInjuries++;
				if (!Ext.isEmpty(ao100)) {
					ao100 += '-';
				}
				ao100 += backHandler.c2Class;
				if (backHandler.c2Class === 'AOD-X') {
					nrNotClassified++;
				}
			}
			aAO = ao100;
			if (nrNotClassified === nrInjuries) {
				var dialogitems = [
                            {
                            	tooltip: NO_COMPETENCE_TO_CLASSIFY_TOOLTIP,
                            	text: NO_COMPETENCE_TO_CLASSIFY_TEXT,
                            	handler: function () {
                            		msgBox.close();
                            		generate_ICD_AO_SubFracturePanels(aParentID, 3, aPictureID, aAO, aWindow, NO_COMPETENCE_TO_CLASSIFY_CODE, aNoClassification, aPanelName);
                            	}
                            }, {
                            	tooltip: NO_CLASSIFIABLE_TOOLTIP,
                            	text: NO_CLASSIFIABLE_TEXT,
                            	handler: function () {
                            		msgBox.close();
                            		generate_ICD_AO_SubFracturePanels(aParentID, 3, aPictureID, aAO, aWindow, NO_CLASSIFIABLE_CODE, aNoClassification, aPanelName);
                            	}
                            }
				]
				var msgBox = createDialog("Ej kunnat/Ej klassificerbar", NO_CLASSIFIABLE_DIALOG_TEXT, dialogitems);
				msgBox.show();
				return;
			}
		}
		generate_ICD_AO_SubFracturePanels(aParentID, 3, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
	}

	function childProxHumerusHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		if (aAO == '11-E/1.1' || aAO == '11-E/2.1' || aAO == '11-M/3.1' || aAO == '11-M/3.2') {
			var dialogitems = [
                {
                	text: 'Ingen felställning',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '0';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Måttlig felställning',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '1';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Kraftig felställning (Glidning > 50% ad latus och/eller > 45 graders vinkelfelställning)',
                	textAlign: 'left',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '2';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Okänt/oklart',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '9';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Avbryt',
                	handler: function () {
                		msgBox.close();
                	}
                }
			];
			msgBox = createDialog('Felställning', 'Felställning?', dialogitems, true);
			msgBox.show();
		} else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
		}
	}

	function childDistEpifysHumerusHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		if (aAO == '13-E/3.1/2' || aAO == '13-E/4.1') {
			var felstallningItems = [
                 {
                 	text: 'Nej eller <= 2mm diastas',
                 	handler: function () {
                 		felstallningBox.close();
                 		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '0';
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Ja, > 2mm diastas',
                 	handler: function () {
                 		felstallningBox.close();
                 		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '1';
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Okänt/oklart',
                 	handler: function () {
                 		felstallningBox.close();
                 		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '9';
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Avbryt',
                 	handler: function () {
                 		felstallningBox.close();
                 	}
                 }
			];
			var felstallningBox = createDialog('Felställning', 'Felställning?', felstallningItems);
			felstallningBox.show();
		} else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
		}
	}

	function childDistMetafysHumerusHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		var flexValue = '';
		var vesselitems = [
            {
            	text: 'Ja, a radialis ej palpabel',
            	handler: function () {
            		vesselBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '1';
            		nervBox.show();
            	}
            }, {
            	text: 'Nej, a radialis är palpabel',
            	handler: function () {
            		vesselBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '0';
            		nervBox.show();
            	}
            }, {
            	text: 'Avbryt',
            	handler: function () {
            		vesselBox.close();
            	}
            }
		];
		var flexItems = [
            {
            	text: 'Extensionstyp',
            	handler: function () {
            		flexBox.close();
            		flexValue = ChildClassChars.FLEX + '1';
            		vesselBox.show();
            	}
            },
            {
            	text: 'Flexionstyp',
            	handler: function () {
            		flexBox.close();
            		flexValue = ChildClassChars.FLEX + '2';
            		vesselBox.show();
            	}
            }, {
            	text: 'Vet ej',
            	handler: function () {
            		flexBox.close();
            		flexValue = ChildClassChars.FLEX + '0';
            		vesselBox.show();
            	}
            }, {
            	text: 'Avbryt',
            	handler: function () {
            		flexBox.close();
            	}
            }
		];
		var felstallningItems = [
            {
            	text: 'Nej',
            	handler: function () {
            		felstallningBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '0';
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: '<=5mm',
            	handler: function () {
            		felstallningBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '1';
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: '>5mm',
            	handler: function () {
            		felstallningBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '2';
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Avbryt',
            	handler: function () {
            		felstallningBox.close();
            	}
            }
		];
		var nervItems = [
            {
            	text: 'Nej',
            	handler: function () {
            		nervBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.NERV + '0' + flexValue;
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Påverkan på n radialis',
            	handler: function () {
            		nervBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.NERV + '1' + flexValue;;
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Påverkan på n medianus',
            	handler: function () {
            		nervBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.NERV + '2' + flexValue;;
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Påverkan på n ulnaris',
            	handler: function () {
            		nervBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.NERV + '3' + flexValue;;
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Påverkan på mer än en av ovanstående',
            	handler: function () {
            		nervBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.NERV + '4' + flexValue;;
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Okänt/oklart',
            	handler: function () {
            		nervBox.close();
            		onReturnCodes.extraClassInfo += ChildClassChars.NERV + '9' + flexValue;;
            		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
            	}
            }, {
            	text: 'Avbryt',
            	handler: function () {
            		nervBox.close();
            	}
            }
		];
		var felstallningBox = createDialog('Felställning', 'Felställning?', felstallningItems);
		var nervBox = createDialog('Nervpåverkan', 'Nervpåverkan?', nervItems);
		var flexBox = createDialog('Extensionstyp/Flexionstyp', 'Extensionstyp/Flexionstyp?', flexItems);
		var vesselBox = createDialog('Kärlpåverkan', 'Kärlpåverkan?', vesselitems);
		if (aAO == '13-M/3.1-I' || aAO == '13-M/3.1-II' || aAO == '13-M/3.1-III-IV' || aAO == '13-M/3.2-II' || aAO == '13-M/3.2-III-IV' || aAO == '13-M/3.2-III-IV') {
			if (aAO == '13-M/3.1-II' || aAO == '13-M/3.1-III-IV' || aAO == '13-M/3.2-II' || aAO == '13-M/3.2-III-IV') {
				flexBox.show();
			}
			else {
				vesselBox.show();
			}
		}
		else if (aAO == '13-M/7m') {
			felstallningBox.show();
		}
	}

	function childProxEpifysFemurHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		if (aAO == '31-E/1.1' || aAO == '31-E/2.1') {
			var caputItems = [
                 {
                 	text: 'Ja',
                 	handler: function () {
                 		caputBox.close();
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Nej',
                 	handler: function () {
                 		caputBox.close();
                 		var fractureForm = Ext.getCmp(aParentID);
                 		var parentEventID = getCmpByName('ParentEventID', fractureForm).getValue();
                 		var eventID = getCmpByName('EventID', fractureForm).getValue();
                 		if (Ext.isEmpty(eventID)) {
                 			Ext.Msg.show({
                 				title: 'Borttagning',
                 				msg: 'Fraktur- och skadepanel kommer nu att försökas tas bort automatiskt. Om det finns fler frakturer kopplade till detta skadetillfället måste du ta bort denna frakturpanel manuellt', //TODO
                 				buttons: Ext.Msg.OKCANCEL,
                 				icon: Ext.Msg.INFO,
                 				fn: function (btn) {
                 					if (btn == 'ok') {
                 						removePanel(aParentID, null, true);
                 						var injPanel = getPanel(parentEventID);
                 						removePanel(injPanel.id, parentEventID, true);
                 					}
                 				}
                 			});

                 		} else {
                 			//TODO
                 		}

                 	}
                 }, {
                 	text: 'Avbryt',
                 	handler: function () {
                 		caputBox.close();
                 	}
                 }
			];
			var caputBox = createDialog('Caput femorisfyseolys', 'Akut/traumatisk?', caputItems, false, '(Bara säkerställt akuta traumatiska caput femur fyseolyser ska registreras här. Övriga (majoriteten) ska registreras i SPOQ-registret: www.spoq.se)');
			caputBox.show();
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
		}
	}

	function childDistMetafysFemurHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		if (aAO == '33-M/2.1' || aAO == '33-M/3.1' || aAO == '33-M/3.2') {
			var vesselItems = [
                 {
                 	text: 'Ja',
                 	handler: function () {
                 		msgBox.close();
                 		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '1';
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Nej',
                 	handler: function () {
                 		msgBox.close();
                 		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '0';
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Okänt/oklart',
                 	handler: function () {
                 		msgBox.close();
                 		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '9';
                 		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                 	}
                 }, {
                 	text: 'Avbryt',
                 	handler: function () {
                 		msgBox.close();
                 	}
                 }
			];
			var msgBox = createDialog('Kärlpåverkan', 'Kärlpåverkan?', vesselItems);
			msgBox.show();
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
		}

	}

	function childDistEpifysFemurHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		var vesselItems = [
                {
                	text: 'Ja',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '1';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Nej',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '0';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Okänt/oklart',
                	handler: function () {
                		msgBox.close();
                		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '9';
                		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aNoClassification, aPanelName);
                	}
                }, {
                	text: 'Avbryt',
                	handler: function () {
                		msgBox.close();
                	}
                }
		];
		var msgBox = createDialog('Kärlpåverkan', 'Kärlpåverkan?', vesselItems);
		msgBox.show();
	}

	function childProxEpifysTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		var felstallningNoText = '';
		var felstallningYesText = '';
		if (aAO == '4X') {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
			return;
		}


		/********************/

		if (aAO != '41t-M/7') {
			var showFelstallningDialog = false;
			if (aAO == '41t-E/3.1' || aAO == '41t-E/3.2' || aAO == '41t-E/7' || aAO == '41t-E/8.1' || aAO == '41t-E/4.1' || aAO == '41t-E/4.2') {
				showFelstallningDialog = true;
				felstallningNoText = 'Nej eller < 2mm';
				felstallningYesText = 'Ja, >= 2mm';
			}
			var vesselItems = [
                            {
                            	text: 'Ja',
                            	handler: function () {
                            		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '1';
                            		vesselBox.close();
                            		if (showFelstallningDialog) {
                            			createFelstallningDialog();
                            		}
                            		else {
                            			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
                            		}
                            	}
                            }, {
                            	text: 'Nej',
                            	handler: function () {
                            		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '0';
                            		vesselBox.close();
                            		if (showFelstallningDialog) {
                            			createFelstallningDialog();
                            		}
                            		else {
                            			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
                            		}
                            	}
                            }, {
                            	text: 'Okänt/oklart',
                            	handler: function () {
                            		onReturnCodes.extraClassInfo += ChildClassChars.VESSEL + '9';
                            		vesselBox.close();
                            		if (showFelstallningDialog) {
                            			createFelstallningDialog();
                            		}
                            		else {
                            			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
                            		}
                            	}
                            }, {
                            	text: 'Avbryt',
                            	handler: function () {
                            		vesselBox.close();
                            	}
                            }
			];
			var vesselBox = createDialog('Kärlpåverkan', 'Kärlpåverkan?', vesselItems);
			vesselBox.show();
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
		}



		function createFelstallningDialog() {
			var felstallningItems = [
                        {
                        	text: felstallningNoText,
                        	handler: function () {
                        		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '0';
                        		felstallningsBox.close();
                        		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
                        	}
                        }, {
                        	text: felstallningYesText,
                        	handler: function () {
                        		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '1';
                        		felstallningsBox.close();
                        		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
                        	}
                        }, {
                        	text: 'Okänt/oklart',
                        	handler: function () {
                        		onReturnCodes.extraClassInfo += ChildClassChars.FELSTALLNING + '9';
                        		felstallningsBox.close();
                        		generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
                        	}
                        }, {
                        	text: 'Avbryt',
                        	handler: function () {
                        		felstallningsBox.close();
                        	}
                        }
			];
			var felstallningsBox = createDialog('Felställning', 'Felställning?', felstallningItems);
			felstallningsBox.show();
		}


	}

	function distalTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		var dialog = Ext.create('Ext.window.Window', {
			title: 'Fibulafraktur',
			resizable: false,
			html: '<br/><b>Fibulafraktur?</b>',
			style: 'text-align:center;',
			width: 300,
			height: 200,
			modal: true,
			renderTo: getCmpByName(aPanelName, aWindow),
			dockedItems: [{
				xtype: 'toolbar',
				layout: 'vbox',
				dock: 'bottom',
				items: [{
					xtype: 'button',
					text: 'Ja, enkel fibulafraktur',
					handler: function () {
						onReturnCodes.extraClassInfo = '.X';
						dialog.close();
						generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
					}
				}, {
					xtype: 'button',
					text: 'Ja, komminut eller segmentell fibulafraktur',
					handler: function () {
						onReturnCodes.extraClassInfo = '.Y';
						dialog.close();
						generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
					}
				}, {
					xtype: 'button',
					text: 'Nej, fibula intakt',
					handler: function () {
						onReturnCodes.extraClassInfo = '.Z';
						dialog.close();
						generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
					}
				}, {
					xtype: 'button',
					text: 'Avbryt',
					handler: function () {
						dialog.close();
					}
				}
				]
			}]
		}
		);
		dialog.show();
	}

	function diafysTibiaHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		diafysTibiaHandler.fibulaInjury = '';
		var simpleTxt = 'Ja, enkel fibulafraktur';
		var comminutTxt = 'Ja, komminut eller segmentell fibulafraktur';
		if (aAO == onLoadAOImages.isolatedFibulaFractureAO) {
			simpleTxt = 'Enkel fibulafraktur';
			comminutTxt = 'Komminut eller segmentell fibulafraktur';
		}
		var simpleButton = Ext.create('Ext.button.Button', {
			text: simpleTxt,
			handler: function () {
				onReturnCodes.extraClassInfo = '.X';
				dialog.close();
				generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
			}
		});
		var comminutButton = Ext.create('Ext.button.Button', {
			text: comminutTxt,
			handler: function () {
				onReturnCodes.extraClassInfo = '.Y';
				dialog.close();
				generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
			}
		});
		var noFractureButton = Ext.create('Ext.button.Button', {
			text: 'Nej, fibula intakt',
			handler: function () {
				onReturnCodes.extraClassInfo = '.Z';
				dialog.close();
				generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, false, aPanelName);
			}
		});
		var cancelButton = Ext.create('Ext.button.Button', {
			text: 'Avbryt',
			handler: function () {
				dialog.close();
			}
		});
		var items;
		if (aAO == onLoadAOImages.isolatedFibulaFractureAO) {
			items = [simpleButton, comminutButton, cancelButton];
		} else {
			items = [simpleButton, comminutButton, noFractureButton, cancelButton];
		}
		var dialog = Ext.create('Ext.window.Window', {
			title: 'Fibulafraktur',
			resizable: false,
			html: '<br/><b>Fibulafraktur?</b>',
			style: 'text-align:center;',
			width: 300,
			height: 200,
			modal: true,
			renderTo: getCmpByName(aPanelName, aWindow),
			dockedItems: {
				xtype: 'toolbar',
				layout: 'vbox',
				dock: 'bottom',
				items: items
			}
		}
		);
		dialog.show();
	}

	function foreArmHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aPanelName) {
		var finalAO = aAO;
		if (!Ext.isEmpty(onReturnCodes.foreArmRadiusAO)) {
			finalAO = onReturnCodes.foreArmRadiusAO + '-' + finalAO;
		}

		if (finalAO === '0-0') {
			Ext.Msg.show({ msg: 'Du måste välja en fraktur på antingen radius, ulna eller båda.', title: 'Ingen fraktur vald', buttons: Ext.Msg.OK });
			return;
		}
		if (aNoClassification == NO_CLASSIFIABLE_CODE || aNoClassification == NO_COMPETENCE_TO_CLASSIFY_CODE) { //No classification on both, therefore no need to ask about luxation.
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, '', aWindow, aNoClassification, false, aPanelName);
		}
		else if (!aoImagesNavigationHandler.isChildFracture) {
			Ext.Msg.show({
				msg: 'Luxation?', title: 'Luxation', buttons: Ext.Msg.YESNOCANCEL,
				fn: function (aBtn) {
					if (aBtn === 'cancel') {
						return;
					}
					else if (aBtn == 'yes') {
						if (aoImagesNavigationHandler.inProsthesisMode) {
							onReturnCodes.extraClassInfo = '-l';
						}
						else {
							onReturnCodes.extraClassInfo = '-1';
						}
					}
					else {
						if (!aoImagesNavigationHandler.inProsthesisMode) {
							onReturnCodes.extraClassInfo = '-0';
						}
					}
					generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, finalAO, aWindow, aNoClassification, false, aPanelName);
				}
			});
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, finalAO, aWindow, aNoClassification, false, aPanelName);
		}
	}

	function handHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName) {
		if (aPictureID == '72' && aAO == 'A2.2') {
			Ext.Msg.show({
				msg: 'Luxation?', title: 'Luxation', buttons: Ext.Msg.YESNOCANCEL,
				fn: function (aBtn) {
					if (aBtn === 'cancel') {
						return;
					}
					else if (aBtn == 'yes') {
						onReturnCodes.extraClassInfo = '-l';
					}
					else {
						onReturnCodes.extraClassInfo = '';
					}
					generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
				}
			});
		}
		else {
			generate_ICD_AO_SubFracturePanels(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
	}

	function prosthesisHandler(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName) {
		if (!correctProsthesisClassification(aPictureID, aAO)) {
			Ext.Msg.show({
				msg: 'Valt skelettsegment och protesklassificering är ogiltigt.', title: 'Felaktig protesklassificering', buttons: Ext.Msg.OK
			});
		}
		else {
			onReturnCodes(aParentID, aSide, aPictureID, aAO, aWindow, aNoClassification, aUseHandAO, aPanelName);
		}
		aoImagesNavigationHandler.goToProsthesisHandler = true;
	}

	function getXrayImagesPageID(aAo, aPictureID) {
		var s = aPictureID + '-' + aAo;
		/*switch (aAo) {
	    }*/

		switch (s) {
			case '11-A1':
				return 2188;
				break;
			case '11-A2':
				return 2189;
				break;
			case '11-A3':
				return 2190;
				break;
			case '11-B1':
				return 2191;
				break;
			case '11-B2':
				return 2192;
				break;
			case '11-B3':
				return 2193;
				break;
			case '11-C1':
				return 2194;
				break;
			case '11-C2':
				return 2196;
				break;
			case '11-C2.3':
				return 2195;
				break;
			case '11-C3':
				return 2197;
				break;
			case '12-A1':
				return 2198;
				break;
			case '12-A2':
				return 2199;
				break;
			case '12-A3':
				return 2200;
				break;
			case '12-B1':
				return 2201;
				break;
			case '12-B2':
				return 2202;
				break;
			case '12-B3':
				return 2203;
				break;
			case '12-C1':
				return 2204;
				break;
			case '12-C2':
				return 2205;
				break;
			case '12-C3':
				return 2206;
				break;
			case '13-A1':
				return 2207;
				break;
			case '13-A2':
				return 2208;
				break;
			case '13-A3':
				return 2209;
				break;
			case '13-B1':
				return 2210;
				break;
			case '13-B2':
				return 2211;
				break;
			case '13-B3':
				return 2212;
				break;
			case '13-C1':
				return 2213;
				break;
			case '13-C2':
				return 2214;
				break;
			case '13-C3':
				return 2215;
				break;
			case '22-A1':
				return 2164;
				break;
			case '22-A2':
				return 2166;
				break;
			case '22-A3':
				return 2167;
				break;
			case '22-B1':
				return 2168;
				break;
			case '22-B2':
				return 2169;
				break;
			case '22-B3':
				return 2170;
				break;
			case '22-C1':
				return 2171;
				break;
			case '22-C2':
				return 2172;
				break;
			case '22-C3':
				return 2173;
				break;
			case '23-A1':
				return 2174;
				break;
			case '23-A2.1':
				return 2165;
				break;
			case '23-A2.2':
				return 2220;
				break;
			case '23-A2.3':
				return 2175;
				break;
			case '23-A3':
				return 2176;
				break;
			case '23-B1':
				return 2177;
				break;
			case '23-B2':
				return 2178;
				break;
			case '23-B3':
				return 2179;
				break;
			case '23-C1':
				return 2181;
				break;
			case '23-C2':
				return 2182;
				break;
			case '23-C3':
				return 2183;
				break;
			case '31-A1':
				return 2135;
				break;
			case '31-A2':
				return 2137;
				break;
			case '31-A3':
				return 2138;
				break;
			case '31-B1':
				return 2139;
				break;
			case '31-B2':
				return 2140;
				break;
			case '31-B3':
				return 2141;
				break;
			case '31-C1':
				return 2142;
				break;
			case '32-A1':
				return 2144;
				break;
			case '32-A2':
				return 2145;
				break;
			case '32-A3':
				return 2146;
				break;
			case '32-B1':
				return 2147;
				break;
			case '32-B2':
				return 2148;
				break;
			case '32-B3':
				return 2149;
				break;
			case '32-C1':
				return 2150;
				break;
			case '32-C2':
				return 2151;
				break;
			case '32-C3':
				return 2152;
				break;
			case '33-A1':
				return 2154;
				break;
			case '33-A2':
				return 2155;
				break;
			case '33-A3':
				return 2156;
				break;
			case '33-B1':
				return 2157;
				break;
			case '33-B2':
				return 2158;
				break;
			case '33-B3':
				return 2159;
				break;
			case '33-C1':
				return 2160;
				break;
			case '33-C2':
				return 2161;
				break;
			case '33-C3':
				return 2162;
				break;
			case '41-A1':
				return 1778;
				break;
			case '41-A2':
				return 1779;
				break;
			case '41-A3':
				return 1780;
				break;
			case '41-B1.1':
				return 1781;
				break;
			case '41-B2':
				return 1782;
				break;
			case '41-B3':
				return 1783;
				break;
			case '41-C1':
				return 1784;
				break;
				/*case '41-C2':
                    return 1785;
                    break;*/
			case '41-C3':
				return 1786;
				break;
			case '44-A1':
				return 1614;
				break;
			case '44-A2.1/2':
				return 1621;
				break;
			case '44-A3.3':
				return 1615;
				break;
			case '44-B1':
				return 1616;
				break;
			case '44-B2':
				return 1617;
				break;
			case '44-B3':
				return 1618;
				break;
			case '44-C1':
				return 1619;
				break;
			case '44-C2':
				return 1620;
				break;
			case '44-C3':
				return 1546;
				break;

			case '42-A1':
				return 2033;
				break;
			case '42-A2':
				return 2034;
				break;
			case '42-A3':
				return 2035;
				break;
			case '42-B1':
				return 2036;
				break;
			case '42-B2':
				return 2037;
				break;
			case '42-B3':
				return 2038;
				break;
			case '43-A1':
				return 2040;
				break;
			case '43-A2':
				return 2041;
				break;
			case '43-A3':
				return 2042;
				break;
			case '43-B1':
				return 2043;
				break;
			case '43-B2':
				return 2044;
				break;
			case '43-B3':
				return 2045;
				break;
			case '43-C3':
				return 2046;
				break;
		}
		return null;
	}

	function initAOtemplate(aDisplayMatrix, aAoMatrix, ownerFormPanelID, aUseHandAO, aPictureID, gotoPicID) {

		var s = '<img src="{image}" width="564" height="520" />';
		var currentLetterCode = 'A'.charCodeAt();
		var i = 0;
		var useHandAOStr = 'false';
		if (aUseHandAO) {
			useHandAOStr = 'true';
		}
		for (i = 0; i < aDisplayMatrix.length; i++) {
			var j = 0;
			for (j = 0; j < aDisplayMatrix[i].length; j++) {
				if (aDisplayMatrix[i][j] == true) {
					var extCss = '';
					if (aDisplayMatrix[i].length != 3) //do nr of columns differ from default? (3);
						extCss = '-' + aDisplayMatrix[i].length + 'Col';
					var currentLetter = String.fromCharCode(currentLetterCode);
					var onClickText = '';

					if (!Ext.isEmpty(gotoPicID)) {

						onClickText = 'aoImagesNavigationHandler(null,\'' + gotoPicID + '\',{side},' + '\'' + aAoMatrix[i][j] + '\',false' + ')';
					}
					else if (aAoMatrix[i][j] == PROSTHESIS_FRACTURE) {
						onClickText = 'aoImagesNavigationHandler(null,\'' + aPictureID + '\',{side},' + '\'' + aAoMatrix[i][j] + '\',false' + ')';
					}
					else {
						onClickText = 'onReturnCodes(\'' + ownerFormPanelID + '\',{side},\'{PictureId}\',\'' + aAoMatrix[i][j] + '\',\'{windowId}\',null,' + useHandAOStr + ')';
					}

					s += '<div class="AO ' + currentLetter + (j + 1) + extCss + '"><a title="{infoText' + currentLetter + (j + 1) + '}" onclick = "' + onClickText + '"></a></div>';
					if (aoImagesNavigationHandler.isChildFracture !== true) {
						var pID = getXrayImagesPageID(aAoMatrix[i][j], aPictureID);
						if (pID !== null) {
							s += '<div class="' + currentLetter + (j + 1) + 'RTG' + extCss + '"><a target="_blank" title="Visa röntgenbilder" href="#!' + pID + '"></a></div>';
						}
					}
				}
			}
			currentLetterCode++;
		}
		return s;
	}

	function createDisplayMatrix(aRowCount, aColCount) {
		var matrix = new Array(aRowCount);
		var i = 0;
		for (i = 0; i < aRowCount; i++) {
			matrix[i] = new Array(aColCount);
			var j = 0;
			for (j = 0; j < aColCount; j++) {
				matrix[i][j] = true;
			}
		}
		return matrix;
	}

	function createAoMatrix() {
		var matrix = new Array(10);
		var i = 0;
		var currentLetter = 'A';
		for (i = 0; i < 10; i++) {
			matrix[i] = new Array(10);
			var j = 0;
			for (j = 1; j <= 10; j++) {
				matrix[i][j - 1] = currentLetter + j;
			}
			currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
		}
		return matrix;
	}

	function createInfoTextMatrix() {
		var m = new Array(10);
		var i = 0;
		for (i = 0; i < 10; i++) {
			m[i] = new Array(10);
		}

		return m;
	}

	function getSideLetter(aSideNr) {
		if (aSideNr == 1) {
			return 'H';
		}
		if (aSideNr == 2) {
			return 'V';
		}
		return '';
	}

	function getHandAOnrFromPictureID(aHandAOpicID) {
		return aHandAOpicID.substring(0, 2);
	}

	function getFractureClassificationName(aAoID) {
		if (aoImagesNavigationHandler.inProsthesisMode) {
			return 'UCS';
		}
		switch (aAoID) {
			case '81':
			case '82':
			case '83':
			case '84':
			case '85':
			case '87':
			case '88':
				return 'OTA';
				break;
			case '9':
				return 'RSN';
				break;
			case '10':
				return 'ERC';
			case '21-A':
				return 'UAR';
				break; break;
			case '21-B':
				return 'UAR';
				break;
			case '100-C0':
				return 'AOM';
				break;
			case '100-C1':
				return 'JAC';
				break;
			case '100-C2':
				return 'ERROR';
				break;
			case '101':
				return 'SLI'
			case '102':
			case '102b':
				return 'AOR';
				break;
			default:
				return 'MAO';
				break;
		}
	}

	function setUndirty(aPanel) {
		var i = 0;
		var field;
		for (i = 0; i < aPanel.items.length; i++) {
			field = aPanel.items.items[i];
			if (field.getValue != undefined) {
				field.originalValue = field.getValue();
			}
		}
	}

	function getAge() {
		return Number(Profile.Person.Age);
	}

	function askIfChildFracture(aPictureID) {
		if (isBackFracture(aPictureID)) {
			return false;
		}
		var age = getAge();
		return age >= 10 && age < 20;
	}

	function isChildFracture(aPictureID) {
		if (isBackFracture(aPictureID)) {
			return getAge() < 16;
		}
		return getAge() < 10;
	}

	function childFracturesActivated() {
		return true;
	}

	function createParentEventIDfield(aParentEventID) {
		return Ext.create('Ext.form.field.Text', {
			name: 'ParentEventID',
			submitValue: false,
			fieldLabel: 'ParentEventID',
			value: aParentEventID,
			hidden: true,
			hideLabel: true
		});
	}

	function createDialog(aTitle, aText, dockedItems, extraWide, extraText, extraHeight) {
		if (Ext.isEmpty(extraText)) {
			extraText = '';
		}
		var width = 330;
		if (extraWide === true) {
			width = 550;
		}
		var addedHeight = 0;
		if (!Ext.isEmpty(extraHeight)) {
			addedHeight = 30;
		}
		var dialog = Ext.create('Ext.window.Window', {
			title: aTitle,
			resizable: false,
			html: '<br/><b>' + aText + '</b><br/>' + extraText,
			style: 'text-align:center;',
			width: width,
			height: 170 + (dockedItems.length * 17) + addedHeight,
			modal: true,
			dockedItems: [{
				xtype: 'toolbar',
				layout: 'vbox',
				dock: 'bottom',
				items: dockedItems
			}]
		}
     );
		return dialog;
	}

	function getProsthesisClassificationPictureID(id) {
		switch (id) {
			case '10': return '10-PR';

			case '11': return '11-PR';
			case '12': return '12-PR';
			case '13': return '13-PR';


			case '21-B': case '22': return '21_22-PR';

			case '23': return '23-PR';

			case '31': return '31-PR';
			case '32': return '32-PR';
			case '33': return '33-PR';
			case '34': return '34-PR';
			case '41':
			case '42': return '4X-PR';
			case '43': case '44': return '43_44-PR';

			case '61': case '62': return '61_62-PR';
			case '81': return '81-PR';

		}

		if (id.indexOf('7') == 0) {
			return '7X-PR';
		}

		return null;
	}

	function getProsthesisClassificationConfig(id) {

		var IV3CB = 'IV-3-C_b';
		var IV3CA = 'IV-3-C_a';

		var displayMatrix;
		var aoMatrix;
		switch (id) {
			case '10':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[0][2] = displayMatrix[2][2] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'I-14-A1';
				aoMatrix[0][1] = 'I-14-A2';

				aoMatrix[1][0] = 'I-14-B1';
				aoMatrix[1][1] = 'I-14-B2';
				aoMatrix[1][2] = 'I-14-B3';

				aoMatrix[2][0] = 'I-14-C';
				aoMatrix[2][1] = 'I-14-F';
				break;
			case '11':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[0][2] = displayMatrix[2][2] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'I-1-A1';
				aoMatrix[0][1] = 'I-1-A2';

				aoMatrix[1][0] = 'I-1-B1';
				aoMatrix[1][1] = 'I-1-B2';
				aoMatrix[1][2] = 'I-1-B3';

				aoMatrix[2][0] = 'I-1-C';
				aoMatrix[2][1] = 'I-1-D';
				break;
			case '12':
				displayMatrix = createDisplayMatrix(3, 6);
				displayMatrix[0][4] = displayMatrix[0][5] = displayMatrix[2][5] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'I-1-A1';
				aoMatrix[0][1] = 'I-1-A2';
				aoMatrix[0][2] = 'II-1-A1';
				aoMatrix[0][3] = 'II-1-A2';

				aoMatrix[1][0] = 'I-1-B1';
				aoMatrix[1][1] = 'I-1-B2';
				aoMatrix[1][2] = 'I-1-B3';
				aoMatrix[1][3] = 'II-1-B1';
				aoMatrix[1][4] = 'II-1-B2';
				aoMatrix[1][5] = 'II-1-B3';

				aoMatrix[2][0] = 'I-1-C';
				aoMatrix[2][1] = 'I-1-D';
				aoMatrix[2][2] = 'II-1-C';
				aoMatrix[2][3] = 'II-1-D';
				aoMatrix[2][4] = 'II-1-F';
				break;
			case '13':
				displayMatrix = createDisplayMatrix(3, 5);
				displayMatrix[0][2] = displayMatrix[0][3] = displayMatrix[0][4] = displayMatrix[1][3] = displayMatrix[1][4] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'II-1-A1';
				aoMatrix[0][1] = 'II-1-A2';

				aoMatrix[1][0] = 'II-1-B1';
				aoMatrix[1][1] = 'II-1-B2';
				aoMatrix[1][2] = 'II-1-B3';

				aoMatrix[2][0] = 'II-1-C';
				aoMatrix[2][1] = 'II-1-D';
				aoMatrix[2][2] = 'II-1-F';
				aoMatrix[2][3] = 'I-1-C';
				aoMatrix[2][4] = 'I-1-D';
				break;
			case '23':
				displayMatrix = createDisplayMatrix(3, 4);
				displayMatrix[0][2] = displayMatrix[0][3] = displayMatrix[1][3] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'III-2-A1';
				aoMatrix[0][1] = 'III-2-A2';

				aoMatrix[1][0] = 'III-2-B1';
				aoMatrix[1][1] = 'III-2-B2';
				aoMatrix[1][2] = 'III-2-B3';

				aoMatrix[2][0] = 'III-2-C';
				aoMatrix[2][1] = 'III-2-D';
				aoMatrix[2][2] = 'II-2-C';
				aoMatrix[2][3] = 'II-2-D';

				break;
			case '21-B': case '22':
				displayMatrix = createDisplayMatrix(3, 4);
				displayMatrix[0][2] = displayMatrix[0][3] = displayMatrix[1][3] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'II-2-A1';
				aoMatrix[0][1] = 'II-2-A2';

				aoMatrix[1][0] = 'II-2-B1';
				aoMatrix[1][1] = 'II-2-B2';
				aoMatrix[1][2] = 'II-2-B3';

				aoMatrix[2][0] = 'II-2-C';
				aoMatrix[2][1] = 'II-2-D';
				aoMatrix[2][2] = 'III-2-C';
				aoMatrix[2][3] = 'III-2-D';
				break;
			case '31':
				displayMatrix = createDisplayMatrix(3, 4);
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'IV-3-A1_a';
				aoMatrix[0][1] = 'IV-3-A1_b';
				aoMatrix[0][2] = 'IV-3-A2_a';
				aoMatrix[0][3] = 'IV-3-A2_b';

				aoMatrix[1][0] = 'IV-3-B1_a';
				aoMatrix[1][1] = 'IV-3-B1_b';
				aoMatrix[1][2] = 'IV-3-B2_a';
				aoMatrix[1][3] = 'IV-3-B2_b';

				aoMatrix[2][0] = 'IV-3-B3_a';
				aoMatrix[2][1] = 'IV-3-B3_b';
				aoMatrix[2][2] = IV3CA;
				aoMatrix[2][3] = IV3CB;

				break;
			case '32':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'V-3-C';
				aoMatrix[0][1] = IV3CA;
				aoMatrix[0][2] = IV3CB;

				aoMatrix[1][0] = 'IV-3-D_a';
				aoMatrix[1][1] = 'IV-3-D_b';

				break;
			case '33':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[0][2] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'V-3-A1';
				aoMatrix[0][1] = 'V-3-A2';

				aoMatrix[1][0] = 'V-3-B1';
				aoMatrix[1][1] = 'V-3-B2';
				aoMatrix[1][2] = 'V-3-B3';

				aoMatrix[2][0] = IV3CA;
				aoMatrix[2][1] = IV3CB;
				aoMatrix[2][2] = 'V-3-D';
				break;
			case '34':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[0][2] = displayMatrix[2][1] = displayMatrix[2][2] = false;
				aoMatrix = createAoMatrix();
				aoMatrix[0][0] = 'V-34-A1';
				aoMatrix[0][1] = 'V-34-A2';
				aoMatrix[0][2] = 'V-34-A3';

				aoMatrix[1][0] = 'V-34-B1';
				aoMatrix[1][1] = 'V-34-B2';
				aoMatrix[1][2] = 'V-34-B3';

				aoMatrix[2][0] = 'V-34-F';
				break;
			case '41': case '42':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[2][2] = false;
				aoMatrix = createAoMatrix();
				aoMatrix[0][0] = 'V-4-A1_a';
				aoMatrix[0][1] = 'V-4-A1_b';
				aoMatrix[0][2] = 'V-4-A2';

				aoMatrix[1][0] = 'V-4-B1';
				aoMatrix[1][1] = 'V-4-B2';
				aoMatrix[1][2] = 'V-4-B3';

				aoMatrix[2][0] = 'V-4-C';
				aoMatrix[2][1] = 'V-4-D';
				break;
			case '43': case '44':
				displayMatrix = createDisplayMatrix(3, 4);
				displayMatrix[0][2] = displayMatrix[0][3] = displayMatrix[2][2] = displayMatrix[2][3] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'VI-4-A1';
				aoMatrix[0][1] = 'VI-4-A2';

				aoMatrix[1][0] = 'VI-4-B1_a';
				aoMatrix[1][1] = 'VI-4-B1_b';
				aoMatrix[1][2] = 'VI-4-B2';
				aoMatrix[1][3] = 'VI-4-B3';

				aoMatrix[2][0] = 'VI-4-C';
				aoMatrix[2][1] = 'VI-4-D';
				break;
			case '61': case '62':
				displayMatrix = createDisplayMatrix(3, 4);
				displayMatrix[0][3] = displayMatrix[2][3] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'IV-6-A1_a';
				aoMatrix[0][1] = 'IV-6-A1_b';
				aoMatrix[0][2] = 'IV-6-A2';

				aoMatrix[1][0] = 'IV-6-B1_a';
				aoMatrix[1][1] = 'IV-6-B1_b';
				aoMatrix[1][2] = 'IV-6-B2';
				aoMatrix[1][3] = 'IV-6-B3';

				aoMatrix[2][0] = 'IV-6-C';
				aoMatrix[2][1] = 'IV-6-D';
				aoMatrix[2][2] = 'IV-6-F';
				break;
			case '81':
				displayMatrix = createDisplayMatrix(3, 3);
				displayMatrix[1][1] = displayMatrix[1][2] = displayMatrix[2][0] = displayMatrix[2][1] = displayMatrix[2][2] = false;
				aoMatrix = createAoMatrix();

				aoMatrix[0][0] = 'VI-8-B1';
				aoMatrix[0][1] = 'VI-8-B2';
				aoMatrix[0][2] = 'VI-8-B3';

				aoMatrix[1][0] = 'VI-8-C';
		}

		if (id.indexOf('7') == 0) {
			displayMatrix = createDisplayMatrix(2, 3);
			displayMatrix[1][1] = displayMatrix[1][2] = false;
			aoMatrix = createAoMatrix();

			aoMatrix[0][0] = 'III-7-B1';
			aoMatrix[0][1] = 'III-7-B2';
			aoMatrix[0][2] = 'III-7-B3';

			aoMatrix[1][0] = 'III-7-C';
		}

		return [displayMatrix, aoMatrix];
	}

	function correctProsthesisClassification(aPictureID, aClassification) {
		var tibiaSegments = [false, false, false];
		var prothesisSegments = [false, false, false];

		if (aPictureID === '41' || aPictureID === '42') {
			switch (aPictureID) {
				case '41': tibiaSegments[0] = true;
					break;
				case '42': tibiaSegments[1] = true;
					break;
				case '43': tibiaSegments[2] = true;
					break;
			}
			if (aClassification.indexOf('A') >= 0) {
				prothesisSegments[0] = true;
			}
			else if (aClassification.indexOf('B') >= 0) {
				prothesisSegments[0] = prothesisSegments[1] = true;
			}

			else if (aClassification.indexOf('C') >= 0) {
				prothesisSegments[0] = prothesisSegments[1] = prothesisSegments[2] = true;
			}

			else if (aClassification.indexOf('D') >= 0) {
				prothesisSegments[0] = prothesisSegments[1] = prothesisSegments[2] = true;
			}
			var i = 0;
			while (!tibiaSegments[i]) {
				i++;
			}

			return prothesisSegments[i] === tibiaSegments[i];
		}
		return true;
	}

	function getProsthesisICD10(icd10Array) {
		var prosthesisICD = '';
		var i = 0;
		var j = 0;

		var prosthDomains = app.myRegisterDomains[5757]
		for (i = 0; i < prosthDomains.DomainValues.length; i++) {
			var prosthesisICDdomain = prosthDomains.DomainValues[i];
			var prosthesisICD = prosthesisICDdomain.ValueCode;
			for (j = 0; j < prosthesisICDdomain.ChildValues.length; j++) {
				var icd10 = prosthesisICDdomain.ChildValues[j].ValueCode;
				var k = 0;
				for (k = 0; k < icd10Array.length; k++) {
					if (icd10Array[k] == icd10) {
						return prosthesisICD;
					}
				}
			}
		}
		return '';
	}

	function filterInjuryCodeExtendedStore(record, domainValues, cmp) {
		var recordValueCode = record.get('ValueCode');
		if (Ext.isEmpty(recordValueCode)) {
			return true;
		}
		var i = 0;
		if (Ext.isEmpty(domainValues)) {
			return false;
		}
		for (i = 0; i < domainValues.length; i++) {
			if (recordValueCode == domainValues[i].ValueCode) {
				cmp.setReadOnly(false);
				return true;
			}
		}
		return false;
	}

	function enableDisableXrayTimeAndDateCmps(aFractureForm, enable) {
		var xt = getCmpByName('Fx_XrayTime', aFractureForm);
		var xd = getCmpByName('Fx_XrayDat', aFractureForm);
		var xl1 = getCmpByName('xraylabel1', aFractureForm);
		var xl2 = getCmpByName('xraylabel2', aFractureForm);
		var xl3 = getCmpByName('xraylabel3', aFractureForm);

		xt.setVisible(enable);
		xd.setVisible(enable);
		xl1.setVisible(enable);
		xl2.setVisible(enable);
		xl3.setVisible(enable);


		var ERt = getCmpByName('Fx_ERTime', aFractureForm);
		var ERd = getCmpByName('Fx_ERDat', aFractureForm);
		var ERl1 = getCmpByName('ERlabel1', aFractureForm);
		var ERl2 = getCmpByName('ERlabel2', aFractureForm);
		var ERl3 = getCmpByName('ERlabel3', aFractureForm);
		
		
		if (!erTimeHandlingIsActive(aFractureForm)) {
			ERt.setVisible(false);
			ERd.setVisible(false);
			ERl1.setVisible(false);
			ERl2.setVisible(false);
			ERl3.setVisible(false);
			return;
		}
		ERt.setVisible(enable);
		ERd.setVisible(enable);
		ERl1.setVisible(enable);
		ERl2.setVisible(enable);
		ERl3.setVisible(enable);

	}

	function enableDisableAtypicalFractureCmps(aFractureForm, enable) {
		var fieldAtypical = getCmpByName('Fx_Atypical', aFractureForm);
		var labelAtypical = getCmpByName('atypicLabel', aFractureForm);
		fieldAtypical.setVisible(enable);
		labelAtypical.setVisible(enable);
	}

	function isFemurFracture(icd10Code) {
		if (Ext.isEmpty(icd10Code)) {
			return false;
		}
		return icd10Code.indexOf('S72') === 0;
	}

	function handleAtypicalFemurFracture(icd10, fractureForm, windowX) {
		var atypicalFractureField = getCmpByName('Fx_Atypical', fractureForm);
		enableDisableAtypicalFractureCmps(fractureForm, false);

		if (askAboutAtypcialFemurFracture(icd10)) {
			enableDisableAtypicalFractureCmps(fractureForm, true);
			var dialogitems = [
		{
			text: 'Ja',
			handler: function () {

				msgBox.close();
				atypicalFractureField.setValue(1);
				if (windowX) {
					windowX.hide();
				}
			}
		}, {
			text: 'Nej',
			handler: function () {
				msgBox.close();
				atypicalFractureField.setValue(0);
				if (windowX) {
					windowX.hide();
				}
			}
		}, {
			text: 'Oklart',
			textAlign: 'left',
			handler: function () {
				msgBox.close();
				atypicalFractureField.setValue(9);
				if (windowX) {
					windowX.hide();
				}
			}
		}, {
			text: 'Avbryt',
			handler: function () {
				msgBox.close();
			}
		}];
			msgBox = createDialog('Atypisk fraktur', 'Atypisk fraktur?', dialogitems, true, '(Atypiska frakturer är stressfrakturer med en tvärgående frakturlinje från laterala kortex på frontalbilden. Minst en antydd kallusreaktion (kortical förtjockning) ska ses. Frakturen kan bestå av en spricka enbart, eller vara komplett. Frakturen har ofta samband med bisfosfonatbehandling)', true);
			msgBox.show();
			return false;
		}
		else {
			atypicalFractureField.setValue(null);
			return true;
		}
	}

	function askAboutAtypcialFemurFracture(icd10Code) {
		return isFemurFracture(icd10Code) && icd10Code.indexOf('S72.0') !== 0 && icd10Code.indexOf('S72.1') !== 0 && !aoImagesNavigationHandler.isChildFracture;
	}

	function isBackFracture(aPictureID) {
		return aPictureID == '100' || aPictureID == '100b' || aPictureID == '101' || aPictureID == '102' || aPictureID == '102b' || aPictureID == '103' || aPictureID == '100-C0' || aPictureID == '100-C1' || aPictureID == '100-C2';
	}

	function addCrossBorderTitleInfo(aForm) {
		if (aForm.isCrossBorder && !Ext.isEmpty(aForm.unitName)) {
			if (aForm.isReduced === true) {
				return '...........................Annan klinik';
			}
			else {
				return '...........................Klinik: <b>' + aForm.unitName + '</b>';
			}
		}
		return '';
	}

	function stringIsInArray(array, str) {
		var i = 0;
		for (i = 0; i < array.length; i++) {
			if (array[i] === str) {
				return true;
			}
		}
		return false;
	}

	function scrollVert(aScrollToId, aScroll) {
		var scrollTo = Ext.get(aScrollToId),
		scroll = Ext.getDom(aScroll),
		o = scrollTo.getOffsetsTo(scroll),
		y = o[1];

		window.scrollTo(0, y);
	}

	function initialize() {
		/*
      app.myRegisterDomains = loadDomains(app.requiredDomainCodes,
		function () {
			app.mySkeletonWindow = createSkeletonWindow(Ext.getBody());
			app.mySkeletonWindow.getLayout().setActiveItem(0);
			app.mySkeletonWindow.show();
		});
		*/
		app.myRegisterDomains = {};
	  app.extras = loadDomains(app.skeletonDomainCodes, function() {
	  	app.myRegisterDomains =app.extras;	
	  });
	  app.mySkeletonWindow = createSkeletonWindow(Ext.getBody());
	  app.mySkeletonWindow.getLayout().setActiveItem(0);
	  aoImagesNavigationHandler(null, '61', 0, null);
	  app.mySkeletonWindow.show();
	}
}
