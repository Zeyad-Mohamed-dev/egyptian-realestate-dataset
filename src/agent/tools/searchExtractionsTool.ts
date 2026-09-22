import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ExtractionSearch, extractionSearchSchema } from '../types/exctraction-query.type';
import { PropertySearchService } from 'src/extract/services/searchable-property.service';
export class SearchExtractionsTool {
    constructor(private readonly propertySearchService: PropertySearchService) {}
    create() {
        return tool(
            async(input: ExtractionSearch) => {
                return await this.propertySearchService.search(input);
            }
        , {
             name: 'search_extractions',
                description:
                    'Search property listings using extracted property, location, pricing, finishing, delivery, payment, and development information.',
                schema: extractionSearchSchema,
        })
    }
}