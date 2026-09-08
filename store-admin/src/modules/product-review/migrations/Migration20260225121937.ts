import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260225121937 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "is_verified_buyer" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" drop column if exists "is_verified_buyer";`);
  }

}
