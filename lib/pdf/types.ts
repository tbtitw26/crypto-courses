// lib/pdf/types.ts - Type definitions for PDF course generation

/**
 * Input JSON structure for course generation
 * Based on avenqor-request-ready-course-trading-foundations.json
 */
export interface CourseGenerationInput {
  course_title: string
  short_description: string
  target_audience: string[]
  markets_covered: string[]
  must_cover_topics: string[]
  deliverable_requirements?: string[]
  quality_bar?: string
  intended_pages_range?: string
  level?: 'Beginner' | 'Intermediate' | 'Advanced'
}

/**
 * Generated course structure (from OpenAI)
 * Based on JSON schema from avenqor-request-ready-course-trading-foundations.json
 */
export interface GeneratedCourse {
  meta: {
    course_id: string
    brand: 'Cur Nova'
    domain: 'cur-nova.com'
    language: 'EN' | 'AR'
    created_at_iso: string
    content_scope: {
      level: string
      market_scope: string[]
      intended_pages_range: string
    }
    education_only_notice: {
      title: string
      bullets: string[]
    }
  }
  cover: {
    title: string
    subtitle: string
    tagline: string
    chips: string[]
    image_generation: {
      image_prompt: string
      negative_prompt: string
      alt_text: string
      style_notes: string
      suggested_format: {
        aspect_ratio: '3:4' | '4:5'
        suggested_size_px: string
      }
    }
    layout_notes: string
  }
  legal_notice: {
    title: string
    bullets: string[]
    who_this_is_not_for: string[]
  }
  how_to_use: {
    title: string
    recommended_pace: string[]
    instructions: string[]
    study_tools: {
      print_friendly_note: string
      journal_suggestion: string
      review_schedule: string
    }
  }
  toc: {
    title: string
    entries_note: string
    entries: Array<{
      title: string
      anchor_id: string
      type: 'section' | 'module' | 'lesson' | 'appendix'
      children?: Array<{
        title: string
        anchor_id: string
        type: 'lesson' | 'subsection'
      }>
    }>
  }
  preface: {
    title: string
    who_this_is_for: string[]
    what_you_will_learn: string[]
    what_this_course_will_not_do: string[]
    prerequisites: string[]
  }
  modules: Array<{
    module_id: string
    anchor_id: string
    title: string
    goal: string
    lessons: Array<{
      lesson_id: string
      anchor_id: string
      title: string
      content_blocks: Array<{
        type: 'paragraph' | 'bullets' | 'example' | 'myth_vs_reality' | 'definition'
        text: string
      }>
    }>
    checklist: {
      title: string
      items: string[]
    }
    exercise: {
      title: string
      purpose: string
      steps: string[]
      expected_output: string
    }
    risk_box: {
      title: string
      points: string[]
    }
    module_summary: {
      key_takeaways: string[]
    }
  }>
  diagrams: Array<{
    diagram_id: string
    title: string
    what_it_shows: string
    layout_notes: string
    image_prompt: string
    insert_after_anchor_id: string
  }>
  one_page_summary: {
    title: string
    sections: Array<{
      heading: string
      bullets: string[]
    }>
    print_note: string
  }
  glossary: Array<{
    term: string
    plain_definition: string
    why_it_matters: string
  }>
  quiz: {
    title: string
    questions: Array<{
      q: string
      choices: string[]
      correct_choice_index: number
      explanation: string
    }>
  }
  footer_and_versioning: {
    header_rules: {
      apply_from_section_anchor: string
      left: string
      right: string
    }
    footer_rules: {
      apply_from_section_anchor: string
      left: string
      center: string
      right: string
    }
    page_numbering: {
      start_after_section_anchor: string
      format: string
    }
  }
}

/**
 * Course generation result
 * courseAr and pdfArPath are optional in case translation fails
 */
export interface CourseGenerationResult {
  courseEn: GeneratedCourse
  courseAr?: GeneratedCourse // Optional if translation failed
  coverImagePath: string
  diagramImagePaths: Record<string, string> // diagram_id -> image path
  pdfEnPath: string
  pdfArPath?: string // Optional if Arabic PDF not generated
  courseId: string
  warnings?: string[] // Warnings about skipped steps (e.g., translation failed)
}

