import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getHackathons,
  getAllHackathonsUnfiltered,
  getHackathonBySlug,
  getHackathonDetail,
  getTeams,
  getTeamsByHackathon,
  getLeaderboard,
  getAllLeaderboards,
  getPlatformStats,
  getRecommendedHackathons,
  getRecommendedTeams,
  getActivityFeed,
} from "@/lib/data";

describe("Hackathons Data Layer", () => {
  it("getHackathons returns array", () => {
    const hackathons = getHackathons();
    expect(Array.isArray(hackathons)).toBe(true);
    expect(hackathons.length).toBeGreaterThan(0);
  });

  it("getAllHackathonsUnfiltered returns all including ended", () => {
    const all = getAllHackathonsUnfiltered();
    expect(all.length).toBeGreaterThanOrEqual(getHackathons().length);
  });

  it("getHackathons filters out ended hackathons older than 2 weeks", () => {
    const hackathons = getHackathons();
    const all = getAllHackathonsUnfiltered();
    // ended hackathons that are still shown should be within 2 weeks
    const endedShown = hackathons.filter((h) => h.status === "ended");
    endedShown.forEach((h) => {
      const endDate = new Date(h.period.endAt).getTime();
      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
      expect(Date.now() - endDate).toBeLessThanOrEqual(twoWeeksMs);
    });
  });

  it("each hackathon has required fields", () => {
    const all = getAllHackathonsUnfiltered();
    all.forEach((h) => {
      expect(h.slug).toBeTruthy();
      expect(h.title).toBeTruthy();
      expect(["ongoing", "ended", "upcoming"]).toContain(h.status);
      expect(Array.isArray(h.tags)).toBe(true);
      expect(h.period.endAt).toBeTruthy();
      expect(h.period.submissionDeadlineAt).toBeTruthy();
      expect(h.links.detail).toBeTruthy();
    });
  });

  it("getHackathonBySlug finds existing hackathon", () => {
    const h = getHackathonBySlug("daker-handover-2026-03");
    expect(h).toBeDefined();
    expect(h?.title).toContain("인수인계");
  });

  it("getHackathonBySlug returns undefined for non-existent", () => {
    expect(getHackathonBySlug("non-existent-slug")).toBeUndefined();
  });
});

describe("Hackathon Details", () => {
  it("getHackathonDetail returns detail for existing slug", () => {
    const detail = getHackathonDetail("aimers-8-model-lite");
    expect(detail).toBeDefined();
    expect(detail?.sections).toBeDefined();
    expect(detail?.sections.overview).toBeDefined();
    expect(detail?.sections.eval).toBeDefined();
    expect(detail?.sections.schedule).toBeDefined();
  });

  it("getHackathonDetail returns undefined for missing", () => {
    expect(getHackathonDetail("no-such-slug")).toBeUndefined();
  });
});

describe("Teams Data Layer", () => {
  it("getTeams returns non-empty array", () => {
    const teams = getTeams();
    expect(teams.length).toBeGreaterThan(0);
  });

  it("each team has required fields", () => {
    getTeams().forEach((t) => {
      expect(t.teamCode).toBeTruthy();
      expect(t.hackathonSlug).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(typeof t.isOpen).toBe("boolean");
      expect(typeof t.memberCount).toBe("number");
      expect(Array.isArray(t.lookingFor)).toBe(true);
      expect(t.contact).toBeDefined();
    });
  });

  it("getTeamsByHackathon filters correctly", () => {
    const dakerTeams = getTeamsByHackathon("daker-handover-2026-03");
    dakerTeams.forEach((t) => {
      expect(t.hackathonSlug).toBe("daker-handover-2026-03");
    });
  });

  it("getTeamsByHackathon returns empty for non-existent hackathon", () => {
    expect(getTeamsByHackathon("non-existent").length).toBe(0);
  });
});

