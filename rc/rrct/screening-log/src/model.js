
export function define() {
    Ext.define("RRCT.ScreeningLog", {
        extend: "Ext.data.Model",
        fields: [ 
            { name: "unitName" }, 
            { name: "screeningDate" }, 
            {
                name: "included",
                convert: function(value) {
                    return value ? "Ja" : "Nej";
                }
            },
            { name: "subjectId" },
            { name: "reason" }
        ]
    });        
}
