import { registerAtGateway } from '@/features/auth/api/server/gateway-auth';
import { mapAuthUserFromDto } from '@/features/auth/model/auth.mapper';
import axios from 'axios';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const response = await registerAtGateway(await request.json());

    return NextResponse.json(mapAuthUserFromDto(response.user), {
      status: 201,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }

    return NextResponse.json(
      {
        message: 'Unable to reach the API gateway',
        statusCode: 502,
      },
      { status: 502 },
    );
  }
}
