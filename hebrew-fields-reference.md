# Hebrew Field Reference (UPDATED from actual Google Sheets)

## עדי - Column Mapping
| Sheet Column | DB Column | Type | Editable |
|-------------|-----------|------|----------|
| תאריך | leads.created_at | Date DD/MM/YYYY | No |
| שם לקוח | customers.full_name | Text | No |
| תעודת זהות | customers.identity_number | Text | No |
| מקור ליד | partners.name | Text | No |
| ליד לפניקס | leads.phoenix_agent | Free Text | Yes |
| ליד פנימי | leads.internal_lead | Boolean (/) | Yes |
| ליד הראל | leads.harel_agent | Free Text | Yes |
| מינוי סוכן | leads.agent_appointment_amount | Number ₪ | Yes |
| סכום סגירה | leads.closing_amount + closing_status | Mixed | Yes |

### Adi's Free Text Values (ליד לפניקס)
עבר לאריה, עבר לשיראל, עבר ליקיר, עבר ללירי, /

### Adi's Free Text Values (ליד הראל)
עבר ללינוי, עבר לרפאל, עבר לליאור, עבר לטל, עבר לסיון, עבר לבר, עבר ללוי, עבר לאוריאל, עבר ללירן, /

### Adi's Closing Values (סכום סגירה)
Numbers (77, 90, 120, 245...), לא נסגר, לא עונה, ?, חזרה יום ראשון, חזרה יום שני, לחזרה יום חמישי

---

## לידור - Column Mapping
| Sheet Column | DB Column | Type | Editable |
|-------------|-----------|------|----------|
| תאריך | leads.created_at | Date | No |
| שם | customers.full_name | Text | No |
| ת.ז | customers.identity_number | Text | No |
| כולל הר ביטוח? | leads.has_har_bituach | Free Text | Yes |
| מקור | partners.name | Text | No |
| מטפל | leads.assigned_agent | Text/Select | Yes |
| תאריך פגישה | leads.meeting_scheduled_date | Date | Yes |
| שעה | leads.meeting_time | Text HH:MM | Yes |
| הליד עבר? | leads.lead_passed | Boolean | Yes |
| נסגרה עסקה | leads.deal_closed | Free Text | Yes |

### Lidor's Agent Values (מטפל)
גאמביז, נופר, רמי

### Lidor's Har Bituach Values (כולל הר ביטוח?)
כן, לא, לא עולה, תעדכן בתז, חתם לא עולה, לבדוק שחתם, לקוח שלנו, לעלות שוב, יעדכן בתז

### Lidor's Deal Values (נסגרה עסקה)
כן, לא, במעקב, הכחיש וטען שיש סוכנת, כל הכספים מעוקלים, אין מענה, לא מעוניין, יש לה הלוואה בפנסיה לא ניתן לנייד, מכחיש

### Lidor's Source Companies (from side table)
מרוויחים (42 leads), אולג'ובס (4), פתרון (65), הייטקס (4), קו זכות (3), החזר טק (6), פיבו (11), מחזירים

---

## אסף - Column Mapping
| Sheet Column | DB Column | Type | Editable |
|-------------|-----------|------|----------|
| תאריך | leads.created_at | Date | No |
| שם לקוח | customers.full_name | Text | No |
| תעודת זהות | customers.identity_number | Text | No |
| נייד | customers.mobile | Text | Yes |
| מקור הגעה | source context | Text | No |
| סכום כולל | leads.total_amount | Number | Yes |
| סטטוס | leads.main_status | Select | Yes |
| הערות | leads.notes | Text multiline | Yes |
| פרמיה פנסיה | leads.pension_premium | Number | Yes |
| צבירה פנסיה | leads.pension_accumulation | Number | Yes |
| צבירה גמל השתלמות | leads.gemel_hishtalmut_accumulation | Number | Yes |

### Asaf's Status Values (THE REAL ONES - use these!)
```javascript
[
  { label: "נויד", value: "נויד" },
  { label: "מעקב", value: "מעקב" },
  { label: "ביקש מועד אחר", value: "ביקש מועד אחר" },
  { label: "לא רלוונטי", value: "לא רלוונטי" },
  { label: "לא מעוניין", value: "לא מעוניין" },
  { label: "אין מענה", value: "אין מענה" },
  { label: "סוכן", value: "סוכן" },
  { label: "ניתנה הצעה", value: "ניתנה הצעה" },
  { label: "לא ניתן לשפר", value: "לא ניתן לשפר" },
  { label: "בתהליך הכנת מסמכים", value: "בתהליך הכנת מסמכים" }
]
```

### Asaf's Source Values (מקור הגעה)
תיאום פגישות לידור, תיק קיים, בדיקת מסלקה, תיק קייים, הצטרף לביטוח דרך הראל סטנדרט, תיק קיים / אמיר

---

## Row Coloring Reference

### Adi
```javascript
{{
  currentRow.סכום_סגירה && !isNaN(currentRow.סכום_סגירה) && Number(currentRow.סכום_סגירה) > 0 ? '#C8E6C9' :
  (currentRow.סטטוס_סגירה || '').includes('לא נסגר') ? '#FFCDD2' :
  (currentRow.סטטוס_סגירה || '').includes('לא עונה') ? '#FFE0B2' :
  currentRow.ליד_לפניקס === '/' && currentRow.ליד_הראל === '/' ? '#F5F5F5' :
  '#FFFFFF'
}}
```

### Lidor
```javascript
{{
  currentRow.נסגרה_עסקה === 'כן' ? '#C8E6C9' :
  currentRow.נסגרה_עסקה === 'לא' ? '#FFCDD2' :
  currentRow.הליד_עבר === true ? '#E3F2FD' :
  '#FFFFFF'
}}
```

### Asaf
```javascript
{{
  currentRow.סטטוס === 'נויד' ? '#C8E6C9' :
  currentRow.סטטוס === 'מעקב' || currentRow.סטטוס === 'ביקש מועד אחר' ? '#FFF9C4' :
  currentRow.סטטוס === 'ניתנה הצעה' || currentRow.סטטוס === 'בתהליך הכנת מסמכים' ? '#E3F2FD' :
  currentRow.סטטוס === 'אין מענה' ? '#FFE0B2' :
  currentRow.סטטוס === 'לא מעוניין' || currentRow.סטטוס === 'לא רלוונטי' || currentRow.סטטוס === 'לא ניתן לשפר' ? '#FFCDD2' :
  currentRow.סטטוס === 'סוכן' ? '#F5F5F5' :
  '#FFFFFF'
}}
```