describe("Leaderboard Data Layer", () => {
  it("getLeaderboard returns data for existing hackathon", () => {
    const lb = getLeaderboard("aimers-8-model-lite");
    expect(lb).toBeDefined();
    expect(lb?.entries.length).toBeGreaterThan(0);
    expect(lb?.metricName).toBeTruthy();
  });

  it("leaderboard entries are sorted by rank", () => {
    const lb = getLeaderboard("aimers-8-model-lite");
    if (lb && lb.entries.length > 1) {
      for (let i = 1; i < lb.entries.length; i++) {
        expect(lb.entries[i].rank).toBeGreaterThan(lb.entries[i - 1].rank);
      }
    }
  });

  it("each leaderboard entry has required fields", () => {
    const all = getAllLeaderboards();
    all.forEach((lb) => {
      lb.entries.forEach((e) => {
        expect(typeof e.rank).toBe("number");
        expect(e.teamName).toBeTruthy();
        expect(typeof e.score).toBe("number");
        expect(e.submittedAt).toBeTruthy();
      });
    });
  });

  it("getAllLeaderboards returns all", () => {
    const all = getAllLeaderboards();
    expect(all.length).toBeGreaterThanOrEqual(4);
  });

  it("multi-round leaderboard has rounds", () => {
    const lb = getLeaderboard("daker-handover-2026-03");
    expect(lb?.evalType).toBe("multi-round");
    expect(lb?.rounds).toBeDefined();
    expect(lb?.rounds?.length).toBeGreaterThan(0);
  });
});

describe("Platform Stats", () => {
  it("returns valid stats object", () => {
    const stats = getPlatformStats();
    expect(typeof stats.totalHackathons).toBe("number");
    expect(typeof stats.totalTeams).toBe("number");
    expect(typeof stats.totalMembers).toBe("number");
    expect(typeof stats.totalSubmissions).toBe("number");
    expect(typeof stats.ongoingHackathons).toBe("number");
    expect(typeof stats.upcomingHackathons).toBe("number");
  });

  it("stats are consistent with data", () => {
    const stats = getPlatformStats();
    const hackathons = getHackathons();
    const teams = getTeams();

    expect(stats.totalHackathons).toBe(hackathons.length);
    expect(stats.totalTeams).toBe(teams.length);
    expect(stats.ongoingHackathons).toBe(hackathons.filter((h) => h.status === "ongoing").length);
    expect(stats.upcomingHackathons).toBe(hackathons.filter((h) => h.status === "upcoming").length);
  });
});

describe("Recommendations", () => {
  it("getRecommendedHackathons with empty tags returns all", () => {
    const result = getRecommendedHackathons([]);
    const all = getHackathons();
    expect(result.length).toBe(all.length);
  });

  it("getRecommendedHackathons prioritizes matching tags", () => {
    const result = getRecommendedHackathons(["LLM"]);
    // LLM-tagged hackathon should come first
    if (result.length > 0) {
      const firstHasTags = result[0].tags.some(
        (t) => t.toLowerCase() === "llm"
      );
      expect(firstHasTags).toBe(true);
    }
  });

  it("getRecommendedTeams with empty tags returns open teams", () => {
    const result = getRecommendedTeams([]);
    result.forEach((t) => expect(t.isOpen).toBe(true));
  });
});

describe("Activity Feed", () => {
  it("returns non-empty feed", () => {
    const feed = getActivityFeed();
    expect(feed.length).toBeGreaterThan(0);
  });

  it("each item has required fields", () => {
    getActivityFeed().forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.type).toBeTruthy();
      expect(item.message).toBeTruthy();
      expect(item.timestamp).toBeTruthy();
    });
  });
});

describe("Cross-referencing: teams.json ↔ leaderboard.json", () => {
  it("all teams.json teamCodes are unique", () => {
    const teams = getTeams();
    const codes = teams.map((t) => t.teamCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all teams reference valid hackathon slugs", () => {
    const teams = getTeams();
    const allSlugs = getAllHackathonsUnfiltered().map((h) => h.slug);
    teams.forEach((t) => {
      expect(allSlugs).toContain(t.hackathonSlug);
    });
  });

  it("all leaderboards reference valid hackathon slugs", () => {
    const leaderboards = getAllLeaderboards();
    const allSlugs = getAllHackathonsUnfiltered().map((h) => h.slug);
    leaderboards.forEach((lb) => {
      expect(allSlugs).toContain(lb.hackathonSlug);
    });
  });
});
