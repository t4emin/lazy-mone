import { z } from "zod";

export const publishFacebookSchema = z
  .object({
    socialAccountId: z.string().cuid(),
    caption: z.string().trim().min(1).max(5_000),
  })
  .strict();

export type PublishFacebookInput = z.infer<typeof publishFacebookSchema>;

export const scheduleFacebookSchema = publishFacebookSchema.extend({
  scheduledAt: z.string().datetime({ offset: true }),
});

export const rescheduleFacebookSchema = z
  .object({ scheduledAt: z.string().datetime({ offset: true }) })
  .strict();

export type ScheduleFacebookInput = z.infer<typeof scheduleFacebookSchema>;
