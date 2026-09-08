import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260226093507 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "question" ("id" text not null, "name" text not null, "email" text not null, "question_text" text not null, "answer_text" text null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "question_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_QUESTION_PRODUCT_ID" ON "question" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_question_deleted_at" ON "question" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "question" cascade;`);
  }

}
