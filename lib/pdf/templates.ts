// lib/pdf/templates.ts - HTML templates for PDF rendering

import { GeneratedCourse } from './types'

/**
 * Generate HTML for PDF rendering
 * Based on avenqor-pdf-rendering-map.v1.json
 */
export function generateCourseHtml(course: GeneratedCourse, coverImagePath: string, diagramPaths: Record<string, string>, isArabic: boolean = false): string {
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'

  return `<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${course.cover.title}</title>
  <style>
    ${getPdfStyles(isArabic)}
  </style>
</head>
<body>
  ${renderCover(course, coverImagePath, isArabic)}
  ${renderLegalNotice(course, isArabic)}
  ${renderHowToUse(course, isArabic)}
  ${renderTOC(course, isArabic)}
  ${renderPreface(course, isArabic)}
  ${renderModules(course, diagramPaths, isArabic)}
  ${renderOnePageSummary(course, isArabic)}
  ${renderGlossary(course, isArabic)}
  ${renderQuiz(course, isArabic)}
</body>
</html>`
}

/**
 * PDF Styles based on rendering map
 */
function getPdfStyles(isArabic: boolean): string {
  return `
    @page {
      size: A4 portrait;
      margin: 18mm 16mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .section-header-logo {
      max-width: 28mm;
      max-height: 11mm;
      width: auto;
      height: auto;
      margin-bottom: 3mm;
      display: block;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #1a1a1a;
      direction: ${isArabic ? 'rtl' : 'ltr'};
      text-align: ${isArabic ? 'right' : 'left'};
    }

    h1 {
      font-size: 22pt;
      line-height: 1.2;
      font-weight: 700;
      margin-bottom: 8mm;
      page-break-after: avoid;
    }

    h2 {
      font-size: 16pt;
      line-height: 1.2;
      font-weight: 600;
      margin-top: 6mm;
      margin-bottom: 4mm;
      page-break-after: avoid;
    }

    h3 {
      font-size: 13pt;
      line-height: 1.2;
      font-weight: 600;
      margin-top: 4mm;
      margin-bottom: 3mm;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 2mm;
      text-align: justify;
    }

    ul, ol {
      margin: 2mm 0 2mm ${isArabic ? '0' : '6mm'};
      padding-${isArabic ? 'right' : 'left'}: 6mm;
    }

    li {
      margin-bottom: 1mm;
    }

    .cover-page {
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      position: relative;
    }

    .cover-logo {
      position: absolute;
      top: 10mm;
      ${isArabic ? 'right' : 'left'}: 16mm;
      max-width: 65mm;
      max-height: 22mm;
      width: auto;
      height: auto;
      z-index: 10;
    }

    .cover-image {
      max-width: 100%;
      max-height: 150mm;
      margin-bottom: 6mm;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 4mm;
    }

    .cover-subtitle {
      font-size: 16pt;
      color: #666;
      margin-bottom: 4mm;
    }

    .cover-tagline {
      font-size: 12pt;
      color: #888;
      margin-bottom: 6mm;
    }

    .cover-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4mm;
      justify-content: center;
      margin-top: 6mm;
    }

    .chip {
      background: #f0f0f0;
      padding: 2mm 6mm;
      border-radius: 12pt;
      font-size: 9pt;
    }

    .section {
      page-break-before: always;
      margin-bottom: 4mm;
    }

    .section:first-child {
      page-break-before: auto;
    }

    .risk-box {
      background: #fff3cd;
      border-left: 4pt solid #ffc107;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .risk-box h3 {
      color: #856404;
      margin-top: 0;
    }

    .example-card {
      background: #e7f3ff;
      border-left: 4pt solid #2196f3;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .example-card::before {
      content: "Hypothetical example";
      display: block;
      font-weight: 600;
      font-size: 9pt;
      color: #1976d2;
      margin-bottom: 2mm;
    }

    .definition-card {
      background: #f5f5f5;
      border-left: 4pt solid #757575;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .checklist-block {
      background: #f9f9f9;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .exercise-block {
      background: #e8f5e9;
      border-left: 4pt solid #4caf50;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .key-takeaways {
      background: #fff9e6;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .diagram {
      text-align: center;
      margin: 6mm 0;
      page-break-inside: avoid;
    }

    .diagram img {
      max-width: 100%;
      height: auto;
    }

    .diagram-title {
      font-weight: 600;
      margin-bottom: 2mm;
    }

    .quiz-question {
      margin-bottom: 6mm;
      page-break-inside: avoid;
    }

    .quiz-choices {
      list-style: none;
      margin-${isArabic ? 'right' : 'left'}: 4mm;
    }

    .quiz-choices li {
      margin-bottom: 2mm;
    }

    .quiz-explanation {
      background: #e8f5e9;
      padding: 3mm;
      margin-top: 2mm;
      border-radius: 2pt;
      font-size: 9pt;
    }

    .glossary-term {
      font-weight: 600;
      color: #1976d2;
    }

    .module-header {
      border-bottom: 2pt solid #333;
      padding-bottom: 2mm;
      margin-bottom: 4mm;
    }

    .lesson {
      margin-bottom: 6mm;
    }

    .content-block {
      margin-bottom: 3mm;
    }

    .two-col-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      background: #f5f5f5;
      padding: 4mm;
      margin: 4mm 0;
      border-radius: 2pt;
    }

    .two-col-card .myth {
      border-right: 1pt solid #ccc;
      padding-right: 4mm;
    }

    .two-col-card .reality {
      padding-left: 4mm;
    }

    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  `
}

