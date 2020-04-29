var BASE_URL = "/stratum/api/";


export function getRegisters() {
    return getResource(BASE_URL + "metadata/registers");
}

export function getForms(registerId) {
    return getResource(BASE_URL + "metadata/forms/register/" + registerId);
}

export function getVariables(formId) {
    return getResource(BASE_URL + "metadata/questions/form/" + formId);
}

export function getVariable(questionId) {
    return getResource(BASE_URL + "metadata/questions/" + questionId);
}

export function updateVariable(questionId, question) {
    return putResource(BASE_URL + "metadata/questions/" + questionId, question); 
}

function getResource(resource) {
    return performRequest(resource, "GET");
}

function putResource(resource, jsonData) {
    return performRequest(resource, "PUT", jsonData);
}

function performRequest(resource, method, jsonData) {
    var deferred = new Ext.Deferred();
    Ext.Ajax.request({
        url: resource,
        method: method,
        jsonData: jsonData,
        success: function (response) {
            if(response.status !== 200){
                deferred.reject();
            }
            var responseJson = Ext.util.JSON.decode(response.responseText);
            if(responseJson.success === false || responseJson.code !== 0) {
                deferred.reject();
            }
            deferred.resolve(responseJson.data);
        },
        failure: function (response) {
            if(response.responseText) {
                var responseJson = Ext.util.JSON.decode(response.responseText);
                deferred.reject(responseJson);
            }
            else {
                deferred.reject("An unknown error occurred while getting resource: " + resource);
            }
        }
    });

    return deferred.promise;
}