import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  timestamp: string;
  path?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 환경별 에러 상세 정보 포함 여부
const isDevelopment = process.env.NODE_ENV === 'development';

export function handleApiError(
  error: unknown,
  path?: string
): NextResponse<ErrorResponse> {
  console.error(`[${new Date().toISOString()}] API Error at ${path}:`, error);

  // ApiError 인스턴스
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        message: error.message,
        details: isDevelopment ? error.details : undefined,
        timestamp: new Date().toISOString(),
        path,
      },
      { status: error.statusCode }
    );
  }

  // Zod 검증 에러
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid request data',
        details: isDevelopment ? (error as any).errors : undefined,
        timestamp: new Date().toISOString(),
        path,
      },
      { status: 400 }
    );
  }

  // Prisma 에러
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database operation failed';
    let statusCode = 500;

    switch (error.code) {
      case 'P2002':
        message = 'A unique constraint would be violated';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = 400;
        break;
    }

    return NextResponse.json(
      {
        error: message,
        message,
        details: isDevelopment ? { code: error.code, meta: error.meta } : undefined,
        timestamp: new Date().toISOString(),
        path,
      },
      { status: statusCode }
    );
  }

  // 일반 Error 인스턴스
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        details: isDevelopment ? { stack: error.stack } : undefined,
        timestamp: new Date().toISOString(),
        path,
      },
      { status: 500 }
    );
  }

  // 알 수 없는 에러
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      details: isDevelopment ? error : undefined,
      timestamp: new Date().toISOString(),
      path,
    },
    { status: 500 }
  );
}

// API 라우트 래퍼 함수
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args.find(arg => arg instanceof Request) as Request | undefined;
      const path = request ? new URL(request.url).pathname : undefined;
      return handleApiError(error, path) as any;
    }
  };
}

// 클라이언트 측 에러 처리 헬퍼
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

// 로깅 유틸리티
export const logger = {
  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, {
      error,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
  
  warn: (message: string, metadata?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, {
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
  
  info: (message: string, metadata?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, {
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
};