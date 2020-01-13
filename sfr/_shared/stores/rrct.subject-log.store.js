export function get(data) {
    return Ext.create("Ext.data.Store", {
        model: "RRCT.SubjectLogEntry",
        sorters: { property: 'DateConsidered', direction: 'DESC' },
        data: data
    });        
}
