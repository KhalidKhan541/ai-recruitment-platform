import { useState, useMemo } from "react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "interview" | "screening" | "debrief" | "feedback" | "meeting";
  candidateName?: string;
  jobTitle?: string;
  attendees: { name: string; avatar?: string; confirmed: boolean }[];
  color?: string;
}

interface SchedulingCalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onAddEvent?: () => void;
}

type ViewMode = "month" | "week" | "day";

const eventTypeColors: Record<
  CalendarEvent["type"],
  { bg: string; border: string; text: string }
> = {
  interview: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
  },
  screening: {
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-800",
  },
  debrief: {
    bg: "bg-amber-100",
    border: "border-amber-400",
    text: "text-amber-800",
  },
  feedback: {
    bg: "bg-emerald-100",
    border: "border-emerald-400",
    text: "text-emerald-800",
  },
  meeting: {
    bg: "bg-gray-100",
    border: "border-gray-400",
    text: "text-gray-800",
  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

export function SchedulingCalendar({
  events,
  onDateClick,
  onEventClick,
  onSlotClick,
  onAddEvent,
}: SchedulingCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  const getWeekDates = (date: Date) => {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  const getEventsForHour = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => {
      if (e.date !== dateStr) return false;
      const startHour = parseInt(e.startTime.split(":")[0]);
      return startHour === hour;
    });
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const weekDates = getWeekDates(currentDate);

  const renderMonthView = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50" />
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = getEventsForDate(date);
      const isToday = isSameDay(date, today);
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      cells.push(
        <div
          key={day}
          className={`min-h-[100px] p-2 border border-gray-100 cursor-pointer hover:bg-blue-50/50 transition-colors ${
            isToday ? "bg-blue-50" : ""
          } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => {
            setSelectedDate(date);
            onDateClick?.(date);
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-sm font-medium ${
                isToday
                  ? "w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center"
                  : "text-gray-700"
              }`}
            >
              {day}
            </span>
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 3).map((event) => {
              const colors = eventTypeColors[event.type];
              return (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  className={`px-1.5 py-0.5 ${colors.bg} ${colors.text} text-[10px] rounded truncate border-l-2 ${colors.border} cursor-pointer`}
                >
                  {event.startTime} {event.candidateName || event.title}
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <p className="text-[10px] text-gray-400">
                +{dayEvents.length - 3} more
              </p>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-8 gap-0">
      <div className="border-r border-gray-200 bg-gray-50">
        <div className="h-14 border-b border-gray-200" />
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-0.5"
          >
            <span className="text-[10px] text-gray-400">
              {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
            </span>
          </div>
        ))}
      </div>
      {weekDates.map((date) => {
        const isToday = isSameDay(date, today);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return (
          <div
            key={date.toISOString()}
            className={`border-r border-gray-100 ${isWeekend ? "bg-gray-50/80" : ""}`}
          >
            <div
              className={`h-14 border-b border-gray-200 flex flex-col items-center justify-center ${
                isToday ? "bg-blue-50" : ""
              }`}
            >
              <span className="text-[10px] text-gray-400 uppercase">
                {WEEKDAYS[date.getDay()]}
              </span>
              <span
                className={`text-lg font-bold ${
                  isToday
                    ? "w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"
                    : "text-gray-900"
                }`}
              >
                {date.getDate()}
              </span>
            </div>
            <div className="relative">
              {HOURS.map((hour) => {
                const hourEvents = getEventsForHour(date, hour);
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer"
                    onClick={() => onSlotClick?.(date, hour)}
                  >
                    {hourEvents.map((event) => {
                      const colors = eventTypeColors[event.type];
                      const startMin = parseInt(event.startTime.split(":")[1]);
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          className={`absolute left-0.5 right-0.5 ${colors.bg} ${colors.text} text-[10px] rounded px-1.5 py-1 border-l-2 ${colors.border} cursor-pointer overflow-hidden`}
                          style={{
                            top: `${(startMin / 60) * 100}%`,
                            minHeight: "28px",
                          }}
                        >
                          <p className="font-medium truncate">{event.title}</p>
                          {event.candidateName && (
                            <p className="opacity-70 truncate">
                              {event.candidateName}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const dayDate = selectedDate || currentDate;
    const dayEvents = getEventsForDate(dayDate);

    return (
      <div className="grid grid-cols-8 gap-0">
        <div className="border-r border-gray-200 bg-gray-50">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-gray-400">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
              </span>
            </div>
          ))}
        </div>
        <div className="col-span-7 relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer"
              onClick={() => onSlotClick?.(dayDate, hour)}
            >
              {getEventsForHour(dayDate, hour).map((event) => {
                const colors = eventTypeColors[event.type];
                const startMin = parseInt(event.startTime.split(":")[1]);
                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={`absolute left-2 right-2 ${colors.bg} ${colors.text} text-xs rounded-lg px-3 py-2 border-l-4 ${colors.border} cursor-pointer shadow-sm`}
                    style={{ top: `${(startMin / 60) * 80}px` }}
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="opacity-70">
                      {event.startTime} – {event.endTime}
                    </p>
                    {event.candidateName && (
                      <p className="opacity-70">{event.candidateName}</p>
                    )}
                    {event.attendees.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {event.attendees.slice(0, 3).map((a, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-full text-[8px] flex items-center justify-center ${
                              a.confirmed
                                ? "bg-emerald-200 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {a.name[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">
            {viewMode === "month" && `${MONTHS[currentMonth]} ${currentYear}`}
            {viewMode === "week" &&
              `${MONTHS[weekDates[0].getMonth()]} ${weekDates[0].getDate()} – ${
                MONTHS[weekDates[6].getMonth()]
              } ${weekDates[6].getDate()}, ${weekDates[6].getFullYear()}`}
            {viewMode === "day" &&
              `${MONTHS[(selectedDate || currentDate).getMonth()]} ${
                (selectedDate || currentDate).getDate()
              }, ${(selectedDate || currentDate).getFullYear()}`}
          </h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={navigatePrev}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={navigateNext}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={onAddEvent}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Event
          </button>
        </div>
      </div>

      {viewMode === "month" && (
        <div>
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">{renderMonthView()}</div>
        </div>
      )}

      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}

      <div className="px-6 py-3 border-t border-gray-200 flex items-center gap-4">
        {Object.entries(eventTypeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`}
            />
            <span className="text-[10px] text-gray-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SchedulingCalendar;
