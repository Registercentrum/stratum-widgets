export function flattenCandidates(candidates, units) {
    var mapped = Ext.Array.map(candidates, function(item) {
        return {
            unitName: getUnitNameById(units, item.Screening.UnitId),
            screeningDate: new Date(item.Screening.DateConsidered),
            included: item.Included,
            subjectId: item.SubjectId,
            reason: item.ReasonNotIncluded,
            reasonDetail: item.ReasonNotIncludedDetail
        };
    });
    return mapped;
}

function getUnitNameById(units, unitId) {

    var match = Ext.Array.findBy(units, function(unit) {
        return unit.UnitID == unitId;
    });

    return match ? match.UnitName : "";
}