function renderCover(course: GeneratedCourse, coverImagePath: string, isArabic: boolean): string {
  return `
    <div class="cover-page">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="cover-logo" />
      <img src="${coverImagePath}" alt="${course.cover.image_generation.alt_text}" class="cover-image" />
      <h1 class="cover-title">${escapeHtml(course.cover.title)}</h1>
      <h2 class="cover-subtitle">${escapeHtml(course.cover.subtitle)}</h2>
      <p class="cover-tagline">${escapeHtml(course.cover.tagline)}</p>
      <div class="cover-chips">
        ${course.cover.chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')}
      </div>
    </div>
  `
}

function renderLegalNotice(course: GeneratedCourse, isArabic: boolean): string {
  return `
    <div class="section" id="legal-notice">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${escapeHtml(course.legal_notice.title)}</h1>
      <ul>
        ${course.legal_notice.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}
      </ul>
      <h3>${isArabic ? 'هذا ليس مناسباً لـ' : 'Who This Is Not For'}</h3>
      <ul>
        ${course.legal_notice.who_this_is_not_for.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>
  `
}

function renderHowToUse(course: GeneratedCourse, isArabic: boolean): string {
  return `
    <div class="section" id="how-to-use">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${escapeHtml(course.how_to_use.title)}</h1>
      <h3>${isArabic ? 'الوتيرة الموصى بها' : 'Recommended Pace'}</h3>
      <ul>
        ${course.how_to_use.recommended_pace.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <h3>${isArabic ? 'التعليمات' : 'Instructions'}</h3>
      <ul>
        ${course.how_to_use.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <div class="checklist-block">
        <p><strong>${escapeHtml(course.how_to_use.study_tools.print_friendly_note)}</strong></p>
        <p>${escapeHtml(course.how_to_use.study_tools.journal_suggestion)}</p>
        <p>${escapeHtml(course.how_to_use.study_tools.review_schedule)}</p>
      </div>
    </div>
  `
}

