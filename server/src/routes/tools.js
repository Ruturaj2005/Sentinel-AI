import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Analyze ticket reason with proper risk calculation
router.post('/analyze-ticket', authenticate, async (req, res) => {
  try {
    const { reason, responseTime = 120 } = req.body; // responseTime in seconds

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'Reason text is required' });
    }

    // Try Gemini API first, fallback to local scoring
    const geminiApiKey = process.env.GEMINI_API_KEY;
    let nlpScores;

    if (geminiApiKey) {
      try {
        nlpScores = await analyzeWithGemini(reason, geminiApiKey);
      } catch (apiError) {
        console.error('Gemini API error, falling back to local:', apiError.message);
        nlpScores = analyzeTicketReasonLocal(reason);
      }
    } else {
      nlpScores = analyzeTicketReasonLocal(reason);
    }

    // Calculate composite risk score and routing
    const result = calculateCompositeRisk(nlpScores, responseTime, reason);

    res.json(result);
  } catch (error) {
    console.error('Ticket analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Calculate composite risk score from NLP scores
function calculateCompositeRisk(nlpScores, responseTimeSeconds, reason) {
  // Convert NLP overall_score (0-10, higher=better) to risk (0-100, higher=worse)
  const nlp_risk = (10 - nlpScores.overall_score) * 10;

  // Response time risk
  let time_risk;
  if (responseTimeSeconds < 30) {
    time_risk = 95;
  } else if (responseTimeSeconds < 60) {
    time_risk = 80;
  } else if (responseTimeSeconds < 120) {
    time_risk = 60;
  } else if (responseTimeSeconds < 300) {
    time_risk = 30;
  } else {
    time_risk = 10;
  }

  // Check failures (simplified - in real system would check against employee profile)
  // Role match: assume fails if specificity < 4 and role_relevance < 5
  const role_fail = (nlpScores.specificity < 4 && nlpScores.role_relevance < 5) ? 20 : 0;

  // Calendar check: assume fails if urgency claimed but not validated
  const calendar_fail = nlpScores.urgency_validity < 4 ? 15 : 0;

  // Volume check: assume fails if completeness is low (indicates bulk without reason)
  const volume_fail = nlpScores.completeness < 4 ? 20 : 0;

  // Calculate composite risk (weighted)
  const composite = Math.round(
    (nlp_risk * 0.40) +
    (time_risk * 0.30) +
    role_fail +
    calendar_fail +
    volume_fail
  );

  // Cap at 100
  const finalRisk = Math.min(100, Math.max(0, composite));

  // Determine routing
  let routing;
  if (finalRisk <= 30) {
    routing = {
      decision: 'auto_approved',
      label: 'Auto Approved — Access Granted',
      color: 'green'
    };
  } else if (finalRisk <= 65) {
    routing = {
      decision: 'manager_review',
      label: 'Sent to Manager for Review',
      color: 'amber'
    };
  } else {
    routing = {
      decision: 'cvu_escalation',
      label: 'Escalated to Central Vigilance Unit',
      color: 'red'
    };
  }

  return {
    // NLP scores (0-10, higher is better)
    nlp: {
      overall_score: nlpScores.overall_score,
      specificity: nlpScores.specificity,
      urgency_validity: nlpScores.urgency_validity,
      role_relevance: nlpScores.role_relevance,
      completeness: nlpScores.completeness,
      red_flag_language: nlpScores.red_flag_language,
      verdict: nlpScores.verdict,
      explanation: nlpScores.explanation || '',
      suspicious_signals: nlpScores.suspicious_signals || [],
      positive_signals: nlpScores.positive_signals || []
    },
    // Risk score (0-100, higher is worse)
    risk: {
      composite: finalRisk,
      breakdown: {
        nlp_risk: Math.round(nlp_risk),
        time_risk,
        role_penalty: role_fail,
        calendar_penalty: calendar_fail,
        volume_penalty: volume_fail
      }
    },
    // Routing decision
    routing,
    // Metadata
    metadata: {
      response_time_seconds: responseTimeSeconds,
      reason_length: reason.length,
      reason_words: reason.split(/\s+/).length
    }
  };
}

// Analyze using Gemini API with strict prompt
async function analyzeWithGemini(reason, apiKey) {
  const systemPrompt = `You are a strict bank security AI for Union Bank of India.
You must score employee access ticket reasons harshly and accurately.
Return ONLY raw JSON. No markdown. No backticks. No explanation outside JSON.

Analyze the reason text and return this exact structure:
{
  "overall_score": 0-10 number,
  "specificity": 0-10 number,
  "urgency_validity": 0-10 number,
  "role_relevance": 0-10 number,
  "completeness": 0-10 number,
  "red_flag_language": 0-10 number,
  "verdict": "string",
  "explanation": "string",
  "suspicious_signals": ["array", "of", "strings"],
  "positive_signals": ["array", "of", "strings"]
}

STRICT SCORING RULES — follow these exactly:

overall_score 0 to 3 — HIGH SUSPICION:
Assign this when reason is any of these:
- Single words or short vague phrases like "urgent work", "need access", "important task", "have to check", "required"
- No reference number, no deadline, no colleague name
- No specific file, report name, or business process named
- Generic banking terms with no specifics

overall_score 4 to 6 — MEDIUM:
Assign this when:
- Mentions a department or general task
- Has some context but missing verifiable details
- Vague deadline like "end of day" or "this week"
- Role is somewhat relevant but not fully justified

overall_score 7 to 10 — LEGITIMATE:
Assign this ONLY when:
- Names a specific reference number or file
- Names a specific person, deadline, or regulation
- Reason clearly matches the role and system
- Volume of data requested is proportionate to reason
- Sufficient detail that a manager could verify independently

EXTRA PENALTIES — reduce score by 2 points for each:
- Response time under 60 seconds
- Data volume above 10000 records with vague reason
- System accessed does not match employee role
- Claimed urgency cannot be verified

EXAMPLES for calibration:
"urgent work" = overall_score 1
"need to check customer details" = overall_score 3
"monthly report preparation" = overall_score 4
"Q3 audit data for RBI inspection next week" = overall_score 6
"Need loan closure data for ref LN-2024-887 for RBI submission deadline tomorrow authorized by RM Sharma" = overall_score 9

verdict must be one of:
- "High suspicion — extremely vague, no verifiable details" (score 0-3)
- "Moderate — some detail but insufficient for high-risk access" (score 4-6)
- "Legitimate — specific, verifiable, contextually appropriate" (score 7-10)

explanation: 1-2 sentences explaining why this score was given
suspicious_signals: array of red flags found (e.g., "vague language", "no reference number", "unusually urgent")
positive_signals: array of legitimacy indicators (e.g., "specific reference number", "named authorizer", "clear deadline")`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nEmployee's reason for access:\n"${reason}"\n\nReturn ONLY the JSON object, no other text.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 500
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = text.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  const scores = JSON.parse(jsonStr);

  // Validate and normalize
  return {
    overall_score: normalizeScore(scores.overall_score),
    specificity: normalizeScore(scores.specificity),
    urgency_validity: normalizeScore(scores.urgency_validity),
    role_relevance: normalizeScore(scores.role_relevance),
    completeness: normalizeScore(scores.completeness),
    red_flag_language: normalizeScore(scores.red_flag_language),
    verdict: scores.verdict || getVerdict(normalizeScore(scores.overall_score)),
    explanation: scores.explanation || '',
    suspicious_signals: Array.isArray(scores.suspicious_signals) ? scores.suspicious_signals : [],
    positive_signals: Array.isArray(scores.positive_signals) ? scores.positive_signals : []
  };
}

function normalizeScore(score) {
  const num = parseFloat(score);
  if (isNaN(num)) return 5;
  return Math.round(Math.min(10, Math.max(0, num)) * 10) / 10;
}

function getVerdict(score) {
  if (score <= 3) return 'High suspicion — extremely vague, no verifiable details';
  if (score <= 6) return 'Moderate — some detail but insufficient for high-risk access';
  return 'Legitimate — specific, verifiable, contextually appropriate';
}

// Local NLP scoring algorithm (fallback) - STRICT VERSION
function analyzeTicketReasonLocal(text) {
  const words = text.toLowerCase().split(/\s+/);
  const length = text.length;
  const wordCount = words.length;

  // Very short or vague - automatic low score
  if (wordCount < 3 || length < 15) {
    return {
      overall_score: 1,
      specificity: 1,
      urgency_validity: 1,
      role_relevance: 1,
      completeness: 1,
      red_flag_language: 1,
      verdict: 'High suspicion — extremely vague, no verifiable details',
      explanation: 'Reason is too short and lacks any specific details or context',
      suspicious_signals: ['extremely short text', 'no verifiable details', 'vague language'],
      positive_signals: []
    };
  }

  // ===== SPECIFICS (strict) =====
  const hasReference = /\b(ref|reference|id|number|#|ln-|aud-|txn-|acc-)\d+/i.test(text);
  const hasSpecificDate = /\b(tomorrow|monday|tuesday|wednesday|thursday|friday|\d{1,2}\/\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december\s+\d{1,2})\b/i.test(text);
  const hasSpecificName = /\b(mr\.|mrs\.|ms\.|sharma|kumar|singh|patel|authorized by|approved by|requested by)\s+\w+/i.test(text);
  const hasFileRef = /\b\w+\.(xlsx?|docx?|pdf|csv)\b/i.test(text);

  let specificity = 0;
  if (hasReference) specificity += 4;
  if (hasSpecificDate) specificity += 3;
  if (hasSpecificName) specificity += 2;
  if (hasFileRef) specificity += 1;
  specificity = Math.min(10, specificity);

  // ===== URGENCY VALIDITY =====
  const hasUrgentKeyword = /\b(urgent|asap|immediately|emergency|critical)\b/i.test(text);
  const hasJustification = /\b(rbi|audit|compliance|regulatory|deadline|inspection)\b/i.test(text);

  let urgency_validity;
  if (hasUrgentKeyword && !hasJustification) {
    urgency_validity = 2; // Red flag - urgent but no reason
  } else if (hasJustification) {
    urgency_validity = 7;
  } else {
    urgency_validity = 5;
  }

  // ===== ROLE RELEVANCE (banking terms) =====
  const bankingTerms = ['loan', 'account', 'customer', 'transaction', 'audit', 'rbi', 'treasury', 'credit', 'debit', 'compliance', 'reconciliation', 'disbursement'];
  const matchCount = bankingTerms.filter(term => new RegExp(`\\b${term}\\b`, 'i').test(text)).length;
  const role_relevance = Math.min(10, matchCount * 2.5);

  // ===== COMPLETENESS (who, what, why, when) =====
  const hasWho = hasSpecificName || /\b(i|we|my|our|team|department)\b/i.test(text);
  const hasWhat = /\b(data|file|record|document|report|information|statement)\b/i.test(text);
  const hasWhy = /\b(for|to|because|due|need|require|purpose)\b/i.test(text);
  const hasWhen = hasSpecificDate || /\b(today|tomorrow|deadline|due)\b/i.test(text);

  const completeness = (hasWho ? 2.5 : 0) + (hasWhat ? 2.5 : 0) + (hasWhy ? 2.5 : 0) + (hasWhen ? 2.5 : 0);

  // ===== RED FLAGS =====
  const redFlags = ['just', 'only', 'quick', 'simple', 'usual', 'regular', 'normal', 'routine', 'urgent', 'asap'];
  const flagCount = redFlags.filter(flag => text.toLowerCase().includes(flag)).length;
  const red_flag_language = Math.max(1, 10 - (flagCount * 2));

  // ===== OVERALL (strict weighting) =====
  const overall = (specificity * 0.3 + urgency_validity * 0.15 + role_relevance * 0.25 + completeness * 0.2 + red_flag_language * 0.1);
  const overall_score = Math.round(Math.min(10, Math.max(0, overall)) * 10) / 10;

  // Generate explanation and signals
  const suspicious_signals = [];
  const positive_signals = [];

  if (specificity < 4) suspicious_signals.push('lacks specific references');
  if (specificity >= 7) positive_signals.push('includes specific references');

  if (hasUrgentKeyword && !hasJustification) suspicious_signals.push('urgent claim without justification');
  if (hasJustification) positive_signals.push('includes verifiable justification');

  if (role_relevance < 3) suspicious_signals.push('weak role relevance');
  if (role_relevance >= 7) positive_signals.push('strong banking context');

  if (completeness < 4) suspicious_signals.push('incomplete information (missing who/what/why/when)');
  if (completeness >= 8) positive_signals.push('comprehensive details provided');

  if (flagCount > 2) suspicious_signals.push(`high red flag language count (${flagCount} terms)`);
  if (flagCount === 0) positive_signals.push('no suspicious language patterns');

  let explanation;
  if (overall_score <= 3) {
    explanation = 'Reason lacks verifiable details and contains vague language that cannot be independently validated';
  } else if (overall_score <= 6) {
    explanation = 'Reason provides some context but missing critical details needed for verification';
  } else {
    explanation = 'Reason contains sufficient specific, verifiable information appropriate for the access request';
  }

  return {
    overall_score,
    specificity: Math.round(specificity * 10) / 10,
    urgency_validity: Math.round(urgency_validity * 10) / 10,
    role_relevance: Math.round(role_relevance * 10) / 10,
    completeness: Math.round(completeness * 10) / 10,
    red_flag_language: Math.round(red_flag_language * 10) / 10,
    verdict: getVerdict(overall_score),
    explanation,
    suspicious_signals,
    positive_signals
  };
}

export default router;
