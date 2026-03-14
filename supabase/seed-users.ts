// ============================================================
// Supabase Auth 사용자 시드 스크립트
// 실행: npx tsx supabase/seed-users.ts
//
// 사전 조건:
// 1. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
// 2. Supabase Dashboard > Authentication > Settings에서
//    "Enable email confirmations" OFF (개발 환경)
// 3. 001_initial_schema.sql 실행 완료
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Dashboard > Settings > API > service_role key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정하세요.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: string;
  skills: string[];
  bio: string;
  hackathons: string[];
  teams: { teamCode: string; teamName: string; hackathonSlug: string; role: string }[];
  stats: { hackathonsJoined: number; teamsCreated: number; submissions: number; totalScore: number };
}

const SEED_USERS: SeedUser[] = [
  // Admin
  {
    email: "kuma@dacon.io", password: "kuma1234", name: "Admin", role: "admin",
    skills: ["TypeScript", "React", "Next.js", "Python", "Data Analysis"],
    bio: "DACON Platform 관리자 계정입니다.",
    hackathons: ["daker-handover-2026-03", "data-viz-hackathon-2026"],
    teams: [{ teamCode: "T-KUMA-TEAM", teamName: "Team Admin", hackathonSlug: "daker-handover-2026-03", role: "팀장" }],
    stats: { hackathonsJoined: 2, teamsCreated: 1, submissions: 3, totalScore: 156.8 },
  },
  // Demo
  {
    email: "demo@dacon.io", password: "demo1234", name: "User_1", role: "user",
    skills: [], bio: "",
    hackathons: [], teams: [],
    stats: { hackathonsJoined: 0, teamsCreated: 0, submissions: 0, totalScore: 0 },
  },
  // Team Alpha
  { email: "seojun@dacon.io", password: "user1234", name: "김서준", role: "user", skills: ["Python", "PyTorch", "ML"], bio: "ML 엔지니어", hackathons: ["aimers-8-model-lite"], teams: [{ teamCode: "T-ALPHA", teamName: "Team Alpha", hackathonSlug: "aimers-8-model-lite", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 74.21 } },
  { email: "haeun@dacon.io", password: "user1234", name: "이하은", role: "user", skills: ["Python", "TensorFlow"], bio: "딥러닝 연구자", hackathons: ["aimers-8-model-lite"], teams: [{ teamCode: "T-ALPHA", teamName: "Team Alpha", hackathonSlug: "aimers-8-model-lite", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 1, totalScore: 74.21 } },
  { email: "minjae@dacon.io", password: "user1234", name: "박민재", role: "user", skills: ["C++", "ONNX", "vLLM"], bio: "추론 최적화 엔지니어", hackathons: ["aimers-8-model-lite"], teams: [{ teamCode: "T-ALPHA", teamName: "Team Alpha", hackathonSlug: "aimers-8-model-lite", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 1, totalScore: 74.21 } },
  // PromptRunners
  { email: "yujin@dacon.io", password: "user1234", name: "정유진", role: "user", skills: ["React", "UX Design", "Prompt Engineering"], bio: "프론트엔드 + 프롬프트 엔지니어", hackathons: ["monthly-vibe-coding-2026-02"], teams: [{ teamCode: "T-BETA", teamName: "PromptRunners", hackathonSlug: "monthly-vibe-coding-2026-02", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 91.5 } },
  // 404found
  { email: "yerin@dacon.io", password: "user1234", name: "최예린", role: "user", skills: ["Next.js", "TypeScript", "Tailwind"], bio: "풀스택 개발자", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-01", teamName: "404found", hackathonSlug: "daker-handover-2026-03", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 0, totalScore: 0 } },
  { email: "doyun@dacon.io", password: "user1234", name: "한도윤", role: "user", skills: ["React", "Figma"], bio: "프론트엔드 개발자 겸 디자이너", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-01", teamName: "404found", hackathonSlug: "daker-handover-2026-03", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { email: "seoyeon@dacon.io", password: "user1234", name: "오서연", role: "user", skills: ["Node.js", "PostgreSQL"], bio: "백엔드 개발자", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-01", teamName: "404found", hackathonSlug: "daker-handover-2026-03", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  // LGTM
  { email: "jiho@dacon.io", password: "user1234", name: "신지호", role: "user", skills: ["PM", "Notion", "Agile"], bio: "프로젝트 매니저", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-02", teamName: "LGTM", hackathonSlug: "daker-handover-2026-03", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 0, totalScore: 0 } },
  { email: "harin@dacon.io", password: "user1234", name: "강하린", role: "user", skills: ["React", "Vue"], bio: "프론트엔드 개발자", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-02", teamName: "LGTM", hackathonSlug: "daker-handover-2026-03", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { email: "taeyang@dacon.io", password: "user1234", name: "윤태양", role: "user", skills: ["Spring", "Java"], bio: "백엔드 개발자", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-02", teamName: "LGTM", hackathonSlug: "daker-handover-2026-03", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { email: "sua@dacon.io", password: "user1234", name: "임수아", role: "user", skills: ["Figma", "UI/UX"], bio: "UI/UX 디자이너", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-02", teamName: "LGTM", hackathonSlug: "daker-handover-2026-03", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { email: "eunwoo@dacon.io", password: "user1234", name: "조은우", role: "user", skills: ["Docker", "AWS", "DevOps"], bio: "인프라 엔지니어", hackathons: ["daker-handover-2026-03"], teams: [{ teamCode: "T-HANDOVER-02", teamName: "LGTM", hackathonSlug: "daker-handover-2026-03", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  // LangChain Wizards
  { email: "juwon@dacon.io", password: "user1234", name: "배주원", role: "user", skills: ["LangChain", "Python", "Next.js"], bio: "AI 앱 개발자", hackathons: ["genai-app-challenge-2026"], teams: [{ teamCode: "T-GENAI-01", teamName: "LangChain Wizards", hackathonSlug: "genai-app-challenge-2026", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 0, totalScore: 0 } },
  { email: "sihyun@dacon.io", password: "user1234", name: "류시현", role: "user", skills: ["FastAPI", "RAG", "Vector DB"], bio: "MLOps & RAG 전문가", hackathons: ["genai-app-challenge-2026"], teams: [{ teamCode: "T-GENAI-01", teamName: "LangChain Wizards", hackathonSlug: "genai-app-challenge-2026", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  // ChartMasters
  { email: "chaewon@dacon.io", password: "user1234", name: "송채원", role: "user", skills: ["D3.js", "React", "Data Viz"], bio: "데이터 시각화 전문", hackathons: ["data-viz-hackathon-2026"], teams: [{ teamCode: "T-DATAVIZ-01", teamName: "ChartMasters", hackathonSlug: "data-viz-hackathon-2026", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 88.2 } },
  { email: "hayul@dacon.io", password: "user1234", name: "문하율", role: "user", skills: ["Figma", "Illustrator", "CSS"], bio: "비주얼 디자이너", hackathons: ["data-viz-hackathon-2026"], teams: [{ teamCode: "T-DATAVIZ-01", teamName: "ChartMasters", hackathonSlug: "data-viz-hackathon-2026", role: "팀원" }], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 1, totalScore: 88.2 } },
  // DataStorytellers
  { email: "seoyun@dacon.io", password: "user1234", name: "양서윤", role: "user", skills: ["Python", "Plotly", "Storytelling"], bio: "데이터 스토리텔러", hackathons: ["data-viz-hackathon-2026"], teams: [{ teamCode: "T-DATAVIZ-02", teamName: "DataStorytellers", hackathonSlug: "data-viz-hackathon-2026", role: "팀장" }], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 82.7 } },
];

// 팀 시드 데이터
const SEED_TEAMS = [
  { teamCode: "T-KUMA-TEAM", hackathonSlug: "daker-handover-2026-03", name: "Team Admin", isOpen: true, joinPolicy: "auto", lookingFor: ["Frontend", "Designer", "Backend"], intro: "긴급 인수인계 해커톤에서 명세서 기반 웹서비스를 구현하는 팀입니다." },
  { teamCode: "T-ALPHA", hackathonSlug: "aimers-8-model-lite", name: "Team Alpha", isOpen: true, joinPolicy: "approval", lookingFor: ["Backend", "ML Engineer"], intro: "추론 최적화/경량화 실험을 함께 진행할 팀원을 찾습니다." },
  { teamCode: "T-BETA", hackathonSlug: "monthly-vibe-coding-2026-02", name: "PromptRunners", isOpen: true, joinPolicy: "auto", lookingFor: ["Frontend", "Designer"], intro: "프롬프트 품질 점수화 + 개선 가이드 UX를 기획합니다." },
  { teamCode: "T-HANDOVER-01", hackathonSlug: "daker-handover-2026-03", name: "404found", isOpen: true, joinPolicy: "approval", lookingFor: ["Frontend", "Designer"], intro: "명세서 기반으로 기본 기능을 빠르게 완성합니다." },
  { teamCode: "T-HANDOVER-02", hackathonSlug: "daker-handover-2026-03", name: "LGTM", isOpen: false, joinPolicy: "approval", lookingFor: [], intro: "기획서-구현-문서화를 깔끔하게 맞추는 방향으로 진행합니다." },
  { teamCode: "T-GENAI-01", hackathonSlug: "genai-app-challenge-2026", name: "LangChain Wizards", isOpen: true, joinPolicy: "auto", lookingFor: ["Backend", "ML Engineer", "Frontend"], intro: "LangChain + Next.js로 AI 채팅 서비스를 만들고 있습니다." },
  { teamCode: "T-DATAVIZ-01", hackathonSlug: "data-viz-hackathon-2026", name: "ChartMasters", isOpen: true, joinPolicy: "auto", lookingFor: ["Designer", "Frontend"], intro: "D3.js와 공공 데이터 API를 활용한 인터랙티브 대시보드를 만듭니다." },
  { teamCode: "T-DATAVIZ-02", hackathonSlug: "data-viz-hackathon-2026", name: "DataStorytellers", isOpen: true, joinPolicy: "auto", lookingFor: ["Backend", "Designer"], intro: "데이터 스토리텔링에 집중합니다." },
];

async function seedUsers() {
  console.log("🌱 Seeding users...\n");
  const userIdMap = new Map<string, string>(); // email → uuid

  for (const u of SEED_USERS) {
    // 1. Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        // 이미 존재하면 ID 조회
        const { data: existing } = await supabase.auth.admin.listUsers();
        const found = existing.users.find(eu => eu.email === u.email);
        if (found) {
          userIdMap.set(u.email, found.id);
          console.log(`  ⏭️  ${u.name} (${u.email}) — already exists`);
        }
        continue;
      }
      console.error(`  ❌ ${u.name}: ${error.message}`);
      continue;
    }

    const userId = data.user.id;
    userIdMap.set(u.email, userId);
    console.log(`  ✅ ${u.name} (${u.email}) → ${userId}`);

    // 2. Update profile (trigger already created basic profile)
    await supabase.from("profiles").update({
      bio: u.bio,
      skills: u.skills,
      hackathons_joined: u.stats.hackathonsJoined,
      teams_created: u.stats.teamsCreated,
      submissions_count: u.stats.submissions,
      total_score: u.stats.totalScore,
    }).eq("id", userId);

    // 3. Add hackathon participations
    for (const slug of u.hackathons) {
      await supabase.from("hackathon_participants").upsert(
        { hackathon_slug: slug, user_id: userId },
        { onConflict: "hackathon_slug,user_id" }
      );
    }

    // 4. Add badges
    if (u.stats.hackathonsJoined > 0) {
      await supabase.from("badges").insert({
        user_id: userId, name: "첫 참가", emoji: "🎉", description: "첫 해커톤에 참가했습니다",
      });
    }
    if (u.stats.teamsCreated > 0) {
      await supabase.from("badges").insert({
        user_id: userId, name: "팀 리더", emoji: "👑", description: "팀을 처음 생성했습니다",
      });
    }
    if (u.stats.submissions > 0) {
      await supabase.from("badges").insert({
        user_id: userId, name: "첫 제출", emoji: "📤", description: "첫 결과물을 제출했습니다",
      });
    }
  }

  // 5. Seed teams
  console.log("\n🌱 Seeding teams...\n");
  for (const t of SEED_TEAMS) {
    const creatorUser = SEED_USERS.find(u =>
      u.teams.some(tm => tm.teamCode === t.teamCode && tm.role === "팀장")
    );
    const creatorId = creatorUser ? userIdMap.get(creatorUser.email) : null;

    const { error } = await supabase.from("teams").upsert({
      team_code: t.teamCode,
      hackathon_slug: t.hackathonSlug,
      name: t.name,
      is_open: t.isOpen,
      join_policy: t.joinPolicy,
      looking_for: t.lookingFor,
      intro: t.intro,
      creator_id: creatorId,
    }, { onConflict: "team_code" });

    if (error) {
      console.error(`  ❌ Team ${t.name}: ${error.message}`);
      continue;
    }
    console.log(`  ✅ Team ${t.name} (${t.teamCode})`);

    // 6. Seed team members
    const members = SEED_USERS.filter(u => u.teams.some(tm => tm.teamCode === t.teamCode));
    for (const m of members) {
      const memberId = userIdMap.get(m.email);
      if (!memberId) continue;
      const teamInfo = m.teams.find(tm => tm.teamCode === t.teamCode)!;
      await supabase.from("team_members").upsert({
        team_code: t.teamCode,
        user_id: memberId,
        name: m.name,
        role: teamInfo.role,
      }, { onConflict: "team_code,user_id" });
    }
  }

  console.log("\n✅ Seed complete!");
}

seedUsers().catch(console.error);
