import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service({
  title: "API сервиса записи на звонок"
})
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

@doc("Промежуток времени: начало включительно, конец не включается.")
@doc("Инварианты: startAt должен быть раньше endAt.")
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

@doc("Снимок типа встречи на момент бронирования.")
@doc("Нужен, чтобы история бронирований не менялась при редактировании типа встречи.")
model EventTypeSnapshot {
  @doc("Идентификатор типа встречи.")
  id: ResourceId;

  @doc("Название типа встречи на момент бронирования.")
  name: EventTypeName;

  @doc("Длительность встречи в минутах на момент бронирования.")
  durationMinutes: DurationMinutes;
}

@doc("Тип встречи, который владелец публикует для записи.")
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

@doc("Свободный слот для выбранного типа встречи.")
@doc("Слот является вычисляемой моделью и не обязан храниться в базе данных.")
@doc("Слот рассчитывается на основе длительности встречи, рабочего окна 09:00-19:00, горизонта 14 дней и существующих бронирований.")
model Slot {
  @doc("Идентификатор типа встречи, для которого рассчитан слот.")
  eventTypeId: ResourceId;

  @doc("Временной интервал слота.")
  range: TimeRange;

  @doc("Признак доступности слота для бронирования.")
  isAvailable: boolean;
}

@doc("Бронирование, созданное гостем.")
@doc("Инвариант: длительность range должна совпадать с durationMinutes выбранного типа встречи.")
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
