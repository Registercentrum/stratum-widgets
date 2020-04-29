export function getRegisterStore(data) {
    return Ext.create('Ext.data.Store', {
        fields: [
            'RegisterID',
            'RegisterName',
            'ShortName',
        ],
        data: data
    });        
}

export function getVariableStore(data) {
    return Ext.create('Ext.data.Store', {
        fields: [
            'ColumnName',
            'Description',
            'PrefixText'
        ],
        data: data
    });        
}