export const STUDY_TITLE = "DUALITY";
export const STUDY_ERROR_TITLE = "FEL: " + STUDY_TITLE;
export const CONTINUE_WITH_SCREENING_QUESTION_TITLE = `Fråga från ${STUDY_TITLE}-studien:`;
export const CONTINUE_WITH_SCREENING_QUESTION = `Denna patient uppfyller inklusionkriterierna för ${STUDY_TITLE} med ` + 
    `randomisering mellan STANDARDCUP och DUBBELCUP vid Garden III-IV frakturer. Om patienten är en kandidat för ` +
    `helprotes kan du screena patienten för inkludering.Vill du gå vidare med screening nu?`;
export const UNKNOWN_ERROR = "Ett oväntat fel uppstod. Försök igen senare eller kontakta studieledningen!";
export const SCREENING_INFO = `Denna patient uppfyller inklusionkriterierna för ${STUDY_TITLE} med randomisering mellan STANDARDCUP och DUBBELCUP vid Garden III-IV frakturer. Besvara följande frågor endast om du vill försöka randomisera.`;
export const SCREENING_QUESTION_1 = "Är patienten redan behandlad för den aktuella höftfrakturen?";
export const SCREENING_QUESTION_2 = "Är patienten enligt er lokala rutin lämplig för helprotes?";
export const SCREENING_QUESTION_3 = "Kan både op med standardcup och med dubbelcup utföras på kliniken för aktuell patient?";
export const SCREENING_QUESTION_4 = "Har patienten givit informerat skriftligt samtycke till medverkan i studien?";
export const SCREENING_QUESTION_4_HELP_NOTE = 'Se <a href="https://sfr.registercentrum.se/forskning/duality/p/SklsPtj6S" target="_blank">denna länk</a> för skriftligt samtyckesformulär.';
export const SCREENING_QUESTION_4_DETAILS = "Vad är orsaken till att inget samtycke erhållits?";
export const SCREENING_FAIL_WARNING = "Svaren som angetts kommer leda till en screening fail.";
export const SCREENING_FAIL_QUESTION = "Svaren som angetts kommer leda till en screening fail. Randomisering kommer INTE att ske. Vill du fortsätta?";
export const SCREENING_FAILURE = "Kunde inte skriva till screeningloggen. Vänligen försök igen senare.";
export const BUTTON_CONTINUE = "Fortsätt";
export const BUTTON_CANCEL = "Avbryt";
export const SCREENING_ABORT_QUESTION = "Vill du avbryta screeningen? Du kan alltid återkomma senare.";
export const SCREENING_RANDOMIZATION_QUESTION = "Genom att fortsätta kommer patienten att randomiseras. Vill du fortsätta?";

export const RANDOMIZATION_FAILURE = "Ett fel uppstod vid randomisering. Försök igen senare eller kontakta studieledningen!";
export const RANDOMIZATION_INITIAL_STUDY_VARIABLES_FAILURE = "Patienten blev randomiserad men initiala studievariabler kunde inte sparas. Vänligen kontakta studieledningen.";
export const UPDATE_STUDY_DATA_FAILURE = `Patienten är sedan tidigare aktiv i ${STUDY_TITLE}-studien. Ett okänt fel uppstod när studievariabler skulle uppdateras. Vänligen kontakta studieledningen.`;
export const UPDATE_STUDY_DATE_INCONSISTENCY = `Aktuell patient är inkluderad i ${STUDY_TITLE}-studien. Den gjorda förändringen av data medför ` +
    "att patienten inte längre uppfyller inklusionsvillkoren för studien. Var vänlig kontakta " +
    "studiekoordinator Monica Sjöholm, Tel: 0704-25 00 43 email: monica.sjoholm@surgsci.uu.se";
export const UNIT_NOT_ACTIVE = `Denna enhet är inte aktiv i ${STUDY_TITLE}-studien, patienten kan därför inte ingå i studien. ` +
    "För mer information, kontakta studiekoordinator Monica Sjöholm, email: monica.sjoholm@surgsci.uu.se";
