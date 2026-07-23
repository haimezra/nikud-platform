#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מוסיף שדה 'מספר טלפון' חובה לטופס ההרשמה המהירה ב-index.html
(חל על שלושת המסלולים: ניסיון חינם, מנוי 299, והצטרפות עם קוד).

שימוש:
    python3 add_phone_to_signup.py index.html

הסקריפט:
  - יוצר גיבוי index.html.bak
  - מבצע 3 שינויים בדיוק
  - אם אחד מהם לא נמצא, לא כותב כלום ומדווח
"""
import sys
import shutil
import os

EDITS = [
    (
        "שדה הטלפון בטופס",
        '<input id="qsName" placeholder="שם מלא" required>',
        '<input id="qsName" placeholder="שם מלא" required>\n'
        '      <input id="qsPhone" type="tel" inputmode="tel" dir="ltr" placeholder="מספר טלפון" required>',
    ),
    (
        "קריאת הערך ב-submitQuickSignup",
        "  const name = document.getElementById('qsName').value\n",
        "  const name = document.getElementById('qsName').value\n"
        "  const phone = document.getElementById('qsPhone').value.trim()\n",
    ),
    (
        "שליחת הטלפון ל-signUp",
        "options: { data: { name, role, school_id: schoolId } }",
        "options: { data: { name, role, school_id: schoolId, phone } }",
    ),
]


def main():
    if len(sys.argv) < 2:
        print("שימוש: python3 add_phone_to_signup.py index.html")
        return 1

    path = sys.argv[1]
    if not os.path.isfile(path):
        print("לא נמצא קובץ: %s" % path)
        return 1

    with open(path, encoding="utf-8") as fh:
        text = fh.read()

    # שלב 1: בדיקה מקדימה - כל היעדים קיימים ומופיעים בדיוק פעם אחת
    problems = []
    for label, old, _new in EDITS:
        count = text.count(old)
        if count == 0:
            problems.append("[%s] היעד לא נמצא בקובץ" % label)
        elif count > 1:
            problems.append("[%s] היעד מופיע %d פעמים (צפוי 1)" % (label, count))

    if "qsPhone" in text:
        problems.append("נראה שהשדה qsPhone כבר קיים - הסקריפט כנראה כבר רץ")

    if problems:
        print("לא בוצע שום שינוי. בעיות שנמצאו:")
        for p in problems:
            print("  - " + p)
        return 1

    # שלב 2: ביצוע השינויים
    for _label, old, new in EDITS:
        text = text.replace(old, new, 1)

    # שלב 3: גיבוי ואז כתיבה
    shutil.copy2(path, path + ".bak")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)

    print("בוצע בהצלחה.")
    print("  גיבוי נשמר ב: %s.bak" % path)
    for label, _old, _new in EDITS:
        print("  ✓ %s" % label)
    return 0


if __name__ == "__main__":
    sys.exit(main())
