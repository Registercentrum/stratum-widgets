export function get(data) {
    return Ext.create("Ext.data.Store", {
        model: "RRCT.ScreeningLog",
        sorters: { property: 'screeningDate', direction: 'DESC' },
        data: data
    });        
}
