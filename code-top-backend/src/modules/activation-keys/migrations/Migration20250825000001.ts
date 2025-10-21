import { Migration } from '@mikro-orm/migrations';

export class Migration20250825000001 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "activation_key" add column "order_id" text null;');
    this.addSql('alter table "activation_key" add column "used_at" timestamptz null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "activation_key" drop column "order_id";');
    this.addSql('alter table "activation_key" drop column "used_at";');
  }

}