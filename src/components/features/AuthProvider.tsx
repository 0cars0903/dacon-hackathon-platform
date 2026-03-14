"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { UserProfile, UserBadge } from "@/types";
import { getHackathons, logActivity, addNotification } from "@/lib/data";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

interface NicknameChangeResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getProfile: (userId?: string) => UserProfile | null;
  getAllProfiles: () => UserProfile[];
  updateProfile: (updates: Partial<UserProfile>) => void;
  changeNickname: (newNickname: string) => NicknameChangeResult;
  addBadge: (badge: UserBadge) => void;
  joinHackathon: (hackathonSlug: string) => void;
  // 관리자 기능
  isAdmin: boolean;
  deleteUser: (userId: string) => boolean;
  updateUserRole: (userId: string, role: "user" | "admin") => boolean;
  adminUpdateProfile: (userId: string, updates: Partial<UserProfile>) => boolean;
  getAllUsers: () => Array<{ id: string; name: string; email: string; role: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "dacon_auth";
const USERS_KEY = "dacon_users";
const PROFILES_KEY = "dacon_profiles";

// MVP 검증용 기본 계정
const MVP_ACCOUNT = {
  id: "mvp-user-kuma",
  name: "Admin",
  email: "kuma@dacon.io",
  password: "kuma1234",
  role: "admin" as const,
};

const DEMO_ACCOUNT = {
  id: "demo-user",
  name: "User_1",
  email: "demo@dacon.io",
  password: "demo1234",
  role: "user" as const,
};

const MVP_PROFILE: UserProfile = {
  id: "mvp-user-kuma",
  name: "Admin",
  nickname: "Admin",
  nicknameChangedAt: "2026-03-01T10:00:00+09:00",
  email: "kuma@dacon.io",
  role: "admin",
  bio: "DACON Platform 관리자 계정입니다. 해커톤 운영 및 플랫폼 관리를 담당합니다.",
  skills: ["TypeScript", "React", "Next.js", "Python", "Data Analysis"],
  joinedAt: "2026-03-01T10:00:00+09:00",
  stats: {
    hackathonsJoined: 2,
    teamsCreated: 1,
    submissions: 3,
    totalScore: 156.8,
  },
  badges: [
    { id: "b-first-join", name: "첫 참가", emoji: "🎉", description: "첫 해커톤에 참가했습니다", earnedAt: "2026-03-04T10:00:00+09:00" },
    { id: "b-team-leader", name: "팀 리더", emoji: "👑", description: "팀을 처음 생성했습니다", earnedAt: "2026-03-05T11:00:00+09:00" },
    { id: "b-first-submit", name: "첫 제출", emoji: "📤", description: "첫 결과물을 제출했습니다", earnedAt: "2026-03-06T14:00:00+09:00" },
  ],
  joinedHackathons: ["daker-handover-2026-03", "data-viz-hackathon-2026"],
  teamMemberships: ["T-KUMA-TEAM"],
};

const DEMO_PROFILE: UserProfile = {
  id: "demo-user",
  name: "User_1",
  nickname: "User_1",
  email: "demo@dacon.io",
  role: "user",
  bio: "",
  skills: [],
  joinedAt: "2026-03-10T10:00:00+09:00",
  stats: { hackathonsJoined: 0, teamsCreated: 0, submissions: 0, totalScore: 0 },
  badges: [
    { id: "b-welcome-demo", name: "환영합니다", emoji: "👋", description: "DACON Platform에 가입했습니다", earnedAt: "2026-03-10T10:00:00+09:00" },
  ],
  joinedHackathons: [],
  teamMemberships: [],
};

// =============================================
// 시드 유저 데이터: teams.json & leaderboard.json에 등장하는 모든 유저
// =============================================
interface SeedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  skills: string[];
  bio: string;
  hackathons: string[];
  teams: string[];
  stats: { hackathonsJoined: number; teamsCreated: number; submissions: number; totalScore: number };
}

