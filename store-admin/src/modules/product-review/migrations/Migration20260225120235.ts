import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260225120235 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "review_reaction" ("id" text not null, "review_id" text not null, "customer_id" text not null, "type" text check ("type" in ('like', 'dislike')) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_reaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_REVIEW_REACTION_REVIEW_ID" ON "review_reaction" ("review_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_REVIEW_REACTION_CUSTOMER_ID" ON "review_reaction" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_reaction_deleted_at" ON "review_reaction" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_REVIEW_REACTION_UNIQUE" ON "review_reaction" ("review_id", "customer_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "review" add column if not exists "like_count" integer not null default 0, add column if not exists "dislike_count" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review_reaction" cascade;`);

    this.addSql(`alter table if exists "review" drop column if exists "like_count", drop column if exists "dislike_count";`);
  }

}
