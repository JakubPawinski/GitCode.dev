import { PrismaClient, NotificationType } from '@prisma/client-notification';
import { PrismaPg } from '@prisma/adapter-pg';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const adapter = new PrismaPg({
  connectionString: process.env.NOTIFICATION_DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seeding...');

  const configs = [
    {
      type: NotificationType.SECURITY,
      kind: '*',
      isMandatory: true,
    },
    {
      type: NotificationType.SYSTEM,
      kind: 'USER_BANNED',
      isMandatory: true,
    },
    {
      type: NotificationType.BILLING,
      kind: '*',
      isMandatory: true,
    },
    {
      type: NotificationType.SUPPORT,
      kind: '*',
      isMandatory: true,
    },
  ];

  for (const config of configs) {
    const record = await prisma.notificationConfig.upsert({
      where: {
        type_kind: {
          type: config.type,
          kind: config.kind,
        },
      },
      update: {
        isMandatory: config.isMandatory,
      },
      create: {
        type: config.type,
        kind: config.kind,
        isMandatory: config.isMandatory,
      },
    });

    console.log(
      `Upserted config: [${record.type}] kind: ${record.kind} ==> mandatory: ${record.isMandatory}`,
    );
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
