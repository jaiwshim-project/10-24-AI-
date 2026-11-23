const admissionsProfiles = {
  inquiry: {
    opening: '학교 수업이나 동아리에서 스스로 질문을 정해 탐구했던 경험을 말씀해 주세요.',
    criteria: {
      problem: 'The inquiry question and what prompted it.',
      reasoning: 'Why the student chose the inquiry approach or source.',
      action: 'Research, analysis, experimentation or other work the student personally performed.',
      outcome: 'A concrete finding or lesson from that inquiry, including a negative or inconclusive result.',
      verification: 'The specific observation, measurement, source or comparison supporting that finding.',
      transfer: 'How the inquiry connects to the intended field or a specific next question the student wants to explore.'
    },
    questions: {
      problem: '어떤 궁금증에서 탐구를 시작했나요?',
      reasoning: '그 방법으로 탐구하기로 한 이유는 무엇인가요?',
      action: '그 탐구에서 본인이 직접 맡아서 한 일은 무엇인가요?',
      outcome: '탐구를 통해 무엇을 발견하거나 새롭게 배웠나요?',
      verification: '어떤 자료나 관찰이 그 결론을 뒷받침했나요?',
      transfer: '전공 공부를 시작하면 이 경험에서 어떤 질문을 더 탐구하고 싶나요?'
    }
  },
  motivation: {
    opening: '지원하려는 전공은 무엇이고, 어떤 경험이 지원 결정을 이끌었나요?',
    criteria: {
      problem: 'The specific question or interest that led the student toward their intended field.',
      reasoning: 'Why the intended field fits that interest or experience.',
      transfer: 'A specific subject, project or question the student wants to pursue after entering the program.'
    },
    questions: {
      problem: '어떤 구체적인 경험이나 궁금증이 그 전공에 관심을 갖게 했나요?',
      reasoning: '그 관심을 이어가는 데 이 전공이 적합하다고 생각한 이유는 무엇인가요?',
      transfer: '입학 후 우선 공부하거나 탐구하고 싶은 주제는 무엇인가요?'
    }
  },
  passage: {
    opening: '제시문입니다. 한 학교가 AI의 과제 활용을 허용하되, 학생에게 사용 과정과 검토 내용을 함께 제출하도록 했습니다. 이 정책에 대한 의견과 그 이유를 말씀해 주세요.',
    criteria: {
      problem: 'A clear explanation of the issue or tradeoff in the passage.',
      reasoning: 'A reasoned position that connects a claim to a relevant consideration.',
      verification: 'A concrete detail from the passage, a realistic example, or an observation used to support the position. Do not require the student to report a personal outcome.',
      transfer: 'A practical implication, condition, or way to apply the proposed approach.'
    },
    questions: {
      problem: '이 제시문에서 학교가 풀어야 할 핵심 문제는 무엇인가요?',
      reasoning: '그 입장을 선택한 가장 중요한 이유는 무엇인가요?',
      verification: '제시문의 어떤 내용이나 구체적인 예가 그 주장을 뒷받침하나요?',
      transfer: '그 방안을 실제 학교에 적용한다면 어떤 조건이 필요할까요?'
    }
  }
};

export function getAdmissionsProfile(key) {
  return typeof key === 'string' && Object.hasOwn(admissionsProfiles, key) ? admissionsProfiles[key] : null;
}