function renderTOC(course: GeneratedCourse, isArabic: boolean): string {
  // TOC will be populated by two-pass rendering
  return `
    <div class="section" id="toc">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${escapeHtml(course.toc.title)}</h1>
      <p>${escapeHtml(course.toc.entries_note)}</p>
      <ul>
        ${course.toc.entries.map((entry) => {
          const children = entry.children
            ? entry.children.map((child) => `<li style="margin-${isArabic ? 'right' : 'left'}: 8mm;"><a href="#${child.anchor_id}">${escapeHtml(child.title)}</a></li>`).join('')
            : ''
          return `<li><a href="#${entry.anchor_id}">${escapeHtml(entry.title)}</a>${children ? `<ul>${children}</ul>` : ''}</li>`
        }).join('')}
      </ul>
    </div>
  `
}

function renderPreface(course: GeneratedCourse, isArabic: boolean): string {
  return `
    <div class="section" id="preface">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${escapeHtml(course.preface.title)}</h1>
      <h3>${isArabic ? 'لمن هذا الكورس' : 'Who This Is For'}</h3>
      <ul>
        ${course.preface.who_this_is_for.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <h3>${isArabic ? 'ماذا ستتعلم' : 'What You Will Learn'}</h3>
      <ul>
        ${course.preface.what_you_will_learn.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <h3>${isArabic ? 'ما لن يفعله هذا الكورس' : 'What This Course Will Not Do'}</h3>
      <ul>
        ${course.preface.what_this_course_will_not_do.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <h3>${isArabic ? 'المتطلبات المسبقة' : 'Prerequisites'}</h3>
      <ul>
        ${course.preface.prerequisites.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>
  `
}

function renderModules(course: GeneratedCourse, diagramPaths: Record<string, string>, isArabic: boolean): string {
  let html = ''
  
  for (const courseModule of course.modules) {
    html += `
      <div class="section" id="${courseModule.anchor_id}">
        <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
        <div class="module-header">
          <h1>${escapeHtml(courseModule.title)}</h1>
          <p><strong>${isArabic ? 'الهدف' : 'Goal'}:</strong> ${escapeHtml(courseModule.goal)}</p>
        </div>
    `

    // Render lessons
    for (const lesson of courseModule.lessons) {
      html += `
        <div class="lesson" id="${lesson.anchor_id}">
          <h2>${escapeHtml(lesson.title)}</h2>
      `

      // Render content blocks
      for (const block of lesson.content_blocks) {
        html += renderContentBlock(block, isArabic)
      }

      html += `</div>`
    }

    // Insert diagrams after all lessons in the module (if diagram.insert_after_anchor_id matches courseModule.anchor_id)
    for (const diagram of course.diagrams) {
      if (diagram.insert_after_anchor_id === courseModule.anchor_id && diagramPaths[diagram.diagram_id]) {
        html += `
          <div class="diagram" id="${diagram.diagram_id}">
            <div class="diagram-title">${escapeHtml(diagram.title)}</div>
            <img src="${diagramPaths[diagram.diagram_id]}" alt="${escapeHtml(diagram.what_it_shows)}" />
            <p>${escapeHtml(diagram.what_it_shows)}</p>
          </div>
        `
      }
    }

    // Render checklist
    html += `
      <div class="checklist-block">
        <h3>${escapeHtml(courseModule.checklist.title)}</h3>
        <ul>
          ${courseModule.checklist.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>
    `

    // Render exercise
    html += `
      <div class="exercise-block">
        <h3>${escapeHtml(courseModule.exercise.title)}</h3>
        <p><strong>${isArabic ? 'الغرض' : 'Purpose'}:</strong> ${escapeHtml(courseModule.exercise.purpose)}</p>
        <ol>
          ${courseModule.exercise.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
        <p><strong>${isArabic ? 'المخرجات المتوقعة' : 'Expected Output'}:</strong> ${escapeHtml(courseModule.exercise.expected_output)}</p>
      </div>
    `

    // Render risk box
    html += `
      <div class="risk-box">
        <h3>${escapeHtml(courseModule.risk_box.title)}</h3>
        <ul>
          ${courseModule.risk_box.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
        </ul>
      </div>
    `

    // Render module summary
    html += `
      <div class="key-takeaways">
        <h3>${isArabic ? 'النقاط الرئيسية' : 'Key Takeaways'}</h3>
        <ul>
          ${courseModule.module_summary.key_takeaways.map((takeaway) => `<li>${escapeHtml(takeaway)}</li>`).join('')}
        </ul>
      </div>
    `

    html += `</div>`
  }

  return html
}

