import { prisma } from '../src/utils/prisma.js';
import { ArbeitnowConnector } from '../src/connectors/ArbeitnowConnector.js';
import { IngestionService } from '../src/services/ingestion.service.js';

async function main() {
  console.log('🌱 Ingesting verified live opportunities into database...');
  const connector = new ArbeitnowConnector();
  const discovery = await connector.discover({ limit: 30 });
  console.log(`📡 Retrieved ${discovery.records.length} live opportunities from Arbeitnow API.`);

  if (discovery.records.length > 0) {
    const result = await IngestionService.ingestBatch('arbeitnow', discovery.records);
    console.log(`✅ Ingested: ${result.newOpportunitiesCreated} new, ${result.duplicatesUpdated} updated.`);
  }

  const total = await prisma.opportunity.count();
  console.log(`📊 Total real opportunities in database: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Ingestion error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
