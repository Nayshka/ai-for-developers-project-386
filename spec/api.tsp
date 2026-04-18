import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{
  title: "API сервиса записи на звонок"
})
@server("https://api.example.com", "Основной сервер API")
namespace CallBooking;

@doc("Дата и время в формате ISO 8601. Во всех моделях API используется UTC.")
scalar UtcDateTime extends string;

@doc("Адрес электронной почты.")
scalar Email extends string;

@doc("Уникальный идентификатор сущности.")
scalar ResourceId extends string;

@doc("Длительность встречи в минутах.")
@minValue(1)
scalar DurationMinutes extends int32;

@doc("Имя гостя.")
@minLength(1)
@maxLength(120)
scalar GuestName extends string;

@doc("Название типа встречи.")
@minLength(1)
@maxLength(100)
scalar EventTypeName extends string;

@doc("Описание типа встречи.")
@maxLength(1000)
scalar EventTypeDescription extends string;

@doc("Код ошибки API.")
enum ErrorCode {
  validation_error,
  event_type_not_found,
  booking_not_found,
  slot_unavailable,
  booking_overlap,
  booking_out_of_range,
  invalid_time_range,
  internal_error
}

@doc("Статус бронирования.")
enum BookingStatus {
  @doc("Бронирование активно и блокирует слот.")
  confirmed,

  @doc("Бронирование отменено и больше не блокирует слот.")
  cancelled
}

@doc("Промежуток времени: начало включительно, конец не включается. Инварианты: startAt должен быть раньше endAt.")
model TimeRange {
  @doc("Дата и время начала в UTC.")
  startAt: UtcDateTime;

  @doc("Дата и время окончания в UTC.")
  endAt: UtcDateTime;
}

@doc("Данные гостя из формы бронирования.")
model GuestInfo {
  @doc("Поле формы: Имя")
  name: GuestName;

  @doc("Поле формы: Email")
  email: Email;
}

@doc("Снимок типа встречи на момент бронирования. Нужен, чтобы история бронирований не менялась при редактировании типа встречи.")
model EventTypeSnapshot {
  @doc("Идентификатор типа встречи.")
  id: ResourceId;

  @doc("Название типа встречи на момент бронирования.")
  name: EventTypeName;

  @doc("Длительность встречи в минутах на момент бронирования.")
  durationMinutes: DurationMinutes;
}

@doc("Тип встречи, который владелец публикует для записи.")
@example(#{
  id: "consultation",
  name: "Консультация",
  description: "Короткий созвон для обсуждения вопроса и следующих шагов.",
  durationMinutes: 30,
  createdAt: "2026-04-18T06:00:00.000Z",
  updatedAt: "2026-04-18T06:00:00.000Z"
})
model EventType {
  @doc("Идентификатор типа встречи.")
  id: ResourceId;

  @doc("Название встречи.")
  name: EventTypeName;

  @doc("Краткое описание для страницы выбора встречи.")
  description?: EventTypeDescription;

  @doc("Длительность встречи в минутах.")
  durationMinutes: DurationMinutes;

  @doc("Дата создания.")
  createdAt: UtcDateTime;

  @doc("Дата последнего обновления.")
  updatedAt: UtcDateTime;
}

@doc("Свободный слот для выбранного типа встречи. Слот является вычисляемой моделью и не обязан храниться в базе данных. Слот рассчитывается на основе длительности встречи, рабочего окна 09:00-19:00, горизонта 14 дней и существующих бронирований.")
model Slot {
  @doc("Идентификатор типа встречи, для которого рассчитан слот.")
  eventTypeId: ResourceId;

  @doc("Временной интервал слота.")
  range: TimeRange;

  @doc("Признак доступности слота для бронирования.")
  isAvailable: boolean;
}

@doc("Бронирование, созданное гостем. Инвариант: длительность range должна совпадать с durationMinutes выбранного типа встречи.")
model Booking {
  @doc("Идентификатор бронирования.")
  id: ResourceId;

  @doc("Идентификатор выбранного типа встречи.")
  eventTypeId: ResourceId;

  @doc("Снимок типа встречи на момент бронирования.")
  eventType: EventTypeSnapshot;

  @doc("Данные гостя из формы бронирования.")
  guest: GuestInfo;

  @doc("Дата и время встречи.")
  range: TimeRange;

  @doc("Текущий статус бронирования.")
  status: BookingStatus;

  @doc("Дата создания бронирования.")
  createdAt: UtcDateTime;
}

@doc("Форма создания бронирования.")
model CreateBookingForm {
  @doc("Идентификатор выбранного типа встречи.")
  eventTypeId: ResourceId;

  @doc("Выбранный слот.")
  range: TimeRange;

  @doc("Данные гостя.")
  guest: GuestInfo;
}

