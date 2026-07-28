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
  InsuranceProviderReply,
  InsuranceProvidersReply,
  SuccessReply,
} from '@clinora/contracts-patient';

import {
  CreateInsuranceProviderDto,
  ListInsuranceProvidersQueryDto,
  UpdateInsuranceProviderDto,
} from '../dto/insurance-provider.dto';
import { PatientsFacade } from '../patients.facade';

@Controller('clinics/:clinicId')
export class InsuranceProviderController {
  constructor(private readonly patients: PatientsFacade) {}

  @Post('insurance-providers')
  createInsuranceProvider(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CreateInsuranceProviderDto,
  ): Promise<InsuranceProviderReply> {
    return this.patients.createInsuranceProvider({ clinicId, ...input });
  }

  @Get('insurance-providers')
  async listInsuranceProviders(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListInsuranceProvidersQueryDto,
  ): Promise<InsuranceProvidersReply> {
    const result = await this.patients.listInsuranceProviders({
      clinicId,
      isActive: query.isActive,
      search: query.search,
    });

    if (query.name) {
      return {
        providers: result.providers.filter(
          (provider) =>
            provider.name.toLowerCase() === query.name?.toLowerCase(),
        ),
      };
    }

    if (query.code) {
      return {
        providers: result.providers.filter(
          (provider) =>
            provider.code.toLowerCase() === query.code?.toLowerCase(),
        ),
      };
    }

    return result;
  }

  @Get('insurance-providers/:providerId')
  getInsuranceProvider(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<InsuranceProviderReply> {
    return this.patients.getInsuranceProvider({
      clinicId,
      id: providerId,
    });
  }

  @Put('insurance-providers/:providerId')
  updateInsuranceProvider(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body() input: UpdateInsuranceProviderDto,
  ): Promise<InsuranceProviderReply> {
    return this.patients.updateInsuranceProvider({
      clinicId,
      providerId,
      ...input,
    });
  }

  @Delete('insurance-providers/:providerId')
  deleteInsuranceProvider(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<SuccessReply> {
    return this.patients.deleteInsuranceProvider({
      clinicId,
      id: providerId,
    });
  }

  @Put('insurance-providers/:providerId/activate')
  activateInsuranceProvider(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<InsuranceProviderReply> {
    return this.patients.activateInsuranceProvider({
      clinicId,
      id: providerId,
    });
  }

  @Put('insurance-providers/:providerId/deactivate')
  deactivateInsuranceProvider(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<InsuranceProviderReply> {
    return this.patients.deactivateInsuranceProvider({
      clinicId,
      id: providerId,
    });
  }
}
