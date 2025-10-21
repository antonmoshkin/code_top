import { Migration } from '@mikro-orm/migrations';

export class Migration20250819154048 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "activation_key" drop constraint if exists "activation_key_key_unique";`);
    this.addSql(`create table if not exists "activation_key" ("id" text not null, "key" text not null, "product_variant_id" text not null, "is_used" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "activation_key_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_activation_key_key_unique" ON "activation_key" (key) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_activation_key_deleted_at" ON "activation_key" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "activation_key" cascade;`);
  }

}
