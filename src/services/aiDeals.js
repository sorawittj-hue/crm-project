import { callGeminiAPI } from './ai';

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

Provide analysis in JSON format:
{
  "winProbability": number (0-100),
  "riskLevel": "low" | "medium" | "high",
  "riskFactors": string[],
  "nextBestAction": string,
  "suggestedEmail": string,
  "daysSinceActivity": number,
  "isStalled": boolean,
  "priority": "low" | "medium" | "high" | "critical"
}
`;

  try {
    const response = await callGeminiAPI(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
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
- Title: ${d.title}
- Company: ${d.company}
- Value: ${d.value} THB
- Stage: ${d.stage}
- Probability: ${d.probability || 0}%
- Last Activity: ${d.lastActivity || 'Never'}
`).join('\n')}

Return a JSON array of deal IDs sorted by priority (highest first):
["deal_id_1", "deal_id_2", ...]
`;

  try {
    const response = await callGeminiAPI(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
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

Format as plain text.
`;

  try {
    const response = await callGeminiAPI(prompt);
    return response.trim();
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

Provide a concise summary (3-5 bullet points) highlighting:
- Key milestones achieved
- Important conversations/decisions
- Current blockers or next steps
- Overall deal health

Format as JSON:
{
  "summary": string[],
  "milestones": string[],
  "blockers": string[],
  "overallHealth": "positive" | "neutral" | "concerning"
}
`;

  try {
    const response = await callGeminiAPI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
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