@doc("Форма создания типа встречи.")
model CreateEventTypeForm {
  @doc("Название типа встречи.")
  name: EventTypeName;

  @doc("Описание типа встречи.")
  description?: EventTypeDescription;

  @doc("Длительность встречи в минутах.")
  durationMinutes: DurationMinutes;
}

@doc("Форма редактирования типа встречи.")
model UpdateEventTypeForm {
  @doc("Название типа встречи.")
  name?: EventTypeName;

  @doc("Описание типа встречи.")
  description?: EventTypeDescription;

  @doc("Длительность встречи в минутах.")
  durationMinutes?: DurationMinutes;
}

@doc("Стандартная ошибка API.")
model ErrorResponse {
  @doc("Машиночитаемый код ошибки.")
  code: ErrorCode;

  @doc("Сообщение для пользователя на русском языке.")
  message: string;

  @doc("Дополнительные пояснения по ошибке.")
  details?: string[];
}

@doc("Ошибка валидации входных данных.")
model ValidationErrorBody {
  code: "validation_error";
  message: "Проверьте корректность заполнения формы.";
  details?: string[];
}

@doc("Тип встречи не найден.")
model EventTypeNotFoundErrorBody {
  code: "event_type_not_found";
  message: "Тип встречи не найден.";
  details?: string[];
}

@doc("Выбранный слот уже недоступен.")
model SlotUnavailableErrorBody {
  code: "slot_unavailable";
  message: "Выбранный слот уже недоступен.";
  details?: string[];
}

@doc("Новый слот пересекается с существующим бронированием.")
model BookingOverlapErrorBody {
  code: "booking_overlap";
  message: "Выбранный интервал пересекается с уже существующей встречей.";
  details?: string[];
}

@doc("Выбранный слот выходит за пределы окна доступности.")
model BookingOutOfRangeErrorBody {
  code: "booking_out_of_range";
  message: "Выбранный слот находится вне допустимого окна бронирования.";
  details?: string[];
}

@doc("Передан некорректный временной интервал.")
model InvalidTimeRangeErrorBody {
  code: "invalid_time_range";
  message: "Некорректный временной интервал.";
  details?: string[];
}

@doc("Ошибка валидации входных данных.")
model ValidationErrorResult {
  @statusCode
  statusCode: 400;

  @body
  body: ValidationErrorBody;
}

@doc("Тип встречи не найден.")
model EventTypeNotFoundResult {
  @statusCode
  statusCode: 404;

  @body
  body: EventTypeNotFoundErrorBody;
}

@doc("Выбранный слот уже недоступен.")
model SlotUnavailableResult {
  @statusCode
  statusCode: 409;

  @body
  body: SlotUnavailableErrorBody;
}

@doc("Новый слот пересекается с существующим бронированием.")
model BookingOverlapResult {
  @statusCode
  statusCode: 409;

  @body
  body: BookingOverlapErrorBody;
}

@doc("Выбранный слот выходит за пределы окна доступности.")
model BookingOutOfRangeResult {
  @statusCode
  statusCode: 409;

  @body
  body: BookingOutOfRangeErrorBody;
}

@doc("Передан некорректный временной интервал.")
model InvalidTimeRangeResult {
  @statusCode
  statusCode: 400;

  @body
  body: InvalidTimeRangeErrorBody;
}

@doc("Список типов встреч.")
@example(#{
  items: #[
    #{
      id: "consultation",
      name: "Консультация",
      description: "Короткий созвон для обсуждения вопроса и следующих шагов.",
      durationMinutes: 30,
      createdAt: "2026-04-18T06:00:00.000Z",
      updatedAt: "2026-04-18T06:00:00.000Z"
    },
    #{
      id: "demo",
      name: "Демонстрация",
      description: "Подробная встреча с показом продукта и ответами на вопросы.",
      durationMinutes: 60,
      createdAt: "2026-04-18T06:15:00.000Z",
      updatedAt: "2026-04-18T06:15:00.000Z"
    }
  ]
})
model EventTypeListResponse {
  items: EventType[];
}

@doc("Список свободных слотов.")
@example(#{
  items: #[
    #{
      eventTypeId: "consultation",
      range: #{
        startAt: "2026-04-20T08:00:00.000Z",
        endAt: "2026-04-20T08:30:00.000Z"
      },
      isAvailable: true
    },
    #{
      eventTypeId: "consultation",
      range: #{
        startAt: "2026-04-20T09:30:00.000Z",
        endAt: "2026-04-20T10:00:00.000Z"
      },
      isAvailable: true
    },
    #{
      eventTypeId: "consultation",
      range: #{
        startAt: "2026-04-21T11:00:00.000Z",
        endAt: "2026-04-21T11:30:00.000Z"
      },
      isAvailable: true
    }
  ]
})
model SlotListResponse {
  items: Slot[];
}

