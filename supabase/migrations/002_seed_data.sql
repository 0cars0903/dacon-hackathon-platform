-- ============================================================
-- DACON Hackathon Platform — Seed Data
-- Supabase Dashboard SQL Editor에서 실행
--
-- 주의: auth.users 는 Supabase Auth API로 생성해야 합니다.
-- 이 스크립트는 hackathons, hackathon_details, leaderboards 등
-- auth에 의존하지 않는 공개 데이터만 시드합니다.
--
-- 사용자 시드는 002_seed_users.ts (서버 스크립트)를 사용하세요.
-- ============================================================

-- ============================================================
-- HACKATHONS
-- ============================================================
INSERT INTO public.hackathons (slug, title, status, tags, thumbnail_url, timezone, submission_deadline_at, end_at)
VALUES
  ('daker-handover-2026-03', '긴급 인수인계 해커톤', 'ongoing',
   ARRAY['Web', 'Next.js', 'TypeScript', 'AI', '인수인계'],
   '/images/hackathon-01.png', 'Asia/Seoul',
   '2026-03-21T23:59:00+09:00', '2026-03-28T23:59:00+09:00'),

  ('aimers-8-model-lite', 'AIMERS 8기: 모델 경량화 챌린지', 'ongoing',
   ARRAY['AI', 'ML', 'Model Optimization', 'ONNX'],
   '/images/hackathon-02.png', 'Asia/Seoul',
   '2026-03-25T23:59:00+09:00', '2026-03-31T23:59:00+09:00'),

  ('monthly-vibe-coding-2026-02', '월간 바이브 코딩: Prompt-to-App', 'ended',
   ARRAY['Vibe Coding', 'AI', 'LLM', 'React'],
   '/images/hackathon-03.png', 'Asia/Seoul',
   '2026-02-28T23:59:00+09:00', '2026-03-07T23:59:00+09:00'),

  ('genai-app-challenge-2026', 'GenAI 앱 개발 챌린지', 'upcoming',
   ARRAY['GenAI', 'LangChain', 'RAG', 'Chatbot', 'Next.js'],
   '/images/hackathon-04.png', 'Asia/Seoul',
   '2026-04-15T23:59:00+09:00', '2026-04-30T23:59:00+09:00'),

  ('data-viz-hackathon-2026', '공공 데이터 시각화 해커톤', 'ongoing',
   ARRAY['Data Visualization', 'D3.js', 'Public Data', 'Dashboard'],
   '/images/hackathon-05.png', 'Asia/Seoul',
   '2026-03-20T23:59:00+09:00', '2026-03-27T23:59:00+09:00')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- HACKATHON DETAILS (JSON sections)
-- ============================================================
INSERT INTO public.hackathon_details (slug, sections)
VALUES
  ('daker-handover-2026-03', '{
    "overview": {
      "summary": "긴급 인수인계 시나리오에서 기존 코드베이스를 분석하고 빠르게 기능을 확장하는 해커톤입니다.",
      "teamPolicy": {"allowSolo": true, "maxTeamSize": 5}
    },
    "info": {
      "notice": ["기존 코드베이스가 제공됩니다.", "명세서 기반으로 기능을 확장해야 합니다."],
      "links": {"rules": "/hackathons/daker-handover-2026-03/rules", "faq": "/hackathons/daker-handover-2026-03/faq"}
    },
    "eval": {
      "metricName": "Weighted Score",
      "description": "기능 완성도(40%) + 코드 품질(30%) + UI/UX(20%) + 문서화(10%)"
    },
    "schedule": {
      "timezone": "Asia/Seoul",
      "milestones": [
        {"name": "코드베이스 배포", "at": "2026-03-04T10:00:00+09:00"},
        {"name": "중간 제출", "at": "2026-03-14T23:59:00+09:00"},
        {"name": "최종 제출", "at": "2026-03-21T23:59:00+09:00"},
        {"name": "결과 발표", "at": "2026-03-28T14:00:00+09:00"}
      ]
    },
    "prize": {
      "items": [
        {"place": "1등", "amountKRW": 3000000},
        {"place": "2등", "amountKRW": 2000000},
        {"place": "3등", "amountKRW": 1000000}
      ]
    },
    "teams": {"campEnabled": true, "listUrl": "/hackathons/daker-handover-2026-03/teams"},
    "submit": {
      "allowedArtifactTypes": ["code", "document"],
      "submissionUrl": "/hackathons/daker-handover-2026-03/submit",
      "guide": ["GitHub 저장소 URL을 제출하세요.", "README.md에 실행 방법을 포함해주세요."]
    },
    "leaderboard": {
      "publicLeaderboardUrl": "/hackathons/daker-handover-2026-03/leaderboard",
      "note": "중간 제출 후 리더보드가 공개됩니다."
    }
  }'::jsonb),

  ('aimers-8-model-lite', '{
    "overview": {
      "summary": "사전 학습된 LLM을 경량화하여 제한된 하드웨어에서 최적의 성능을 달성하는 챌린지입니다.",
      "teamPolicy": {"allowSolo": true, "maxTeamSize": 3}
    },
    "info": {
      "notice": ["GPU 사용량 제한: T4 1장", "평가 시 추론 시간 60초 이내"],
      "links": {"rules": "", "faq": ""}
    },
    "eval": {
      "metricName": "F1-Score (Weighted)",
      "description": "모델 정확도와 추론 속도를 종합 평가합니다.",
      "limits": {"maxRuntimeSec": 60, "maxSubmissionsPerDay": 5}
    },
    "schedule": {
      "timezone": "Asia/Seoul",
      "milestones": [
        {"name": "대회 시작", "at": "2026-02-15T10:00:00+09:00"},
        {"name": "최종 제출", "at": "2026-03-25T23:59:00+09:00"},
        {"name": "결과 발표", "at": "2026-03-31T14:00:00+09:00"}
      ]
    },
    "prize": {
      "items": [
        {"place": "1등", "amountKRW": 5000000},
        {"place": "2등", "amountKRW": 3000000},
        {"place": "3등", "amountKRW": 1000000}
      ]
    },
    "teams": {"campEnabled": true, "listUrl": "/hackathons/aimers-8-model-lite/teams"},
    "submit": {
      "allowedArtifactTypes": ["model", "code"],
      "submissionUrl": "/hackathons/aimers-8-model-lite/submit",
      "guide": ["모델 파일(.onnx 또는 .pt)을 업로드하세요.", "추론 스크립트를 함께 제출해주세요."]
    },
    "leaderboard": {
      "publicLeaderboardUrl": "/hackathons/aimers-8-model-lite/leaderboard",
      "note": "일일 최대 5회 제출 가능합니다."
    }
  }'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- LEADERBOARDS
