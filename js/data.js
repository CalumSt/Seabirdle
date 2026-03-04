// js/data.js
// Game constants only. Bird data lives in birds_list.json.

const MAX_G    = 6;
const MAX_P    = 6;
const BLUR_SEQ = [32, 26, 19, 13, 7, 3, 0];
const XC_BASE  = "https://xeno-canto.org/api/3/recordings";

// Populated at boot() from birds_list.json
let BIRDS     = [];
let ALL_NAMES = [];