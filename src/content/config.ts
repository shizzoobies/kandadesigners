import { defineCollection, z } from "astro:content";

const people = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    role: z.string(),
    email: z.string().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
    location: z.string().optional(),
    skills: z.array(z.string()).default([]),
    experienceHighlights: z.array(z.string()).default([]),
    featured: z.boolean().default(true),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.enum(["live", "in-progress", "planned"]).default("in-progress"),
    tags: z.array(z.string()).default([]),
    person: z.enum(["alex", "kristina"]),
    role: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        })
      )
      .default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { people, projects };
