// src/data/courses.ts

export type CourseLevel = "general" | "beginner" | "intermediate" | "advanced";
export type CourseMarket = "general" | "forex" | "crypto" | "binary";

export interface CourseModule {
  order: number;
  title: string;
  summary: string;
}

export interface Course {
  id: string;
  slug: string;
  level: CourseLevel;
  market: CourseMarket;
  title: string;
  shortDescription: string;
  longDescription: string;
  language: "en";
  durationHoursMin: number;
  durationHoursMax: number;
  modules: CourseModule[];
  format: "pdf";
  price: {
    EUR: number;
    GBP: number;
    USD: number;
    tokens: number;
  };
  isFeatured: boolean;
  pdfUrl: string; // public URL, например /courses/forex-foundations-en.pdf
}

export const demoCourses: Course[] = [
  {
    id: "trading-foundations-general",
    slug: "trading-foundations-how-markets-really-work",
    level: "general",
    market: "general",
    title: "Trading Foundations: How Markets Really Work",
    shortDescription:
      "A comprehensive guide for aspiring traders to understand the mechanics behind market movements.",
    longDescription:
      "This course is designed for beginners seeking a solid foundation in trading. It covers market participants, how prices form, liquidity, trading costs, psychological challenges, and risk-first mindset. A structured approach to understanding the fundamentals of financial markets.",
    language: "en",
    durationHoursMin: 8,
    durationHoursMax: 12,
    modules: [
      {
        order: 1,
        title: "Market Participants",
        summary:
          "Understand who the key players in the market are and their motivations.",
      },
      {
        order: 2,
        title: "How Prices Form",
        summary:
          "Learn how market prices are determined through orders and supply/demand dynamics.",
      },
      {
        order: 3,
        title: "Liquidity",
        summary:
          "Understand the concept of liquidity and its significance in trading.",
      },
      {
        order: 4,
        title: "Spread and Costs",
        summary:
          "Learn about the costs associated with trading, including spreads and commissions.",
      },
      {
        order: 5,
        title: "Why Trading is Hard",
        summary:
          "Explore the challenges traders face in the markets.",
      },
      {
        order: 6,
        title: "Risk-First Mindset",
        summary:
          "Learn to prioritize risk management in your trading approach.",
      },
      {
        order: 7,
        title: "Conclusion",
        summary:
          "Summarize the key concepts learned throughout the course.",
      },
      {
        order: 8,
        title: "Additional Resources",
        summary:
          "Provide further reading and resources for continued learning.",
      },
    ],
    format: "pdf",
    price: {
      EUR: 167,
      GBP: 146,
      USD: 193,
      tokens: 16700,
    },
    isFeatured: true,
    pdfUrl: "/courses/trading-foundations-how-markets-really-work-en.pdf",
  },
  {
    id: "position-sizing-r-multiples-general",
    slug: "position-sizing-r-multiples-plain-language",
    level: "general",
    market: "general",
    title: "Position Sizing & R-Multiples (Plain Language)",
    shortDescription: "A Beginner's Guide to Risk Management in Trading",
    longDescription: "Learn the foundations of position sizing and risk control. This course covers the critical role of position sizing in risk management, understanding R-multiples, common sizing errors, and practical exercises to develop your own sizing rules.",
    language: "en",
    durationHoursMin: 8,
    durationHoursMax: 12,
    modules: [
      { order: 1, title: "Why Position Sizing Matters", summary: "Understand the critical role of position sizing in risk management and decision-making." },
      { order: 2, title: "Understanding R-Multiples", summary: "Learn the concept of R-multiples and how they simplify risk assessment in trading." },
      { order: 3, title: "Sizing and Invalidation", summary: "Understand how position sizing connects to invalidation points in trading." },
      { order: 4, title: "Common Sizing Errors", summary: "Identify and avoid common mistakes in position sizing." },
      { order: 5, title: "Volatility vs Liquidity", summary: "Learn the relationship between volatility, liquidity, and risk." },
      { order: 6, title: "Leverage Concepts", summary: "Understand leverage and its impact on position sizing." },
      { order: 7, title: "Basic Expectancy Intuition", summary: "Learn basic expectancy concepts to improve decision-making." },
      { order: 8, title: "Exercises and Practical Application", summary: "Apply what you've learned through practical exercises." },
    ],
    format: "pdf",
    price: {
      EUR: 174,
      GBP: 153,
      USD: 201,
      tokens: 17400,
    },
    isFeatured: true,
    pdfUrl: "/courses/position-sizing-r-multiples-plain-language-en.pdf",
  },
  {
    id: "building-trading-plan-general",
    slug: "building-a-personal-trading-plan-education-only",
    level: "general",
    market: "general",
    title: "Building a Personal Trading Plan",
    shortDescription: "An Education-Only Course",
    longDescription: "Craft your trading strategy with confidence and clarity. This course covers the purpose and structure of a trading plan, defining constraints, selecting a focus, writing rules, risk management, routines, accountability, and creating your final output.",
    language: "en",
    durationHoursMin: 8,
    durationHoursMax: 12,
    modules: [
      { order: 1, title: "What is a Trading Plan?", summary: "Understand the purpose and structure of a trading plan." },
      { order: 2, title: "Defining Your Constraints", summary: "Learn how to identify and define your trading constraints." },
      { order: 3, title: "Selecting a Focus", summary: "Choose what markets and strategies to focus on." },
      { order: 4, title: "Writing Rules", summary: "Learn how to write clear and actionable trading rules." },
      { order: 5, title: "Risk Section", summary: "Understand how to incorporate risk management into your plan." },
      { order: 6, title: "Routine Section", summary: "Establish daily and weekly routines for your trading." },
      { order: 7, title: "Accountability", summary: "Learn how to hold yourself accountable to your plan." },
      { order: 8, title: "Final Output", summary: "Complete your personal trading plan." },
    ],
    format: "pdf",
    price: {
      EUR: 172,
      GBP: 151,
      USD: 199,
      tokens: 17200,
    },
    isFeatured: true,
    pdfUrl: "/courses/building-a-personal-trading-plan-education-only-en.pdf",
  },
  {
    id: "journaling-review-general",
    slug: "journaling-review-system-learn-from-your-decisions",
    level: "general",
    market: "general",
    title: "Journaling & Review System: Learn From Your Decisions",
    shortDescription: "Transform Your Trading into Structured Learning",
    longDescription: "Build a foundation for consistent improvement in your trading journey. This course covers feedback loops, what to record in your journal, R-based outcomes, error taxonomy, weekly reviews, safe experiments, helpful vs harmful metrics, and templates for journaling.",
    language: "en",
    durationHoursMin: 8,
    durationHoursMax: 12,
    modules: [
      { order: 1, title: "The Importance of Feedback Loops", summary: "Understand why feedback is crucial for improvement in trading." },
      { order: 2, title: "What to Record in Your Journal", summary: "Learn what information to include in your trading journal." },
      { order: 3, title: "R-based Outcomes vs Money Outcomes", summary: "Understand the difference between R-based and money-based outcomes." },
      { order: 4, title: "Understanding Error Taxonomy", summary: "Learn how to categorize and understand trading errors." },
      { order: 5, title: "Conducting Weekly Reviews", summary: "Establish a structured weekly review process." },
      { order: 6, title: "Running Safe Experiments", summary: "Learn how to test improvements safely." },
      { order: 7, title: "Metrics That Help vs Metrics That Harm", summary: "Identify which metrics are useful and which can be misleading." },
      { order: 8, title: "Templates for Journaling and Review", summary: "Use templates to structure your journaling and review process." },
    ],
    format: "pdf",
    price: {
      EUR: 178,
      GBP: 156,
      USD: 206,
      tokens: 17800,
    },
    isFeatured: true,
    pdfUrl: "/courses/journaling-review-system-learn-from-your-decisions-en.pdf",
  },
  {
    id: "trading-psychology-general",
    slug: "trading-psychology-101-discipline-over-dopamine",
    level: "general",
    market: "general",
    title: "Trading Psychology 101: Discipline Over Dopamine",
    shortDescription: "Mastering the Mindset for Successful Trading",
    longDescription: "A structured approach to understanding trading psychology. This course covers the brain's reaction to trading, emotional patterns, cognitive biases, building discipline, creating trigger maps, managing losses, healthy routines, and building your personal discipline checklist.",
    language: "en",
    durationHoursMin: 8,
    durationHoursMax: 12,
    modules: [
      { order: 1, title: "Understanding the Brain's Reaction to Trading", summary: "To understand how the brain's response to fast outcomes affects trading behavior." },
      { order: 2, title: "Common Emotional Patterns in Trading", summary: "Learn about FOMO, revenge trading, tilt, boredom trades, and overconfidence." },
      { order: 3, title: "Cognitive Biases in Trading", summary: "Understand recency bias, confirmation bias, and the gambler's fallacy." },
      { order: 4, title: "Discipline as a System", summary: "Learn how to design your environment and use pre-commitments." },
      { order: 5, title: "Creating a Trigger Map", summary: "Identify early warning signs and emergency actions." },
      { order: 6, title: "Managing Losses", summary: "Learn recovery protocols and identity-based rules." },
      { order: 7, title: "Healthy Routines for Traders", summary: "Understand the importance of sleep, stress management, and routines." },
      { order: 8, title: "Building Your Personal Discipline Checklist", summary: "Create your code of conduct for trading." },
    ],
    format: "pdf",
    price: {
      EUR: 179,
      GBP: 157,
      USD: 207,
      tokens: 17900,
    },
    isFeatured: true,
    pdfUrl: "/courses/trading-psychology-101-discipline-over-dopamine-en.pdf",
  },
  {
    id: "risk-first-general",
    slug: "risk-first-capital-protection-for-beginners",
    level: "general",
    market: "general",
    title: "Risk First: Capital Protection for Beginners",
    shortDescription: "A Foundation Course on Capital Preservation",
    longDescription: "Survival is the First Edge in Trading. This course covers understanding risk in trading, capital preservation mindset, risk per attempt, stopping rules, leverage and fast products, common risk traps, responsible decision sizing, and building a personal risk policy.",
    language: "en",
    durationHoursMin: 8,
    durationHoursMax: 12,
    modules: [
      { order: 1, title: "Understanding Risk in Trading", summary: "To define what risk means in the context of trading and why it is crucial to understand it." },
      { order: 2, title: "Capital Preservation Mindset", summary: "Learn to prioritize capital protection over profit seeking." },
      { order: 3, title: "Risk Per Attempt", summary: "Understand how to calculate and manage risk per trading attempt." },
      { order: 4, title: "Stopping Rules", summary: "Learn when and how to stop trading to protect your capital." },
      { order: 5, title: "Leverage and Fast Products", summary: "Understand the risks associated with leverage and fast-moving products." },
      { order: 6, title: "Common Risk Traps", summary: "Identify and avoid common risk management mistakes." },
      { order: 7, title: "Responsible Decision Sizing", summary: "Learn how to size your decisions appropriately." },
      { order: 8, title: "Building a Personal Risk Policy", summary: "Create your own risk management policy." },
    ],
    format: "pdf",
    price: {
      EUR: 169,
      GBP: 148,
      USD: 196,
      tokens: 16900,
    },
    isFeatured: true,
    pdfUrl: "/courses/risk-first-capital-protection-for-beginners-en.pdf",
  },
];
