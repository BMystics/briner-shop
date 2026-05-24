# Briner Shop - חנות פילמנטים 3D

חנות אונליין עבור חברת ברינר למכירת פילמנטים להדפסת 3D.

## מבנה הפרויקט

```
.
├── package.json              # תלויות והגדרות הפרויקט
├── .env                      # משתני סביבה (לא ב-git!)
├── .env.example              # תבנית למשתני סביבה
├── public/                   # קבצים סטטיים שמוגשים לדפדפן
│   ├── index.html            # דף הבית (היה briner-redesign.html)
│   ├── filaments.html        # קטלוג מוצרים (היה briner-filaments.html)
│   ├── css/                  # סטיילים נוספים
│   └── js/                   # JavaScript של הצד-לקוח
└── server/                   # קוד השרת
    ├── index.js              # נקודת הכניסה - מפעיל את Express
    ├── config.js             # טוען משתני סביבה
    ├── db/                   # חיבור Supabase + סכמת DB
    ├── routes/               # ה-API: products, orders, payments, admin
    ├── services/             # שירותים: payplus, email
    └── middleware/           # auth ועוד
```

## הפעלה ראשונה

### שלב 1: התקנת Node.js
ודא שמותקן Node.js גרסה 18 ומעלה. בדוק עם:
```powershell
node --version
```
אם לא מותקן: https://nodejs.org/he

### שלב 2: התקנת תלויות
פתח PowerShell בתיקיית הפרויקט והרץ:
```powershell
npm install
```
זה יוריד את כל הספריות הנדרשות לתיקיית `node_modules/`.

### שלב 3: הפעלת השרת
**מצב פיתוח** (השרת ירענן את עצמו אוטומטית אחרי כל שינוי בקוד):
```powershell
npm run dev
```

**מצב רגיל:**
```powershell
npm start
```

### שלב 4: גישה לאתר
פתח בדפדפן: http://localhost:3000

- דף הבית: http://localhost:3000/
- קטלוג: http://localhost:3000/filaments
- בדיקת שרת: http://localhost:3000/api/health

## משתני סביבה (.env)

הקובץ `.env` מכיל מפתחות וסיסמאות. **לעולם אל תעלה אותו ל-git**.
כרגע הוא מכיל placeholders. כשתפתח חשבונות, החלף את הערכים:

| משתנה | מה זה |
|-------|-------|
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` | מסד נתונים (https://supabase.com) |
| `PAYPLUS_API_KEY` + `PAYPLUS_SECRET_KEY` | סליקת אשראי (https://www.payplus.co.il) |
| `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` | שליחת מיילים (למשל Gmail App Password) |
| `ADMIN_PASSWORD` | סיסמת כניסה לפאנל ניהול |

## איך זה עובד? (מילון מושגים מהיר)

- **Express** — ספריית Node.js לבניית שרתי web. כותבים `app.get('/path', handler)` והוא יודע להגיב.
- **Middleware** — פונקציות שרצות לפני ה-handlers של הבקשות (לוגים, אבטחה, parsing).
- **API** — נתיבים שמחזירים JSON (לא HTML). כל הנתיבים שלנו תחת `/api/`.
- **Static files** — קבצים שמוגשים כמו שהם (HTML/CSS/תמונות) מתוך תיקיית `public/`.
- **.env** — קובץ עם מפתחות סודיים. הקוד קורא ממנו דרך `process.env.NAME`.
- **ES Modules** — תחביר `import/export` (מודרני). הופעל ע"י `"type": "module"` ב-package.json.
