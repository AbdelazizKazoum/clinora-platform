import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type {
  StaffMemberReply,
  StaffMembersReply,
} from '@clinora/contracts-clinic';

import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/auth/jwt-payload';
import {
  CreateStaffMemberDto,
  UpdateStaffMemberDto,
} from './dto/staff.dto';
import { StaffFacade } from './staff.facade';

@Controller('clinics/:clinicId/staff')
export class StaffController {
  constructor(private readonly staff: StaffFacade) {}

  @Get()
  listStaffMembers(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<StaffMembersReply> {
    return this.staff.listStaffMembers({ clinicId });
  }

  @Post()
  createStaffMember(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CreateStaffMemberDto,
  ): Promise<StaffMemberReply> {
    return this.staff.createStaffMember({ clinicId, ...input });
  }

  @Get('by-user/:userId')
  getStaffMember(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<StaffMemberReply> {
    return this.staff.getStaffMember({ clinicId, userId });
  }

  @Patch(':staffMemberId')
  @UseGuards(JwtAuthGuard)
  updateStaffMember(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('staffMemberId', ParseUUIDPipe) staffMemberId: string,
    @Body() input: UpdateStaffMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffMemberReply> {
    return this.staff.updateStaffMember({
      clinicId,
      staffMemberId,
      actorUserId: user.user_id,
      ...input,
    });
  }
}