const SEED_USERS: SeedUser[] = [
  // --- Team Alpha (aimers-8-model-lite) ---
  { id: "user-alpha-1", name: "김서준", email: "seojun@dacon.io", password: "user1234", skills: ["Python", "PyTorch", "ML"], bio: "ML 엔지니어. 모델 경량화 전문.", hackathons: ["aimers-8-model-lite"], teams: ["T-ALPHA"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 74.21 } },
  { id: "user-alpha-2", name: "이하은", email: "haeun@dacon.io", password: "user1234", skills: ["Python", "TensorFlow"], bio: "딥러닝 연구자.", hackathons: ["aimers-8-model-lite"], teams: ["T-ALPHA"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 1, totalScore: 74.21 } },
  { id: "user-alpha-3", name: "박민재", email: "minjae@dacon.io", password: "user1234", skills: ["C++", "ONNX", "vLLM"], bio: "추론 최적화 엔지니어.", hackathons: ["aimers-8-model-lite"], teams: ["T-ALPHA"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 1, totalScore: 74.21 } },
  // --- PromptRunners (monthly-vibe-coding) ---
  { id: "user-beta-1", name: "정유진", email: "yujin@dacon.io", password: "user1234", skills: ["React", "UX Design", "Prompt Engineering"], bio: "프론트엔드 + 프롬프트 엔지니어.", hackathons: ["monthly-vibe-coding-2026-02"], teams: ["T-BETA"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 91.5 } },
  // --- 404found (daker-handover) ---
  { id: "user-handover-1", name: "최예린", email: "yerin@dacon.io", password: "user1234", skills: ["Next.js", "TypeScript", "Tailwind"], bio: "풀스택 개발자.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-01"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 0, totalScore: 0 } },
  { id: "user-handover-2", name: "한도윤", email: "doyun@dacon.io", password: "user1234", skills: ["React", "Figma"], bio: "프론트엔드 개발자 겸 디자이너.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-01"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { id: "user-handover-3", name: "오서연", email: "seoyeon@dacon.io", password: "user1234", skills: ["Node.js", "PostgreSQL"], bio: "백엔드 개발자.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-01"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  // --- LGTM (daker-handover) ---
  { id: "user-lgtm-1", name: "신지호", email: "jiho@dacon.io", password: "user1234", skills: ["PM", "Notion", "Agile"], bio: "프로젝트 매니저. 기획서 전문.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-02"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 0, totalScore: 0 } },
  { id: "user-lgtm-2", name: "강하린", email: "harin@dacon.io", password: "user1234", skills: ["React", "Vue"], bio: "프론트엔드 개발자.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-02"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { id: "user-lgtm-3", name: "윤태양", email: "taeyang@dacon.io", password: "user1234", skills: ["Spring", "Java"], bio: "백엔드 개발자.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-02"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { id: "user-lgtm-4", name: "임수아", email: "sua@dacon.io", password: "user1234", skills: ["Figma", "UI/UX"], bio: "UI/UX 디자이너.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-02"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  { id: "user-lgtm-5", name: "조은우", email: "eunwoo@dacon.io", password: "user1234", skills: ["Docker", "AWS", "DevOps"], bio: "인프라 엔지니어.", hackathons: ["daker-handover-2026-03"], teams: ["T-HANDOVER-02"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  // --- LangChain Wizards (genai-app) ---
  { id: "user-genai-1", name: "배주원", email: "juwon@dacon.io", password: "user1234", skills: ["LangChain", "Python", "Next.js"], bio: "AI 앱 개발자.", hackathons: ["genai-app-challenge-2026"], teams: ["T-GENAI-01"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 0, totalScore: 0 } },
  { id: "user-genai-2", name: "류시현", email: "sihyun@dacon.io", password: "user1234", skills: ["FastAPI", "RAG", "Vector DB"], bio: "MLOps & RAG 전문가.", hackathons: ["genai-app-challenge-2026"], teams: ["T-GENAI-01"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 0, totalScore: 0 } },
  // --- ChartMasters (data-viz) ---
  { id: "user-chart-1", name: "송채원", email: "chaewon@dacon.io", password: "user1234", skills: ["D3.js", "React", "Data Viz"], bio: "데이터 시각화 전문 프론트엔드.", hackathons: ["data-viz-hackathon-2026"], teams: ["T-DATAVIZ-01"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 88.2 } },
  { id: "user-chart-2", name: "문하율", email: "hayul@dacon.io", password: "user1234", skills: ["Figma", "Illustrator", "CSS"], bio: "비주얼 디자이너.", hackathons: ["data-viz-hackathon-2026"], teams: ["T-DATAVIZ-01"], stats: { hackathonsJoined: 1, teamsCreated: 0, submissions: 1, totalScore: 88.2 } },
  // --- DataStorytellers (data-viz) ---
  { id: "user-story-1", name: "양서윤", email: "seoyun@dacon.io", password: "user1234", skills: ["Python", "Plotly", "Storytelling"], bio: "데이터 스토리텔러.", hackathons: ["data-viz-hackathon-2026"], teams: ["T-DATAVIZ-02"], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 82.7 } },
  // --- 리더보드 전용 팀 (teams.json에 없는 팀들의 대표 유저) ---
  { id: "user-gamma-1", name: "권지민", email: "jimin@dacon.io", password: "user1234", skills: ["PyTorch", "Quantization"], bio: "모델 최적화 연구.", hackathons: ["aimers-8-model-lite"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 70.13 } },
  { id: "user-neural-1", name: "고은서", email: "eunseo@dacon.io", password: "user1234", skills: ["TensorRT", "ONNX"], bio: "추론 엔진 전문가.", hackathons: ["aimers-8-model-lite"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 68.45 } },
  { id: "user-quant-1", name: "장현우", email: "hyunwoo@dacon.io", password: "user1234", skills: ["Python", "GPTQ"], bio: "양자화 연구자.", hackathons: ["aimers-8-model-lite"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 65.80 } },
  { id: "user-slim-1", name: "이나윤", email: "nayun@dacon.io", password: "user1234", skills: ["Pruning", "Distillation"], bio: "경량화 연구.", hackathons: ["aimers-8-model-lite"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 62.10 } },
  { id: "user-aiflow-1", name: "김도현", email: "dohyun@dacon.io", password: "user1234", skills: ["LangChain", "Workflow"], bio: "AI 워크플로우 빌더.", hackathons: ["monthly-vibe-coding-2026-02"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 85.3 } },
  { id: "user-copilot-1", name: "박지윤", email: "jiyun@dacon.io", password: "user1234", skills: ["Copilot", "VSCode"], bio: "개발 도구 전문가.", hackathons: ["monthly-vibe-coding-2026-02"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 79.8 } },
  { id: "user-vizwiz-1", name: "정승현", email: "seunghyun@dacon.io", password: "user1234", skills: ["Observable", "D3.js"], bio: "시각화 마법사.", hackathons: ["data-viz-hackathon-2026"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 76.4 } },
  { id: "user-insight-1", name: "한서아", email: "seoa@dacon.io", password: "user1234", skills: ["Pandas", "Tableau"], bio: "데이터 분석가.", hackathons: ["data-viz-hackathon-2026"], teams: [], stats: { hackathonsJoined: 1, teamsCreated: 1, submissions: 1, totalScore: 71.1 } },
];

// 팀 시드 데이터 (teams.json의 팀에 멤버 정보를 연결)
const SEED_TEAMS = [
  { teamCode: "T-KUMA-TEAM", hackathonSlug: "daker-handover-2026-03", name: "Team Admin", isOpen: true, joinPolicy: "auto", memberCount: 1, lookingFor: ["Frontend", "Designer", "Backend"], intro: "긴급 인수인계 해커톤에서 명세서 기반 웹서비스를 구현하는 팀입니다.", contact: { type: "link", url: "https://open.kakao.com/o/gKumaTeam" }, createdAt: "2026-03-05T11:00:00+09:00", creatorId: "mvp-user-kuma", members: [{ userId: "mvp-user-kuma", name: "Admin", role: "팀장", joinedAt: "2026-03-05T11:00:00+09:00" }] },
  { teamCode: "T-ALPHA", hackathonSlug: "aimers-8-model-lite", name: "Team Alpha", isOpen: true, joinPolicy: "approval", memberCount: 3, lookingFor: ["Backend", "ML Engineer"], intro: "추론 최적화/경량화 실험을 함께 진행할 팀원을 찾습니다.", contact: { type: "link", url: "https://open.kakao.com/o/example1" }, createdAt: "2026-02-20T11:00:00+09:00", creatorId: "user-alpha-1", members: [{ userId: "user-alpha-1", name: "김서준", role: "팀장", joinedAt: "2026-02-20T11:00:00+09:00" }, { userId: "user-alpha-2", name: "이하은", role: "팀원", joinedAt: "2026-02-20T14:00:00+09:00" }, { userId: "user-alpha-3", name: "박민재", role: "팀원", joinedAt: "2026-02-21T09:00:00+09:00" }] },
  { teamCode: "T-BETA", hackathonSlug: "monthly-vibe-coding-2026-02", name: "PromptRunners", isOpen: true, joinPolicy: "auto", memberCount: 1, lookingFor: ["Frontend", "Designer"], intro: "프롬프트 품질 점수화 + 개선 가이드 UX를 기획합니다.", contact: { type: "link", url: "https://forms.gle/example2" }, createdAt: "2026-02-18T18:30:00+09:00", creatorId: "user-beta-1", members: [{ userId: "user-beta-1", name: "정유진", role: "팀장", joinedAt: "2026-02-18T18:30:00+09:00" }] },
  { teamCode: "T-HANDOVER-01", hackathonSlug: "daker-handover-2026-03", name: "404found", isOpen: true, joinPolicy: "approval", memberCount: 3, lookingFor: ["Frontend", "Designer"], intro: "명세서 기반으로 기본 기능을 빠르게 완성하고 UX 확장을 노립니다.", contact: { type: "link", url: "https://open.kakao.com/o/example3" }, createdAt: "2026-03-04T11:00:00+09:00", creatorId: "user-handover-1", members: [{ userId: "user-handover-1", name: "최예린", role: "팀장", joinedAt: "2026-03-04T11:00:00+09:00" }, { userId: "user-handover-2", name: "한도윤", role: "팀원", joinedAt: "2026-03-04T15:00:00+09:00" }, { userId: "user-handover-3", name: "오서연", role: "팀원", joinedAt: "2026-03-05T10:00:00+09:00" }] },
  { teamCode: "T-HANDOVER-02", hackathonSlug: "daker-handover-2026-03", name: "LGTM", isOpen: false, joinPolicy: "approval", memberCount: 5, lookingFor: [], intro: "기획서-구현-문서화를 깔끔하게 맞추는 방향으로 진행합니다.", contact: { type: "link", url: "https://forms.gle/example4" }, createdAt: "2026-03-05T09:20:00+09:00", creatorId: "user-lgtm-1", members: [{ userId: "user-lgtm-1", name: "신지호", role: "팀장", joinedAt: "2026-03-05T09:20:00+09:00" }, { userId: "user-lgtm-2", name: "강하린", role: "팀원", joinedAt: "2026-03-05T10:00:00+09:00" }, { userId: "user-lgtm-3", name: "윤태양", role: "팀원", joinedAt: "2026-03-05T11:00:00+09:00" }, { userId: "user-lgtm-4", name: "임수아", role: "팀원", joinedAt: "2026-03-05T12:00:00+09:00" }, { userId: "user-lgtm-5", name: "조은우", role: "팀원", joinedAt: "2026-03-06T09:00:00+09:00" }] },
  { teamCode: "T-GENAI-01", hackathonSlug: "genai-app-challenge-2026", name: "LangChain Wizards", isOpen: true, joinPolicy: "auto", memberCount: 2, lookingFor: ["Backend", "ML Engineer", "Frontend"], intro: "LangChain + Next.js로 AI 채팅 서비스를 만들고 있습니다.", contact: { type: "link", url: "https://open.kakao.com/o/example5" }, createdAt: "2026-03-10T14:00:00+09:00", creatorId: "user-genai-1", members: [{ userId: "user-genai-1", name: "배주원", role: "팀장", joinedAt: "2026-03-10T14:00:00+09:00" }, { userId: "user-genai-2", name: "류시현", role: "팀원", joinedAt: "2026-03-10T16:00:00+09:00" }] },
  { teamCode: "T-DATAVIZ-01", hackathonSlug: "data-viz-hackathon-2026", name: "ChartMasters", isOpen: true, joinPolicy: "auto", memberCount: 2, lookingFor: ["Designer", "Frontend"], intro: "D3.js와 공공 데이터 API를 활용한 인터랙티브 대시보드를 만듭니다.", contact: { type: "link", url: "https://forms.gle/example6" }, createdAt: "2026-03-08T10:00:00+09:00", creatorId: "user-chart-1", members: [{ userId: "user-chart-1", name: "송채원", role: "팀장", joinedAt: "2026-03-08T10:00:00+09:00" }, { userId: "user-chart-2", name: "문하율", role: "팀원", joinedAt: "2026-03-08T14:00:00+09:00" }] },
  { teamCode: "T-DATAVIZ-02", hackathonSlug: "data-viz-hackathon-2026", name: "DataStorytellers", isOpen: true, joinPolicy: "auto", memberCount: 1, lookingFor: ["Backend", "Designer"], intro: "데이터 스토리텔링에 집중합니다.", contact: { type: "link", url: "https://open.kakao.com/o/example7" }, createdAt: "2026-03-09T16:30:00+09:00", creatorId: "user-story-1", members: [{ userId: "user-story-1", name: "양서윤", role: "팀장", joinedAt: "2026-03-09T16:30:00+09:00" }] },
];

function ensureMVPData() {
  // --- 유저 계정 확보 ---
  const usersRaw = localStorage.getItem(USERS_KEY);
  const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> =
    usersRaw ? JSON.parse(usersRaw) : [];

  // 헬퍼: 유저 upsert
  const upsertUser = (acct: { id: string; name: string; email: string; password: string; role: string }) => {
    const idx = users.findIndex((u) => u.id === acct.id);
    if (idx < 0) {
      users.push(acct);
    } else {
      users[idx].name = acct.name;
      users[idx].role = acct.role;
    }
  };

  upsertUser(MVP_ACCOUNT);
  upsertUser(DEMO_ACCOUNT);
  SEED_USERS.forEach((su) => upsertUser({ id: su.id, name: su.name, email: su.email, password: su.password, role: "user" }));
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // --- 프로필 확보 ---
  const profilesRaw = localStorage.getItem(PROFILES_KEY);
  const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];

  // 헬퍼: 프로필 upsert
  const upsertProfile = (p: UserProfile) => {
    const idx = profiles.findIndex((pp) => pp.id === p.id);
    if (idx < 0) {
      profiles.push(p);
    } else {
      profiles[idx].name = p.name;
      profiles[idx].role = p.role;
      if (!profiles[idx].nickname) profiles[idx].nickname = p.nickname;
    }
  };

  upsertProfile(MVP_PROFILE);
  upsertProfile(DEMO_PROFILE);

  // 시드 유저 프로필 생성
  SEED_USERS.forEach((su) => {
    const profile: UserProfile = {
      id: su.id,
      name: su.name,
      nickname: su.name,
      email: su.email,
      role: "user",
      bio: su.bio,
      skills: su.skills,
      joinedAt: "2026-02-15T10:00:00+09:00",
      stats: su.stats,
      badges: [
        { id: `b-welcome-${su.id}`, name: "환영합니다", emoji: "👋", description: "DACON Platform에 가입했습니다", earnedAt: "2026-02-15T10:00:00+09:00" },
        ...(su.stats.hackathonsJoined > 0 ? [{ id: `b-join-${su.id}`, name: "첫 참가", emoji: "🎉", description: "첫 해커톤에 참가했습니다", earnedAt: "2026-02-20T10:00:00+09:00" }] : []),
        ...(su.stats.teamsCreated > 0 ? [{ id: `b-leader-${su.id}`, name: "팀 리더", emoji: "👑", description: "팀을 처음 생성했습니다", earnedAt: "2026-02-20T11:00:00+09:00" }] : []),
        ...(su.stats.submissions > 0 ? [{ id: `b-submit-${su.id}`, name: "첫 제출", emoji: "📤", description: "첫 결과물을 제출했습니다", earnedAt: "2026-02-25T10:00:00+09:00" }] : []),
      ],
      joinedHackathons: su.hackathons,
      teamMemberships: su.teams,
    };
    upsertProfile(profile);
  });
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

  // --- 팀 데이터 확보 (시드 팀으로 대체, 멤버 정보 포함) ---
  const teamsRaw = localStorage.getItem("dacon_teams");
  const teams: Array<{ teamCode: string; [key: string]: unknown }> = teamsRaw ? JSON.parse(teamsRaw) : [];
  SEED_TEAMS.forEach((st) => {
    const idx = teams.findIndex((t) => t.teamCode === st.teamCode);
    if (idx < 0) {
      teams.push(st);
    } else {
      // 기존 팀에 멤버 정보가 없으면 추가
      if (!teams[idx].members) {
        teams[idx].members = st.members;
        teams[idx].creatorId = st.creatorId;
      }
    }
  });
  localStorage.setItem("dacon_teams", JSON.stringify(teams));
}

function createDefaultProfile(user: { id: string; name: string; email: string; role?: string }): UserProfile {
  return {
    id: user.id,
    name: user.name,
    nickname: user.name,
    email: user.email,
    role: (user.role as "user" | "admin") || "user",
    bio: "",
    skills: [],
    joinedAt: new Date().toISOString(),
    stats: { hackathonsJoined: 0, teamsCreated: 0, submissions: 0, totalScore: 0 },
    badges: [
      { id: `b-welcome-${Date.now()}`, name: "환영합니다", emoji: "👋", description: "DACON Platform에 가입했습니다", earnedAt: new Date().toISOString() },
    ],
    joinedHackathons: [],
    teamMemberships: [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ensureMVPData();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> =
      usersRaw ? JSON.parse(usersRaw) : [];

    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      const role = (found.role as "user" | "admin") || "user";
      const userData: User = { id: found.id, name: found.name, email: found.email, role };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // 안전장치: 프로필이 없으면 자동 생성
      const profilesRaw = localStorage.getItem(PROFILES_KEY);
      const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
      if (!profiles.some((p) => p.id === found.id)) {
        profiles.push(createDefaultProfile({ id: found.id, name: found.name, email: found.email, role: found.role }));
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      }

      return true;
    }
    return false;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const users: Array<{ id: string; name: string; email: string; password: string }> =
        usersRaw ? JSON.parse(usersRaw) : [];

      if (users.some((u) => u.email === email)) return false;

      const newUser = { id: `user-${Date.now()}`, name, email, password, role: "user" as const };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // 프로필 자동 생성
      const profilesRaw = localStorage.getItem(PROFILES_KEY);
      const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
      profiles.push(createDefaultProfile(newUser));
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

      const userData: User = { id: newUser.id, name: newUser.name, email: newUser.email, role: "user" };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // 활동 로그 + 환영 알림
      logActivity({
        type: "user_signup",
        message: `${name}님이 DACON 플랫폼에 가입했습니다.`,
        timestamp: new Date().toISOString(),
      });
      addNotification(newUser.id, {
        message: "DACON 플랫폼에 오신 것을 환영합니다! 프로필을 완성하고 해커톤에 참여해보세요.",
        timestamp: new Date().toISOString(),
        type: "info",
        link: "/profile",
      });

      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getProfile = useCallback((userId?: string): UserProfile | null => {
    const targetId = userId || user?.id;
    if (!targetId) return null;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    return profiles.find((p) => p.id === targetId) || null;
  }, [user]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!user) return;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...updates };
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }
    // 이름이 변경되면 auth도 업데이트
    if (updates.name) {
      const updatedUser = { ...user, name: updates.name };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  }, [user]);

  const addBadge = useCallback((badge: UserBadge) => {
    if (!user) return;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx >= 0 && !profiles[idx].badges.some((b) => b.id === badge.id)) {
      profiles[idx].badges.push(badge);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }
  }, [user]);

  const getAllProfiles = useCallback((): UserProfile[] => {
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    return profilesRaw ? JSON.parse(profilesRaw) : [];
  }, []);

  const changeNickname = useCallback((newNickname: string): NicknameChangeResult => {
    if (!user) return { success: false, error: "로그인이 필요합니다." };
    const trimmed = newNickname.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      return { success: false, error: "닉네임은 2~20자로 입력해주세요." };
    }

    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx < 0) return { success: false, error: "프로필을 찾을 수 없습니다." };

    const profile = profiles[idx];

    // 닉네임 중복 체크
    if (profiles.some((p) => p.id !== user.id && p.nickname === trimmed)) {
      return { success: false, error: "이미 사용 중인 닉네임입니다." };
    }

    // 1달 제한 체크
    if (profile.nicknameChangedAt) {
      const lastChanged = new Date(profile.nicknameChangedAt);
      const oneMonthLater = new Date(lastChanged);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      if (new Date() < oneMonthLater) {
        const remainDays = Math.ceil((oneMonthLater.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { success: false, error: `닉네임 변경은 월 1회만 가능합니다. (${remainDays}일 후 변경 가능)` };
      }
    }

    // 해커톤 참여 중 제한 체크 — ongoing 해커톤에 참가 중이면 변경 불가
    const hackathons = getHackathons();
    const participatingOngoing = profile.joinedHackathons.some((slug: string) => {
      const h = hackathons.find((hh) => hh.slug === slug);
      return h && h.status === "ongoing";
    });
    if (participatingOngoing) {
      return { success: false, error: "진행 중인 해커톤에 참가하고 있어 닉네임을 변경할 수 없습니다." };
    }

    // 변경 적용
    profiles[idx].nickname = trimmed;
    profiles[idx].nicknameChangedAt = new Date().toISOString();
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    return { success: true };
  }, [user]);

  // === 관리자 기능 ===
  const isAdmin = user?.role === "admin";

  const getAllUsers = useCallback((): Array<{ id: string; name: string; email: string; role: string }> => {
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
    return users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role || "user" }));
  }, []);

  const deleteUser = useCallback((userId: string): boolean => {
    if (!user || user.role !== "admin") return false;
    if (userId === user.id) return false; // 자기 자신 삭제 방지

    // 유저 목록에서 제거
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) return false;
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));

    // 프로필에서 제거
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.filter((p) => p.id !== userId)));

    return true;
  }, [user]);

  const updateUserRole = useCallback((userId: string, role: "user" | "admin"): boolean => {
    if (!user || user.role !== "admin") return false;

    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Array<{ id: string; name: string; email: string; password: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    users[idx].role = role;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // 프로필 role도 업데이트
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const pIdx = profiles.findIndex((p) => p.id === userId);
    if (pIdx >= 0) {
      profiles[pIdx].role = role;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    return true;
  }, [user]);

  const adminUpdateProfile = useCallback((userId: string, updates: Partial<UserProfile>): boolean => {
    if (!user || user.role !== "admin") return false;

    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx < 0) return false;

    profiles[idx] = { ...profiles[idx], ...updates };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    // users 테이블의 name도 동기화
    if (updates.name) {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const allUsers: Array<{ id: string; name: string; email: string; password: string; role?: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      const uIdx = allUsers.findIndex((u) => u.id === userId);
      if (uIdx >= 0) {
        allUsers[uIdx].name = updates.name;
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
      }
    }

    return true;
  }, [user]);

  const joinHackathon = useCallback((hackathonSlug: string) => {
    if (!user) return;
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
    const idx = profiles.findIndex((p) => p.id === user.id);
    if (idx >= 0 && !profiles[idx].joinedHackathons.includes(hackathonSlug)) {
      profiles[idx].joinedHackathons.push(hackathonSlug);
      profiles[idx].stats.hackathonsJoined += 1;
      // 첫 참가 배지
      if (profiles[idx].stats.hackathonsJoined === 1) {
        profiles[idx].badges.push({
          id: `b-first-join-${Date.now()}`, name: "첫 참가", emoji: "🎉",
          description: "첫 해커톤에 참가했습니다", earnedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

      // 활동 로그
      const h = getHackathons().find((hk) => hk.slug === hackathonSlug);
      logActivity({
        type: "team_created",
        message: `${user.name}님이 ${h?.title || hackathonSlug} 해커톤에 참가했습니다.`,
        timestamp: new Date().toISOString(),
        hackathonSlug,
      });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, getProfile, getAllProfiles, updateProfile, changeNickname, addBadge, joinHackathon, isAdmin, deleteUser, updateUserRole, adminUpdateProfile, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
