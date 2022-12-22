import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Slot } from "./Slot";
import { GoChevronRight, GoChevronLeft } from "react-icons/go";
import styles from "./Calendar.module.css";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Melbourne");

type CalendarState = {
  currentDate: any;
  selectedSlotIndex: number | null;
  timeSlots: number[][] | null;
  headingText: string;
  offset: number;
  minOffset: number;
  maxOffset: number;
};

enum CalendarActionKind {
  MONTH_INCREMENTED = "MONTH_INCREMENTED",
  MONTH_DECREMENTED = "MONTH_DECREMENTED",
  DAY_SELECTED = "DAY_SELECTED",
  SLOT_SELECTED = "SLOT_SELECTED",
  SLOT_SELECTION_CANCELLED = "SLOT_SELECTION_CANCELLED",
}

type CalendarAction = {
  type: CalendarActionKind;
  payload?: any;
};

const initialState: CalendarState = {
  currentDate: dayjs(),
  selectedSlotIndex: null,
  timeSlots: null,
  headingText: dayjs().format("MMMM YYYY"),
  offset: 0,
  minOffset: 0,
  maxOffset: 0,
};

const reducer = (state: CalendarState, action: CalendarAction) => {
  const { type, payload } = action;

  switch (type) {
    case CalendarActionKind.MONTH_INCREMENTED: {
      const currentDate = state.currentDate.add(1, "month");
      return {
        ...state,
        currentDate,
        headingText: currentDate.format("MMMM YYYY"),
        offset: state.offset + 1,
      };
    }
    case CalendarActionKind.MONTH_DECREMENTED: {
      const currentDate = state.currentDate.subtract(1, "month");
      return {
        ...state,
        currentDate,
        headingText: currentDate.format("MMMM YYYY"),
        offset: state.offset - 1,
      };
    }
    case CalendarActionKind.DAY_SELECTED: {
      const currentDate = state.currentDate
        .startOf("month")
        .add(payload.day - 1, "day");

      const nextState = { ...state, currentDate, timeSlots: payload.slots };

      if (payload.slots) {
        nextState.headingText = currentDate.format("DD MMMM YYYY");
      }

      return nextState;
    }
    case CalendarActionKind.SLOT_SELECTED: {
      const currentDate = state.currentDate
        .startOf("day")
        .add(payload.hour, "hour")
        .add(payload.minute, "minute");
      return {
        ...state,
        selectedSlotIndex: payload.index,
        currentDate,
        headingText: currentDate.format("DD MMMM YYYY hh:mm A"),
      };
    }
    case CalendarActionKind.SLOT_SELECTION_CANCELLED: {
      return {
        ...state,
        selectedSlotIndex: null,
        timeSlots: null,
        headingText: state.currentDate.format("MMMM YYYY"),
      };
    }
    default:
      return state;
  }
};

type CalendarProps = {
  availabilities?: number[][];
  minOffset?: number;
  maxOffset?: number;
  isLoading?: boolean;
  onChangeMonth?(month: number, lastMonth: number): void;
  onSelectSlot?(year: number, month: number, date: number, hour: number, minute: number): void;
};

export const Calendar = ({
  availabilities = [],
  minOffset = 0,
  maxOffset = 0,
  isLoading = false,
  onChangeMonth,
  onSelectSlot
}: CalendarProps): JSX.Element => {
  const [state, dispatch] = React.useReducer(reducer, {
    ...initialState,
    minOffset,
    maxOffset,
  });
  
  const days: JSX.Element[] = [];
  const dayOffset = state.currentDate.startOf("month").day() - 1;
  const daysInMonth = state.currentDate.daysInMonth();

  // Avails in the form of weeks... That is Su - Sa
  // find out which day it is when pushing the Slot component
  // then add the corresponding array into times prop

  for (let i = 0; i < 6 * 7; ++i) {
    const day = i - dayOffset;

    // All days which are outside range should be blank.
    if (day <= 0 || day > daysInMonth) {
      days.push(
        <Slot key={day}>
          <span>&nbsp;</span>
        </Slot>
      );
      continue;
    }

    // All days before the current should not be available.
    if (day < dayjs().date() && dayjs().month() === state.currentDate.month()) {
      days.push(<Slot key={day} day={day} />);
      continue;
    }

    // Any days with no availabilities should be unclickable.
    if (!availabilities[day]?.length) {
      days.push(<Slot key={day} day={day} />);
      continue;
    }

    const dayOfWeek = state.currentDate
      .startOf("month")
      .add(day - 1, "day")
      .day();

    const handleClick = () => {
      dispatch({
        type: CalendarActionKind.DAY_SELECTED,
        payload: { day, slots: availabilities[day] },
      });
    };

    days.push(
      <Slot
        key={day}
        day={day}
        times={availabilities[day]}
        onClick={handleClick}
      />
    );
  }

  return (
    <>
      <div className={styles.Heading}>
        {state.offset > state.minOffset && !state.timeSlots ? (
          <button
            type="button"
            className={styles.MonthButton}
            onClick={() => {
              const month = state.currentDate.month();
              const nextMonth = month === 0 ? 11 : month - 1;
              onChangeMonth && onChangeMonth(nextMonth, month);
              dispatch({ type: CalendarActionKind.MONTH_DECREMENTED });
            }}
          >
            <GoChevronLeft />
          </button>
        ) : (
          <span></span>
        )}
        <span>{state.headingText}</span>
        {state.offset < state.maxOffset && !state.timeSlots ? (
          <button
            type="button"
            className={styles.MonthButton}
            onClick={() => {
              const month = state.currentDate.month();
              const nextMonth = month === 11 ? 0 : month + 1;
              onChangeMonth && onChangeMonth(nextMonth, month);
              dispatch({ type: CalendarActionKind.MONTH_INCREMENTED });
            }}
          >
            <GoChevronRight />
          </button>
        ) : (
          <span></span>
        )}
      </div>
      {isLoading ? (
        <div style={{ textAlign: "center" }}>Loading...</div>
      ) : (
        <>
          {state.timeSlots ? (
            <div>
              {/* NOTE: This has been changed to HH:MM:DURATION_IN_MINUTES */}
              {state.timeSlots.map((offset: string, index: number) => {
                const [hour, minute] = offset.split(":").map(x => parseInt(x, 10));

                let className = styles.TimeSlotButton;

                if (index === state.selectedSlotIndex) {
                  className += " " + styles.TimeSlotButtonSelected;
                }

                return (
                  <div key={index}>
                    <button
                      type="button"
                      className={className}
                      onClick={() => {
                        onSelectSlot && onSelectSlot(state.currentDate.get('year'), state.currentDate.get('month'), state.currentDate.get('date'), hour, minute)
                        dispatch({
                          type: CalendarActionKind.SLOT_SELECTED,
                          payload: { index, hour, minute },
                        })
                      }
                      }
                    >
                      {dayjs()
                        .startOf("day")
                        .add(hour, "hour")
                        .add(minute, "minute")
                        .format("hh:mm A")}
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className={styles.BackToCalendarButton}
                onClick={() =>
                  dispatch({
                    type: CalendarActionKind.SLOT_SELECTION_CANCELLED,
                  })
                }
              >
                <GoChevronLeft /> Back to calendar
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <Slot><span>Su</span></Slot>
              <Slot><span>Mo</span></Slot>
              <Slot><span>Tu</span></Slot>
              <Slot><span>We</span></Slot>
              <Slot><span>Th</span></Slot>
              <Slot><span>Fr</span></Slot>
              <Slot><span>Sa</span></Slot>
              {days}
            </div>
          )}
        </>
      )}
    </>
  );
};
