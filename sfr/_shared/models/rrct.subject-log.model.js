export function define() {
    Ext.define("RRCT.SubjectLogEntry", {
        extend: "Ext.data.Model",
        fields: [ 
            { name: "SubjectKey" }, 
            {
                name: "DateConsidered",
                convert: function(value, record) {
                    if(!record.get("Screening")) return "";
                    return record.get("Screening").DateConsidered;
                }
            }, 
            { name: "SubjectId" }, 
            {
                name: "Withdrawn",
                convert: function(value) {
                    return value ? "Ja" : "Nej";
                }
            }, 
            {
                name: "WithdrawalDateTime", 
                convert: function(value, record) {
                    if(!record.get("WithdrawalDetails")) return "";
                    return record.get("WithdrawalDetails").WithdrawalDateTime;
                }
            }
        ]
    });        
}
