{
	TitleOfEvent: function (aRegistration) {
		switch (aRegistration.Form.FormName) {
			case 'Project':
				return '<span lang="sv" style="hyphens: auto; font-style: italic; font-size: 12px">' + aRegistration.ProjectName + '</span>';
				break;
			default:
				return Ext.util.Format.date(Repository.Global.Methods.ParseDate(aRegistration[aRegistration.Form.MappedEventDate]), 'Y-m-d');
		}
	},

	TitleOfPanel: function (currentRegistration) {
		var formTitle = currentRegistration.Form.FormTitle,
			formID = currentRegistration.Form.FormID,
			eventDate = currentRegistration[currentRegistration.Form.MappedEventDate],
			roleNotPermittedToViewCrossBorder = currentRegistration.IsCrossBorder && !Profile.Context.Role.IsPermittedToCrossBorder,
			formattedDate = Ext.util.Format.date(Repository.Global.Methods.ParseDate(eventDate), 'Y-m-d');
		badgeHoger = '<span class="Badge Blueish">Höger</span>',
			badgeVanster = '<span class="Badge Orangeish">Vänster</span>',
			badgeOspec = '<span class="Badge Greenish">Ospec</span>';

		var injCauseCode = currentRegistration.Inj_Cause ? currentRegistration.Inj_Cause : '';
		var crossBtext = '';
		var text = '';
		if (roleNotPermittedToViewCrossBorder) {
			crossBtext = ' &nbsp;' + "<i>   (dold – registrerad på annan enhet)<i>";
		}
		if (!roleNotPermittedToViewCrossBorder) {
			/*Koordinatorer kan se vilken enhet som gjort den aktuella registreringen vid crossborder*/
			if (currentRegistration.Unit) {
				crossBtext = '<span class="Badge">' + currentRegistration.Unit.UnitName + '</span>';
			}
		}
		if (currentRegistration.Trt_Code != undefined) {
			text = formTitle += '&nbsp;' + formattedDate + '&nbsp;&nbsp;&nbsp;' + currentRegistration.Trt_Code;
		}
		else if (currentRegistration.Fx_Side === 1) {
			text = formTitle += '&nbsp;' + currentRegistration.Fx_ICD10 + badgeHoger;
		}
		else if (currentRegistration.Fx_Side === 2) {
			text = formTitle += '&nbsp;' + currentRegistration.Fx_ICD10 + badgeVanster;
		}
		else if (currentRegistration.Fx_Side === 3) {
			text = formTitle += '&nbsp;' + formattedDate + '&nbsp;&nbsp;&nbsp;' + currentRegistration.Fx_ICD10 + badgeOspec;
		}
		else {
			text = formTitle += '&nbsp;' + formattedDate + '&nbsp;&nbsp;&nbsp;' + injCauseCode;
		}
		return text + crossBtext;
	},
	Helpers: {
		LoadWidget: function(name, callback) {
			var head = document.getElementsByTagName('head')[0];
			var element = document.createElement('script');
			element.src = '/stratum/api/widgets/' + name;
			element.onload = element.onreadystatechange = callback;
			head.appendChild(element);
		}
	},
	Hipsther: {
		log: function (message) {
			if (window.localStorage.getItem("LOG_HIPSTHER") === "true") {
				if (typeof message === "object") {
					console.log(message);
				}
				else {
					console.log("HIPSTHER: " + message);
				}
			}
		},
		getBaseUrl: function () {
			var env = "-" + Repository.DeploymentMode.toLowerCase();
			if (Repository.DeploymentMode === "PROD") {
				env = "";
			}
			return "/stratum/api/rrct/clinicaltrial-hipsther" + env + "-nationellariktlinjer.1.0.0";
		},
		getResource: function (resource) {
			var BASE_URL = Repository.Local.Methods.Hipsther.getBaseUrl();
			return new Ext.Promise(function (resolve, reject) {
				Ext.Ajax.request({
					url: BASE_URL + resource,
					success: function (response) {
						if (response.status > 399 || !response.responseText) {
							reject();
						}
						var responseJson = Ext.util.JSON.decode(response.responseText);
						if (responseJson.success === false || responseJson.code !== 0) {
							reject();
						}
						resolve(responseJson.data);
					},
					failure: function (response) {
						if (response.responseText) {
							var responseJson = Ext.util.JSON.decode(response.responseText);
							reject(responseJson);
						}
						else {
							reject("An unknown error occurred while getting resource: " + resource);
						}
					}
				});
			});
		},
		getFractureScope: function (current, subject) {

			function getXRayFullDate(xRayDate, xRayTime) {
				if (!xRayDate || !xRayDate) return null;
				var date = xRayDate.substring(0, 11) + xRayTime;
				return Ext.Date.parse(date, "Y-m-dTH:i:s");
			}

			var injuryDate = Ext.Date.parse(current.Parent.Inj_Dat, "Y-m-dTH:i:s");
			var scope = {
				eventId: current.EventID,
				subjectKey: subject.SubjectKey,
				ageAtInjuryDate: Repository.Global.Methods.CalculateAge(subject.SubjectKey, injuryDate),
				injuryDate: injuryDate,
				injuryCause: current.Parent.Inj_Cause,
				fractureClass: current.Fx_Class,
				fractureRegistrationDate: Ext.Date.parse(current.InsertedAt, "Y-m-dTH:i:s.u"),
				xRayDate: current.Fx_XrayDat ? current.Fx_XrayDat.substring(0, 10) : null,
				xRayTime: current.Fx_XrayTime,
				xRayFullDate: getXRayFullDate(current.Fx_XrayDat, current.Fx_XrayTime),
				closeToImplant: current.Fx_CloseToImplant,
				noTreatment: current.Fx_NoTrt
			};
			return scope;
		},
		isEligible: function (scope) {
			try {
				Repository.Local.Methods.Hipsther.log("Checking isEligible. scope:");
				Repository.Local.Methods.Hipsther.log(scope);

				var INJURY_CAUSE_STRESS = "M84.3";
				var INJURY_CAUSE_SPONTANEOUS = "M84.8";
				var INJURY_CAUSE_PATHOLOGIC = /M84.4-[a-g]/;
				var EXPECTED_FRACTURE_CLASS = "MAO-31-B1";
				var INJURY_TO_XRAY_THRESHOLD_HOURS = 72;
				var AGE_AT_INJURY_DATE_THRESHOLD = 75;

				function hourDiff(day1, day2) {
					var diff = day2 - day1;
					return diff / 1000 / 60 / 60;
				}

				if (!scope.eventId) {
					Repository.Local.Methods.Hipsther.log("Cannot proceed because EventID is missing. Fracture has not been saved yet.");
					return false;
				}

				if (!scope.injuryCause) {
					Repository.Local.Methods.Hipsther.log("Not eligible because of Injury cause was not set.");
					return false;
				}

				if (scope.injuryCause === INJURY_CAUSE_STRESS || scope.injuryCause === INJURY_CAUSE_SPONTANEOUS) {
					Repository.Local.Methods.Hipsther.log("Not eligible because of Injury cause: 'Stress' or 'spontaneous'.");
					Repository.Local.Methods.Hipsther.log("Injury cause was: " + scope.injuryCause);
					return false;
				}
				if (scope.injuryCause.match(INJURY_CAUSE_PATHOLOGIC)) {
					Repository.Local.Methods.Hipsther.log("Not eligible because of Injury cause: 'Pathologic'");
					return false;
				}
				if (scope.fractureClass !== EXPECTED_FRACTURE_CLASS) {
					Repository.Local.Methods.Hipsther.log("Not eligible because fracture class was not: " + EXPECTED_FRACTURE_CLASS);
					Repository.Local.Methods.Hipsther.log("Fracture class was: " + scope.fractureClass);
					return false;
				}
				if (!scope.xRayFullDate) {
					Repository.Local.Methods.Hipsther.log("Not eligible because X-Ray date was: " + scope.xRayFullDate);
					return false;
				}
				var injuryDateToxRayDateDiff = hourDiff(scope.injuryDate, scope.xRayFullDate);
				if (injuryDateToxRayDateDiff > INJURY_TO_XRAY_THRESHOLD_HOURS) {
					Repository.Local.Methods.Hipsther.log("Not eligible because x-ray time was more than " + INJURY_TO_XRAY_THRESHOLD_HOURS + " hours later than injury time.");
					Repository.Local.Methods.Hipsther.log("Injury time: " + scope.injuryDate);
					Repository.Local.Methods.Hipsther.log("X-Ray time: " + scope.xRayFullDate);
					Repository.Local.Methods.Hipsther.log("Time diff: " + injuryDateToxRayDateDiff);
					return false;
				}

				if (scope.closeToImplant === true) {
					Repository.Local.Methods.Hipsther.log("Not eligible because 'Close to implant' was true.");
					return false;
				}
				if (scope.noTreatment === true) {
					Repository.Local.Methods.Hipsther.log("Not eligible because 'No treatment' was true.");
					return false;
				}
				if (scope.ageAtInjuryDate < AGE_AT_INJURY_DATE_THRESHOLD) {
					Repository.Local.Methods.Hipsther.log("Not eligible because 'Age at injury date' was less than " + AGE_AT_INJURY_DATE_THRESHOLD + ".");
					Repository.Local.Methods.Hipsther.log("Age at injury date was: " + scope.ageAtInjuryDate);
					return false;
				}

				Repository.Local.Methods.Hipsther.log("isEligible is true.");
				return true;
			}
			catch (error) {
				Repository.Local.Methods.Hipsther.log("Error occurred. " + error);
				return false;
			}
		},
		evaluateSubjectForScreening: function (current, subject, subjectManagement) {
			Repository.Local.Methods.Hipsther.log("Waiting to evaluate if screening should be offered...");
			setTimeout(function () {
				Repository.Local.Methods.Hipsther.log("Done waiting! Will evaluate subject for screening.");
				Repository.Local.Methods.Hipsther.evaluateSubjectForScreeningInternal(current, subject, subjectManagement);
			}, 2000);
		},
		evaluateSubjectForScreeningInternal: function (current, subject, subjectManagement) {
			var scope = Repository.Local.Methods.Hipsther.getFractureScope(current, subject);
			var eligible = Repository.Local.Methods.Hipsther.isEligible(scope);
			Repository.Local.Methods.Hipsther.log("Subject eligible for screening: " + eligible);

			function loadWidget(widget, widgetCallback) {
				var head = document.getElementsByTagName('head')[0];
				var element = document.createElement('script');
				element.src = '/stratum/api/widgets/' + widget;
				element.onload = element.onreadystatechange = widgetCallback;
				head.appendChild(element);
			}

			if (eligible) {
				Repository.Local.Methods.Hipsther.unitIsActiveInStudy().then(function (response) {
					Repository.Local.Methods.Hipsther.log("Unit is active in study.");
					Repository.Local.Methods.Hipsther.patientNotAlreadyScreened(current).then(function () {
						Repository.Local.Methods.Hipsther.log("Patient is not screened. Continuing...");
						Repository.Local.Methods.Hipsther.patientNotAlreadyInStudy(subject).then(function () {
							Repository.Local.Methods.Hipsther.log("Patient is not included in study. Continuing...");
							Ext.MessageBox.show({
								title: Repository.Local.Methods.Hipsther.userTexts.CONTINUE_WITH_SCREENING_QUESTION_TITLE,
								msg: Repository.Local.Methods.Hipsther.userTexts.CONTINUE_WITH_SCREENING_QUESTION,
								buttons: Ext.MessageBox.YESNO,
								icon: Ext.MessageBox.QUESTION,
								fn: function (b) {
									switch (b) {
										case 'yes':
											var hipstherWidgetParameters = Repository.Local.Methods.Hipsther.getHipstherWidgetParameters(scope);
											if (typeof hipstherWidget === "undefined") {
												loadWidget('SFR/Hipsther', function () {
													hipstherWidget(hipstherWidgetParameters, subjectManagement);
												});
											}
											else {
												hipstherWidget(hipstherWidgetParameters, subjectManagement);
											}
										case 'no':
											Repository.Local.Methods.Hipsther.log("No participation in study.");
											break;
									}
								}
							});
						}, function () {
							// Patient is NOT screened but is in study. Should never happen!
							Repository.Local.Methods.Hipsther.log("Inconsistent state. Patient is NOT screened but is active in study.");
						});
					}, function () {
						// Patient is already screened. Check if active in study and write data.
						Repository.Local.Methods.Hipsther.writeUpdatedStudyData(current, subject);
					});
				}, function (response) {
					Repository.Local.Methods.Hipsther.log("Unit is not active in study.");
					Repository.Local.Methods.Hipsther.log(response);
				});
			}
			else {
				Repository.Local.Methods.Hipsther.log("Patient was not eligible for HIPSTHER. Checking if patient was already in study.");
				Repository.Local.Methods.Hipsther.writeUpdatedStudyData(current, subject)
					.then(function (response) {
						if (response.status !== 401) {
							Ext.Msg.alert(
								'HIPSTHER',
								"Aktuell patient är inkluderad i HIPSTHER-studien. Den gjorda förändringen av data medför " +
								"att patienten inte längre uppfyller inklusionsvillkoren för studien. Var vänlig kontakta " +
								"studiekoordinator Monica Sjöholm, Tel: 0704-25 00 43 email: monica.sjoholm@surgsci.uu.se",
								Ext.emptyFn
							);
						}
					}, function (rejectionMessage) {
						Repository.Local.Methods.Hipsther.log(rejectionMessage);
					});
			}
		},
		getHipstherWidgetParameters: function (scope) {
			return {
				eventId: scope.eventId,
				subjectKey: scope.subjectKey,
				studyVariables: {
					injuryCause: scope.injuryCause,
					injuryDate: scope.injuryDate,
					ageAtInjuryDate: scope.ageAtInjuryDate,
					xRayDate: scope.xRayDate,
					xRayTime: scope.xRayTime
				}
			};
		},
		unitIsActiveInStudy: function () {
			var deferred = new Ext.Deferred();
			Repository.Local.Methods.Hipsther.getResource("")
				.then(function (data) {
					if (data.Enabled === false) {
						deferred.reject("Unit is not included in study.");
					}
					deferred.resolve();
				}, function (error) {
					deferred.reject(error);
				});
			return deferred.promise;
		},
		patientNotAlreadyScreened: function (current) {
			var deferred = new Ext.Deferred();
			Repository.Local.Methods.Hipsther.getResource("/candidates/" + current.EventID)
				.then(function () {
					deferred.reject();
				}, function (response) {
					if (response.code === 404) {
						deferred.resolve();
					}
					deferred.reject("Did not receive expected 404 response.");
				});
			return deferred.promise;
		},
		patientNotAlreadyInStudy: function (subject) {
			var deferred = new Ext.Deferred();
			Repository.Local.Methods.Hipsther.getResource("/subjects/" + subject.SubjectKey)
				.then(function () {
					deferred.reject("Patient is already included in study.");
				}, function (response) {
					if (response.code === 404) {
						deferred.resolve();
					}
					deferred.reject("Did not receive expected 404 response.");
				});
			return deferred.promise;
		},
		writeInitialStudyData: function (parameters, subjectKey) {
			var BASE_URL = Repository.Local.Methods.Hipsther.getBaseUrl();
			return new Ext.Promise(function (resolve, reject) {
				Ext.Ajax.request({
					url: BASE_URL + "/subjects/data/" + subjectKey,
					method: "POST",
					jsonData: [
						{ id: "SE_BASELINE::1::F_BASELINE_1::1::IG_BASEL_BASELINE::1::I_BASEL_INJ_CAUSE", value: parameters.studyVariables.injuryCause },
						{ id: "SE_BASELINE::1::F_BASELINE_1::1::IG_BASEL_BASELINE::1::I_BASEL_INJ_DAT", value: Ext.Date.format(parameters.studyVariables.injuryDate, "Y-m-d") },
						{ id: "SE_BASELINE::1::F_BASELINE_1::1::IG_BASEL_BASELINE::1::I_BASEL_INJ_AGE", value: parameters.studyVariables.ageAtInjuryDate },
						{ id: "SE_BASELINE::1::F_BASELINE_1::1::IG_BASEL_BASELINE::1::I_BASEL_FX_XRAYDAT", value: parameters.studyVariables.xRayDate },
						{ id: "SE_BASELINE::1::F_BASELINE_1::1::IG_BASEL_BASELINE::1::I_BASEL_FX_XRAYTIME", value: parameters.studyVariables.xRayTime }
					],
					success: function (response) {
						resolve(response);
					},
					failure: function (response) {
						reject(response);
					}
				});
			});
		},
		writeUpdatedStudyData: function (current, subject) {
			return new Ext.Promise(function (resolve, reject) {
				Repository.Local.Methods.Hipsther.patientNotAlreadyInStudy(subject).then(function () {
					reject("Patient not active in study. Exiting...");
				}, function () {
					Repository.Local.Methods.Hipsther.log("Patient is already in study. Checking if this is the correct injury.");
					
					Repository.Local.Methods.Hipsther.getResource("/subjects/" + subject.SubjectKey)
						.then(function(response) {
							if(response.Screening.EventId == current.EventID) {
								Repository.Local.Methods.Hipsther.log("Found same injury as in study. Will write new data.");
								var scope = Repository.Local.Methods.Hipsther.getFractureScope(current, subject);
								var hipstherWidgetParameters = Repository.Local.Methods.Hipsther.getHipstherWidgetParameters(scope);
								Repository.Local.Methods.Hipsther.log("hipstherWidgetParameters:");
								Repository.Local.Methods.Hipsther.log(hipstherWidgetParameters);
								Repository.Local.Methods.Hipsther.writeInitialStudyData(hipstherWidgetParameters, subject.SubjectKey)
									.then(function (response) {
										Repository.Local.Methods.Hipsther.log(response);
										resolve(response);
									}, function (response) {
										Repository.Local.Methods.Hipsther.log("Problem when writing study data.");
										Repository.Local.Methods.Hipsther.log(response);
										if (response.status !== 401) {
											Ext.Msg.alert(
												'HIPSTHER',
												'Patienten är sedan tidigare aktiv i HIPSTHER-studien. Ett okänt fel uppstod när studievariabler skulle uppdateras. Vänligen kontakta studieledningen.',
												Ext.emptyFn
											);
										}
										reject("Error when writing updated study variables.");
									});
							}
							else {
								Repository.Local.Methods.Hipsther.log("EventId did NOT match! This is a different injury than the one in study. Quitting...");
							}
						}, function(response) {
							Repository.Local.Methods.Hipsther.log("Patient not in study. Should not happen here!");
						});
				});
			});
		},
		writeTreatmentStudyData: function (current, subject) {
			var BASE_URL = Repository.Local.Methods.Hipsther.getBaseUrl();
			Ext.Ajax.request({
				url: BASE_URL + "/subjects/data/" + subject.SubjectKey,
				method: "POST",
				jsonData: [
					{ id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_UNIT", value: "{UNIT_ID}" },
					{ id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_DAT", value: current.Trt_Dat ? current.Trt_Dat.substring(0, 10) : "" },
					{ id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_TYPE", value: current.Trt_Type },
					{ id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_KNIFESTARTTIME", value: current.Trt_KnifeStartTime },
					{ id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_CODE", value: current.Trt_Code },
					{ id: "SE_TREATMENT::" + current.EventID + "::F_TREATMENT_1::1::IG_TREAT_TREATMENT::1::I_TREAT_TRT_MAINSURGEON", value: current.Trt_MainSurgeon }
				],
				success: function (response) {
					Repository.Local.Methods.Hipsther.log("Study data were written to database.");
					Repository.Local.Methods.Hipsther.log(response);
				},
				failure: function (response) {
					Repository.Local.Methods.Hipsther.log("Could not write study data.");
					Repository.Local.Methods.Hipsther.log(response);
				}
			});
		},
		evaluateIfTreatmentStudyDataShouldBeWritten: function (current, parent, subject) {
			Repository.Local.Methods.Hipsther.log("Evaluating if treatment study data should be written.");
			var BASE_URL = Repository.Local.Methods.Hipsther.getBaseUrl();
			Ext.Ajax.request({
				url: BASE_URL + "/subjects/" + subject.SubjectKey,
				success: function (response) {
					var json = Ext.util.JSON.decode(response.responseText);
					Repository.Local.Methods.Hipsther.log("Found subject in study:");
					Repository.Local.Methods.Hipsther.log(json);
					if (json.data.Withdrawn === false) {
						Repository.Local.Methods.Hipsther.log("Subject is still active in study. Checking if the injury has the same event id as in the subject log.");
						if (parent.EventID == json.data.Screening.EventId) {
							Repository.Local.Methods.Hipsther.log("Found same event id. Will write study data.");
							Repository.Local.Methods.Hipsther.writeTreatmentStudyData(current, subject);
						}
						else {
							Repository.Local.Methods.Hipsther.log("Could not match event id. This is a different injury than in the study database.");
						}
					}
				},
				failure: function (response) {
					Repository.Local.Methods.Hipsther.log("Subject not found in study.");
					Repository.Local.Methods.Hipsther.log(response);
				}
			});
		},
		userTexts: {
			CONTINUE_WITH_SCREENING_QUESTION_TITLE: "Fråga från HIPSTHER-studien:",
			CONTINUE_WITH_SCREENING_QUESTION: "Denna patient uppfyller inklusionkriterierna för HIPSTHER med randomisering mellan protes och osteosyntes vid Garden I-II frakturer. Vill du screena patienten nu?"
		}
	},
	Duality: {
		log: function(message) {
			if(window.localStorage.getItem("LOG_DUALITY") === "true") {
				if(typeof message === "object") {
					console.log(message);
				}
				else {
					console.log("DUALITY: " + message);
				}
			}
		},
		evaluateSubjectForScreening: function(current, subject, subjectManagement) {
			setTimeout(function() {
				var eligible = Repository.Local.Methods.Duality.isEligible(current, subject);
				Repository.Local.Methods.Helpers.LoadWidget("SFR/Duality", function() {
					Repository.Local.Methods.Duality.log("Duality widget has been loaded. Will now initialize.");
					if(eligible) {
						Repository.Local.Methods.Duality.log("Subject is eligible for Duality.");
						Duality.evaluateForScreening(current, subject, subjectManagement);
					}
					else {
						Repository.Local.Methods.Duality.log("Subject is NOT eligible for Duality.");
						Duality.validateIfMattersHaveChanged(current, subject);
					}
				});
			}, 2000);
		}, 
		isEligible: function(current, subject) {
			try {
				Repository.Local.Methods.Duality.log("Checking if subject is eligible for Duality.");
				var INJURY_CAUSE_STRESS = "M84.3";
				var INJURY_CAUSE_SPONTANEOUS = "M84.8";
				var INJURY_CAUSE_PATHOLOGIC = /M84.4-[a-g]/;
				var EXPECTED_FRACTURE_CLASSES = ["MAO-31-B2", "MAO-31-B3"];
				var INJURY_TO_XRAY_THRESHOLD_HOURS = 192; // 168=7 days, 192=8 days (from 00:00 to 23:59 on the 7th day)
				var AGE_AT_INJURY_DATE_THRESHOLD = 65;
		
				function hourDiff(day1, day2) {
					var diff = day2 - day1;
					return diff / 1000 / 60 / 60;
				}

				function getXRayFullDate(xRayDate, xRayTime) {
					if(!xRayDate || !xRayDate) return null;
					var date = xRayDate.substring(0, 11) + xRayTime;
					return Ext.Date.parse(date, "Y-m-dTH:i:s");
				}

				if(!current.EventID) {
					Repository.Local.Methods.Duality.log("Cannot proceed because EventID is missing. Fracture has not been saved yet.");
					return false;
				}
		
				if(!current.Parent.Inj_Cause) {
					Repository.Local.Methods.Duality.log("Not eligible because of Injury cause was not set.");
					return false;
				}
	
				if(current.Parent.Inj_Cause === INJURY_CAUSE_STRESS || current.Parent.Inj_Cause === INJURY_CAUSE_SPONTANEOUS) {
					Repository.Local.Methods.Duality.log("Not eligible because of Injury cause: 'Stress' or 'spontaneous'.");
					Repository.Local.Methods.Duality.log("Injury cause was: " + current.Parent.Inj_Cause);
					return false;
				}
				if(current.Parent.Inj_Cause.match(INJURY_CAUSE_PATHOLOGIC)) {
					Repository.Local.Methods.Duality.log("Not eligible because of Injury cause: 'Pathologic'");
					return false;
				}
				if(EXPECTED_FRACTURE_CLASSES.indexOf(current.Fx_Class) < 0) {
					Repository.Local.Methods.Duality.log("Not eligible because the expected fracture class was not found.");
					Repository.Local.Methods.Duality.log("Fracture class was: " + current.Fx_Class);
					Repository.Local.Methods.Duality.log("Expected one of:");
					Repository.Local.Methods.Duality.log(EXPECTED_FRACTURE_CLASSES);
					return false;
				}
				if(!getXRayFullDate(current.Fx_XrayDat, current.Fx_XrayTime)) {
					Repository.Local.Methods.Duality.log("Not eligible because X-Ray date was: " + getXRayFullDate(current.Fx_XrayDat, current.Fx_XrayTime));
					return false;
				}
				var injuryDate = Ext.Date.parse(current.Parent.Inj_Dat, "Y-m-dTH:i:s");
				var xRayFullDate = getXRayFullDate(current.Fx_XrayDat, current.Fx_XrayTime);
				var injuryDateToxRayDateDiff = hourDiff(injuryDate, xRayFullDate);
				var ageAtInjuryDate = Repository.Global.Methods.CalculateAge(subject.SubjectKey, injuryDate)
				if(injuryDateToxRayDateDiff > INJURY_TO_XRAY_THRESHOLD_HOURS) {
					Repository.Local.Methods.Duality.log("Not eligible because x-ray time was more than " + INJURY_TO_XRAY_THRESHOLD_HOURS + " hours later than injury time.");
					Repository.Local.Methods.Duality.log("Injury time: " + injuryDate);
					Repository.Local.Methods.Duality.log("X-Ray time: " + xRayFullDate);
					Repository.Local.Methods.Duality.log("Time diff: " + injuryDateToxRayDateDiff);
					return false;
				}
		
				if(current.Fx_CloseToImplant === true) {
					Repository.Local.Methods.Duality.log("Not eligible because 'Close to implant' was true.");
					return false;
				}
				if(current.Fx_NoTrt === true) {
					Repository.Local.Methods.Duality.log("Not eligible because 'No treatment' was true.");
					return false;
				}
				if(ageAtInjuryDate < AGE_AT_INJURY_DATE_THRESHOLD) {
					Repository.Local.Methods.Duality.log("Not eligible because 'Age at injury date' was less than " + AGE_AT_INJURY_DATE_THRESHOLD + ".");
					Repository.Local.Methods.Duality.log("Age at injury date was: " + ageAtInjuryDate);
					return false;
				}
		
				return true;	
			}
			catch(error) {
				Repository.Local.Methods.Duality.log("Error occurred. " + error);
				return false;
			}			
		},
		evaluateIfTreatmentStudyDataShouldBeWritten: function(current, subject) {
			Repository.Local.Methods.Helpers.LoadWidget("SFR/Duality", function() {
				Repository.Local.Methods.Duality.log("Duality widget has been loaded. Will now initialize.");
				Duality.evaluateIfTreatmentStudyDataShouldBeWritten(current, subject);
			});
		}
    },
    Consensus: {
		isActive: function (aoCode) {
			return false;
			var units = [8, 17, 1004, 26, 10001]; /*TODO://10001=testenheten på demo*/
			var cnd1 = units.indexOf(Profile.Context.Unit.UnitCode) >= 0;
			var cnd2 = Repository.Local.Methods.Consensus.getTexts(aoCode) !== null;
			//var cnd3 = Profile.Context.User.UserID == 4 || Profile.Context.User.UserID == 103 || Profile.Context.User.UserID == 90260 || Profile.Context.User.UserID == 90279 || Profile.Context.User.UserID == 90218 || Profile.Context.User.UserID == 92210 || Profile.Context.User.UserID == 90274 || Profile.Context.User.UserID == 96334 || Profile.Context.User.Username == 'SFRdemo';
			return cnd1 && cnd2;
		},
		getTexts: function (aoCode) {
			var obj = {};
			switch (aoCode) {
				case 'MAO-44-A1':
					obj.infoText = 'Frakturer av typ [code] är per definition stabila och rekommenderas behandlas icke kirurgiskt med ortos i 4 veckor.';
					obj.confirmText = 'Du har registrerat en isolerad lateral malleolfraktur nedom ledspringenivå dvs det finns ingen fraktur, svullnad eller ömhet medialt.';
					obj.recommendedTrt=1;
					break;
				case 'MAO-44-B1.1':
					obj.infoText = 'Frakturer av typ [code] är per definition stabila och rekommenderas behandlas icke kirurgiskt med stabil ortos i 4 veckor.';
					obj.confirmText = 'Du har registrerat en odislocerad lateral malleolfraktur i syndesmosnivå utan någon medial skada, dvs det finns ingen fraktur, svullnad eller ömhet medialt.';
					obj.recommendedTrt=1;
					break;
				case 'MAO-44-B1.2/3':
					obj.infoText = 'Frakturer av typ [code] kan vara instabila. Om fotleden är kongruent på första röntgenbild – belasta i gips eller ortos och kontrollera med röntgen efter en vecka.';
					obj.confirmText = 'Du har registrerat en dislocerad eller komminut lateral malleolfraktur i syndesmosnivå utan någon medial skada, dvs det finns ingen fraktur, svullnad eller ömhet medialt';
					obj.recommendedTrt=1;
					break;
				case 'MAO-44-A2.1/2':
					obj.infoText = 'Frakturer av typ [code] är per definition instabila och rekommenderas stabiliseras kirurgiskt.';
					obj.confirmText = 'Du har registrerat en lateral ledbandsskada eller avulsionsfraktur med en samtidig medial malleolfraktur';
					obj.recommendedTrt=2;
					break;
				case 'MAO-44-A2.3':
					obj.infoText = 'Frakturer av typ [code] är per definition instabila och rekommenderas stabiliseras kirurgiskt.';
					obj.confirmText = 'Du har registrerat en tvär lateral malleolfraktur nedom ledspringenivå och en samtidig medial malleolfraktur.';
					obj.recommendedTrt=2;
					break;

				case 'MAO-44-B2.1':
					obj.infoText = 'Frakturer av typ [code] är per definition instabila och rekommenderas stabiliseras kirurgiskt.';
					obj.confirmText = 'Du har registrerat en enkel lateral malleolfraktur i syndesmosnivå med medial ligamentskada.';
					obj.recommendedTrt=2;
					break;

				case 'MAO-44-B2.2/3':
					obj.infoText = 'Frakturer av typ [code] är per definition instabila och rekommenderas stabiliseras kirurgiskt';
					obj.confirmText = 'Du har registrerat en enkel eller komminut lateral malleofraktur i syndesmosnivå med medial malleolfraktur.';
					obj.recommendedTrt=2;
					break;
				case 'MAO-44-C3':
					obj.infoText = 'Frakturer av typ [code] är per definition instabila och rekommenderas stabiliseras kirurgiskt.';
					obj.confirmText = 'Du har registrerat en medial ligamentskada eller malleolfraktur och fibulafraktur högt över syndesmosnivå (Maissoneuvefraktur)';
					obj.recommendedTrt=2;
					break;
			}
			if (obj.infoText !== undefined && obj.confirmText !== undefined) {
				obj.confirmText += '<br/><br/>' + 'Om detta stämmer gå vidare, annars gå tillbaka och ändra din klassificering.'
				return obj;
			}
			return null;
		},
		displayInfoText: function (text) {
			Ext.MessageBox.show({
				title: 'Konsensus',
				msg: text,
				buttons: Ext.Msg.OK,
				icon: Ext.MessageBox.INFO
			});
		},
		handleConsensus: function (aoCode, aCallback, parent) {
			var textObj = Repository.Local.Methods.Consensus.getTexts(aoCode);
			var aoCodeTxt = aoCode.substr(4);
			if (textObj === null || !Repository.Local.Methods.Consensus.isActive(aoCode))
				return;
			var text = textObj.infoText;
			text += '<br/><br/>På din klinik behandlades [percentCLINIC]% (N:[NCLINIC]) av frakturer av typ [code] [trt_type] det gångna året, i riket var motsvarande siffra [percentREGISTER]% (N:[NREGISTER]).';
			if(textObj.recommendedTrt===1){
				text=text.replace('[trt_type]', 'icke kirurgiskt');
			}
			else if(textObj.recommendedTrt===2){
				text=text.replace('[trt_type]', 'kirurgiskt');
			}
			else{
				text=text.replace('[trt_type]', '?????');
			}
			text = text.replace('[code]', aoCodeTxt);
			text = text.replace('[code]', aoCodeTxt);
			spin('MiddlePanel', 'Hämtar konsensusinfo', 500, 400);
			Ext.Ajax.request({
				url: Ext.String.format('/stratum/api/statistics/sfr/sfrw-proportion-non-surgical-by-fxclass?enhet={0}&fxclass={1}&show_trt_type={2}', Profile.Context.Unit.UnitCode, aoCode, textObj.recommendedTrt), //todo:funkar ej på demo.
				method: 'GET',
				success: function (response, opts) {
					var responseData = Ext.decode(response.responseText).data;
					text = text.replace('[percentCLINIC]', responseData.enhet_andel);
					text = text.replace('[NCLINIC]', responseData.enhet_taljare);
					text = text.replace('[percentREGISTER]', responseData.riket_andel);
					text = text.replace('[NREGISTER]', responseData.riket_taljare);
					unspin();
					aCallback(text, parent);
				},
				failure: function () {
					unspin();
					Ext.Msg.show({
						title: 'Fel vid hämtning',
						msg: 'Okänt fel uppstod vid hämtning av konsensusstatistik.',
						buttons: Ext.Msg.OK,
						icon: Ext.MessageBox.INFO,
						width: 600
					});
				}
			});
		},

		displayConsensusDialog: function (text, parent) {
			if (!Repository.Local.Methods.Consensus.isActive(parent.Fx_Class))
				return;
			if (parent.Fx_Consensus !== null)
				return;
			Ext.Ajax.request({
				url: '/stratum/api/metadata/domains/6231',
				method: 'GET',
				success: function (response) {
					var dv = Ext.decode(response.responseText).data.DomainValues;
					var dockedItems = [];
					var i = 0;
					for (i = 0; i < dv.length; i++) {
						dockedItems.push({
							width: 425,
							text: dv[i].ValueName=='Jag har följt rekommenderad behandling' ? '<b>' + dv[i].ValueName + '</b>' : dv[i].ValueName,
							valueCode: dv[i].ValueCode,
							handler: function (cmp) {
								dialog.close();
								Repository.Local.Methods.Consensus.saveConsensusQuestion(cmp.valueCode, parent.EventID, parent);

							}
						});
					}
                    /*dockedItems.push({
                            width:425,
                            text: 'Avbryt',							
                            handler: function (cmp) {						
                                dialog.close();										
                                                                
                            }});	*/
					var dialog = Ext.create('Ext.window.Window', {
						title: 'Konsensus',
						resizable: false,
						html: text + '<br/><br/><b>Har du valt att frångå rekommenderad behandling för den registrerade frakturen? Ange huvudanledningen till varför nedan.</b>',
						style: 'text-align:center;',
						width: 460,

						modal: true,
						dockedItems: [{
							xtype: 'toolbar',
							layout: 'vbox',
							dock: 'bottom',
							items: dockedItems
						}]
					});
					dialog.show();
				}
			});
		},
		saveConsensusQuestion: function (answer, fractureEventID, parent) {

			var data = '{Fx_Consensus:' + answer + '}';
			spin('MiddlePanel', 'Sparar konsensusfråga', 500, 400);
			Ext.Ajax.request({
				url: '/stratum/api/registrations/' + fractureEventID,
				method: 'PUT',
				jsonData: data,
				headers:
				{
					'Content-Type': 'application/json'
				},
				success: function (response) {
					unspin();
					//finalizeScript(this); todo
					//Profile.Models.History.Frakt.Registrations[0].Fx_Consensus=answer;
				},
				failure: function (response) {
					unspin();
					alert('Okänt fel. Kunde inte spara');
				}
			});
		}
	}
}

