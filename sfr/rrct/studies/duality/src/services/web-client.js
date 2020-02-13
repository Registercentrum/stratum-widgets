import * as server from "../models/server";

export function get(resource) {
    return new Ext.Promise(function (resolve, reject) {
        Ext.Ajax.request({
            url: server.getBaseUrl() + resource,
            success: function (response) {
                if(response.status > 399 || !response.responseText) {
                    reject();
                }
                var responseJson = Ext.util.JSON.decode(response.responseText);
                if(responseJson.success === false || responseJson.code !== 0) {
                    reject();
                }
                resolve(responseJson.data);
            },
            failure: function (response) {
                if(response.responseText) {
                    var responseJson = Ext.util.JSON.decode(response.responseText);
                    reject(responseJson);
                }
                else {
                    reject("An unknown error occurred while getting resource: " + resource);
                }
            }
        });
    });
}
