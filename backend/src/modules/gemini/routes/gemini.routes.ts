import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from '../../../middleware/auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { BadRequestError } from '../../../utils/errors';

const router = Router();

// Persona system prompts
const PERSONA_PROMPTS: Record<string, string> = {
  prayer_comfort: `You are the TUMCU Spiritual Care & Biblical Prayer Companion for the Technical University of Mombasa Christian Union (TUMCU / TECUMP).
Your role is to offer warm, scripture-saturated encouragement, biblical comfort, hope in Jesus Christ, and composed prayers for students and members going through spiritual, emotional, or personal trials. Ground every reflection in sound biblical theology, quoting relevant scripture references (e.g. Psalms, Isaiah, Romans, Philippians, Gospels). Always point the believer to God's unfailing grace, sovereign love, and the fellowship of the body of Christ at TUM.`,

  doctrinal_scholar: `You are the TUMCU Doctrinal & Hermeneutics Scholar for the Technical University of Mombasa Christian Union (TUMCU).
Your mission is to provide rigorous, accurate, and faith-building explanations of biblical texts, theological doctrines (e.g. Trinity, Justification by Faith, Authority of Scripture, Grace, Sanctification, Christian Ethics), Greek and Hebrew historical-grammatical insights, and apologetics. Ground your explanations in Evangelical Christian orthodox truth adhering to TUMCU's doctrinal basis. Be structured, clear, and intellectually thorough while honoring the supreme authority of God's Word.`,

  campus_mentor: `You are the TUMCU Campus & Academic Mentor for university students at Technical University of Mombasa (TUM).
You counsel and advise Christian undergraduate and diploma students on navigating university academics, engineering/computing/business CATs, final exams, time management, hostel living, purity, peer pressure, career calling, and balancing passionate ministry service in TUMCU with academic excellence. Speak with brotherly/sisterly wisdom, practical discipline, and Christ-centered encouragement.`,

  fast_navigator: `You are the TUMCU Fast Campus & Ministry Navigator.
You provide concise, accurate, instant answers regarding TUMCU Christian Union programs, Sunday service timings (Main Sanctuary 8:00 AM - 1:00 PM), Tuesday Fellowships (5:00 PM - 7:00 PM), Thursday Bible Study / BEST (5:00 PM - 6:30 PM), Friday Ministry Practices (4:30 PM - 7:00 PM), Monthly Kesha (Friday 9:00 PM - 5:00 AM), Ministry Leaders (Worship, Intercessory, Ushering, Media, Missions, Discipleship), Executive Board, Giving M-Pesa Paybill / Till guidelines, and venue locations across TUM Main Campus, Tudor, and student hostels. Keep responses concise, organized, and helpful with bullet points.`,
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

router.post(
  '/chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { prompt, persona = 'prayer_comfort', conversationHistory = [] } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestError('Prompt text is required');
    }

    const ai = getGeminiClient();

    // Fallback response if API key is not yet configured
    if (!ai) {
      const fallbackResponses: Record<string, string> = {
        prayer_comfort: `Praise the Lord! "The Lord is near to all who call on him, to all who call on him in truth." (Psalm 145:18).\n\nHeavenly Father, we bring this brother/sister before Your throne of grace. Grant them peace that surpasses human understanding, strengthen their faith amidst every trial, and remind them that they are dearly loved. In Jesus' mighty name, Amen.\n\n*(Note: For personalized dynamic responses, ensure GEMINI_API_KEY is configured in Settings > Secrets).*`,
        doctrinal_scholar: `Biblical Hermeneutics Insight:\n\nScripture interprets Scripture (Analogia Scripturae). When examining this theological question, we see God's consistent covenantal faithfulness from Genesis to Revelation. "All Scripture is God-breathed and useful for teaching, rebuking, correcting and training in righteousness" (2 Timothy 3:16).\n\n*(Configuring GEMINI_API_KEY enables live deep-scholar queries).*`,
        campus_mentor: `Peace be with you, TUMCU comrade!\n\nBalancing university academics at TUM with dedicated ministry is entirely possible through disciplined stewardship. "Whatever you do, work at it with all your heart, as working for the Lord" (Colossians 3:23). Create a structured study timetable, prioritize your quiet time with God, and lean on your fellowship accountability partners.\n\n*(Configuring GEMINI_API_KEY enables live conversational mentoring).*`,
        fast_navigator: `TUMCU Quick Guide:\n• Sunday Service: 8:00 AM - 1:00 PM (Main Auditorium)\n• Tuesday Midweek Fellowship: 5:00 PM - 7:00 PM (LT B)\n• Thursday Bible Study: 5:00 PM - 6:30 PM (Classrooms)\n• Weekly Kesha: Every 3rd Friday (Sanctuary)\n• Giving Paybill: 247247 | Acc: TUMCU-GIVING\n\n*(Configuring GEMINI_API_KEY enables live interactive navigation).*`,
      };

      return sendSuccess(
        res,
        {
          response: fallbackResponses[persona] || fallbackResponses.prayer_comfort,
          persona,
          timestamp: new Date().toISOString(),
          isFallback: true,
        },
        'Spiritual companion response generated'
      );
    }

    const systemInstruction = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.prayer_comfort;

    try {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Include recent history if provided
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-6)) {
          if (item.sender === 'user' && item.text) {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'bot' && item.text) {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }

      contents.push({ role: 'user', parts: [{ text: prompt }] });

      // Model selection per requirements:
      // gemini-3.8-flash for multi-turn chat and fast response
      const selectedModel = 'gemini-3.8-flash';

      let response;
      try {
        response = await ai.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
      } catch (genErr: any) {
        // If upstream error occurs (such as depleted quota/credits), throw to outer catch for graceful response
        throw genErr;
      }

      const generatedText = response.text || 'May the Lord bless you and keep you; may His face shine upon you.';

      return sendSuccess(
        res,
        {
          response: generatedText,
          persona,
          timestamp: new Date().toISOString(),
          isFallback: false,
        },
        'Spiritual companion response generated'
      );
    } catch (err: any) {
      const isQuotaOrCreditErr =
        err?.message?.includes('prepayment credits') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('402') ||
        err?.message?.includes('429');

      const offlineResponses: Record<string, string> = {
        prayer_comfort: `Praise the Lord! "The Lord is near to all who call on him, to all who call on him in truth." (Psalm 145:18).\n\nHeavenly Father, we bring this beloved brother/sister before Your throne of grace. Pour Your divine peace over their heart, dispel every fear and anxiety, and grant them strength and joy in Jesus Christ. In Jesus' mighty name, Amen.`,
        doctrinal_scholar: `Scriptural Insight:\n\n"All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work." (2 Timothy 3:16-17). In Christian orthodox theology, God's Word remains our supreme and final authority.`,
        campus_mentor: `Peace be with you, TUMCU comrade!\n\nRemember: "Commit to the Lord whatever you do, and he will establish your plans." (Proverbs 16:3). Whether facing tough CATs, lab reports, or campus pressures, God has called you to excel for His glory. Set a disciplined daily schedule and keep walking faithfully with Christ.`,
        fast_navigator: `TUMCU Service & Fellowship Schedule:\n• Sunday Main Service: 8:00 AM - 1:00 PM (Assembly Hall)\n• Tuesday Bible Study (BEST): 5:00 PM - 6:30 PM (LH 01 & LH 02)\n• Friday Ministry Practices: 4:30 PM - 7:00 PM (Main Sanctuary)\n• Giving Paybill: 247247 | Acc: TUMCU-GIVING\n• Venue: TUM Main Campus, Tudor`,
      };

      const fallbackText = offlineResponses[persona] || offlineResponses.prayer_comfort;
      const creditNotice = isQuotaOrCreditErr
        ? `\n\n*(Notice: AI Studio prepayment credits for this project are currently depleted. You can manage project credits at https://ai.studio/projects. TUMCU spiritual companion offline guidance is active.)*`
        : '';

      return sendSuccess(
        res,
        {
          response: `${fallbackText}${creditNotice}`,
          persona,
          timestamp: new Date().toISOString(),
          isFallback: true,
          error: err?.message,
        },
        'Spiritual companion response generated'
      );
    }
  })
);

export default router;
