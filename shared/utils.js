// ============================================================
//  shared/utils.js — פונקציות עזר משותפות לכל האתרים
// ============================================================

/**
 * מחזיר הגדרות Chart.js סטנדרטיות.
 * כל אתר מעביר את theme שלו (אובייקט עם צבעים).
 *
 * @param {Array}  datasets  - מערך datasets של Chart.js
 * @param {Object} theme     - { gridColor, tickColor, tooltipBg, tooltipTitle, tooltipBody, tooltipBorder, fontFamily }
 */
export function getChartConfig(datasets, theme = {}) {
    const {
        gridColor      = "#333",
        tickColor      = "#aaa",
        tooltipBg      = "rgba(26,26,26,0.9)",
        tooltipTitle   = "#00ff88",
        tooltipBody    = "#fff",
        tooltipBorder  = "#444",
        fontFamily     = "inherit",
        pointLabel     = 'נק"ל'
    } = theme;

    return {
        type: "line",
        data: { datasets },
        options: {
            responsive: true,
            interaction: { mode: "index", intersect: false },
            elements: {
                point: { radius: 0, hoverRadius: 6 },
                line:  { tension: 0.4 }
            },
            plugins: {
                legend: { labels: { color: tickColor, font: { family: fontFamily } } },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipTitle,
                    bodyColor: tooltipBody,
                    borderColor: tooltipBorder,
                    borderWidth: 1,
                    callbacks: {
                        title: (c) => new Date(c[0].parsed.x).toLocaleString("he-IL") + " GMT+2",
                        label: (c) => ` ${c.dataset.label}: ${c.parsed.y} ${pointLabel}`
                    }
                }
            },
            scales: {
                x: {
                    type: "time",
                    time: { unit: "day", displayFormats: { day: "d/M" } },
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { family: fontFamily } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { family: fontFamily } }
                }
            }
        }
    };
}

/**
 * מסנן מערך היסטוריה לפי טווח זמן
 * @param {Array}  data      - מערך אובייקטים עם שדה t (milliseconds)
 * @param {string} rangeCode - '1d' | '5d' | '1mo' | '6mo' | 'max'
 */
export function filterByTime(data, rangeCode) {
    if (rangeCode === "max") return data;
    const durations = { "1d": 864e5, "5d": 432e6, "1mo": 2592e6, "6mo": 15552e6 };
    const cutoff = Date.now() - (durations[rangeCode] || 0);
    return data.filter(item => item.t >= cutoff);
}

/**
 * מפרמט timestamp של פיירבייס לתאריך בעברית
 * @param {Timestamp} ts - Firestore Timestamp
 * @returns {string}
 */
export function formatDate(ts) {
    if (!ts) return "";
    return new Date(ts.toDate()).toLocaleDateString("he-IL");
}

/**
 * מוסיף rich-text לטקסט-אריה
 * @param {string} fieldId - id של ה-textarea
 * @param {string} tag     - תגית HTML (b / i / u)
 */
export function wrapSelection(fieldId, tag) {
    const area = document.getElementById(fieldId);
    const { selectionStart: s, selectionEnd: e, value } = area;
    area.value = value.slice(0, s) + `<${tag}>` + value.slice(s, e) + `</${tag}>` + value.slice(e);
}

/**
 * מוסיף קישור לטקסט-אריה
 * @param {string} fieldId - id של ה-textarea
 */
export function insertLink(fieldId) {
    const url = prompt("הכנס כתובת URL:");
    if (url) document.getElementById(fieldId).value += `<a href="${url}" target="_blank">קישור</a>`;
}
