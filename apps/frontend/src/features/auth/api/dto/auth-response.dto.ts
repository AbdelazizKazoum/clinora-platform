export interface AuthUserResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  clinicId: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponseDto;
}
