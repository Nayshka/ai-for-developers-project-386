import type { ApiErrorCode, ErrorResponse } from './types.js';

const errorMessages: Record<ApiErrorCode, string> = {
  validation_error: 'Проверьте корректность заполнения формы.',
  event_type_not_found: 'Тип встречи не найден.',
  booking_not_found: 'Бронирование не найдено.',
  slot_unavailable: 'Выбранный слот уже недоступен.',
  booking_overlap: 'Выбранный интервал пересекается с уже существующей встречей.',
  booking_out_of_range: 'Выбранный слот находится вне допустимого окна бронирования.',
  invalid_time_range: 'Некорректный временной интервал.',
  internal_error: 'Внутренняя ошибка сервера.',
};

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ApiErrorCode,
    readonly details?: string[],
  ) {
    super(errorMessages[code]);
    this.name = 'ApiError';
  }

  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && this.details.length > 0 ? { details: this.details } : {}),
    };
  }
}

export function validationError(details: string[]) {
  return new ApiError(400, 'validation_error', details);
}
