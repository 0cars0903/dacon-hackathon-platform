// ============================================================
// Hackathon Service — Business logic for hackathon operations
// ============================================================
import * as data from "@/lib/supabase/data";
import { NotFoundError, ValidationError } from "@/lib/errors/api-error";
import type { Hackathon, HackathonDetail, PlatformStats } from "@/types";

export interface HackathonQuery {
  page: number;
  size: number;
  status?: "all" | "ongoing" | "upcoming" | "ended";
  tags?: string;
  sort?: "deadline" | "latest";
}

export interface CreateHackathonInput {
  title: string;
  slug: string;
  status: "upcoming" | "ongoing" | "ended";
  tags: string[];
  thumbnailUrl?: string;
  submissionDeadlineAt?: string;
  endAt?: string;
  timezone?: string;
  detailLink?: string;
  rulesLink?: string;
  faqLink?: string;
}

export interface UpdateHackathonInput {
  title?: string;
  status?: "upcoming" | "ongoing" | "ended";
  tags?: string[];
  thumbnailUrl?: string;
  submissionDeadlineAt?: string;
  endAt?: string;
  timezone?: string;
  detailLink?: string;
  rulesLink?: string;
  faqLink?: string;
}

export class HackathonService {
  /**
   * Get hackathon list with filtering, sorting, and pagination
   */
  static async list(query: HackathonQuery): Promise<{ items: Hackathon[]; total: number }> {
    const all = await data.getAllHackathonsUnfiltered();
    let filtered = all;

    // Status filter
    if (query.status && query.status !== "all") {
      filtered = filtered.filter(h => h.status === query.status);
    }

    // Tag filter
    if (query.tags) {
      const tagList = query.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        filtered = filtered.filter(h =>
          tagList.some(tag => h.tags.includes(tag))
        );
      }
    }

    // Sort
    const sortOrder = query.sort === "deadline" ? "asc" : "desc";
    filtered.sort((a, b) => {
      const aDate = new Date(a.period.submissionDeadlineAt).getTime();
      const bDate = new Date(b.period.submissionDeadlineAt).getTime();
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

    const total = filtered.length;
    const start = Math.max(0, (query.page - 1) * query.size);
    const items = filtered.slice(start, start + query.size);

    return { items, total };
  }

  /**
   * Get hackathon by slug
   */
  static async getBySlug(slug: string): Promise<Hackathon> {
    if (!slug || slug.trim() === "") {
      throw new ValidationError("Slug cannot be empty");
    }
    const hackathon = await data.getHackathonBySlug(slug);
    if (!hackathon) {
      throw new NotFoundError("Hackathon", slug);
    }
    return hackathon;
  }

  /**
   * Get hackathon detail by slug
   */
  static async getDetail(slug: string): Promise<HackathonDetail> {
    if (!slug || slug.trim() === "") {
      throw new ValidationError("Slug cannot be empty");
    }
    const detail = await data.getHackathonDetail(slug);
    if (!detail) {
      throw new NotFoundError("HackathonDetail", slug);
    }
    return detail;
  }

  /**
   * Get all hackathon details
   */
  static async getAllDetails(): Promise<HackathonDetail[]> {
    return data.getAllHackathonDetails();
  }

  /**
   * Get platform statistics
   */
  static async getStats(): Promise<PlatformStats> {
    return data.getPlatformStats();
  }

  /**
   * Get recommended hackathons based on interest tags
   */
  static async getRecommended(interestTags: string[]): Promise<Hackathon[]> {
    return data.getRecommendedHackathons(interestTags ?? []);
  }

  /**
   * Create a new hackathon
   */
  static async create(input: CreateHackathonInput): Promise<boolean> {
    if (!input.title || !input.slug) {
      throw new ValidationError("Title and slug are required");
    }
    return data.createHackathon(input);
  }

  /**
   * Update hackathon details
   */
  static async update(
    slug: string,
    input: UpdateHackathonInput
  ): Promise<boolean> {
    // Verify hackathon exists first
    await HackathonService.getBySlug(slug);
    return data.updateHackathon(slug, input);
  }

  /**
   * Delete hackathon (soft delete)
   */
  static async delete(slug: string): Promise<boolean> {
    // Verify hackathon exists first
    await HackathonService.getBySlug(slug);
    return data.deleteHackathon(slug);
  }

  /**
   * Change hackathon status
   */
  static async changeStatus(
    slug: string,
    status: "upcoming" | "ongoing" | "ended"
  ): Promise<boolean> {
    if (!["upcoming", "ongoing", "ended"].includes(status)) {
      throw new ValidationError(
        `Invalid status: ${status}. Must be one of: upcoming, ongoing, ended`
      );
    }
    // Verify hackathon exists first
    await HackathonService.getBySlug(slug);
    return data.changeHackathonStatus(slug, status);
  }
}
