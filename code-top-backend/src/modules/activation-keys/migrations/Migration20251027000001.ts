import { Migration } from '@mikro-orm/migrations';

export class Migration20251027000001 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "activation_key" add column "cost" numeric(12,2) null;');
    this.addSql('alter table "activation_key" add column "created_by" text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "activation_key" drop column "cost";');
    this.addSql('alter table "activation_key" drop column "created_by";');
  }
}