function renderContentBlock(block: { type: string; text: string }, isArabic: boolean): string {
  switch (block.type) {
    case 'paragraph':
      return `<div class="content-block"><p>${escapeHtml(block.text)}</p></div>`
    
    case 'bullets':
      const bullets = block.text.split('\n').filter(line => line.trim())
      return `<div class="content-block"><ul>${bullets.map(bullet => `<li>${escapeHtml(bullet.replace(/^[-•]\s*/, ''))}</li>`).join('')}</ul></div>`
    
    case 'example':
      return `<div class="example-card"><p>${escapeHtml(block.text)}</p></div>`
    
    case 'definition':
      return `<div class="definition-card"><p>${escapeHtml(block.text)}</p></div>`
    
    case 'myth_vs_reality':
      const parts = block.text.split(/Reality:/i)
      if (parts.length === 2) {
        return `
          <div class="two-col-card">
            <div class="myth">
              <strong>${isArabic ? 'الأسطورة' : 'Myth'}</strong>
              <p>${escapeHtml(parts[0].trim())}</p>
            </div>
            <div class="reality">
              <strong>${isArabic ? 'الواقع' : 'Reality'}</strong>
              <p>${escapeHtml(parts[1].trim())}</p>
            </div>
          </div>
        `
      }
      return `<div class="two-col-card"><p>${escapeHtml(block.text)}</p></div>`
    
    default:
      return `<div class="content-block"><p>${escapeHtml(block.text)}</p></div>`
  }
}

function renderOnePageSummary(course: GeneratedCourse, isArabic: boolean): string {
  return `
    <div class="section" id="one_page_summary">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${escapeHtml(course.one_page_summary.title)}</h1>
      ${course.one_page_summary.sections.map((section) => `
        <h3>${escapeHtml(section.heading)}</h3>
        <ul>
          ${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}
        </ul>
      `).join('')}
      <p><em>${escapeHtml(course.one_page_summary.print_note)}</em></p>
    </div>
  `
}

function renderGlossary(course: GeneratedCourse, isArabic: boolean): string {
  return `
    <div class="section" id="glossary">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${isArabic ? 'المسرد' : 'Glossary'}</h1>
      ${course.glossary.map((item) => `
        <div class="definition-card">
          <p><span class="glossary-term">${escapeHtml(item.term)}</span></p>
          <p>${escapeHtml(item.plain_definition)}</p>
          <p><em>${escapeHtml(item.why_it_matters)}</em></p>
        </div>
      `).join('')}
    </div>
  `
}

function renderQuiz(course: GeneratedCourse, isArabic: boolean): string {
  return `
    <div class="section" id="quiz">
      <img src="/avenqor.webp" alt="Cur Nova Logo" class="section-header-logo" />
      <h1>${escapeHtml(course.quiz.title)}</h1>
      ${course.quiz.questions.map((q, index) => `
        <div class="quiz-question">
          <p><strong>${index + 1}. ${escapeHtml(q.q)}</strong></p>
          <ul class="quiz-choices">
            ${q.choices.map((choice, choiceIndex) => `
              <li>${String.fromCharCode(65 + choiceIndex)}. ${escapeHtml(choice)}${choiceIndex === q.correct_choice_index ? ' ✓' : ''}</li>
            `).join('')}
          </ul>
          <div class="quiz-explanation">
            <strong>${isArabic ? 'شرح' : 'Explanation'}:</strong> ${escapeHtml(q.explanation)}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

