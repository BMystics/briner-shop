// ============================================
// קטלוג חותמות גומי - רינדור דינמי
// ============================================
(function () {
  const WA_NUMBER = '972585833949';
  const waLink = (name, model) => {
    const msg = `שלום, אני מעוניין בחותמת "${name}"${model ? ` (דגם ${model})` : ''}. אשמח להצעת מחיר.`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const CATEGORIES = [
    {
      id: 'standard',
      name: 'חותמות קפיציות סטנדרטיות',
      desc: 'חותמות קלאסיות בגדלים שונים, מתאימות למשרד, לעסק ולשימוש יומיומי.',
      products: [
        { name: 'חותמת קפיצית מיני', model: '910 / P-10 / 4910', size: '8×25 מ"מ', desc: 'קטנה לנשיאה בכיס. עד 3 שורות טקסט.', img: 'https://static.wixstatic.com/media/c15646_6953eb8c78bc40e8b4ad56555446ca98~mv2.jpg' },
        { name: 'חותמת קפיצית רגילה', model: 'P-20 / 4911 / S-822', size: '13×37 מ"מ', desc: 'הדגם הפופולרי ביותר. עד 4 שורות טקסט.', img: 'https://static.wixstatic.com/media/c15646_2e98c94bc93d43c6a065ef8c85f26ff0~mv2.jpg' },
        { name: 'חותמת קפיצית גדולה', model: '912 / 4912 / P-30', size: '48×18 מ"מ', desc: 'לשימושים משרדיים, חתימות וכותרות.', img: 'https://static.wixstatic.com/media/c15646_89070187ed784b42b019910d05726e2f~mv2.jpg' },
        { name: 'חותמת קפיצית ענקית', model: 'P-40 / 4913 / 913', size: '22×55 מ"מ', desc: 'עד 7 שורות טקסט - לכותרות מורחבות.', img: 'https://static.wixstatic.com/media/c15646_25090bc666f6465db0edc460feeae7e9~mv2.jpg' },
        { name: 'חותמת קפיצית ג\'מבו', model: 'P-50', size: '28×68 מ"מ', desc: 'עד 9 שורות. לחתימה מקצועית מורחבת.', img: 'https://static.wixstatic.com/media/c15646_6469ae5ffecb43bcb8abfef6e5205616~mv2.jpg' },
        { name: 'סופר ג\'מבו', model: 'P-60', size: '73×25 מ"מ', desc: 'הדגם הגדול ביותר. עד 9 שורות.', img: 'https://static.wixstatic.com/media/c15646_54d6ce59abd74dcca9b619d937e6535a~mv2.jpg' },
      ],
    },
    {
      id: 'square',
      name: 'חותמות קפיציות ריבועיות',
      desc: 'מתאימות ללוגו, סימון צ\'קים, אישורים ותווים גרפיים.',
      products: [
        { name: 'ריבועית 12 מ"מ', model: '921', size: '12×12 מ"מ', desc: 'לוגו קומפקטי או סימון צ\'קים.', img: 'https://static.wixstatic.com/media/c15646_baffc511939b41218246a71c082db2c7~mv2.jpg' },
        { name: 'ריבועית 17 מ"מ', model: 'Q-17', size: '17×17 מ"מ', desc: 'גודל ביניים לחותמות לוגו.', img: 'https://static.wixstatic.com/media/c15646_905a8aa961db4ad8aa4f1cbfd1e2b738~mv2.jpg' },
        { name: 'ריבועית 20 מ"מ', model: '922', size: '19×19 מ"מ', desc: 'עד 4 שורות קצרות. פופולרי למשרד.', img: 'https://static.wixstatic.com/media/c15646_5fba4f7713ce400f88565de270bbc853~mv2.jpg' },
        { name: 'ריבועית 24 מ"מ', model: 'Q-24', size: '24×24 מ"מ', desc: 'גודל אידיאלי ללוגו עסקי.', img: 'https://static.wixstatic.com/media/c15646_fbf01f2773144256911ac3b6fef2914f~mv2.jpg' },
        { name: 'ריבועית 30 מ"מ', model: '930 / 4923', size: '30×30 מ"מ', desc: 'עד 6 שורות טקסט. לחותמת חברה.', img: 'https://static.wixstatic.com/media/c15646_bb3dea544fda4d0c87b5dcb946740ea6~mv2.jpg' },
        { name: 'ריבועית 40 מ"מ', model: '940 / 4924', size: '40×40 מ"מ', desc: 'גדולה. עד 6 שורות עם שטח לעיצוב.', img: 'https://static.wixstatic.com/media/c15646_418d1a9794ab49c7abb09e762d5426c9~mv2.jpg' },
      ],
    },
    {
      id: 'round',
      name: 'חותמות קפיציות עגולות',
      desc: 'חותמות חברה קלאסיות, אישורי איכות, סימון מסמכים רשמיים.',
      products: [
        { name: 'עגולה 12 מ"מ', model: 'Printer R12', size: 'קוטר 12 מ"מ', desc: 'הדגם הקטן ביותר, לסימון נקודתי.', img: 'https://static.wixstatic.com/media/c15646_4a7956a1480f47ce86ecdf700cbe444c~mv2.jpg' },
        { name: 'עגולה 17 מ"מ', model: 'Printer R17', size: 'קוטר 17 מ"מ', desc: 'גודל ביניים, רב-שימושי.', img: 'https://static.wixstatic.com/media/c15646_cbbd3742f2fc431a9f9ca9b47fc77481~mv2.jpg' },
        { name: 'עגולה 24 מ"מ', model: 'Printer R24', size: 'קוטר 24 מ"מ', desc: 'הגודל הקלאסי לחותמת חברה.', img: 'https://static.wixstatic.com/media/c15646_6d20d3ba451248be96f338e5561f33e4~mv2.jpg' },
        { name: 'עגולה 30 מ"מ', model: 'Printer R30', size: 'קוטר 30 מ"מ', desc: 'גודל מקובל לחותמת חברה רשמית.', img: 'https://static.wixstatic.com/media/c15646_67374b2afc0a4b45970e47f3ffae978c~mv2.jpg' },
        { name: 'עגולה 40 מ"מ', model: 'Printer R40', size: 'קוטר 40 מ"מ', desc: 'גדולה. שטח רב לעיצוב.', img: 'https://static.wixstatic.com/media/b4f3aa_038a3ea59dbd430c838a738063da2c9c~mv2.png' },
        { name: 'עגולה 45 מ"מ', model: 'Printer R45', size: 'קוטר 45 מ"מ', desc: 'לחותמות לוגו מורחבות.', img: 'https://static.wixstatic.com/media/c15646_0461960950b745d29826e226ac957671~mv2.jpg' },
        { name: 'עגולה 50 מ"מ', model: 'Printer R50', size: 'קוטר 50 מ"מ', desc: 'הגדולה ביותר. לחותמות רשמיות מורחבות.', img: 'https://static.wixstatic.com/media/c15646_de735bc9ff3b4daba8969b0d8b746419~mv2.jpg' },
        { name: 'אליפסה', model: 'Printer 3050', size: '50×30 מ"מ', desc: 'צורה אליפטית ייחודית לעיצוב מובחן.', img: 'https://static.wixstatic.com/media/c15646_42c7c34eb5da4feba1abc04de27836d7~mv2.jpg' },
      ],
    },
    {
      id: 'special-size',
      name: 'חותמות קפיציות בגודל מיוחד',
      desc: 'מידות שאינן סטנדרטיות - לפי דרישות עיצוב או שטח ייעודי.',
      products: [
        { name: 'חותמת צרה 50×10 מ"מ', model: '4917 / 9017', size: '50×10 מ"מ', desc: 'מידה צרה וארוכה לחותמות חתימה ייעודיות.', img: 'https://static.wixstatic.com/media/c15646_54db2d776c7740cda68dea45573b895e~mv2.jpg' },
        { name: 'חותמת צרה 70×10 מ"מ', model: '4916 / 9016', size: '70×10 מ"מ', desc: 'הארוכה והצרה ביותר בקטגוריה.', img: 'https://static.wixstatic.com/media/c15646_3f841f2cd8874f43b9cd4318cfc4ac71~mv2.jpg' },
      ],
    },
    {
      id: 'professional',
      name: 'חותמות מקצועיות Heavy Duty',
      desc: 'חותמות מסיביות לעבודה אינטנסיבית - בעלות ידית אחיזה ומבנה מחוזק.',
      products: [
        { name: 'HD לעבודה מאומצת', model: '4916 / 9016', size: '40×24 עד 64×49 מ"מ', desc: 'חותמת קפיצית מקצועית ומסיבית - Heavy Duty לעבודה מאומצת. בעלת ידית אחיזה.', img: 'https://static.wixstatic.com/media/c15646_9d335ebfed7842ca83271a34ac9a9287~mv2.jpg' },
        { name: 'HD ענקית', model: '3900', size: '55×106 מ"מ', desc: 'הדגם המקצועי הגדול ביותר. לשימוש תעשייתי.', img: 'https://static.wixstatic.com/media/c15646_9e5fbdfb15494b3e88d938019a9cdb8c~mv2.jpg' },
      ],
    },
    {
      id: 'special',
      name: 'חותמות מיוחדות',
      desc: 'פתרונות ייחודיים - מחזיק מפתחות, להרכבה עצמית, שני צבעים, חומרים מיוחדים ועוד.',
      products: [
        { name: 'מחזיק מפתחות', model: '', size: '8×25 מ"מ', desc: 'חותמת קומפקטית עם מכסה נשלף, כמחזיק מפתחות.', img: 'https://static.wixstatic.com/media/c15646_e22a78f501af449bbdda197dbab86850~mv2.jpg' },
        { name: 'חותמת כיס', model: '', size: '13×37 מ"מ', desc: 'אישית קלה לנשיאה. החתמה ביד אחת.', img: 'https://static.wixstatic.com/media/c15646_93041f29173042c69ab552ecc1451b05~mv2.jpg' },
        { name: 'חותמת להרכבה עצמית', model: '', size: '13×37 מ"מ', desc: '3 שורות, אותיות בגובה 4 מ"מ. להרכבה עצמית.', img: 'https://static.wixstatic.com/media/c15646_070523d7ef474d2fa3fadb021bb4c0aa~mv2.jpg' },
        { name: 'גדולה שני צבעים', model: '', size: '17.5×47 מ"מ', desc: 'אפשרות לשלב לוגו במספר צבעים.', img: 'https://static.wixstatic.com/media/c15646_118f4786b30143f08bd549f7c0979a2a~mv2.jpg' },
        { name: 'קופסת ניקל', model: '', size: '13×37 מ"מ', desc: 'גוף ניקל קומפקטי וקל. עיצוב חדשני.', img: 'https://static.wixstatic.com/media/c15646_be8a5e28595346f3be174a5c9d0411dc~mv2.jpg' },
        { name: 'סט אותיות טלוס', model: '', size: '—', desc: 'סט אותיות עברית/אנגלית/ספרות להחלפה.', img: 'https://static.wixstatic.com/media/c15646_698940845a984047b1fbade31954d148~mv2.jpg' },
        { name: 'פולימר קשה', model: '', size: '—', desc: 'מיועד להחתמה על חימר, סבון או קרמיקה.', img: 'https://static.wixstatic.com/media/c15646_c1e1175c643a4943a0bcc0414cf8b350~mv2.jpg' },
        { name: 'גומי טבעי', model: '', size: '—', desc: 'גומי טבעי עם דיו ייבוש מהיר.', img: 'https://static.wixstatic.com/media/c15646_91653247ee7a420db5cd3d3fb8f37dc8~mv2.jpg' },
        { name: 'חותמת לביצים', model: '', size: '—', desc: 'משטח ספוגי - להחתמה על משטחים עגולים.', img: 'https://static.wixstatic.com/media/b4f3aa_4f09987bb2884ef7a5b6c696ef1dcd5c~mv2.jpg' },
        { name: 'חותמת ידנית גדולה', model: '', size: 'לפי דרישה', desc: 'מיוצרת בעומק מיוחד עם בסיס ספוג להתאמת פני החותמת.', img: 'https://static.wixstatic.com/media/c15646_5adac4b23a1b421d8f4212d061f51f10~mv2.jpg' },
      ],
    },
  ];

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function renderProduct(p) {
    return `<div class="prod-card">
      <div class="prod-img-wrap">
        <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">
        ${p.model ? `<span class="prod-model-tag">${esc(p.model)}</span>` : ''}
      </div>
      <div class="prod-body">
        <div class="prod-name">${esc(p.name)}</div>
        <div class="prod-size">
          <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z M9 9v6 M15 9v6 M9 12h6"/></svg>
          ${esc(p.size)}
        </div>
        <div class="prod-desc">${esc(p.desc || '')}</div>
        <a href="${waLink(p.name, p.model)}" target="_blank" rel="noopener" class="btn-order">
          <svg viewBox="0 0 24 24"><path d="M17.6 6.32A8.78 8.78 0 0 0 12.05 4 8.79 8.79 0 0 0 4.4 17.13L4 21l3.96-1.04A8.79 8.79 0 0 0 20.83 12a8.74 8.74 0 0 0-3.23-5.68z"/></svg>
          להזמנה ב-WhatsApp
        </a>
      </div>
    </div>`;
  }

  function renderCategory(cat) {
    return `<section class="section-wrap" id="${cat.id}">
      <div class="section-head">
        <h2>${esc(cat.name)}</h2>
        <div class="count">${cat.products.length} דגמים</div>
      </div>
      <p class="section-desc">${esc(cat.desc)}</p>
      <div class="products-grid">
        ${cat.products.map(renderProduct).join('')}
      </div>
    </section>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('catalog').innerHTML = CATEGORIES.map(renderCategory).join('');
  });
})();
