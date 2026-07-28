import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import type {
  InsuranceTemplateReply,
  InsuranceTemplatesReply,
  SuccessReply,
} from '@clinora/contracts-patient';

import {
  CreateInsuranceTemplateDto,
  ListInsuranceTemplatesQueryDto,
  UpdateInsuranceTemplateDto,
} from '../dto/insurance-template.dto';
import { PatientsFacade } from '../patients.facade';

@Controller('clinics/:clinicId')
export class InsuranceTemplateController {
  constructor(private readonly patients: PatientsFacade) {}

  @Post('insurance-templates')
  createInsuranceTemplate(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CreateInsuranceTemplateDto,
  ): Promise<InsuranceTemplateReply> {
    return this.patients.createInsuranceTemplate({ clinicId, ...input });
  }

  @Get('insurance-templates')
  async listInsuranceTemplates(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListInsuranceTemplatesQueryDto,
  ): Promise<InsuranceTemplatesReply> {
    const result = await this.patients.listInsuranceTemplates({
      clinicId,
      providerId: query.insuranceProviderId,
      providerIds: query.insuranceProviderIds ?? [],
      search: query.search,
    });

    if (query.name) {
      return {
        templates: result.templates.filter(
          (template) =>
            template.name.toLowerCase() === query.name?.toLowerCase(),
        ),
      };
    }

    return result;
  }

  @Get('insurance-templates/:templateId')
  getInsuranceTemplate(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ): Promise<InsuranceTemplateReply> {
    return this.patients.getInsuranceTemplate({
      clinicId,
      id: templateId,
    });
  }

  @Put('insurance-templates/:templateId')
  updateInsuranceTemplate(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() input: UpdateInsuranceTemplateDto,
  ): Promise<InsuranceTemplateReply> {
    return this.patients.updateInsuranceTemplate({
      clinicId,
      templateId,
      ...input,
    });
  }

  @Delete('insurance-templates/:templateId')
  deleteInsuranceTemplate(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ): Promise<SuccessReply> {
    return this.patients.deleteInsuranceTemplate({
      clinicId,
      id: templateId,
    });
  }
}