-- ============================================================
INSERT INTO public.leaderboards (hackathon_slug, eval_type, metric_name, entries, updated_at)
VALUES
  ('aimers-8-model-lite', 'metric', 'F1-Score (Weighted)',
   '[
     {"rank":1,"teamName":"Team Alpha","score":74.21,"submittedAt":"2026-03-10T14:23:00+09:00"},
     {"rank":2,"teamName":"Gamma Squad","score":70.13,"submittedAt":"2026-03-10T15:45:00+09:00"},
     {"rank":3,"teamName":"NeuralCrunch","score":68.45,"submittedAt":"2026-03-09T22:10:00+09:00"},
     {"rank":4,"teamName":"QuantizeMe","score":65.80,"submittedAt":"2026-03-08T18:30:00+09:00"},
     {"rank":5,"teamName":"SlimAI","score":62.10,"submittedAt":"2026-03-11T09:05:00+09:00"}
   ]'::jsonb, now()),

  ('monthly-vibe-coding-2026-02', 'judge', 'Judge Score',
   '[
     {"rank":1,"teamName":"PromptRunners","score":91.5,"submittedAt":"2026-02-28T23:50:00+09:00","scoreBreakdown":{"participant":80,"judge":95}},
     {"rank":2,"teamName":"AIFlowBuilders","score":85.3,"submittedAt":"2026-02-28T22:30:00+09:00","scoreBreakdown":{"participant":78,"judge":88}},
     {"rank":3,"teamName":"CopilotCrew","score":79.8,"submittedAt":"2026-02-27T16:00:00+09:00","scoreBreakdown":{"participant":75,"judge":82}}
   ]'::jsonb, now()),

  ('data-viz-hackathon-2026', 'metric', 'Visualization Score',
   '[
     {"rank":1,"teamName":"ChartMasters","score":88.2,"submittedAt":"2026-03-12T20:00:00+09:00"},
     {"rank":2,"teamName":"DataStorytellers","score":82.7,"submittedAt":"2026-03-13T11:30:00+09:00"},
     {"rank":3,"teamName":"VizWizards","score":76.4,"submittedAt":"2026-03-11T14:00:00+09:00"},
     {"rank":4,"teamName":"InsightLab","score":71.1,"submittedAt":"2026-03-12T09:00:00+09:00"}
   ]'::jsonb, now())
ON CONFLICT (hackathon_slug) DO NOTHING;

-- ============================================================
-- ACTIVITY FEED (seed events)
-- ============================================================
INSERT INTO public.activity_feed (type, message, hackathon_slug, created_at)
VALUES
  ('hackathon_created', '새로운 해커톤 "긴급 인수인계 해커톤"이 개설되었습니다.', 'daker-handover-2026-03', '2026-03-04T10:00:00+09:00'),
  ('team_created', '팀 "404found"이 긴급 인수인계 해커톤에서 생성되었습니다.', 'daker-handover-2026-03', '2026-03-04T11:00:00+09:00'),
  ('submission', '팀 "Team Alpha"가 모델 경량화 챌린지에 결과를 제출했습니다.', 'aimers-8-model-lite', '2026-03-10T14:23:00+09:00'),
  ('ranking_update', '모델 경량화 챌린지 리더보드가 업데이트되었습니다. 1위: Team Alpha (74.21)', 'aimers-8-model-lite', '2026-03-10T14:30:00+09:00'),
  ('team_created', '팀 "LangChain Wizards"가 GenAI 앱 챌린지에서 생성되었습니다.', 'genai-app-challenge-2026', '2026-03-10T14:00:00+09:00'),
  ('ranking_update', '데이터 시각화 해커톤 리더보드가 업데이트되었습니다. 1위: ChartMasters (88.2)', 'data-viz-hackathon-2026', '2026-03-13T12:00:00+09:00');
