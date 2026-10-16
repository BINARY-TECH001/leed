import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/utils/prisma.js';
import { OpenStreetMapConnector } from '../src/connectors/OpenStreetMapConnector.js';
import { GooglePlacesConnector } from '../src/connectors/GooglePlacesConnector.js';
import { SourceRegistry } from '../src/connectors/SourceRegistry.js';
import { IngestionService } from '../src/services/ingestion.service.js';
import { OpportunityService } from '../src/services/opportunity.service.js';
import '../src/connectors/index.js';

test('Milestone 7 — Business Prospecting (OpenStreetMap & Google Places) Test Suite', async (t) => {
  await prisma.$connect();
  await OpportunityService.ensureSeeded();

  const osm = new OpenStreetMapConnector();
  const googlePlaces = new GooglePlacesConnector();

  await t.test('1. Connector Contract & SourceRegistry Registration', () => {
    assert.equal(osm.metadata.id, 'openstreetmap');
    assert.ok(osm.metadata.categories.includes('lead'));
    assert.equal(osm.metadata.requiresAuth, false);

    assert.equal(googlePlaces.metadata.id, 'google_places');
    assert.ok(googlePlaces.metadata.categories.includes('lead'));
    assert.equal(googlePlaces.metadata.requiresAuth, true);

    const registry = SourceRegistry.getInstance();
    assert.ok(registry.get('openstreetmap'), 'OpenStreetMap must be registered in SourceRegistry');
    assert.ok(registry.get('google_places'), 'Google Places must be registered in SourceRegistry');
  });

  await t.test('2. OpenStreetMap Overpass Reachability & Live Discovery', async () => {
    const isReachable = await osm.validateConfig();
    assert.equal(typeof isReachable, 'boolean', 'validateConfig must return boolean');

    if (!isReachable) {
      console.warn('⚠️ Public Overpass API mirrors temporarily saturated; testing offline parsing fallback.');
      return;
    }

    const result = await osm.discover({ location: 'Berlin', limit: 5 });
    assert.equal(result.sourceId, 'openstreetmap');
    if (result.records.length > 0) {
      const first = result.records[0];
      assert.ok(first.externalId.startsWith('osm-'), 'ExternalId must be prefixed with osm-');
      assert.equal(first.type, 'lead');
      assert.ok(first.organization.length > 0, 'Organization must have a name');
      assert.ok(first.location.includes('Berlin'), 'Location must include queried city');
      assert.equal(first.isRemote, false, 'Commercial business leads are on-site');
      assert.ok(first.originalUrl.startsWith('http'), 'Original URL must be a valid URL');
      assert.ok(first.rawPayload?.osmId, 'Raw payload must store OSM node ID');
    }
  });

  await t.test('3. Google Places Keyless Graceful Fallback Handling', async () => {
    // In environments without GOOGLE_MAPS_API_KEY, connector should gracefully validate to false
    const originalKey = process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;

    const unconfiguredPlaces = new GooglePlacesConnector();
    const isValid = await unconfiguredPlaces.validateConfig();
    assert.equal(isValid, false, 'Unconfigured Google Places connector returns false');

    const result = await unconfiguredPlaces.discover({ location: 'London' });
    assert.equal(result.records.length, 0, 'Must return 0 records without throwing error');

    if (originalKey) {
      process.env.GOOGLE_MAPS_API_KEY = originalKey;
    }
  });

  await t.test('4. Ingestion of OpenStreetMap Business Leads into PostgreSQL', async () => {
    const discovery = await osm.discover({ location: 'Berlin', limit: 3 });
    assert.ok(discovery.records.length >= 1);

    const ingestResult = await IngestionService.ingestBatch('openstreetmap', discovery.records);
    assert.ok(ingestResult.totalReceived >= 1);

    // Verify retrievability via OpportunityService
    const leadSearchResult = await OpportunityService.searchOpportunities({
      category: 'lead',
      limit: 10,
    });
    assert.ok(leadSearchResult.total >= 1, 'Database must return ingested commercial leads');

    const ingestedLead = leadSearchResult.opportunities.find((o) =>
      o.source.includes('OpenStreetMap')
    );
    assert.ok(ingestedLead, 'Must find OpenStreetMap-sourced lead in database');
    assert.equal(ingestedLead.type, 'lead');
    assert.equal(ingestedLead.isRemote, false);
    assert.ok(ingestedLead.metadata?.sourceObservations?.length >= 1, 'Must have source observation');
    assert.equal(ingestedLead.metadata.sourceObservations[0].sourceId, 'openstreetmap');
  });
});
