/* =====================================
   RoleCoach AI - Common JavaScript
   세션관리, 공통함수, 유틸리티
   ===================================== */

// ============================================
// 1. Session Management (LocalStorage 기반)
// ============================================

const Session = {
  TTL: 7 * 24 * 60 * 60 * 1000, // 7일

  // 로그인
  login(userData) {
    const sessionData = {
      ...userData,
      loginTime: Date.now(),
      expiresAt: Date.now() + this.TTL
    };
    localStorage.setItem('rolecoach_session', JSON.stringify(sessionData));
    console.log('[Session] 로그인 완료:', userData);
  },

  // 세션 가져오기
  get() {
    const sessionStr = localStorage.getItem('rolecoach_session');
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr);
      // TTL 검증
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch (e) {
      console.error('[Session] 파싱 에러:', e);
      return null;
    }
  },

  // 로그아웃
  logout() {
    localStorage.removeItem('rolecoach_session');
    console.log('[Session] 로그아웃 완료');
  },

  // 로그인 여부 확인
  isLoggedIn() {
    return this.get() !== null;
  },

  // 사용자 정보 업데이트
  update(newData) {
    const session = this.get();
    if (!session) return false;

    const updated = { ...session, ...newData };
    localStorage.setItem('rolecoach_session', JSON.stringify(updated));
    return true;
  }
};

// ============================================
// 2. Page Auth Check (페이지 접근 권한)
// ============================================

function checkAuth(redirectToLogin = true) {
  const session = Session.get();

  if (!session) {
    if (redirectToLogin) {
      console.log('[Auth] 미인증 사용자 - 로그인 페이지로 이동');
      window.location.href = 'login.html';
    }
    return false;
  }

  console.log('[Auth] 인증 완료:', session.name || session.email);
  return true;
}

// ============================================
// 3. Toast Notification
// ============================================

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, duration);
}

// slideOutRight 애니메이션 추가
if (!document.querySelector('#toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// 4. Loading Spinner
// ============================================

function showLoading(containerId = 'loading-container') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="spinner"></div>';
  }
}

function hideLoading(containerId = 'loading-container') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

// ============================================
// 5. Fetch Utilities (JSON 데이터 로드)
// ============================================

async function loadJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[Fetch] JSON 로드 실패 (${url}):`, error);
    throw error;
  }
}

// ============================================
// 6. Date & Time Utilities
// ============================================

function formatDate(timestamp, format = 'YYYY-MM-DD') {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return `방금 전`;
}

// ============================================
// 7. Recording (음성 녹음)
// ============================================

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('[AudioRecorder] 녹음 시작');
      return true;
    } catch (error) {
      console.error('[AudioRecorder] 녹음 시작 실패:', error);
      showToast('마이크 권한을 허용해주세요.', 'error');
      return false;
    }
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isRecording = false;

        // 스트림 정리
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        console.log('[AudioRecorder] 녹음 완료 (size: ' + audioBlob.size + ' bytes)');
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  getRecordingTime() {
    // TODO: 녹음 시작 시간 기록 후 경과 시간 계산
    return 0;
  }
}

// ============================================
// 8. Speech Analysis (Gemini API 연동)
// ============================================

async function analyzeSpeech(audioBlob, category = 'general') {
  // TODO: Gemini API 연동하여 스피치 분석
  // 1. audioBlob을 base64로 변환
  // 2. Gemini API 호출 (프롬프트: 카테고리별 분석 기준)
  // 3. 분석 결과 반환 (필러 워드, 속도, 톤, 프레임워크 준수도 등)

  console.log('[SpeechAnalysis] 분석 시작 (category:', category, ', size:', audioBlob.size, ')');

  // Mock 데이터 (개발용)
  await sleep(2000); // 분석 시뮬레이션

  return {
    fillerWords: {
      count: 7,
      words: ['어', '음', '저기', '그러니까'],
      timestamps: [3.2, 8.5, 15.3, 22.1, 30.5, 45.2, 58.7]
    },
    speed: {
      wordsPerMinute: 145,
      rating: 'good' // slow, good, fast
    },
    tone: {
      confidence: 75,
      clarity: 82,
      energy: 68
    },
    framework: {
      category: category,
      completeness: 80,
      missingSteps: ['시사점 확대 질문']
    },
    transcript: '안녕하세요, 저희 제품에 대해 설명드리겠습니다. 어... 이 제품은 음... 고객님의 문제를 해결할 수 있습니다.',
    overallScore: 78,
    coachFeedback: 'SPIN 프레임워크의 Situation과 Problem 질문은 잘 진행하셨으나, Implication 단계가 생략되었습니다. 문제의 파급효과를 확대하는 질문을 추가하세요.'
  };
}

// ============================================
// 9. Local Storage Utilities (데이터 저장)
// ============================================

const Storage = {
  // 롤플레이 히스토리 저장
  saveRoleplayHistory(data) {
    const history = this.getRoleplayHistory();
    history.push({
      ...data,
      id: Date.now(),
      timestamp: Date.now()
    });
    localStorage.setItem('roleplay_history', JSON.stringify(history));
  },

  // 롤플레이 히스토리 가져오기
  getRoleplayHistory() {
    const historyStr = localStorage.getItem('roleplay_history');
    if (!historyStr) return [];

    try {
      return JSON.parse(historyStr);
    } catch (e) {
      console.error('[Storage] 히스토리 파싱 에러:', e);
      return [];
    }
  },

  // 특정 카테고리 히스토리 필터링
  getHistoryByCategory(category) {
    return this.getRoleplayHistory().filter(item => item.category === category);
  },

  // 통계 데이터 계산
  getStats() {
    const history = this.getRoleplayHistory();
    const totalSessions = history.length;
    const avgScore = history.reduce((sum, item) => sum + (item.score || 0), 0) / totalSessions || 0;

    const categoryCount = {};
    history.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    return {
      totalSessions,
      avgScore: Math.round(avgScore),
      categoryCount,
      lastSession: history[history.length - 1] || null
    };
  }
};

// ============================================
// 10. Utility Functions
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('클립보드에 복사되었습니다.', 'success');
  }).catch(err => {
    console.error('[Clipboard] 복사 실패:', err);
    showToast('복사 실패', 'error');
  });
}

// ============================================
// 11. Init (페이지 로드 시 공통 초기화)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[RoleCoach AI] 페이지 로드 완료');

  // 세션 상태 로그
  const session = Session.get();
  if (session) {
    console.log('[Session] 활성 세션:', session.name || session.email);
  } else {
    console.log('[Session] 비로그인 상태');
  }

  // 전역 에러 핸들러
  window.addEventListener('error', (event) => {
    console.error('[GlobalError]', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledRejection]', event.reason);
  });
});

// ============================================
// Export for ES6 Modules (optional)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Session,
    checkAuth,
    showToast,
    loadJSON,
    formatDate,
    timeAgo,
    AudioRecorder,
    analyzeSpeech,
    Storage
  };
}