@doc("Список предстоящих бронирований.")
@example(#{
  items: #[
    #{
      id: "booking-1",
      eventTypeId: "consultation",
      eventType: #{
        id: "consultation",
        name: "Консультация",
        durationMinutes: 30
      },
      guest: #{
        name: "Анна",
        email: "anna@example.com"
      },
      range: #{
        startAt: "2026-04-20T08:00:00.000Z",
        endAt: "2026-04-20T08:30:00.000Z"
      },
      status: BookingStatus.confirmed,
      createdAt: "2026-04-18T08:00:00.000Z"
    },
    #{
      id: "booking-2",
      eventTypeId: "demo",
      eventType: #{
        id: "demo",
        name: "Демонстрация",
        durationMinutes: 60
      },
      guest: #{
        name: "Иван",
        email: "ivan@example.com"
      },
      range: #{
        startAt: "2026-04-21T11:00:00.000Z",
        endAt: "2026-04-21T12:00:00.000Z"
      },
      status: BookingStatus.confirmed,
      createdAt: "2026-04-18T08:20:00.000Z"
    }
  ]
})
model BookingListResponse {
  items: Booking[];
}

@doc("Параметры запроса свободных слотов.")
model GetSlotsQuery {
  @doc("Начало периода выборки в UTC.")
  from?: UtcDateTime;

  @doc("Конец периода выборки в UTC.")
  to?: UtcDateTime;
}

@route("/event-types")
@tag("Guest")
interface GuestEventTypesApi {
  @doc("Получить список доступных типов встреч.")
  @opExample(#{
    returnType: #{
      items: #[
        #{
          id: "consultation",
          name: "Консультация",
          description: "Короткий созвон для обсуждения вопроса и следующих шагов.",
          durationMinutes: 30,
          createdAt: "2026-04-18T06:00:00.000Z",
          updatedAt: "2026-04-18T06:00:00.000Z"
        },
        #{
          id: "demo",
          name: "Демонстрация",
          description: "Подробная встреча с показом продукта и ответами на вопросы.",
          durationMinutes: 60,
          createdAt: "2026-04-18T06:15:00.000Z",
          updatedAt: "2026-04-18T06:15:00.000Z"
        }
      ]
    }
  })
  @get
  listEventTypes(): EventTypeListResponse;

  @doc("Получить один тип встречи по идентификатору.")
  @opExample(#{
    parameters: #{ eventTypeId: "consultation" },
    returnType: #{
      id: "consultation",
      name: "Консультация",
      description: "Короткий созвон для обсуждения вопроса и следующих шагов.",
      durationMinutes: 30,
      createdAt: "2026-04-18T06:00:00.000Z",
      updatedAt: "2026-04-18T06:00:00.000Z"
    }
  })
  @get
  @route("/{eventTypeId}")
  getEventType(@path eventTypeId: ResourceId): EventType | EventTypeNotFoundResult;

  @doc("Получить свободные слоты для выбранного типа встречи.")
  @opExample(#{
    parameters: #{ eventTypeId: "consultation" },
    returnType: #{
      items: #[
        #{
          eventTypeId: "consultation",
          range: #{
            startAt: "2026-04-20T08:00:00.000Z",
            endAt: "2026-04-20T08:30:00.000Z"
          },
          isAvailable: true
        },
        #{
          eventTypeId: "consultation",
          range: #{
            startAt: "2026-04-20T09:30:00.000Z",
            endAt: "2026-04-20T10:00:00.000Z"
          },
          isAvailable: true
        },
        #{
          eventTypeId: "consultation",
          range: #{
            startAt: "2026-04-21T11:00:00.000Z",
            endAt: "2026-04-21T11:30:00.000Z"
          },
          isAvailable: true
        }
      ]
    }
  })
  @get
  @route("/{eventTypeId}/slots")
  listEventTypeSlots(
    @path eventTypeId: ResourceId,
    @query query?: GetSlotsQuery
  ): SlotListResponse | EventTypeNotFoundResult;
}

