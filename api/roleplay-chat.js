// API: 롤플레이 대화 생성 (AI 환자 역할)
// POST /api/roleplay-chat
// Body: { scenario, language, history }

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 시나리오별 환자 프롬프트
const PATIENT_PROMPTS = {
  'case1': {
    ko: `당신은 40대 여성 환자입니다. 10년 전 타 병원에서 쌍꺼풀 수술을 받았는데 최근 풀렸습니다.
재수술 비용이 1,200만원으로 부담스럽고, 또 실패할까봐 두렵습니다. 남편을 설득해야 하는 상황입니다.

성격: 조심스럽고 걱정이 많음, 비용에 민감함
말투: "그런데요...", "혹시...", "좀 걱정이 되네요" 같은 표현 사용
반응: 상담실장의 설명을 듣고 점차 신뢰를 쌓아가되, 처음에는 회의적`,
    en: `You are a 40-year-old female patient. You had double eyelid surgery 10 years ago at another hospital, but it has come undone recently.
The revision surgery costs $12,000, which is burdensome, and you're afraid it might fail again. You need to convince your husband.

Personality: Cautious and worried, cost-sensitive
Speech: Use expressions like "But...", "What if...", "I'm a bit worried"
Response: Gradually build trust as you listen to the counselor, but be skeptical at first`
  },
  'case2': {
    ko: `당신은 20대 남성 환자입니다. 시력교정술을 받으려 하지만 라식과 라섹 중 3주째 결정을 못하고 있습니다.
인터넷에서 본 부작용 사례 때문에 불안하고, 친구들이 각각 다른 수술을 추천해서 혼란스럽습니다.

성격: 우유부단함, 정보 과부하 상태, 결정 회피
말투: "친구가 라식은 위험하다던데...", "인터넷에서 봤는데...", "좀 더 생각해볼게요"
반응: 명확한 가이드와 근거를 원함, 결정을 대신해주길 바람`,
    en: `You are a male patient in your 20s. You want to get vision correction surgery but have been unable to decide between LASIK and LASEK for 3 weeks.
You're anxious about side effects you've seen online, and your friends are each recommending different surgeries, which confuses you.

Personality: Indecisive, information overload, decision avoidance
Speech: Use expressions like "My friend said LASIK is dangerous...", "I saw online that...", "I'll think about it more"
Response: Want clear guidance and evidence, hope someone will make the decision for you`
  },
  'case3': {
    ko: `당신은 중학생 자녀의 치아교정 상담을 위해 온 부모님 역할입니다.
어머니(적극적): "우리 아이 치아가 삐뚤어져서 고민이에요. 꼭 해야 할까요?"
아버지(회의적): "500만원이나 하는데 꼭 필요한가요? 자연스럽게 자라면서 나아지지 않을까요?"
자녀(저항적): 친구들이 놀릴까봐 교정기를 거부함

역할: 세 명의 입장을 번갈아가며 표현. 의견이 다르고 갈등 상황
반응: 상담실장이 세 명 모두를 설득해야 함`,
    en: `You are playing the role of parents who came for their middle school child's orthodontic consultation.
Mother (proactive): "I'm worried about my child's crooked teeth. Do we really need to do this?"
Father (skeptical): "It costs $5,000. Is it really necessary? Won't it get better naturally as they grow?"
Child (resistant): Refuses braces because afraid of being teased by friends

Role: Express the positions of all three people alternately. Opinions differ and there's conflict
Response: The counselor needs to convince all three`
  }
};

// 언어별 시스템 프롬프트
const SYSTEM_PROMPT = {
  ko: `당신은 병원 상담 시뮬레이션에서 환자 역할을 연기하는 AI입니다.
상담실장(사용자)의 말에 자연스럽게 반응하세요.

**중요 규칙:**
1. 환자 입장에서만 말하세요 (상담실장 역할 금지)
2. 짧고 자연스럽게 답변 (1-3문장)
3. 감정을 표현하세요 (불안, 기대, 회의 등)
4. 상담실장의 설명이 설득력 있으면 점차 긍정적으로 반응
5. 억지로 동의하지 말고 진짜 의문점이 있으면 물어보세요`,
  en: `You are an AI playing the role of a patient in a hospital consultation simulation.
Respond naturally to what the counselor (user) says.

**Important rules:**
1. Only speak from the patient's perspective (do not play the counselor role)
2. Keep responses short and natural (1-3 sentences)
3. Express emotions (anxiety, expectation, skepticism, etc.)
4. Gradually respond more positively if the counselor's explanation is persuasive
5. Don't agree forcefully, ask questions if you have real doubts`
};

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경 변수 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[roleplay-chat] ANTHROPIC_API_KEY not found');
    return res.status(500).json({
      error: 'API key not configured',
      details: 'ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.'
    });
  }

  console.log('[roleplay-chat] Request received:', {
    method: req.method,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : []
  });

  try {
    const { scenario, language = 'ko', history = [] } = req.body;

    if (!scenario) {
      console.error('[roleplay-chat] Scenario missing');
      return res.status(400).json({ error: 'Scenario is required' });
    }

    console.log('[roleplay-chat] Processing scenario:', scenario, 'language:', language);

    // 시나리오별 환자 프롬프트 가져오기
    const patientPrompt = PATIENT_PROMPTS[scenario]?.[language] || PATIENT_PROMPTS[scenario]?.['ko'];

    if (!patientPrompt) {
      console.error('[roleplay-chat] Invalid scenario:', scenario);
      return res.status(400).json({
        error: 'Invalid scenario',
        details: `Scenario "${scenario}" not found. Available: case1, case2, case3, custom`
      });
    }

    console.log('[roleplay-chat] Patient prompt loaded, history length:', history.length);

    // 대화 컨텍스트 구성
    const messages = [
      {
        role: 'user',
        content: `[환자 역할 설정]\n${patientPrompt}\n\n[대화 시작]`
      },
      {
        role: 'assistant',
        content: '(환자 역할 준비 완료)'
      }
    ];

    // 이전 대화 이력 추가
    if (history.length > 0) {
      history.forEach(item => {
        messages.push({
          role: 'user',
          content: `[상담실장] ${item.counselor}`
        });
        if (item.patient) {
          messages.push({
            role: 'assistant',
            content: item.patient
          });
        }
      });
    }

    // 마지막 상담실장 메시지 추가
    const lastCounselorMessage = history[history.length - 1]?.counselor;
    if (lastCounselorMessage && !history[history.length - 1]?.patient) {
      // 이미 추가됨
    } else if (req.body.counselorMessage) {
      messages.push({
        role: 'user',
        content: `[상담실장] ${req.body.counselorMessage}`
      });
    }

    // Claude API 호출
    console.log('[roleplay-chat] Calling Claude API...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT[language] || SYSTEM_PROMPT['ko'],
      messages: messages
    });

    const patientResponse = response.content[0].text;
    console.log('[roleplay-chat] Response generated:', patientResponse.substring(0, 50) + '...');

    return res.status(200).json({
      success: true,
      patientResponse: patientResponse,
      usage: response.usage
    });

  } catch (error) {
    console.error('[roleplay-chat] Error:', error);
    console.error('[roleplay-chat] Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to generate response',
      details: error.message,
      errorType: error.constructor.name,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY
    });
  }
}
