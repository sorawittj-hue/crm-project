import { callGeminiAPI } from './ai';
import { Type } from '@google/genai';

/**
 * AI-powered deal analysis and suggestions
 */
export async function analyzeDeal(deal, activities = []) {
  const prompt = `
Analyze this sales deal and provide insights:

Deal Details:
- Title: ${deal.title}
- Company: ${deal.company}
- Value: ${deal.value} THB
- Stage: ${deal.stage}
- Probability: ${deal.probability || 0}%
- Last Activity: ${deal.lastActivity || 'Never'}
- Created: ${deal.createdAt}

Recent Activities:
${activities.slice(-5).map(a => `- ${a.type}: ${a.description} (${a.date})`).join('\n')}
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      winProbability: { type: Type.NUMBER, description: "0-100" },
      riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
      riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
      nextBestAction: { type: Type.STRING },
      suggestedEmail: { type: Type.STRING },
      daysSinceActivity: { type: Type.NUMBER },
      isStalled: { type: Type.BOOLEAN },
      priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] }
    },
    required: ["winProbability", "riskLevel", "riskFactors", "nextBestAction", "daysSinceActivity", "isStalled", "priority"]
  };

  try {
    const result = await callGeminiAPI(prompt, schema);
    return result;
  } catch (error) {
    console.error('AI analysis failed:', error);
    return null;
  }
}

/**
 * Prioritize deals using AI
 */
export async function prioritizeDeals(deals) {
  const prompt = `
Prioritize these sales deals by likelihood to close and strategic value:

${deals.map((d, i) => `
Deal ${i + 1}:
- ID: ${d.id}
- Title: ${d.title}
- Company: ${d.company}
- Value: ${d.value} THB
- Stage: ${d.stage}
- Probability: ${d.probability || 0}%
- Last Activity: ${d.lastActivity || 'Never'}
`).join('\n')}
`;

  const schema = {
    type: Type.ARRAY,
    description: "Array of deal IDs sorted by priority (highest first)",
    items: { type: Type.STRING }
  };

  try {
    const result = await callGeminiAPI(prompt, schema);
    if (Array.isArray(result)) return result;
    return deals.map(d => d.id);
  } catch (error) {
    console.error('AI prioritization failed:', error);
    return deals.map(d => d.id);
  }
}

/**
 * Generate follow-up email for a deal
 */
export async function generateFollowUpEmail(deal, context = {}) {
  const prompt = `
Write a professional follow-up email for this sales deal:

Deal: ${deal.title}
Company: ${deal.company}
Current Stage: ${deal.stage}
Last Contact: ${deal.lastActivity || 'Unknown'}

Context:
- Previous discussion: ${context.previousDiscussion || 'Not specified'}
- Pain points: ${context.painPoints || 'Not specified'}
- Next steps discussed: ${context.nextSteps || 'Not specified'}

Write a concise, friendly, and professional email in Thai language (with optional English terms for business context).
Include:
1. Friendly greeting
2. Reference to last conversation
3. Value proposition reminder
4. Clear call-to-action
5. Professional closing
`;

  try {
    const result = await callGeminiAPI(prompt);
    // Since we don't use schema for plain text, result could be an object { text: ... } or just string
    return result?.text || typeof result === 'string' ? result : null;
  } catch (error) {
    console.error('Email generation failed:', error);
    return null;
  }
}

/**
 * Summarize deal timeline
 */
export async function summarizeTimeline(deal, activities = []) {
  const prompt = `
Summarize the timeline and key events for this deal:

Deal: ${deal.title}
Company: ${deal.company}
Created: ${deal.createdAt}
Current Stage: ${deal.stage}

Activities:
${activities.map(a => `- ${a.date}: ${a.type} - ${a.description}`).join('\n')}

Provide a concise summary highlighting key milestones, blockers, and overall health.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.ARRAY, items: { type: Type.STRING } },
      milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
      blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
      overallHealth: { type: Type.STRING, enum: ["positive", "neutral", "concerning"] }
    },
    required: ["summary", "milestones", "blockers", "overallHealth"]
  };

  try {
    const result = await callGeminiAPI(prompt, schema);
    return result;
  } catch (error) {
    console.error('Timeline summary failed:', error);
    return null;
  }
}

/**
 * Calculate deal risk score based on activity patterns
 */
export function calculateRiskScore(deal, activities = [], now = Date.now()) {
  const lastActivityDate = new Date(deal.lastActivity || deal.createdAt || deal.created_at || '1970-01-01').getTime();
  const daysSinceActivity = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));
  
  let riskScore = 0;
  const riskFactors = [];

  // Days since activity
  if (daysSinceActivity > 14) {
    riskScore += 40;
    riskFactors.push('No activity in 14+ days');
  } else if (daysSinceActivity > 7) {
    riskScore += 20;
    riskFactors.push('No activity in 7+ days');
  }

  // Stage-based risk
  const highRiskStages = ['proposal', 'negotiation'];
  if (highRiskStages.includes(deal.stage) && daysSinceActivity > 5) {
    riskScore += 20;
    riskFactors.push(`Stalled in ${deal.stage} stage`);
  }

  // Low probability
  if (deal.probability && deal.probability < 30) {
    riskScore += 20;
    riskFactors.push('Low win probability');
  }

  // Activity frequency
  const recentActivities = activities.filter(a => {
    const activityDate = new Date(a.date || a.createdAt).getTime();
    return (now - activityDate) < (30 * 24 * 60 * 60 * 1000); // Last 30 days
  });
  
  if (recentActivities.length < 3) {
    riskScore += 20;
    riskFactors.push('Low activity frequency');
  }

  const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

  return {
    score: riskScore,
    level: riskLevel,
    factors: riskFactors,
    daysSinceActivity
  };
}