@route("/bookings")
@tag("Guest")
interface GuestBookingsApi {
  @doc("Создать бронирование для выбранного слота.")
  @opExample(#{
    parameters: #{
      body: #{
        eventTypeId: "consultation",
        range: #{
          startAt: "2026-04-20T08:00:00.000Z",
          endAt: "2026-04-20T08:30:00.000Z"
        },
        guest: #{
          name: "Анна",
          email: "anna@example.com"
        }
      }
    },
    returnType: #{
      id: "booking-1",
      eventTypeId: "consultation",
      eventType: #{
        id: "consultation",
        name: "Консультация",
        durationMinutes: 30
      },
      guest: #{
        name: "Анна",
        email: "anna@example.com"
      },
      range: #{
        startAt: "2026-04-20T08:00:00.000Z",
        endAt: "2026-04-20T08:30:00.000Z"
      },
      status: BookingStatus.confirmed,
      createdAt: "2026-04-18T08:00:00.000Z"
    }
  })
  @post
  createBooking(
    @body body: CreateBookingForm
  ):
    | Booking
    | ValidationErrorResult
    | EventTypeNotFoundResult
    | SlotUnavailableResult
    | BookingOverlapResult
    | BookingOutOfRangeResult
    | InvalidTimeRangeResult;
}

@route("/owner/event-types")
@tag("Owner")
interface OwnerEventTypesApi {
  @doc("Получить список всех типов встреч для управления.")
  @opExample(#{
    returnType: #{
      items: #[
        #{
          id: "consultation",
          name: "Консультация",
          description: "Короткий созвон для обсуждения вопроса и следующих шагов.",
          durationMinutes: 30,
          createdAt: "2026-04-18T06:00:00.000Z",
          updatedAt: "2026-04-18T06:00:00.000Z"
        },
        #{
          id: "demo",
          name: "Демонстрация",
          description: "Подробная встреча с показом продукта и ответами на вопросы.",
          durationMinutes: 60,
          createdAt: "2026-04-18T06:15:00.000Z",
          updatedAt: "2026-04-18T06:15:00.000Z"
        }
      ]
    }
  })
  @get
  listOwnerEventTypes(): EventTypeListResponse;

  @doc("Создать новый тип встречи.")
  @opExample(#{
    parameters: #{
      body: #{
        name: "Пример нового типа встречи",
        description: "Статичный mock-пример для Prism во время ручной проверки frontend.",
        durationMinutes: 45
      }
    },
    returnType: #{
      id: "sample-created-event-type",
      name: "Пример нового типа встречи",
      description: "Статичный mock-пример для Prism во время ручной проверки frontend.",
      durationMinutes: 45,
      createdAt: "2026-04-18T09:00:00.000Z",
      updatedAt: "2026-04-18T09:00:00.000Z"
    }
  })
  @post
  createOwnerEventType(@body body: CreateEventTypeForm): EventType | ValidationErrorResult;

  @doc("Обновить существующий тип встречи.")
  @opExample(#{
    parameters: #{
      eventTypeId: "consultation",
      body: #{
        name: "Пример обновленного типа встречи",
        description: "Статичный mock-пример для Prism во время ручной проверки frontend.",
        durationMinutes: 30
      }
    },
    returnType: #{
      id: "consultation",
      name: "Пример обновленного типа встречи",
      description: "Статичный mock-пример для Prism во время ручной проверки frontend.",
      durationMinutes: 30,
      createdAt: "2026-04-18T06:00:00.000Z",
      updatedAt: "2026-04-18T09:30:00.000Z"
    }
  })
  @patch
  @route("/{eventTypeId}")
  updateOwnerEventType(
    @path eventTypeId: ResourceId,
    @body body: UpdateEventTypeForm
  ): EventType | ValidationErrorResult | EventTypeNotFoundResult;
}

@route("/owner/bookings")
@tag("Owner")
interface OwnerBookingsApi {
  @doc("Получить список всех предстоящих бронирований.")
  @opExample(#{
    returnType: #{
      items: #[
        #{
          id: "booking-1",
          eventTypeId: "consultation",
          eventType: #{
            id: "consultation",
            name: "Консультация",
            durationMinutes: 30
          },
          guest: #{
            name: "Анна",
            email: "anna@example.com"
          },
          range: #{
            startAt: "2026-04-20T08:00:00.000Z",
            endAt: "2026-04-20T08:30:00.000Z"
          },
          status: BookingStatus.confirmed,
          createdAt: "2026-04-18T08:00:00.000Z"
        },
        #{
          id: "booking-2",
          eventTypeId: "demo",
          eventType: #{
            id: "demo",
            name: "Демонстрация",
            durationMinutes: 60
          },
          guest: #{
            name: "Иван",
            email: "ivan@example.com"
          },
          range: #{
            startAt: "2026-04-21T11:00:00.000Z",
            endAt: "2026-04-21T12:00:00.000Z"
          },
          status: BookingStatus.confirmed,
          createdAt: "2026-04-18T08:20:00.000Z"
        }
      ]
    }
  })
  @get
  listOwnerBookings(): BookingListResponse;
}
