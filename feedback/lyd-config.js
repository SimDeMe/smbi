// Offentlige indstillinger for lydfeedback. Så længe modtager er tom, vises ingen
// optageknap. Adressen er offentlig; det er afprøvningskoden, der giver adgang.
export const LYD_CONFIG = {
  modtager: '',          // Apps Script-webappens /exec-adresse, se feedback/LYD.md
  opbevaringDage: 90,    // OPBEVARING_DAGE i lyd-apps-script.gs plus 30 i papirkurven
};
