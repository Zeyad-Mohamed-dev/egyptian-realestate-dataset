import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from 'src/app.module';

import { AgentService } from 'src/agent/agent.service';
import { PropertySearchEntity } from 'src/extract/database/property.entity';

describe('Property Search Agent (e2e)', () => {
  let app: INestApplication;
  let agentService: AgentService;
  let repository: Repository<PropertySearchEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    agentService =
      moduleFixture.get<AgentService>(
        AgentService,
      );

    repository =
      moduleFixture.get<Repository<PropertySearchEntity>>(
        getRepositoryToken(PropertySearchEntity),
      );

    /*
     * Create deterministic test data.
     *
     * This assumes your test database is separate
     * from your development database.
     */

    await repository.clear();

    await repository.save([
      {
        listingId: 'test-001',
        title: '3 Bedroom Apartment in New Cairo',
        price: 4_500_000,
        currency: 'EGP',
        propertyType: 'apartment',
        purpose: 'sale',
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 160,
        location: 'New Cairo',
        governorate: 'Cairo',
        city: 'New Cairo',
        district: 'Fifth Settlement',

        compoundName: 'Test Compound',
        developerName: 'Test Developer',
        finishingLevel: 'fully finished',
        deliveryStatus: 'ready',
        saleType: 'primary',
        paymentType: 'installments',
        installmentYears: 7,
        downPaymentPct: 15,
        isNegotiable: true,
      },

      {
        listingId: 'test-002',
        title: '2 Bedroom Apartment',
        price: 3_000_000,
        currency: 'EGP',
        propertyType: 'apartment',
        purpose: 'sale',
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 120,
        location: 'New Cairo',
        governorate: 'Cairo',
        city: 'New Cairo',
        district: 'Fifth Settlement',

        compoundName: 'Other Compound',
        developerName: 'Other Developer',
        finishingLevel: 'semi-finished',
        deliveryStatus: 'off-plan',
        saleType: 'primary',
        paymentType: 'installments',
        installmentYears: 10,
        downPaymentPct: 20,
        isNegotiable: false,
      },

      {
        listingId: 'test-003',
        title: '3 Bedroom Finished Apartment',
        price: 7_000_000,
        currency: 'EGP',
        propertyType: 'apartment',
        purpose: 'sale',
        bedrooms: 3,
        bathrooms: 3,
        areaSqm: 180,
        location: 'Cairo',
        governorate: 'Cairo',
        city: 'New Cairo',
        district: 'Fifth Settlement',

        compoundName: 'Expensive Compound',
        developerName: 'Expensive Developer',
        finishingLevel: 'fully finished',
        deliveryStatus: 'ready',
        saleType: 'resale',
        paymentType: 'cash',
        installmentYears: null,
        downPaymentPct: null,
        isNegotiable: true,
      },
    ]);
  });

  afterAll(async () => {
    await repository.clear();
    await app.close();
  });

  it(
    'should find matching properties through the AI agent',
    async () => {
      const response =
        await agentService.processAgentRequest(
          `
          Find me a 3 bedroom apartment in New Cairo
          for sale under 5 million EGP.

          I want it fully finished and ready.
          I prefer installments with no more than
          8 years.
          `,
        );

      /*
       * Agent responses can have different shapes
       * depending on the LangChain version.
       *
       * Convert the final response to a string
       * so we can inspect it.
       */

      const text =
        JSON.stringify(response);

      console.log(
        '\nAgent response:\n',
        text,
      );

      expect(text).toContain(
        'test-001',
      );

      expect(text).not.toContain(
        'test-002',
      );

      expect(text).not.toContain(
        'test-003',
      );
    },
    60_000,
  );
});
